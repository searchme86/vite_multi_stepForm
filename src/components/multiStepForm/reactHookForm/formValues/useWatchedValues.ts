// src/components/multiStepForm/reactHookForm/formValues/useWatchedValues.ts

import React from 'react';
import { UseFormWatch } from 'react-hook-form';
import { FormSchemaValues } from '../../types/formTypes';
import { logFormValuesUpdate } from '../../utils/debugUtils';
import { createFormValuesFromSchema } from '../utils/validationHelpers';

interface WatchedValuesResult {
  readonly formValues: ReturnType<typeof createFormValuesFromSchema>;
  readonly allWatchedValues: FormSchemaValues;
}

export const useWatchedValues = (
  watch: UseFormWatch<FormSchemaValues>
): WatchedValuesResult => {
  console.log('🎯 useWatchedValues: 메인 훅 실행');

  const allWatchedValues = watch();

  const formValues = React.useMemo(() => {
    console.log('🔧 useWatchedValues: useMemo 실행');

    const processedValues = createFormValuesFromSchema(allWatchedValues);
    logFormValuesUpdate(processedValues);

    console.log('✅ useWatchedValues: FormValues 변환 및 로깅 완료');
    return processedValues;
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
  ]);

  console.log('✅ useWatchedValues: 메인 훅 완료');

  return {
    formValues,
    allWatchedValues,
  };
};
