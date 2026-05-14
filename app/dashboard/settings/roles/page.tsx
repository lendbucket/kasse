import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { can, type PermissionSession } from "@/lib/permissions/check";
import { Permissions } from "@/lib/permissions/types";
import { Role } from "@prisma/client";
import RolesListClient from "./RolesListClient";

export default async function RolesListPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const ps: PermissionSession = {
    user: {
      id: session.user.id,
      role: session.user.role as Role,
      organizationId: session.user.organizationId as string,
      customRolePermissions: session.user.customRolePermissions as import("@/lib/permissions/types").PermissionKey[] | undefined,
    },
  };
  if (!can(ps, Permissions.SETTINGS.EDIT_ROLES)) redirect("/dashboard");

  let sets: Array<{
    id: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    _count: { users: number };
  }> = [];

  try {
    const ctx = await requireTenantContext();
    if (ctx) {
      sets = await withTenantScope(prisma, ctx, async (tx) => {
        return tx.permissionSet.findMany({
          where: { organizationId: ctx.organizationId, isSystem: false },
          orderBy: { name: "asc" },
          include: { _count: { select: { users: true } } },
        });
      });
    }
  } catch {
    // Fall through with empty sets
  }

  const serialized = sets.map((s) => ({
    id: s.id,
    name: s.name,
    permissionCount: s.permissions.length,
    assignedUsers: s._count.users,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>SETTINGS</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Custom Roles</h1>
      </div>

      {/* Orientation banner */}
      <div style={{
        background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8,
        padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#0c4a6e",
      }}>
        This is the new custom roles page. The old view-only permissions matrix is still accessible at Settings → Permissions.
      </div>

      {/* Actions */}
      <div style={{ marginBottom: 20 }}>
        <a href="/dashboard/settings/roles/new" style={{
          display: "inline-flex", alignItems: "center", height: 36, padding: "0 16px",
          background: "#606e74", color: "white", border: "none", borderRadius: 8,
          fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "inherit",
        }}>
          + Create custom role
        </a>
      </div>

      <RolesListClient sets={serialized} />
    </div>
  );
}
