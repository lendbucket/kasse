"use client";

import { ReactNode } from "react";
import { Role } from "@prisma/client";
import { usePermissions, type UIResourceContext } from "@/lib/permissions/use-permissions";
import type { PermissionKey } from "@/lib/permissions/types";
import { shouldGatePass } from "@/lib/permissions/gate-decision";

/**
 * Declarative UI gate based on the current session's permissions.
 *
 * Renders children only if the user has the specified permission OR role.
 * Optionally takes a `fallback` to render when the check fails.
 *
 * SECURITY: PermissionGate is a UI affordance only — hidden content is not
 * inaccessible. Server-side enforcement in API routes and middleware is the
 * only source of truth. Always validate permissions server-side regardless
 * of what UI gates do.
 *
 * Usage:
 *   <PermissionGate permission={Permissions.STAFF.INVITE}>
 *     <InviteStaffButton />
 *   </PermissionGate>
 *
 *   <PermissionGate role={Role.SUPERADMIN}>
 *     <AdminPanel />
 *   </PermissionGate>
 *
 *   <PermissionGate anyRole={[Role.OWNER, Role.MANAGER]}>
 *     <ManagerView />
 *   </PermissionGate>
 *
 *   <PermissionGate
 *     permission={Permissions.APPOINTMENTS.EDIT_OWN}
 *     resource={{ staffId: appointment.staffId }}
 *   >
 *     <EditButton />
 *   </PermissionGate>
 */

type PermissionGateProps = {
  /** Show children if user has this permission key. */
  permission?: PermissionKey;
  /** Show children if user has this exact role. */
  role?: Role;
  /** Show children if user has any of these roles. */
  anyRole?: Role[];
  /** Resource context for _own permission checks (must match resource.staffId). */
  resource?: UIResourceContext;
  /** Optional fallback rendered when check fails (default: null). */
  fallback?: ReactNode;
  /** Optional loading state rendered while session is loading. */
  loading?: ReactNode;
  /** Content to gate. */
  children: ReactNode;
};

export function PermissionGate({
  permission,
  role,
  anyRole,
  resource,
  fallback = null,
  loading = null,
  children,
}: PermissionGateProps) {
  const { role: currentRole, staffId: currentStaffId, isReady } = usePermissions();

  // While session is loading, show the loading fallback (default null)
  if (!isReady) return <>{loading}</>;

  const pass = shouldGatePass({
    permission,
    role,
    anyRole,
    resource,
    currentRole,
    currentStaffId,
  });

  return pass ? <>{children}</> : <>{fallback}</>;
}
