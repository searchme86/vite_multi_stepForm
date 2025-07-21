// src/components/multiStepForm/reactHookForm/validation/StepValidator.tsx

import React from 'react';
import type { StepNumber } from '../../types/stepTypes';
import type { FormSchemaValues } from '../../types/formTypes';
import { getStepValidationFields } from '../../types/stepTypes';
import { createValidationLogger } from '../utils/consoleLoggingUtils';
import {
  isValidFormSchemaKey,
  normalizeFieldName,
  FIELD_MAPPINGS,
} from '../utils/validationHelpers';

interface StepValidatorProps {
  readonly currentStep: StepNumber;
  readonly formValues: FormSchemaValues;
  readonly onValidationResult: (isValid: boolean) => void;
  readonly children: React.ReactNode;
}

interface FieldMappingResult {
  readonly mappedFieldName: keyof FormSchemaValues | null;
  readonly mappingMethod: 'direct' | 'lookup' | 'normalization' | 'none';
  readonly processingTime: number;
}

interface ValidationAnalysis {
  readonly totalFields: number;
  readonly validFields: number;
  readonly invalidFields: number;
  readonly isStepValid: boolean;
  readonly processingTimeMs: number;
}

interface FieldValidationCache {
  readonly result: keyof FormSchemaValues | null;
  readonly timestamp: number;
  readonly mappingMethod: string;
}

// 🚀 O(1) 조회를 위한 최적화된 캐싱 시스템
const optimizedFieldMappingCache = new Map<string, FieldValidationCache>();
const formKeysStaticCache = new Map<string, (keyof FormSchemaValues)[]>();
const CACHE_EXPIRY_TIME_MS = 5000; // 5초 캐시 만료

// 🚀 사전 계산된 매핑 테이블 (O(1) 조회)
const STATIC_FIELD_MAPPINGS_MAP: ReadonlyMap<string, string> = new Map(
  Object.entries(FIELD_MAPPINGS)
);

const isValidFormFieldGuard = (
  fieldName: string,
  formValuesInput: FormSchemaValues
): fieldName is keyof FormSchemaValues => {
  const hasProperty = fieldName in formValuesInput;
  console.log('🔍 StepValidator: 필드 유효성 검증', fieldName, hasProperty);
  return hasProperty;
};

const getCachedFormKeysOptimized = (
  formValuesInput: FormSchemaValues
): (keyof FormSchemaValues)[] => {
  const cacheKey = 'optimizedFormKeys';

  // 캐시 조회 시도
  const cachedEntry = formKeysStaticCache.get(cacheKey);

  if (cachedEntry) {
    console.log('✅ StepValidator: 캐시된 폼 키 사용');
    return cachedEntry;
  }

  // 새로운 키 목록 생성
  const freshFormKeysList =
    Object.keys(formValuesInput).filter(isValidFormSchemaKey);
  formKeysStaticCache.set(cacheKey, freshFormKeysList);

  console.log('🆕 StepValidator: 새로운 폼 키 생성', freshFormKeysList.length);
  return freshFormKeysList;
};

const findFieldByNormalizationOptimized = (
  normalizedValidationFieldInput: string,
  formKeysList: readonly (keyof FormSchemaValues)[]
): keyof FormSchemaValues | null => {
  console.log(
    '🔍 StepValidator: 정규화 기반 필드 검색 시작',
    normalizedValidationFieldInput
  );

  // early return을 위한 순차 검색
  for (const formKey of formKeysList) {
    const normalizedFormKey = normalizeFieldName(String(formKey));

    // 정확한 매칭 우선
    if (normalizedFormKey === normalizedValidationFieldInput) {
      console.log('🎯 StepValidator: 정확한 매칭 발견', formKey);
      return formKey;
    }
  }

  // 부분 매칭 검색
  for (const formKey of formKeysList) {
    const normalizedFormKey = normalizeFieldName(String(formKey));

    const isPartialMatch =
      normalizedFormKey.includes(normalizedValidationFieldInput) ||
      normalizedValidationFieldInput.includes(normalizedFormKey);

    if (isPartialMatch) {
      console.log('📍 StepValidator: 부분 매칭 발견', formKey);
      return formKey;
    }
  }

  console.log('❌ StepValidator: 매칭되는 필드 없음');
  return null;
};

const validateDirectFieldMatchOptimized = (
  validationFieldInput: string,
  formValuesInput: FormSchemaValues
): keyof FormSchemaValues | null => {
  const isDirectMatch = isValidFormFieldGuard(
    validationFieldInput,
    formValuesInput
  );

  const resultField = isDirectMatch ? validationFieldInput : null;
  console.log(
    '🎯 StepValidator: 직접 매칭 결과',
    validationFieldInput,
    '→',
    resultField
  );

  return resultField;
};

