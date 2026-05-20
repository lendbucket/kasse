'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const MODEL_TYPES = ['W2', '1099_COMMISSION', 'BOOTH_RENT', 'HYBRID'] as const;
type ModelType = typeof MODEL_TYPES[number];

const MODEL_LABELS: Record<ModelType, string> = {
  W2: 'W-2 Employee',
  '1099_COMMISSION': '1099 Commission',
  BOOTH_RENT: 'Booth Rent',
  HYBRID: 'Hybrid (Hourly + Commission)',
};

const BOOTH_RENT_FREQUENCIES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;

interface StaffEntry {
  staffId: string;
  name: string | null;
  email: string | null;
  hasAgreement: boolean;
  agreementTemplateType: string | null;
  hasCompensation: boolean;
  compensation: {
    modelType: string;
    baseHourlyRateCents: number | null;
    baseCommissionPct: number | null;
    perServiceCommissionOverrides: unknown;
    tieredCommissionConfig: unknown;
    retailCommissionPct: number | null;
    boothRentCents: number | null;
    boothRentFrequency: string | null;
    overtimeMultiplier: number;
    overtimeThresholdHours: number;
    includeTipsInCommission: boolean;
    productDeductionEnabled: boolean;
    effectiveStartDate: string;
    effectiveEndDate: string | null;
    notes: string | null;
  } | null;
}

