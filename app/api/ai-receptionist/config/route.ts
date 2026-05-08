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

  // TODO(0.5.8): Mass-assignment hazard. This handler currently writes any field
  // the caller supplies directly into AiReceptionistConfig. Fields like callsHandled
  // and callsTransferred are system counters that an org owner should not be able
  // to overwrite. 0.5.8 will introduce a field allowlist:
  //   ALLOWED = { isEnabled, voiceId, greeting, businessHours, handoffNumber,
  //               handoffEmail, capabilities }
  // For now, the auth migration is the priority; the allowlist is a focused follow-up.
  const data = await request.json();

  const config = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.aiReceptionistConfig.upsert({
      where: { organizationId: ctx.organizationId },
      update: data,
      create: { organizationId: ctx.organizationId, ...data },
    });
  });

  return NextResponse.json({ config });
}
