import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export type TenantRole = "superadmin" | "owner" | "manager" | "staff";

export interface TenantContext {
  userId: string;
  email: string;
  name: string | null;
  role: TenantRole;
  organizationId: string;
  locationId: string | null;
  isSuperadmin: boolean;
  request?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
    route?: string;
  };
}

export class TenantContextError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "NO_TENANT" | "INACTIVE", message: string) {
    super(message);
    this.name = "TenantContextError";
  }
}

/**
 * Returns the tenant context for the current request, or null if unauthenticated.
 * Does NOT throw. Use this when an unauthenticated state is acceptable.
 */
export async function getTenantContext(_req?: NextRequest): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const role = (session.user.role ?? "staff") as TenantRole;
  const isSuperadmin = role === "superadmin";

  if (!session.user.organizationId && !isSuperadmin) return null;

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role,
    organizationId: session.user.organizationId ?? "",
    locationId: session.user.locationId ?? null,
    isSuperadmin,
  };
}

/**
 * Returns the tenant context or throws TenantContextError.
 * Use this in API routes. Catch TenantContextError and return the matching HTTP status.
 */
export async function requireTenantContext(req?: NextRequest): Promise<TenantContext> {
  const ctx = await getTenantContext(req);
  if (!ctx) throw new TenantContextError("UNAUTHENTICATED", "Authentication required");
  if (!ctx.organizationId && !ctx.isSuperadmin) {
    throw new TenantContextError("NO_TENANT", "User has no organization assigned");
  }
  return ctx;
}

/**
 * Verifies that a given locationId belongs to the current tenant.
 * Superadmin bypasses this check. All other roles must match organizationId.
 * Throws TenantContextError if the location does not belong to the tenant or does not exist.
 *
 * USE THIS IN EVERY ROUTE THAT ACCEPTS A locationId FROM USER INPUT.
 */
export async function assertLocationInTenant(
  locationId: string,
  ctx: TenantContext,
): Promise<{ id: string; organizationId: string }> {
  if (ctx.isSuperadmin) {
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, organizationId: true },
    });
    if (!loc) throw new TenantContextError("NO_TENANT", "Location not found");
    return loc;
  }

  const loc = await prisma.location.findFirst({
    where: { id: locationId, organizationId: ctx.organizationId },
    select: { id: true, organizationId: true },
  });
  if (!loc) {
    // Treat "wrong tenant" and "doesn't exist" identically to prevent enumeration attacks.
    throw new TenantContextError("NO_TENANT", "Location not found");
  }
  return loc;
}

/**
 * Standard HTTP response builder for TenantContextError.
 * Returns null if the error is not a TenantContextError.
 *
 * Usage:
 *   try { const ctx = await requireTenantContext(req); ... }
 *   catch (e) {
 *     const r = tenantErrorResponse(e); if (r) return r;
 *     throw e;
 *   }
 */
export function tenantErrorResponse(e: unknown): Response | null {
  if (!(e instanceof TenantContextError)) return null;
  const status = e.code === "UNAUTHENTICATED" ? 401 : e.code === "INACTIVE" ? 403 : 403;
  return new Response(JSON.stringify({ error: e.message, code: e.code }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
