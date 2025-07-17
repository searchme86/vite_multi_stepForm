// blogBasicStep/hooks/useBlogBasicActions.ts

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';
import { useToastStore } from '../../../../../../store/toast/toastStore';

interface UseBlogBasicActionsReturn {
  readonly clearTitle: () => void;
  readonly clearDescription: () => void;
}

interface ToastConfig {
  title: string;
  description: string;
  color: 'primary' | 'danger' | 'success' | 'warning';
}

// 🛡️ setValue 함수 안전성 검사
function isValidSetValueFunction(
  setValue: unknown
): setValue is (field: string, value: string) => void {
  return typeof setValue === 'function';
}

// 🛡️ updateFormValue 함수 안전성 검사
function isValidUpdateFormValueFunction(
  updateFormValue: unknown
): updateFormValue is (field: string, value: string) => void {
  return typeof updateFormValue === 'function';
}

// 🛡️ addToast 함수 안전성 검사
function isValidAddToastFunction(
  addToast: unknown
): addToast is (config: ToastConfig) => void {
  return typeof addToast === 'function';
}

// 🧹 안전한 필드 초기화 함수
function executeFieldClear(
  fieldName: string,
  setValue: unknown,
  updateFormValue: unknown,
  addToast: unknown,
  successMessage: { title: string; description: string },
  errorMessage: { title: string; description: string }
): void {
  console.group(`🧹 [ACTIONS_DEBUG] ${fieldName} 초기화 시작`);

  try {
    // 함수 유효성 검사
    if (!isValidSetValueFunction(setValue)) {
      throw new Error('setValue 함수가 유효하지 않습니다');
    }

    if (!isValidUpdateFormValueFunction(updateFormValue)) {
      throw new Error('updateFormValue 함수가 유효하지 않습니다');
    }

    if (!isValidAddToastFunction(addToast)) {
      throw new Error('addToast 함수가 유효하지 않습니다');
    }

    // 필드 초기화 실행
    console.log(`📝 [ACTIONS_DEBUG] ${fieldName} setValue 실행`);
    setValue(fieldName, '');

    console.log(`🏪 [ACTIONS_DEBUG] ${fieldName} updateFormValue 실행`);
    updateFormValue(fieldName, '');

    console.log(`✅ [ACTIONS_DEBUG] ${fieldName} 초기화 성공`);
    addToast({
      title: successMessage.title,
      description: successMessage.description,
      color: 'primary',
    });
  } catch (error) {
    console.error(`❌ [ACTIONS_DEBUG] ${fieldName} 초기화 실패:`, error);

    if (isValidAddToastFunction(addToast)) {
      addToast({
        title: errorMessage.title,
        description: errorMessage.description,
        color: 'danger',
      });
    }
  }

  console.groupEnd();
}

export function useBlogBasicActions(): UseBlogBasicActionsReturn {
  console.log('🎯 [ACTIONS_DEBUG] useBlogBasicActions 훅 시작');

  const formContext = useFormContext();
  const multiStepFormStore = useMultiStepFormStore();
  const toastStore = useToastStore();

  // 🔍 디버깅: 받아온 함수들 확인
  console.log('🔍 [ACTIONS_DEBUG] 받아온 함수들 검사:', {
    hasSetValue: 'setValue' in formContext,
    hasUpdateFormValue: 'updateFormValue' in multiStepFormStore,
    hasAddToast: 'addToast' in toastStore,
    setValueType: typeof formContext.setValue,
    updateFormValueType: typeof multiStepFormStore.updateFormValue,
    addToastType: typeof toastStore.addToast,
  });

  const { setValue } = formContext;
  const { updateFormValue } = multiStepFormStore;
  const { addToast } = toastStore;

  const clearTitle = React.useCallback(() => {
    console.log('🧹 [ACTIONS_DEBUG] clearTitle 함수 호출됨');

    executeFieldClear(
      'title',
      setValue,
      updateFormValue,
      addToast,
      {
        title: '제목 초기화',
        description: '블로그 제목이 초기화되었습니다.',
      },
      {
        title: '초기화 실패',
        description: '제목 초기화 중 오류가 발생했습니다.',
      }
    );
  }, [setValue, updateFormValue, addToast]);

  const clearDescription = React.useCallback(() => {
    console.log('🧹 [ACTIONS_DEBUG] clearDescription 함수 호출됨');

    executeFieldClear(
      'description',
      setValue,
      updateFormValue,
      addToast,
      {
        title: '요약 초기화',
        description: '블로그 요약이 초기화되었습니다.',
      },
      {
        title: '초기화 실패',
        description: '요약 초기화 중 오류가 발생했습니다.',
      }
    );
  }, [setValue, updateFormValue, addToast]);

  const result = {
    clearTitle,
    clearDescription,
  };

  console.log('📊 [ACTIONS_DEBUG] useBlogBasicActions 반환값:', {
    clearTitleType: typeof result.clearTitle,
    clearDescriptionType: typeof result.clearDescription,
  });

  return result;
}
