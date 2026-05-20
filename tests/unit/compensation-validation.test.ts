import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCompensationInput,
  VALID_MODEL_TYPES,
  VALID_BOOTH_RENT_FREQUENCIES,
} from '@/lib/onboarding/compensation-validation';
import type { CompensationInput } from '@/lib/onboarding/compensation-validation';

// ---- Helpers to build valid base inputs per model ----

function validW2(): CompensationInput {
  return {
    staffId: 'staff-1',
    modelType: 'W2',
    effectiveStartDate: '2026-06-01',
    baseHourlyRateCents: 2500,
  };
}

function valid1099(): CompensationInput {
  return {
    staffId: 'staff-2',
    modelType: '1099_COMMISSION',
    effectiveStartDate: '2026-06-01',
    baseCommissionPct: 50,
  };
}

function validBoothRent(): CompensationInput {
  return {
    staffId: 'staff-3',
    modelType: 'BOOTH_RENT',
    effectiveStartDate: '2026-06-01',
    boothRentCents: 50000,
    boothRentFrequency: 'WEEKLY',
  };
}

function validHybrid(): CompensationInput {
  return {
    staffId: 'staff-4',
    modelType: 'HYBRID',
    effectiveStartDate: '2026-06-01',
    baseHourlyRateCents: 1500,
    baseCommissionPct: 30,
  };
}

describe('validateCompensationInput — model type validation (P1.A.7-a)', () => {
  it('rejects invalid modelType', () => {
    const input = { ...validW2(), modelType: 'INVALID' as any };
    const err = validateCompensationInput(input);
    assert.ok(err !== null);
    assert.ok(err.includes('invalid modelType'));
  });

  it('accepts all valid model types', () => {
    for (const mt of VALID_MODEL_TYPES) {
      let input: CompensationInput;
      switch (mt) {
        case 'W2': input = validW2(); break;
        case '1099_COMMISSION': input = valid1099(); break;
        case 'BOOTH_RENT': input = validBoothRent(); break;
        case 'HYBRID': input = validHybrid(); break;
      }
      assert.equal(validateCompensationInput(input), null, `${mt} should pass`);
    }
  });
});

describe('validateCompensationInput — W2 (P1.A.7-a)', () => {
  it('passes with valid W2 input', () => {
    assert.equal(validateCompensationInput(validW2()), null);
  });

  it('rejects baseHourlyRateCents <= 0', () => {
    const err = validateCompensationInput({ ...validW2(), baseHourlyRateCents: 0 });
    assert.ok(err !== null);
    assert.ok(err.includes('baseHourlyRateCents'));
  });

  it('rejects missing baseHourlyRateCents', () => {
    const input = validW2();
    delete (input as any).baseHourlyRateCents;
    const err = validateCompensationInput(input);
    assert.ok(err !== null);
  });

  it('rejects extraneous boothRentCents on W2', () => {
    const err = validateCompensationInput({ ...validW2(), boothRentCents: 50000 });
    assert.ok(err !== null);
    assert.ok(err.includes('boothRentCents'));
    assert.ok(err.includes('not applicable'));
  });

  it('rejects extraneous boothRentFrequency on W2', () => {
    const err = validateCompensationInput({ ...validW2(), boothRentFrequency: 'WEEKLY' });
    assert.ok(err !== null);
    assert.ok(err.includes('boothRentFrequency'));
  });
});

describe('validateCompensationInput — 1099_COMMISSION (P1.A.7-a)', () => {
  it('passes with valid 1099 input', () => {
    assert.equal(validateCompensationInput(valid1099()), null);
  });

  it('rejects baseCommissionPct < 0', () => {
    const err = validateCompensationInput({ ...valid1099(), baseCommissionPct: -1 });
    assert.ok(err !== null);
    assert.ok(err.includes('baseCommissionPct'));
  });

  it('rejects baseCommissionPct > 100', () => {
    const err = validateCompensationInput({ ...valid1099(), baseCommissionPct: 101 });
    assert.ok(err !== null);
    assert.ok(err.includes('baseCommissionPct'));
  });

  it('rejects extraneous baseHourlyRateCents on 1099', () => {
    const err = validateCompensationInput({ ...valid1099(), baseHourlyRateCents: 2500 });
    assert.ok(err !== null);
    assert.ok(err.includes('baseHourlyRateCents'));
    assert.ok(err.includes('not applicable'));
  });

  it('rejects extraneous boothRentCents on 1099', () => {
    const err = validateCompensationInput({ ...valid1099(), boothRentCents: 50000 });
    assert.ok(err !== null);
    assert.ok(err.includes('not applicable'));
  });
});

