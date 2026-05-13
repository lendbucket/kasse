/**
 * Redaction utilities for PII fields shown in email, logs, or UI.
 *
 * IMPORTANT: These functions are for DISPLAY redaction only. They do NOT
 * encrypt or remove the underlying data. Plaintext PII is still stored
 * in the database until Phase 0.6-c implements at-rest encryption.
 *
 * Phase 0.6-a uses these to stop plaintext PII from flowing into the
 * application submission email, which is the most acute exposure today.
 */

/**
 * Mask all but the last N characters of a string with bullet characters.
 * Example: maskExceptLast("123456789", 4) → "•••••6789"
 * If input is shorter than `keep`, returns all bullets.
 * Null/undefined/empty returns "—".
 */
export function maskExceptLast(value: string | null | undefined, keep: number = 4): string {
  if (!value || typeof value !== "string") return "\u2014";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "\u2014";
  if (trimmed.length <= keep) return "\u2022".repeat(trimmed.length);
  const maskedLength = trimmed.length - keep;
  return "\u2022".repeat(maskedLength) + trimmed.slice(-keep);
}

/**
 * Redact a routing number (9 digits) to show only last 4.
 * Example: "021000021" → "•••••0021"
 */
export function redactRoutingNumber(routing: string | null | undefined): string {
  return maskExceptLast(routing, 4);
}

/**
 * Redact a bank account number to show only last 4.
 * Example: "1234567890" → "••••••7890"
 */
export function redactBankAccount(account: string | null | undefined): string {
  return maskExceptLast(account, 4);
}

/**
 * Redact an EIN (Employer Identification Number, format XX-XXXXXXX) to
 * show only last 4.
 * Example: "42-1815436" → "•••••5436"
 */
export function redactEIN(ein: string | null | undefined): string {
  if (!ein) return "\u2014";
  // Strip any non-digit characters for consistent masking, then re-format
  const digits = ein.replace(/[^0-9]/g, "");
  return maskExceptLast(digits, 4);
}

/**
 * Redact SSN-last-4 (which is already only 4 digits) — show as bullets.
 * The semantic here is: we DON'T even want last-4 in the email since
 * SSN-last-4 is itself sensitive (combined with name+DOB enables identity
 * theft). Display as "•••• (stored)" to indicate it exists without showing
 * any digits.
 */
export function redactSsnLast4(ssn: string | null | undefined): string {
  if (!ssn) return "\u2014";
  return "\u2022\u2022\u2022\u2022 (stored)";
}

/**
 * Redact a date of birth — show only year, e.g. "1985-03-15" → "1985"
 * For email display, we don't show full DOB; year alone is enough for
 * adult-vs-minor verification context without enabling identity theft.
 */
export function redactDob(dob: string | null | undefined): string {
  if (!dob) return "\u2014";
  const yearMatch = dob.match(/^(\d{4})/);
  return yearMatch ? `${yearMatch[1]} (stored)` : "\u2014";
}

/**
 * Redact bank account holder name — show first character + mask rest of
 * each word. Example: "John Smith" → "J••• S••••"
 * This is softer redaction since the name isn't sensitive on its own, but
 * the combination of full-name + routing-number + last-4-account in one
 * email is the worst case. Redacting the name as well prevents the email
 * from being a one-stop-shop for account takeover.
 */
export function redactName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "\u2014";
  const parts = name.trim().split(/\s+/);
  return parts
    .map(part => part.length <= 1 ? part : part[0] + "\u2022".repeat(part.length - 1))
    .join(" ");
}
