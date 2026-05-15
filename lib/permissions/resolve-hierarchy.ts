/**
 * P0.A.13: Multi-level permission resolution through organization group hierarchy.
 *
 * Resolution chain (most-specific wins; first non-empty result returned):
 *
 *   1. User.customRoleId — directly assigned custom set (P0.A.11)
 *   2. Location.group.permissionSet — set attached to the leaf group
 *   3. parent group.permissionSet — walked up via parentGroupId
 *   4. ... continuing all the way to root group
 *   5. roleDefaults[role] — fallback for users in orgs with no group
 *      attachment OR groups with no permissionSet at any level
 *
 * Cycle protection: caps the chain walk at 10 levels.
 *
 * I/O is separated from the algorithm: resolveEffectivePermissionsFromMaps
 * is the pure, testable function. resolveEffectivePermissions is the live
 * wrapper that fetches data from Prisma then delegates to the pure function.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.13
 */
import { Role } from "@prisma/client";
import { prismaAdmin } from "@/lib/prismaAdmin";
import { roleDefaults } from "./defaults";
import type { PermissionKey } from "./types";

const MAX_DEPTH = 10;

// ── Pure algorithm (testable without DB) ────────────────────────────────

export type GroupData = {
  permissionSetId: string | null;
  parentGroupId: string | null;
};

export type PermissionSetData = {
  permissions: string[];
};

export type HierarchyMaps = {
  userCustomRoleId: string | null;
  locationGroupId: string | null;
  organizationId: string;
  groups: Map<string, GroupData>;
  permissionSets: Map<string, PermissionSetData>;
};

/**
 * Pure permission resolution from pre-fetched data maps.
 * No I/O — safe to call in unit tests with mock data.
 *
 * The maps are expected to be pre-scoped to the caller's organization.
 * The organizationId field is carried for contract symmetry with the
 * live wrapper but is not used for filtering here (the maps are already
 * tenant-scoped by the time they reach this function).
 */
export function resolveEffectivePermissionsFromMaps(
  role: Role,
  maps: HierarchyMaps,
): PermissionKey[] {
  // SUPERADMIN bypasses everything
  if (role === Role.SUPERADMIN) {
    return []; // empty signals "bypass" — can() short-circuits on role check
  }

  // Step 1: User-level custom role override
  if (maps.userCustomRoleId) {
    const customSet = maps.permissionSets.get(maps.userCustomRoleId);
    if (customSet) return customSet.permissions as PermissionKey[];
  }

  // Step 2-4: Walk the location → group → parent chain
  if (maps.locationGroupId) {
    let currentGroupId: string | null = maps.locationGroupId;
    let depth = 0;
    const seen = new Set<string>();

    while (currentGroupId && depth < MAX_DEPTH) {
      if (seen.has(currentGroupId)) {
        console.warn(
          "[resolveEffectivePermissions] cycle detected in group hierarchy, aborting walk",
          { groupId: currentGroupId },
        );
        break;
      }
      seen.add(currentGroupId);

      const group = maps.groups.get(currentGroupId);
      if (!group) break;

      // Found a group with a permissionSet — use it
      if (group.permissionSetId) {
        const groupSet = maps.permissionSets.get(group.permissionSetId);
        if (groupSet) return groupSet.permissions as PermissionKey[];
      }

      // Otherwise walk up
      currentGroupId = group.parentGroupId;
      depth++;
    }
  }

  // Step 5: Fall back to role defaults
  return (roleDefaults[role] ?? []) as PermissionKey[];
}

// ── Live wrapper (fetches data, then delegates to pure function) ────────

type ChainRow = {
  id: string;
  parentGroupId: string | null;
  permissionSetId: string | null;
  depth: number;
};

