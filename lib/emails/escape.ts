/**
 * HTML-escape user-supplied data before interpolating into email HTML.
 *
 * Email clients don't execute JavaScript so this is not an XSS
 * mitigation — it's a correctness mitigation for names like
 * "O'Reilly & Sons" or "<test> Salon" that would otherwise render with
 * literal special characters that break HTML rendering.
 *
 * Covers the five HTML entity references that matter inside element
 * content: `&`, `<`, `>`, `"`, and `'`. The order matters: `&` MUST be
 * first to avoid double-escaping (e.g. `<` → `&lt;` then `&` → `&amp;`
 * would produce `&amp;lt;`).
 *
 * Use this for:
 * - User-supplied data interpolated into email HTML bodies (names,
 *   business names, free-text fields from forms)
 *
 * DO NOT use this for:
 * - Server-controlled URLs (process.env.NEXTAUTH_URL, dashboardUrl,
 *   resetUrl, etc.) — already trusted, escaping adds noise
 * - Email subject lines — RFC 5322 plain text, Resend handles
 *   sanitization at the SMTP layer
 * - URL query parameters — different encoding rules; use
 *   encodeURIComponent instead
 *
 * Refs: P1.A.15 cycle 4 (PR #115), template hardening (PR #117),
 * docs/RLS_AUDIT.md "Email template hardening" section.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
