// src/components/multiStepForm/reactHookForm/hooks/useFormControls.ts

import React from 'react';
import type { UseFormReturn, FieldErrors } from 'react-hook-form';
import type { FormSchemaValues } from '../../types/formTypes';

interface OptimizedFormControls {
  readonly errors: FieldErrors<FormSchemaValues>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly isDirty: boolean;
  readonly trigger: UseFormReturn<FormSchemaValues>['trigger'];
  readonly watch: UseFormReturn<FormSchemaValues>['watch'];
  readonly setValue: UseFormReturn<FormSchemaValues>['setValue'];
  readonly getValues: UseFormReturn<FormSchemaValues>['getValues'];
  readonly reset: UseFormReturn<FormSchemaValues>['reset'];
  readonly clearErrors: UseFormReturn<FormSchemaValues>['clearErrors'];
  readonly setError: UseFormReturn<FormSchemaValues>['setError'];
}

// 🚀 메인 훅
export const useFormControls = (
  methods: UseFormReturn<FormSchemaValues>
): OptimizedFormControls => {
  // 구조분해할당과 fallback 처리
  const {
    formState: {
      errors = {},
      isValid = false,
      isSubmitting = false,
      isDirty = false,
    } = {},
    trigger,
    watch,
    setValue,
    getValues,
    reset,
    clearErrors,
    setError,
  } = methods;

  // 메모이제이션된 함수들
  const optimizedTrigger = React.useCallback(trigger, [trigger]);
  const optimizedWatch = React.useCallback(watch, [watch]);
  const optimizedSetValue = React.useCallback(setValue, [setValue]);
  const optimizedGetValues = React.useCallback(getValues, [getValues]);
  const optimizedReset = React.useCallback(reset, [reset]);
  const optimizedClearErrors = React.useCallback(clearErrors, [clearErrors]);
  const optimizedSetError = React.useCallback(setError, [setError]);

  return {
    errors,
    isValid,
    isSubmitting,
    isDirty,
    trigger: optimizedTrigger,
    watch: optimizedWatch,
    setValue: optimizedSetValue,
    getValues: optimizedGetValues,
    reset: optimizedReset,
    clearErrors: optimizedClearErrors,
    setError: optimizedSetError,
  };
};
