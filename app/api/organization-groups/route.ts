import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { requireOrgGroupAccess } from "@/lib/permissions/api-helpers";
import { validateOrganizationGroupInput } from "@/lib/permissions/validate-organization-group";

/**
 * GET /api/organization-groups — list all groups visible to the current tenant.
 *
 * Gated on SETTINGS.EDIT_LOCATIONS (same as writes) because group hierarchy
 * is an administrative concern, not user-facing. Users in non-admin roles
 * don't have legitimate reason to inspect the structure. If a future use case
 * requires read-only access (e.g. "show me my brand's name"), introduce
 * SETTINGS.VIEW_LOCATIONS as a separate permission then.
 *
 * Uses Approach A (Option C visibility): the OrganizationGroup SELECT RLS policy
 * (P0.A.13.1) walks Location → group → parent chain via a recursive CTE, so
 * the app code can query with no WHERE filter and RLS will return only the
 * rows the current org can see (direct attachment + full ancestor chain).
 */
export async function GET(request: NextRequest) {
  const ctxOrResp = await requireOrgGroupAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const groups = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.organizationGroup.findMany({
      include: {
        parentGroup: { select: { id: true, name: true, level: true } },
        permissionSet: { select: { id: true, name: true } },
        _count: { select: { locations: true, childGroups: true } },
      },
      orderBy: { name: "asc" },
    });
  });

  return NextResponse.json(groups);
}

/**
 * POST /api/organization-groups — create a new group.
 * Validates parentGroupId and permissionSetId belong to the current tenant context.
 * Sets organizationId from the caller's session context.
 */
export async function POST(request: NextRequest) {
  const ctxOrResp = await requireOrgGroupAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  const { name, level, parentGroupId, permissionSetId } = body as Record<string, unknown>;
  const validation = validateOrganizationGroupInput({
    name,
    level,
    parentGroupId: parentGroupId ?? null,
    permissionSetId: permissionSetId ?? null,
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Validate parentGroupId is visible via RLS (caller can see it)
    if (parentGroupId) {
      const parent = await tx.organizationGroup.findUnique({
        where: { id: parentGroupId as string },
      });
      if (!parent) return { error: "PARENT_NOT_FOUND" as const };
    }

    // Validate permissionSetId belongs to current org
    if (permissionSetId) {
      const ps = await tx.permissionSet.findFirst({
        where: { id: permissionSetId as string, organizationId: ctx.organizationId },
      });
      if (!ps) return { error: "PERMISSION_SET_NOT_FOUND" as const };
    }

    const created = await tx.organizationGroup.create({
      data: {
        name: (name as string).trim(),
        level: level as "REGION" | "BRAND" | "CONCEPT",
        organizationId: ctx.organizationId,
        parentGroupId: (parentGroupId as string) || null,
        permissionSetId: (permissionSetId as string) || null,
      },
    });
    return { ok: true as const, created };
  });

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      PARENT_NOT_FOUND: 404,
      PERMISSION_SET_NOT_FOUND: 404,
    };
    const errCode = result.error as string;
    return NextResponse.json({ error: errCode }, { status: statusMap[errCode] ?? 400 });
  }

  return NextResponse.json(result.created, { status: 201 });
}
