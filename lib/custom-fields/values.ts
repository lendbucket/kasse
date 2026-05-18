import type { Prisma } from '@prisma/client';
import type {
  CustomFieldValueShape,
  CustomFieldTargetEntity,
} from './types';
import { validateValue, CustomFieldValidationError } from './validate';
import type { CustomFieldType, ValidationRules } from './types';

/**
 * Set the value of a custom field for a given entity row.
 * Upserts: creates if not exists, updates if exists.
 */
export async function setValue(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    definitionId: string;
    entityId: string;
    rawValue: unknown;
    actorUserId: string;
  }
): Promise<{ valueId: string }> {
  const def = await tx.customFieldDefinition.findFirst({
    where: {
      id: args.definitionId,
      organizationId: args.organizationId,
      softDeletedAt: null,
      isActive: true,
    },
  });
  if (!def) {
    throw new CustomFieldValidationError(
      'definitionId',
      'definition not found or inactive'
    );
  }

  const validated = validateValue({
    fieldType: def.fieldType as CustomFieldType,
    rules: (def.validationRules as ValidationRules) ?? {},
    value: args.rawValue,
    fieldName: def.key,
  });

  const upserted = await tx.customFieldValue.upsert({
    where: {
      definitionId_entityId: {
        definitionId: args.definitionId,
        entityId: args.entityId,
      },
    },
    update: {
      value: validated as unknown as Prisma.InputJsonValue,
      updatedByUserId: args.actorUserId,
    },
    create: {
      organizationId: args.organizationId,
      definitionId: args.definitionId,
      entityId: args.entityId,
      value: validated as unknown as Prisma.InputJsonValue,
      updatedByUserId: args.actorUserId,
    },
  });
  return { valueId: upserted.id };
}

/**
 * Set multiple values at once for a single entity (e.g., on entity creation).
 * Validates all before writing any. Throws on first validation error.
 */
export async function setValues(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    entityId: string;
    targetEntity: CustomFieldTargetEntity;
    values: Record<string, unknown>; // keyed by definition.key
    actorUserId: string;
  }
): Promise<{ valueIds: string[] }> {
  const keys = Object.keys(args.values);
  if (keys.length === 0) return { valueIds: [] };

  const defs = await tx.customFieldDefinition.findMany({
    where: {
      organizationId: args.organizationId,
      targetEntity: args.targetEntity,
      key: { in: keys },
      softDeletedAt: null,
      isActive: true,
    },
  });
  const defMap = new Map(defs.map(d => [d.key, d]));

  // Validate everything before writing
  const validatedPairs: Array<{ def: typeof defs[0]; value: CustomFieldValueShape }> = [];
  for (const [key, raw] of Object.entries(args.values)) {
    const def = defMap.get(key);
    if (!def) {
      throw new CustomFieldValidationError(key, `no active definition for key '${key}'`);
    }
    const validated = validateValue({
      fieldType: def.fieldType as CustomFieldType,
      rules: (def.validationRules as ValidationRules) ?? {},
      value: raw,
      fieldName: key,
    });
    validatedPairs.push({ def, value: validated });
  }

  // Check required fields are present
  const requiredDefs = await tx.customFieldDefinition.findMany({
    where: {
      organizationId: args.organizationId,
      targetEntity: args.targetEntity,
      isRequired: true,
      isActive: true,
      softDeletedAt: null,
    },
  });
  for (const reqDef of requiredDefs) {
    if (!(reqDef.key in args.values)) {
      throw new CustomFieldValidationError(reqDef.key, 'required field missing');
    }
  }

  const valueIds: string[] = [];
  for (const { def, value } of validatedPairs) {
    const upserted = await tx.customFieldValue.upsert({
      where: {
        definitionId_entityId: {
          definitionId: def.id,
          entityId: args.entityId,
        },
      },
      update: {
        value: value as unknown as Prisma.InputJsonValue,
        updatedByUserId: args.actorUserId,
      },
      create: {
        organizationId: args.organizationId,
        definitionId: def.id,
        entityId: args.entityId,
        value: value as unknown as Prisma.InputJsonValue,
        updatedByUserId: args.actorUserId,
      },
    });
    valueIds.push(upserted.id);
  }
  return { valueIds };
}

/**
 * Get all custom field values for an entity, keyed by definition.key.
 */
export async function getValues(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    targetEntity: CustomFieldTargetEntity;
    entityId: string;
  }
): Promise<Record<string, CustomFieldValueShape>> {
  const rows = await tx.customFieldValue.findMany({
    where: {
      organizationId: args.organizationId,
      entityId: args.entityId,
      definition: {
        targetEntity: args.targetEntity,
        softDeletedAt: null,
      },
    },
    include: {
      definition: true,
    },
  });
  const result: Record<string, CustomFieldValueShape> = {};
  for (const row of rows) {
    result[row.definition.key] = row.value as unknown as CustomFieldValueShape;
  }
  return result;
}

/**
 * Delete a value (e.g., user cleared a field).
 */
export async function deleteValue(
  tx: Prisma.TransactionClient,
  args: {
    organizationId: string;
    definitionId: string;
    entityId: string;
  }
): Promise<void> {
  await tx.customFieldValue.deleteMany({
    where: {
      organizationId: args.organizationId,
      definitionId: args.definitionId,
      entityId: args.entityId,
    },
  });
}
