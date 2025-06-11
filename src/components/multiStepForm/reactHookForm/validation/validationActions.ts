import { FormSchemaValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';
import { getFieldsToValidate } from '../utils/validationUtils';

export const triggerStepValidation = async (
  step: StepNumber,
  trigger: (fields?: (keyof FormSchemaValues)[]) => Promise<boolean>
): Promise<boolean> => {
  console.log('✅ validationActions: 스텝 검증 트리거', step);

  const fieldsToValidate = getFieldsToValidate(step);

  if (fieldsToValidate.length === 0) {
    console.log('✅ validationActions: 검증할 필드 없음');
    return true;
  }

  const isValid = await trigger(fieldsToValidate);
  console.log('✅ validationActions: 검증 결과', isValid);
  return isValid;
};

export const extractValidationErrors = (
  errors: any,
  fieldsToValidate: (keyof FormSchemaValues)[]
): string[] => {
  console.log('❌ validationActions: 에러 메시지 추출');

  const errorMessages = Object.entries(errors)
    .filter(([key]) => fieldsToValidate.includes(key as keyof FormSchemaValues))
    .map(([_, value]: [string, any]) => value?.message || '알 수 없는 오류')
    .filter(Boolean);

  console.log('❌ validationActions: 에러 메시지들', errorMessages);
  return errorMessages;
};

export const showValidationToast = (
  isValid: boolean,
  errorMessages: string[],
  addToast: (options: any) => void
) => {
  console.log('🔔 validationActions: 검증 토스트 표시', {
    isValid,
    errorMessages,
  });

  if (!isValid && errorMessages.length > 0) {
    addToast({
      title: '유효성 검사 실패',
      description: errorMessages[0],
      color: 'danger',
    });
  }
};
