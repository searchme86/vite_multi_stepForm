// src/components/multiStepForm/reactHookForm/hooks/useWatchedValues.ts

import React from 'react';
import { UseFormWatch } from 'react-hook-form';
import { FormSchemaValues } from '../../types/formTypes';
import { logFormValuesUpdate } from '../../utils/debugUtils';
import { createFormValuesFromSchema } from '../utils/validationHelpers';

export const useWatchedValues = (watch: UseFormWatch<FormSchemaValues>) => {
  const allWatchedValues = watch();

  const formValues = React.useMemo(() => {
    const values = createFormValuesFromSchema(allWatchedValues);
    logFormValuesUpdate(values);
    return values;
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
  ]);

  return { formValues, allWatchedValues };
};
