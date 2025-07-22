// src/components/multiStepForm/reactHookForm/formValues/useFormValuesOptimization.ts

import React from 'react';
import type { FormValues } from '../../types/formTypes';
import {
  getStringFields,
  getArrayFields,
  getBooleanFields,
  getEmailFields,
} from '../../utils/formFieldsLoader';

interface OptimizedFormValues {
  readonly formValues: FormValues;
  readonly computationHash: string;
  readonly lastUpdateTime: string;
}

interface FormValuesAnalytics {
  readonly hasChanges: boolean;
  readonly isFormComplete: boolean;
  readonly completionPercentage: number;
  readonly criticalFieldsCount: number;
  readonly totalFieldsCount: number;
}

interface MemoryOptimizationResult {
  readonly optimizedFormValues: OptimizedFormValues;
  readonly analytics: FormValuesAnalytics;
}

// 단순한 캐시 시스템
const optimizationCache = new Map<string, OptimizedFormValues>();

// 동적 해시 생성
const generateDynamicFormValuesHash = (formValuesInput: FormValues): string => {
  console.log(
    '🔧 useFormValuesOptimization: generateDynamicFormValuesHash 시작'
  );

  const stringFieldNames = getStringFields();
  const arrayFieldNames = getArrayFields();
  const booleanFieldNames = getBooleanFields();
  const formValuesMap = new Map(Object.entries(formValuesInput));

  const criticalFieldValues: string[] = [];
  const additionalFieldValues: string[] = [];

  // 중요 필드들 처리 (nickname, title, content 등)
  for (const currentFieldName of stringFieldNames) {
    const fieldValue = formValuesMap.get(currentFieldName);
    const stringValue =
      typeof fieldValue === 'string' ? fieldValue : String(fieldValue || '');

    const isCriticalField = ['nickname', 'title', 'content'].includes(
      currentFieldName
    );

    if (isCriticalField) {
      criticalFieldValues.push(stringValue);
    } else {
      additionalFieldValues.push(stringValue);
    }
  }

  // Boolean 필드들 처리
  for (const currentFieldName of booleanFieldNames) {
    const fieldValue = formValuesMap.get(currentFieldName);
    const booleanValue = typeof fieldValue === 'boolean' ? fieldValue : false;
    criticalFieldValues.push(String(booleanValue));
  }

  // Array 필드들 처리
  for (const currentFieldName of arrayFieldNames) {
    const fieldValue = formValuesMap.get(currentFieldName);
    const arrayLength = Array.isArray(fieldValue) ? fieldValue.length : 0;
    additionalFieldValues.push(String(arrayLength));
  }

  const combinedString = `${criticalFieldValues.join(
    '|'
  )}#${additionalFieldValues.join('|')}`;

  let hashValue = 0;
  for (
    let characterIndex = 0;
    characterIndex < combinedString.length;
    characterIndex += 1
  ) {
    const charCode = combinedString.charCodeAt(characterIndex);
    hashValue = (hashValue << 5) - hashValue + charCode;
    hashValue = hashValue & hashValue;
  }

  const finalHash = hashValue.toString(36);

  console.log(`✅ useFormValuesOptimization: 해시 생성 완료 - ${finalHash}`);
  return finalHash;
};

