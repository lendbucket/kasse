import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { step, data } = await req.json()
  const orgId = session.user.organizationId

  try {
    switch (step) {
      case 2: // Business basics
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            name: data.businessName,
            businessType: data.businessType,
            phone: data.phone,
            email: data.email,
            website: data.website,
            description: data.description,
            onboardingStep: 2,
          },
        })
        break

      case 3: // Legal & tax
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            legalName: data.legalName,
            businessStructure: data.structure,
            ein: data.ein || null,
            stateOfFormation: data.stateOfFormation || null,
            yearEstablished: data.yearEstablished ? parseInt(data.yearEstablished) : null,
            onboardingStep: 3,
          },
        })
        break

      case 4: // Location
        const existingLocation = await prisma.location.findFirst({
          where: { organizationId: orgId },
        })
        const fullAddress = data.suite ? `${data.address}, ${data.suite}` : data.address

        if (existingLocation) {
          await prisma.location.update({
            where: { id: existingLocation.id },
            data: {
              address: fullAddress,
              city: data.city,
              state: data.state,
              zip: data.zip,
              timezone: data.timezone || "America/Chicago",
              phone: data.locationPhone || data.phone,
            },
          })
        } else {
          const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } })
          await prisma.location.create({
            data: {
              organizationId: orgId,
              name: org?.name || "Main Location",
              address: fullAddress,
              city: data.city,
              state: data.state,
              zip: data.zip,
              timezone: data.timezone || "America/Chicago",
              phone: data.locationPhone || data.phone,
            },
          })
        }
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            address: fullAddress,
            city: data.city,
            state: data.state,
            zip: data.zip,
            timezone: data.timezone || "America/Chicago",
            onboardingStep: 4,
          },
        })
        break

      case 5: // Team & operations
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            teamSize: data.teamSize,
            isFranchise: data.isFranchise === "yes",
            sourceSystem: data.currentSystem !== "None (starting fresh)" ? data.currentSystem : null,
            onboardingStep: 5,
          },
        })
        break

      case 6: // Services
        if (data.services && data.services.length > 0) {
          const location = await prisma.location.findFirst({
            where: { organizationId: orgId },
          })
          for (const svc of data.services) {
            await prisma.service.create({
              data: {
                organizationId: orgId,
                locationId: location?.id,
                name: svc.name,
                category: svc.category,
                price: parseFloat(svc.price) || 0,
                duration: parseInt(svc.duration) || 60,
                isActive: true,
              },
            })
          }
        }
        await prisma.organization.update({
          where: { id: orgId },
          data: { onboardingStep: 6 },
        })
        break

      case 7: // Payment setup
        await prisma.businessSettings.upsert({
          where: { organizationId: orgId },
          create: {
            organizationId: orgId,
            taxRate: parseFloat(data.taxRate) || 8.25,
            tipPromptEnabled: data.tipsEnabled !== false,
            tipOptions: data.tipOptions || [15, 18, 20, 25],
            requireDeposit: data.requireDeposit === true,
            depositPercentage: parseFloat(data.depositPercent) || 25,
            cancellationFee: data.cancellationFee ? parseFloat(data.cancellationFeeAmount || "25") : null,
            cancellationWindow: data.cancellationFee ? parseInt(data.cancellationWindow || "24") : 24,
          },
          update: {
            taxRate: parseFloat(data.taxRate) || 8.25,
            tipPromptEnabled: data.tipsEnabled !== false,
            tipOptions: data.tipOptions || [15, 18, 20, 25],
            requireDeposit: data.requireDeposit === true,
            depositPercentage: parseFloat(data.depositPercent) || 25,
            cancellationFee: data.cancellationFee ? parseFloat(data.cancellationFeeAmount || "25") : null,
            cancellationWindow: data.cancellationFee ? parseInt(data.cancellationWindow || "24") : 24,
          },
        })

        // Create default permission sets if none exist
        const existingPerms = await prisma.permissionSet.count({ where: { organizationId: orgId } })
        if (existingPerms === 0) {
          const defaults = [
            { name: "Owner", permissions: { dashboard: true, reports: true, staff: true, clients: true, services: true, appointments: true, pos: true, settings: true, billing: true }, isDefault: true },
            { name: "Manager", permissions: { dashboard: true, reports: true, staff: true, clients: true, services: true, appointments: true, pos: true, settings: false, billing: false }, isDefault: true },
            { name: "Stylist", permissions: { dashboard: true, reports: false, staff: false, clients: true, services: false, appointments: true, pos: true, settings: false, billing: false }, isDefault: true },
            { name: "Front Desk", permissions: { dashboard: true, reports: false, staff: false, clients: true, services: false, appointments: true, pos: true, settings: false, billing: false }, isDefault: true },
            { name: "Read Only", permissions: { dashboard: true, reports: true, staff: false, clients: false, services: false, appointments: false, pos: false, settings: false, billing: false }, isDefault: true },
          ]
          for (const perm of defaults) {
            await prisma.permissionSet.create({ data: { organizationId: orgId, ...perm } })
          }
        }

        await prisma.organization.update({
          where: { id: orgId },
          data: { onboardingStep: 7 },
        })
        break

      case 8: // Complete
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            onboardingStep: 8,
            onboardingCompleted: true,
          },
        })
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding save error:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