const validateMappedFieldMatchOptimized = (
  normalizedValidationFieldInput: string,
  formValuesInput: FormSchemaValues
): keyof FormSchemaValues | null => {
  const mappedFieldName = STATIC_FIELD_MAPPINGS_MAP.get(
    normalizedValidationFieldInput
  );

  if (!mappedFieldName) {
    console.log(
      '❌ StepValidator: 매핑 테이블에서 찾을 수 없음',
      normalizedValidationFieldInput
    );
    return null;
  }

  const isMappedFieldValid = isValidFormFieldGuard(
    mappedFieldName,
    formValuesInput
  );
  const resultMappedField = isMappedFieldValid ? mappedFieldName : null;

  console.log(
    '🗺️ StepValidator: 매핑 결과',
    normalizedValidationFieldInput,
    '→',
    resultMappedField
  );
  return resultMappedField;
};

const isCacheEntryValid = (cacheEntry: FieldValidationCache): boolean => {
  const currentTime = Date.now();
  const isNotExpired =
    currentTime - cacheEntry.timestamp < CACHE_EXPIRY_TIME_MS;

  console.log('⏰ StepValidator: 캐시 유효성', isNotExpired);
  return isNotExpired;
};

const createCacheEntry = (
  mappedFieldResult: keyof FormSchemaValues | null,
  mappingMethodUsed: string
): FieldValidationCache => {
  const cacheEntry: FieldValidationCache = {
    result: mappedFieldResult,
    timestamp: Date.now(),
    mappingMethod: mappingMethodUsed,
  };

  console.log('💾 StepValidator: 캐시 항목 생성', mappingMethodUsed);
  return cacheEntry;
};

const getActualFieldNameOptimized = (
  validationFieldInput: string,
  formValuesInput: FormSchemaValues
): FieldMappingResult => {
  const startTime = performance.now();

  // 캐시 조회 시도
  const cachedEntry = optimizedFieldMappingCache.get(validationFieldInput);

  if (cachedEntry && isCacheEntryValid(cachedEntry)) {
    const processingTime = performance.now() - startTime;
    console.log('⚡ StepValidator: 캐시 히트', validationFieldInput);

    return {
      mappedFieldName: cachedEntry.result,
      mappingMethod: 'direct',
      processingTime,
    };
  }

  // 1단계: 직접 매칭 시도
  const directMatchResult = validateDirectFieldMatchOptimized(
    validationFieldInput,
    formValuesInput
  );

  if (directMatchResult) {
    const cacheEntry = createCacheEntry(directMatchResult, 'direct');
    optimizedFieldMappingCache.set(validationFieldInput, cacheEntry);

    const processingTime = performance.now() - startTime;
    return {
      mappedFieldName: directMatchResult,
      mappingMethod: 'direct',
      processingTime,
    };
  }

  // 2단계: 정규화 후 매핑 테이블 조회
  const normalizedFieldName = normalizeFieldName(validationFieldInput);
  const lookupMatchResult = validateMappedFieldMatchOptimized(
    normalizedFieldName,
    formValuesInput
  );

  if (lookupMatchResult) {
    const cacheEntry = createCacheEntry(lookupMatchResult, 'lookup');
    optimizedFieldMappingCache.set(validationFieldInput, cacheEntry);

    const processingTime = performance.now() - startTime;
    return {
      mappedFieldName: lookupMatchResult,
      mappingMethod: 'lookup',
      processingTime,
    };
  }

  // 3단계: 정규화 기반 유사도 매칭
  const formKeysList = getCachedFormKeysOptimized(formValuesInput);
  const similarityMatchResult = findFieldByNormalizationOptimized(
    normalizedFieldName,
    formKeysList
  );

  if (similarityMatchResult) {
    const cacheEntry = createCacheEntry(similarityMatchResult, 'normalization');
    optimizedFieldMappingCache.set(validationFieldInput, cacheEntry);

    const processingTime = performance.now() - startTime;
    return {
      mappedFieldName: similarityMatchResult,
      mappingMethod: 'normalization',
      processingTime,
    };
  }

  // 4단계: 매칭 실패
  const cacheEntry = createCacheEntry(null, 'none');
  optimizedFieldMappingCache.set(validationFieldInput, cacheEntry);

  const processingTime = performance.now() - startTime;
  console.log('❌ StepValidator: 모든 매칭 실패', validationFieldInput);

  return {
    mappedFieldName: null,
    mappingMethod: 'none',
    processingTime,
  };
};

