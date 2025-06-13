import { StepNumber, TOTAL_STEPS, MIN_STEP } from '../../types/stepTypes';

export const calculateProgress = (
  currentStep: StepNumber,
  totalSteps: number = TOTAL_STEPS
): number => {
  console.log('📊 calculateProgress: 진행률 계산', { currentStep, totalSteps });
  const progress = ((currentStep - MIN_STEP) / (totalSteps - 1)) * 100;
  console.log('📊 calculateProgress 결과:', progress);
  return progress;
};
