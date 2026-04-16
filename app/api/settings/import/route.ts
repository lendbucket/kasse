import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const type = formData.get("type") as string
  const sourceSystem = formData.get("sourceSystem") as string
  const orgId = session.user.organizationId

  if (!file || !type) {
    return NextResponse.json({ error: "File and type required" }, { status: 400 })
  }

  const text = await file.text()
  const lines = text.split("\n").filter((l) => l.trim())
  if (lines.length < 2) {
    return NextResponse.json({ error: "File must have headers and at least one data row" }, { status: 400 })
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/"/g, ""))
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    return headers.reduce<Record<string, string>>((obj, header, i) => ({ ...obj, [header]: values[i] || "" }), {})
  })

  const job = await prisma.importJob.create({
    data: { organizationId: orgId, type, status: "processing", totalRows: rows.length, fileName: file.name, sourceSystem: sourceSystem || "custom" },
  })

  let successCount = 0
  let failedCount = 0
  const errors: string[] = []
  const location = await prisma.location.findFirst({ where: { organizationId: orgId } })

  if (type === "clients") {
    for (const row of rows) {
      try {
        const name = `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.name || ""
        if (!name) { failedCount++; errors.push("Row missing name"); continue }
        await prisma.client.create({
          data: {
            organizationId: orgId, locationId: location?.id, name,
            firstName: row.first_name || null, lastName: row.last_name || null,
            email: row.email || null, phone: row.phone || null, notes: row.notes || null,
          },
        })
        successCount++
      } catch { failedCount++; errors.push(`Failed: ${row.first_name} ${row.last_name}`) }
    }
  }

  if (type === "staff") {
    for (const row of rows) {
      try {
        const name = row.name || `${row.first_name || ""} ${row.last_name || ""}`.trim()
        if (!name || !location) { failedCount++; continue }
        await prisma.staff.create({
          data: {
            organizationId: orgId, locationId: location.id, name,
            email: row.email || null, phone: row.phone || null,
            role: row.role?.toLowerCase() || "stylist",
            commissionRate: parseFloat(row.commission_rate) || 40,
          },
        })
        successCount++
      } catch { failedCount++; errors.push(`Failed: ${row.name}`) }
    }
  }

  if (type === "services") {
    for (const row of rows) {
      try {
        if (!row.name) { failedCount++; continue }
        await prisma.service.create({
          data: {
            organizationId: orgId, locationId: location?.id, name: row.name,
            category: row.category || null, price: parseFloat(row.price) || 0, duration: parseInt(row.duration) || 60,
          },
        })
        successCount++
      } catch { failedCount++ }
    }
  }

  if (type === "gift_cards") {
    for (const row of rows) {
      try {
        if (!row.code || !row.balance) { failedCount++; continue }
        await prisma.giftCard.create({
          data: {
            organizationId: orgId, code: row.code,
            initialBalance: parseFloat(row.balance), balance: parseFloat(row.balance),
            expiresAt: row.expiry_date ? new Date(row.expiry_date) : null,
          },
        })
        successCount++
      } catch { failedCount++ }
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      status: "completed", processedRows: rows.length, successRows: successCount,
      failedRows: failedCount, errors: errors.length > 0 ? errors : undefined, completedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true, jobId: job.id,
    results: { total: rows.length, created: successCount, failed: failedCount, errors },
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const jobs = await prisma.importJob.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ jobs })
}
