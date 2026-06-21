import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

const VALID_SKILL_LEVELS = new Set(["junior", "stylist", "senior", "master"]);

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

  const { id: staffId } = await params;

  const eligibility = await withTenantScope(prisma, ctx, async (tx) => {
    // Verify staff belongs to this org
    const staff = await tx.staff.findFirst({
      where: { id: staffId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!staff) return null;

    return tx.stylistService.findMany({
      where: { staffId },
      select: { serviceId: true, skillLevel: true },
    });
  });

  if (eligibility === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ eligibility });
}

type PutBody = {
  items: Array<{ serviceId: string; skillLevel?: string }>;
};

export async function PUT(
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

  const { id: staffId } = await params;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  // Validate skill levels
  for (const item of body.items) {
    if (!item.serviceId || typeof item.serviceId !== "string") {
      return NextResponse.json({ error: "Each item must have a serviceId string" }, { status: 400 });
    }
    if (item.skillLevel != null && item.skillLevel !== "" && !VALID_SKILL_LEVELS.has(item.skillLevel)) {
      return NextResponse.json(
        { error: `Invalid skillLevel "${item.skillLevel}". Must be one of: junior, stylist, senior, master` },
        { status: 400 },
      );
    }
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // 1. Verify staff belongs to this org
    const staff = await tx.staff.findFirst({
      where: { id: staffId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!staff) return { error: "not_found" as const };

    // 2. Validate every serviceId belongs to this org
    const serviceIds = body.items.map((i) => i.serviceId);
    if (serviceIds.length > 0) {
      const validServices = await tx.service.findMany({
        where: { id: { in: serviceIds }, organizationId: ctx.organizationId },
        select: { id: true },
      });
      const validIds = new Set(validServices.map((s) => s.id));
      const invalid = serviceIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        return { error: "invalid_services" as const, invalid };
      }
    }

    // 3. Replace: delete all then recreate
    await tx.stylistService.deleteMany({ where: { staffId } });

    if (body.items.length > 0) {
      await tx.stylistService.createMany({
        data: body.items.map((item) => ({
          staffId,
          serviceId: item.serviceId,
          skillLevel: item.skillLevel && VALID_SKILL_LEVELS.has(item.skillLevel) ? item.skillLevel : "stylist",
        })),
      });
    }

    return { ok: true as const, count: body.items.length };
  });

  if (result.error === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.error === "invalid_services") {
    return NextResponse.json(
      { error: `Invalid serviceIds: ${result.invalid.join(", ")}` },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, count: result.count });
}
