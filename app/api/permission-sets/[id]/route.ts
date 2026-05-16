import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { requirePermissionSetAccess } from "@/lib/permissions/api-helpers";
import { validatePermissionSetInput } from "@/lib/permissions/validate-permission-set";
import { writeAuditLog, AuditAction, diffChangedFields } from "@/lib/audit/write";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/permission-sets/[id] — fetch a single PermissionSet (org-scoped).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const ctxOrResp = await requirePermissionSetAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const { id } = await context.params;

  const set = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.permissionSet.findUnique({ where: { id } });
  });

  // Defense-in-depth: verify org match even though RLS scopes the query
  if (!set || set.organizationId !== ctx.organizationId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(set);
}

/**
 * PATCH /api/permission-sets/[id] — update name or permissions.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const ctxOrResp = await requirePermissionSetAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const { id } = await context.params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  const { name, permissions } = body as { name?: unknown; permissions?: unknown };

  if (name === undefined && permissions === undefined) {
    return NextResponse.json({ error: "NOTHING_TO_UPDATE" }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const existing = await tx.permissionSet.findUnique({ where: { id } });

    // Defense-in-depth: verify org match even though RLS scopes the query
    if (!existing || existing.organizationId !== ctx.organizationId) {
      return { error: "NOT_FOUND" as const };
    }
    if (existing.isSystem) {
      return { error: "CANNOT_EDIT_SYSTEM_SET" as const };
    }

    const updateData: { name?: string; permissions?: string[] } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return { error: "NAME_INVALID" as const, message: "name must be non-empty string" };
      }
      if (name.length > 100) {
        return { error: "NAME_TOO_LONG" as const, message: "name must be 100 characters or less" };
      }
      // Check name uniqueness within org (exclude self)
      const duplicate = await tx.permissionSet.findFirst({
        where: { organizationId: ctx.organizationId, name: name.trim(), id: { not: id } },
      });
      if (duplicate) {
        return { error: "DUPLICATE_NAME" as const, message: "A permission set with this name already exists in this organization" };
      }
      updateData.name = name.trim();
    }

    if (permissions !== undefined) {
      const validation = validatePermissionSetInput({ name: existing.name, permissions });
      if (!validation.ok) {
        return { error: "INVALID_PERMISSIONS" as const, message: validation.error };
      }
      updateData.permissions = permissions as string[];
    }

    const updated = await tx.permissionSet.update({ where: { id }, data: updateData });
    return { ok: true as const, existing, updated };
  });

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      CANNOT_EDIT_SYSTEM_SET: 403,
      NAME_INVALID: 400,
      NAME_TOO_LONG: 400,
      DUPLICATE_NAME: 409,
      INVALID_PERMISSIONS: 400,
    };
    const status = statusMap[result.error as string] ?? 400;
    return NextResponse.json(
      { error: result.error, ...("message" in result ? { message: result.message } : {}) },
      { status },
    );
  }

  const beforeSnapshot = { name: result.existing.name, permissions: result.existing.permissions };
  const afterSnapshot = { name: result.updated.name, permissions: result.updated.permissions };
  await writeAuditLog({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    action: AuditAction.PERMISSION_SET_UPDATE,
    entity: "PermissionSet",
    entityId: id,
    before: beforeSnapshot,
    after: afterSnapshot,
    changedFields: diffChangedFields(beforeSnapshot, afterSnapshot),
    route: `/api/permission-sets/${id}`,
    request,
  });

  return NextResponse.json(result.updated);
}

/**
 * DELETE /api/permission-sets/[id] — delete a custom PermissionSet.
 * FK SET NULL on User.customRoleId handles affected users.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const ctxOrResp = await requirePermissionSetAccess(request);
  if (ctxOrResp instanceof Response) return ctxOrResp;
  const ctx = ctxOrResp;

  const { id } = await context.params;

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const existing = await tx.permissionSet.findUnique({ where: { id } });

    // Defense-in-depth: verify org match even though RLS scopes the query
    if (!existing || existing.organizationId !== ctx.organizationId) {
      return { error: "NOT_FOUND" as const };
    }
    if (existing.isSystem) {
      return { error: "CANNOT_DELETE_SYSTEM_SET" as const };
    }

    await tx.permissionSet.delete({ where: { id } });
    return { ok: true as const, existing };
  });

  if ("error" in result) {
    const status = result.error === "NOT_FOUND" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  await writeAuditLog({
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    action: AuditAction.PERMISSION_SET_DELETE,
    entity: "PermissionSet",
    entityId: id,
    before: { name: result.existing.name, permissions: result.existing.permissions },
    route: `/api/permission-sets/${id}`,
    request,
  });

  return NextResponse.json({ ok: true });
}
