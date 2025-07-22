// src/components/multiStepForm/reactHookForm/formMethods/useFormMethods.ts

import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormSchemaValues } from '../../types/formTypes';
import { formSchema } from '../../schema/formSchema';
import {
  getDefaultFormSchemaValues,
  getAllFieldNames,
} from '../../utils/formFieldsLoader';

interface OptimizedFormMethods {
  readonly methods: UseFormReturn<FormSchemaValues>;
  readonly handleSubmit: UseFormReturn<FormSchemaValues>['handleSubmit'];
  readonly errors: UseFormReturn<FormSchemaValues>['formState']['errors'];
  readonly trigger: UseFormReturn<FormSchemaValues>['trigger'];
  readonly watch: UseFormReturn<FormSchemaValues>['watch'];
  readonly setValue: UseFormReturn<FormSchemaValues>['setValue'];
}

// 🚀 동적 기본값 생성 함수 - 12개 필드 (content, tags 제거)
const createDynamicDefaultFormValues = (): FormSchemaValues => {
  console.log('🔧 [DYNAMIC_METHODS] 동적 FormValues 생성 시작 (12개 필드)');

  const dynamicDefaultValues = getDefaultFormSchemaValues();
  const allFieldNames = getAllFieldNames();

  console.log('🔧 [DYNAMIC_METHODS] 동적 필드 목록 (12개):', allFieldNames);
  console.log('🔧 [DYNAMIC_METHODS] 동적 기본값:', dynamicDefaultValues);

  // Map을 사용하여 타입 안전성 확보
  const dynamicValuesMap = new Map(Object.entries(dynamicDefaultValues));

  console.log('🔧 [DYNAMIC_METHODS] 각 필드별 타입 안전 처리 시작');

  // 각 필드별로 정확한 타입 처리 (타입단언 제거) - 12개 필드만
  const processUserImage = (): string => {
    const rawValue = dynamicValuesMap.get('userImage');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] userImage 처리됨:', processedValue);
    return processedValue;
  };

  const processNickname = (): string => {
    const rawValue = dynamicValuesMap.get('nickname');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] nickname 처리됨:', processedValue);
    return processedValue;
  };

  const processEmailPrefix = (): string => {
    const rawValue = dynamicValuesMap.get('emailPrefix');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] emailPrefix 처리됨:', processedValue);
    return processedValue;
  };

  const processEmailDomain = (): string => {
    const rawValue = dynamicValuesMap.get('emailDomain');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] emailDomain 처리됨:', processedValue);
    return processedValue;
  };

  const processBio = (): string => {
    const rawValue = dynamicValuesMap.get('bio');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] bio 처리됨:', processedValue);
    return processedValue;
  };

  const processTitle = (): string => {
    const rawValue = dynamicValuesMap.get('title');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] title 처리됨:', processedValue);
    return processedValue;
  };

  const processDescription = (): string => {
    const rawValue = dynamicValuesMap.get('description');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log('🔧 [DYNAMIC_METHODS] description 처리됨:', processedValue);
    return processedValue;
  };

  const processMedia = (): string[] => {
    const rawValue = dynamicValuesMap.get('media');
    const processedValue = Array.isArray(rawValue)
      ? rawValue.filter((item) => typeof item === 'string')
      : [];
    console.log('🔧 [DYNAMIC_METHODS] media 처리됨:', processedValue);
    return processedValue;
  };

  const processMainImage = (): string | null => {
    const rawValue = dynamicValuesMap.get('mainImage');
    let processedValue: string | null = null;

    if (rawValue === null) {
      processedValue = null;
    } else if (typeof rawValue === 'string') {
      processedValue = rawValue;
    } else {
      processedValue = null;
    }

    console.log('🔧 [DYNAMIC_METHODS] mainImage 처리됨:', processedValue);
    return processedValue;
  };

  const processSliderImages = (): string[] => {
    const rawValue = dynamicValuesMap.get('sliderImages');
    const processedValue = Array.isArray(rawValue)
      ? rawValue.filter((item) => typeof item === 'string')
      : [];
    console.log('🔧 [DYNAMIC_METHODS] sliderImages 처리됨:', processedValue);
    return processedValue;
  };

  const processEditorCompletedContent = (): string => {
    const rawValue = dynamicValuesMap.get('editorCompletedContent');
    const processedValue = typeof rawValue === 'string' ? rawValue : '';
    console.log(
      '🔧 [DYNAMIC_METHODS] editorCompletedContent 처리됨:',
      processedValue
    );
    return processedValue;
  };

  const processIsEditorCompleted = (): boolean => {
    const rawValue = dynamicValuesMap.get('isEditorCompleted');
    let processedValue: boolean = false;

    if (typeof rawValue === 'boolean') {
      processedValue = rawValue;
    } else if (typeof rawValue === 'string') {
      // Boolean() 대신 실무형 변환
      const lowerCaseValue = rawValue.toLowerCase();
      processedValue = lowerCaseValue === 'true' || lowerCaseValue === '1';
    } else if (typeof rawValue === 'number') {
      processedValue = rawValue !== 0;
    } else {
      processedValue = false;
    }

    console.log(
      '🔧 [DYNAMIC_METHODS] isEditorCompleted 처리됨:',
      processedValue
    );
    return processedValue;
  };

  // FormSchemaValues 타입으로 안전하게 변환 (12개 필드만, content/tags 제거)
  const dynamicFormValues: FormSchemaValues = {
    userImage: processUserImage(),
    nickname: processNickname(),
    emailPrefix: processEmailPrefix(),
    emailDomain: processEmailDomain(),
    bio: processBio(),
    title: processTitle(),
    description: processDescription(),
    media: processMedia(),
    mainImage: processMainImage(),
    sliderImages: processSliderImages(),
    editorCompletedContent: processEditorCompletedContent(),
    isEditorCompleted: processIsEditorCompleted(),
  };

  console.log(
    '✅ [DYNAMIC_METHODS] 동적 FormValues 생성 완료 (12개 필드):',
    dynamicFormValues
  );
  return dynamicFormValues;
};

