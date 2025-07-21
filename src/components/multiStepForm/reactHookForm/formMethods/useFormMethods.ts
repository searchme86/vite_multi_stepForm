// src/components/multiStepForm/reactHookForm/hooks/useFormMethods.ts

import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormSchemaValues } from '../../types/formTypes';
import { formSchema } from '../../schema/formSchema';

interface OptimizedFormMethods {
  readonly methods: UseFormReturn<FormSchemaValues>;
  readonly handleSubmit: UseFormReturn<FormSchemaValues>['handleSubmit'];
  readonly errors: UseFormReturn<FormSchemaValues>['formState']['errors'];
  readonly trigger: UseFormReturn<FormSchemaValues>['trigger'];
  readonly watch: UseFormReturn<FormSchemaValues>['watch'];
  readonly setValue: UseFormReturn<FormSchemaValues>['setValue'];
}

// 🚀 기본값 생성
const createDefaultFormValues = (): FormSchemaValues => {
  return {
    userImage: '',
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    title: '',
    description: '',
    tags: '',
    content: '',
    media: [],
    mainImage: null,
    sliderImages: [],
    editorCompletedContent: '',
    isEditorCompleted: false,
  };
};

// 🚀 폼 설정
const FORM_CONFIGURATION = {
  resolver: zodResolver(formSchema),
  defaultValues: createDefaultFormValues(),
  mode: 'onChange' as const,
  reValidateMode: 'onChange' as const,
  shouldFocusError: true,
  shouldUnregister: false,
  criteriaMode: 'firstError' as const,
  delayError: 300,
};

// 🚀 메인 훅
export const useFormMethods = (): OptimizedFormMethods => {
  // 폼 메소드 생성
  const methods = useForm<FormSchemaValues>(FORM_CONFIGURATION);

  // 구조분해할당
  const {
    handleSubmit,
    formState: { errors = {} },
    trigger,
    watch,
    setValue,
  } = methods;

  // 메모이제이션된 함수들
  const optimizedHandleSubmit = React.useCallback(handleSubmit, [handleSubmit]);
  const optimizedTrigger = React.useCallback(trigger, [trigger]);
  const optimizedWatch = React.useCallback(watch, [watch]);
  const optimizedSetValue = React.useCallback(setValue, [setValue]);

  // 메모이제이션된 에러 상태
  const memoizedErrors = React.useMemo(() => errors, [errors]);

  // 컴포넌트 언마운트 시 정리
  React.useEffect(() => {
    return () => {
      try {
        methods.reset();
      } catch (resetError) {
        console.warn('⚠️ 폼 메소드 리셋 중 오류:', resetError);
      }
    };
  }, [methods]);

  return {
    methods,
    handleSubmit: optimizedHandleSubmit,
    errors: memoizedErrors,
    trigger: optimizedTrigger,
    watch: optimizedWatch,
    setValue: optimizedSetValue,
  };
};
