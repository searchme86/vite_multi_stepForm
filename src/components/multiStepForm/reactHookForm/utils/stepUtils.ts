// src/components/multiStepForm/reactHookForm/utils/stepUtils.ts

import {
  getTotalSteps,
  getMinStep,
  getMaxStep,
  getStepNumbers,
  isValidStepNumber,
  calculateProgressWidth,
} from '../../utils/dynamicStepTypes';
import type { StepNumber } from '../../utils/dynamicStepTypes';

// 진행률 정보 타입
interface ProgressInformation {
  readonly currentStep: StepNumber;
  readonly minStep: StepNumber;
  readonly maxStep: StepNumber;
  readonly totalSteps: number;
  readonly progress: number;
  readonly progressText: string;
  readonly stepText: string;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly stepsRemaining: number;
  readonly stepsCompleted: number;
}

// 진행률 변경 정보 타입
interface ProgressChangeInformation {
  readonly hasChanged: boolean;
  readonly oldProgress: number;
  readonly newProgress: number;
  readonly difference: number;
  readonly percentageChange: string;
}

// 기본 상수
const DEFAULT_PROGRESS_VALUE = 0;
const PROGRESS_PRECISION = 1;

// 안전한 진행률 계산
const calculateProgressSafely = (
  currentStep: StepNumber,
  customTotalSteps?: number
): number => {
  console.log('🔧 stepUtils: 안전한 진행률 계산 시작 -', {
    currentStep,
    customTotalSteps,
  });

  // 현재 스텝 유효성 검사
  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.warn('⚠️ stepUtils: 유효하지 않은 현재 스텝 -', currentStep);
    return DEFAULT_PROGRESS_VALUE;
  }

  // 동적 계산 우선 사용
  if (customTotalSteps === undefined || customTotalSteps === null) {
    try {
      const calculatedProgress = calculateProgressWidth(currentStep);
      const isValidProgress =
        typeof calculatedProgress === 'number' &&
        calculatedProgress >= 0 &&
        calculatedProgress <= 100;

      if (isValidProgress) {
        console.log(
          '✅ stepUtils: 동적 진행률 계산 성공 -',
          calculatedProgress
        );
        return calculatedProgress;
      }
    } catch (error) {
      console.error('❌ stepUtils: 동적 진행률 계산 실패:', error);
    }
  }

  // 커스텀 totalSteps 기반 계산
  const safeTotalSteps =
    typeof customTotalSteps === 'number' && customTotalSteps > 0
      ? customTotalSteps
      : getTotalSteps();

  const safeMinStep = getMinStep();

  if (safeTotalSteps <= 1) {
    console.log('✅ stepUtils: 스텝이 1개뿐이므로 100% 반환');
    return 100;
  }

  if (currentStep < safeMinStep) {
    console.log('✅ stepUtils: 최소 스텝보다 작으므로 0% 반환');
    return DEFAULT_PROGRESS_VALUE;
  }

  const progressValue =
    ((currentStep - safeMinStep) / (safeTotalSteps - 1)) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progressValue));

  console.log('✅ stepUtils: 커스텀 진행률 계산 성공 -', {
    currentStep,
    safeMinStep,
    safeTotalSteps,
    progressValue,
    clampedProgress,
  });

  return clampedProgress;
};

// fallback 진행률 계산
const calculateFallbackProgress = (currentStep: StepNumber): number => {
  console.log('🔧 stepUtils: fallback 진행률 계산 -', currentStep);

  const minStep = getMinStep();
  const totalSteps = getTotalSteps();

  if (totalSteps <= 1) {
    console.log('✅ stepUtils: fallback - 스텝 1개뿐이므로 100%');
    return 100;
  }

  const progressValue = ((currentStep - minStep) / (totalSteps - 1)) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progressValue));

  console.log('✅ stepUtils: fallback 계산 완료 -', clampedProgress);
  return clampedProgress;
};

/**
 * 현재 스텝을 기반으로 진행률을 계산하는 함수
 */
export const calculateProgress = (
  currentStep: StepNumber,
  customTotalSteps?: number
): number => {
  console.log('🚀 stepUtils: calculateProgress 호출 -', {
    currentStep,
    customTotalSteps,
  });

  const result = calculateProgressSafely(currentStep, customTotalSteps);

  const isValidResult = result >= 0 && result <= 100;
  if (isValidResult) {
    console.log('✅ stepUtils: calculateProgress 성공 -', result);
    return result;
  }

  console.warn('⚠️ stepUtils: 유효하지 않은 결과, fallback 사용 -', result);
  return calculateFallbackProgress(currentStep);
};

/**
 * 동적 시스템을 사용하는 권장 함수
 */
export const calculateProgressRecommended = (
  currentStep: StepNumber
): number => {
  console.log('🚀 stepUtils: calculateProgressRecommended 호출 -', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ stepUtils: 유효하지 않은 스텝 -', currentStep);
    return DEFAULT_PROGRESS_VALUE;
  }

  const calculatedProgress = calculateProgressWidth(currentStep);
  const isValidProgress = typeof calculatedProgress === 'number';

  if (isValidProgress) {
    console.log('✅ stepUtils: 권장 계산 성공 -', calculatedProgress);
    return calculatedProgress;
  } else {
    console.error(
      '❌ stepUtils: 권장 계산 실패, 기본값 반환 -',
      calculatedProgress
    );
    return DEFAULT_PROGRESS_VALUE;
  }
};

