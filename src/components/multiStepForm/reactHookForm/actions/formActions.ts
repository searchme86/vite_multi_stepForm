import { FormSchemaValues } from '../../types/formTypes';
import { isValidFormSchemaKey } from '../utils/validationHelpers';

const DEFAULT_FORM_VALUES: FormSchemaValues = {
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

export const resetForm = (
  setValue: (name: keyof FormSchemaValues, value: any) => void
) => {
  console.log('📝 formActions: 폼 초기화');

  Object.entries(DEFAULT_FORM_VALUES).forEach(([key, value]) => {
    if (isValidFormSchemaKey(key)) {
      setValue(key, value);
    }
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
