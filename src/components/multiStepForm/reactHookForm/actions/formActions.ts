import { FormSchemaValues } from '../../types/formTypes';

export const resetForm = (
  setValue: (name: keyof FormSchemaValues, value: any) => void
) => {
  console.log('📝 formActions: 폼 초기화');

  const defaultValues = {
    userImage: '',
    nickname: '',
    emailPrefix: '',
    emailDomain: '',
    bio: '',
    title: '',
    description: '',
    tags: '',
    content: '',
    media: [],
    mainImage: null,
    sliderImages: [],
    editorCompletedContent: '',
    isEditorCompleted: false,
  };

  Object.entries(defaultValues).forEach(([key, value]) => {
    setValue(key as keyof FormSchemaValues, value);
  });
};

export const submitForm = (data: FormSchemaValues) => {
  console.log('📝 formActions: 폼 제출', data);
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('📝 formActions: 폼 제출 완료');
      resolve(data);
    }, 1000);
  });
};

export const saveFormDraft = (data: FormSchemaValues) => {
  console.log('📝 formActions: 폼 임시저장', data);
  localStorage.setItem('formDraft', JSON.stringify(data));
};

export const loadFormDraft = (): Partial<FormSchemaValues> | null => {
  console.log('📝 formActions: 폼 임시저장 불러오기');
  const draft = localStorage.getItem('formDraft');
  return draft ? JSON.parse(draft) : null;
};
