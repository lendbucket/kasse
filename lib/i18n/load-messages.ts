import type { SupportedLocale, Namespace } from './config';
import { ALL_NAMESPACES, DEFAULT_LOCALE } from './config';

/**
 * Load translation messages for a given locale.
 * Loads from messages/{locale}/{namespace}.json files.
 *
 * Spanish files may be empty; falls back to en-US per-namespace.
 */
export async function loadMessages(
  locale: SupportedLocale,
): Promise<Record<string, unknown>> {
  const messages: Record<string, unknown> = {};

  for (const ns of ALL_NAMESPACES) {
    try {
      const localeData = (await import(`@/messages/${locale}/${ns}.json`)).default;
      const isEmpty = !localeData || Object.keys(localeData).length === 0;

      if (isEmpty && locale !== DEFAULT_LOCALE) {
        // Fall back to English for this namespace
        const fallback = (await import(`@/messages/${DEFAULT_LOCALE}/${ns}.json`)).default;
        messages[ns] = fallback;
      } else {
        messages[ns] = localeData;
      }
    } catch {
      // File doesn't exist — load English as fallback
      try {
        const fallback = (await import(`@/messages/${DEFAULT_LOCALE}/${ns}.json`)).default;
        messages[ns] = fallback;
      } catch {
        // Even English missing — empty object, runtime will surface missing keys
        messages[ns] = {};
      }
    }
  }

  return messages;
}
