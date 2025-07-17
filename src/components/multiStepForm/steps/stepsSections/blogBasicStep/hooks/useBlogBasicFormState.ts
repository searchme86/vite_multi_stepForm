// blogBasicStep/hooks/useBlogBasicFormState.ts

import React, { useRef, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';

interface UseBlogBasicFormStateReturn {
  readonly titleValue: string;
  readonly descriptionValue: string;
  readonly isInitialized: boolean;
}

interface PreviousValues {
  title: string;
  description: string;
}

interface SafeFormValues {
  title: string;
  description: string;
}

interface MultiStepFormStoreState {
  title?: string;
  description?: string;
  values?: Record<string, unknown>;
  data?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  updateFormValue: (field: string, value: string) => void;
}

// 🔒 타입 가드: store 객체가 유효한지 확인
function isValidMultiStepFormStore(
  store: unknown
): store is MultiStepFormStoreState {
  if (typeof store !== 'object' || store === null) {
    return false;
  }

  const hasUpdateFormValue = 'updateFormValue' in store;
  const updateFormValue = Reflect.get(store, 'updateFormValue');

  return hasUpdateFormValue && typeof updateFormValue === 'function';
}

// 🛡️ store에서 안전한 값 추출
function extractStoreValues(store: unknown): SafeFormValues {
  console.log('🏪 [STORE_DEBUG] store 값 추출 시작:', {
    store,
    storeType: typeof store,
    storeKeys: store && typeof store === 'object' ? Object.keys(store) : '없음',
  });

  if (!isValidMultiStepFormStore(store)) {
    console.warn('⚠️ [STORE_DEBUG] store가 유효하지 않음');
    return { title: '', description: '' };
  }

  // 다양한 속성명으로 값 시도
  const possibleTitleSources = [
    'title',
    'values',
    'data',
    'formData',
    'formValues',
  ];
  const possibleDescriptionSources = [
    'description',
    'values',
    'data',
    'formData',
    'formValues',
  ];

  let extractedTitle = '';
  let extractedDescription = '';

  // title 값 추출 시도
  for (const source of possibleTitleSources) {
    if (source in store) {
      const sourceValue = Reflect.get(store, source);

      if (source === 'title' && typeof sourceValue === 'string') {
        extractedTitle = sourceValue;
        break;
      }

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        'title' in sourceValue
      ) {
        const nestedTitle = Reflect.get(sourceValue, 'title');
        if (typeof nestedTitle === 'string') {
          extractedTitle = nestedTitle;
          break;
        }
      }
    }
  }

  // description 값 추출 시도
  for (const source of possibleDescriptionSources) {
    if (source in store) {
      const sourceValue = Reflect.get(store, source);

      if (source === 'description' && typeof sourceValue === 'string') {
        extractedDescription = sourceValue;
        break;
      }

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        'description' in sourceValue
      ) {
        const nestedDescription = Reflect.get(sourceValue, 'description');
        if (typeof nestedDescription === 'string') {
          extractedDescription = nestedDescription;
          break;
        }
      }
    }
  }

  const result = {
    title: extractedTitle,
    description: extractedDescription,
  };

  console.log('🏪 [STORE_DEBUG] store 값 추출 완료:', result);
  return result;
}

// 🧹 문자열 정리 함수
function sanitizeStringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

