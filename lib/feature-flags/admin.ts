import { Prisma } from '@prisma/client';
import type { FeatureFlagChangeType } from './types';

const VALID_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

function validateKey(key: string): void {
  if (!VALID_KEY_PATTERN.test(key)) {
    throw new Error(
      `Invalid flag key '${key}'. Must be lowercase alphanumerics + hyphens, ` +
        `start with letter or number, max 64 chars.`,
    );
  }
}

function validateRollout(pct: number): void {
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
    throw new Error(`rolloutPct must be integer 0-100, got ${pct}`);
  }
}

/**
 * Create a new flag. SUPERADMIN only (enforced at API route layer).
 */
export async function createFlag(
  tx: Prisma.TransactionClient,
  args: {
    key: string;
    description: string;
    defaultValue: boolean;
    rolloutPct: number;
    overrides: Record<string, boolean>;
    isActive: boolean;
    actorUserId: string;
  },
): Promise<{ flagId: string }> {
  validateKey(args.key);
  validateRollout(args.rolloutPct);

  const flag = await tx.featureFlag.create({
    data: {
      key: args.key,
      description: args.description,
      defaultValue: args.defaultValue,
      rolloutPct: args.rolloutPct,
      overrides: args.overrides as Prisma.InputJsonValue,
      isActive: args.isActive,
      createdByUserId: args.actorUserId,
      updatedByUserId: args.actorUserId,
    },
  });

  await tx.featureFlagAudit.create({
    data: {
      flagId: flag.id,
      changedByUserId: args.actorUserId,
      changeType: 'CREATE' satisfies FeatureFlagChangeType,
      before: Prisma.DbNull,
      after: {
        key: flag.key,
        defaultValue: flag.defaultValue,
        rolloutPct: flag.rolloutPct,
        overrides: flag.overrides,
        isActive: flag.isActive,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return { flagId: flag.id };
}

/**
 * Update an existing flag. Captures before/after in audit.
 */
export async function updateFlag(
  tx: Prisma.TransactionClient,
  args: {
    flagId: string;
    changes: {
      description?: string;
      defaultValue?: boolean;
      rolloutPct?: number;
      overrides?: Record<string, boolean>;
      isActive?: boolean;
    };
    reason: string | null;
    actorUserId: string;
  },
): Promise<void> {
  const before = await tx.featureFlag.findUnique({ where: { id: args.flagId } });
  if (!before) throw new Error('Flag not found');

  if (args.changes.rolloutPct !== undefined) {
    validateRollout(args.changes.rolloutPct);
  }

  const data: Prisma.FeatureFlagUncheckedUpdateInput = {
    updatedByUserId: args.actorUserId,
  };
  if (args.changes.description !== undefined) data.description = args.changes.description;
  if (args.changes.defaultValue !== undefined) data.defaultValue = args.changes.defaultValue;
  if (args.changes.rolloutPct !== undefined) data.rolloutPct = args.changes.rolloutPct;
  if (args.changes.overrides !== undefined)
    data.overrides = args.changes.overrides as unknown as Prisma.InputJsonValue;
  if (args.changes.isActive !== undefined) data.isActive = args.changes.isActive;

  await tx.featureFlag.update({
    where: { id: args.flagId },
    data,
  });

  // Detect which fields changed
  const changedFields: FeatureFlagChangeType[] = [];
  if (args.changes.description !== undefined) changedFields.push('UPDATE_DESCRIPTION');
  if (args.changes.defaultValue !== undefined) changedFields.push('UPDATE_DEFAULT');
  if (args.changes.rolloutPct !== undefined) changedFields.push('UPDATE_ROLLOUT');
  if (args.changes.overrides !== undefined) changedFields.push('UPDATE_OVERRIDE');
  if (args.changes.isActive !== undefined) changedFields.push('TOGGLE_ACTIVE');

  // Single-field change -> use the specific type
  // Multi-field change -> use generic 'UPDATE' to avoid misleading audit
  // No change -> still write audit with 'UPDATE' (no-op tracking)
  const changeType: FeatureFlagChangeType =
    changedFields.length === 1 ? changedFields[0] : 'UPDATE';

  await tx.featureFlagAudit.create({
    data: {
      flagId: args.flagId,
      changedByUserId: args.actorUserId,
      changeType,
      before: {
        defaultValue: before.defaultValue,
        rolloutPct: before.rolloutPct,
        overrides: before.overrides,
        isActive: before.isActive,
      } as unknown as Prisma.InputJsonValue,
      after: args.changes as unknown as Prisma.InputJsonValue,
      reason: args.reason,
    },
  });
}

/**
 * Set or remove a per-org override.
 */
export async function setFlagOverride(
  tx: Prisma.TransactionClient,
  args: {
    flagId: string;
    organizationId: string;
    value: boolean | null; // null = remove override
    reason: string | null;
    actorUserId: string;
  },
): Promise<void> {
  const flag = await tx.featureFlag.findUnique({ where: { id: args.flagId } });
  if (!flag) throw new Error('Flag not found');

  const overrides = { ...((flag.overrides as Record<string, boolean>) ?? {}) };
  const before = { ...overrides };

  if (args.value === null) {
    delete overrides[args.organizationId];
  } else {
    overrides[args.organizationId] = args.value;
  }

  await tx.featureFlag.update({
    where: { id: args.flagId },
    data: {
      overrides: overrides as unknown as Prisma.InputJsonValue,
      updatedByUserId: args.actorUserId,
    },
  });

  await tx.featureFlagAudit.create({
    data: {
      flagId: args.flagId,
      changedByUserId: args.actorUserId,
      changeType: 'UPDATE_OVERRIDE' satisfies FeatureFlagChangeType,
      before: { overrides: before } as unknown as Prisma.InputJsonValue,
      after: {
        overrides,
        changedOrgId: args.organizationId,
        newValue: args.value,
      } as unknown as Prisma.InputJsonValue,
      reason: args.reason,
    },
  });
}
