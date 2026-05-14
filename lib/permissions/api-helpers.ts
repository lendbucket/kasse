import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { Permissions, type PermissionKey } from "./types";
import { requirePermission, PermissionError, type PermissionSession } from "./check";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import type { NextRequest } from "next/server";

/**
 * Shared helper for permission-set API routes (P0.A.11).
 *
 * Validates tenant context + SETTINGS.EDIT_ROLES permission in one call.
 * Returns the TenantContext on success, or a NextResponse error on failure.
 */
export async function requirePermissionSetAccess(
  request?: NextRequest,
): Promise<TenantContext | Response> {
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
      customRolePermissions: ctx.customRolePermissions as PermissionKey[] | undefined,
    },
  };

  try {
    requirePermission(ps, Permissions.SETTINGS.EDIT_ROLES);
  } catch (e) {
    if (e instanceof PermissionError) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    throw e;
  }

  return ctx;
}
