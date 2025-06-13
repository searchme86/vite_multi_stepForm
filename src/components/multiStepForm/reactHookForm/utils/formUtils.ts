import { FormSchemaValues } from '../../types/formTypes';
import { getStepValidationFields, StepNumber } from '../../types/stepTypes';
import { filterValidFormFields } from '../utils/validationHelpers';

export const getEmailFromForm = (formValues: FormSchemaValues): string => {
  console.log('📧 formUtils: 이메일 생성');
  const email = `${formValues.emailPrefix}@${formValues.emailDomain}`;
  console.log('📧 formUtils: 이메일 결과', email);
  return email;
};

export const getFormProgress = (formValues: FormSchemaValues): number => {
  console.log('📊 formUtils: 폼 진행률 계산');

  const requiredFields = [
    'nickname',
    'emailPrefix',
    'emailDomain',
    'title',
    'description',
    'content',
  ] as (keyof FormSchemaValues)[];

  const completedFields = requiredFields.filter((field) => {
    const value = formValues[field];
    return value && value.toString().trim().length > 0;
  });

  const progress = (completedFields.length / requiredFields.length) * 100;
  console.log('📊 formUtils: 진행률 결과', progress);
  return progress;
};

export const sanitizeFormData = (
  formValues: FormSchemaValues
): FormSchemaValues => {
  console.log('🧹 formUtils: 폼 데이터 정리');

  return {
    ...formValues,
    nickname: formValues.nickname?.trim() || '',
    emailPrefix: formValues.emailPrefix?.trim() || '',
    emailDomain: formValues.emailDomain?.trim() || '',
    title: formValues.title?.trim() || '',
    description: formValues.description?.trim() || '',
    content: formValues.content?.trim() || '',
    tags: formValues.tags?.trim() || '',
    bio: formValues.bio?.trim() || '',
  };
};

export const isStepComplete = (
  step: StepNumber,
  formValues: FormSchemaValues
): boolean => {
  console.log('✅ formUtils: 스텝 완료 여부 확인', step);

  const rawValidationFields = getStepValidationFields(step);
  const validationFields = filterValidFormFields(rawValidationFields);

  if (validationFields.length === 0) {
    return true;
  }

  const hasEditorValidation = rawValidationFields.some(
    (field) => field === 'editorCompleted' || field === 'editor'
  );

  if (hasEditorValidation) {
    return !!formValues.isEditorCompleted;
  }

  return validationFields.every((field) => {
    const value = formValues[field];
    if (field === 'isEditorCompleted') {
      return !!value;
    }
    return value && String(value).trim().length > 0;
  });
};
