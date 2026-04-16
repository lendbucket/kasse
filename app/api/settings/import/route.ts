import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const type = formData.get("type") as string
    const sourceSystem = formData.get("sourceSystem") as string

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 })
    }

    const job = await prisma.importJob.create({
      data: {
        organizationId: session.user.organizationId,
        type,
        status: "pending",
        fileName: file.name,
        sourceSystem: sourceSystem || "custom",
      },
    })

    // In a production app, this would queue a background job
    // For now, mark as processing
    await prisma.importJob.update({
      where: { id: job.id },
      data: { status: "processing" },
    })

    return NextResponse.json({ jobId: job.id, status: "processing" })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
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
