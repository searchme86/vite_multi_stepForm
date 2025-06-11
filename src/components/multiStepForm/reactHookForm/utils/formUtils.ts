import { FormSchemaValues } from '../../types/formTypes';

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
  step: number,
  formValues: FormSchemaValues
): boolean => {
  console.log('✅ formUtils: 스텝 완료 여부 확인', step);

  switch (step) {
    case 1:
      return !!(
        formValues.nickname &&
        formValues.emailPrefix &&
        formValues.emailDomain
      );
    case 2:
      return !!(formValues.title && formValues.description);
    case 3:
      return !!formValues.content;
    case 4:
      return !!formValues.isEditorCompleted;
    case 5:
      return true;
    default:
      return false;
  }
};
