// src/components/multiStepForm/reactHookForm/hooks/useFormValuesOptimization.ts

import React from 'react';
import type { FormValues } from '../../types/formTypes';

interface OptimizedFormValues extends FormValues {
  readonly computationHash: string;
  readonly lastUpdateTime: number;
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

// 🚀 단순한 해시 생성
const generateFormValuesHash = (formValues: FormValues): string => {
  const {
    nickname = '',
    title = '',
    content = '',
    isEditorCompleted = false,
    emailPrefix = '',
    emailDomain = '',
    description = '',
    media = [],
    sliderImages = [],
  } = formValues;

  const criticalFields = [nickname, title, content, String(isEditorCompleted)];
  const additionalFields = [
    emailPrefix,
    emailDomain,
    description,
    String(media.length),
    String(sliderImages.length),
  ];

  const combinedString = `${criticalFields.join('|')}#${additionalFields.join(
    '|'
  )}`;

  let hashValue = 0;
  for (let i = 0; i < combinedString.length; i += 1) {
    const charCode = combinedString.charCodeAt(i);
    hashValue = (hashValue << 5) - hashValue + charCode;
    hashValue = hashValue & hashValue;
  }

  return hashValue.toString(36);
};

// 🚀 단순한 캐시 시스템
const optimizationCache = new Map<string, OptimizedFormValues>();

// 🚀 폼 분석 함수
const analyzeFormValues = (formValues: FormValues): FormValuesAnalytics => {
  const {
    nickname = '',
    emailPrefix = '',
    emailDomain = '',
    title = '',
    description = '',
    content = '',
    isEditorCompleted = false,
  } = formValues;

  const criticalFields = [nickname, title, content];
  const completedCriticalFields = criticalFields.filter((field) => {
    return String(field).trim().length > 0;
  });

  const additionalFields = [emailPrefix, emailDomain, description];
  const completedAdditionalFields = additionalFields.filter((field) => {
    return String(field).trim().length > 0;
  });

  const criticalFieldsCount = completedCriticalFields.length;
  const additionalFieldsCount = completedAdditionalFields.length;
  const totalCompletedFields =
    criticalFieldsCount + additionalFieldsCount + (isEditorCompleted ? 1 : 0);
  const totalPossibleFields =
    criticalFields.length + additionalFields.length + 1;
  const completionPercentage =
    (totalCompletedFields / totalPossibleFields) * 100;

  const hasAnyContent = criticalFieldsCount > 0 || additionalFieldsCount > 0;
  const hasAllCriticalFields = criticalFieldsCount === criticalFields.length;
  const hasEmailComplete =
    emailPrefix.trim().length > 0 && emailDomain.trim().length > 0;
  const isFormComplete =
    hasAllCriticalFields && hasEmailComplete && isEditorCompleted;

  return {
    hasChanges: hasAnyContent,
    isFormComplete,
    completionPercentage,
    criticalFieldsCount,
    totalFieldsCount: totalPossibleFields,
  };
};

// 🚀 메인 훅
export const useFormValuesOptimization = (
  formValues: FormValues
): MemoryOptimizationResult => {
  const optimizedFormValues = React.useMemo(() => {
    const hash = generateFormValuesHash(formValues);

    // 캐시 확인
    const cached = optimizationCache.get(hash);
    if (cached) {
      return cached;
    }

    // 새로운 최적화 객체 생성
    const optimized: OptimizedFormValues = {
      ...formValues,
      computationHash: hash,
      lastUpdateTime: Date.now(),
    };

    // 캐시 크기 제한 (100개)
    if (optimizationCache.size >= 100) {
      const firstKey = optimizationCache.keys().next().value;
      if (firstKey) {
        optimizationCache.delete(firstKey);
      }
    }

    optimizationCache.set(hash, optimized);
    return optimized;
  }, [
    formValues.nickname,
    formValues.title,
    formValues.content,
    formValues.emailPrefix,
    formValues.emailDomain,
    formValues.isEditorCompleted,
    formValues.description,
    formValues.media.length,
    formValues.sliderImages.length,
  ]);

  const analytics = React.useMemo(() => {
    return analyzeFormValues(formValues);
  }, [
    formValues.nickname,
    formValues.title,
    formValues.content,
    formValues.emailPrefix,
    formValues.emailDomain,
    formValues.isEditorCompleted,
  ]);

  return {
    optimizedFormValues,
    analytics,
  };
};

// 🚀 캐시 정리 유틸리티
export const clearFormValuesOptimizationCache = (): void => {
  optimizationCache.clear();
};
