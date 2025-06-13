import React from 'react';
import {
  StepNumber,
  MIN_STEP,
  getNextStep,
  getPreviousStep,
} from '../../types/stepTypes';
import { calculateProgress } from '../utils/stepUtils';
import { logStepChange } from '../../utils/debugUtils';

export const useStepNavigation = () => {
  const [currentStep, setCurrentStep] = React.useState<StepNumber>(MIN_STEP);
  const [progressWidth, setProgressWidth] = React.useState(0);

  React.useEffect(() => {
    console.log('📊 useStepNavigation: 진행률 업데이트');
    const progress = calculateProgress(currentStep);

    const timer = setTimeout(() => {
      setProgressWidth(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const goToNextStep = React.useCallback(() => {
    console.log('➡️ goToNextStep: 다음 스텝으로 이동');
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      logStepChange(nextStep, 'next');
      setCurrentStep(nextStep);
    }
  }, [currentStep]);

  const goToPrevStep = React.useCallback(() => {
    console.log('⬅️ goToPrevStep: 이전 스텝으로 이동');
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      logStepChange(prevStep, 'prev');
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  const goToStep = React.useCallback((step: StepNumber) => {
    console.log('🎯 goToStep: 특정 스텝으로 이동', step);
    logStepChange(step, 'direct');
    setCurrentStep(step);
  }, []);

  return {
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
  };
};
