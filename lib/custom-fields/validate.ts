import type {
  CustomFieldType,
  CustomFieldValueShape,
  ValidationRules,
} from './types';

export class CustomFieldValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'CustomFieldValidationError';
  }
}

/**
 * Validate that a value matches the expected shape for the given fieldType,
 * and that it satisfies the validation rules.
 *
 * Throws CustomFieldValidationError on first violation. Returns the normalized
 * value on success.
 */
export function validateValue(args: {
  fieldType: CustomFieldType;
  rules: ValidationRules;
  value: unknown;
  fieldName: string;
}): CustomFieldValueShape {
  const { fieldType, rules, value, fieldName } = args;

  if (value === null || value === undefined) {
    throw new CustomFieldValidationError(fieldName, 'value is required');
  }

  switch (fieldType) {
    case 'TEXT':
    case 'TEXTAREA':
    case 'URL':
    case 'EMAIL':
    case 'PHONE':
      return validateTextLike(fieldName, fieldType, value, rules);

    case 'NUMBER':
      return validateNumber(fieldName, value, rules);

    case 'DATE':
      return validateDate(fieldName, value, rules);

    case 'DATETIME':
      return validateDatetime(fieldName, value, rules);

    case 'BOOLEAN':
      return validateBoolean(fieldName, value);

    case 'SELECT':
      return validateSelect(fieldName, value, rules);

    case 'MULTI_SELECT':
      return validateMultiSelect(fieldName, value, rules);

    default: {
      const _exhaustive: never = fieldType;
      throw new Error(`Unhandled fieldType: ${_exhaustive}`);
    }
  }
}

function validateTextLike(
  fieldName: string,
  fieldType: CustomFieldType,
  value: unknown,
  rules: ValidationRules
): CustomFieldValueShape {
  const text = typeof value === 'string' ? value : (value as { text?: unknown })?.text;
  if (typeof text !== 'string') {
    throw new CustomFieldValidationError(fieldName, 'must be a string');
  }
  if (rules.minLength !== undefined && text.length < rules.minLength) {
    throw new CustomFieldValidationError(
      fieldName,
      `minimum length is ${rules.minLength}, got ${text.length}`
    );
  }
  if (rules.maxLength !== undefined && text.length > rules.maxLength) {
    throw new CustomFieldValidationError(
      fieldName,
      `maximum length is ${rules.maxLength}, got ${text.length}`
    );
  }
  if (rules.pattern) {
    let re: RegExp;
    try {
      re = new RegExp(rules.pattern);
    } catch {
      throw new CustomFieldValidationError(
        fieldName,
        'invalid pattern in field definition'
      );
    }
    if (!re.test(text)) {
      throw new CustomFieldValidationError(fieldName, 'does not match pattern');
    }
  }
  if (fieldType === 'EMAIL' && !isValidEmail(text)) {
    throw new CustomFieldValidationError(fieldName, 'not a valid email');
  }
  if (fieldType === 'URL' && !isValidUrl(text)) {
    throw new CustomFieldValidationError(fieldName, 'not a valid URL');
  }
  if (fieldType === 'PHONE' && !isValidPhone(text)) {
    throw new CustomFieldValidationError(fieldName, 'not a valid phone number');
  }
  return { text };
}

function validateNumber(
  fieldName: string,
  value: unknown,
  rules: ValidationRules
): CustomFieldValueShape {
  const num = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? parseFloat(value)
      : (value as { number?: unknown })?.number;
  if (typeof num !== 'number' || Number.isNaN(num) || !Number.isFinite(num)) {
    throw new CustomFieldValidationError(fieldName, 'must be a finite number');
  }
  if (rules.integer && !Number.isInteger(num)) {
    throw new CustomFieldValidationError(fieldName, 'must be an integer');
  }
  if (rules.min !== undefined && num < rules.min) {
    throw new CustomFieldValidationError(
      fieldName,
      `minimum is ${rules.min}, got ${num}`
    );
  }
  if (rules.max !== undefined && num > rules.max) {
    throw new CustomFieldValidationError(
      fieldName,
      `maximum is ${rules.max}, got ${num}`
    );
  }
  return { number: num };
}

