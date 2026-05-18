export type CompensationModelType = 'W2_COMMISSION' | 'W2_HOURLY' | 'W2_SALARY' | 'CONTRACTOR_1099' | 'BOOTH_RENTAL' | 'HYBRID';
export interface PerServiceCommissionOverride { serviceId: string; commissionPct: number; }
export interface TieredCommissionStep { thresholdCents: number; commissionPct: number; }
