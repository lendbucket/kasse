export type UnitType = 'EACH' | 'OZ' | 'ML' | 'GRAM';
export type DeductionSource = 'MANUAL' | 'AUTO_FROM_FORMULA' | 'AUTO_FROM_SERVICE' | 'COUNT_ADJUST' | 'TRANSFER_OUT' | 'TRANSFER_IN';
export type ReorderStatus = 'DRAFT' | 'APPROVED' | 'PLACED' | 'CANCELLED' | 'RECEIVED';
export interface ReorderDraftItem { productVariantId: string; productName: string; variantName: string; quantity: number; unitCostCents: number; notes: string | null; }
