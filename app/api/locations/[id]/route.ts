import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, tenantErrorResponse, type TenantContext } from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";
import { requirePermission, PermissionError, type PermissionSession } from "@/lib/permissions/check";

export const dynamic = "force-dynamic";

const asStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const trimOrNull = (v: string): string | null => { const t = v.trim(); return t.length ? t.slice(0, 200) : null; };

/**
 * PATCH /api/locations/[id] — update a single location's profile fields.
 * Gated SETTINGS.EDIT_LOCATIONS. updateMany is scoped by the explicit
 * organizationId predicate (+ RLS via withTenantScope); count 0 => 404,
 * which also covers "belongs to another tenant" with no enumeration leak.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let ctx: TenantContext;
  try { ctx = await requireTenantContext(request); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const ps: PermissionSession = {
    user: { id: ctx.userId, role: ctx.role, organizationId: ctx.organizationId, customRolePermissions: ctx.customRolePermissions as PermissionKey[] | undefined },
  };
  try { requirePermission(ps, Permissions.SETTINGS.EDIT_LOCATIONS); }
  catch (e) { if (e instanceof PermissionError) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); throw e; }

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }

  const data: Prisma.LocationUpdateManyMutationInput = {};

  if ("name" in body) {
    const name = asStr(body.name)?.trim();
    if (!name) return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    if (name.length > 100) return NextResponse.json({ error: "name must be 100 characters or less" }, { status: 400 });
    data.name = name;
  }
  if ("address" in body) data.address = asStr(body.address) !== undefined ? trimOrNull(asStr(body.address)!) : null;
  if ("city" in body) data.city = asStr(body.city) !== undefined ? trimOrNull(asStr(body.city)!) : null;
  if ("state" in body) data.state = asStr(body.state) !== undefined ? trimOrNull(asStr(body.state)!) : null;
  if ("zip" in body) data.zip = asStr(body.zip) !== undefined ? trimOrNull(asStr(body.zip)!) : null;
  if ("phone" in body) data.phone = asStr(body.phone) !== undefined ? trimOrNull(asStr(body.phone)!) : null;
  if ("email" in body) data.email = asStr(body.email) !== undefined ? trimOrNull(asStr(body.email)!) : null;
  if ("timezone" in body) {
    const tz = asStr(body.timezone)?.trim();
    if (!tz) return NextResponse.json({ error: "timezone must be a non-empty string" }, { status: 400 });
    if (tz.length > 64) return NextResponse.json({ error: "timezone too long" }, { status: 400 });
    data.timezone = tz;
  }
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "no_fields_to_update" }, { status: 400 });

  const updated = await withTenantScope(prisma, ctx, async (tx) => {
    const res = await tx.location.updateMany({ where: { id, organizationId: ctx.organizationId }, data });
    if (res.count === 0) return null;
    return tx.location.findFirst({ where: { id, organizationId: ctx.organizationId } });
  });

  if (!updated) return NextResponse.json({ error: "Location not found" }, { status: 404 });
  return NextResponse.json({ location: updated });
}
