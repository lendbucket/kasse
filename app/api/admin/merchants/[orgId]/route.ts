import { NextResponse, type NextRequest } from "next/server";
import { prismaAdmin } from "@/lib/prismaAdmin";
import {
  requireSuperadminContext,
  tenantErrorResponse,
  type SuperadminContext,
} from "@/lib/tenant/context";
import { withAdminScope } from "@/lib/tenant/db-scope";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { orgId } = await params;

  const organization = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.organization.findUnique({
      where: { id: orgId },
      include: {
        locations: true,
        users: { select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true } },
      },
    });
  });

  if (!organization) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ organization });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { orgId } = await params;
  const data = await request.json();

  const organization = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.organization.update({
      where: { id: orgId },
      data,
    });
  });

  return NextResponse.json({ organization });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { orgId } = await params;

  await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.organization.delete({ where: { id: orgId } });
  });

  return NextResponse.json({ success: true });
}
