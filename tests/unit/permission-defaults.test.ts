/**
 * P0.A.5: Role-to-permission default mapping tests.
 *
 * Uses Node's built-in test runner (node --test).
 * Run: npx tsx --test tests/unit/permission-defaults.test.ts
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.5
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { Permissions, type PermissionKey } from "../../lib/permissions/types";
import { roleDefaults } from "../../lib/permissions/defaults";

// ── Helpers ──────────────────────────────────────────────────────────────

function allOf(category: Record<string, string>): string[] {
  return Object.values(category);
}

function hasAll(role: Role, keys: string[]): void {
  const defaults = roleDefaults[role];
  for (const k of keys) {
    assert.ok(
      defaults.includes(k as PermissionKey),
      `${role} should have ${k}`,
    );
  }
}

function hasNone(role: Role, keys: string[]): void {
  const defaults = roleDefaults[role];
  for (const k of keys) {
    assert.ok(
      !defaults.includes(k as PermissionKey),
      `${role} should NOT have ${k}`,
    );
  }
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("Role-to-permission defaults (P0.A.5)", () => {
  it("OWNER has every POS, APPOINTMENTS, CLIENTS, STAFF, SERVICES, REPORTS, FINANCIAL, PAYROLL, BILLING, MARKETING, INVENTORY, SETTINGS, AI permission", () => {
    const categories = [
      Permissions.POS, Permissions.APPOINTMENTS, Permissions.CLIENTS,
      Permissions.STAFF, Permissions.SERVICES, Permissions.REPORTS,
      Permissions.FINANCIAL, Permissions.PAYROLL, Permissions.BILLING,
      Permissions.MARKETING, Permissions.INVENTORY, Permissions.SETTINGS,
      Permissions.AI,
    ];
    for (const cat of categories) {
      hasAll(Role.OWNER, allOf(cat));
    }
  });

  it("OWNER has NO ADMIN.* permissions", () => {
    hasNone(Role.OWNER, allOf(Permissions.ADMIN));
  });

  it("MANAGER has NO FINANCIAL.* permissions", () => {
    hasNone(Role.MANAGER, allOf(Permissions.FINANCIAL));
  });

  it("MANAGER has NO PAYROLL.RUN_PAYROLL, BILLING.CHANGE_PLAN, SETTINGS.EDIT_ROLES, or STAFF.SET_COMMISSION", () => {
    hasNone(Role.MANAGER, [
      Permissions.PAYROLL.RUN_PAYROLL,
      Permissions.BILLING.CHANGE_PLAN,
      Permissions.SETTINGS.EDIT_ROLES,
      Permissions.STAFF.SET_COMMISSION,
    ]);
  });

  it("MANAGER does NOT have REPORTS.VIEW_COMMISSION_OTHERS", () => {
    assert.ok(!roleDefaults[Role.MANAGER].includes(Permissions.REPORTS.VIEW_COMMISSION_OTHERS));
  });

  it("STAFF has APPOINTMENTS.EDIT_OWN but NOT APPOINTMENTS.EDIT_ANY", () => {
    hasAll(Role.STAFF, [Permissions.APPOINTMENTS.EDIT_OWN]);
    hasNone(Role.STAFF, [Permissions.APPOINTMENTS.EDIT_ANY]);
  });

  it("STAFF_VIEW_ONLY has only VIEW_* keys (no write verbs)", () => {
    const staffViewOnly = roleDefaults[Role.STAFF_VIEW_ONLY];
    const writeVerbPattern = /\.(create|edit|delete|merge|export|send|approve|run|change|update|override|reprint|process|apply|void|refund|open_|close_|invite|deactivate|set_|message|mark_|check_in|respond_|impersonate|suspend|feature_flag_toggle)/;
    for (const v of staffViewOnly) {
      assert.ok(
        !writeVerbPattern.test(v),
        `STAFF_VIEW_ONLY has write key: ${v}`,
      );
    }
    assert.ok(staffViewOnly.length > 0, "STAFF_VIEW_ONLY should have at least one key");
  });

  it("CLIENT default array is empty", () => {
    assert.equal(roleDefaults[Role.CLIENT].length, 0);
  });

  it("ACCOUNTANT is read-only Financial + Reports (no ISSUE_REFUND, no EDIT_BANK_ACCOUNT)", () => {
    hasAll(Role.ACCOUNTANT, [
      Permissions.FINANCIAL.VIEW_REVENUE,
      Permissions.FINANCIAL.VIEW_PAYOUTS,
      Permissions.FINANCIAL.VIEW_DISPUTES,
      Permissions.FINANCIAL.VIEW_BANK_ACCOUNT,
      Permissions.REPORTS.VIEW_ORG,
      Permissions.REPORTS.EXPORT,
    ]);
    hasNone(Role.ACCOUNTANT, [
      Permissions.FINANCIAL.ISSUE_REFUND,
      Permissions.FINANCIAL.EDIT_BANK_ACCOUNT,
    ]);
  });

  it("BUSINESS_PARTNER is read-only across portal (no edit keys)", () => {
    const defaults = roleDefaults[Role.BUSINESS_PARTNER];
    const editKeys = defaults.filter((k) =>
      k.includes(".edit") || k.includes(".create") || k.includes(".delete") ||
      k.includes(".invite") || k.includes(".merge") || k.includes(".send") ||
      k.includes(".run") || k.includes(".approve") || k.includes(".deactivate") ||
      k.includes(".process") || k.includes(".apply") || k.includes(".override") ||
      k.includes(".refund") || k.includes(".void") || k.includes(".close") ||
      k.includes(".open") || k.includes(".reprint") || k.includes(".set") ||
      k.includes(".change") || k.includes(".update") || k.includes(".cancel") ||
      k.includes(".check_in") || k.includes(".mark_no_show") || k.includes(".message") ||
      k.includes(".respond") || k.includes(".impersonate") || k.includes(".suspend") ||
      k.includes(".feature_flag")
    );
    assert.equal(
      editKeys.length,
      0,
      `BUSINESS_PARTNER should be read-only, but found edit keys: ${editKeys.join(", ")}`,
    );
  });

  it("FRANCHISE_OWNER currently matches OWNER (will diverge in P28)", () => {
    const ownerDefaults = [...roleDefaults[Role.OWNER]].sort();
    const franchiseDefaults = [...roleDefaults[Role.FRANCHISE_OWNER]].sort();
    assert.deepEqual(franchiseDefaults, ownerDefaults);
  });
});
