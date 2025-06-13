import { MultiStepFormState } from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormGetters {
  getFormValues: () => FormValues;
  getCurrentStep: () => StepNumber;
  getProgressWidth: () => number;
  getShowPreview: () => boolean;
  getEditorCompletedContent: () => string;
  getIsEditorCompleted: () => boolean;
}

export const createMultiStepFormGetters = (
  get: () => MultiStepFormState
): MultiStepFormGetters => {
  return {
    getFormValues: () => get().formValues,
    getCurrentStep: () => get().currentStep,
    getProgressWidth: () => get().progressWidth,
    getShowPreview: () => get().showPreview,
    getEditorCompletedContent: () => get().editorCompletedContent,
    getIsEditorCompleted: () => get().isEditorCompleted,
  };
};