describe('validateCompensationInput — BOOTH_RENT (P1.A.7-a)', () => {
  it('passes with valid booth rent input', () => {
    assert.equal(validateCompensationInput(validBoothRent()), null);
  });

  it('rejects boothRentCents <= 0', () => {
    const err = validateCompensationInput({ ...validBoothRent(), boothRentCents: 0 });
    assert.ok(err !== null);
    assert.ok(err.includes('boothRentCents'));
  });

  it('rejects missing boothRentFrequency', () => {
    const input = validBoothRent();
    delete (input as any).boothRentFrequency;
    const err = validateCompensationInput(input);
    assert.ok(err !== null);
    assert.ok(err.includes('boothRentFrequency'));
  });

  it('rejects invalid boothRentFrequency', () => {
    const err = validateCompensationInput({
      ...validBoothRent(),
      boothRentFrequency: 'DAILY' as any,
    });
    assert.ok(err !== null);
    assert.ok(err.includes('boothRentFrequency'));
  });

  it('accepts all valid frequencies', () => {
    for (const f of VALID_BOOTH_RENT_FREQUENCIES) {
      const err = validateCompensationInput({ ...validBoothRent(), boothRentFrequency: f });
      assert.equal(err, null, `${f} should pass`);
    }
  });

  it('rejects extraneous baseHourlyRateCents on BOOTH_RENT', () => {
    const err = validateCompensationInput({ ...validBoothRent(), baseHourlyRateCents: 2500 });
    assert.ok(err !== null);
    assert.ok(err.includes('not applicable'));
  });

  it('rejects extraneous baseCommissionPct on BOOTH_RENT', () => {
    const err = validateCompensationInput({ ...validBoothRent(), baseCommissionPct: 50 });
    assert.ok(err !== null);
    assert.ok(err.includes('not applicable'));
  });
});

describe('validateCompensationInput — HYBRID (P1.A.7-a)', () => {
  it('passes with valid hybrid input', () => {
    assert.equal(validateCompensationInput(validHybrid()), null);
  });

  it('requires both baseHourlyRateCents AND baseCommissionPct', () => {
    const missingHourly = validHybrid();
    delete (missingHourly as any).baseHourlyRateCents;
    assert.ok(validateCompensationInput(missingHourly) !== null);

    const missingComm = validHybrid();
    delete (missingComm as any).baseCommissionPct;
    assert.ok(validateCompensationInput(missingComm) !== null);
  });

  it('rejects extraneous boothRentCents on HYBRID', () => {
    const err = validateCompensationInput({ ...validHybrid(), boothRentCents: 50000 });
    assert.ok(err !== null);
    assert.ok(err.includes('not applicable'));
  });
});

describe('validateCompensationInput — date validation (P1.A.7-a)', () => {
  it('rejects missing effectiveStartDate', () => {
    const input = validW2();
    (input as any).effectiveStartDate = '';
    const err = validateCompensationInput(input);
    assert.ok(err !== null);
    assert.ok(err.includes('effectiveStartDate'));
  });

  it('rejects non-ISO effectiveStartDate', () => {
    const err = validateCompensationInput({ ...validW2(), effectiveStartDate: '06/01/2026' });
    assert.ok(err !== null);
    assert.ok(err.includes('effectiveStartDate'));
  });

  it('rejects effectiveEndDate before effectiveStartDate', () => {
    const err = validateCompensationInput({
      ...validW2(),
      effectiveStartDate: '2026-06-15',
      effectiveEndDate: '2026-06-01',
    });
    assert.ok(err !== null);
    assert.ok(err.includes('effectiveEndDate'));
    assert.ok(err.includes('after'));
  });

  it('rejects effectiveEndDate equal to effectiveStartDate', () => {
    const err = validateCompensationInput({
      ...validW2(),
      effectiveStartDate: '2026-06-01',
      effectiveEndDate: '2026-06-01',
    });
    assert.ok(err !== null);
  });

  it('accepts valid effectiveEndDate after effectiveStartDate', () => {
    const err = validateCompensationInput({
      ...validW2(),
      effectiveStartDate: '2026-06-01',
      effectiveEndDate: '2026-12-31',
    });
    assert.equal(err, null);
  });

  it('accepts null effectiveEndDate (ongoing)', () => {
    const err = validateCompensationInput({
      ...validW2(),
      effectiveEndDate: null,
    });
    assert.equal(err, null);
  });
});
