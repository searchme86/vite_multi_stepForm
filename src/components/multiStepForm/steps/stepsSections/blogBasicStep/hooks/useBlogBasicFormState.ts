// blogBasicStep/hooks/useBlogBasicFormState.ts

import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';

interface UseBlogBasicFormStateReturn {
  readonly titleValue: string;
  readonly descriptionValue: string;
  readonly isInitialized: boolean;
}

interface SafeFormValues {
  title: string;
  description: string;
}

interface FormChangeInfo {
  fieldName: string;
  newValue: unknown;
  changeType: string;
  timestamp: string;
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

// 🔄 폼 변경 로깅 함수
function logFormFieldChange(changeInfo: FormChangeInfo): void {
  console.log('🔄 [FORM_CHANGE_DEBUG] 폼 필드 변경 감지:', changeInfo);
}

export function useBlogBasicFormState(): UseBlogBasicFormStateReturn {
  console.group('🎣 [FORM_STATE_DEBUG] useBlogBasicFormState 시작');

  const formContext = useFormContext();
  const multiStepFormStore = useMultiStepFormStore();

  // ✅ 1단계: 즉시 초기화 (FormContext 연결 시)
  const [isInitialized, setIsInitialized] = React.useState<boolean>(false);

  // 🔍 디버깅: FormContext 확인
  console.log('📋 [FORM_STATE_DEBUG] FormContext 상태:', {
    hasFormContext: formContext !== null,
    hasWatch: formContext && 'watch' in formContext,
    hasSetValue: formContext && 'setValue' in formContext,
    isInitialized,
  });

  // 🚫 Early Return: FormContext가 없으면 기본값 반환
  if (!formContext) {
    console.warn('❌ [FORM_STATE_DEBUG] FormContext가 없음');
    console.groupEnd();
    return {
      titleValue: '',
      descriptionValue: '',
      isInitialized: false,
    };
  }

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
    titleLength: watchedTitle.length,
    descriptionLength: watchedDescription.length,
  });

  // 🛡️ 안전한 store 값 추출
  const { title: storeTitle, description: storeDescription } =
    extractStoreValues(multiStepFormStore);

  console.log('🏪 [FORM_STATE_DEBUG] store에서 추출된 안전한 값들:', {
    storeTitle,
    storeDescription,
    storeTitleLength: storeTitle.length,
    storeDescriptionLength: storeDescription.length,
  });

  // 🛡️ 안전한 store 업데이트 함수
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
      } catch (updateError) {
        console.error('❌ [STORE_DEBUG] updateFormValue 실패:', updateError);
        return false;
      }
    },
    [multiStepFormStore?.updateFormValue]
  );

  // ✅ 1단계: FormContext 연결 시 즉시 초기화
  React.useEffect(() => {
    console.log('🚀 [INIT_DEBUG] 즉시 초기화 effect 실행');

    if (formContext && !isInitialized) {
      console.log('✅ [INIT_DEBUG] FormContext 연결 확인, 즉시 초기화 실행');
      setIsInitialized(true);
    }
  }, [formContext, isInitialized]);

  // ✅ 2단계: 안전장치 - 2초 후 강제 초기화
  React.useEffect(() => {
    console.log('⏰ [INIT_DEBUG] 강제 초기화 타이머 설정');

    const forcedInitializationTimer = setTimeout(() => {
      if (!isInitialized) {
        console.log('🔧 [INIT_DEBUG] 2초 후 강제 초기화 실행');
        setIsInitialized(true);
      }
    }, 2000);

    return () => {
      console.log('🔄 [INIT_DEBUG] 강제 초기화 타이머 정리');
      clearTimeout(forcedInitializationTimer);
    };
  }, [isInitialized]);

  // ✅ 3단계: Form → Store 동기화 (값 변경 감지)
  React.useEffect(() => {
    console.log('🔄 [SYNC_DEBUG] Form → Store 동기화 effect 실행');

    if (!isInitialized) {
      console.log('⏭️ [SYNC_DEBUG] 초기화 전이므로 동기화 스킵');
      return;
    }

    let hasStoreUpdate = false;

    // title 동기화 확인
    const titleNeedsSync = watchedTitle !== storeTitle && watchedTitle !== '';
    if (titleNeedsSync) {
      console.log('📝 [SYNC_DEBUG] title을 Store로 동기화:', {
        from: storeTitle,
        to: watchedTitle,
      });

      const titleUpdateSuccess = safeUpdateFormValue('title', watchedTitle);
      if (titleUpdateSuccess) {
        hasStoreUpdate = true;

        const titleChangeInfo: FormChangeInfo = {
          fieldName: 'title',
          newValue: watchedTitle,
          changeType: 'form_to_store_sync',
          timestamp: new Date().toISOString(),
        };
        logFormFieldChange(titleChangeInfo);
      }
    }

    // description 동기화 확인
    const descriptionNeedsSync =
      watchedDescription !== storeDescription && watchedDescription !== '';
    if (descriptionNeedsSync) {
      console.log('📝 [SYNC_DEBUG] description을 Store로 동기화:', {
        from: storeDescription,
        to: watchedDescription,
      });

      const descriptionUpdateSuccess = safeUpdateFormValue(
        'description',
        watchedDescription
      );
      if (descriptionUpdateSuccess) {
        hasStoreUpdate = true;

        const descriptionChangeInfo: FormChangeInfo = {
          fieldName: 'description',
          newValue: watchedDescription,
          changeType: 'form_to_store_sync',
          timestamp: new Date().toISOString(),
        };
        logFormFieldChange(descriptionChangeInfo);
      }
    }

    if (hasStoreUpdate) {
      console.log('🔄 [SYNC_DEBUG] Store 업데이트 완료');
    }
  }, [
    watchedTitle,
    watchedDescription,
    storeTitle,
    storeDescription,
    isInitialized,
    safeUpdateFormValue,
  ]);

  // ✅ 4단계: Store → Form 초기값 동기화 (최초 1회만)
  React.useEffect(() => {
    console.log('🔄 [INIT_SYNC_DEBUG] Store → Form 초기값 동기화 effect 실행');

    if (!isInitialized) {
      console.log('⏭️ [INIT_SYNC_DEBUG] 초기화 전이므로 스킵');
      return;
    }

    let hasFormUpdate = false;

    // Store에 값이 있고 Form이 비어있으면 Store 값으로 초기화
    const shouldInitializeTitle = storeTitle !== '' && watchedTitle === '';
    if (shouldInitializeTitle && typeof setValue === 'function') {
      console.log('📝 [INIT_SYNC_DEBUG] Store title로 Form 초기화:', {
        storeValue: storeTitle,
        formValue: watchedTitle,
      });

      setValue('title', storeTitle);
      hasFormUpdate = true;
    }

    const shouldInitializeDescription =
      storeDescription !== '' && watchedDescription === '';
    if (shouldInitializeDescription && typeof setValue === 'function') {
      console.log('📝 [INIT_SYNC_DEBUG] Store description으로 Form 초기화:', {
        storeValue: storeDescription,
        formValue: watchedDescription,
      });

      setValue('description', storeDescription);
      hasFormUpdate = true;
    }

    if (hasFormUpdate) {
      console.log('🔄 [INIT_SYNC_DEBUG] Form 초기값 설정 완료');
    }
  }, [
    storeTitle,
    storeDescription,
    watchedTitle,
    watchedDescription,
    isInitialized,
    setValue,
  ]);

  // 🔍 디버깅: 최종 상태 로깅
  React.useEffect(() => {
    console.log('📊 [FINAL_DEBUG] 최종 상태 변경 감지:', {
      titleValue: watchedTitle,
      titleLength: watchedTitle.length,
      descriptionValue: watchedDescription,
      descriptionLength: watchedDescription.length,
      isInitialized,
      timestamp: new Date().toISOString(),
    });
  }, [watchedTitle, watchedDescription, isInitialized]);

  const finalResult = {
    titleValue: watchedTitle,
    descriptionValue: watchedDescription,
    isInitialized,
  };

  console.log('📊 [FORM_STATE_DEBUG] 최종 반환값:', finalResult);
  console.groupEnd();

  return finalResult;
}
