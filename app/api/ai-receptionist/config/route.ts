import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { AI_RECEPTIONIST_ALLOWED_FIELDS, pickAllowed } from "@/lib/tenant/allowlists";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const config = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.aiReceptionistConfig.findUnique({
      where: { organizationId: ctx.organizationId },
    });
  });

  return NextResponse.json({ config });
}

export async function PATCH(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const safeUpdates = pickAllowed(body, AI_RECEPTIONIST_ALLOWED_FIELDS);
  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json(
      { error: "No allowed fields to update" },
      { status: 400 },
    );
  }

  const config = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.aiReceptionistConfig.upsert({
      where: { organizationId: ctx.organizationId },
      update: safeUpdates,
      create: { organizationId: ctx.organizationId, ...safeUpdates },
    });
  });

  return NextResponse.json({ config });
}
