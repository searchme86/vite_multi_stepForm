import { StepNumber } from '../../types/stepTypes';
import { logStepChange } from '../../utils/debugUtils';

export const moveToNextStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log('➡️ stepNavigationActions: 다음 스텝으로 이동');
  if (currentStep < 5) {
    const nextStep = (currentStep + 1) as StepNumber;
    logStepChange(nextStep, 'next');
    setCurrentStep(nextStep);
  }
};

export const moveToPrevStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log('⬅️ stepNavigationActions: 이전 스텝으로 이동');
  if (currentStep > 1) {
    const prevStep = (currentStep - 1) as StepNumber;
    logStepChange(prevStep, 'prev');
    setCurrentStep(prevStep);
  }
};

export const moveToStep = (
  targetStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log('🎯 stepNavigationActions: 특정 스텝으로 이동', targetStep);
  logStepChange(targetStep, 'direct');
  setCurrentStep(targetStep);
};

export const getNextStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  return currentStep < 5 ? ((currentStep + 1) as StepNumber) : null;
};

export const getPrevStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  return currentStep > 1 ? ((currentStep - 1) as StepNumber) : null;
};
