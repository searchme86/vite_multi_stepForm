import { FormSchemaValues } from '../../types/formTypes';
import { StepNumber, getStepValidationFields } from '../../types/stepTypes';
import { filterValidFormFields } from '../utils/validationHelpers';

export const getFieldsToValidate = (
  step: StepNumber
): (keyof FormSchemaValues)[] => {
  console.log('✅ validationUtils: 검증할 필드 가져오기', step);
  const rawFields = getStepValidationFields(step);
  return filterValidFormFields(rawFields);
};

export const validateEmail = (
  emailPrefix: string,
  emailDomain: string
): boolean => {
  console.log('📧 validationUtils: 이메일 형식 검증');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fullEmail = `${emailPrefix}@${emailDomain}`;
  const isValid = emailRegex.test(fullEmail);

  console.log('📧 validationUtils: 이메일 검증 결과', isValid);
  return isValid;
};

export const validateNickname = (
  nickname: string
): { isValid: boolean; message?: string } => {
  console.log('👤 validationUtils: 닉네임 검증');

  if (!nickname || nickname.length < 4) {
    return { isValid: false, message: '닉네임은 최소 4자 이상이어야 합니다.' };
  }

  if (nickname.length > 20) {
    return {
      isValid: false,
      message: '닉네임은 최대 20자까지 입력 가능합니다.',
    };
  }

  return { isValid: true };
};

export const validateTitle = (
  title: string
): { isValid: boolean; message?: string } => {
  console.log('📝 validationUtils: 제목 검증');

  if (!title || title.length < 5) {
    return {
      isValid: false,
      message: '제목은 5자 이상 100자 이하로 작성해주세요.',
    };
  }

  if (title.length > 100) {
    return {
      isValid: false,
      message: '제목은 5자 이상 100자 이하로 작성해주세요.',
    };
  }

  return { isValid: true };
};

export const validateContent = (
  content: string
): { isValid: boolean; message?: string } => {
  console.log('📄 validationUtils: 내용 검증');

  if (!content || content.length < 5) {
    return {
      isValid: false,
      message: '블로그 내용이 최소 5자 이상이어야 합니다.',
    };
  }

  return { isValid: true };
};
