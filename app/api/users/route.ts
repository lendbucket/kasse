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

/**
 * GET /api/users — list users in current org (for role assignment UI).
 * Returns { id, name, email, role, customRoleId } per user.
 * Gated on SETTINGS.EDIT_ROLES.
 */
export async function GET(request: NextRequest) {
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

  const users = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.user.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true, email: true, role: true, customRoleId: true },
      orderBy: { name: "asc" },
    });
  });

  return NextResponse.json(users);
}
