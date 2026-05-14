import type { PermissionKey } from "./types";

/**
 * Human-readable descriptions for every PermissionKey (P0.A.12).
 *
 * Used by the custom roles editor UI to label permission checkboxes.
 * Each description is 4-10 words, factual, not marketing-speak.
 */
export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  // POS (9)
  "pos.open_checkout": "Open the checkout/POS screen",
  "pos.process_payment": "Process card and cash payments",
  "pos.apply_discount": "Apply manual discounts at checkout",
  "pos.override_price": "Override item prices at checkout",
  "pos.refund_transaction": "Issue refund at the POS terminal (in-shop)",
  "pos.void_transaction": "Void an in-progress transaction",
  "pos.reprint_receipt": "Reprint receipts for past transactions",
  "pos.open_cash_drawer": "Open the physical cash drawer",
  "pos.close_batch": "Close the daily settlement batch",

  // APPOINTMENTS (10)
  "appointments.view_all": "View all staff appointments",
  "appointments.view_own": "View own appointments only",
  "appointments.create": "Create new appointments",
  "appointments.edit_own": "Edit own appointments only",
  "appointments.edit_any": "Edit any staff member's appointments",
  "appointments.cancel_own": "Cancel own appointments only",
  "appointments.cancel_any": "Cancel any staff member's appointments",
  "appointments.mark_no_show": "Mark appointments as no-show",
  "appointments.check_in": "Check in arriving clients",
  "appointments.override_double_book": "Override double-booking restrictions",

  // CLIENTS (10)
  "clients.view_list": "View the client list",
  "clients.view_detail": "View individual client profiles",
  "clients.create": "Create new client records",
  "clients.edit": "Edit client profile information",
  "clients.delete": "Delete client records",
  "clients.merge": "Merge duplicate client records",
  "clients.export": "Export client data to CSV",
  "clients.message": "Send messages to clients",
  "clients.view_family": "View linked family members",
  "clients.view_notes_other_staff": "View client notes from other staff",

  // STAFF (8)
  "staff.view_list": "View the staff roster",
  "staff.view_detail": "View individual staff profiles",
  "staff.invite": "Send invitations to add new staff",
  "staff.edit": "Edit staff profile information",
  "staff.deactivate": "Deactivate staff accounts",
  "staff.set_commission": "Set staff commission rates",
  "staff.view_other_schedules": "View other staff members' schedules",
  "staff.edit_other_schedules": "Edit other staff members' schedules",

  // SERVICES (6)
  "services.view": "View the service menu",
  "services.create": "Create new services",
  "services.edit": "Edit existing services",
  "services.delete": "Delete services",
  "services.set_pricing": "Set service prices",
  "services.set_costs": "Set internal service costs",

  // REPORTS (6)
  "reports.view_own": "View own performance reports",
  "reports.view_location": "View reports for a location",
  "reports.view_org": "View organization-wide reports",
  "reports.export": "Export reports to CSV or PDF",
  "reports.view_financial": "View financial summary reports",
  "reports.view_commission_others": "View other staff commission reports",

  // FINANCIAL (6)
  "financial.view_revenue": "View revenue and sales data",
  "financial.view_payouts": "View payout history and schedules",
  "financial.view_disputes": "View payment disputes and chargebacks",
  "financial.issue_refund": "Issue refund from financial dashboard (back-office)",
  "financial.view_bank_account": "View linked bank account details",
  "financial.edit_bank_account": "Edit linked bank account details",

  // PAYROLL (5)
  "payroll.view_own": "View own pay stubs and earnings",
  "payroll.view_all": "View all staff payroll records",
  "payroll.run_payroll": "Run payroll processing",
  "payroll.edit_rates": "Edit hourly and salary pay rates",
  "payroll.approve_timecards": "Approve staff timecards",

  // BILLING (4)
  "billing.view_plan": "View current subscription plan",
  "billing.change_plan": "Change subscription plan or tier",
  "billing.view_invoices": "View billing invoices",
  "billing.update_payment_method": "Update billing payment method",

  // MARKETING (5)
  "marketing.view_campaigns": "View marketing campaigns",
  "marketing.create_campaign": "Create new marketing campaigns",
  "marketing.send_campaign": "Send marketing campaigns to clients",
  "marketing.edit_automations": "Edit automated marketing workflows",
  "marketing.respond_reviews": "Respond to online reviews",

  // INVENTORY (5)
  "inventory.view": "View product inventory",
  "inventory.edit_stock": "Adjust inventory stock levels",
  "inventory.create_product": "Create new inventory products",
  "inventory.create_po": "Create purchase orders",
  "inventory.approve_po": "Approve purchase orders",

  // SETTINGS (7)
  "settings.view_general": "View general business settings",
  "settings.edit_general": "Edit general business settings",
  "settings.edit_branding": "Edit branding and appearance",
  "settings.edit_locations": "Edit location configuration",
  "settings.edit_integrations": "Edit third-party integrations",
  "settings.edit_tax": "Edit tax rates and rules",
  "settings.edit_roles": "Edit roles and permissions",

  // AI (3)
  "ai.view_receptionist": "View AI receptionist configuration",
  "ai.edit_receptionist": "Edit AI receptionist settings",
  "ai.view_call_log": "View AI receptionist call log",

  // ADMIN (6)
  "admin.impersonate": "Impersonate another user's session",
  "admin.suspend_merchant": "Suspend a merchant account",
  "admin.apply_credit": "Apply account credits to merchants",
  "admin.change_merchant_plan": "Change a merchant's subscription plan",
  "admin.view_audit_log": "View the platform audit log",
  "admin.feature_flag_toggle": "Enable or disable platform features per merchant",
};
