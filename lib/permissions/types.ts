/**
 * Canonical permission keys for the Kasse platform (ABO-002).
 *
 * 90 keys across 14 categories. Every role-gated check across the
 * entire build order reads from this file. Do not use string literals
 * for permissions anywhere else — import from here.
 *
 * The `as const` assertion makes every value a string literal type.
 * New keys can be added to the Permissions object in later phases
 * without refactoring any existing consumer.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.3
 */

export const Permissions = {
  POS: {
    OPEN_CHECKOUT: 'pos.open_checkout',
    PROCESS_PAYMENT: 'pos.process_payment',
    APPLY_DISCOUNT: 'pos.apply_discount',
    OVERRIDE_PRICE: 'pos.override_price',
    REFUND_TRANSACTION: 'pos.refund_transaction',
    VOID_TRANSACTION: 'pos.void_transaction',
    REPRINT_RECEIPT: 'pos.reprint_receipt',
    OPEN_CASH_DRAWER: 'pos.open_cash_drawer',
    CLOSE_BATCH: 'pos.close_batch',
  },
  APPOINTMENTS: {
    VIEW_ALL: 'appointments.view_all',
    VIEW_OWN: 'appointments.view_own',
    CREATE: 'appointments.create',
    EDIT_OWN: 'appointments.edit_own',
    EDIT_ANY: 'appointments.edit_any',
    CANCEL_OWN: 'appointments.cancel_own',
    CANCEL_ANY: 'appointments.cancel_any',
    NO_SHOW: 'appointments.mark_no_show',
    CHECK_IN: 'appointments.check_in',
    OVERRIDE_DOUBLE_BOOK: 'appointments.override_double_book',
  },
  CLIENTS: {
    VIEW_LIST: 'clients.view_list',
    VIEW_DETAIL: 'clients.view_detail',
    CREATE: 'clients.create',
    EDIT: 'clients.edit',
    DELETE: 'clients.delete',
    MERGE: 'clients.merge',
    EXPORT: 'clients.export',
    MESSAGE: 'clients.message',
    VIEW_FAMILY: 'clients.view_family',
    VIEW_NOTES_OTHER_STAFF: 'clients.view_notes_other_staff',
  },
  STAFF: {
    VIEW_LIST: 'staff.view_list',
    VIEW_DETAIL: 'staff.view_detail',
    INVITE: 'staff.invite',
    EDIT: 'staff.edit',
    DEACTIVATE: 'staff.deactivate',
    SET_COMMISSION: 'staff.set_commission',
    VIEW_OTHER_SCHEDULES: 'staff.view_other_schedules',
    EDIT_OTHER_SCHEDULES: 'staff.edit_other_schedules',
  },
  SERVICES: {
    VIEW: 'services.view',
    CREATE: 'services.create',
    EDIT: 'services.edit',
    DELETE: 'services.delete',
    SET_PRICING: 'services.set_pricing',
    SET_COSTS: 'services.set_costs',
  },
  REPORTS: {
    VIEW_OWN: 'reports.view_own',
    VIEW_LOCATION: 'reports.view_location',
    VIEW_ORG: 'reports.view_org',
    EXPORT: 'reports.export',
    VIEW_FINANCIAL: 'reports.view_financial',
    VIEW_COMMISSION_OTHERS: 'reports.view_commission_others',
  },
  FINANCIAL: {
    VIEW_REVENUE: 'financial.view_revenue',
    VIEW_PAYOUTS: 'financial.view_payouts',
    VIEW_DISPUTES: 'financial.view_disputes',
    ISSUE_REFUND: 'financial.issue_refund',
    VIEW_BANK_ACCOUNT: 'financial.view_bank_account',
    EDIT_BANK_ACCOUNT: 'financial.edit_bank_account',
  },
  PAYROLL: {
    VIEW_OWN: 'payroll.view_own',
    VIEW_ALL: 'payroll.view_all',
    RUN_PAYROLL: 'payroll.run_payroll',
    EDIT_RATES: 'payroll.edit_rates',
    APPROVE_TIMECARDS: 'payroll.approve_timecards',
  },
  BILLING: {
    VIEW_PLAN: 'billing.view_plan',
    CHANGE_PLAN: 'billing.change_plan',
    VIEW_INVOICES: 'billing.view_invoices',
    UPDATE_PAYMENT_METHOD: 'billing.update_payment_method',
  },
  MARKETING: {
    VIEW_CAMPAIGNS: 'marketing.view_campaigns',
    CREATE_CAMPAIGN: 'marketing.create_campaign',
    SEND_CAMPAIGN: 'marketing.send_campaign',
    EDIT_AUTOMATIONS: 'marketing.edit_automations',
    RESPOND_REVIEWS: 'marketing.respond_reviews',
  },
  INVENTORY: {
    VIEW: 'inventory.view',
    EDIT_STOCK: 'inventory.edit_stock',
    CREATE_PRODUCT: 'inventory.create_product',
    CREATE_PO: 'inventory.create_po',
    APPROVE_PO: 'inventory.approve_po',
  },
  SETTINGS: {
    VIEW_GENERAL: 'settings.view_general',
    EDIT_GENERAL: 'settings.edit_general',
    EDIT_BRANDING: 'settings.edit_branding',
    EDIT_LOCATIONS: 'settings.edit_locations',
    EDIT_INTEGRATIONS: 'settings.edit_integrations',
    EDIT_TAX: 'settings.edit_tax',
    EDIT_ROLES: 'settings.edit_roles',
  },
  AI: {
    VIEW_RECEPTIONIST: 'ai.view_receptionist',
    EDIT_RECEPTIONIST: 'ai.edit_receptionist',
    VIEW_CALL_LOG: 'ai.view_call_log',
  },
  ADMIN: {
    IMPERSONATE: 'admin.impersonate',
    SUSPEND_MERCHANT: 'admin.suspend_merchant',
    APPLY_CREDIT: 'admin.apply_credit',
    CHANGE_MERCHANT_PLAN: 'admin.change_merchant_plan',
    VIEW_AUDIT_LOG: 'admin.view_audit_log',
    FEATURE_FLAG_TOGGLE: 'admin.feature_flag_toggle',
  },
} as const;

// ── Utility types ────────────────────────────────────────────────────────

/**
 * Recursively extracts all leaf string values from a nested const object.
 * For `typeof Permissions`, this produces a union of all 90 permission
 * key strings (will grow in later phases).
 */
type FlattenPermissions<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]: FlattenPermissions<T[K]> }[keyof T]
    : never;

/** Union of all permission key string literals. */
export type PermissionKey = FlattenPermissions<typeof Permissions>;
