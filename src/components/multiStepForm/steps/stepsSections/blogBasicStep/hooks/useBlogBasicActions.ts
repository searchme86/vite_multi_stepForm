// blogBasicStep/hooks/useBlogBasicActions.ts

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useMultiStepFormStore } from '../../../../store/multiStepForm/multiStepFormStore';
import { useToastStore } from '../../../../../../store/toast/toastStore';

interface UseBlogBasicActionsReturn {
  readonly clearTitle: () => void;
  readonly clearDescription: () => void;
}

export function useBlogBasicActions(): UseBlogBasicActionsReturn {
  const { setValue } = useFormContext();
  const { updateFormValue } = useMultiStepFormStore();
  const { addToast } = useToastStore();

  const clearTitle = React.useCallback(() => {
    try {
      setValue('title', '');
      updateFormValue('title', '');
      addToast({
        title: '제목 초기화',
        description: '블로그 제목이 초기화되었습니다.',
        color: 'primary',
      });
    } catch (error) {
      addToast({
        title: '초기화 실패',
        description: '제목 초기화 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [setValue, updateFormValue, addToast]);

  const clearDescription = React.useCallback(() => {
    try {
      setValue('description', '');
      updateFormValue('description', '');
      addToast({
        title: '요약 초기화',
        description: '블로그 요약이 초기화되었습니다.',
        color: 'primary',
      });
    } catch (error) {
      addToast({
        title: '초기화 실패',
        description: '요약 초기화 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [setValue, updateFormValue, addToast]);

  return {
    clearTitle,
    clearDescription,
  };
}
