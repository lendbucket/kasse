# Custom Fields

Last updated: 2026-05-18

## Purpose

Custom fields let tenants define structured per-org metadata on core entities
(Client, Service, Appointment, Staff, Product) without schema changes per tenant.

This is a tenant-controlled feature. Owners and Managers manage definitions;
values are written by code paths that consume them.

## Supported types

| Type | Storage shape | Validation rules |
|------|---------------|------------------|
| TEXT | `{ text: string }` | minLength, maxLength, pattern |
| TEXTAREA | `{ text: string }` | minLength, maxLength, pattern |
| NUMBER | `{ number: number }` | min, max, integer |
| DATE | `{ date: "YYYY-MM-DD" }` | minDate, maxDate |
| DATETIME | `{ datetime: ISO string }` | minDate, maxDate |
| BOOLEAN | `{ boolean: boolean }` | — |
| SELECT | `{ selected: string }` | options (required) |
| MULTI_SELECT | `{ selected: string[] }` | options (required), minSelections, maxSelections |
| URL | `{ text: string }` | format check |
| EMAIL | `{ text: string }` | format check |
| PHONE | `{ text: string }` | digit count check |

## Target entities (v1)

- CLIENT
- SERVICE
- APPOINTMENT
- STAFF
- PRODUCT

Add to `VALID_TARGET_ENTITIES` in `lib/custom-fields/types.ts` as needed; also
update the DB CHECK constraint.

## Usage

### Define a field

```typescript
import { createDefinition } from '@/lib/custom-fields/definitions';

await createDefinition(tx, {
  organizationId: org.id,
  targetEntity: 'CLIENT',
  key: 'favorite_color',
  displayName: 'Favorite Color',
  fieldType: 'TEXT',
  validationRules: { maxLength: 50 },
  actorUserId: user.id,
});
```

### Write values

```typescript
import { setValue } from '@/lib/custom-fields/values';

await setValue(tx, {
  organizationId: org.id,
  definitionId: def.id,
  entityId: client.id,
  rawValue: 'Blue',
  actorUserId: user.id,
});
```

Or in bulk (e.g., on entity creation):

```typescript
import { setValues } from '@/lib/custom-fields/values';

await setValues(tx, {
  organizationId: org.id,
  entityId: client.id,
  targetEntity: 'CLIENT',
  values: {
    favorite_color: 'Blue',
    allergies: ['nuts', 'shellfish'],
  },
  actorUserId: user.id,
});
```

### Read values

```typescript
import { getValues } from '@/lib/custom-fields/values';

const values = await getValues(tx, {
  organizationId: org.id,
  targetEntity: 'CLIENT',
  entityId: client.id,
});
// -> { favorite_color: { text: 'Blue' }, allergies: { selected: ['nuts', 'shellfish'] } }
```

## API routes

| Route | Method | Permission | Purpose |
|-------|--------|------------|---------|
| `/api/custom-fields/definitions` | GET | Any authenticated | List definitions by targetEntity |
| `/api/custom-fields/definitions` | POST | OWNER, MANAGER, SUPERADMIN | Create definition |
| `/api/custom-fields/definitions/[id]` | PATCH | OWNER, MANAGER, SUPERADMIN | Update definition |
| `/api/custom-fields/definitions/[id]` | DELETE | OWNER, MANAGER, SUPERADMIN | Soft-delete definition |

## Key naming

- snake_case: `^[a-z][a-z0-9_]{0,63}$`
- Unique per (organizationId, targetEntity)
- Cannot change after definition created (would orphan values)

## Lifecycle

1. Owner/Manager creates definition via API (admin UI lands in a later PR)
2. Code paths that touch the target entity call setValues() or setValue() to
   persist user input
3. Code paths that display the entity call getValues() to hydrate
4. Soft-delete preserves historical values but removes from the API

## Validation

All validation is server-side. The validateValue() function:
- Coerces both shape variants (raw value and {type: value} wrapper)
- Throws CustomFieldValidationError on first violation
- Returns the normalized value on success

UI-side validation can mirror server rules but is not authoritative.

## RLS

Both tables are tenant-scoped via the standard
`organizationId = current_setting('app.current_org_id', true)` policy plus
`app.is_superadmin` bypass. FORCE ROW LEVEL SECURITY is enabled on both tables.
`kasse_app` has SELECT/INSERT/UPDATE/DELETE grants.
