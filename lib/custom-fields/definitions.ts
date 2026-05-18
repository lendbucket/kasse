import type { Prisma } from '@prisma/client';
import {
  type CustomFieldTargetEntity,
  type CustomFieldType,
  type ValidationRules,
  type CustomFieldValueShape,
  type CustomFieldDefinitionRecord,
  VALID_KEY_PATTERN,
  VALID_TARGET_ENTITIES,
  VALID_FIELD_TYPES,
} from './types';
import { CustomFieldValidationError } from './validate';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';

function validateKey(key: string): void {
  if (!VALID_KEY_PATTERN.test(key)) {
    throw new CustomFieldValidationError(
      'key',
      `invalid key '${key}': must be snake_case, start with letter, max 64 chars`
    );
  }
}

function validateRules(fieldType: CustomFieldType, rules: ValidationRules): void {
  if (fieldType === 'SELECT' || fieldType === 'MULTI_SELECT') {
    if (!rules.options || rules.options.length === 0) {
      throw new CustomFieldValidationError(
        'validationRules.options',
        `${fieldType} requires at least one option`
      );
    }
    const values = rules.options.map(o => o.value);
    if (new Set(values).size !== values.length) {
      throw new CustomFieldValidationError(
        'validationRules.options',
        'option values must be unique'
      );
    }
    for (const opt of rules.options) {
      if (!opt.value || !opt.label) {
        throw new CustomFieldValidationError(
          'validationRules.options',
          'each option must have value and label'
        );
      }
    }
  }
  if (fieldType === 'NUMBER') {
    if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
      throw new CustomFieldValidationError(
        'validationRules',
        'min cannot exceed max'
      );
    }
  }
  if (rules.minLength !== undefined && rules.maxLength !== undefined &&
      rules.minLength > rules.maxLength) {
    throw new CustomFieldValidationError(
      'validationRules',
      'minLength cannot exceed maxLength'
    );
  }
  if (rules.pattern !== undefined) {
    try {
      new RegExp(rules.pattern);
    } catch {
      throw new CustomFieldValidationError(
        'validationRules.pattern',
        'invalid regex pattern'
      );
    }
  }
}

export async function createDefinition(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    targetEntity: CustomFieldTargetEntity;
    key: string;
    displayName: string;
    description?: string | null;
    fieldType: CustomFieldType;
    isRequired?: boolean;
    displayOrder?: number;
    validationRules?: ValidationRules;
    defaultValue?: CustomFieldValueShape | null;
    visibleToCustomers?: boolean;
    actorUserId: string;
  }
): Promise<{ definitionId: string }> {
  if (!VALID_TARGET_ENTITIES.includes(args.targetEntity)) {
    throw new CustomFieldValidationError(
      'targetEntity',
      `'${args.targetEntity}' not allowed`
    );
  }
  if (!VALID_FIELD_TYPES.includes(args.fieldType)) {
    throw new CustomFieldValidationError(
      'fieldType',
      `'${args.fieldType}' not allowed`
    );
  }
  validateKey(args.key);
  validateRules(args.fieldType, args.validationRules ?? {});

  const def = await tx.customFieldDefinition.create({
    data: {
      organizationId: args.organizationId,
      targetEntity: args.targetEntity,
      key: args.key,
      displayName: args.displayName,
      description: args.description ?? null,
      fieldType: args.fieldType,
      isRequired: args.isRequired ?? false,
      displayOrder: args.displayOrder ?? 0,
      validationRules: (args.validationRules ?? {}) as Prisma.InputJsonValue,
      defaultValue: args.defaultValue as Prisma.InputJsonValue ?? undefined,
      visibleToCustomers: args.visibleToCustomers ?? false,
      createdByUserId: args.actorUserId,
    },
  });

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.CUSTOM_FIELD_DEFINITION_CREATE,
    entity: 'CustomFieldDefinition',
    entityId: def.id,
    after: {
      key: def.key,
      targetEntity: def.targetEntity,
      fieldType: def.fieldType,
    },
  });

  return { definitionId: def.id };
}

export async function updateDefinition(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    definitionId: string;
    changes: Partial<{
      displayName: string;
      description: string | null;
      isRequired: boolean;
      displayOrder: number;
      validationRules: ValidationRules;
      defaultValue: CustomFieldValueShape | null;
      visibleToCustomers: boolean;
      isActive: boolean;
    }>;
    actorUserId: string;
  }
): Promise<void> {
  const before = await tx.customFieldDefinition.findFirst({
    where: { id: args.definitionId, organizationId: args.organizationId },
  });
  if (!before) {
    throw new CustomFieldValidationError('definitionId', 'definition not found');
  }
  if (args.changes.validationRules !== undefined) {
    validateRules(before.fieldType as CustomFieldType, args.changes.validationRules);
  }

  const data: Record<string, unknown> = { ...args.changes };
  if (args.changes.validationRules !== undefined) {
    data.validationRules = args.changes.validationRules as unknown as Prisma.InputJsonValue;
  }
  if (args.changes.defaultValue !== undefined) {
    data.defaultValue = args.changes.defaultValue as unknown as Prisma.InputJsonValue;
  }

  // Defense in depth: scope update to organizationId even though RLS enforces it.
  // Uses updateMany because Prisma's update() only accepts @id in where.
  const updated = await tx.customFieldDefinition.updateMany({
    where: { id: args.definitionId, organizationId: args.organizationId },
    data,
  });
  if (updated.count === 0) {
    throw new CustomFieldValidationError('definitionId', 'definition not found or not in this organization');
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.CUSTOM_FIELD_DEFINITION_UPDATE,
    entity: 'CustomFieldDefinition',
    entityId: args.definitionId,
    before: before as unknown as Record<string, unknown>,
    after: args.changes as unknown as Record<string, unknown>,
  });
}

/**
 * Soft-delete a definition. Existing values are preserved but become
 * inaccessible via the normal API.
 */
export async function softDeleteDefinition(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    definitionId: string;
    actorUserId: string;
  }
): Promise<void> {
  const def = await tx.customFieldDefinition.findFirst({
    where: { id: args.definitionId, organizationId: args.organizationId },
  });
  if (!def) {
    throw new CustomFieldValidationError('definitionId', 'definition not found');
  }

  // Defense in depth: scope update to organizationId even though RLS enforces it.
  const updated = await tx.customFieldDefinition.updateMany({
    where: { id: args.definitionId, organizationId: args.organizationId },
    data: {
      softDeletedAt: new Date(),
      isActive: false,
    },
  });
  if (updated.count === 0) {
    throw new CustomFieldValidationError('definitionId', 'definition not found or not in this organization');
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.CUSTOM_FIELD_DEFINITION_DELETE,
    entity: 'CustomFieldDefinition',
    entityId: args.definitionId,
  });
}

export async function listDefinitions(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    targetEntity: CustomFieldTargetEntity;
    includeInactive?: boolean;
  }
): Promise<CustomFieldDefinitionRecord[]> {
  return tx.customFieldDefinition.findMany({
    where: {
      organizationId: args.organizationId,
      targetEntity: args.targetEntity,
      softDeletedAt: null,
      ...(args.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  }) as unknown as Promise<CustomFieldDefinitionRecord[]>;
}
