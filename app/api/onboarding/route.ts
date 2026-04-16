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
    const { step, data } = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    const orgId = user.organizationId

    switch (step) {
      case 2: {
        // Business Basics
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            name: data.businessName || user.organization?.name,
            businessType: data.businessType,
            phone: data.phone,
            email: data.businessEmail,
            website: data.website,
            description: data.description,
            onboardingStep: Math.max(user.organization?.onboardingStep ?? 0, 2),
          },
        })
        break
      }

      case 3: {
        // Legal & Tax
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            legalName: data.legalName,
            businessStructure: data.businessStructure,
            ein: data.ein || null,
            stateOfFormation: data.stateOfFormation,
            yearEstablished: data.yearEstablished ? parseInt(data.yearEstablished) : null,
            onboardingStep: Math.max(user.organization?.onboardingStep ?? 0, 3),
          },
        })
        break
      }

      case 4: {
        // Location
        const fullAddress = data.suite ? `${data.address}, ${data.suite}` : data.address

        // Upsert primary location
        const existingLocations = await prisma.location.findMany({
          where: { organizationId: orgId },
          take: 1,
        })

        if (existingLocations.length > 0) {
          await prisma.location.update({
            where: { id: existingLocations[0].id },
            data: {
              name: user.organization?.name || "Main Location",
              address: fullAddress,
              city: data.city,
              state: data.state,
              zip: data.zip,
              phone: data.locationPhone || data.phone,
              timezone: data.timezone || "America/Chicago",
            },
          })
        } else {
          await prisma.location.create({
            data: {
              organizationId: orgId,
              name: user.organization?.name || "Main Location",
              address: fullAddress,
              city: data.city,
              state: data.state,
              zip: data.zip,
              phone: data.locationPhone || data.phone,
              timezone: data.timezone || "America/Chicago",
            },
          })
        }

        // Also update org address
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            address: fullAddress,
            city: data.city,
            state: data.state,
            zip: data.zip,
            timezone: data.timezone || "America/Chicago",
            onboardingStep: Math.max(user.organization?.onboardingStep ?? 0, 4),
          },
        })
        break
      }

      case 5: {
        // Team & Operations
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            teamSize: data.teamSize,
            isFranchise: data.isFranchise === true,
            sourceSystem: data.sourceSystem !== "None" ? data.sourceSystem : null,
            onboardingStep: Math.max(user.organization?.onboardingStep ?? 0, 5),
          },
        })
        break
      }

      case 6: {
        // Services
        if (data.services && Array.isArray(data.services) && data.services.length > 0) {
          const locations = await prisma.location.findMany({
            where: { organizationId: orgId },
            take: 1,
          })
          const locationId = locations[0]?.id

          for (const svc of data.services) {
            await prisma.service.create({
              data: {
                organizationId: orgId,
                locationId: locationId || undefined,
                name: svc.name,
                category: svc.category,
                price: parseFloat(svc.price) || 0,
                duration: svc.duration || 45,
              },
            })
          }
        }

        await prisma.organization.update({
          where: { id: orgId },
          data: { onboardingStep: Math.max(user.organization?.onboardingStep ?? 0, 6) },
        })
        break
      }

      case 7: {
        // Payment Setup
        await prisma.businessSettings.upsert({
          where: { organizationId: orgId },
          update: {
            taxRate: data.taxRate ? parseFloat(data.taxRate) : 8.25,
            tipPromptEnabled: data.acceptTips !== false,
            tipOptions: data.tipOptions || [15, 20, 25],
            requireDeposit: data.requireDeposit === true,
            depositPercentage: data.depositAmount ? parseFloat(data.depositAmount) : 25,
            cancellationFee: data.cancellationFee ? parseFloat(data.cancellationFeeAmount || "25") : null,
            cancellationWindow: data.cancellationFee ? parseInt(data.cancellationHours || "24") : 24,
          },
          create: {
            organizationId: orgId,
            taxRate: data.taxRate ? parseFloat(data.taxRate) : 8.25,
            tipPromptEnabled: data.acceptTips !== false,
            tipOptions: data.tipOptions || [15, 20, 25],
            requireDeposit: data.requireDeposit === true,
            depositPercentage: data.depositAmount ? parseFloat(data.depositAmount) : 25,
            cancellationFee: data.cancellationFee ? parseFloat(data.cancellationFeeAmount || "25") : null,
            cancellationWindow: data.cancellationFee ? parseInt(data.cancellationHours || "24") : 24,
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

        // Mark onboarding complete
        await prisma.organization.update({
          where: { id: orgId },
          data: { onboardingStep: 8, onboardingCompleted: true },
        })
        break
      }

      default:
        break
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ error: "Failed to save onboarding data" }, { status: 500 })
  }
}
