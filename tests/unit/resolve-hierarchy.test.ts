/**
 * P0.A.13: Hierarchy permission resolution tests.
 *
 * Tests the pure function resolveEffectivePermissionsFromMaps — no DB, no mocks.
 *
 * Run: npx tsx --test tests/unit/resolve-hierarchy.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import {
  resolveEffectivePermissionsFromMaps,
  type HierarchyMaps,
  type GroupData,
  type PermissionSetData,
} from "../../lib/permissions/resolve-hierarchy";
import { roleDefaults } from "../../lib/permissions/defaults";

const ORG_A = "org-A";

function makeMaps(overrides: Partial<HierarchyMaps> = {}): HierarchyMaps {
  return {
    userCustomRoleId: null,
    locationGroupId: null,
    organizationId: ORG_A,
    groups: new Map<string, GroupData>(),
    permissionSets: new Map<string, PermissionSetData>(),
    ...overrides,
  };
}

describe("resolveEffectivePermissionsFromMaps (P0.A.13)", () => {
  it("(a) user has customRoleId → returns that set, ignores group chain", () => {
    const customPerms = ["pos.open_checkout", "clients.view_list"];
    const groupPerms = ["staff.view_list"];
    const maps = makeMaps({
      userCustomRoleId: "custom-role-1",
      locationGroupId: "group-1",
      groups: new Map([["group-1", { permissionSetId: "ps-group", parentGroupId: null }]]),
      permissionSets: new Map([
        ["custom-role-1", { permissions: customPerms }],
        ["ps-group", { permissions: groupPerms }],
      ]),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.STAFF, maps);
    assert.deepEqual(result, customPerms);
  });

  it("(b) no customRoleId, location group has permissionSet → returns group's set", () => {
    const groupPerms = ["pos.open_checkout", "appointments.view_all"];
    const maps = makeMaps({
      locationGroupId: "group-1",
      groups: new Map([["group-1", { permissionSetId: "ps-1", parentGroupId: null }]]),
      permissionSets: new Map([["ps-1", { permissions: groupPerms }]]),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.STAFF, maps);
    assert.deepEqual(result, groupPerms);
  });

  it("(c) no customRoleId, group has no permissionSet, parent group does → returns parent's set", () => {
    const parentPerms = ["reports.view_org", "settings.view_general"];
    const maps = makeMaps({
      locationGroupId: "group-child",
      groups: new Map([
        ["group-child", { permissionSetId: null, parentGroupId: "group-parent" }],
        ["group-parent", { permissionSetId: "ps-parent", parentGroupId: null }],
      ]),
      permissionSets: new Map([["ps-parent", { permissions: parentPerms }]]),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.MANAGER, maps);
    assert.deepEqual(result, parentPerms);
  });

  it("(d) no customRoleId, walk hits root with no permissionSet → returns roleDefaults", () => {
    const maps = makeMaps({
      locationGroupId: "group-1",
      groups: new Map([["group-1", { permissionSetId: null, parentGroupId: null }]]),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.STAFF, maps);
    assert.deepEqual(result, roleDefaults[Role.STAFF]);
  });

  it("(e) no locationId provided → returns roleDefaults", () => {
    const maps = makeMaps(); // locationGroupId is null
    const result = resolveEffectivePermissionsFromMaps(Role.MANAGER, maps);
    assert.deepEqual(result, roleDefaults[Role.MANAGER]);
  });

  it("(f) cycle in parent chain → breaks at cycle, returns roleDefaults", () => {
    // group-a → group-b → group-a (cycle), neither has permissionSet
    const maps = makeMaps({
      locationGroupId: "group-a",
      groups: new Map([
        ["group-a", { permissionSetId: null, parentGroupId: "group-b" }],
        ["group-b", { permissionSetId: null, parentGroupId: "group-a" }],
      ]),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.STAFF, maps);
    assert.deepEqual(result, roleDefaults[Role.STAFF]);
  });

  it("(g) chain depth exceeds 10 → breaks at MAX_DEPTH, returns roleDefaults", () => {
    const groups = new Map<string, GroupData>();
    // Create a chain of 12 groups, none with permissionSet
    for (let i = 0; i < 12; i++) {
      groups.set(`group-${i}`, {
        permissionSetId: null,
        parentGroupId: i < 11 ? `group-${i + 1}` : null,
      });
    }

    const maps = makeMaps({
      locationGroupId: "group-0",
      groups,
    });

    const result = resolveEffectivePermissionsFromMaps(Role.STAFF, maps);
    // Should fall back to roleDefaults because the walk stops at depth 10
    // and group-10/group-11 are never reached
    assert.deepEqual(result, roleDefaults[Role.STAFF]);
  });

  it("(h) SUPERADMIN returns empty array regardless of group chain", () => {
    const maps = makeMaps({
      userCustomRoleId: "custom-role-1",
      locationGroupId: "group-1",
      groups: new Map([["group-1", { permissionSetId: "ps-1", parentGroupId: null }]]),
      permissionSets: new Map([
        ["custom-role-1", { permissions: ["pos.open_checkout"] }],
        ["ps-1", { permissions: ["staff.view_list"] }],
      ]),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.SUPERADMIN, maps);
    assert.deepEqual(result, []);
  });

  it("(i) locationGroupId points to group not in maps (simulates cross-org mismatch) → returns roleDefaults", () => {
    // The live wrapper's CTE filters by organizationId, so a group belonging
    // to a different org would not appear in the maps. Simulate this by
    // providing a locationGroupId that has no entry in the groups map.
    const maps = makeMaps({
      organizationId: ORG_A,
      locationGroupId: "group-other-org",
      // groups map is empty — the CTE would have returned nothing for a
      // cross-org group because of the organizationId predicate
      groups: new Map(),
      permissionSets: new Map(),
    });

    const result = resolveEffectivePermissionsFromMaps(Role.STAFF, maps);
    assert.deepEqual(result, roleDefaults[Role.STAFF]);
  });
});
