import type { Prisma } from '@prisma/client';
import type { TagTargetEntity, TagRecord } from './types';
import { TagValidationError } from './definitions';
import { VALID_TAG_TARGET_ENTITIES } from './types';

function validateEntityType(entityType: string): asserts entityType is TagTargetEntity {
  if (!(VALID_TAG_TARGET_ENTITIES as string[]).includes(entityType)) {
    throw new TagValidationError(
      'entityType',
      `'${entityType}' not allowed; must be one of ${VALID_TAG_TARGET_ENTITIES.join(', ')}`
    );
  }
}

/**
 * Attach a tag to an entity. Idempotent — re-attaching is a no-op (uses upsert).
 * The tag must exist, be active, and be in the caller's org.
 */
export async function attachTag(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    tagId: string;
    entityType: TagTargetEntity;
    entityId: string;
    actorUserId: string;
  }
): Promise<{ entityTagId: string }> {
  validateEntityType(args.entityType);

  const tag = await tx.tag.findFirst({
    where: {
      id: args.tagId,
      organizationId: args.organizationId,
      isActive: true,
      softDeletedAt: null,
    },
  });
  if (!tag) {
    throw new TagValidationError('tagId', 'tag not found, inactive, or not in this organization');
  }

  const upserted = await tx.entityTag.upsert({
    where: {
      tagId_entityType_entityId: {
        tagId: args.tagId,
        entityType: args.entityType,
        entityId: args.entityId,
      },
    },
    update: {},
    create: {
      organizationId: args.organizationId,
      tagId: args.tagId,
      entityType: args.entityType,
      entityId: args.entityId,
      createdByUserId: args.actorUserId,
    },
  });
  return { entityTagId: upserted.id };
}

/**
 * Detach a tag from an entity. No-op if not currently attached.
 */
export async function detachTag(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    tagId: string;
    entityType: TagTargetEntity;
    entityId: string;
  }
): Promise<{ removed: boolean }> {
  validateEntityType(args.entityType);
  const result = await tx.entityTag.deleteMany({
    where: {
      organizationId: args.organizationId,
      tagId: args.tagId,
      entityType: args.entityType,
      entityId: args.entityId,
    },
  });
  return { removed: result.count > 0 };
}

/**
 * Replace the full set of tags for an entity. Tags in tagIds that aren't
 * already attached are added; tags currently attached but not in tagIds
 * are removed. Each tag is validated against the tag table.
 */
export async function setTagsForEntity(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    entityType: TagTargetEntity;
    entityId: string;
    tagIds: string[];
    actorUserId: string;
  }
): Promise<{ added: number; removed: number }> {
  validateEntityType(args.entityType);

  const uniqueTagIds = Array.from(new Set(args.tagIds));
  if (uniqueTagIds.length > 0) {
    const validTags = await tx.tag.findMany({
      where: {
        id: { in: uniqueTagIds },
        organizationId: args.organizationId,
        isActive: true,
        softDeletedAt: null,
      },
      select: { id: true },
    });
    const validIds = new Set(validTags.map(t => t.id));
    for (const tagId of uniqueTagIds) {
      if (!validIds.has(tagId)) {
        throw new TagValidationError(
          'tagIds',
          `tag '${tagId}' not found, inactive, or not in this organization`
        );
      }
    }
  }

  const current = await tx.entityTag.findMany({
    where: {
      organizationId: args.organizationId,
      entityType: args.entityType,
      entityId: args.entityId,
    },
    select: { tagId: true },
  });
  const currentIds = new Set(current.map(c => c.tagId));
  const desiredIds = new Set(uniqueTagIds);

  const toAdd = uniqueTagIds.filter(id => !currentIds.has(id));
  const toRemove = Array.from(currentIds).filter(id => !desiredIds.has(id));

  if (toAdd.length > 0) {
    await tx.entityTag.createMany({
      data: toAdd.map(tagId => ({
        organizationId: args.organizationId,
        tagId,
        entityType: args.entityType,
        entityId: args.entityId,
        createdByUserId: args.actorUserId,
      })),
    });
  }

  if (toRemove.length > 0) {
    await tx.entityTag.deleteMany({
      where: {
        organizationId: args.organizationId,
        entityType: args.entityType,
        entityId: args.entityId,
        tagId: { in: toRemove },
      },
    });
  }

  return { added: toAdd.length, removed: toRemove.length };
}

/**
 * Get all tags attached to an entity. Returns full Tag records ordered by
 * displayOrder then name. Filters out soft-deleted and inactive tags.
 */
export async function getTagsForEntity(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    entityType: TagTargetEntity;
    entityId: string;
  }
): Promise<TagRecord[]> {
  validateEntityType(args.entityType);
  const rows = await tx.entityTag.findMany({
    where: {
      organizationId: args.organizationId,
      entityType: args.entityType,
      entityId: args.entityId,
      tag: {
        isActive: true,
        softDeletedAt: null,
      },
    },
    include: { tag: true },
    orderBy: [
      { tag: { displayOrder: 'asc' } },
      { tag: { name: 'asc' } },
    ],
  });
  return rows.map(r => r.tag as unknown as TagRecord);
}

/**
 * Get all entities of a given type that have a specific tag.
 * Returns entity IDs only — caller hydrates the actual entity rows.
 */
export async function getEntitiesForTag(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    tagId: string;
    entityType: TagTargetEntity;
  }
): Promise<string[]> {
  validateEntityType(args.entityType);
  const rows = await tx.entityTag.findMany({
    where: {
      organizationId: args.organizationId,
      tagId: args.tagId,
      entityType: args.entityType,
    },
    select: { entityId: true },
  });
  return rows.map(r => r.entityId);
}

/**
 * Bulk-load tags for many entities at once (avoids N+1 in list views).
 * Returns a Map<entityId, TagRecord[]>.
 */
export async function getTagsForEntities(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    entityType: TagTargetEntity;
    entityIds: string[];
  }
): Promise<Map<string, TagRecord[]>> {
  validateEntityType(args.entityType);
  if (args.entityIds.length === 0) return new Map();

  const rows = await tx.entityTag.findMany({
    where: {
      organizationId: args.organizationId,
      entityType: args.entityType,
      entityId: { in: args.entityIds },
      tag: {
        isActive: true,
        softDeletedAt: null,
      },
    },
    include: { tag: true },
    orderBy: [
      { tag: { displayOrder: 'asc' } },
      { tag: { name: 'asc' } },
    ],
  });

  const result = new Map<string, TagRecord[]>();
  for (const id of args.entityIds) result.set(id, []);
  for (const row of rows) {
    const list = result.get(row.entityId) ?? [];
    list.push(row.tag as unknown as TagRecord);
    result.set(row.entityId, list);
  }
  return result;
}
