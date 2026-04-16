export function getMerchantApplicationEmailHtml({
  ownerFirstName,
  ownerLastName,
  businessName,
  monthlyVolume,
  avgTicket,
}: {
  ownerFirstName: string
  ownerLastName: string
  businessName: string
  monthlyVolume: string
  avgTicket: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SalonTransact Merchant Application</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <div style="display:none;font-size:1px;color:#f7f8fa;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">
    Your SalonTransact merchant application for ${businessName}. Complete the application to start accepting card payments.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f8fa;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">
          <tr>
            <td style="background-color:#0a0c0e;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:0.12em;font-family:Georgia,serif">kasse.</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.15em;text-transform:uppercase;margin-top:6px">Powered by SalonTransact</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:48px 40px 32px;border-left:1px solid #f3f4f6;border-right:1px solid #f3f4f6">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px">
                Merchant Application Received
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6">
                Hi ${ownerFirstName}, we've received your merchant application for <strong style="color:#111827">${businessName}</strong>. Here's a summary:
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:8px 0;font-size:14px;color:#6b7280">Business Name</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;text-align:right">${businessName}</td></tr>
                <tr><td style="padding:8px 0;font-size:14px;color:#6b7280">Owner</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;text-align:right">${ownerFirstName} ${ownerLastName}</td></tr>
                <tr><td style="padding:8px 0;font-size:14px;color:#6b7280">Est. Monthly Volume</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;text-align:right">${monthlyVolume}</td></tr>
                <tr><td style="padding:8px 0;font-size:14px;color:#6b7280">Avg. Ticket Size</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;text-align:right">${avgTicket}</td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151">What happens next?</p>
              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6">
                Our underwriting team at Payroc will review your application. Approval typically takes <strong style="color:#111827">1-3 business days</strong>. We'll email you once your account is approved and ready to accept payments.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-radius:0 0 12px 12px;padding:24px 40px;border:1px solid #f3f4f6;text-align:center">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">Kasse by Reyna Tech LLC</p>
              <p style="margin:0;font-size:12px;color:#9ca3af">Payments powered by <strong style="color:#606E74">SalonTransact</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
