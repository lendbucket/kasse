export interface StaffInviteEmailParams {
  inviterName: string;
  organizationName: string;
  locationName: string;
  inviteeName: string;
  acceptUrl: string;
  expiresAt: Date;
}

/**
 * Escape HTML special characters in user-supplied display strings.
 * Defense-in-depth: even though all values here come from server-side
 * DB rows (not user request input), they originate from owner-supplied
 * org/location/staff names that could contain HTML special chars.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderStaffInviteEmail(
  params: StaffInviteEmailParams
): { html: string; text: string; subject: string } {
  const {
    inviterName,
    organizationName,
    locationName,
    inviteeName,
    expiresAt,
  } = params;

  // Defensive: encodeURI ensures any unexpected characters in the URL
  // can't break HTML attribute quoting or inject elements.
  const acceptUrl = encodeURI(params.acceptUrl);

  // Format expiry as UTC date — timezone-neutral, accurate for "in 7 days"
  const expiresHuman = expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }) + ' UTC';

  const subject = `${inviterName} invited you to join ${organizationName} on Kasse`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7f8fa; color: #111827;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f7f8fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #111827;">
                You've been invited to join ${escapeHtml(organizationName)}
              </h1>
              <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                Hi ${escapeHtml(inviteeName)},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                ${escapeHtml(inviterName)} has invited you as a <strong>Stylist</strong> at <strong>${escapeHtml(locationName)}</strong>. Click the button below to create your account and get started.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background: #606E74; border-radius: 8px;">
                    <a href="${acceptUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                Or copy this link into your browser:
              </p>
              <p style="margin: 0 0 32px 0; font-size: 12px; line-height: 1.4; color: #6b7280; word-break: break-all;">
                ${acceptUrl}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                This invitation expires <strong>${expiresHuman}</strong>.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 24px 0;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
          Kasse &middot; Reyna Tech LLC
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `You've been invited to join ${organizationName}

Hi ${inviteeName},

${inviterName} has invited you as a Stylist at ${locationName}. Click the link below to create your account and get started.

${acceptUrl}

This invitation expires ${expiresHuman}.

If you weren't expecting this invitation, you can safely ignore this email.

— Kasse · Reyna Tech LLC
`;

  return { html, text, subject };
}