const validateFieldValueOptimized = (
  valueInput: unknown,
  fieldNameInput: string
): boolean => {
  console.log('🔎 StepValidator: 필드 값 검증 시작', fieldNameInput);

  // null/undefined 체크 (early return)
  if (valueInput === null || valueInput === undefined) {
    console.log('❌ StepValidator: null/undefined 값');
    return false;
  }

  // boolean 타입 처리
  if (typeof valueInput === 'boolean') {
    console.log('✅ StepValidator: boolean 값', valueInput);
    return valueInput;
  }

  // 배열 타입 처리
  if (Array.isArray(valueInput)) {
    const hasArrayItems = valueInput.length > 0;
    console.log('📋 StepValidator: 배열 값', hasArrayItems);
    return hasArrayItems;
  }

  // 에디터 완료 필드 특별 처리
  const normalizedFieldNameForEditor = normalizeFieldName(fieldNameInput);
  const isEditorCompletionField =
    normalizedFieldNameForEditor.includes('editor') &&
    normalizedFieldNameForEditor.includes('completed');

  if (isEditorCompletionField) {
    const editorResult = Boolean(valueInput);
    console.log('✏️ StepValidator: 에디터 완료 필드', editorResult);
    return editorResult;
  }

  // 문자열/숫자 타입 처리
  const isStringOrNumber =
    typeof valueInput === 'string' || typeof valueInput === 'number';

  if (isStringOrNumber) {
    const stringifiedValue = String(valueInput);
    const trimmedValue = stringifiedValue.trim();
    const hasContent = trimmedValue.length > 0;

    console.log('📝 StepValidator: 문자열/숫자 값', hasContent);
    return hasContent;
  }

  // 기타 타입 처리
  const fallbackResult = Boolean(valueInput);
  console.log('🔄 StepValidator: 기타 타입 값', fallbackResult);
  return fallbackResult;
};

const executeStepValidationOptimized = (
  currentStepInput: StepNumber,
  formValuesInput: FormSchemaValues
): ValidationAnalysis => {
  const startTime = performance.now();
  const logger = createValidationLogger(parseInt(String(currentStepInput), 10));

  console.log('🚀 StepValidator: 스텝 검증 시작', currentStepInput);

  const validationFieldsList = getStepValidationFields(currentStepInput);
  const totalFields = validationFieldsList.length;

  // 빈 필드 목록 처리 (early return)
  if (totalFields === 0) {
    logger.logSuccess(0);
    const processingTime = performance.now() - startTime;

    console.log('✅ StepValidator: 빈 필드 목록 - 검증 통과');
    return {
      totalFields: 0,
      validFields: 0,
      invalidFields: 0,
      isStepValid: true,
      processingTimeMs: processingTime,
    };
  }

  let validFieldsCount = 0;
  let invalidFieldsCount = 0;

  // 최적화된 검증 루프
  const validationResultsList = validationFieldsList.map((fieldName) => {
    const mappingResult = getActualFieldNameOptimized(
      fieldName,
      formValuesInput
    );
    const { mappedFieldName } = mappingResult;

    // 매핑 실패 처리 (early return)
    if (!mappedFieldName) {
      logger.logField(fieldName, false);
      invalidFieldsCount += 1;
      console.log('❌ StepValidator: 매핑 실패', fieldName);
      return false;
    }

    // 필드 값 검증
    const fieldValue = formValuesInput[mappedFieldName];
    const isFieldValidResult = validateFieldValueOptimized(
      fieldValue,
      fieldName
    );

    // 결과 카운팅
    if (isFieldValidResult) {
      validFieldsCount += 1;
    } else {
      invalidFieldsCount += 1;
    }

    logger.logField(String(mappedFieldName), isFieldValidResult);
    console.log(
      '🎯 StepValidator: 필드 검증 완료',
      mappedFieldName,
      isFieldValidResult
    );

    return isFieldValidResult;
  });

  // 전체 스텝 유효성 판단
  const isStepValidResult = validationResultsList.every(
    (validationResult) => validationResult === true
  );
  const processingTime = performance.now() - startTime;

  const analysisResult: ValidationAnalysis = {
    totalFields,
    validFields: validFieldsCount,
    invalidFields: invalidFieldsCount,
    isStepValid: isStepValidResult,
    processingTimeMs: processingTime,
  };

  // 로깅
  const logMessage = isStepValidResult
    ? `✅ 검증 성공: ${validFieldsCount}개 필드`
    : `❌ 검증 실패: ${invalidFieldsCount}개 필드`;

  isStepValidResult
    ? logger.logSuccess(validFieldsCount)
    : logger.logFailure([`${invalidFieldsCount}개 필드 검증 실패`]);

  console.log(
    '🏁 StepValidator: 검증 완료',
    logMessage,
    `${processingTime.toFixed(2)}ms`
  );
  return analysisResult;
};

const processStepValidationOptimized = (
  currentStepInput: StepNumber,
  formValuesInput: FormSchemaValues,
  onValidationResultCallback: (isValid: boolean) => void
): void => {
  console.log('🔄 StepValidator: 스텝 검증 처리 시작');

  const validationAnalysisResult = executeStepValidationOptimized(
    currentStepInput,
    formValuesInput
  );
  const { isStepValid } = validationAnalysisResult;

  onValidationResultCallback(isStepValid);
  console.log('📞 StepValidator: 검증 결과 콜백 호출', isStepValid);
};

function StepValidator({
  currentStep,
  formValues,
  onValidationResult,
  children,
}: StepValidatorProps): React.ReactElement {
  React.useEffect(() => {
    console.log('🔄 StepValidator: useEffect 실행', currentStep);
    processStepValidationOptimized(currentStep, formValues, onValidationResult);
  }, [currentStep, formValues, onValidationResult]);

  return <>{children}</>;
}

export default StepValidator;
