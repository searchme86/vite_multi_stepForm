import { MultiStepFormState } from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';

export interface MultiStepFormSetters {
  setFormValues: (formValues: FormValues) => void;
  updateFormValue: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  setCurrentStep: (step: number) => void;
  setProgressWidth: (width: number) => void;
  setShowPreview: (show: boolean) => void;
  togglePreview: () => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: number) => void;
  updateEditorContent: (content: string) => void;
  setEditorCompleted: (completed: boolean) => void;
}

export const createMultiStepFormSetters = (
  set: (
    partial:
      | Partial<MultiStepFormState>
      | ((state: MultiStepFormState) => Partial<MultiStepFormState>)
  ) => void
): MultiStepFormSetters => {
  return {
    setFormValues: (formValues: FormValues) => {
      set({ formValues });
    },

    updateFormValue: <K extends keyof FormValues>(
      key: K,
      value: FormValues[K]
    ) => {
      set((state) => ({
        formValues: {
          ...state.formValues,
          [key]: value,
        },
      }));
    },

    setCurrentStep: (step: number) => {
      set({ currentStep: step });
    },

    setProgressWidth: (width: number) => {
      set({ progressWidth: width });
    },

    setShowPreview: (show: boolean) => {
      set({ showPreview: show });
    },

    togglePreview: () => {
      set((state) => ({ showPreview: !state.showPreview }));
    },

    goToNextStep: () => {
      set((state) => {
        const nextStep = Math.min(state.currentStep + 1, 5);
        const progress = ((nextStep - 1) / 4) * 100;
        return {
          currentStep: nextStep,
          progressWidth: progress,
        };
      });
    },

    goToPrevStep: () => {
      set((state) => {
        const prevStep = Math.max(state.currentStep - 1, 1);
        const progress = ((prevStep - 1) / 4) * 100;
        return {
          currentStep: prevStep,
          progressWidth: progress,
        };
      });
    },

    goToStep: (step: number) => {
      set(() => {
        const targetStep = Math.max(1, Math.min(step, 5));
        const progress = ((targetStep - 1) / 4) * 100;
        return {
          currentStep: targetStep,
          progressWidth: progress,
        };
      });
    },

    updateEditorContent: (content: string) => {
      set((state) => ({
        editorCompletedContent: content,
        formValues: {
          ...state.formValues,
          editorCompletedContent: content,
        },
      }));
    },

    setEditorCompleted: (completed: boolean) => {
      set((state) => ({
        isEditorCompleted: completed,
        formValues: {
          ...state.formValues,
          isEditorCompleted: completed,
        },
      }));
    },
  };
};