// 🚀 동적 폼 설정 생성 함수
const createDynamicFormConfiguration = () => {
  console.log('🔧 [DYNAMIC_METHODS] 동적 폼 설정 생성 시작');

  const dynamicDefaultValues = createDynamicDefaultFormValues();
  const dynamicResolver = zodResolver(formSchema);

  // 구조분해 할당으로 설정 구성
  const formConfiguration = {
    resolver: dynamicResolver,
    defaultValues: dynamicDefaultValues,
    mode: 'onChange' as const,
    reValidateMode: 'onChange' as const,
    shouldFocusError: true,
    shouldUnregister: false,
    criteriaMode: 'firstError' as const,
    delayError: 300,
  };

  console.log('✅ [DYNAMIC_METHODS] 동적 폼 설정 생성 완료');
  return formConfiguration;
};

// 🚀 메모리 최적화된 동적 폼 설정
const DYNAMIC_FORM_CONFIGURATION = createDynamicFormConfiguration();

// 🚀 메인 훅 - 동적화 완료
export const useFormMethods = (): OptimizedFormMethods => {
  console.log(
    '📝 [DYNAMIC_METHODS] useFormMethods: 동적 폼 메서드 초기화 (12개 필드)'
  );

  // 동적 폼 메소드 생성
  const methods = useForm<FormSchemaValues>(DYNAMIC_FORM_CONFIGURATION);

  // 구조분해할당으로 메서드 추출
  const { handleSubmit, formState, trigger, watch, setValue } = methods;

  // 에러 객체 안전 추출 (fallback 처리)
  const { errors = {} } = formState || {};

  // 메모이제이션된 함수들 - useMemo 의존성 최소화
  const optimizedHandleSubmit = React.useCallback(handleSubmit, [handleSubmit]);
  const optimizedTrigger = React.useCallback(trigger, [trigger]);
  const optimizedWatch = React.useCallback(watch, [watch]);
  const optimizedSetValue = React.useCallback(setValue, [setValue]);

  // 메모이제이션된 에러 상태
  const memoizedErrors = React.useMemo(() => {
    console.log('🔧 [DYNAMIC_METHODS] 에러 상태 메모이제이션:', errors);
    return errors;
  }, [errors]);

  // 컴포넌트 언마운트 시 정리 - useEffect 내부에 setState 함수 포함하지 않음
  React.useEffect(() => {
    console.log('🔧 [DYNAMIC_METHODS] useEffect: 정리 함수 설정');

    return () => {
      console.log('🔧 [DYNAMIC_METHODS] cleanup: 폼 메서드 리셋 시도');
      try {
        const { reset } = methods;
        if (typeof reset === 'function') {
          reset();
          console.log('✅ [DYNAMIC_METHODS] cleanup: 폼 메서드 리셋 완료');
        }
      } catch (resetError) {
        console.warn(
          '⚠️ [DYNAMIC_METHODS] cleanup: 폼 메서드 리셋 중 오류:',
          resetError
        );
      }
    };
  }, []); // 의존성 배열 최소화

  console.log(
    '📝 [DYNAMIC_METHODS] useFormMethods: 동적 폼 메서드 초기화 완료'
  );

  const optimizedFormMethods: OptimizedFormMethods = {
    methods,
    handleSubmit: optimizedHandleSubmit,
    errors: memoizedErrors,
    trigger: optimizedTrigger,
    watch: optimizedWatch,
    setValue: optimizedSetValue,
  };

  return optimizedFormMethods;
};
