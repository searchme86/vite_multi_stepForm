// src/components/multiStepForm/reactHookForm/hooks/useFormValuesMapping.ts

import React from 'react';
import type { FormSchemaValues, FormValues } from '../../types/formTypes';
import { createFormValuesFromSchema } from '../utils/validationHelpers';

interface OptimizedMappingResult {
  readonly mappedValues: FormValues;
  readonly mapFormValues: (watchedValues: FormSchemaValues) => FormValues;
}

// 🚀 단순한 캐시 시스템
const mappingCache = new Map<string, FormValues>();

// 🚀 간단한 해시 생성
const generateHash = (formValues: FormSchemaValues): string => {
  const {
    nickname = '',
    emailPrefix = '',
    emailDomain = '',
    title = '',
    description = '',
    tags = '',
    content = '',
    media = [],
    sliderImages = [],
    editorCompletedContent = '',
    isEditorCompleted = false,
  } = formValues;

  const fields = [
    nickname,
    emailPrefix,
    emailDomain,
    title,
    description,
    tags,
    content,
    String(media.length),
    String(sliderImages.length),
    editorCompletedContent,
    String(isEditorCompleted),
  ];

  return fields.join('|');
};

// 🚀 폼 값 변환
const performFormValuesMapping = (formValues: FormSchemaValues): FormValues => {
  return createFormValuesFromSchema(formValues);
};

// 🚀 매핑 함수 생성
const createMappingFunction = (): ((
  watchedValues: FormSchemaValues
) => FormValues) => {
  return React.useCallback((watchedValues: FormSchemaValues): FormValues => {
    const hash = generateHash(watchedValues);

    // 캐시 확인
    const cached = mappingCache.get(hash);
    if (cached) {
      return cached;
    }

    // 새로운 변환 수행
    const mapped = performFormValuesMapping(watchedValues);

    // 캐시 크기 제한 (50개)
    if (mappingCache.size >= 50) {
      const firstKey = mappingCache.keys().next().value;
      if (firstKey) {
        mappingCache.delete(firstKey);
      }
    }

    mappingCache.set(hash, mapped);
    return mapped;
  }, []);
};

// 🚀 메인 훅
export const useFormValuesMapping = (
  allWatchedValues: FormSchemaValues
): OptimizedMappingResult => {
  const mapFormValues = createMappingFunction();

  const mappedValues = React.useMemo(() => {
    return mapFormValues(allWatchedValues);
  }, [
    allWatchedValues.nickname,
    allWatchedValues.emailPrefix,
    allWatchedValues.emailDomain,
    allWatchedValues.title,
    allWatchedValues.description,
    allWatchedValues.tags,
    allWatchedValues.content,
    allWatchedValues.media?.length ?? 0,
    allWatchedValues.sliderImages?.length ?? 0,
    allWatchedValues.editorCompletedContent,
    allWatchedValues.isEditorCompleted,
    mapFormValues,
  ]);

  return {
    mappedValues,
    mapFormValues,
  };
};
