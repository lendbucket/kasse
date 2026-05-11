import { NextResponse, type NextRequest } from "next/server";
import { prismaAdmin } from "@/lib/prismaAdmin";
import bcrypt from "bcryptjs";
import {
  requireSuperadminContext,
  tenantErrorResponse,
  type SuperadminContext,
} from "@/lib/tenant/context";
import { withAdminScope } from "@/lib/tenant/db-scope";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { userId } = await params;
  const data = await request.json();
  const updateData: Record<string, any> = {};

  if (typeof data.isActive === "boolean") updateData.isActive = data.isActive;
  if (data.resetPassword) {
    updateData.password = await bcrypt.hash(data.resetPassword, 12);
    updateData.passwordResetToken = null;
    updateData.passwordResetExp = null;
  }

  const user = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.user.update({
      where: { id: userId },
      data: updateData,
    });
  });

  return NextResponse.json({ user: { id: user.id, isActive: user.isActive } });
}
