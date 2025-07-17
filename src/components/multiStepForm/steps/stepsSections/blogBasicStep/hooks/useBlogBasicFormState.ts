// blogBasicStep/hooks/useBlogBasicFormState.ts

import React from 'react';
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

// 🛡️ updateFormValue 함수 안전 실행
function safeUpdateFormValue(
  updateFormValue: unknown,
  field: string,
  value: string
): boolean {
  if (typeof updateFormValue !== 'function') {
    console.error(
      '❌ [STORE_DEBUG] updateFormValue가 함수가 아님:',
      typeof updateFormValue
    );
    return false;
  }

  try {
    updateFormValue(field, value);
    console.log('✅ [STORE_DEBUG] updateFormValue 성공:', { field, value });
    return true;
  } catch (error) {
    console.error('❌ [STORE_DEBUG] updateFormValue 실패:', error);
    return false;
  }
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

  // 🔍 디버깅: Store 상태 확인
  console.log('🏪 [FORM_STATE_DEBUG] MultiStepFormStore 상태:', {
    store: multiStepFormStore,
    storeType: typeof multiStepFormStore,
    storeKeys:
      multiStepFormStore && typeof multiStepFormStore === 'object'
        ? Object.keys(multiStepFormStore)
        : '없음',
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

  const previousValuesRef = React.useRef<PreviousValues>({
    title: '',
    description: '',
  });

  const [isInitialized, setIsInitialized] = React.useState<boolean>(false);

  // 🔄 watch 값 변경 감지 및 store 업데이트
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

    if (titleChanged && isValidMultiStepFormStore(multiStepFormStore)) {
      console.log('📝 [FORM_STATE_DEBUG] 제목 업데이트 시도:', watchedTitle);
      const success = safeUpdateFormValue(
        multiStepFormStore.updateFormValue,
        'title',
        watchedTitle
      );

      if (success) {
        previousValuesRef.current.title = watchedTitle;
      }
    }

    if (descriptionChanged && isValidMultiStepFormStore(multiStepFormStore)) {
      console.log(
        '📝 [FORM_STATE_DEBUG] 설명 업데이트 시도:',
        watchedDescription
      );
      const success = safeUpdateFormValue(
        multiStepFormStore.updateFormValue,
        'description',
        watchedDescription
      );

      if (success) {
        previousValuesRef.current.description = watchedDescription;
      }
    }

    if (!isInitialized && (titleChanged || descriptionChanged)) {
      console.log('✅ [FORM_STATE_DEBUG] 초기화 완료 설정');
      setIsInitialized(true);
    }
  }, [watchedTitle, watchedDescription, multiStepFormStore, isInitialized]);

  // 🔄 store 값으로 form 동기화
  React.useEffect(() => {
    console.log('🔄 [FORM_STATE_DEBUG] store → form 동기화 effect 실행');

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

    if (!isInitialized) {
      console.log('✅ [FORM_STATE_DEBUG] 강제 초기화 완료 설정');
      setIsInitialized(true);
    }

    if (hasUpdate) {
      console.log('🔄 [FORM_STATE_DEBUG] form 값 업데이트 완료');
    }
  }, [
    storeTitle,
    storeDescription,
    watchedTitle,
    watchedDescription,
    setValue,
    isInitialized,
  ]);

  const result = {
    titleValue: watchedTitle,
    descriptionValue: watchedDescription,
    isInitialized,
  };

  console.log('📊 [FORM_STATE_DEBUG] 최종 반환값:', result);
  console.groupEnd();

  return result;
}