interface CompensationFormData {
  modelType: ModelType;
  baseHourlyRateCents: string;
  baseCommissionPct: string;
  boothRentCents: string;
  boothRentFrequency: string;
  overtimeMultiplier: string;
  overtimeThresholdHours: string;
  retailCommissionPct: string;
  includeTipsInCommission: boolean;
  productDeductionEnabled: boolean;
  effectiveStartDate: string;
  effectiveEndDate: string;
  showEndDate: boolean;
  notes: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFormData(): CompensationFormData {
  return {
    modelType: 'W2',
    baseHourlyRateCents: '',
    baseCommissionPct: '',
    boothRentCents: '',
    boothRentFrequency: 'WEEKLY',
    overtimeMultiplier: '1.5',
    overtimeThresholdHours: '40',
    retailCommissionPct: '',
    includeTipsInCommission: false,
    productDeductionEnabled: false,
    effectiveStartDate: todayISO(),
    effectiveEndDate: '',
    showEndDate: false,
    notes: '',
  };
}

function formDataFromExisting(comp: StaffEntry['compensation']): CompensationFormData {
  if (!comp) return defaultFormData();
  return {
    modelType: comp.modelType as ModelType,
    baseHourlyRateCents: comp.baseHourlyRateCents?.toString() ?? '',
    baseCommissionPct: comp.baseCommissionPct?.toString() ?? '',
    boothRentCents: comp.boothRentCents?.toString() ?? '',
    boothRentFrequency: comp.boothRentFrequency ?? 'WEEKLY',
    overtimeMultiplier: comp.overtimeMultiplier?.toString() ?? '1.5',
    overtimeThresholdHours: comp.overtimeThresholdHours?.toString() ?? '40',
    retailCommissionPct: comp.retailCommissionPct?.toString() ?? '',
    includeTipsInCommission: comp.includeTipsInCommission ?? false,
    productDeductionEnabled: comp.productDeductionEnabled ?? false,
    effectiveStartDate: comp.effectiveStartDate
      ? new Date(comp.effectiveStartDate).toISOString().slice(0, 10)
      : todayISO(),
    effectiveEndDate: comp.effectiveEndDate
      ? new Date(comp.effectiveEndDate).toISOString().slice(0, 10)
      : '',
    showEndDate: comp.effectiveEndDate != null,
    notes: comp.notes ?? '',
  };
}

function isCardValid(form: CompensationFormData): boolean {
  if (!form.effectiveStartDate) return false;
  if (form.showEndDate && form.effectiveEndDate && form.effectiveEndDate <= form.effectiveStartDate) return false;

  switch (form.modelType) {
    case 'W2': {
      const v = parseInt(form.baseHourlyRateCents, 10);
      return !isNaN(v) && v > 0;
    }
    case '1099_COMMISSION': {
      const v = parseFloat(form.baseCommissionPct);
      return !isNaN(v) && v >= 0 && v <= 100;
    }
    case 'BOOTH_RENT': {
      const v = parseInt(form.boothRentCents, 10);
      return !isNaN(v) && v > 0 && BOOTH_RENT_FREQUENCIES.includes(form.boothRentFrequency as any);
    }
    case 'HYBRID': {
      const h = parseInt(form.baseHourlyRateCents, 10);
      const c = parseFloat(form.baseCommissionPct);
      return !isNaN(h) && h > 0 && !isNaN(c) && c >= 0 && c <= 100;
    }
  }
}

function buildPayload(staffId: string, form: CompensationFormData) {
  const base: Record<string, unknown> = {
    staffId,
    modelType: form.modelType,
    effectiveStartDate: form.effectiveStartDate,
    effectiveEndDate: form.showEndDate && form.effectiveEndDate ? form.effectiveEndDate : null,
    notes: form.notes || undefined,
  };

  switch (form.modelType) {
    case 'W2':
      base.baseHourlyRateCents = parseInt(form.baseHourlyRateCents, 10);
      if (form.overtimeMultiplier) base.overtimeMultiplier = parseFloat(form.overtimeMultiplier);
      if (form.overtimeThresholdHours) base.overtimeThresholdHours = parseInt(form.overtimeThresholdHours, 10);
      if (form.baseCommissionPct) base.baseCommissionPct = parseFloat(form.baseCommissionPct);
      if (form.retailCommissionPct) base.retailCommissionPct = parseFloat(form.retailCommissionPct);
      if (form.includeTipsInCommission) base.includeTipsInCommission = true;
      break;
    case '1099_COMMISSION':
      base.baseCommissionPct = parseFloat(form.baseCommissionPct);
      if (form.retailCommissionPct) base.retailCommissionPct = parseFloat(form.retailCommissionPct);
      base.includeTipsInCommission = form.includeTipsInCommission;
      base.productDeductionEnabled = form.productDeductionEnabled;
      break;
    case 'BOOTH_RENT':
      base.boothRentCents = parseInt(form.boothRentCents, 10);
      base.boothRentFrequency = form.boothRentFrequency;
      break;
    case 'HYBRID':
      base.baseHourlyRateCents = parseInt(form.baseHourlyRateCents, 10);
      base.baseCommissionPct = parseFloat(form.baseCommissionPct);
      if (form.overtimeMultiplier) base.overtimeMultiplier = parseFloat(form.overtimeMultiplier);
      if (form.overtimeThresholdHours) base.overtimeThresholdHours = parseInt(form.overtimeThresholdHours, 10);
      if (form.retailCommissionPct) base.retailCommissionPct = parseFloat(form.retailCommissionPct);
      if (form.includeTipsInCommission) base.includeTipsInCommission = true;
      break;
  }

  return base;
}

// ---- Styles ----
const pageStyle: React.CSSProperties = {
  padding: '32px',
  maxWidth: 900,
  margin: '0 auto',
  fontFamily: 'Inter, -apple-system, sans-serif',
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: '24px',
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  color: '#111827',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto' as const,
};

const radioGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
};

