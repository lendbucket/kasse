/**
 * Default permission sets per Role (P0.A.5).
 *
 * Maps every Role enum value to its default PermissionKey[] per the
 * matrices in PHASE_0_FOUNDATION.md and KASSE_PORTAL_ARCHITECTURE.md.
 *
 * SUPERADMIN is intentionally empty — can() in check.ts short-circuits
 * before consulting this map.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.5
 */
import { Role } from "@prisma/client";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";

const P = Permissions;

/** Collect all values from a Permissions category object. */
function allOf(category: Record<string, PermissionKey>): PermissionKey[] {
  return Object.values(category) as PermissionKey[];
}

/** All non-ADMIN permissions (OWNER gets everything except ADMIN.*). */
const allNonAdmin: PermissionKey[] = [
  ...allOf(P.POS),
  ...allOf(P.APPOINTMENTS),
  ...allOf(P.CLIENTS),
  ...allOf(P.STAFF),
  ...allOf(P.SERVICES),
  ...allOf(P.REPORTS),
  ...allOf(P.FINANCIAL),
  ...allOf(P.PAYROLL),
  ...allOf(P.BILLING),
  ...allOf(P.MARKETING),
  ...allOf(P.INVENTORY),
  ...allOf(P.SETTINGS),
  ...allOf(P.AI),
];

export const roleDefaults: Record<Role, PermissionKey[]> = {
  // SUPERADMIN: bypass via can() short-circuit — never consulted
  [Role.SUPERADMIN]: [],

  // OWNER: all 14 categories except ADMIN.*
  [Role.OWNER]: allNonAdmin,

  // MANAGER: ops + reports, excluding Financial/Payroll-run/Billing/SET_COMMISSION/EDIT_ROLES
  [Role.MANAGER]: [
    ...allOf(P.POS),
    ...allOf(P.APPOINTMENTS),
    ...allOf(P.CLIENTS),
    P.STAFF.VIEW_LIST,
    P.STAFF.VIEW_DETAIL,
    P.STAFF.INVITE,
    P.STAFF.EDIT,
    P.STAFF.DEACTIVATE,
    // STAFF.SET_COMMISSION excluded
    P.STAFF.VIEW_OTHER_SCHEDULES,
    P.STAFF.EDIT_OTHER_SCHEDULES,
    ...allOf(P.SERVICES),
    P.REPORTS.VIEW_OWN,
    P.REPORTS.VIEW_LOCATION,
    P.REPORTS.VIEW_ORG,
    P.REPORTS.EXPORT,
    P.REPORTS.VIEW_FINANCIAL,
    // REPORTS.VIEW_COMMISSION_OTHERS excluded
    // FINANCIAL.* excluded entirely
    P.PAYROLL.VIEW_OWN,
    // PAYROLL.VIEW_ALL/RUN_PAYROLL/EDIT_RATES/APPROVE_TIMECARDS excluded
    // BILLING.* excluded entirely
    ...allOf(P.MARKETING),
    ...allOf(P.INVENTORY),
    P.SETTINGS.VIEW_GENERAL,
    P.SETTINGS.EDIT_GENERAL,
    P.SETTINGS.EDIT_BRANDING,
    P.SETTINGS.EDIT_LOCATIONS,
    P.SETTINGS.EDIT_INTEGRATIONS,
    P.SETTINGS.EDIT_TAX,
    // SETTINGS.EDIT_ROLES excluded
    ...allOf(P.AI),
  ],

  // STAFF: own-scoped operations
  [Role.STAFF]: [
    P.POS.OPEN_CHECKOUT,
    P.POS.PROCESS_PAYMENT,
    P.POS.APPLY_DISCOUNT,
    P.POS.REPRINT_RECEIPT,
    P.APPOINTMENTS.VIEW_OWN,
    P.APPOINTMENTS.CREATE,
    P.APPOINTMENTS.EDIT_OWN,
    P.APPOINTMENTS.CANCEL_OWN,
    P.APPOINTMENTS.NO_SHOW,
    P.APPOINTMENTS.CHECK_IN,
    P.CLIENTS.VIEW_LIST,
    P.CLIENTS.VIEW_DETAIL,
    P.CLIENTS.CREATE,
    P.CLIENTS.EDIT,
    P.CLIENTS.MESSAGE,
    P.SERVICES.VIEW,
    P.REPORTS.VIEW_OWN,
    P.PAYROLL.VIEW_OWN,
    P.AI.VIEW_RECEPTIONIST,
  ],

  // STAFF_VIEW_ONLY: read-only subset of STAFF
  [Role.STAFF_VIEW_ONLY]: [
    P.APPOINTMENTS.VIEW_OWN,
    P.CLIENTS.VIEW_LIST,
    P.CLIENTS.VIEW_DETAIL,
    P.SERVICES.VIEW,
    P.REPORTS.VIEW_OWN,
    P.PAYROLL.VIEW_OWN,
  ],

  // CLIENT: empty — Client Portal keys defined in P11
  [Role.CLIENT]: [],

  // FRANCHISE_OWNER: same as OWNER (diverges in P28 post-launch)
  [Role.FRANCHISE_OWNER]: allNonAdmin,

  // ACCOUNTANT: read-only Financial + Reports + Payroll-view
  [Role.ACCOUNTANT]: [
    P.REPORTS.VIEW_OWN,
    P.REPORTS.VIEW_LOCATION,
    P.REPORTS.VIEW_ORG,
    P.REPORTS.EXPORT,
    P.REPORTS.VIEW_FINANCIAL,
    P.FINANCIAL.VIEW_REVENUE,
    P.FINANCIAL.VIEW_PAYOUTS,
    P.FINANCIAL.VIEW_DISPUTES,
    P.FINANCIAL.VIEW_BANK_ACCOUNT,
    P.PAYROLL.VIEW_ALL,
  ],

  // BUSINESS_PARTNER: read-only across portal
  [Role.BUSINESS_PARTNER]: [
    P.APPOINTMENTS.VIEW_ALL,
    P.CLIENTS.VIEW_LIST,
    P.CLIENTS.VIEW_DETAIL,
    P.STAFF.VIEW_LIST,
    P.STAFF.VIEW_DETAIL,
    P.SERVICES.VIEW,
    P.REPORTS.VIEW_OWN,
    P.REPORTS.VIEW_LOCATION,
    P.REPORTS.VIEW_ORG,
    P.REPORTS.EXPORT,
    P.REPORTS.VIEW_FINANCIAL,
    P.FINANCIAL.VIEW_REVENUE,
    P.FINANCIAL.VIEW_PAYOUTS,
    P.PAYROLL.VIEW_ALL,
    P.MARKETING.VIEW_CAMPAIGNS,
    P.INVENTORY.VIEW,
    P.SETTINGS.VIEW_GENERAL,
    P.AI.VIEW_RECEPTIONIST,
    P.AI.VIEW_CALL_LOG,
  ],
};
