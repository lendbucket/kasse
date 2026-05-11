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

  const result = await withAdminScope(prismaAdmin, admin, async (tx) => {
    const [totalMerchants, activeTrials, totalLocations, recentOrgs] = await Promise.all([
      tx.organization.count(),
      tx.organization.count({ where: { planStatus: "trial" } }),
      tx.location.count(),
      tx.organization.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { users: { take: 1, where: { role: "owner" }, select: { email: true } } },
      }),
    ]);
    return { totalMerchants, activeTrials, totalLocations, recentOrgs };
  });

  return NextResponse.json({
    totalMerchants: result.totalMerchants,
    activeTrials: result.activeTrials,
    mrr: 0,
    totalLocations: result.totalLocations,
    recentSignups: result.recentOrgs.map((o: any) => ({
      id: o.id,
      name: o.name,
      email: o.users[0]?.email || "",
      plan: o.plan,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
