import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

// Per-stylist price/duration overrides for a service.
// ServiceStaffOverride has no organizationId column; its RLS policy (USING +
// WITH CHECK) joins through Service.organizationId = app.current_org_id. Running
// everything inside withTenantScope keeps reads filtered to in-org rows and
// blocks writing a row whose parent service isn't in the caller's org. The
// explicit service + staff org checks below turn a silent empty result into a
// clean 404/400, and the delete+create replace-all is atomic in the scope tx.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: TenantContext;
  try { ctx = await requireTenantContext(request); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const { id } = await params;
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const svc = await tx.service.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
    if (!svc) return null;
    return tx.serviceStaffOverride.findMany({
      where: { serviceId: id },
      select: { staffId: true, priceCents: true, durationMinutes: true },
    });
  });

  if (result === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ overrides: result });
}

type PutBody = { overrides?: { staffId?: unknown; priceCents?: unknown; durationMinutes?: unknown }[] };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: TenantContext;
  try { ctx = await requireTenantContext(request); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const { id } = await params;

  let body: PutBody;
  try { body = (await request.json()) as PutBody; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!Array.isArray(body.overrides)) {
    return NextResponse.json({ error: "overrides must be an array" }, { status: 400 });
  }

  // Validate + dedupe by staffId (last wins); drop fully-empty rows.
  const byStaff = new Map<string, { priceCents: number | null; durationMinutes: number | null }>();
  for (const o of body.overrides) {
    if (typeof o?.staffId !== "string" || !o.staffId) {
      return NextResponse.json({ error: "each override needs a staffId" }, { status: 400 });
    }
    let priceCents: number | null = null;
    if (o.priceCents !== null && o.priceCents !== undefined) {
      if (typeof o.priceCents !== "number" || !Number.isInteger(o.priceCents) || o.priceCents < 0) {
        return NextResponse.json({ error: "priceCents must be a non-negative integer or null" }, { status: 400 });
      }
      priceCents = o.priceCents;
    }
    let durationMinutes: number | null = null;
    if (o.durationMinutes !== null && o.durationMinutes !== undefined) {
      if (typeof o.durationMinutes !== "number" || !Number.isInteger(o.durationMinutes) || o.durationMinutes <= 0) {
        return NextResponse.json({ error: "durationMinutes must be a positive integer or null" }, { status: 400 });
      }
      durationMinutes = o.durationMinutes;
    }
    if (priceCents === null && durationMinutes === null) continue;
    byStaff.set(o.staffId, { priceCents, durationMinutes });
  }
  const staffIds = [...byStaff.keys()];

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const svc = await tx.service.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
    if (!svc) return { error: "Not found" as const, status: 404 };

    if (staffIds.length > 0) {
      const valid = await tx.staff.findMany({ where: { id: { in: staffIds }, organizationId: ctx.organizationId }, select: { id: true } });
      if (valid.length !== staffIds.length) {
        return { error: "one or more stylists are not in this organization" as const, status: 400 };
      }
    }

    await tx.serviceStaffOverride.deleteMany({ where: { serviceId: id } });
    if (staffIds.length > 0) {
      await tx.serviceStaffOverride.createMany({
        data: staffIds.map((staffId) => ({
          serviceId: id,
          staffId,
          priceCents: byStaff.get(staffId)!.priceCents,
          durationMinutes: byStaff.get(staffId)!.durationMinutes,
        })),
      });
    }
    const overrides = await tx.serviceStaffOverride.findMany({
      where: { serviceId: id },
      select: { staffId: true, priceCents: true, durationMinutes: true },
    });
    return { overrides };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ overrides: result.overrides });
}
