// src/components/multiStepForm/reactHookForm/formValues/useFormValuesMapping.ts

import React from 'react';
import type { FormSchemaValues, FormValues } from '../../types/formTypes';
import { createFormValuesFromSchema } from '../utils/validationHelpers';
import { getAllFieldNames, getArrayFields } from '../../utils/formFieldsLoader';

interface OptimizedMappingResult {
  readonly mappedValues: FormValues;
  readonly mapFormValues: (watchedValues: FormSchemaValues) => FormValues;
}

// 단순한 캐시 시스템
const mappingCache = new Map<string, FormValues>();

// 동적 해시 생성
const generateDynamicHash = (formValuesInput: FormSchemaValues): string => {
  console.log('🔧 useFormValuesMapping: generateDynamicHash 시작');

  const allFieldNames = getAllFieldNames();
  const arrayFieldNames = getArrayFields();
  const processedFieldValues: string[] = [];
  const formValuesMap = new Map(Object.entries(formValuesInput));

  for (const currentFieldName of allFieldNames) {
    const fieldValue = formValuesMap.get(currentFieldName);
    const isArrayField = arrayFieldNames.includes(currentFieldName);

    let processedValue = '';

    if (isArrayField && Array.isArray(fieldValue)) {
      processedValue = String(fieldValue.length);
    } else if (fieldValue === null) {
      processedValue = 'null';
    } else if (typeof fieldValue === 'boolean') {
      processedValue = String(fieldValue);
    } else if (typeof fieldValue === 'string') {
      processedValue = fieldValue;
    } else {
      processedValue = String(fieldValue || '');
    }

    processedFieldValues.push(processedValue);
  }

  const generatedHash = processedFieldValues.join('|');

  console.log(
    `✅ useFormValuesMapping: 해시 생성 완료 - 길이: ${generatedHash.length}`
  );
  return generatedHash;
};

// 폼 값 변환
const performFormValuesMapping = (
  formValuesInput: FormSchemaValues
): FormValues => {
  console.log('🔧 useFormValuesMapping: performFormValuesMapping 시작');

  const mappedResult = createFormValuesFromSchema(formValuesInput);

  console.log('✅ useFormValuesMapping: FormValues 변환 완료');
  return mappedResult;
};

// 매핑 캐시 정리
const cleanupMappingCache = (): void => {
  console.log('🔧 useFormValuesMapping: 캐시 정리 시작');

  const currentCacheSize = mappingCache.size;
  const maxCacheSize = 50;

  if (currentCacheSize >= maxCacheSize) {
    const cacheIterator = mappingCache.keys();
    const firstCacheKey = cacheIterator.next();

    if (!firstCacheKey.done && firstCacheKey.value) {
      mappingCache.delete(firstCacheKey.value);
      console.log(
        `✅ useFormValuesMapping: 캐시 항목 삭제 완료 - ${firstCacheKey.value}`
      );
    }
  }
};

// 매핑 함수 생성
const createMappingFunction = (): ((
  watchedValues: FormSchemaValues
) => FormValues) => {
  return React.useCallback(
    (watchedValuesInput: FormSchemaValues): FormValues => {
      console.log('🔧 useFormValuesMapping: 매핑 함수 실행');

      const hashKey = generateDynamicHash(watchedValuesInput);

      // 캐시 확인
      const cachedResult = mappingCache.get(hashKey);
      if (cachedResult) {
        console.log('✅ useFormValuesMapping: 캐시에서 결과 반환');
        return cachedResult;
      }

      // 새로운 변환 수행
      const mappedResult = performFormValuesMapping(watchedValuesInput);

      // 캐시 크기 제한
      cleanupMappingCache();

      mappingCache.set(hashKey, mappedResult);
      console.log('✅ useFormValuesMapping: 새 결과 캐시 저장 완료');

      return mappedResult;
    },
    []
  );
};

// 메인 훅
export const useFormValuesMapping = (
  allWatchedValues: FormSchemaValues
): OptimizedMappingResult => {
  console.log('🎯 useFormValuesMapping: 메인 훅 실행');

  const mapFormValues = createMappingFunction();

  const mappedValues = React.useMemo(() => {
    console.log('🔧 useFormValuesMapping: useMemo 실행');
    return mapFormValues(allWatchedValues);
  }, [
    allWatchedValues.userImage,
    allWatchedValues.nickname,
    allWatchedValues.emailPrefix,
    allWatchedValues.emailDomain,
    allWatchedValues.bio,
    allWatchedValues.title,
    allWatchedValues.description,
    allWatchedValues.tags,
    allWatchedValues.content,
    allWatchedValues.media?.length ?? 0,
    allWatchedValues.mainImage,
    allWatchedValues.sliderImages?.length ?? 0,
    allWatchedValues.editorCompletedContent,
    allWatchedValues.isEditorCompleted,
    mapFormValues,
  ]);

  console.log('✅ useFormValuesMapping: 메인 훅 완료');

  return {
    mappedValues,
    mapFormValues,
  };
};
