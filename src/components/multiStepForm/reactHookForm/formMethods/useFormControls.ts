import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormSchemaValues } from '../../types/formTypes';

export const useFormControls = (methods: UseFormReturn<FormSchemaValues>) => {
  console.log('📝 useFormControls: 폼 컨트롤 초기화');

  const {
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
    trigger,
    watch,
    setValue,
    getValues,
    reset,
    clearErrors,
    setError,
  } = methods;

  const triggerValidation = React.useCallback(
    async (fields?: (keyof FormSchemaValues)[]) => {
      console.log('📝 useFormControls: 유효성 검사 트리거', fields);
      return await trigger(fields);
    },
    [trigger]
  );

  const updateField = React.useCallback(
    (name: keyof FormSchemaValues, value: any) => {
      console.log('📝 useFormControls: 필드 업데이트', { name, value });
      setValue(name, value);
    },
    [setValue]
  );

  const getFieldValue = React.useCallback(
    (name: keyof FormSchemaValues) => {
      const value = getValues(name);
      console.log('📝 useFormControls: 필드 값 가져오기', { name, value });
      return value;
    },
    [getValues]
  );

  const resetForm = React.useCallback(() => {
    console.log('📝 useFormControls: 폼 초기화');
    reset();
  }, [reset]);

  return {
    handleSubmit,
    errors,
    isValid,
    isSubmitting,
    isDirty,
    trigger: triggerValidation,
    watch,
    setValue: updateField,
    getValues: getFieldValue,
    reset: resetForm,
    clearErrors,
    setError,
  };
};
