export const SUPPORTED_LOCALES = ['en-US', 'es-MX', 'es-US'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

/**
 * Spanish locales (used to determine if Spanish content should load).
 */
export const SPANISH_LOCALES: SupportedLocale[] = ['es-MX', 'es-US'];

/**
 * Customer-facing namespace keys. These are the namespaces that get Spanish
 * translations for v1 per SD-K-032.
 */
export const CUSTOMER_FACING_NAMESPACES = ['common', 'customer'] as const;
export type CustomerFacingNamespace = (typeof CUSTOMER_FACING_NAMESPACES)[number];

/**
 * All namespaces (including English-only). Used by next-intl message loading.
 */
export const ALL_NAMESPACES = ['common', 'customer', 'owner', 'stylist', 'admin'] as const;
export type Namespace = (typeof ALL_NAMESPACES)[number];

export function isSupportedLocale(
  value: string | null | undefined,
): value is SupportedLocale {
  return value != null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isSpanish(locale: SupportedLocale): boolean {
  return SPANISH_LOCALES.includes(locale);
}
