import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
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

  const locations = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.location.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
    });
  });

  return NextResponse.json({ locations });
}
