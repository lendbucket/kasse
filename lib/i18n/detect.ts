import type { SupportedLocale } from './config';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, isSupportedLocale } from './config';

export interface LocaleDetectionContext {
  userLocale: string | null | undefined;
  organizationDefaultLocale: string | null | undefined;
  acceptLanguageHeader: string | null | undefined;
}

/**
 * Resolve the locale for a request following the priority chain:
 * 1. User.locale (if authenticated and set)
 * 2. Organization.defaultLocale (if authenticated and org has one)
 * 3. Accept-Language header parse
 * 4. DEFAULT_LOCALE (en-US)
 */
export function detectLocale(ctx: LocaleDetectionContext): SupportedLocale {
  if (isSupportedLocale(ctx.userLocale)) {
    return ctx.userLocale;
  }
  if (isSupportedLocale(ctx.organizationDefaultLocale)) {
    return ctx.organizationDefaultLocale;
  }
  const fromHeader = parseAcceptLanguage(ctx.acceptLanguageHeader);
  if (fromHeader) {
    return fromHeader;
  }
  return DEFAULT_LOCALE;
}

/**
 * Parse Accept-Language header into the best supported locale.
 * Header format: "en-US,en;q=0.9,es;q=0.7,fr;q=0.5"
 */
export function parseAcceptLanguage(
  header: string | null | undefined,
): SupportedLocale | null {
  if (!header) return null;

  const entries = header
    .split(',')
    .map((entry) => {
      const [tag, ...rest] = entry.trim().split(';');
      const qMatch = rest.join(';').match(/q=([\d.]+)/);
      const q = qMatch ? parseFloat(qMatch[1]) : 1.0;
      return { tag: tag.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  // Try exact match first (e.g., 'es-mx' -> 'es-MX')
  for (const entry of entries) {
    const exact = SUPPORTED_LOCALES.find((loc) => loc.toLowerCase() === entry.tag);
    if (exact) return exact;
  }

  // Try language-only match (e.g., 'es' -> 'es-MX' as default Spanish)
  for (const entry of entries) {
    const langOnly = entry.tag.split('-')[0];
    if (langOnly === 'es') return 'es-MX';
    if (langOnly === 'en') return 'en-US';
  }

  return null;
}