/**
 * 진행률과 함께 추가 정보를 반환하는 함수
 */
export const getProgressInfo = (
  currentStep: StepNumber
): ProgressInformation => {
  console.log('🚀 stepUtils: getProgressInfo 호출 -', currentStep);

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const totalSteps = getTotalSteps();
  const progress = calculateProgressRecommended(currentStep);

  const isFirstStep = currentStep === minStep;
  const isLastStep = currentStep === maxStep;
  const stepsCompleted = Math.max(0, currentStep - minStep);
  const stepsRemaining = Math.max(0, totalSteps - stepsCompleted - 1);

  const progressInformation: ProgressInformation = {
    currentStep,
    minStep,
    maxStep,
    totalSteps,
    progress,
    progressText: `${progress.toFixed(PROGRESS_PRECISION)}%`,
    stepText: `${currentStep}/${totalSteps}`,
    isFirst: isFirstStep,
    isLast: isLastStep,
    stepsRemaining,
    stepsCompleted,
  };

  console.log('✅ stepUtils: getProgressInfo 완료 -', progressInformation);
  return progressInformation;
};

/**
 * 여러 스텝의 진행률을 한 번에 계산하는 함수
 */
export const calculateMultipleProgress = (
  steps: StepNumber[]
): Map<StepNumber, number> => {
  console.log('🚀 stepUtils: calculateMultipleProgress 호출 -', steps);

  const progressMap = new Map<StepNumber, number>();

  const validSteps = steps.filter((step) => {
    const isValid = isValidStepNumber(step);
    if (!isValid) {
      console.warn('⚠️ stepUtils: 유효하지 않은 스텝 제외 -', step);
    }
    return isValid;
  });

  console.log('🔧 stepUtils: 유효한 스텝들 -', validSteps);

  for (const step of validSteps) {
    const progress = calculateProgressRecommended(step);
    progressMap.set(step, progress);
  }

  console.log('✅ stepUtils: calculateMultipleProgress 완료 -', {
    totalSteps: steps.length,
    validSteps: validSteps.length,
    calculatedSteps: progressMap.size,
  });

  return progressMap;
};

/**
 * 특정 스텝들만 포함한 진행률 맵을 생성하는 함수
 */
export const calculateSpecificProgress = (
  steps: StepNumber[]
): Map<StepNumber, number> => {
  console.log('🚀 stepUtils: calculateSpecificProgress 호출 -', steps);

  return calculateMultipleProgress(steps);
};

/**
 * 진행률이 변경되었는지 확인하는 함수
 */
export const getProgressChange = (
  oldStep: StepNumber,
  newStep: StepNumber
): ProgressChangeInformation => {
  console.log('🚀 stepUtils: getProgressChange 호출 -', { oldStep, newStep });

  const oldProgress = calculateProgressRecommended(oldStep);
  const newProgress = calculateProgressRecommended(newStep);

  const progressDifference = newProgress - oldProgress;
  const hasProgressChanged = Math.abs(progressDifference) > 0.1;

  const changeInformation: ProgressChangeInformation = {
    hasChanged: hasProgressChanged,
    oldProgress,
    newProgress,
    difference: progressDifference,
    percentageChange: progressDifference.toFixed(PROGRESS_PRECISION),
  };

  console.log('✅ stepUtils: getProgressChange 완료 -', changeInformation);
  return changeInformation;
};

/**
 * 모든 스텝에 대한 진행률 정보를 생성하는 함수
 */
export const generateAllProgressInfo = (): Map<
  StepNumber,
  ProgressInformation
> => {
  console.log('🚀 stepUtils: generateAllProgressInfo 호출');

  const allStepNumbers = getStepNumbers();
  const progressInfoMap = new Map<StepNumber, ProgressInformation>();

  console.log('🔧 stepUtils: 모든 스텝 번호들 -', allStepNumbers);

  for (const stepNumber of allStepNumbers) {
    const progressInfo = getProgressInfo(stepNumber);
    progressInfoMap.set(stepNumber, progressInfo);
  }

  console.log('✅ stepUtils: generateAllProgressInfo 완료 -', {
    totalSteps: allStepNumbers.length,
    generatedInfo: progressInfoMap.size,
  });

  return progressInfoMap;
};

/**
 * 스텝 범위 검증 함수
 */
export const validateStepRange = (
  stepToValidate: StepNumber,
  allowedSteps?: StepNumber[]
): boolean => {
  console.log('🚀 stepUtils: validateStepRange 호출 -', {
    stepToValidate,
    allowedSteps,
  });

  const isStepValid = isValidStepNumber(stepToValidate);
  if (!isStepValid) {
    console.error('❌ stepUtils: 스텝 번호가 유효하지 않음 -', stepToValidate);
    return false;
  }

  if (allowedSteps !== undefined && allowedSteps !== null) {
    const allowedStepsSet = new Set(allowedSteps);
    const isStepAllowed = allowedStepsSet.has(stepToValidate);

    console.log('🔧 stepUtils: 허용된 스텝들 검증 -', {
      stepToValidate,
      allowedSteps,
      isStepAllowed,
    });

    return isStepAllowed;
  }

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const isWithinRange = stepToValidate >= minStep && stepToValidate <= maxStep;

  console.log('✅ stepUtils: validateStepRange 완료 -', {
    stepToValidate,
    minStep,
    maxStep,
    isWithinRange,
  });

  return isWithinRange;
};
