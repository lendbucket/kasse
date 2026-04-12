export function magicLinkEmail(url: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Kasse</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#0d1117;border-radius:12px 12px 0 0;padding:32px 40px;">
              <span style="font-size:28px;font-weight:700;letter-spacing:0.2em;color:#ffffff;text-decoration:none;">
                KASSE
              </span>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="height:1px;background-color:#e5e7eb;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#0d1117;line-height:1.3;">
                Sign in to Kasse
              </h1>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#6b7280;">
                Click the button below to sign in. This link expires in 24 hours and can only be used once.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}" target="_blank" style="display:inline-block;background-color:#606E74;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;line-height:1;">
                      Sign In to Kasse
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Spacer -->
              <div style="height:32px;"></div>

              <!-- Security Note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
                      If you didn't request this email, you can safely ignore it. This link will expire in 24 hours.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Spacer -->
              <div style="height:24px;"></div>

              <!-- Fallback link -->
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#606E74;word-break:break-all;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="height:1px;background-color:#e5e7eb;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f9fafb;border-radius:0 0 12px 12px;padding:24px 40px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Kasse by Reyna Tech LLC
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
