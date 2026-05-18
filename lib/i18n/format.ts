import type { SupportedLocale } from './config';

/**
 * Format a date using Intl.DateTimeFormat for the given locale.
 */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat(
    locale,
    options ?? {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  ).format(d);
}

/**
 * Format a number as currency. amountCents is integer cents (Kasse standard).
 */
export function formatCurrency(
  amountCents: number,
  locale: SupportedLocale,
  currency: string = 'USD',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

/**
 * Format a number with locale-appropriate separators.
 */
export function formatNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "hace 2 horas").
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: SupportedLocale,
  now: Date = new Date(),
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const diffMs = d.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return formatter.format(diffSeconds, 'second');
  }
  if (Math.abs(diffSeconds) < 3600) {
    return formatter.format(Math.round(diffSeconds / 60), 'minute');
  }
  if (Math.abs(diffSeconds) < 86400) {
    return formatter.format(Math.round(diffSeconds / 3600), 'hour');
  }
  if (Math.abs(diffSeconds) < 2592000) {
    return formatter.format(Math.round(diffSeconds / 86400), 'day');
  }
  if (Math.abs(diffSeconds) < 31536000) {
    return formatter.format(Math.round(diffSeconds / 2592000), 'month');
  }
  return formatter.format(Math.round(diffSeconds / 31536000), 'year');
}
