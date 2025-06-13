import { MultiStepFormState } from './initialMultiStepFormState';
import { FormValues } from '../../types/formTypes';
import {
  StepNumber,
  MAX_STEP,
  MIN_STEP,
  TOTAL_STEPS,
  isValidStepNumber,
} from '../../types/stepTypes';

export interface MultiStepFormSetters {
  setFormValues: (formValues: FormValues) => void;
  updateFormValue: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K]
  ) => void;
  setCurrentStep: (step: StepNumber) => void;
  setProgressWidth: (width: number) => void;
  setShowPreview: (show: boolean) => void;
  togglePreview: () => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: StepNumber) => void;
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

    setCurrentStep: (step: StepNumber) => {
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
        const nextStepNumber = state.currentStep + 1;
        const nextStep: StepNumber =
          nextStepNumber <= MAX_STEP && isValidStepNumber(nextStepNumber)
            ? nextStepNumber
            : state.currentStep;
        const progress = ((nextStep - MIN_STEP) / (TOTAL_STEPS - 1)) * 100;
        return {
          currentStep: nextStep,
          progressWidth: progress,
        };
      });
    },

    goToPrevStep: () => {
      set((state) => {
        const prevStepNumber = state.currentStep - 1;
        const prevStep: StepNumber =
          prevStepNumber >= MIN_STEP && isValidStepNumber(prevStepNumber)
            ? prevStepNumber
            : state.currentStep;
        const progress = ((prevStep - MIN_STEP) / (TOTAL_STEPS - 1)) * 100;
        return {
          currentStep: prevStep,
          progressWidth: progress,
        };
      });
    },

    goToStep: (step: StepNumber) => {
      set(() => {
        const targetStep: StepNumber = isValidStepNumber(step)
          ? step
          : MIN_STEP;
        const progress = ((targetStep - MIN_STEP) / (TOTAL_STEPS - 1)) * 100;
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
