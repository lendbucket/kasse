import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyServiceBuilderFields } from "@/lib/services/fields";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

type UpdateBody = {
  name?: string;
  price?: number;
  duration?: number;
  category?: string | null;
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

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.price === "number" && body.price >= 0) data.price = body.price;
  if (typeof body.duration === "number" && body.duration > 0) data.duration = Math.round(body.duration);
  if (body.category !== undefined) data.category = body.category?.trim() || null;
  if (typeof body.locationId === "string" && body.locationId) data.locationId = body.locationId;
  if (typeof body.active === "boolean") data.isActive = body.active;

  const fieldErr = applyServiceBuilderFields(body as unknown as Record<string, unknown>, data);
  if (fieldErr) return NextResponse.json({ error: fieldErr }, { status: 400 });

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Tenant-scoped update: where clause includes organizationId so we can never modify another tenant's row.
  // updateMany returns count; if 0, the resource doesn't exist OR doesn't belong to us — same response.
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const updated = await tx.service.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data,
    });
    if (updated.count === 0) return null;
    return tx.service.findUnique({ where: { id } });
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ service: result });
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

  // Soft delete via isActive=false, scoped by tenant.
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const deleted = await tx.service.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data: { isActive: false },
    });
    return deleted.count;
  });

  if (result === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
