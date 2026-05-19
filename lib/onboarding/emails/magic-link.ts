export interface MagicLinkEmailParams {
  verificationUrl: string;
  expiresAt: Date;
}

export function renderMagicLinkEmail(
  params: MagicLinkEmailParams
): { html: string; text: string } {
  const { verificationUrl: rawUrl, expiresAt } = params;

  // Defensive: although verificationUrl is constructed from operator-controlled
  // env var + cryptographic hex token, encodeURI ensures any unexpected
  // characters in NEXT_PUBLIC_ONBOARDING_BASE_URL can't break HTML attribute
  // quoting or inject elements.
  const verificationUrl = encodeURI(rawUrl);
  const expiresHuman = expiresAt.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Verify your Kasse email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f7f8fa; color: #111827;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f7f8fa; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="560" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #111827;">
                Verify your email to continue
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
                Click the button below to verify your email and continue setting up your Kasse account. This link expires <strong>${expiresHuman}</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td style="background: #606E74; border-radius: 8px;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">
                Or copy this link into your browser:
              </p>
              <p style="margin: 0 0 32px 0; font-size: 12px; line-height: 1.4; color: #6b7280; word-break: break-all;">
                ${verificationUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 24px 0;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">
                If you didn't request this, you can safely ignore this email. Someone else may have entered your email by mistake.
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

  const text = `Verify your email to continue

Click this link to verify your email and continue setting up your Kasse account. The link expires ${expiresHuman}.

${verificationUrl}

If you didn't request this, you can safely ignore this email.

— Kasse · Reyna Tech LLC
`;

  return { html, text };
}
