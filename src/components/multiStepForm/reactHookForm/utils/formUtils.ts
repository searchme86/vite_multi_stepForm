// src/components/multiStepForm/reactHookForm/utils/formUtils.ts

import type { FormSchemaValues } from '../../types/formTypes';
import type { StepNumber } from '../../types/stepTypes';
import { getStepValidationFields } from '../../types/stepTypes';
import { filterValidFormFields } from '../utils/validationHelpers';

interface EmailConstructionResult {
  readonly fullEmail: string;
  readonly isValid: boolean;
}

interface ProgressCalculationResult {
  readonly progressPercentage: number;
  readonly completedFields: number;
  readonly totalFields: number;
}

interface SanitizationResult {
  readonly sanitizedData: FormSchemaValues;
  readonly processedFields: number;
}

interface StepCompletionResult {
  readonly isComplete: boolean;
  readonly validatedFields: number;
  readonly totalFields: number;
  readonly hasEditorValidation: boolean;
}

// 🚀 단순한 캐시 시스템
const validationFieldsCache = new Map<StepNumber, string[]>();

// 🚀 필수 필드 목록
const REQUIRED_FIELDS: readonly (keyof FormSchemaValues)[] = [
  'nickname',
  'emailPrefix',
  'emailDomain',
  'title',
  'description',
  'content',
];

// 🚀 정리할 문자열 필드 목록
const STRING_FIELDS: readonly (keyof FormSchemaValues)[] = [
  'nickname',
  'emailPrefix',
  'emailDomain',
  'title',
  'description',
  'content',
  'tags',
  'bio',
];

// 🚀 에디터 필드 패턴
const EDITOR_FIELD_PATTERNS = new Set([
  'editorCompleted',
  'editor',
  'iseditorcompleted',
  'editorcompleted',
]);

// 🚀 캐시된 검증 필드 조회
const getCachedStepValidationFields = (step: StepNumber): string[] => {
  const cached = validationFieldsCache.get(step);
  if (cached) {
    return cached;
  }

  const rawFields = getStepValidationFields(step);
  const validFields = filterValidFormFields(rawFields);

  validationFieldsCache.set(step, validFields);
  return validFields;
};

// 🚀 필드 값 조회
const getFieldValue = (
  formValues: FormSchemaValues,
  fieldKey: string
): unknown => {
  return Reflect.get(formValues, fieldKey);
};

// 🚀 필드 값 설정
const setFieldValue = (
  targetObject: Record<string, unknown>,
  fieldKey: string,
  newValue: unknown
): void => {
  if (typeof fieldKey === 'string' && fieldKey.length > 0) {
    Reflect.set(targetObject, fieldKey, newValue);
  }
};

// 🚀 이메일 검증
const validateEmailComponents = (
  emailPrefix: string,
  emailDomain: string
): boolean => {
  const prefixLength = emailPrefix.trim().length;
  const domainLength = emailDomain.trim().length;
  return prefixLength > 0 && domainLength > 0;
};

// 🚀 이메일 생성
const constructEmailString = (
  formValues: FormSchemaValues
): EmailConstructionResult => {
  const { emailPrefix = '', emailDomain = '' } = formValues;

  const prefixStr = String(emailPrefix);
  const domainStr = String(emailDomain);

  const isValid = validateEmailComponents(prefixStr, domainStr);

  if (!isValid) {
    return { fullEmail: '', isValid: false };
  }

  const fullEmail = `${prefixStr.trim()}@${domainStr.trim()}`;
  return { fullEmail, isValid: true };
};

// 🚀 필드 완성도 검증
const validateFieldCompleteness = (fieldValue: unknown): boolean => {
  if (fieldValue === null || fieldValue === undefined) {
    return false;
  }

  if (typeof fieldValue === 'boolean') {
    return fieldValue;
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.length > 0;
  }

  if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
    const stringValue = String(fieldValue);
    return stringValue.trim().length > 0;
  }

  return Boolean(fieldValue);
};

// 🚀 진행률 계산
const calculateFormProgress = (
  formValues: FormSchemaValues
): ProgressCalculationResult => {
  const totalFields = REQUIRED_FIELDS.length;

  if (totalFields === 0) {
    return { progressPercentage: 100, completedFields: 0, totalFields: 0 };
  }

  let completedFields = 0;

  for (const field of REQUIRED_FIELDS) {
    const fieldValue = getFieldValue(formValues, field);
    if (validateFieldCompleteness(fieldValue)) {
      completedFields += 1;
    }
  }

  const progressPercentage = (completedFields / totalFields) * 100;
  return { progressPercentage, completedFields, totalFields };
};

