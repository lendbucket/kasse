import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import {
  getServerPlanContext,
  assertCanAddLocation,
  planLimitErrorResponse,
} from "@/lib/plans/api-helpers";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";
import { requirePermission, PermissionError, type PermissionSession } from "@/lib/permissions/check";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const locations = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.location.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
    });
  });

  return NextResponse.json({ locations });
}

/**
 * POST /api/locations — create a new location for the current tenant.
 *
 * Gating layers (all enforced):
 *   1. Tenant context required (requireTenantContext throws on no session)
 *   2. SETTINGS.EDIT_LOCATIONS permission required
 *   3. Plan tier limit checked — FREE orgs hard-blocked at 1 location
 *
 * Returns 402 PAYMENT_REQUIRED with structured body on plan limit:
 *   { error, code: 'LOCATION_LIMIT', currentTier, currentCount, limit, recommendedTier }
 *
 * Returns 201 with `{ location }` on success (the created Location object wrapped in a `location` key).
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

  // Permission check: must have SETTINGS.EDIT_LOCATIONS
  const ps: PermissionSession = {
    user: {
      id: ctx.userId,
      role: ctx.role,
      organizationId: ctx.organizationId,
      customRolePermissions: ctx.customRolePermissions as PermissionKey[] | undefined,
    },
  };
  try {
    requirePermission(ps, Permissions.SETTINGS.EDIT_LOCATIONS);
  } catch (e) {
    if (e instanceof PermissionError) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    throw e;
  }

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const inputName = (body as { name?: unknown })?.name;
  if (typeof inputName !== "string" || inputName.trim().length === 0) {
    return NextResponse.json(
      { error: "name is required and must be a non-empty string" },
      { status: 400 },
    );
  }
  if (inputName.length > 100) {
    return NextResponse.json(
      { error: "name must be 100 characters or less" },
      { status: 400 },
    );
  }

  const trimmedName = inputName.trim();

  // Plan limit + create — both inside the same tenant scope
  try {
    const created = await withTenantScope(prisma, ctx, async (tx) => {
      // Authoritative plan context (uses scoped tx, RLS-respecting)
      const plan = await getServerPlanContext(tx, ctx.organizationId);
      if (!plan) {
        throw new Error("ORG_NOT_FOUND");
      }

      // Hard-block if at plan limit — throws PlanLimitError caught below
      assertCanAddLocation(plan);

      // Create the location
      const location = await tx.location.create({
        data: {
          name: trimmedName,
          organizationId: ctx.organizationId,
        },
      });
      return location;
    });

    return NextResponse.json({ location: created }, { status: 201 });
  } catch (e) {
    // Plan limit hit → 402 with structured body for upgrade dialog
    const planRes = planLimitErrorResponse(e);
    if (planRes) return planRes;
    // tenant error during the scope (rare; usually caught above)
    const tenantRes = tenantErrorResponse(e);
    if (tenantRes) return tenantRes;
    // ORG_NOT_FOUND from the defensive guard
    if (e instanceof Error && e.message === "ORG_NOT_FOUND") {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }
    throw e;
  }
}
