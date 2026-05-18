export type CustomFieldTargetEntity =
  | 'CLIENT'
  | 'SERVICE'
  | 'APPOINTMENT'
  | 'STAFF'
  | 'PRODUCT';

export type CustomFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'URL'
  | 'EMAIL'
  | 'PHONE';

/**
 * Type-specific validation rules. Stored in CustomFieldDefinition.validationRules
 * as JSONB. All fields optional; absent = no constraint.
 */
export interface ValidationRules {
  // TEXT, TEXTAREA, URL, EMAIL, PHONE
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex string

  // NUMBER
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;

  // DATE, DATETIME
  minDate?: string; // ISO format
  maxDate?: string;

  // SELECT, MULTI_SELECT
  options?: Array<{ value: string; label: string }>;
  minSelections?: number; // MULTI_SELECT only
  maxSelections?: number; // MULTI_SELECT only
}

/**
 * Discriminated union for stored values. The shape depends on fieldType.
 */
export type CustomFieldValueShape =
  | { text: string }
  | { number: number }
  | { date: string } // YYYY-MM-DD
  | { datetime: string } // ISO 8601
  | { boolean: boolean }
  | { selected: string } // SELECT
  | { selected: string[] }; // MULTI_SELECT

export interface CustomFieldDefinitionRecord {
  id: string;
  organizationId: string;
  targetEntity: CustomFieldTargetEntity;
  key: string;
  displayName: string;
  description: string | null;
  fieldType: CustomFieldType;
  isRequired: boolean;
  displayOrder: number;
  validationRules: ValidationRules;
  defaultValue: CustomFieldValueShape | null;
  visibleToCustomers: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  softDeletedAt: Date | null;
}

export interface CustomFieldValueRecord {
  id: string;
  organizationId: string;
  definitionId: string;
  entityId: string;
  value: CustomFieldValueShape;
  createdAt: Date;
  updatedAt: Date;
}

export const VALID_KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const VALID_TARGET_ENTITIES: CustomFieldTargetEntity[] =
  ['CLIENT', 'SERVICE', 'APPOINTMENT', 'STAFF', 'PRODUCT'];
export const VALID_FIELD_TYPES: CustomFieldType[] =
  ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN',
   'SELECT', 'MULTI_SELECT', 'URL', 'EMAIL', 'PHONE'];