// 🚀 문자열 필드 정리
const sanitizeStringField = (input: unknown): string => {
  if (input === null || input === undefined) {
    return '';
  }
  return String(input).trim();
};

// 🚀 폼 데이터 정리
const sanitizeFormDataInternal = (
  formValues: FormSchemaValues
): SanitizationResult => {
  const sanitized = { ...formValues };
  let processedFields = 0;

  for (const field of STRING_FIELDS) {
    const originalValue = getFieldValue(formValues, field);
    if (typeof originalValue === 'string') {
      const sanitizedValue = sanitizeStringField(originalValue);
      setFieldValue(sanitized, field, sanitizedValue);
      processedFields += 1;
    }
  }

  return { sanitizedData: sanitized, processedFields };
};

// 🚀 에디터 검증 필요 여부 확인
const checkEditorValidationRequirement = (
  fields: readonly string[]
): boolean => {
  return fields.some((field) => {
    const lowerField = field.toLowerCase();
    return EDITOR_FIELD_PATTERNS.has(lowerField);
  });
};

// 🚀 스텝 필드 검증
const validateStepFieldsCompletion = (
  fields: readonly string[],
  formValues: FormSchemaValues
): number => {
  let validatedFields = 0;

  for (const field of fields) {
    const fieldValue = getFieldValue(formValues, field);

    if (field === 'isEditorCompleted') {
      const isValid = typeof fieldValue === 'boolean' ? fieldValue : false;
      if (isValid) validatedFields += 1;
    } else {
      const isValid = validateFieldCompleteness(fieldValue);
      if (isValid) validatedFields += 1;
    }
  }

  return validatedFields;
};

// 🚀 스텝 완료 여부 확인
const checkStepCompletion = (
  step: StepNumber,
  formValues: FormSchemaValues
): StepCompletionResult => {
  const rawFields = getStepValidationFields(step);
  const validFields = getCachedStepValidationFields(step);
  const totalFields = validFields.length;

  if (totalFields === 0) {
    return {
      isComplete: true,
      validatedFields: 0,
      totalFields: 0,
      hasEditorValidation: false,
    };
  }

  const hasEditorValidation = checkEditorValidationRequirement(rawFields);

  if (hasEditorValidation) {
    const { isEditorCompleted = false } = formValues;
    const isValid =
      typeof isEditorCompleted === 'boolean' ? isEditorCompleted : false;

    return {
      isComplete: isValid,
      validatedFields: isValid ? 1 : 0,
      totalFields: 1,
      hasEditorValidation: true,
    };
  }

  const validatedFields = validateStepFieldsCompletion(validFields, formValues);
  const isComplete = validatedFields === totalFields;

  return {
    isComplete,
    validatedFields,
    totalFields,
    hasEditorValidation: false,
  };
};

// 🚀 외부 인터페이스
export const getEmailFromForm = (formValues: FormSchemaValues): string => {
  const result = constructEmailString(formValues);
  return result.fullEmail;
};

export const getFormProgress = (formValues: FormSchemaValues): number => {
  const result = calculateFormProgress(formValues);
  return result.progressPercentage;
};

export const sanitizeFormData = (
  formValues: FormSchemaValues
): FormSchemaValues => {
  const result = sanitizeFormDataInternal(formValues);
  return result.sanitizedData;
};

export const isStepComplete = (
  step: StepNumber,
  formValues: FormSchemaValues
): boolean => {
  const result = checkStepCompletion(step, formValues);
  return result.isComplete;
};

// 🚀 상세 정보 포함 API
export const getEmailConstructionDetails = (
  formValues: FormSchemaValues
): EmailConstructionResult => {
  return constructEmailString(formValues);
};

export const getFormProgressDetails = (
  formValues: FormSchemaValues
): ProgressCalculationResult => {
  return calculateFormProgress(formValues);
};

export const getSanitizationDetails = (
  formValues: FormSchemaValues
): SanitizationResult => {
  return sanitizeFormDataInternal(formValues);
};

export const getStepCompletionDetails = (
  step: StepNumber,
  formValues: FormSchemaValues
): StepCompletionResult => {
  return checkStepCompletion(step, formValues);
};

// 🚀 배치 처리 API
export const validateMultipleSteps = (
  steps: readonly StepNumber[],
  formValues: FormSchemaValues
): readonly StepCompletionResult[] => {
  return steps.map((step) => checkStepCompletion(step, formValues));
};

// 🚀 캐시 정리
export const clearCache = (): void => {
  validationFieldsCache.clear();
};
