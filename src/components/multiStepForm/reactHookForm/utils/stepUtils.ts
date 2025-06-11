import { StepNumber } from '../../types/stepTypes';
import { STEP_TITLES, TOTAL_STEPS } from '../../utils/constants';

export const calculateProgress = (
  currentStep: StepNumber,
  totalSteps: number = TOTAL_STEPS
): number => {
  console.log('📊 calculateProgress: 진행률 계산', { currentStep, totalSteps });
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  console.log('📊 calculateProgress 결과:', progress);
  return progress;
};

export const getStepTitle = (step: StepNumber): string => {
  console.log('📝 getStepTitle: 스텝 제목 가져오기', step);
  const title = STEP_TITLES[step];
  console.log('📝 getStepTitle 결과:', title);
  return title;
};

export const isValidStepNumber = (step: number): step is StepNumber => {
  return step >= 1 && step <= TOTAL_STEPS;
};

export const getNextStep = (currentStep: StepNumber): StepNumber | null => {
  console.log('➡️ getNextStep: 다음 스텝 확인', currentStep);
  const nextStep = currentStep + 1;
  return isValidStepNumber(nextStep) ? (nextStep as StepNumber) : null;
};

export const getPrevStep = (currentStep: StepNumber): StepNumber | null => {
  console.log('⬅️ getPrevStep: 이전 스텝 확인', currentStep);
  const prevStep = currentStep - 1;
  return isValidStepNumber(prevStep) ? (prevStep as StepNumber) : null;
};
