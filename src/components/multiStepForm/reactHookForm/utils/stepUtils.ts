// src/components/multiStepForm/reactHookForm/utils/stepUtils.ts

import {
  getTotalSteps,
  getMinStep,
  isValidStepNumber,
} from '../../types/stepTypes';
import type { StepNumber } from '../../types/stepTypes';
import { stepCalculations } from '../../store/multiStepForm/initialMultiStepFormState';

// 🔧 진행률 정보 타입
interface ProgressInformation {
  readonly currentStep: StepNumber;
  readonly minStep: StepNumber;
  readonly totalSteps: number;
  readonly progress: number;
  readonly progressText: string;
  readonly stepText: string;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly stepsRemaining: number;
  readonly stepsCompleted: number;
}

// 🔧 진행률 변경 정보 타입
interface ProgressChangeInformation {
  readonly hasChanged: boolean;
  readonly oldProgress: number;
  readonly newProgress: number;
  readonly difference: number;
  readonly percentageChange: string;
}

// 🔧 기본 상수
const DEFAULT_PROGRESS_VALUE = 0;
const DEFAULT_TOTAL_STEPS = 5;
const PROGRESS_PRECISION = 1;

// 🔧 안전한 진행률 계산
const calculateProgressSafely = (
  currentStep: StepNumber,
  totalSteps?: number
): number => {
  // 현재 스텝 유효성 검사
  if (!isValidStepNumber(currentStep)) {
    console.warn('⚠️ 유효하지 않은 현재 스텝:', currentStep);
    return DEFAULT_PROGRESS_VALUE;
  }

  // stepCalculations 우선 사용
  if (totalSteps === undefined || totalSteps === null) {
    const calculatedProgress =
      stepCalculations.calculateProgressWidth(currentStep);
    if (
      typeof calculatedProgress === 'number' &&
      calculatedProgress >= 0 &&
      calculatedProgress <= 100
    ) {
      return calculatedProgress;
    }
  }

  // 커스텀 totalSteps 사용
  const safeTotalSteps =
    typeof totalSteps === 'number' && totalSteps > 0
      ? totalSteps
      : DEFAULT_TOTAL_STEPS;
  const safeMinStep = getMinStep();

  if (safeTotalSteps <= 1) {
    return 100;
  }

  if (currentStep < safeMinStep) {
    return DEFAULT_PROGRESS_VALUE;
  }

  const progressValue =
    ((currentStep - safeMinStep) / (safeTotalSteps - 1)) * 100;
  return Math.max(0, Math.min(100, progressValue));
};

// 🔧 fallback 진행률 계산
const calculateFallbackProgress = (currentStep: StepNumber): number => {
  const minStep = getMinStep();
  const totalSteps = getTotalSteps();

  if (totalSteps <= 1) {
    return 100;
  }

  const progressValue = ((currentStep - minStep) / (totalSteps - 1)) * 100;
  return Math.max(0, Math.min(100, progressValue));
};

/**
 * 현재 스텝을 기반으로 진행률을 계산하는 함수
 */
export const calculateProgress = (
  currentStep: StepNumber,
  totalSteps?: number
): number => {
  const result = calculateProgressSafely(currentStep, totalSteps);

  if (result >= 0 && result <= 100) {
    return result;
  }

  return calculateFallbackProgress(currentStep);
};

/**
 * stepCalculations를 직접 사용하는 권장 함수
 */
export const calculateProgressRecommended = (
  currentStep: StepNumber
): number => {
  if (!isValidStepNumber(currentStep)) {
    return DEFAULT_PROGRESS_VALUE;
  }

  const calculatedProgress =
    stepCalculations.calculateProgressWidth(currentStep);
  return typeof calculatedProgress === 'number'
    ? calculatedProgress
    : DEFAULT_PROGRESS_VALUE;
};

/**
 * 진행률과 함께 추가 정보를 반환하는 함수
 */
export const getProgressInfo = (
  currentStep: StepNumber
): ProgressInformation => {
  const minStep = getMinStep();
  const totalSteps = getTotalSteps();
  const progress = calculateProgressRecommended(currentStep);

  const isFirstStep = currentStep === minStep;
  const isLastStep = currentStep === totalSteps;
  const stepsCompleted = Math.max(0, currentStep - minStep);
  const stepsRemaining = Math.max(0, totalSteps - currentStep);

  return {
    currentStep,
    minStep,
    totalSteps,
    progress,
    progressText: `${progress.toFixed(PROGRESS_PRECISION)}%`,
    stepText: `${currentStep}/${totalSteps}`,
    isFirst: isFirstStep,
    isLast: isLastStep,
    stepsRemaining,
    stepsCompleted,
  };
};

/**
 * 여러 스텝의 진행률을 한 번에 계산하는 함수
 */
export const calculateMultipleProgress = (
  steps: StepNumber[]
): Record<StepNumber, number> => {
  const progressMap: Record<StepNumber, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  const validSteps = steps.filter(isValidStepNumber);

  for (const step of validSteps) {
    progressMap[step] = calculateProgressRecommended(step);
  }

  return progressMap;
};

/**
 * 특정 스텝들만 포함한 진행률 맵을 생성하는 함수
 */
export const calculateSpecificProgress = (
  steps: StepNumber[]
): Record<StepNumber, number> => {
  return calculateMultipleProgress(steps);
};

/**
 * 진행률이 변경되었는지 확인하는 함수
 */
export const getProgressChange = (
  oldStep: StepNumber,
  newStep: StepNumber
): ProgressChangeInformation => {
  const oldProgress = calculateProgressRecommended(oldStep);
  const newProgress = calculateProgressRecommended(newStep);

  const progressDifference = newProgress - oldProgress;
  const hasProgressChanged = Math.abs(progressDifference) > 0.1;

  return {
    hasChanged: hasProgressChanged,
    oldProgress,
    newProgress,
    difference: progressDifference,
    percentageChange: progressDifference.toFixed(PROGRESS_PRECISION),
  };
};