// 동적 폼 분석 함수
const analyzeDynamicFormValues = (
  formValuesInput: FormValues
): FormValuesAnalytics => {
  console.log('🔧 useFormValuesOptimization: analyzeDynamicFormValues 시작');

  const stringFieldNames = getStringFields();
  const emailFieldNames = getEmailFields();
  const booleanFieldNames = getBooleanFields();
  const formValuesMap = new Map(Object.entries(formValuesInput));

  const criticalFieldNames = ['nickname', 'title', 'content'];
  const completedCriticalFields: string[] = [];
  const completedAdditionalFields: string[] = [];

  // 중요 필드들 검사
  for (const currentFieldName of criticalFieldNames) {
    const fieldValue = formValuesMap.get(currentFieldName);
    const stringValue =
      typeof fieldValue === 'string' ? fieldValue : String(fieldValue || '');

    if (stringValue.trim().length > 0) {
      completedCriticalFields.push(currentFieldName);
    }
  }

  // 추가 필드들 검사 (중요 필드 제외)
  for (const currentFieldName of stringFieldNames) {
    const isCriticalField = criticalFieldNames.includes(currentFieldName);

    if (!isCriticalField) {
      const fieldValue = formValuesMap.get(currentFieldName);
      const stringValue =
        typeof fieldValue === 'string' ? fieldValue : String(fieldValue || '');

      if (stringValue.trim().length > 0) {
        completedAdditionalFields.push(currentFieldName);
      }
    }
  }

  // Boolean 필드들 검사
  let completedBooleanFields = 0;
  for (const currentFieldName of booleanFieldNames) {
    const fieldValue = formValuesMap.get(currentFieldName);
    const booleanValue = typeof fieldValue === 'boolean' ? fieldValue : false;

    if (booleanValue) {
      completedBooleanFields += 1;
    }
  }

  const criticalFieldsCount = completedCriticalFields.length;
  const additionalFieldsCount = completedAdditionalFields.length;
  const totalCompletedFields =
    criticalFieldsCount + additionalFieldsCount + completedBooleanFields;
  const totalPossibleFields =
    criticalFieldNames.length +
    (stringFieldNames.length - criticalFieldNames.length) +
    booleanFieldNames.length;

  const completionPercentage =
    totalPossibleFields > 0
      ? (totalCompletedFields / totalPossibleFields) * 100
      : 0;

  const hasAnyContent = criticalFieldsCount > 0 || additionalFieldsCount > 0;
  const hasAllCriticalFields =
    criticalFieldsCount === criticalFieldNames.length;

  // 이메일 완성도 검사
  let hasEmailComplete = true;
  for (const emailFieldName of emailFieldNames) {
    const fieldValue = formValuesMap.get(emailFieldName);
    const stringValue =
      typeof fieldValue === 'string' ? fieldValue : String(fieldValue || '');

    if (stringValue.trim().length === 0) {
      hasEmailComplete = false;
      break;
    }
  }

  const isFormComplete =
    hasAllCriticalFields && hasEmailComplete && completedBooleanFields > 0;

  console.log(
    `✅ useFormValuesOptimization: 분석 완료 - 완성도: ${completionPercentage.toFixed(
      1
    )}%`
  );

  return {
    hasChanges: hasAnyContent,
    isFormComplete,
    completionPercentage,
    criticalFieldsCount,
    totalFieldsCount: totalPossibleFields,
  };
};

// 캐시 정리 함수
const cleanupOptimizationCache = (): void => {
  console.log('🔧 useFormValuesOptimization: 캐시 정리 시작');

  const currentCacheSize = optimizationCache.size;
  const maxCacheSize = 100;

  if (currentCacheSize >= maxCacheSize) {
    const cacheIterator = optimizationCache.keys();
    const firstCacheKey = cacheIterator.next();

    if (!firstCacheKey.done && firstCacheKey.value) {
      optimizationCache.delete(firstCacheKey.value);
      console.log(
        `✅ useFormValuesOptimization: 캐시 항목 삭제 완료 - ${firstCacheKey.value}`
      );
    }
  }
};

// 메인 훅
export const useFormValuesOptimization = (
  formValues: FormValues
): MemoryOptimizationResult => {
  console.log('🎯 useFormValuesOptimization: 메인 훅 실행');

  const optimizedFormValues = React.useMemo(() => {
    console.log(
      '🔧 useFormValuesOptimization: optimizedFormValues useMemo 실행'
    );

    const hashKey = generateDynamicFormValuesHash(formValues);

    // 캐시 확인
    const cachedResult = optimizationCache.get(hashKey);
    if (cachedResult) {
      console.log('✅ useFormValuesOptimization: 캐시에서 결과 반환');
      return cachedResult;
    }

    // 새로운 최적화 객체 생성
    const optimized: OptimizedFormValues = {
      formValues: { ...formValues },
      computationHash: hashKey,
      lastUpdateTime: new Date().toISOString(),
    };

    // 캐시 크기 제한
    cleanupOptimizationCache();

    optimizationCache.set(hashKey, optimized);
    console.log('✅ useFormValuesOptimization: 새 결과 캐시 저장 완료');

    return optimized;
  }, [
    formValues.userImage,
    formValues.nickname,
    formValues.emailPrefix,
    formValues.emailDomain,
    formValues.bio,
    formValues.title,
    formValues.description,
    formValues.tags,
    formValues.content,
    formValues.media?.length ?? 0,
    formValues.mainImage,
    formValues.sliderImages?.length ?? 0,
    formValues.editorCompletedContent,
    formValues.isEditorCompleted,
  ]);

  const analytics = React.useMemo(() => {
    console.log('🔧 useFormValuesOptimization: analytics useMemo 실행');
    return analyzeDynamicFormValues(formValues);
  }, [
    formValues.userImage,
    formValues.nickname,
    formValues.emailPrefix,
    formValues.emailDomain,
    formValues.bio,
    formValues.title,
    formValues.description,
    formValues.tags,
    formValues.content,
    formValues.isEditorCompleted,
  ]);

  console.log('✅ useFormValuesOptimization: 메인 훅 완료');

  return {
    optimizedFormValues,
    analytics,
  };
};

// 캐시 정리 유틸리티
export const clearFormValuesOptimizationCache = (): void => {
  console.log('🔧 useFormValuesOptimization: 캐시 정리 유틸리티 실행');
  optimizationCache.clear();
  console.log('✅ useFormValuesOptimization: 캐시 정리 완료');
};