const btnPrimary: React.CSSProperties = {
  padding: '12px 32px',
  fontSize: 14,
  fontWeight: 600,
  color: '#ffffff',
  background: '#606E74',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const btnDisabled: React.CSSProperties = {
  ...btnPrimary,
  opacity: 0.5,
  cursor: 'not-allowed',
};

function RadioButton({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 6,
        border: checked ? '2px solid #606E74' : '1px solid #e5e7eb',
        background: checked ? '#f0f4f5' : '#ffffff',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: checked ? 600 : 400,
        color: '#111827',
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      {label}
    </label>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function StaffCard({
  staff,
  form,
  onChange,
}: {
  staff: StaffEntry;
  form: CompensationFormData;
  onChange: (f: CompensationFormData) => void;
}) {
  const set = (partial: Partial<CompensationFormData>) => onChange({ ...form, ...partial });

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
          {staff.name || 'Unnamed Staff'}
        </h3>
        {staff.agreementTemplateType && (
          <span style={{ fontSize: 12, color: '#606E74', fontWeight: 500 }}>
            Agreement: {staff.agreementTemplateType}
          </span>
        )}
      </div>

      {/* Model type radio buttons */}
      <label style={labelStyle}>Compensation Model</label>
      <div style={radioGroupStyle}>
        {MODEL_TYPES.map((mt) => (
          <RadioButton
            key={mt}
            label={MODEL_LABELS[mt]}
            checked={form.modelType === mt}
            onChange={() => set({ modelType: mt })}
          />
        ))}
      </div>

      {/* Conditional fields */}
      {(form.modelType === 'W2' || form.modelType === 'HYBRID') && (
        <FieldRow>
          <div>
            <label style={labelStyle}>Base Hourly Rate (cents)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="e.g. 2500 = $25.00/hr"
              value={form.baseHourlyRateCents}
              onChange={(e) => set({ baseHourlyRateCents: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Overtime Multiplier</label>
            <input
              type="number"
              step="0.1"
              style={inputStyle}
              value={form.overtimeMultiplier}
              onChange={(e) => set({ overtimeMultiplier: e.target.value })}
            />
          </div>
        </FieldRow>
      )}

      {form.modelType === 'W2' && (
        <FieldRow>
          <div>
            <label style={labelStyle}>Overtime Threshold (hours/week)</label>
            <input
              type="number"
              style={inputStyle}
              value={form.overtimeThresholdHours}
              onChange={(e) => set({ overtimeThresholdHours: e.target.value })}
            />
          </div>
          <div />
        </FieldRow>
      )}

      {(form.modelType === '1099_COMMISSION' || form.modelType === 'HYBRID') && (
        <FieldRow>
          <div>
            <label style={labelStyle}>Base Commission %</label>
            <input
              type="number"
              step="0.1"
              style={inputStyle}
              placeholder="e.g. 50 = 50%"
              value={form.baseCommissionPct}
              onChange={(e) => set({ baseCommissionPct: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Retail Commission % (optional)</label>
            <input
              type="number"
              step="0.1"
              style={inputStyle}
              placeholder="e.g. 10"
              value={form.retailCommissionPct}
              onChange={(e) => set({ retailCommissionPct: e.target.value })}
            />
          </div>
        </FieldRow>
      )}

      {form.modelType === '1099_COMMISSION' && (
        <FieldRow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.includeTipsInCommission}
              onChange={(e) => set({ includeTipsInCommission: e.target.checked })}
            />
            <label style={{ fontSize: 13, color: '#374151' }}>Include tips in commission</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.productDeductionEnabled}
              onChange={(e) => set({ productDeductionEnabled: e.target.checked })}
            />
            <label style={{ fontSize: 13, color: '#374151' }}>Product deduction enabled</label>
          </div>
        </FieldRow>
      )}

      {form.modelType === 'BOOTH_RENT' && (
        <FieldRow>
          <div>
            <label style={labelStyle}>Booth Rent (cents)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="e.g. 50000 = $500.00"
              value={form.boothRentCents}
              onChange={(e) => set({ boothRentCents: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Rent Frequency</label>
            <select
              style={selectStyle}
              value={form.boothRentFrequency}
              onChange={(e) => set({ boothRentFrequency: e.target.value })}
            >
              {BOOTH_RENT_FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </FieldRow>
      )}

      {form.modelType === 'HYBRID' && (
        <FieldRow>
          <div>
            <label style={labelStyle}>Overtime Threshold (hours/week)</label>
            <input
              type="number"
              style={inputStyle}
              value={form.overtimeThresholdHours}
              onChange={(e) => set({ overtimeThresholdHours: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.includeTipsInCommission}
              onChange={(e) => set({ includeTipsInCommission: e.target.checked })}
            />
            <label style={{ fontSize: 13, color: '#374151' }}>Include tips in commission</label>
          </div>
        </FieldRow>
      )}

      {/* Dates */}
      <FieldRow>
        <div>
          <label style={labelStyle}>Effective Start Date</label>
          <input
            type="date"
            style={inputStyle}
            value={form.effectiveStartDate}
            onChange={(e) => set({ effectiveStartDate: e.target.value })}
          />
        </div>
        <div>
          {form.showEndDate ? (
            <>
              <label style={labelStyle}>Effective End Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.effectiveEndDate}
                onChange={(e) => set({ effectiveEndDate: e.target.value })}
              />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <button
                type="button"
                onClick={() => set({ showEndDate: true })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#606E74',
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Set end date
              </button>
            </div>
          )}
        </div>
      </FieldRow>

      {/* Notes */}
      <div style={{ marginTop: 4 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          placeholder="Internal notes about this compensation arrangement..."
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </div>

      {/* Validation indicator */}
      <div style={{ marginTop: 8, fontSize: 12, color: isCardValid(form) ? '#16a34a' : '#dc2626' }}>
        {isCardValid(form) ? 'Valid' : 'Incomplete — fill required fields'}
      </div>
    </div>
  );
}

export default function CompensationAdminPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [staffList, setStaffList] = useState<StaffEntry[]>([]);
  const [forms, setForms] = useState<Record<string, CompensationFormData>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch(`/api/onboarding/compensation?sessionId=${sessionId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const staffEntries: StaffEntry[] = data.staff ?? [];
        setStaffList(staffEntries);

        const initial: Record<string, CompensationFormData> = {};
        for (const s of staffEntries) {
          if (s.hasAgreement) {
            initial[s.staffId] = s.hasCompensation
              ? formDataFromExisting(s.compensation)
              : defaultFormData();
          }
        }
        setForms(initial);
      })
      .catch((e) => {
        if (!active) return;
        if (e.name === 'AbortError') return;
        setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [sessionId]);

  const updateForm = useCallback((staffId: string, form: CompensationFormData) => {
    setForms((prev) => ({ ...prev, [staffId]: form }));
  }, []);

  const staffWithAgreements = staffList.filter((s) => s.hasAgreement);
  const allValid = staffWithAgreements.length > 0 && staffWithAgreements.every((s) => {
    const f = forms[s.staffId];
    return f && isCardValid(f);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const compensations = staffWithAgreements.map((s) => {
      const f = forms[s.staffId]!;
      return buildPayload(s.staffId, f);
    });

    try {
      const res = await fetch('/api/onboarding/compensation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, compensations }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || data.error || 'Failed to save compensation');
        return;
      }

      router.push('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Loading staff compensation data...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
        Set Staff Compensation
      </h1>
      <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
        Configure compensation terms for each staff member with an employment agreement.
        Session: {sessionId.slice(0, 8)}...
      </p>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 13,
          color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      {staffWithAgreements.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            No staff members with employment agreements found. Complete the agreements
            step first.
          </p>
        </div>
      ) : (
        <>
          {staffWithAgreements.map((s) => (
            <StaffCard
              key={s.staffId}
              staff={s}
              form={forms[s.staffId] ?? defaultFormData()}
              onChange={(f) => updateForm(s.staffId, f)}
            />
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              disabled={!allValid || submitting}
              onClick={handleSubmit}
              style={allValid && !submitting ? btnPrimary : btnDisabled}
            >
              {submitting ? 'Saving...' : 'Set compensation for all staff'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
