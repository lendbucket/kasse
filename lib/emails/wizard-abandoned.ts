/**
 * Email template sent by /api/cron/onboarding-abandoned when a
 * signup session has been inactive >24h without completing. One-shot:
 * each session receives this email at most once (tracked via
 * OnboardingSession.abandonedEmailSentAt).
 *
 * Mirrors password-reset.ts: no user-supplied personalization. Only
 * resumeUrl and baseUrl are interpolated, both server-controlled.
 *
 * The cron route uses a claim-then-send pattern: it stamps
 * OnboardingSession.abandonedEmailSentAt BEFORE calling
 * resend.emails.send, via a conditional updateMany that atomically
 * claims the session if and only if abandonedEmailSentAt is still
 * NULL. This prevents double-send when overlapping cron invocations
 * read the same un-emailed session. Trade-off: a Resend failure
 * after the stamp leaves the session un-emailed with no retry —
 * acceptable for recovery emails where miss-once is better than
 * send-twice. See PR #122 cycle 3 rationale in
 * /api/cron/onboarding-abandoned/route.ts comments.
 */
export function getWizardAbandonedEmailHtml({
  resumeUrl,
  baseUrl,
}: {
  resumeUrl: string
  baseUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Finish setting up your Kasse account</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f8fa;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827">
  <div style="display:none;max-height:0;overflow:hidden;visibility:hidden;mso-hide:all">
    Your Kasse account is one step away. Pick up where you left off.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7f8fa">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04)">
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 32px">
              <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:0.12em;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">kasse.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.4px">
                Finish setting up your account
              </h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151">
                We noticed you started signing up for Kasse but didn't finish. Your account is saved — just pick up where you left off.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">
                <tr>
                  <td style="background-color:#606E74;border-radius:6px">
                    <a href="${resumeUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none">
                      Resume signup
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280">
                This link is valid for 7 days. If you have questions, reply to this email or reach us at <a href="mailto:onboarding@kasseapp.com" style="color:#606E74;text-decoration:underline">onboarding@kasseapp.com</a>.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">
                If you've changed your mind, no action needed — your session will expire automatically.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 32px;text-align:center">
              <p style="margin:0;font-size:11px;color:#9ca3af">
                © Kasse — a 36 West Holdings company
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
