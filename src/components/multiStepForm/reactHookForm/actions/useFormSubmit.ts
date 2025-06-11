import React from 'react';
import { FormSchemaValues } from '../../types/formTypes';

interface UseFormSubmitProps {
  addToast: (options: any) => void;
}

export const useFormSubmit = ({ addToast }: UseFormSubmitProps) => {
  const onSubmit = React.useCallback(
    (data: FormSchemaValues) => {
      console.log('📤 onSubmit: 폼 제출 시작');
      console.log('📤 Form submitted:', data);

      addToast({
        title: '폼 제출 성공',
        description: '블로그 포스트가 성공적으로 생성되었습니다.',
        color: 'success',
      });

      console.log('📤 onSubmit: 폼 제출 완료');
    },
    [addToast]
  );

  return { onSubmit };
};
