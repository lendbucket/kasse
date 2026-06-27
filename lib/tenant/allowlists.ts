/**
 * Field allowlists for tenant-owner-writable PATCH endpoints.
 *
 * Each allowlist defines exactly which fields a logged-in owner can write
 * through a given operation context. The pickAllowed helper drops any field
 * NOT in the allowlist silently — there is no error to the client.
 *
 * SILENT-DROP TRADEOFF: a UI that sends a field missing from the allowlist
 * appears to succeed but the data isn't persisted. This is deliberate (forgiving
 * client-side mismatches) but creates a maintenance hazard: a new schema field
 * added to UI + DB but forgotten in the allowlist silently fails to save.
 *
 * Mitigation: when adding fields to schema.prisma, audit every allowlist in
 * this file in the same PR. Consider adding a test that asserts every
 * Organization (and BusinessSettings, etc.) field appears in at least one
 * allowlist OR is documented as system-only.
 *
 * Source of truth: prisma/schema.prisma. Fields managed elsewhere (admin portal,
 * system counters, webhook handlers) MUST NOT be added to these allowlists.
 *
 * See docs/RLS_AUDIT.md for the canonical route-to-allowlist mapping.
 */

/**
 * Organization fields an org owner may modify via PATCH /api/settings.
 *
 * Excluded by design (and the reason for each):
 *   id, slug, createdAt, updatedAt              → system-managed
 *   isFranchise, franchise* fees, parentOrgId   → franchise admin only
 *   plan, planStatus, trialEndsAt               → billing — admin only
 *   stripeCustomerId, stripeSubId, salonTransactId → 3rd-party IDs — system
 *   applicationStatus, applicationSubmittedAt   → onboarding state — system
 *   onboardingStep, onboardingCompleted         → onboarding state — system
 *   sourceSystem                                → system metadata
 *   ein, ownerSsnLast4, ownerDob, ownershipPercentage → KYC — admin only
 *   bank*                                       → banking — admin only after submit
 *   monthlyVolume, avgTransaction               → underwriting — admin only
 */
export const ORGANIZATION_ALLOWED_FIELDS = new Set<string>([
  "name",
  "email",
  "phone",
  "website",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "timezone",
  "language",
  "logoUrl",
  "primaryColor",
  "legalName",
  "businessStructure",
  "yearEstablished",
  "businessType",
  "description",
  "teamSize",
  "dbaName",
  "ownerFirstName",
  "ownerLastName",
  "ownerTitle",
  "ownerAddress",
  "paymentMethods",
]);

/**
 * Organization fields an org owner may modify ONLY through the onboarding wizard
 * (routes under /api/onboarding/*). These are the application/KYC/banking fields
 * that ORGANIZATION_ALLOWED_FIELDS deliberately excludes for the general
 * /api/settings PATCH path.
 *
 * The two-allowlist pattern reflects that different operation contexts have
 * different write permissions:
 *   - /api/settings → ORGANIZATION_ALLOWED_FIELDS (profile, identity, branding)
 *   - /api/onboarding/* → ORGANIZATION_ONBOARDING_ALLOWED_FIELDS (compliance, banking)
 *
 * Both allowlists are silent (extra fields are dropped, not rejected) to keep
 * the API forgiving on client mismatches.
 *
 * IMPORTANT TRADEOFF: silent-drop means that if a UI sends a field that's
 * missing from the allowlist, the write fails silently — no error to the
 * client, no log entry. A future regression (a field added to schema and UI
 * but forgotten here) would be invisible until someone notices data isn't
 * persisting. When adding new Organization fields to schema.prisma, audit
 * both allowlists at the same time and consider adding a test that asserts
 * every schema field is mentioned in at least one allowlist.
 */
