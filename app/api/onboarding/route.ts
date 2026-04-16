import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { businessName, businessType, phone, website, address, city, state, zip, timezone, teamSize, multiLocation, taxRate, acceptTips, tipOptions } = data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    // Update organization
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name: businessName || user.organization?.name,
        phone,
        website,
        address,
        city,
        state,
        zip,
        timezone: timezone || "America/Chicago",
      },
    })

    // Create default location
    await prisma.location.create({
      data: {
        organizationId: user.organizationId,
        name: businessName || "Main Location",
        address,
        city,
        state,
        zip,
        phone,
        timezone: timezone || "America/Chicago",
        taxRate: taxRate ? parseFloat(taxRate) : 8.25,
      },
    })

    // Update or create business settings
    await prisma.businessSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {
        taxRate: taxRate ? parseFloat(taxRate) : 8.25,
        tipPromptEnabled: acceptTips !== false,
        tipOptions: tipOptions || [15, 20, 25],
      },
      create: {
        organizationId: user.organizationId,
        taxRate: taxRate ? parseFloat(taxRate) : 8.25,
        tipPromptEnabled: acceptTips !== false,
        tipOptions: tipOptions || [15, 20, 25],
      },
    })

    // Create default permission sets
    const defaultPermissions = [
      { name: "Owner", permissions: { dashboard: true, reports: true, staff: true, clients: true, services: true, appointments: true, pos: true, settings: true, billing: true }, isDefault: true },
      { name: "Manager", permissions: { dashboard: true, reports: true, staff: true, clients: true, services: true, appointments: true, pos: true, settings: false, billing: false }, isDefault: true },
      { name: "Stylist", permissions: { dashboard: true, reports: false, staff: false, clients: true, services: false, appointments: true, pos: true, settings: false, billing: false }, isDefault: true },
      { name: "Front Desk", permissions: { dashboard: true, reports: false, staff: false, clients: true, services: false, appointments: true, pos: true, settings: false, billing: false }, isDefault: true },
      { name: "Read Only", permissions: { dashboard: true, reports: true, staff: false, clients: false, services: false, appointments: false, pos: false, settings: false, billing: false }, isDefault: true },
    ]

    for (const perm of defaultPermissions) {
      await prisma.permissionSet.create({
        data: { organizationId: user.organizationId, ...perm },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
