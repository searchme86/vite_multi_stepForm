import React from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';

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

  const enhancedGoToNextStep = React.useCallback(async () => {
    const isValid = await validateCurrentStep(currentStep as 1 | 2 | 3 | 4 | 5);
    if (isValid && currentStep < 5) {
      goToNextStep();
    }
  }, [validateCurrentStep, currentStep, goToNextStep]);

  const enhancedGoToStep = React.useCallback(
    async (step: number) => {
      if (step > currentStep) {
        const isValid = await validateCurrentStep(
          currentStep as 1 | 2 | 3 | 4 | 5
        );
        if (!isValid) return;
      }
      goToStep(step);
    },
    [currentStep, validateCurrentStep, goToStep]
  );

  const getFormAnalytics = React.useCallback(() => {
    return {
      currentStep,
      totalSteps: 5,
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
