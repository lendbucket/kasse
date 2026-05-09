import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  assertLocationInTenant,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

type UpdateBody = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: "manager" | "stylist";
  locationId?: string;
  active?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { id } = await params;

  let body: UpdateBody;
  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // If locationId is being changed, prove the new value is in this tenant.
  // Without this, a malicious PATCH could move a staff member to another tenant's location.
  if (body.locationId) {
    try {
      await assertLocationInTenant(body.locationId, ctx);
    } catch (e) {
      const r = tenantErrorResponse(e);
      if (r) return r;
      throw e;
    }
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.role === "manager" || body.role === "stylist") data.role = body.role;
  if (typeof body.locationId === "string") data.locationId = body.locationId;
  if (typeof body.active === "boolean") data.isActive = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const updated = await tx.staff.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data,
    });
    if (updated.count === 0) return null;
    return tx.staff.findUnique({
      where: { id },
      include: { location: { select: { id: true, name: true } } },
    });
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ staff: result });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { id } = await params;

  // Soft delete — sets isActive=false, scoped by tenant.
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const updated = await tx.staff.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data: { isActive: false },
    });
    return updated.count;
  });

  if (result === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
