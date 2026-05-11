import { NextResponse, type NextRequest } from "next/server";
import { prismaAdmin } from "@/lib/prismaAdmin";
import {
  requireSuperadminContext,
  tenantErrorResponse,
  type SuperadminContext,
} from "@/lib/tenant/context";
import { withAdminScope } from "@/lib/tenant/db-scope";

export async function GET(request: NextRequest) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const users = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true, isActive: true,
        lastLoginAt: true, createdAt: true,
        organization: { select: { name: true } },
      },
    });
  });

  return NextResponse.json({ users });
}
