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
  { params }: { params: Promise<{ clientId: string }> },
) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { clientId } = await params;

  // Read messages and mark inbound ones as read in a single transaction.
  // The withTenantScope wrapper ensures both queries run under the same tenant session vars,
  // so audit triggers fire with full context for the updateMany.
  const messages = await withTenantScope(prisma, ctx, async (tx) => {
    const list = await tx.message.findMany({
      where: { organizationId: ctx.organizationId, clientId },
      orderBy: { sentAt: "asc" },
    });

    await tx.message.updateMany({
      where: {
        organizationId: ctx.organizationId,
        clientId,
        isRead: false,
        direction: "inbound",
      },
      data: { isRead: true, readAt: new Date() },
    });

    return list;
  });

  return NextResponse.json({ messages });
}