export const ORGANIZATION_ONBOARDING_ALLOWED_FIELDS = new Set<string>([
  // Application progress tracking
  "applicationStatus",
  "applicationSubmittedAt",
  "onboardingStep",
  "onboardingCompleted",

  // Business identity (some overlap with settings, repeated for clarity)
  "name",
  "legalName",
  "dbaName",
  "businessStructure",
  "businessType",
  "stateOfFormation",
  "yearEstablished",
  "ein",
  "description",
  "website",
  "phone",
  "email",
  "teamSize",
  "primaryColor",
  "logoUrl",

  // Address
  "address",
  "city",
  "state",
  "zip",
  "country",
  "timezone",
  "language",

  // Owner / KYC
  "ownerFirstName",
  "ownerLastName",
  "ownerTitle",
  "ownerAddress",
  "ownerSsnLast4",
  "ownerDob",
  "ownershipPercentage",

  // TEMPORARY DESIGN: bank* and ownerSsnLast4 / ownerDob are pending the
  // banking PII tokenization architecture (see issue tracker for the
  // SECURITY-CRITICAL banking-credentials issue). Plaintext storage is
  // acceptable ONLY in the pre-launch state. Before first merchant onboards,
  // these fields must be replaced by Payroc tokens or column-level encrypted.
  "bankAccountHolder",
  "bankRoutingNumber",
  "bankAccountNumber",
  "bankAccountType",
  "fundingSpeed",

  // Processing details
  "monthlyVolume",
  "avgTransaction",
  "paymentMethods",

  // Franchise flag (set during onboarding step 5)
  "isFranchise",
  "sourceSystem",
]);

/**
 * BusinessSettings fields the owner may modify.
 * BusinessSettings is intentionally a merchant-configuration table — every
 * non-system field is exposed.
 *
 * Excluded:
 *   id, organizationId, createdAt, updatedAt    → system-managed
 */
export const BUSINESS_SETTINGS_ALLOWED_FIELDS = new Set<string>([
  "onlineBookingEnabled",
  "bookingLeadTime",
  "bookingMaxAdvance",
  "allowWalkIns",
  "requireDeposit",
  "depositPercentage",
  "cancellationPolicy",
  "cancellationWindow",
  "cancellationFee",
  "sendConfirmations",
  "sendReminders",
  "reminderHours",
  "sendReviewRequests",
  "reviewRequestDelay",
  "acceptCash",
  "acceptCard",
  "acceptGiftCard",
  // taxRate removed — now written per-location via POST /api/tax (TaxRate table)
  "tipPromptEnabled",
  "tipOptions",
  "receiptFooter",
  "receiptLogo",
  "autoSendReceipt",
  "loyaltyEnabled",
  "googlePlaceId",
  "yelpBusinessId",
  "autoRequestReviews",
  "minRatingForGoogle",
]);

/**
 * AiReceptionistConfig fields the owner may modify.
 *
 * Excluded:
 *   id, organizationId, createdAt, updatedAt    → system-managed
 *   callsHandled, callsTransferred              → system counters; updated
 *                                                  ONLY by the inbound call
 *                                                  handler in 5.1.2, never
 *                                                  by user PATCH.
 */
export const AI_RECEPTIONIST_ALLOWED_FIELDS = new Set<string>([
  "isEnabled",
  "voiceId",
  "greeting",
  "businessHours",
  "handoffNumber",
  "handoffEmail",
  "capabilities",
]);

/**
 * Filters an input object to only the fields present in the allowlist.
 * Returns a new object — does not mutate the input.
 *
 * If the input is null/undefined, returns an empty object.
 *
 * Usage:
 *   const safeUpdate = pickAllowed(body.organizationUpdates, ORGANIZATION_ALLOWED_FIELDS);
 *   await tx.organization.update({ where: { id: ctx.organizationId }, data: safeUpdate });
 */
export function pickAllowed<T extends Record<string, unknown>>(
  input: T | null | undefined,
  allowed: Set<string>,
): Partial<T> {
  if (!input || typeof input !== "object") return {};
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(input)) {
    if (allowed.has(k)) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

/**
 * Returns the list of keys in the input that are NOT in the allowlist.
 * Useful for logging "rejected fields" in dev to help merchants understand
 * why an update silently dropped a value. Not currently called — included
 * for future observability.
 */
export function rejectedFields<T extends Record<string, unknown>>(
  input: T | null | undefined,
  allowed: Set<string>,
): string[] {
  if (!input || typeof input !== "object") return [];
  return Object.keys(input).filter((k) => !allowed.has(k));
}
