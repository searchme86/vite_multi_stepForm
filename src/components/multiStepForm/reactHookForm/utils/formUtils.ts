// src/components/multiStepForm/reactHookForm/utils/formUtils.ts

import type { FormSchemaValues } from '../../types/formTypes';
import type { StepNumber } from '../../types/stepTypes';
import { getStepValidationFields } from '../../types/stepTypes';
import { filterValidFormFields } from '../utils/validationHelpers';
import {
  getAllFieldNames,
  getStringFields,
  getBooleanFields,
} from '../../utils/formFieldsLoader.ts';

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

// 🚀 동적 필수 필드 조회
const getAllRequiredFields = (): string[] => {
  console.log('📋 formUtils: 동적 필수 필드 조회 시작');
  // 모든 필드가 required
  const allFields = getAllFieldNames();
  console.log(
    `✅ formUtils: 필수 필드 ${allFields.length}개 조회 완료`,
    allFields
  );
  return allFields;
};

// 🚀 동적 문자열 필드 조회
const getDynamicStringFields = (): string[] => {
  console.log('📝 formUtils: 동적 문자열 필드 조회 시작');
  const stringFields = getStringFields();
  console.log(
    `✅ formUtils: 문자열 필드 ${stringFields.length}개 조회 완료`,
    stringFields
  );
  return stringFields;
};

// 🚀 동적 불린 필드 조회
const getDynamicBooleanFields = (): string[] => {
  console.log('🔘 formUtils: 동적 불린 필드 조회 시작');
  const booleanFields = getBooleanFields();
  console.log(
    `✅ formUtils: 불린 필드 ${booleanFields.length}개 조회 완료`,
    booleanFields
  );
  return booleanFields;
};

// 🚀 이메일 필드 동적 검증
const createEmailFieldValidator = () => {
  const emailFieldsSet = new Set(['emailPrefix', 'emailDomain']);

  const isEmailField = (fieldName: string): boolean => {
    return emailFieldsSet.has(fieldName);
  };

  const validateEmailField = (
    fieldName: string,
    fieldValue: unknown
  ): boolean => {
    if (!isEmailField(fieldName)) {
      return true; // 이메일 필드가 아니면 통과
    }

    if (typeof fieldValue !== 'string') {
      return false;
    }

    const trimmedValue = fieldValue.trim();
    return trimmedValue.length >= 2 && trimmedValue.length <= 64;
  };

  return { isEmailField, validateEmailField };
};

const EMAIL_VALIDATOR = createEmailFieldValidator();

// 🚀 에디터 필드 동적 검증
const createEditorFieldValidator = () => {
  const editorFieldPatterns = new Set([
    'editorCompleted',
    'editor',
    'iseditorcompleted',
    'editorcompleted',
    'isEditorCompleted',
  ]);

  const isEditorField = (fieldName: string): boolean => {
    const lowerFieldName = fieldName.toLowerCase();
    return editorFieldPatterns.has(lowerFieldName);
  };

  return { isEditorField };
};

const EDITOR_VALIDATOR = createEditorFieldValidator();

// 🚀 단순한 캐시 시스템
const validationFieldsCache = new Map<StepNumber, string[]>();

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

// 🚀 필드 값 조회 - Reflect 기반
const getFieldValue = (
  formValues: FormSchemaValues,
  fieldKey: string
): unknown => {
  return Reflect.get(formValues, fieldKey);
};

// 🚀 필드 값 설정 - Reflect 기반
const setFieldValue = (
  targetObject: Record<string, unknown>,
  fieldKey: string,
  newValue: unknown
): void => {
  if (typeof fieldKey === 'string' && fieldKey.length > 0) {
    Reflect.set(targetObject, fieldKey, newValue);
  }
};

