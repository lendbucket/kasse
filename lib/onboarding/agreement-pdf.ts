/**
 * Server-side PDF generation for EmploymentAgreements.
 *
 * Uses @react-pdf/renderer to produce a PDF from agreement data.
 * Runs on the server in a Vercel Function — no browser needed.
 *
 * Font: Helvetica (baked into @react-pdf/renderer). Inter deferred
 * to avoid CDN network dependency per render.
 */
import React from 'react';
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

export interface AgreementPDFInput {
  agreement: {
    id: string;
    templateType: string | null;
    documentTitle: string;
    notes: string | null;
  };
  staff: {
    id: string;
    name: string | null;
    email: string | null;
  };
  organization: {
    name: string;
  };
  compensation: {
    modelType: string;
    baseHourlyRateCents: number | null;
    baseCommissionPct: number | null;
    boothRentCents: number | null;
    boothRentFrequency: string | null;
    overtimeMultiplier: number;
    overtimeThresholdHours: number;
    retailCommissionPct: number | null;
    includeTipsInCommission: boolean;
    productDeductionEnabled: boolean;
    effectiveStartDate: Date;
    effectiveEndDate: Date | null;
    notes: string | null;
  } | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111827',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#606E74',
    paddingBottom: 12,
  },
  orgName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    color: '#606E74',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 18,
    marginBottom: 6,
    color: '#111827',
  },
  row: {
    flexDirection: 'row' as const,
    marginBottom: 3,
  },
  label: {
    width: 180,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#374151',
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  notes: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f7f8fa',
    borderRadius: 4,
    fontSize: 10,
    color: '#374151',
  },
  signatureSection: {
    marginTop: 36,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 18,
  },
  signatureLine: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    width: 250,
    paddingBottom: 4,
    fontSize: 10,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 30,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
});

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function DataRow({ label, value }: { label: string; value: string }) {
  return React.createElement(View, { style: styles.row },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.value }, value),
  );
}

function CompensationSection({ comp }: { comp: NonNullable<AgreementPDFInput['compensation']> }) {
  const rows: Array<{ label: string; value: string }> = [];

  rows.push({ label: 'Compensation Model', value: comp.modelType.replace(/_/g, ' ') });

  if (comp.modelType === 'W2' || comp.modelType === 'HYBRID') {
    if (comp.baseHourlyRateCents != null) {
      rows.push({ label: 'Base Hourly Rate', value: `${formatCents(comp.baseHourlyRateCents)}/hr` });
    }
    rows.push({ label: 'Overtime Multiplier', value: `${comp.overtimeMultiplier}x` });
    rows.push({ label: 'Overtime Threshold', value: `${comp.overtimeThresholdHours} hrs/week` });
  }

  if (comp.modelType === '1099_COMMISSION' || comp.modelType === 'HYBRID') {
    if (comp.baseCommissionPct != null) {
      rows.push({ label: 'Base Commission', value: `${comp.baseCommissionPct}%` });
    }
    if (comp.retailCommissionPct != null) {
      rows.push({ label: 'Retail Commission', value: `${comp.retailCommissionPct}%` });
    }
    rows.push({ label: 'Tips in Commission', value: comp.includeTipsInCommission ? 'Yes' : 'No' });
  }

  if (comp.modelType === '1099_COMMISSION') {
    rows.push({ label: 'Product Deduction', value: comp.productDeductionEnabled ? 'Enabled' : 'Disabled' });
  }

  if (comp.modelType === 'BOOTH_RENT') {
    if (comp.boothRentCents != null) {
      rows.push({ label: 'Booth Rent', value: formatCents(comp.boothRentCents) });
    }
    if (comp.boothRentFrequency) {
      rows.push({ label: 'Rent Frequency', value: comp.boothRentFrequency });
    }
  }

  return React.createElement(View, null,
    ...rows.map((r, i) => React.createElement(DataRow, { key: i, label: r.label, value: r.value })),
  );
}

function AgreementDocument({ input }: { input: AgreementPDFInput }) {
  const { agreement, staff, organization, compensation } = input;
  const now = new Date();

  return React.createElement(Document, null,
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.orgName }, organization.name),
        React.createElement(Text, { style: styles.title }, agreement.documentTitle),
      ),

      // Parties
      React.createElement(Text, { style: styles.sectionTitle }, 'Parties'),
      React.createElement(DataRow, { label: 'Employer', value: organization.name }),
      React.createElement(DataRow, { label: 'Employee / Contractor', value: staff.name ?? '(unnamed)' }),
      staff.email ? React.createElement(DataRow, { label: 'Email', value: staff.email }) : null,
      React.createElement(DataRow, { label: 'Agreement Type', value: agreement.templateType ?? 'Not specified' }),

      // Compensation Terms
      React.createElement(Text, { style: styles.sectionTitle }, 'Compensation Terms'),
      compensation
        ? React.createElement(CompensationSection, { comp: compensation })
        : React.createElement(Text, { style: styles.value }, 'Compensation terms not yet configured.'),

      // Effective Period
      React.createElement(Text, { style: styles.sectionTitle }, 'Effective Period'),
      compensation
        ? React.createElement(View, null,
            React.createElement(DataRow, {
              label: 'Start Date',
              value: formatDate(compensation.effectiveStartDate),
            }),
            compensation.effectiveEndDate
              ? React.createElement(DataRow, {
                  label: 'End Date',
                  value: formatDate(compensation.effectiveEndDate),
                })
              : React.createElement(DataRow, { label: 'End Date', value: 'Ongoing (no end date)' }),
          )
        : React.createElement(Text, { style: styles.value }, 'Not specified.'),

      // Notes
      (agreement.notes || compensation?.notes)
        ? React.createElement(View, null,
            React.createElement(Text, { style: styles.sectionTitle }, 'Notes'),
            agreement.notes
              ? React.createElement(Text, { style: styles.notes }, agreement.notes)
              : null,
            compensation?.notes
              ? React.createElement(Text, { style: styles.notes }, compensation.notes)
              : null,
          )
        : null,

      // Signatures
      React.createElement(View, { style: styles.signatureSection },
        React.createElement(Text, { style: styles.sectionTitle }, 'Signatures'),
        React.createElement(View, { style: { marginBottom: 24 } },
          React.createElement(Text, { style: styles.signatureLine }, ''),
          React.createElement(Text, { style: styles.signatureLabel }, `Employer / Owner — ${organization.name}`),
        ),
        React.createElement(View, null,
          React.createElement(Text, { style: styles.signatureLine }, ''),
          React.createElement(Text, { style: styles.signatureLabel },
            `${staff.name ?? 'Employee'} — To be signed electronically (see link in email)`),
        ),
      ),

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, `Agreement ID: ${agreement.id}`),
        React.createElement(Text, null, `Generated: ${now.toISOString().slice(0, 10)}`),
        React.createElement(Text, null, 'Generated by Kasse — kasseapp.com'),
      ),
    ),
  );
}

/**
 * Render an EmploymentAgreement to a PDF buffer.
 * Throws if compensation is null (should never fire in practice).
 */
export async function renderEmploymentAgreementPDF(
  input: AgreementPDFInput
): Promise<Buffer> {
  if (!input.compensation) {
    throw new Error(
      '[agreement-pdf] compensation is null — PDF generation requires ' +
      'compensation data. Ensure the session is at COMPENSATION_CONFIGURED.'
    );
  }

  const element = React.createElement(AgreementDocument, { input }) as any;
  return await renderToBuffer(element);
}