/**
 * Resolves the effective permission set for a user at a specific location.
 *
 * Performance: at most 4 queries per request:
 *   1. User lookup (customRoleId)
 *   2. Location lookup (groupId)
 *   3. Recursive CTE to walk the group chain, tenant-scoped by organizationId
 *   4. PermissionSet fetch (only if a permissionSetId is found)
 *
 * SECURITY NOTE: This function intentionally uses prismaAdmin (RLS bypass)
 * for all tenant-data reads. This is the documented and required pattern
 * for code that runs in the NextAuth session() callback, because:
 *
 * - The session callback runs DURING session construction, which means
 *   the app.current_org_id Postgres session variable cannot yet be set
 *   (it's the very value being constructed).
 * - withTenantScope requires that session variable to function. Using
 *   prisma directly would result in a query with no tenant context,
 *   which RLS would deny (returning empty results) — silently breaking
 *   the entire permission system.
 * - Therefore, prismaAdmin with the SUPERADMIN flag is the architecturally
 *   correct choice here. Defense-in-depth is provided by:
 *     (a) the CTE includes an explicit organizationId predicate at both
 *         the anchor and the recursive walk
 *     (b) all permissionSet reads filter by group's organizationId
 *
 * P0.A.11 used the same pattern. This is the established convention.
 * The pattern is also documented in lib/prismaAdmin.ts.
 *
 * DO NOT change this to use `prisma` + `withTenantScope` — it cannot work
 * in this callback. The "prismaAdmin is SEVERE for tenant data" review
 * heuristic correctly applies to route handlers; this is not a route
 * handler.
 */
export async function resolveEffectivePermissions(input: {
  userId: string;
  role: Role;
  organizationId: string;
  locationId?: string | null;
}): Promise<PermissionKey[]> {
  const { userId, role, organizationId, locationId } = input;

  // SUPERADMIN fast path — no DB reads needed
  if (role === Role.SUPERADMIN) {
    return [];
  }

  // Fetch user's custom role ID
  const user = await prismaAdmin.user.findUnique({
    where: { id: userId },
    select: { customRoleId: true },
  });
  const userCustomRoleId = user?.customRoleId ?? null;

  // Look up Location.groupId (the session token's locationId references a Location row)
  let locationGroupId: string | null = null;
  if (locationId) {
    const location = await prismaAdmin.location.findUnique({
      where: { id: locationId },
      select: { groupId: true },
    });
    locationGroupId = location?.groupId ?? null;
  }

  // Walk the group chain via recursive CTE — single round-trip, tenant-scoped
  // at both the entry point and every walk step via organizationId predicate.
  const groups = new Map<string, GroupData>();
  const permissionSetIds = new Set<string>();

  if (userCustomRoleId) {
    permissionSetIds.add(userCustomRoleId);
  }

  if (locationGroupId) {
    const chain = await prismaAdmin.$queryRaw<ChainRow[]>`
      WITH RECURSIVE group_chain AS (
        SELECT id, "parentGroupId", "permissionSetId", "organizationId", 0 AS depth
        FROM "OrganizationGroup"
        WHERE id = ${locationGroupId}
          AND "organizationId" = ${organizationId}

        UNION ALL

        SELECT og.id, og."parentGroupId", og."permissionSetId", og."organizationId", gc.depth + 1
        FROM "OrganizationGroup" og
        JOIN group_chain gc ON og.id = gc."parentGroupId"
        WHERE gc.depth < ${MAX_DEPTH}
          AND og."organizationId" = ${organizationId}
      )
      SELECT id, "parentGroupId", "permissionSetId", depth
      FROM group_chain
      ORDER BY depth ASC
    `;

    for (const row of chain) {
      groups.set(row.id, {
        permissionSetId: row.permissionSetId,
        parentGroupId: row.parentGroupId,
      });
      if (row.permissionSetId) {
        permissionSetIds.add(row.permissionSetId);
      }
    }
  }

  // Batch-fetch all referenced permission sets
  const permissionSets = new Map<string, PermissionSetData>();
  if (permissionSetIds.size > 0) {
    const sets = await prismaAdmin.permissionSet.findMany({
      where: { id: { in: [...permissionSetIds] } },
      select: { id: true, permissions: true },
    });
    for (const s of sets) {
      permissionSets.set(s.id, { permissions: s.permissions });
    }
  }

  return resolveEffectivePermissionsFromMaps(role, {
    userCustomRoleId,
    locationGroupId,
    organizationId,
    groups,
    permissionSets,
  });
}
