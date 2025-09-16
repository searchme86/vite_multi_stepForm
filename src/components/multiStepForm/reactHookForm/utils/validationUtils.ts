// src/components/multiStepForm/reactHookForm/utils/validationUtils.ts

import type { StepNumber } from '../../types/stepTypes';
import { getStepValidationFields } from '../../types/stepTypes';
import { filterValidFormFields } from '../utils/validationHelpers';

interface ValidationResult {
  readonly isValid: boolean;
  readonly message?: string;
}

interface ValidationRule {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly errorMessage: string;
}

// 🚀 검증 규칙 매핑
const VALIDATION_RULES = new Map<string, ValidationRule>([
  [
    'nickname',
    {
      minLength: 4,
      maxLength: 20,
      errorMessage: '닉네임은 4자 이상 20자 이하로 입력해주세요.',
    },
  ],
  [
    'title',
    {
      minLength: 5,
      maxLength: 100,
      errorMessage: '제목은 5자 이상 100자 이하로 작성해주세요.',
    },
  ],
  [
    'content',
    {
      minLength: 5,
      errorMessage: '블로그 내용이 최소 5자 이상이어야 합니다.',
    },
  ],
  [
    'email',
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessage: '올바른 이메일 형식을 입력해주세요.',
    },
  ],
]);

// 🚀 캐싱된 필드 목록
const stepValidationFieldsCache = new Map<StepNumber, string[]>();

const getCachedFieldsToValidate = (step: StepNumber): string[] => {
  const cached = stepValidationFieldsCache.get(step);
  if (cached) {
    return cached;
  }

  const rawFields = getStepValidationFields(step);
  const validFields = filterValidFormFields(rawFields);

  stepValidationFieldsCache.set(step, validFields);
  return validFields;
};

// 🚀 문자열 길이 검증
const validateStringLength = (
  input: string,
  rule: ValidationRule
): ValidationResult => {
  const trimmed = input.trim();
  const { minLength, maxLength, errorMessage } = rule;

  if (minLength !== undefined && trimmed.length < minLength) {
    return { isValid: false, message: errorMessage };
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { isValid: false, message: errorMessage };
  }

  return { isValid: true };
};

// 🚀 패턴 검증
const validateStringPattern = (
  input: string,
  rule: ValidationRule
): ValidationResult => {
  const { pattern, errorMessage } = rule;

  if (!pattern) {
    return { isValid: true };
  }

  const isValid = pattern.test(input);
  return {
    isValid,
    message: isValid ? undefined : errorMessage,
  };
};

// 🚀 통합 검증
const executeValidation = (
  input: string,
  fieldType: string
): ValidationResult => {
  const rule = VALIDATION_RULES.get(fieldType);

  if (!rule) {
    return { isValid: true };
  }

  // 길이 검증
  const lengthResult = validateStringLength(input, rule);
  if (!lengthResult.isValid) {
    return lengthResult;
  }

  // 패턴 검증
  return validateStringPattern(input, rule);
};

// 🚀 이메일 생성
const constructEmail = (prefix: string, domain: string): string => {
  return `${prefix.trim()}@${domain.trim()}`;
};

// 🚀 이메일 검증
const validateEmailOptimized = (
  emailPrefix: string,
  emailDomain: string
): ValidationResult => {
  const fullEmail = constructEmail(emailPrefix, emailDomain);
  return executeValidation(fullEmail, 'email');
};

// 🚀 외부 인터페이스
export const getFieldsToValidate = getCachedFieldsToValidate;

export const validateEmail = (
  emailPrefix: string,
  emailDomain: string
): boolean => {
  const result = validateEmailOptimized(emailPrefix, emailDomain);
  return result.isValid;
};

export const validateNickname = (
  nickname: string
): { isValid: boolean; message?: string } => {
  return executeValidation(nickname, 'nickname');
};

export const validateTitle = (
  title: string
): { isValid: boolean; message?: string } => {
  return executeValidation(title, 'title');
};

export const validateContent = (
  content: string
): { isValid: boolean; message?: string } => {
  return executeValidation(content, 'content');
};

// 🚀 통합 검증 API
export const validateFieldUnified = (
  fieldValue: string,
  fieldType: string
): ValidationResult => {
  return executeValidation(fieldValue, fieldType);
};

// 🚀 배치 검증 API
export const validateMultipleFields = (
  fields: ReadonlyArray<{ value: string; type: string }>
): ReadonlyArray<ValidationResult> => {
  return fields.map(({ value, type }) => executeValidation(value, type));
};

// 🚀 검증 규칙 정보 조회
export const getValidationRuleInfo = (
  fieldType: string
): ValidationRule | undefined => {
  return VALIDATION_RULES.get(fieldType);
};

export const getAllValidationRules = (): Record<string, ValidationRule> => {
  return Object.fromEntries(VALIDATION_RULES);
};
