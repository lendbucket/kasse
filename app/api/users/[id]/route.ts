import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { Permissions } from "@/lib/permissions/types";
import { requirePermission, PermissionError, type PermissionSession } from "@/lib/permissions/check";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { writeAuditLog, AuditAction } from "@/lib/audit/write";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/users/[id] — update user's customRoleId.
 * Accepts { customRoleId: string | null }.
 * Validates target PermissionSet belongs to same org (defense-in-depth).
 * Gated on SETTINGS.EDIT_ROLES.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  if (!ctx.organizationId) {
    return NextResponse.json({ error: "ORG_CONTEXT_REQUIRED" }, { status: 400 });
  }

  const ps: PermissionSession = {
    user: {
      id: ctx.userId,
      role: ctx.role,
      organizationId: ctx.organizationId,
      customRolePermissions: ctx.customRolePermissions as import("@/lib/permissions/types").PermissionKey[] | undefined,
    },
  };
  try { requirePermission(ps, Permissions.SETTINGS.EDIT_ROLES); }
  catch (e) {
    if (e instanceof PermissionError) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    throw e;
  }

  const { id } = await context.params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  const { customRoleId } = body as { customRoleId?: string | null };
  if (customRoleId === undefined) {
    return NextResponse.json({ error: "customRoleId is required (string or null)" }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Verify target user belongs to this org
    const user = await tx.user.findUnique({
      where: { id },
      select: { id: true, organizationId: true, customRoleId: true },
    });
    if (!user || user.organizationId !== ctx.organizationId) {
      return { error: "USER_NOT_FOUND" as const };
    }

    // If assigning (not clearing), verify the PermissionSet belongs to this org
    if (customRoleId !== null) {
      const targetSet = await tx.permissionSet.findUnique({
        where: { id: customRoleId },
        select: { organizationId: true },
      });
      if (!targetSet || targetSet.organizationId !== ctx.organizationId) {
        return { error: "PERMISSION_SET_NOT_FOUND" as const };
      }
    }

    const oldCustomRoleId = user.customRoleId;
    const updated = await tx.user.update({
      where: { id },
      data: { customRoleId },
      select: { id: true, name: true, email: true, role: true, customRoleId: true },
    });
    return { ok: true as const, user: updated, oldCustomRoleId };
  });

  if ("error" in result) {
    const status = result.error === "USER_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const oldCustomRoleId = result.oldCustomRoleId;
  const newCustomRoleId = customRoleId;
  if (oldCustomRoleId === null && newCustomRoleId !== null) {
    await writeAuditLog({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      action: AuditAction.USER_CUSTOM_ROLE_ASSIGN,
      entity: "User",
      entityId: id,
      after: { customRoleId: newCustomRoleId },
      metadata: { targetUserId: id, customRoleId: newCustomRoleId },
      route: `/api/users/${id}`,
      request,
    });
  } else if (oldCustomRoleId !== null && newCustomRoleId === null) {
    await writeAuditLog({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      action: AuditAction.USER_CUSTOM_ROLE_UNASSIGN,
      entity: "User",
      entityId: id,
      before: { customRoleId: oldCustomRoleId },
      metadata: { targetUserId: id, previousCustomRoleId: oldCustomRoleId },
      route: `/api/users/${id}`,
      request,
    });
  } else if (oldCustomRoleId !== newCustomRoleId) {
    await writeAuditLog({
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      action: AuditAction.USER_CUSTOM_ROLE_ASSIGN,
      entity: "User",
      entityId: id,
      before: { customRoleId: oldCustomRoleId },
      after: { customRoleId: newCustomRoleId },
      changedFields: ["customRoleId"],
      metadata: { targetUserId: id },
      route: `/api/users/${id}`,
      request,
    });
  }

  return NextResponse.json(result.user);
}
