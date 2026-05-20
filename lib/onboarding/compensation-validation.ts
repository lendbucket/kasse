/**
 * Pure validation for compensation inputs. No database imports — safe
 * to import in unit tests without DATABASE_URL.
 */

export const VALID_MODEL_TYPES = [
  'W2',
  '1099_COMMISSION',
  'BOOTH_RENT',
  'HYBRID',
] as const;
export type CompensationModelType = typeof VALID_MODEL_TYPES[number];

export const VALID_BOOTH_RENT_FREQUENCIES = [
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
] as const;
export type BoothRentFrequency = typeof VALID_BOOTH_RENT_FREQUENCIES[number];

export interface CompensationInput {
  staffId: string;
  modelType: CompensationModelType;
  effectiveStartDate: string; // ISO date 'YYYY-MM-DD'
  effectiveEndDate?: string | null;
  // W2 / HYBRID
  baseHourlyRateCents?: number;
  overtimeMultiplier?: number;
  overtimeThresholdHours?: number;
  // 1099_COMMISSION / HYBRID
  baseCommissionPct?: number;
  perServiceCommissionOverrides?: Record<string, number>;
  tieredCommissionConfig?: {
    thresholds: number[];
    rates: number[];
  };
  retailCommissionPct?: number;
  includeTipsInCommission?: boolean;
  productDeductionEnabled?: boolean;
  // BOOTH_RENT
  boothRentCents?: number;
  boothRentFrequency?: BoothRentFrequency;
  // All
  notes?: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a single CompensationInput. Returns null on success, or an
 * error message string on failure. Pure function — no DB access.
 */
export function validateCompensationInput(input: CompensationInput): string | null {
  // Model type
  if (!VALID_MODEL_TYPES.includes(input.modelType as CompensationModelType)) {
    return `invalid modelType '${input.modelType}' — must be one of: ${VALID_MODEL_TYPES.join(', ')}`;
  }

  // effectiveStartDate
  if (!input.effectiveStartDate || !ISO_DATE_PATTERN.test(input.effectiveStartDate)) {
    return 'effectiveStartDate is required and must be YYYY-MM-DD';
  }
  const startDate = new Date(input.effectiveStartDate + 'T00:00:00Z');
  if (isNaN(startDate.getTime())) {
    return 'effectiveStartDate is not a valid date';
  }

  // effectiveEndDate
  if (input.effectiveEndDate != null) {
    if (!ISO_DATE_PATTERN.test(input.effectiveEndDate)) {
      return 'effectiveEndDate must be YYYY-MM-DD';
    }
    const endDate = new Date(input.effectiveEndDate + 'T00:00:00Z');
    if (isNaN(endDate.getTime())) {
      return 'effectiveEndDate is not a valid date';
    }
    if (endDate <= startDate) {
      return 'effectiveEndDate must be after effectiveStartDate';
    }
  }

  // Model-specific validation
  switch (input.modelType) {
    case 'W2':
      if (input.baseHourlyRateCents == null || input.baseHourlyRateCents <= 0) {
        return 'W2 requires baseHourlyRateCents > 0';
      }
      if (input.boothRentCents != null) return 'boothRentCents is not applicable to W2';
      if (input.boothRentFrequency != null) return 'boothRentFrequency is not applicable to W2';
      break;

    case '1099_COMMISSION':
      if (input.baseCommissionPct == null || input.baseCommissionPct < 0 || input.baseCommissionPct > 100) {
        return '1099_COMMISSION requires baseCommissionPct between 0 and 100';
      }
      if (input.baseHourlyRateCents != null) return 'baseHourlyRateCents is not applicable to 1099_COMMISSION';
      if (input.boothRentCents != null) return 'boothRentCents is not applicable to 1099_COMMISSION';
      if (input.boothRentFrequency != null) return 'boothRentFrequency is not applicable to 1099_COMMISSION';
      break;

    case 'BOOTH_RENT':
      if (input.boothRentCents == null || input.boothRentCents <= 0) {
        return 'BOOTH_RENT requires boothRentCents > 0';
      }
      if (!input.boothRentFrequency || !VALID_BOOTH_RENT_FREQUENCIES.includes(input.boothRentFrequency as BoothRentFrequency)) {
        return `BOOTH_RENT requires boothRentFrequency to be one of: ${VALID_BOOTH_RENT_FREQUENCIES.join(', ')}`;
      }
      if (input.baseHourlyRateCents != null) return 'baseHourlyRateCents is not applicable to BOOTH_RENT';
      if (input.baseCommissionPct != null) return 'baseCommissionPct is not applicable to BOOTH_RENT';
      if (input.perServiceCommissionOverrides != null) return 'perServiceCommissionOverrides is not applicable to BOOTH_RENT';
      if (input.tieredCommissionConfig != null) return 'tieredCommissionConfig is not applicable to BOOTH_RENT';
      if (input.retailCommissionPct != null) return 'retailCommissionPct is not applicable to BOOTH_RENT';
      break;

    case 'HYBRID':
      if (input.baseHourlyRateCents == null || input.baseHourlyRateCents <= 0) {
        return 'HYBRID requires baseHourlyRateCents > 0';
      }
      if (input.baseCommissionPct == null || input.baseCommissionPct < 0 || input.baseCommissionPct > 100) {
        return 'HYBRID requires baseCommissionPct between 0 and 100';
      }
      if (input.boothRentCents != null) return 'boothRentCents is not applicable to HYBRID';
      if (input.boothRentFrequency != null) return 'boothRentFrequency is not applicable to HYBRID';
      break;
  }

  return null;
}
