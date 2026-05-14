import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { can, type PermissionSession } from "@/lib/permissions/check";
import { Permissions } from "@/lib/permissions/types";
import { Role } from "@prisma/client";
import RolesEditor from "./RolesEditor";

type PageProps = { params: Promise<{ id: string }> };

export default async function RoleEditPage({ params }: PageProps) {
  const { id } = await params;
  const isNew = id === "new";

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

  let existingSet: { id: string; name: string; permissions: string[] } | null = null;
  let assignedUsers: Array<{ id: string; name: string | null; email: string; role: string }> = [];

  if (!isNew) {
    try {
      const ctx = await requireTenantContext();
      if (ctx) {
        const result = await withTenantScope(prisma, ctx, async (tx) => {
          const set = await tx.permissionSet.findUnique({
            where: { id },
            select: { id: true, name: true, permissions: true, organizationId: true },
          });
          if (!set || set.organizationId !== ctx.organizationId) return null;
          const users = await tx.user.findMany({
            where: { customRoleId: id, organizationId: ctx.organizationId },
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: "asc" },
          });
          return { set: { id: set.id, name: set.name, permissions: set.permissions }, users };
        });
        if (!result) redirect("/dashboard/settings/roles");
        existingSet = result.set;
        assignedUsers = result.users.map((u) => ({ ...u, role: u.role as string }));
      }
    } catch {
      redirect("/dashboard/settings/roles");
    }
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
          <a href="/dashboard/settings/roles" style={{ color: "#9ca3af", textDecoration: "none" }}>CUSTOM ROLES</a> / {isNew ? "NEW" : "EDIT"}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>
          {isNew ? "Create custom role" : `Edit: ${existingSet?.name ?? ""}`}
        </h1>
      </div>

      <RolesEditor
        mode={isNew ? "create" : "edit"}
        setId={isNew ? null : id}
        initialName={existingSet?.name ?? ""}
        initialPermissions={existingSet?.permissions ?? []}
        initialAssignedUsers={assignedUsers}
      />
    </div>
  );
}
