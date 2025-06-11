import React from 'react';
import { UseFormTrigger, FieldErrors } from 'react-hook-form';
import { FormSchemaValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';
import { EditorState } from '../../types/editorTypes';
import { logValidation } from '../../utils/debugUtils';

interface UseValidationProps {
  trigger: UseFormTrigger<FormSchemaValues>;
  errors: FieldErrors<FormSchemaValues>;
  editorState: EditorState;
  addToast: (options: any) => void;
}

export const useValidation = ({
  trigger,
  errors,
  editorState,
  addToast,
}: UseValidationProps) => {
  const validateCurrentStep = React.useCallback(
    async (currentStep: StepNumber) => {
      console.log('✅ validateCurrentStep: 스텝 유효성 검사 시작', currentStep);

      let fieldsToValidate: (keyof FormSchemaValues)[] = [];

      switch (currentStep) {
        case 1:
          fieldsToValidate = ['nickname', 'emailPrefix', 'emailDomain'];
          break;
        case 2:
          fieldsToValidate = ['title', 'description'];
          break;
        case 3:
          fieldsToValidate = ['content'];
          break;
        case 4:
          if (
            !editorState.isCompleted ||
            !editorState.completedContent.trim()
          ) {
            console.log('❌ validateCurrentStep: 에디터 완료 검증 실패');
            addToast({
              title: '에디터 작성 미완료',
              description: '모듈화된 에디터에서 글 작성을 완료해주세요.',
              color: 'warning',
            });
            return false;
          }
          console.log('✅ validateCurrentStep: 에디터 완료 검증 성공');
          return true;
        case 5:
          console.log('✅ validateCurrentStep: 미디어 스텝은 필수 항목 없음');
          return true;
      }

      const isValid = await trigger(fieldsToValidate);

      if (!isValid) {
        const errorMessages = Object.entries(errors)
          .filter(([key]) =>
            fieldsToValidate.includes(key as keyof FormSchemaValues)
          )
          .map(([_, value]) => value.message);

        logValidation(currentStep, false, errorMessages);

        if (errorMessages.length > 0) {
          addToast({
            title: '유효성 검사 실패',
            description: errorMessages[0] as string,
            color: 'danger',
          });
        }
      } else {
        logValidation(currentStep, true);
      }

      return isValid;
    },
    [
      trigger,
      errors,
      editorState.isCompleted,
      editorState.completedContent,
      addToast,
    ]
  );

  return { validateCurrentStep };
};