// 🚀 이메일 검증 - 실무형
const validateEmailComponents = (
  emailPrefix: string,
  emailDomain: string
): boolean => {
  const trimmedPrefix = emailPrefix.trim();
  const trimmedDomain = emailDomain.trim();

  // EMAIL_VALIDATOR 사용한 추가 검증
  const prefixValid = EMAIL_VALIDATOR.validateEmailField(
    'emailPrefix',
    trimmedPrefix
  );
  const domainValid = EMAIL_VALIDATOR.validateEmailField(
    'emailDomain',
    trimmedDomain
  );

  const prefixLength = trimmedPrefix.length;
  const domainLength = trimmedDomain.length;

  // 최소 길이 검증 (실무에서 자주 사용)
  const isValidPrefix = prefixLength >= 2 && prefixLength <= 64 && prefixValid;
  const isValidDomain = domainLength >= 3 && domainLength <= 253 && domainValid;

  console.log('📧 formUtils: 이메일 컴포넌트 검증', {
    prefixLength,
    domainLength,
    isValidPrefix,
    isValidDomain,
    prefixValid,
    domainValid,
  });

  return isValidPrefix && isValidDomain;
};

// 🚀 이메일 생성 - 동적 필드 기반
const constructEmailString = (
  formValues: FormSchemaValues
): EmailConstructionResult => {
  console.log('📮 formUtils: 이메일 생성 시작');

  // 동적으로 이메일 필드 추출
  const emailPrefixValue = getFieldValue(formValues, 'emailPrefix');
  const emailDomainValue = getFieldValue(formValues, 'emailDomain');

  const prefixStr =
    typeof emailPrefixValue === 'string' ? emailPrefixValue : '';
  const domainStr =
    typeof emailDomainValue === 'string' ? emailDomainValue : '';

  const isValid = validateEmailComponents(prefixStr, domainStr);

  if (!isValid) {
    console.log('❌ formUtils: 이메일 검증 실패');
    return { fullEmail: '', isValid: false };
  }

  const fullEmail = `${prefixStr.trim()}@${domainStr.trim()}`;
  console.log('✅ formUtils: 이메일 생성 완료', fullEmail);
  return { fullEmail, isValid: true };
};

// 🚀 필드 완성도 검증 - 타입별 처리
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

  if (typeof fieldValue === 'string') {
    return fieldValue.trim().length > 0;
  }

  if (typeof fieldValue === 'number') {
    return !Number.isNaN(fieldValue) && Number.isFinite(fieldValue);
  }

  return Boolean(fieldValue);
};

// 🚀 진행률 계산 - 동적 필드 기반
const calculateFormProgress = (
  formValues: FormSchemaValues
): ProgressCalculationResult => {
  console.log('📊 formUtils: 진행률 계산 시작');

  const allRequiredFields = getAllRequiredFields();
  const totalFields = allRequiredFields.length;

  if (totalFields === 0) {
    console.log('⚠️ formUtils: 필수 필드가 없음');
    return { progressPercentage: 100, completedFields: 0, totalFields: 0 };
  }

  let completedFields = 0;

  for (const field of allRequiredFields) {
    const fieldValue = getFieldValue(formValues, field);
    if (validateFieldCompleteness(fieldValue)) {
      completedFields += 1;
    }
  }

  const progressPercentage = (completedFields / totalFields) * 100;

  console.log(`✅ formUtils: 진행률 계산 완료`, {
    completedFields,
    totalFields,
    progressPercentage: Math.round(progressPercentage),
  });

  return { progressPercentage, completedFields, totalFields };
};

// 🚀 문자열 필드 정리 - 실무형
const sanitizeStringField = (input: unknown): string => {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input === 'string') {
    // XSS 방지를 위한 기본적인 정리
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .slice(0, 1000); // 최대 길이 제한
  }

  return String(input).trim().slice(0, 1000);
};

// 🚀 폼 데이터 정리 - 동적 필드 기반
const sanitizeFormDataInternal = (
  formValues: FormSchemaValues
): SanitizationResult => {
  console.log('🧹 formUtils: 폼 데이터 정리 시작');

  const sanitized = { ...formValues };
  const stringFields = getDynamicStringFields();
  let processedFields = 0;

  for (const field of stringFields) {
    const originalValue = getFieldValue(formValues, field);
    if (typeof originalValue === 'string') {
      const sanitizedValue = sanitizeStringField(originalValue);
      setFieldValue(sanitized, field, sanitizedValue);
      processedFields += 1;
      console.log(`🧽 formUtils: ${field} 필드 정리 완료`);
    }
  }

  console.log(
    `✅ formUtils: 데이터 정리 완료 (${processedFields}개 필드 처리)`
  );
  return { sanitizedData: sanitized, processedFields };
};

