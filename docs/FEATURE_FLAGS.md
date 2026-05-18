# Feature Flags

Last updated: 2026-05-18

## Purpose

Feature flags gate **experiments** and **gradual rollouts**. They are distinct
from `Organization.enabledAddons[]` (P0.D) which gates **paid business features**.

- Use `enabledAddons` when: a customer pays for a feature, a plan tier unlocks it,
  or it's part of the product catalog.
- Use feature flags when: rolling out a UI variant gradually, A/B testing a code
  path, building a kill switch for a risky change, or temporarily enabling
  something for a specific test org.

## Lifecycle

A flag's life:
1. Create flag in admin UI with rolloutPct=0 (or specific test org override)
2. Deploy code that uses the flag
3. Verify behavior on test org
4. Increase rolloutPct gradually: 5% → 25% → 50% → 100%
5. Once at 100% and stable, remove the flag from code (replace with direct logic)
6. Toggle flag isActive=false in admin to confirm code no longer depends on it
7. Delete-but-keep-archived (just leave isActive=false — never DELETE rows)

## Naming

- Format: `lowercase-kebab-case`
- Pattern: `[a-z0-9][a-z0-9-]{0,63}`
- Examples: `new-booking-flow`, `ai-receptionist-v2-ui`, `kill-payment-retry`

## Evaluation order

For a given (flag, org) pair:

1. **Flag missing in DB** → returns false, source=MISSING
2. **Flag.isActive=false** → returns defaultValue, source=INACTIVE
3. **Override for this org exists** → returns override value, source=OVERRIDE
4. **Bucket < rolloutPct** → returns true, source=ROLLOUT
5. **Otherwise** → returns defaultValue, source=DEFAULT

The bucket is computed via sha256(`flagKey:orgId`) mod 100. Same flag + same org
always produces the same bucket.

## Usage

### Server-side (RSC, API routes)

```typescript
import { evaluateFlag } from '@/lib/feature-flags/evaluate';

const result = await evaluateFlag(tx, {
  key: 'new-booking-flow',
  context: { organizationId: orgId, userId: userId },
});

if (result.enabled) {
  // ... new flow
}
```

### Client-side (React components)

```typescript
'use client';
import { useFlag } from '@/lib/feature-flags/context';

export function BookingButton() {
  const showNewFlow = useFlag('new-booking-flow');
  return showNewFlow ? <NewBookingFlow /> : <LegacyBookingFlow />;
}
```

The flag is hydrated into context at the layout level. The layout calls
`evaluateFlags()` server-side for all KNOWN_FLAG_KEYS, passes the results to
`FlagProvider`, and `useFlag()` reads from context without a network call.

### Adding a new flag

1. Add the flag key to `KNOWN_FLAG_KEYS` in the layout file
2. Create the flag in admin UI at `/admin/feature-flags` with appropriate
   rolloutPct and defaultValue
3. Add the code that consumes `useFlag(key)`
4. Deploy

## Audit log

Every flag change is captured in `FeatureFlagAudit` with:
- Who changed it (changedByUserId)
- What changed (changeType: CREATE, UPDATE_DEFAULT, UPDATE_ROLLOUT, UPDATE_OVERRIDE,
  TOGGLE_ACTIVE, DELETE)
- Before/after JSON
- Optional reason

Retention: indefinite. Audit log is platform-level compliance data.

## Why not LaunchDarkly / Statsig / PostHog?

For v1, our own DB-backed flags are sufficient. They add no vendor cost, no
network dependency, and integrate cleanly with our existing tenant/auth model.
Once we have 1000+ flags or need experimentation analytics, we can migrate.
For now, simple is better.
