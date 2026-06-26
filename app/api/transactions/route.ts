import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  assertLocationInTenant,
  assertStaffInTenant,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

type TransactionBody = {
  locationId: string;
  staffId?: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  tip?: number;
  tax?: number;
  total: number;
  paymentMethod?: "cash" | "card" | "other";
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

  let body: TransactionBody;
  try {
    body = (await request.json()) as TransactionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.locationId || typeof body.amount !== "number" || typeof body.total !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let location: { id: string; organizationId: string };
  try {
    location = await assertLocationInTenant(body.locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  if (body.staffId) {
    try {
      await assertStaffInTenant(body.staffId, ctx);
    } catch (e) {
      const r = tenantErrorResponse(e);
      if (r) return r;
      throw e;
    }
  }

  const transaction = await withTenantScope(prisma, ctx, async (tx) => {
    // Verify clientId belongs to this tenant (defense-in-depth; RLS also scopes)
    let verifiedClientId: string | null = null;
    if (body.clientId) {
      const client = await tx.client.findFirst({
        where: { id: body.clientId, organizationId: location.organizationId },
        select: { id: true },
      });
      if (client) verifiedClientId = client.id;
    }

    return tx.transaction.create({
      data: {
        locationId: body.locationId,
        organizationId: location.organizationId,
        staffId: body.staffId ?? null,
        clientId: verifiedClientId,
        clientName: body.clientName ?? null,
        subtotal: body.amount,
        tip: body.tip ?? 0,
        tax: body.tax ?? 0,
        total: body.total,
        paymentMethod: body.paymentMethod ?? null,
        status: "completed",
      },
    });
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