function validateDate(
  fieldName: string,
  value: unknown,
  rules: ValidationRules
): CustomFieldValueShape {
  const dateStr = typeof value === 'string'
    ? value
    : (value as { date?: unknown })?.date;
  if (typeof dateStr !== 'string') {
    throw new CustomFieldValidationError(fieldName, 'must be a YYYY-MM-DD date string');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new CustomFieldValidationError(fieldName, 'must be YYYY-MM-DD format');
  }
  const parsed = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(parsed.getTime())) {
    throw new CustomFieldValidationError(fieldName, 'not a valid date');
  }
  if (rules.minDate && dateStr < rules.minDate) {
    throw new CustomFieldValidationError(
      fieldName,
      `earliest allowed date is ${rules.minDate}`
    );
  }
  if (rules.maxDate && dateStr > rules.maxDate) {
    throw new CustomFieldValidationError(
      fieldName,
      `latest allowed date is ${rules.maxDate}`
    );
  }
  return { date: dateStr };
}

function validateDatetime(
  fieldName: string,
  value: unknown,
  rules: ValidationRules
): CustomFieldValueShape {
  const dtStr = typeof value === 'string'
    ? value
    : (value as { datetime?: unknown })?.datetime;
  if (typeof dtStr !== 'string') {
    throw new CustomFieldValidationError(fieldName, 'must be an ISO 8601 datetime string');
  }
  const parsed = new Date(dtStr);
  if (Number.isNaN(parsed.getTime())) {
    throw new CustomFieldValidationError(fieldName, 'not a valid datetime');
  }
  if (rules.minDate) {
    const min = new Date(rules.minDate);
    if (parsed < min) {
      throw new CustomFieldValidationError(
        fieldName,
        `earliest allowed is ${rules.minDate}`
      );
    }
  }
  if (rules.maxDate) {
    const max = new Date(rules.maxDate);
    if (parsed > max) {
      throw new CustomFieldValidationError(
        fieldName,
        `latest allowed is ${rules.maxDate}`
      );
    }
  }
  return { datetime: parsed.toISOString() };
}

function validateBoolean(
  fieldName: string,
  value: unknown
): CustomFieldValueShape {
  const bool = typeof value === 'boolean'
    ? value
    : (value as { boolean?: unknown })?.boolean;
  if (typeof bool !== 'boolean') {
    throw new CustomFieldValidationError(fieldName, 'must be a boolean');
  }
  return { boolean: bool };
}

function validateSelect(
  fieldName: string,
  value: unknown,
  rules: ValidationRules
): CustomFieldValueShape {
  const selected = typeof value === 'string'
    ? value
    : (value as { selected?: unknown })?.selected;
  if (typeof selected !== 'string') {
    throw new CustomFieldValidationError(fieldName, 'must be a string option value');
  }
  if (!rules.options || rules.options.length === 0) {
    throw new CustomFieldValidationError(
      fieldName,
      'no options defined in validation rules'
    );
  }
  const validValues = rules.options.map(o => o.value);
  if (!validValues.includes(selected)) {
    throw new CustomFieldValidationError(
      fieldName,
      `'${selected}' is not a valid option`
    );
  }
  return { selected };
}

function validateMultiSelect(
  fieldName: string,
  value: unknown,
  rules: ValidationRules
): CustomFieldValueShape {
  const selected = Array.isArray(value)
    ? value
    : (value as { selected?: unknown })?.selected;
  if (!Array.isArray(selected)) {
    throw new CustomFieldValidationError(fieldName, 'must be an array of option values');
  }
  if (!selected.every(s => typeof s === 'string')) {
    throw new CustomFieldValidationError(fieldName, 'all values must be strings');
  }
  if (!rules.options || rules.options.length === 0) {
    throw new CustomFieldValidationError(
      fieldName,
      'no options defined in validation rules'
    );
  }
  const validValues = new Set(rules.options.map(o => o.value));
  for (const s of selected) {
    if (!validValues.has(s)) {
      throw new CustomFieldValidationError(
        fieldName,
        `'${s}' is not a valid option`
      );
    }
  }
  if (rules.minSelections !== undefined && selected.length < rules.minSelections) {
    throw new CustomFieldValidationError(
      fieldName,
      `select at least ${rules.minSelections}, got ${selected.length}`
    );
  }
  if (rules.maxSelections !== undefined && selected.length > rules.maxSelections) {
    throw new CustomFieldValidationError(
      fieldName,
      `select at most ${rules.maxSelections}, got ${selected.length}`
    );
  }
  return { selected: Array.from(new Set(selected)) as string[] };
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function isValidPhone(s: string): boolean {
  const digits = s.replace(/[\s\-().]/g, '');
  return /^\+?[0-9]{7,15}$/.test(digits);
}
