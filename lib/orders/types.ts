export type OrderStatus =
  | "OPEN"
  | "PAID"
  | "PARTIALLY_PAID"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "VOIDED";

export type PaymentMethod =
  | "CARD_PRESENT"
  | "CARD_NOT_PRESENT"
  | "APPLE_PAY"
  | "GOOGLE_PAY"
  | "CASH"
  | "GIFT_CARD"
  | "LOYALTY_REDEMPTION"
  | "CHECK"
  | "OTHER";

export type PaymentChannel =
  | "TERMINAL"
  | "HOSTED_FIELDS"
  | "CARD_ON_FILE"
  | "SMS_CAPTURE_PORTAL"
  | "MANUAL";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
