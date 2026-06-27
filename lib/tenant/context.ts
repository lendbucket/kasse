import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prismaAdmin";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";

export type TenantRole = Role;

export interface TenantContext {
  userId: string;
  email: string;
  name: string | null;
  role: TenantRole;
  organizationId: string;
  locationId: string | null;
  isSuperadmin: boolean;
  customRolePermissions?: string[];  // P0.A.11: from User.customRoleId → PermissionSet
  request?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
    route?: string;
  };
}

export class TenantContextError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "NO_TENANT" | "INACTIVE" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "TenantContextError";
  }
}

/**
 * Extracts HTTP request context for audit logging.
 * Safe to call with no req (returns undefined). Safe to call with a req that
 * is missing some headers (returns whatever it can get).
 */
function extractRequestContext(req: NextRequest | undefined): TenantContext["request"] {
  if (!req) return undefined;

  // IP: prefer the first hop in x-forwarded-for (set by Vercel and most CDNs),
  // fall back to x-real-ip, then cf-connecting-ip (Cloudflare).
  const xff = req.headers.get("x-forwarded-for");
  const ip =
    (xff ? xff.split(",")[0]?.trim() : null) ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    undefined;

  const userAgent = req.headers.get("user-agent") ?? undefined;

  // Request ID: Vercel sets x-vercel-id in production; allow x-request-id from upstream.
  // No fallback generation here — we'd rather have a NULL than a fake correlation id.
  const requestId =
    req.headers.get("x-vercel-id") ??
    req.headers.get("x-request-id") ??
    undefined;

  const route = req.nextUrl?.pathname ?? undefined;

  // Only return an object if we have at least one field; otherwise return undefined.
  if (!ip && !userAgent && !requestId && !route) return undefined;

  return { ip, userAgent, requestId, route };
}

/**
 * Returns the tenant context for the current request, or null if unauthenticated.
 * Does NOT throw. Use this when an unauthenticated state is acceptable.
 */
export async function getTenantContext(req?: NextRequest): Promise<TenantContext | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const role = session.user.role ?? Role.STAFF;
  const isSuperadmin = role === Role.SUPERADMIN;

  if (!session.user.organizationId && !isSuperadmin) return null;

  const request = extractRequestContext(req);
  const customRolePermissions = (session.user as { customRolePermissions?: string[] }).customRolePermissions;
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role,
    organizationId: session.user.organizationId ?? "",
    locationId: session.user.locationId ?? null,
    isSuperadmin,
    ...(customRolePermissions ? { customRolePermissions } : {}),
    ...(request ? { request } : {}),
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
 *
 * Uses prismaAdmin (RLS bypass) ON PURPOSE: this runs OUTSIDE withTenantScope, so the
 * app.current_org_id RLS variable is not set. The RLS-restricted `prisma` client would
 * return ZERO rows here and every check would wrongly throw "Location not found". Tenant
 * isolation is preserved by the explicit organizationId predicate below (superadmin is
 * intentionally cross-tenant). Same documented pattern as lib/permissions/resolve-hierarchy.ts.
 */
export async function assertLocationInTenant(
  locationId: string,
  ctx: TenantContext,
): Promise<{ id: string; organizationId: string }> {
  if (ctx.isSuperadmin) {
    const loc = await prismaAdmin.location.findUnique({
      where: { id: locationId },
      select: { id: true, organizationId: true },
    });
    if (!loc) throw new TenantContextError("NO_TENANT", "Location not found");
    return loc;
  }

  const loc = await prismaAdmin.location.findFirst({
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
 * Verifies that a given staffId belongs to the current tenant.
 * Same shape as assertLocationInTenant — superadmin bypasses, all others must match organizationId.
 * Returns minimal staff record. Throws TenantContextError on mismatch or missing.
 */
export async function assertStaffInTenant(
  staffId: string,
  ctx: TenantContext,
): Promise<{ id: string; organizationId: string; locationId: string | null }> {
  if (ctx.isSuperadmin) {
    const staff = await prismaAdmin.staff.findUnique({
      where: { id: staffId },
      select: { id: true, organizationId: true, locationId: true },
    });
    if (!staff) throw new TenantContextError("NO_TENANT", "Staff not found");
    return staff;
  }

  const staff = await prismaAdmin.staff.findFirst({
    where: { id: staffId, organizationId: ctx.organizationId },
    select: { id: true, organizationId: true, locationId: true },
  });
  if (!staff) {
    throw new TenantContextError("NO_TENANT", "Staff not found");
  }
  return staff;
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
  const status = e.code === "UNAUTHENTICATED" ? 401 : 403;
  return new Response(JSON.stringify({ error: e.message, code: e.code }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Context for SUPERADMIN routes (Command Center under /api/admin/*).
 *
 * Returns the actor's identity for audit logging, but does NOT carry a tenant
 * scope. Admin routes operate across all tenants by design.
 */
export interface SuperadminContext {
  userId: string;
  email: string;
  name: string | null;
  request?: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
    route?: string;
  };
}

/**
 * Verifies the caller is an authenticated superadmin. Throws TenantContextError
 * with UNAUTHENTICATED if no session, or with FORBIDDEN if the session
 * exists but the user is not a superadmin.
 *
 * Used by every /api/admin/* route as the first line of every handler.
 */
export async function requireSuperadminContext(
  req?: NextRequest,
): Promise<SuperadminContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new TenantContextError("UNAUTHENTICATED", "No active session");
  }

  if (session.user.role !== Role.SUPERADMIN) {
    throw new TenantContextError("FORBIDDEN", "Superadmin role required");
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    request: req ? extractRequestContext(req) : undefined,
  };
}
