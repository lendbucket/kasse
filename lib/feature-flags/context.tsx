'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FlagEvaluationResult } from './types';

const FlagContext = createContext<Record<string, FlagEvaluationResult>>({});

export function FlagProvider({
  flags,
  children,
}: {
  flags: Record<string, FlagEvaluationResult>;
  children: ReactNode;
}) {
  return <FlagContext.Provider value={flags}>{children}</FlagContext.Provider>;
}

/**
 * Read a feature flag value. Returns false if the flag hasn't been hydrated
 * into context (safer default than throwing).
 *
 * Usage:
 *   const showNewBookingFlow = useFlag('new-booking-flow');
 *   if (showNewBookingFlow) { ... }
 */
export function useFlag(key: string): boolean {
  const flags = useContext(FlagContext);
  return flags[key]?.enabled ?? false;
}

/**
 * Read a feature flag with its evaluation source. Useful for debugging.
 */
export function useFlagResult(key: string): FlagEvaluationResult {
  const flags = useContext(FlagContext);
  return flags[key] ?? { key, enabled: false, source: 'MISSING' };
}
