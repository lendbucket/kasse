import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import {
  validateTieredConfigInput,
  validatePerServiceOverridesInput,
} from "@/lib/compensation/validate";

const VALID_MODEL_TYPES = new Set(["flat", "tiered", "hourly", "salary", "booth_rent"]);

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

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const staff = await tx.staff.findFirst({
      where: { id: staffId, organizationId: ctx.organizationId },
      select: { id: true, commissionRate: true },
    });
    if (!staff) return null;

    const compensation = await tx.compensation.findUnique({
      where: { staffId },
    });

    // Get eligible services for per-service override UI
    const eligibility = await tx.stylistService.findMany({
      where: { staffId },
      select: { serviceId: true },
    });
    const eligibleIds = eligibility.map((e) => e.serviceId);

    let eligibleServices: Array<{ serviceId: string; name: string; category: string | null; basePriceCents: number }> = [];
    if (eligibleIds.length > 0) {
      const services = await tx.service.findMany({
        where: { id: { in: eligibleIds }, organizationId: ctx.organizationId },
        select: { id: true, name: true, category: true, price: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      eligibleServices = services.map((s) => ({
        serviceId: s.id,
        name: s.name,
        category: s.category,
        basePriceCents: Math.round(s.price * 100),
      }));
    }

    return {
      compensation,
      eligibleServices,
      staffDefaultRatePct: staff.commissionRate,
    };
  });

  if (result === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

type PutBody = {
  modelType: string;
  baseCommissionPct?: number | null;
  tieredConfig?: unknown;
  perServiceOverrides?: unknown;
  baseHourlyRateCents?: number | null;
  baseSalaryCentsMonthly?: number | null;
  boothRentCents?: number | null;
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

  // Validate modelType
  if (!body.modelType || !VALID_MODEL_TYPES.has(body.modelType)) {
    return NextResponse.json(
      { error: `modelType must be one of: ${[...VALID_MODEL_TYPES].join(", ")}` },
      { status: 400 },
    );
  }

  // perServiceOverrides must be an object map, not an array
  if (body.perServiceOverrides != null && Array.isArray(body.perServiceOverrides)) {
    return NextResponse.json(
      { error: "perServiceOverrides must be an object map (serviceId → override), not an array" },
      { status: 400 },
    );
  }

  // Validate baseCommissionPct
  if (body.baseCommissionPct != null) {
    if (typeof body.baseCommissionPct !== "number" || !Number.isFinite(body.baseCommissionPct) || body.baseCommissionPct < 0 || body.baseCommissionPct > 100) {
      return NextResponse.json({ error: "baseCommissionPct must be a number between 0 and 100" }, { status: 400 });
    }
  }

  // Validate tieredConfig if present
  let validatedTieredConfig: { mode: "marginal" | "whole"; bands: Array<{ thresholdCents: number; ratePct: number }> } | null = null;
  if (body.tieredConfig != null) {
    const result = validateTieredConfigInput(body.tieredConfig);
    if (!result.ok) {
      return NextResponse.json({ error: `Tiered config: ${result.error}` }, { status: 400 });
    }
    validatedTieredConfig = result.value;
  }

  const dbResult = await withTenantScope(prisma, ctx, async (tx) => {
    // 1. Verify staff in-org
    const staff = await tx.staff.findFirst({
      where: { id: staffId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!staff) return { error: "not_found" as const };

    // 2. Validate perServiceOverrides if present
    let validatedOverrides: Record<string, { type: "percent"; value: number } | { type: "flat"; valueCents: number }> | null = null;
    if (body.perServiceOverrides != null && typeof body.perServiceOverrides === "object" && Object.keys(body.perServiceOverrides as object).length > 0) {
      // Get eligible service IDs
      const eligibility = await tx.stylistService.findMany({
        where: { staffId },
        select: { serviceId: true },
      });
      const eligibleIds = new Set(eligibility.map((e) => e.serviceId));

      // Also verify all serviceIds are in this org
      const overrideServiceIds = Object.keys(body.perServiceOverrides as object);
      if (overrideServiceIds.length > 0) {
        const orgServices = await tx.service.findMany({
          where: { id: { in: overrideServiceIds }, organizationId: ctx.organizationId },
          select: { id: true },
        });
        const orgServiceIds = new Set(orgServices.map((s) => s.id));
        // Intersect: must be in org AND eligible
        const allowedIds = new Set([...eligibleIds].filter((id) => orgServiceIds.has(id)));

        const result = validatePerServiceOverridesInput(body.perServiceOverrides, allowedIds);
        if (!result.ok) {
          return { error: "validation" as const, message: `Per-service overrides: ${result.error}` };
        }
        validatedOverrides = result.value;
      }
    }

    // 3. Upsert Compensation
    // Use UTC midnight so the DATE column lands on the correct calendar day regardless of server TZ
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(`${todayStr}T00:00:00Z`);

    const data = {
      modelType: body.modelType,
      baseCommissionPct: body.baseCommissionPct ?? null,
      tieredCommissionConfig: validatedTieredConfig
        ? (validatedTieredConfig as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
      perServiceCommissionOverrides: validatedOverrides && Object.keys(validatedOverrides).length > 0
        ? (validatedOverrides as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
      baseHourlyRateCents: body.baseHourlyRateCents ?? null,
      baseSalaryCentsMonthly: body.baseSalaryCentsMonthly ?? null,
      boothRentCents: body.boothRentCents ?? null,
    };

    const compensation = await tx.compensation.upsert({
      where: { staffId },
      create: {
        staffId,
        organizationId: ctx.organizationId,
        effectiveStartDate: today,
        ...data,
      },
      update: data,
    });

    return { ok: true as const, compensation };
  });

  if (dbResult.error === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (dbResult.error === "validation") {
    return NextResponse.json({ error: dbResult.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, compensation: dbResult.compensation });
}
