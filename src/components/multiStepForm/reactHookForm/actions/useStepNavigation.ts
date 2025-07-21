// src/components/multiStepForm/reactHookForm/navigation/useStepNavigation.ts

import React from 'react';
import {
  getMinStep,
  getMaxStep,
  getNextStep,
  getPreviousStep,
  isValidStepNumber,
} from '../../types/stepTypes';
import type { StepNumber } from '../../types/stepTypes';
import { stepCalculations } from '../../store/multiStepForm/initialMultiStepFormState';
import { logStepChange } from '../../utils/debugUtils';

// 🚀 스텝 정보 타입
interface StepInformation {
  readonly currentStep: StepNumber;
  readonly minStep: StepNumber;
  readonly maxStep: StepNumber;
  readonly totalSteps: StepNumber;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly canGoNext: boolean;
  readonly canGoPrev: boolean;
  readonly isValid: boolean;
}

// 🚀 스텝 네비게이션 상태 타입
interface StepNavigationState {
  readonly currentStep: StepNumber;
  readonly progressWidth: number;
  readonly goToNextStep: () => void;
  readonly goToPrevStep: () => void;
  readonly goToStep: (step: StepNumber) => void;
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  readonly canGoNext: boolean;
  readonly canGoPrev: boolean;
  readonly stepInfo: StepInformation;
  readonly setCurrentStep: React.Dispatch<React.SetStateAction<StepNumber>>;
}

// 🚀 진행률 계산
const calculateStepProgressWidth = (targetStep: StepNumber): number => {
  if (!isValidStepNumber(targetStep)) {
    return 0;
  }

  try {
    const calculatedProgress =
      stepCalculations.calculateProgressWidth(targetStep);
    return typeof calculatedProgress === 'number' ? calculatedProgress : 0;
  } catch (error) {
    console.error('❌ 진행률 계산 실패:', error);
    return 0;
  }
};

// 🚀 스텝 유효성 검사
const validateStepRange = (targetStep: StepNumber): boolean => {
  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const isValidStep = isValidStepNumber(targetStep);
  const isWithinRange = targetStep >= minStep && targetStep <= maxStep;
  return isValidStep && isWithinRange;
};

// 🚀 스텝 정보 계산
const calculateStepInformation = (currentStep: StepNumber): StepInformation => {
  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const isValidCurrentStep = isValidStepNumber(currentStep);

  return {
    currentStep,
    minStep,
    maxStep,
    totalSteps: maxStep,
    isFirst: currentStep === minStep,
    isLast: currentStep === maxStep,
    canGoNext: currentStep < maxStep && isValidCurrentStep,
    canGoPrev: currentStep > minStep && isValidCurrentStep,
    isValid: isValidCurrentStep,
  };
};

// 🚀 메인 훅
export const useStepNavigation = (): StepNavigationState => {
  // 안전한 초기 스텝 설정
  const [currentStep, setCurrentStep] = React.useState<StepNumber>(() => {
    return getMinStep();
  });

  const [progressWidth, setProgressWidth] = React.useState<number>(0);

  // 스텝 정보 계산
  const stepInfo = React.useMemo(() => {
    return calculateStepInformation(currentStep);
  }, [currentStep]);

  // 진행률 업데이트
  React.useEffect(() => {
    const newProgress = calculateStepProgressWidth(currentStep);
    const timer = setTimeout(() => {
      setProgressWidth(newProgress);
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // 다음 스텝 이동
  const goToNextStep = React.useCallback((): void => {
    if (!isValidStepNumber(currentStep)) {
      console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
      return;
    }

    const maxStep = getMaxStep();
    if (currentStep >= maxStep) {
      console.warn('⚠️ 이미 마지막 스텝입니다');
      return;
    }

    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      logStepChange(nextStep, 'next');
      setCurrentStep(nextStep);
    }
  }, [currentStep]);

  // 이전 스텝 이동
  const goToPrevStep = React.useCallback((): void => {
    if (!isValidStepNumber(currentStep)) {
      console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
      return;
    }

    const minStep = getMinStep();
    if (currentStep <= minStep) {
      console.warn('⚠️ 이미 첫 번째 스텝입니다');
      return;
    }

    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      logStepChange(prevStep, 'prev');
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  // 특정 스텝 이동
  const goToStep = React.useCallback(
    (targetStep: StepNumber): void => {
      if (!validateStepRange(targetStep)) {
        console.error('❌ 유효하지 않은 목표 스텝:', targetStep);
        return;
      }

      if (targetStep === currentStep) {
        console.log('⚠️ 동일한 스텝으로 이동 시도');
        return;
      }

      logStepChange(targetStep, 'direct');
      setCurrentStep(targetStep);
    },
    [currentStep]
  );

  // 편의 상태들
  const {
    isFirst: isFirstStep,
    isLast: isLastStep,
    canGoNext,
    canGoPrev,
  } = stepInfo;

  return {
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    stepInfo,
    setCurrentStep,
  };
};

// 🚀 타입 추출
export type UseStepNavigationReturn = ReturnType<typeof useStepNavigation>;
