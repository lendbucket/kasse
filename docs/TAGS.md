# Tags

Last updated: 2026-05-18

## Purpose

Tags are discrete labels attached to core entities (Client, Service,
Appointment, Staff, Product) for categorization, filtering, and segmentation.
They have no value — they're either attached or not.

## Tags vs custom fields

- Use **custom fields** when you need a value of a specific type (a number,
  a date, a selected option from a list, etc.)
- Use **tags** when you just need a label ("VIP", "Out of Stock",
  "Color Specialist")
- Same entity can have many tags. Same tag can be on many entities.

## Schema

- **Tag** -- per-org definition: name, slug, color, description, isActive,
  displayOrder, softDeletedAt
- **EntityTag** -- polymorphic join: tagId + entityType + entityId

Polymorphic via entityType column rather than separate tables per entity
(scales to N entity types without N tables).

## Naming rules

- **name**: 1-50 chars, free text ("VIP Client", "Out of Stock")
- **slug**: kebab-case `^[a-z0-9][a-z0-9-]{0,63}$`, unique per (org, slug)
- **color**: hex `^#[0-9A-Fa-f]{6}$`, defaults to #606E74 (Kasse design
  system slate)

## Target entities (v1)

CLIENT, SERVICE, APPOINTMENT, STAFF, PRODUCT -- same as custom fields.
Add to `VALID_TAG_TARGET_ENTITIES` and the DB CHECK constraint to extend.

## API routes

| Route | Method | Permission | Purpose |
|-------|--------|------------|---------|
| `/api/tags` | GET | Any authenticated | List tags for current org |
| `/api/tags` | POST | OWNER, MANAGER, SUPERADMIN | Create tag |
| `/api/tags/[id]` | PATCH | OWNER, MANAGER, SUPERADMIN | Update tag |
| `/api/tags/[id]` | DELETE | OWNER, MANAGER, SUPERADMIN | Soft-delete tag |

## Usage

### Define a tag

```typescript
import { createTag } from '@/lib/tags/definitions';

await createTag(tx, {
  organizationId: org.id,
  name: 'VIP Client',
  slug: 'vip-client',
  color: '#C9A84C',
  actorUserId: user.id,
});
```

### Attach / detach

```typescript
import { attachTag, detachTag } from '@/lib/tags/attach';

await attachTag(tx, {
  organizationId: org.id,
  tagId: tag.id,
  entityType: 'CLIENT',
  entityId: client.id,
  actorUserId: user.id,
});
```

### Replace full tag set on an entity (UI multi-select pattern)

```typescript
import { setTagsForEntity } from '@/lib/tags/attach';

await setTagsForEntity(tx, {
  organizationId: org.id,
  entityType: 'CLIENT',
  entityId: client.id,
  tagIds: ['tag-1', 'tag-3', 'tag-9'],
  actorUserId: user.id,
});
// -> { added: 2, removed: 1 }
```

### Read tags

```typescript
import { getTagsForEntity, getEntitiesForTag, getTagsForEntities } from '@/lib/tags/attach';

// One entity's tags
const tags = await getTagsForEntity(tx, {
  organizationId: org.id,
  entityType: 'CLIENT',
  entityId: client.id,
});

// Find all entities with a specific tag
const clientIds = await getEntitiesForTag(tx, {
  organizationId: org.id,
  tagId: tag.id,
  entityType: 'CLIENT',
});

// Bulk-load tags for many entities (avoid N+1 in list views)
const tagMap = await getTagsForEntities(tx, {
  organizationId: org.id,
  entityType: 'CLIENT',
  entityIds: clientList.map(c => c.id),
});
```

## Lifecycle

1. Owner/Manager creates tags via API (admin UI lands in P1+)
2. Code paths that touch target entities call attachTag/detachTag/setTagsForEntity
3. List/detail views call getTagsForEntity or getTagsForEntities (bulk) to
   render colored chips
4. Soft-delete preserves EntityTag attachments for audit -- tags just stop
   appearing in getTagsForEntity results

Soft-delete is permanent from the API's perspective. Soft-deleted tags never
appear in listTags, even with `includeInactive=true`. The `includeInactive`
flag only controls `isActive=false` tags (deactivated but not deleted). The
row stays in the DB for audit/historical purposes but is invisible to the
application. There is no "undelete" via API -- restoration requires direct
DB intervention (intentional: soft-delete is a clear, deliberate action).

## Audit

Tag definition CRUD writes audit entries (TAG_CREATE, TAG_UPDATE, TAG_DELETE).

Individual attach/detach events do NOT write audit entries (too high volume).
For bulk operations (setTagsForEntity from an edit screen), the consuming
code is responsible for writing a single audit entry with the diff if needed.

## RLS

Both tables tenant-scoped via standard
`organizationId = current_setting('app.current_org_id', true)` policy plus
`app.is_superadmin` bypass. FORCE ROW LEVEL SECURITY enabled on both tables.
`kasse_app` has SELECT/INSERT/UPDATE/DELETE grants.
