import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  assertLocationInTenant,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import {
  requirePermission,
  PermissionError,
  type PermissionSession,
} from "@/lib/permissions/check";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const locationId = request.nextUrl.searchParams.get("locationId");
  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  try {
    await assertLocationInTenant(locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const rate = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.taxRate.findFirst({
      where: {
        organizationId: ctx.organizationId,
        locationId,
        isActive: true,
        effectiveStartDate: { lte: todayUtc },
        OR: [{ effectiveEndDate: null }, { effectiveEndDate: { gte: todayUtc } }],
      },
      orderBy: { effectiveStartDate: "desc" },
    });
  });

  if (!rate) {
    return NextResponse.json({
      ratePercent: null,
      applicableToServices: null,
      applicableToProducts: null,
    });
  }

  return NextResponse.json({
    ratePercent: rate.ratePercent,
    applicableToServices: rate.applicableToServices,
    applicableToProducts: rate.applicableToProducts,
  });
}

/**
 * POST /api/tax
 *
 * Supersedes the active TaxRate for a location: end-dates + deactivates the
 * current row, inserts a new active row effective today. This is the write path
 * the POS tax read (GET /api/tax, lib/tax/calculate.ts) depends on.
 *
 * Gated by SETTINGS.EDIT_TAX. Location verified via assertLocationInTenant.
 *
 * Concurrency note: two simultaneous POSTs could each deactivate-then-insert,
 * leaving two active rows. Acceptable for a single-owner settings action; a
 * partial unique index enforcing one active row per location is a future hardening.
 */
export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: {
    locationId?: string;
    ratePercent?: number;
    name?: string;
    applicableToServices?: boolean;
    applicableToProducts?: boolean;
    jurisdiction?: string;
    jurisdictionCode?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    locationId,
    ratePercent,
    name,
    applicableToServices,
    applicableToProducts,
    jurisdiction,
    jurisdictionCode,
    notes,
  } = body;

  if (!locationId || typeof locationId !== "string") {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  if (
    typeof ratePercent !== "number" ||
    !Number.isFinite(ratePercent) ||
    ratePercent < 0 ||
    ratePercent > 25
  ) {
    return NextResponse.json(
      { error: "ratePercent must be a number between 0 and 25" },
      { status: 400 },
    );
  }

  try {
    await assertLocationInTenant(locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const ps: PermissionSession = {
    user: {
      id: ctx.userId,
      role: ctx.role,
      organizationId: ctx.organizationId,
      customRolePermissions: ctx.customRolePermissions as PermissionKey[] | undefined,
    },
  };
  try {
    requirePermission(ps, Permissions.SETTINGS.EDIT_TAX);
  } catch (e) {
    if (e instanceof PermissionError) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    throw e;
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const created = await withTenantScope(prisma, ctx, async (tx) => {
    // Supersede: end-date + deactivate all currently active rows for this location
    await tx.taxRate.updateMany({
      where: { organizationId: ctx.organizationId, locationId, isActive: true },
      data: { isActive: false, effectiveEndDate: todayUtc },
    });

    // Insert the new active rate effective today
    return tx.taxRate.create({
      data: {
        organizationId: ctx.organizationId,
        locationId,
        name: (typeof name === "string" && name.trim()) ? name.trim() : `${ratePercent}% tax`,
        ratePercent,
        applicableToServices: applicableToServices ?? true,
        applicableToProducts: applicableToProducts ?? true,
        effectiveStartDate: todayUtc,
        effectiveEndDate: null,
        isActive: true,
        jurisdiction: jurisdiction ?? null,
        jurisdictionCode: jurisdictionCode ?? null,
        notes: notes ?? null,
      },
    });
  });

  return NextResponse.json({
    success: true,
    taxRate: {
      id: created.id,
      ratePercent: created.ratePercent,
      applicableToServices: created.applicableToServices,
      applicableToProducts: created.applicableToProducts,
      effectiveStartDate: created.effectiveStartDate,
    },
  });
}
