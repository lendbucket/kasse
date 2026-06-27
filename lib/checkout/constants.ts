// Canonical string values for the modern checkout money model (Cart/Order/Payment).
// These columns are plain strings in Postgres (no DB enums), so this file is the
// single source of truth. Never inline these literals elsewhere.
export const CartStatus = { OPEN: "OPEN", PENDING_PAYMENT: "PENDING_PAYMENT", CONVERTED: "CONVERTED", ABANDONED: "ABANDONED" } as const;
export const OrderStatus = { OPEN: "OPEN", CLOSED: "CLOSED", VOIDED: "VOIDED" } as const;
export const PaymentStatus = { PENDING: "PENDING", COMPLETED: "COMPLETED", FAILED: "FAILED", VOIDED: "VOIDED" } as const;
export const PaymentMethod = { CASH: "CASH", CARD: "CARD", GIFT_CARD: "GIFT_CARD", OTHER: "OTHER" } as const;
export const PaymentChannel = { IN_PERSON: "IN_PERSON", ONLINE: "ONLINE", TERMINAL: "TERMINAL" } as const;
export const ItemType = { SERVICE: "SERVICE", PRODUCT: "PRODUCT" } as const;
// Tenders 3a can settle immediately with no external processor. CARD routes through SalonTransact in 3b.
export const IMMEDIATE_TENDERS: readonly string[] = [PaymentMethod.CASH, PaymentMethod.OTHER];
