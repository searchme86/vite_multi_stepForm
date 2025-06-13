import { useCallback } from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import {
  TOTAL_STEPS,
  MAX_STEP,
  isValidStepNumber,
} from '../types/stepTypes.ts';

export const useMultiStepFormState = () => {
  const { methods, handleSubmit, errors, trigger } = useFormMethods();

  const {
    formValues,
    updateFormValue,
    currentStep,
    progressWidth,
    showPreview,
    goToNextStep,
    goToPrevStep,
    goToStep,
    togglePreview,
    setShowPreview,
    addToast,
    editorCompletedContent,
    isEditorCompleted,
    updateEditorContent,
    setEditorCompleted,
  } = useMultiStepFormStore();

  const { validateCurrentStep } = useValidation({
    trigger,
    errors,
    editorState: {
      containers: [],
      paragraphs: [],
      completedContent: editorCompletedContent,
      isCompleted: isEditorCompleted,
    },
    addToast,
  });

  const { onSubmit } = useFormSubmit({ addToast });

  const enhancedGoToNextStep = useCallback(async () => {
    if (!isValidStepNumber(currentStep)) {
      console.error(`Invalid current step: ${currentStep}`);
      return;
    }

    const isValid = await validateCurrentStep(currentStep);
    if (isValid && currentStep < MAX_STEP) {
      goToNextStep();
    }
  }, [validateCurrentStep, currentStep, goToNextStep]);

  const enhancedGoToStep = useCallback(
    async (step: number) => {
      if (!isValidStepNumber(step)) {
        console.error(`Invalid target step: ${step}`);
        return;
      }

      if (!isValidStepNumber(currentStep)) {
        console.error(`Invalid current step: ${currentStep}`);
        return;
      }

      if (step > currentStep) {
        const isValid = await validateCurrentStep(currentStep);
        if (!isValid) return;
      }
      goToStep(step);
    },
    [currentStep, validateCurrentStep, goToStep]
  );

  const getFormAnalytics = useCallback(() => {
    return {
      currentStep,
      totalSteps: TOTAL_STEPS,
      errorCount: Object.keys(errors).length,
      hasUnsavedChanges: false,
      isFormValid: Object.keys(errors).length === 0,
    };
  }, [currentStep, errors]);

  return {
    methods,
    handleSubmit,
    onSubmit,
    formValues,
    updateFormValue,
    currentStep,
    progressWidth,
    goToNextStep: enhancedGoToNextStep,
    goToPrevStep,
    goToStep: enhancedGoToStep,
    validateCurrentStep,
    addToast,
    showPreview,
    togglePreview,
    setShowPreview,
    updateEditorContent,
    setEditorCompleted,
    getFormAnalytics,
  };
};
