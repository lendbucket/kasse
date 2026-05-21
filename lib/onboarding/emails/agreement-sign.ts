export interface AgreementSignEmailParams {
  staffName: string;
  organizationName: string;
  templateType: string;
  compensationSummary: string;
  effectiveStartDate: string;
  signingUrl: string;
  expiresAt: Date;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build a brief compensation summary string for the email body.
 * Keeps the email concise — full details are in the PDF.
 */
export function buildCompensationSummary(comp: {
  modelType: string;
  baseHourlyRateCents: number | null;
  baseCommissionPct: number | null;
  boothRentCents: number | null;
  boothRentFrequency: string | null;
}): string {
  switch (comp.modelType) {
    case 'W2':
      return comp.baseHourlyRateCents != null
        ? `W-2 Employee — $${(comp.baseHourlyRateCents / 100).toFixed(2)}/hr`
        : 'W-2 Employee';
    case '1099_COMMISSION':
      return comp.baseCommissionPct != null
        ? `1099 Commission — ${comp.baseCommissionPct}% base`
        : '1099 Commission';
    case 'BOOTH_RENT':
      return comp.boothRentCents != null
        ? `Booth Rent — $${(comp.boothRentCents / 100).toFixed(2)} ${comp.boothRentFrequency?.toLowerCase() ?? ''}`
        : 'Booth Rent';
    case 'HYBRID':
      return comp.baseHourlyRateCents != null && comp.baseCommissionPct != null
        ? `Hybrid — $${(comp.baseHourlyRateCents / 100).toFixed(2)}/hr + ${comp.baseCommissionPct}% commission`
        : 'Hybrid (hourly + commission)';
    default:
      return comp.modelType;
  }
}

export function renderAgreementSignEmail(
  params: AgreementSignEmailParams
): { html: string; text: string; subject: string } {
  const {
    staffName,
    organizationName,
    templateType,
    compensationSummary,
    effectiveStartDate,
    expiresAt,
  } = params;

  // Validate signing URL format. The URL is server-constructed from
  // BASE_URL + hex token, so it should always be valid. Using URL()
  // constructor instead of encodeURI to avoid double-encoding risk.
  let signingUrl: string;
  try {
    signingUrl = new URL(params.signingUrl).toString();
  } catch {
    signingUrl = params.signingUrl;
  }

  const expiresHuman = expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }) + ' UTC';

  const subject = `Sign your employment agreement with ${organizationName}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7f8fa; color: #111827;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f7f8fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #111827;">
                Your employment agreement is ready
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                Hi ${escapeHtml(staffName)},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                ${escapeHtml(organizationName)} has prepared your employment agreement for your signature. Please review and sign at the link below.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background: #606E74; border-radius: 8px;">
                    <a href="${signingUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Review and Sign
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                Or copy this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.4; color: #6b7280; word-break: break-all;">
                ${signingUrl}
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f7f8fa; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #374151;">Agreement details:</p>
                    <p style="margin: 0 0 3px 0; font-size: 13px; color: #4b5563;">${escapeHtml(templateType)} employment terms</p>
                    <p style="margin: 0 0 3px 0; font-size: 13px; color: #4b5563;">Compensation: ${escapeHtml(compensationSummary)}</p>
                    <p style="margin: 0; font-size: 13px; color: #4b5563;">Effective: ${escapeHtml(effectiveStartDate)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                This link expires <strong>${expiresHuman}</strong>.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 24px 0;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                If you have questions about this agreement, reply to this email or contact your employer directly.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
          Sent by Kasse on behalf of ${escapeHtml(organizationName)} &middot; Reyna Tech LLC
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Your employment agreement is ready

Hi ${staffName},

${organizationName} has prepared your employment agreement for your signature. Please review and sign at the link below.

${params.signingUrl}

Agreement details:
- ${templateType} employment terms
- Compensation: ${compensationSummary}
- Effective: ${effectiveStartDate}

This link expires ${expiresHuman}.

If you have questions about this agreement, reply to this email or contact your employer directly.

— Sent by Kasse on behalf of ${organizationName} · Reyna Tech LLC
`;

  return { html, text, subject };
}