export function useBlogBasicFormState(): UseBlogBasicFormStateReturn {
  console.group('🎣 [FORM_STATE_DEBUG] useBlogBasicFormState 시작');

  const formContext = useFormContext();
  const multiStepFormStore = useMultiStepFormStore();

  // 🔍 디버깅: FormContext 확인
  console.log('📋 [FORM_STATE_DEBUG] FormContext 상태:', {
    hasFormContext: formContext !== null,
    hasWatch: formContext && 'watch' in formContext,
    hasSetValue: formContext && 'setValue' in formContext,
  });

  const { watch, setValue } = formContext;

  // 🛡️ 안전한 watch 값 추출
  const watchedTitleRaw = watch('title');
  const watchedDescriptionRaw = watch('description');

  const watchedTitle = sanitizeStringValue(watchedTitleRaw);
  const watchedDescription = sanitizeStringValue(watchedDescriptionRaw);

  console.log('👀 [FORM_STATE_DEBUG] watch에서 받은 값들:', {
    watchedTitleRaw,
    watchedDescriptionRaw,
    watchedTitle,
    watchedDescription,
  });

  // 🛡️ 안전한 store 값 추출
  const { title: storeTitle, description: storeDescription } =
    extractStoreValues(multiStepFormStore);

  console.log('🏪 [FORM_STATE_DEBUG] store에서 추출된 안전한 값들:', {
    storeTitle,
    storeDescription,
  });

  // 🔄 이전 값 추적용 ref (무한 루프 방지)
  const previousValuesRef = useRef<PreviousValues>({
    title: '',
    description: '',
  });

  // 🚩 초기화 상태 ref (useState 대신 ref 사용으로 무한 루프 방지)
  const isInitializedRef = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false);

  // 🛡️ 안전한 store 업데이트 함수 (메모이제이션으로 참조 안정화)
  const safeUpdateFormValue = useCallback(
    (field: string, value: string) => {
      if (!isValidMultiStepFormStore(multiStepFormStore)) {
        console.error('❌ [STORE_DEBUG] store가 유효하지 않음');
        return false;
      }

      try {
        multiStepFormStore.updateFormValue(field, value);
        console.log('✅ [STORE_DEBUG] updateFormValue 성공:', { field, value });
        return true;
      } catch (error) {
        console.error('❌ [STORE_DEBUG] updateFormValue 실패:', error);
        return false;
      }
    },
    [multiStepFormStore.updateFormValue]
  ); // updateFormValue 함수만 의존성으로

  // 🔄 watch 값 변경 감지 및 store 업데이트 (조건부 실행으로 무한 루프 방지)
  React.useEffect(() => {
    console.log('🔄 [FORM_STATE_DEBUG] watch 값 변경 감지 effect 실행');

    const { current: previousValues } = previousValuesRef;
    const titleChanged = previousValues.title !== watchedTitle;
    const descriptionChanged =
      previousValues.description !== watchedDescription;

    console.log('📊 [FORM_STATE_DEBUG] 변경 감지 결과:', {
      titleChanged,
      descriptionChanged,
      previousTitle: previousValues.title,
      currentTitle: watchedTitle,
      previousDescription: previousValues.description,
      currentDescription: watchedDescription,
    });

    // 🚫 실제 변경이 있을 때만 업데이트 (무한 루프 방지)
    if (titleChanged && watchedTitle !== '') {
      console.log('📝 [FORM_STATE_DEBUG] 제목 업데이트 시도:', watchedTitle);
      const success = safeUpdateFormValue('title', watchedTitle);

      if (success) {
        previousValuesRef.current.title = watchedTitle;
      }
    }

    if (descriptionChanged && watchedDescription !== '') {
      console.log(
        '📝 [FORM_STATE_DEBUG] 설명 업데이트 시도:',
        watchedDescription
      );
      const success = safeUpdateFormValue('description', watchedDescription);

      if (success) {
        previousValuesRef.current.description = watchedDescription;
      }
    }

    // 🚩 초기화 상태 업데이트 (한 번만 실행)
    if (
      !isInitializedRef.current &&
      (titleChanged || descriptionChanged || watchedTitle || watchedDescription)
    ) {
      console.log('✅ [FORM_STATE_DEBUG] 초기화 완료 설정');
      isInitializedRef.current = true;
      setIsInitialized(true);
    }
  }, [watchedTitle, watchedDescription, safeUpdateFormValue]); // 안정한 의존성만

  // 🔄 store 값으로 form 동기화 (초기화 시에만 실행)
  React.useEffect(() => {
    console.log('🔄 [FORM_STATE_DEBUG] store → form 동기화 effect 실행');

    // 🚫 이미 초기화되었으면 실행하지 않음 (무한 루프 방지)
    if (isInitializedRef.current) {
      console.log('⏭️ [FORM_STATE_DEBUG] 이미 초기화됨, 동기화 스킵');
      return;
    }

    let hasUpdate = false;

    if (storeTitle && storeTitle !== watchedTitle) {
      console.log('📝 [FORM_STATE_DEBUG] store 제목으로 form 업데이트:', {
        from: watchedTitle,
        to: storeTitle,
      });

      if (typeof setValue === 'function') {
        setValue('title', storeTitle);
        hasUpdate = true;
      }
    }

    if (storeDescription && storeDescription !== watchedDescription) {
      console.log('📝 [FORM_STATE_DEBUG] store 설명으로 form 업데이트:', {
        from: watchedDescription,
        to: storeDescription,
      });

      if (typeof setValue === 'function') {
        setValue('description', storeDescription);
        hasUpdate = true;
      }
    }

    if (hasUpdate) {
      console.log('🔄 [FORM_STATE_DEBUG] form 값 업데이트 완료');
    }
  }, [storeTitle, storeDescription]); // setValue는 제외 (React Hook Form에서 안정한 참조 보장)

  const result = {
    titleValue: watchedTitle,
    descriptionValue: watchedDescription,
    isInitialized,
  };

  console.log('📊 [FORM_STATE_DEBUG] 최종 반환값:', result);
  console.groupEnd();

  return result;
}
