"use client";

import type { ReactElement } from "react";
import type { VerticalTerms } from "@/lib/verticals/types";
import { useVerticalTerms } from "@/lib/verticals/useVerticalConfig";

/**
 * Renders a vertical-aware term. Replaces hardcoded strings like
 * "Client" / "Customer" / "Patient" / "Member" with the right word
 * for the current org's vertical.
 *
 * Usage:
 *   <VerticalTerm name="client" />              // "Guest" for salon, "Patient" for med spa
 *   <VerticalTerm name="client" plural />       // "Guests" / "Patients"
 *   <VerticalTerm name="staff" case="lower" />  // "stylist" / "barber"
 *   <VerticalTerm name="staff" case="upper" />  // "STYLIST" / "BARBER"
 *
 * Falls back to the singular if plural form isn't defined (shouldn't
 * happen — VerticalTerms requires both singular and plural for each).
 */

type TermName = keyof Pick<VerticalTerms, 'staff' | 'client' | 'service' | 'location' | 'appointment'>;
type CaseTransform = 'lower' | 'upper' | 'title';

export type VerticalTermProps = {
  name: TermName;
  plural?: boolean;
  case?: CaseTransform;
};

function applyCase(text: string, transform?: CaseTransform): string {
  switch (transform) {
    case 'lower': return text.toLowerCase();
    case 'upper': return text.toUpperCase();
    case 'title': return text.replace(/\b\w/g, c => c.toUpperCase());
    default: return text;
  }
}

/**
 * Pure function that picks the right term + plural + case transform.
 * Extracted for unit testing without needing to render the React component.
 */
export function resolveVerticalTerm(input: {
  terms: VerticalTerms;
  name: TermName;
  plural?: boolean;
  caseTransform?: CaseTransform;
}): string {
  const { terms, name, plural, caseTransform } = input;
  const pluralKey = `${name}Plural` as keyof VerticalTerms;
  const raw = plural ? terms[pluralKey] : terms[name];
  return applyCase(raw, caseTransform);
}

export function VerticalTerm({ name, plural, case: caseTransform }: VerticalTermProps): ReactElement {
  const terms = useVerticalTerms();
  return <>{resolveVerticalTerm({ terms, name, plural, caseTransform })}</>;
}
