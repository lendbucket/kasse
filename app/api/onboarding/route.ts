import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import {
  ORGANIZATION_ONBOARDING_ALLOWED_FIELDS,
  pickAllowed,
} from "@/lib/tenant/allowlists";

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: { step: number; data: Record<string, any> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { step, data } = body;

  if (typeof step !== "number" || step < 2 || step > 9 || !Number.isInteger(step)) {
    return NextResponse.json(
      { error: "Invalid step value. Must be an integer 2 through 9." },
      { status: 400 },
    );
  }

  try {
    switch (step) {
      case 2: {
        const safe = pickAllowed(
          {
            name: data.businessName,
            businessType: data.businessType,
            phone: data.phone,
            email: data.email,
            website: data.website,
            description: data.description,
            onboardingStep: 2,
          },
          ORGANIZATION_ONBOARDING_ALLOWED_FIELDS,
        );
        await withTenantScope(prisma, ctx, async (tx) => {
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: safe,
          });
        });
        break;
      }

      case 3: {
        const safe = pickAllowed(
          {
            legalName: data.legalName,
            businessStructure: data.structure,
            ein: data.ein || null,
            stateOfFormation: data.stateOfFormation || null,
            yearEstablished: data.yearEstablished ? parseInt(data.yearEstablished) : null,
            onboardingStep: 3,
          },
          ORGANIZATION_ONBOARDING_ALLOWED_FIELDS,
        );
        await withTenantScope(prisma, ctx, async (tx) => {
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: safe,
          });
        });
        break;
      }

      case 4: {
        await withTenantScope(prisma, ctx, async (tx) => {
          const existingLocation = await tx.location.findFirst({
            where: { organizationId: ctx.organizationId },
          });
          const fullAddress = data.suite ? `${data.address}, ${data.suite}` : data.address;

          if (existingLocation) {
            await tx.location.update({
              where: { id: existingLocation.id },
              data: {
                address: fullAddress,
                city: data.city,
                state: data.state,
                zip: data.zip,
                timezone: data.timezone || "America/Chicago",
                phone: data.phone,
              },
            });
          } else {
            const org = await tx.organization.findUnique({
              where: { id: ctx.organizationId },
              select: { name: true },
            });
            await tx.location.create({
              data: {
                organizationId: ctx.organizationId,
                name: org?.name || "Main Location",
                address: fullAddress,
                city: data.city,
                state: data.state,
                zip: data.zip,
                timezone: data.timezone || "America/Chicago",
                phone: data.phone,
              },
            });
          }

          const safe = pickAllowed(
            {
              address: fullAddress,
              city: data.city,
              state: data.state,
              zip: data.zip,
              timezone: data.timezone || "America/Chicago",
              onboardingStep: 4,
            },
            ORGANIZATION_ONBOARDING_ALLOWED_FIELDS,
          );
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: safe,
          });
        });
        break;
      }

      case 5: {
        const safe = pickAllowed(
          {
            teamSize: data.teamSize,
            isFranchise: data.isFranchise === "yes",
            sourceSystem: data.currentSystem !== "None (starting fresh)" ? data.currentSystem : null,
            onboardingStep: 5,
          },
          ORGANIZATION_ONBOARDING_ALLOWED_FIELDS,
        );
        await withTenantScope(prisma, ctx, async (tx) => {
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: safe,
          });
        });
        break;
      }

      case 6: {
        await withTenantScope(prisma, ctx, async (tx) => {
          if (data.services && data.services.length > 0) {
            const location = await tx.location.findFirst({
              where: { organizationId: ctx.organizationId },
            });
            await tx.service.createMany({
              data: data.services.map((svc: { name: string; category?: string; price?: string; duration?: string }) => ({
                organizationId: ctx.organizationId,
                locationId: location?.id,
                name: svc.name,
                category: svc.category || null,
                price: parseFloat(svc.price ?? "0") || 0,
                duration: parseInt(svc.duration ?? "60") || 60,
                isActive: true,
              })),
            });
          }
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: { onboardingStep: 6 },
          });
        });
        break;
      }

      case 7: {
        await withTenantScope(prisma, ctx, async (tx) => {
          await tx.businessSettings.upsert({
            where: { organizationId: ctx.organizationId },
            create: {
              organizationId: ctx.organizationId,
              taxRate: parseFloat(data.taxRate) || 8.25,
              tipPromptEnabled: data.tipsEnabled !== false,
              tipOptions: data.tipOptions || [15, 18, 20, 25],
              requireDeposit: data.requireDeposit === true,
              depositPercentage: parseFloat(data.depositPercent) || 25,
            },
            update: {
              taxRate: parseFloat(data.taxRate) || 8.25,
              tipPromptEnabled: data.tipsEnabled !== false,
              tipOptions: data.tipOptions || [15, 18, 20, 25],
              requireDeposit: data.requireDeposit === true,
              depositPercentage: parseFloat(data.depositPercent) || 25,
            },
          });
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: { onboardingStep: 7 },
          });
        });
        break;
      }

      case 8: {
        await withTenantScope(prisma, ctx, async (tx) => {
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: { onboardingStep: 8 },
          });
        });
        break;
      }

      case 9: {
        await withTenantScope(prisma, ctx, async (tx) => {
          const existingPerms = await tx.permissionSet.count({
            where: { organizationId: ctx.organizationId },
          });
          // P0.A.6: Org-scoped permission sets removed from onboarding.
          // System defaults (organizationId: null) are seeded via
          // prisma/seed-permission-sets.ts. Custom per-org sets land in P0.A.11.
          // Legacy existingPerms count check retained as no-op until then.
          void existingPerms;
          await tx.organization.update({
            where: { id: ctx.organizationId },
            data: { onboardingStep: 9, onboardingCompleted: true },
          });
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding save error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
