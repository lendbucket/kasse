import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { requireOrgGroupAccess } from "@/lib/permissions/api-helpers";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/organization-groups/[id] — fetch a single group.
 *
 * Uses Approach A (Option C visibility): RLS SELECT policy allows visibility
 * for the full chain (direct attachment + ancestors). The id match is the
 * only app-level filter; RLS returns null if the group is outside the
 * caller's visible tree.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const ctxOrResp = await requireOrgGroupAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const { id } = await context.params;

  const group = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.organizationGroup.findUnique({
      where: { id },
      include: {
        parentGroup: { select: { id: true, name: true, level: true } },
        permissionSet: { select: { id: true, name: true } },
        childGroups: { select: { id: true, name: true, level: true } },
        _count: { select: { locations: true } },
      },
    });
  });

  if (!group) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(group);
}

/**
 * PATCH /api/organization-groups/[id] — update name / level / parentGroupId / permissionSetId.
 *
 * MODIFY operations are restrictive: only groups that belong to the caller's
 * organization can be edited (checked via organizationId match). This is the
 * asymmetry with GET: SELECT is permissive (you can see what affects you via
 * the chain walk), but MODIFY is restrictive (you can only edit groups your
 * org owns).
 *
 * Validates that parentGroupId changes do not create cycles (returns 409 CYCLE_DETECTED).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const ctxOrResp = await requireOrgGroupAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const { id } = await context.params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  const { name, level, parentGroupId, permissionSetId } = body as Record<string, unknown>;

  if (name === undefined && level === undefined && parentGroupId === undefined && permissionSetId === undefined) {
    return NextResponse.json({ error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Restrictive: verify group belongs to the caller's organization
    const existing = await tx.organizationGroup.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!existing) return { error: "NOT_FOUND" as const };

    const updateData: Record<string, unknown> = {};

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return { error: "NAME_INVALID" as const };
      }
      if (name.length > 100) {
        return { error: "NAME_TOO_LONG" as const };
      }
      updateData.name = name.trim();
    }

    // Validate level
    if (level !== undefined) {
      const validLevels = ["REGION", "BRAND", "CONCEPT"];
      if (typeof level !== "string" || !validLevels.includes(level)) {
        return { error: "INVALID_LEVEL" as const };
      }
      updateData.level = level;
    }

    // Validate parentGroupId — cycle detection via recursive CTE
    if (parentGroupId !== undefined) {
      if (parentGroupId === null) {
        updateData.parentGroupId = null;
      } else if (typeof parentGroupId !== "string") {
        return { error: "INVALID_PARENT_GROUP_ID" as const };
      } else {
        if (parentGroupId === id) {
          return { error: "CYCLE_DETECTED" as const };
        }

        // Verify parent is visible via RLS
        const parent = await tx.organizationGroup.findUnique({
          where: { id: parentGroupId },
        });
        if (!parent) return { error: "PARENT_NOT_FOUND" as const };

        // Cycle detection via recursive CTE — replaces N+1 sequential findUnique walk.
        // If the proposed parent is already a descendant of this group, setting it as
        // parent would create a cycle. The CTE walks DOWN from this group and checks
        // whether the proposed parent appears anywhere in the descendant tree.
        const descendants = await tx.$queryRaw<{ id: string }[]>`
          WITH RECURSIVE descendant_chain AS (
            SELECT id, "parentGroupId"
            FROM "OrganizationGroup"
            WHERE id = ${id}
              AND "organizationId" = ${ctx.organizationId}
            UNION ALL
            SELECT og.id, og."parentGroupId"
            FROM "OrganizationGroup" og
            JOIN descendant_chain dc ON og."parentGroupId" = dc.id
            WHERE og."organizationId" = ${ctx.organizationId}
          )
          SELECT id FROM descendant_chain WHERE id = ${parentGroupId}
        `;
        if (descendants.length > 0) {
          return { error: "CYCLE_DETECTED" as const };
        }

        updateData.parentGroupId = parentGroupId;
      }
    }

    // Validate permissionSetId
    if (permissionSetId !== undefined) {
      if (permissionSetId === null) {
        updateData.permissionSetId = null;
      } else if (typeof permissionSetId !== "string") {
        return { error: "INVALID_PERMISSION_SET_ID" as const };
      } else {
        const ps = await tx.permissionSet.findFirst({
          where: { id: permissionSetId, organizationId: ctx.organizationId },
        });
        if (!ps) return { error: "PERMISSION_SET_NOT_FOUND" as const };
        updateData.permissionSetId = permissionSetId;
      }
    }

    return tx.organizationGroup.update({ where: { id }, data: updateData });
  });

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      NAME_INVALID: 400,
      NAME_TOO_LONG: 400,
      INVALID_LEVEL: 400,
      INVALID_PARENT_GROUP_ID: 400,
      CYCLE_DETECTED: 409,
      PARENT_NOT_FOUND: 404,
      INVALID_PERMISSION_SET_ID: 400,
      PERMISSION_SET_NOT_FOUND: 404,
    };
    return NextResponse.json({ error: result.error }, { status: statusMap[result.error as string] ?? 400 });
  }

  return NextResponse.json(result);
}

/**
 * DELETE /api/organization-groups/[id] — delete a group.
 *
 * MODIFY operation — restrictive: only groups belonging to the caller's
 * organization can be deleted. ON DELETE SET NULL on Location.groupId is
 * enforced by DB FK.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const ctxOrResp = await requireOrgGroupAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const { id } = await context.params;

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Restrictive: verify group belongs to the caller's organization
    const existing = await tx.organizationGroup.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!existing) return { error: "NOT_FOUND" as const };

    await tx.organizationGroup.delete({ where: { id } });
    return { ok: true as const };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
