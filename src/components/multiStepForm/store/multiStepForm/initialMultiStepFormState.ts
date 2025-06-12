import { FormValues } from '../../types/formTypes';

export interface MultiStepFormState {
  formValues: FormValues;
  currentStep: number;
  progressWidth: number;
  showPreview: boolean;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

export const initialMultiStepFormState: MultiStepFormState = {
  formValues: {
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
  },
  currentStep: 1,
  progressWidth: 0,
  showPreview: false,
  editorCompletedContent: '',
  isEditorCompleted: false,
};
