'use client';

import { useTranslations } from 'next-intl';

interface TProps {
  /** Translation key, optionally with namespace prefix: 'common:welcome' or 'customer:booking.title' */
  id: string;
  /** Variables for interpolation */
  values?: Record<string, string | number | Date>;
  /** Fallback text if translation missing */
  fallback?: string;
}

/**
 * Inline translation component.
 *
 * Usage:
 *   <T id="common:welcome" />
 *   <T id="customer:booking.title" values={{ name: "Sarah" }} />
 *   <T id="customer:next_appointment" values={{ date: new Date() }} fallback="Next appointment" />
 */
export function T({ id, values, fallback }: TProps) {
  const [namespace, key] = id.includes(':') ? id.split(':', 2) : ['common', id];
  const t = useTranslations(namespace);
  try {
    return <>{t(key, values as Record<string, string | number>)}</>;
  } catch {
    return <>{fallback ?? id}</>;
  }
}
