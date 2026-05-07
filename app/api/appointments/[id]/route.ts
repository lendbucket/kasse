import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

type UpdateBody = {
  status?: "scheduled" | "completed" | "cancelled" | "no_show";
  notes?: string;
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
  if (body.status && ["scheduled", "completed", "cancelled", "no_show"].includes(body.status)) {
    data.status = body.status;
  }
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const updated = await tx.appointment.updateMany({
      where: { id, organizationId: ctx.organizationId },
      data,
    });
    if (updated.count === 0) return null;
    return tx.appointment.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ appointment: result });
}
