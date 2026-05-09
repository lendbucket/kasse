import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

export async function GET(
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

  // Multi-query read all inside a single tenant scope. Both queries scope by
  // organizationId so a client ID from another tenant returns 404, never data.
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const client = await tx.client.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        appointments: {
          orderBy: { startTime: "desc" },
          take: 10,
          include: {
            staff: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!client) return null;

    const aggregate = await tx.appointment.aggregate({
      where: {
        clientId: id,
        organizationId: ctx.organizationId,
        status: "completed",
      },
      _sum: { price: true },
      _count: true,
    });

    return { client, aggregate };
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    client: result.client,
    totalSpent: result.aggregate._sum.price ?? 0,
    completedVisits: result.aggregate._count,
  });
}

type UpdateBody = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
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
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Tenant-scoped update via updateMany — returns count, never the row.
  // If count === 0 the client either doesn't exist or belongs to another tenant
  // (same response either way to prevent ID enumeration).
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const updated = await tx.client.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data,
    });
    if (updated.count === 0) return null;
    return tx.client.findUnique({ where: { id } });
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ client: result });
}
