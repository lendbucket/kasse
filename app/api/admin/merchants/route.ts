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

  const merchants = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: { take: 1, where: { role: "owner" }, select: { email: true, name: true } },
        _count: { select: { locations: true, users: true } },
      },
    });
  });

  return NextResponse.json({ merchants });
}

export async function POST(request: NextRequest) {
  let admin: SuperadminContext;
  try {
    admin = await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const data = await request.json();
  const slug = (data.name || "org").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

  const org = await withAdminScope(prismaAdmin, admin, async (tx) => {
    return tx.organization.create({
      data: { name: data.name, slug, plan: data.plan || "starter", planStatus: data.planStatus || "trial" },
    });
  });

  return NextResponse.json({ organization: org });
}
