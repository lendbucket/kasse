export type CartStatus =
  | "OPEN"
  | "PENDING_PAYMENT"
  | "PAID"
  | "VOIDED"
  | "EXPIRED";

export type CartItemType =
  | "SERVICE"
  | "PRODUCT"
  | "GIFT_CARD"
  | "TIP_ADJUST"
  | "DISCOUNT"
  | "CUSTOM";

export interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  tipCents: number;
  giftCardAppliedCents: number;
  loyaltyAppliedCents: number;
  depositAppliedCents: number;
  totalCents: number;
}

export interface CartItemSpec {
  itemType: CartItemType;
  displayName: string;
  serviceId: string | null;
  appointmentItemId: string | null;
  staffId: string | null;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxableFlag: boolean;
  isAddOn: boolean;
  notes: string | null;
  displayOrder: number;
}
