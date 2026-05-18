export type TipSplitMethod = 'PRIMARY_ONLY' | 'TIME_BASED' | 'REVENUE_RATIO' | 'EXPLICIT_PERCENT';
export interface AppointmentItemForSplit { staffId: string; durationMinutes: number; revenueCents: number; isPrimary: boolean; }
export interface TipDistributionResult { staffId: string; amountCents: number; splitWeight: number; }
