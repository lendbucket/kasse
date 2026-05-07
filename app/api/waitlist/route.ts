import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  assertStaffInTenant,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const entries = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.waitlistEntry.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    });
  });

  return NextResponse.json({ entries });
}

type WaitlistBody = {
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceName?: string;
  preferredStaffId?: string;
  preferredDate?: string;
  flexibleDates?: boolean;
  notes?: string;
};

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.preferredStaffId) {
    try {
      await assertStaffInTenant(body.preferredStaffId, ctx);
    } catch (e) {
      const r = tenantErrorResponse(e);
      if (r) return r;
      throw e;
    }
  }

  // Auto-pick first location of this tenant when none specified.
  // Acceptable for waitlist since it's tenant-scoped, not location-specific UX.
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const location = await tx.location.findFirst({
      where: { organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!location) return { error: "No location found", status: 400 } as const;

    const entry = await tx.waitlistEntry.create({
      data: {
        organizationId: ctx.organizationId,
        locationId: location.id,
        clientId: body.clientId || null,
        clientName: body.clientName || null,
        clientPhone: body.clientPhone || null,
        clientEmail: body.clientEmail || null,
        serviceName: body.serviceName || null,
        preferredStaffId: body.preferredStaffId || null,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : null,
        flexibleDates: body.flexibleDates !== false,
        notes: body.notes || null,
      },
    });
    return { entry } as const;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ entry: result.entry }, { status: 201 });
}
