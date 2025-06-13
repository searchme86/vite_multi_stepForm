import {
  StepNumber,
  MAX_STEP,
  MIN_STEP,
  getNextStep,
  getPreviousStep,
} from '../../types/stepTypes';
import { logStepChange } from '../../utils/debugUtils';

export const moveToNextStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log('➡️ stepNavigationActions: 다음 스텝으로 이동');
  const nextStep = getNextStep(currentStep);
  if (nextStep) {
    logStepChange(nextStep, 'next');
    setCurrentStep(nextStep);
  }
};

export const moveToPrevStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log('⬅️ stepNavigationActions: 이전 스텝으로 이동');
  const prevStep = getPreviousStep(currentStep);
  if (prevStep) {
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
  return getNextStep(currentStep);
};

export const getPrevStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  return getPreviousStep(currentStep);
};