// 🚀 에디터 검증 필요 여부 확인 - 동적
const checkEditorValidationRequirement = (
  fields: readonly string[]
): boolean => {
  const hasEditorField = fields.some((field) => {
    return EDITOR_VALIDATOR.isEditorField(field);
  });

  console.log('✏️ formUtils: 에디터 검증 필요 여부', hasEditorField);
  return hasEditorField;
};

// 🚀 스텝 필드 검증 - 동적 타입 처리
const validateStepFieldsCompletion = (
  fields: readonly string[],
  formValues: FormSchemaValues
): number => {
  console.log('🔍 formUtils: 스텝 필드 검증 시작');

  let validatedFields = 0;
  const booleanFields = getDynamicBooleanFields();
  const booleanFieldsSet = new Set(booleanFields);

  for (const field of fields) {
    const fieldValue = getFieldValue(formValues, field);

    if (booleanFieldsSet.has(field)) {
      // 불린 필드 특별 처리
      const isValid = typeof fieldValue === 'boolean' ? fieldValue : false;
      if (isValid) {
        validatedFields += 1;
        console.log(`✅ formUtils: 불린 필드 ${field} 검증 성공`);
      }
    } else {
      // 일반 필드 처리
      const isValid = validateFieldCompleteness(fieldValue);
      if (isValid) {
        validatedFields += 1;
        console.log(`✅ formUtils: 필드 ${field} 검증 성공`);
      }
    }
  }

  console.log(
    `✅ formUtils: 스텝 필드 검증 완료 (${validatedFields}/${fields.length})`
  );
  return validatedFields;
};

// 🚀 스텝 완료 여부 확인 - 완전 동적화
const checkStepCompletion = (
  step: StepNumber,
  formValues: FormSchemaValues
): StepCompletionResult => {
  console.log(`🎯 formUtils: 스텝 ${step} 완료 확인 시작`);

  const rawFields = getStepValidationFields(step);
  const validFields = getCachedStepValidationFields(step);
  const totalFields = validFields.length;

  if (totalFields === 0) {
    console.log(`✅ formUtils: 스텝 ${step} 필드 없음 - 완료 처리`);
    return {
      isComplete: true,
      validatedFields: 0,
      totalFields: 0,
      hasEditorValidation: false,
    };
  }

  const hasEditorValidation = checkEditorValidationRequirement(rawFields);

  if (hasEditorValidation) {
    // 에디터 검증 우선 처리
    const editorFieldValue = getFieldValue(formValues, 'isEditorCompleted');
    const isValid =
      typeof editorFieldValue === 'boolean' ? editorFieldValue : false;

    console.log(`✏️ formUtils: 스텝 ${step} 에디터 검증 결과`, isValid);

    return {
      isComplete: isValid,
      validatedFields: isValid ? 1 : 0,
      totalFields: 1,
      hasEditorValidation: true,
    };
  }

  // 일반 필드 검증
  const validatedFields = validateStepFieldsCompletion(validFields, formValues);
  const isComplete = validatedFields === totalFields;

  console.log(`🎯 formUtils: 스텝 ${step} 완료 확인 완료`, {
    isComplete,
    validatedFields,
    totalFields,
  });

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
  console.log('📦 formUtils: 다중 스텝 검증 시작', steps);

  const results = steps.map((step) => {
    console.log(`🔄 formUtils: 스텝 ${step} 검증 중...`);
    return checkStepCompletion(step, formValues);
  });

  console.log('✅ formUtils: 다중 스텝 검증 완료');
  return results;
};

// 🚀 캐시 정리
export const clearCache = (): void => {
  console.log('🗑️ formUtils: 캐시 정리 시작');
  validationFieldsCache.clear();
  console.log('✅ formUtils: 캐시 정리 완료');
};

// 🚀 동적 필드 그룹 조회 API
export const getDynamicRequiredFields = (): string[] => {
  return getAllRequiredFields();
};

export const getDynamicStringFieldsList = (): string[] => {
  return getDynamicStringFields();
};

export const getDynamicBooleanFieldsList = (): string[] => {
  return getDynamicBooleanFields();
};
