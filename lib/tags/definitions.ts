import type { Prisma } from '@prisma/client';
import {
  type TagRecord,
  VALID_SLUG_PATTERN,
  VALID_COLOR_PATTERN,
  MAX_NAME_LENGTH,
  DEFAULT_TAG_COLOR,
} from './types';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';

export class TagValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'TagValidationError';
  }
}

function validateSlug(slug: string): void {
  if (!VALID_SLUG_PATTERN.test(slug)) {
    throw new TagValidationError(
      'slug',
      `invalid slug '${slug}': must be kebab-case, max 64 chars`
    );
  }
}

function validateColor(color: string): void {
  if (!VALID_COLOR_PATTERN.test(color)) {
    throw new TagValidationError(
      'color',
      `invalid color '${color}': must be #RRGGBB hex`
    );
  }
}

function validateName(name: string): void {
  if (!name || name.length === 0 || name.length > MAX_NAME_LENGTH) {
    throw new TagValidationError(
      'name',
      `name must be 1-${MAX_NAME_LENGTH} chars, got ${name?.length ?? 0}`
    );
  }
}

export async function createTag(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    name: string;
    slug: string;
    color?: string;
    description?: string | null;
    displayOrder?: number;
    actorUserId: string;
  }
): Promise<{ tagId: string }> {
  validateName(args.name);
  validateSlug(args.slug);
  const color = args.color ?? DEFAULT_TAG_COLOR;
  validateColor(color);

  const tag = await tx.tag.create({
    data: {
      organizationId: args.organizationId,
      name: args.name,
      slug: args.slug,
      color,
      description: args.description ?? null,
      displayOrder: args.displayOrder ?? 0,
      createdByUserId: args.actorUserId,
    },
  });

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.TAG_CREATE,
    entity: 'Tag',
    entityId: tag.id,
    after: {
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
    },
  });

  return { tagId: tag.id };
}

export async function updateTag(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    tagId: string;
    changes: Partial<{
      name: string;
      color: string;
      description: string | null;
      displayOrder: number;
      isActive: boolean;
    }>;
    actorUserId: string;
  }
): Promise<void> {
  if (args.changes.name !== undefined) validateName(args.changes.name);
  if (args.changes.color !== undefined) validateColor(args.changes.color);

  // The findFirst + updateMany pair has a TOCTOU window: a concurrent delete
  // between the two calls could cause updateMany to return count=0. That's benign
  // — we throw a clean TagValidationError. The race is acceptable because tag
  // deletion is rare and SELECT FOR UPDATE would add lock contention with no
  // real safety win. The before snapshot is only used for audit diffing.
  const before = await tx.tag.findFirst({
    where: { id: args.tagId, organizationId: args.organizationId },
  });
  if (!before) {
    throw new TagValidationError('tagId', 'tag not found');
  }

  // Defense in depth: scope update to organizationId even though RLS enforces it.
  const result = await tx.tag.updateMany({
    where: { id: args.tagId, organizationId: args.organizationId },
    data: args.changes,
  });
  if (result.count === 0) {
    throw new TagValidationError('tagId', 'tag not found or not in this organization');
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.TAG_UPDATE,
    entity: 'Tag',
    entityId: args.tagId,
    before: {
      name: before.name,
      color: before.color,
      description: before.description,
      displayOrder: before.displayOrder,
      isActive: before.isActive,
    },
    after: args.changes as Record<string, unknown>,
  });
}

export async function softDeleteTag(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    tagId: string;
    actorUserId: string;
  }
): Promise<void> {
  // Same TOCTOU comment as updateTag — benign race, clean error path.
  const tag = await tx.tag.findFirst({
    where: { id: args.tagId, organizationId: args.organizationId },
  });
  if (!tag) {
    throw new TagValidationError('tagId', 'tag not found');
  }

  const result = await tx.tag.updateMany({
    where: { id: args.tagId, organizationId: args.organizationId },
    data: {
      softDeletedAt: new Date(),
      isActive: false,
    },
  });
  if (result.count === 0) {
    throw new TagValidationError('tagId', 'tag not found or not in this organization');
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.TAG_DELETE,
    entity: 'Tag',
    entityId: args.tagId,
  });
}

/**
 * List tags for an organization, ordered by displayOrder then name.
 *
 * `includeInactive=true` includes tags where `isActive=false`, but soft-deleted
 * tags (softDeletedAt != null) are ALWAYS excluded. Soft-delete is a permanent
 * "remove from API" — the row stays for audit/historical purposes but never
 * surfaces through reads.
 */
export async function listTags(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    includeInactive?: boolean;
  }
): Promise<TagRecord[]> {
  return tx.tag.findMany({
    where: {
      organizationId: args.organizationId,
      softDeletedAt: null,
      ...(args.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
  }) as unknown as Promise<TagRecord[]>;
}
