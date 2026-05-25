import { escapeHtml } from "@/lib/emails/escape"

export function getVerificationEmailHtml({
  name,
  businessName,
  verifyUrl,
  baseUrl,
}: {
  name: string
  businessName: string
  verifyUrl: string
  baseUrl: string
}): string {
  const safeName = escapeHtml(name)
  const safeBusinessName = escapeHtml(businessName)

  const steps = [
    "Verify your email to activate your account",
    "Complete your business setup (takes 3 minutes)",
    "Add your team and services",
    "Start taking payments &mdash; Powered by SalonTransact",
  ]

  const stepsHtml = steps
    .map(
      (step, i) => `
    <tr>
      <td width="28" valign="top" style="padding-bottom:12px">
        <div style="width:22px;height:22px;background:#606E74;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:white">${i + 1}</div>
      </td>
      <td style="padding-left:10px;padding-bottom:12px">
        <p style="margin:0;font-size:14px;color:#374151">${step}</p>
      </td>
    </tr>`
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify your email &mdash; Kasse</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Plus Jakarta Sans',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">

  <!-- Preheader text (hidden, helps with spam) -->
  <div style="display:none;font-size:1px;color:#f7f8fa;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">
    Verify your email to activate your Kasse account for ${safeBusinessName}. This link expires in 24 hours.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f8fa;padding:40px 20px">
    <tr>
      <td align="center">

        <!-- Main container -->
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a0c0e;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:0.12em;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">kasse.</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:0.15em;text-transform:uppercase;margin-top:6px">Salon Management Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:48px 40px 32px">

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;text-align:center;letter-spacing:-0.3px">
                Welcome to Kasse, ${safeName}!
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;text-align:center;line-height:1.6">
                You're one step away from activating your account for<br>
                <strong style="color:#111827">${safeBusinessName}</strong>
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 32px">

              <!-- CTA -->
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6">
                Click the button below to verify your email address and get started. Your 14-day free trial begins the moment you verify.
              </p>

              <div style="text-align:center;margin:32px 0">
                <a href="${verifyUrl}" style="display:inline-block;background-color:#606E74;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:-0.2px;box-shadow:0 4px 12px rgba(96,110,116,0.3)">
                  Verify Email Address &rarr;
                </a>
              </div>

              <!-- Alt link -->
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#606E74;text-align:center;word-break:break-all">
                ${verifyUrl}
              </p>

            </td>
          </tr>

          <!-- Info box -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;border-left:1px solid #f3f4f6;border-right:1px solid #f3f4f6">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0">
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">
                      <strong style="color:#374151">This link expires in 24 hours.</strong> If you didn't create a Kasse account, you can safely ignore this email &mdash; no action is needed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's next -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 40px;border-left:1px solid #f3f4f6;border-right:1px solid #f3f4f6">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em">What happens next</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${stepsHtml}
              </table>
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
                <a href="${baseUrl}/privacy" style="color:#9ca3af;text-decoration:none">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="${baseUrl}/terms" style="color:#9ca3af;text-decoration:none">Terms of Service</a>
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
