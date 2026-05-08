import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const [org, settings] = await Promise.all([
      tx.organization.findUnique({
        where: { id: ctx.organizationId },
        include: { locations: true },
      }),
      tx.businessSettings.findUnique({
        where: { organizationId: ctx.organizationId },
      }),
    ]);
    return { org, settings };
  });

  return NextResponse.json({
    organization: result.org,
    settings: result.settings,
  });
}

type PatchBody = {
  organizationUpdates?: Record<string, unknown>;
  settingsUpdates?: Record<string, unknown>;
};

export async function PATCH(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.organizationUpdates && !body.settingsUpdates) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  // TODO(0.5.8): Mass-assignment hazard. organizationUpdates and settingsUpdates
  // are passed directly to Prisma. Organization has 28 sensitive fields that an
  // org owner must NEVER be able to overwrite via this endpoint:
  //   plan, planStatus, trialEndsAt, stripeCustomerId, stripeSubId, salonTransactId,
  //   isFranchise, franchiseFeeType, franchiseFeeValue, techFeeType, techFeeValue,
  //   marketingFeeType, marketingFeeValue, parentOrgId, applicationStatus,
  //   applicationSubmittedAt, onboardingStep, onboardingCompleted,
  //   ein, ownerSsnLast4, bankRoutingNumber, bankAccountNumber, bankAccountHolder,
  //   bankAccountType, sourceSystem, slug, createdAt, updatedAt
  // 0.5.8 will introduce field allowlists for both Organization and BusinessSettings.
  // Until then this endpoint trusts the caller, which is acceptable while ceo@36west.org
  // is the only logged-in user. DO NOT advertise this endpoint to additional accounts
  // until 0.5.8 ships.

  // Both writes run in a single transaction. If either fails, neither is persisted.
  await withTenantScope(prisma, ctx, async (tx) => {
    if (body.organizationUpdates) {
      await tx.organization.update({
        where: { id: ctx.organizationId },
        data: body.organizationUpdates,
      });
    }
    if (body.settingsUpdates) {
      await tx.businessSettings.upsert({
        where: { organizationId: ctx.organizationId },
        update: body.settingsUpdates,
        create: { organizationId: ctx.organizationId, ...body.settingsUpdates },
      });
    }
  });

  return NextResponse.json({ success: true });
}
