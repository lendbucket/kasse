export function getPasswordResetEmailHtml({
  resetUrl,
}: {
  resetUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset your Kasse password</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Plus Jakarta Sans',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">

  <!-- Preheader text (hidden, helps deliverability) -->
  <div style="display:none;font-size:1px;color:#f7f8fa;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">
    Reset your Kasse password. This link expires in 1 hour. If you didn't request this, your account is safe.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f8fa;padding:40px 20px">
    <tr>
      <td align="center">

        <!-- Main container -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a0c0e;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:0.12em;font-family:Georgia,serif">kasse.</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.15em;text-transform:uppercase;margin-top:6px">Salon Management Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:48px 40px 32px">

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.3px">
                Reset your password
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;text-align:center;line-height:1.6">
                We received a request to reset the password for your Kasse account.
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 32px">

              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6">
                Click the button below to choose a new password. For security, this link will expire in <strong>1 hour</strong>.
              </p>

              <div style="text-align:center;margin:32px 0">
                <a href="${resetUrl}" style="display:inline-block;background-color:#606E74;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:-0.2px;box-shadow:0 4px 12px rgba(96,110,116,0.3)">
                  Reset Password &rarr;
                </a>
              </div>

              <!-- Alt link -->
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#606E74;text-align:center;word-break:break-all">
                ${resetUrl}
              </p>

            </td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;border-left:1px solid #f3f4f6;border-right:1px solid #f3f4f6">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">
                <strong style="color:#374151">This link expires in 1 hour.</strong> If you didn't request a password reset, your account is safe &mdash; no changes were made. You can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-radius:0 0 12px 12px;padding:24px 40px;border:1px solid #f3f4f6;text-align:center">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">Kasse by Reyna Tech LLC</p>
              <p style="margin:0 0 12px;font-size:12px;color:#9ca3af">
                Payments powered by
                <strong style="color:#606E74">SalonTransact</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#d1d5db">
                5601 S Padre Island Dr Ste E, Corpus Christi, TX 78412
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#d1d5db">
                <a href="#" style="color:#9ca3af;text-decoration:none">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="#" style="color:#9ca3af;text-decoration:none">Terms of Service</a>
                &nbsp;&middot;&nbsp;
                <a href="#" style="color:#9ca3af;text-decoration:none">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
