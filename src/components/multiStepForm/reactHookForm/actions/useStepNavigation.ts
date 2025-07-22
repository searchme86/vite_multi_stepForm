// src/components/multiStepForm/reactHookForm/navigation/useStepNavigation.ts

import React from 'react';
import {
  getMinStep,
  getMaxStep,
  getNextStep,
  getPreviousStep,
  getTotalSteps,
  isValidStepNumber,
  calculateProgressWidth,
} from '../../utils/dynamicStepTypes';
import type { StepNumber } from '../../utils/dynamicStepTypes';
import { logStepChange } from '../../utils/debugUtils';

// 스텝 정보 타입
interface StepInformation {
  readonly currentStep: StepNumber;
  readonly minStep: StepNumber;
  readonly maxStep: StepNumber;
  readonly totalSteps: number;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly canGoNext: boolean;
  readonly canGoPrev: boolean;
  readonly isValid: boolean;
}

// 스텝 네비게이션 상태 타입
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

// 동적 진행률 계산
const calculateStepProgressWidthSafely = (targetStep: StepNumber): number => {
  console.log('🔧 useStepNavigation: 진행률 계산 시작 -', targetStep);

  const isValidStep = isValidStepNumber(targetStep);
  if (!isValidStep) {
    console.error('❌ useStepNavigation: 유효하지 않은 스텝 -', targetStep);
    return 0;
  }

  try {
    const calculatedProgress = calculateProgressWidth(targetStep);
    const isValidProgress =
      typeof calculatedProgress === 'number' &&
      calculatedProgress >= 0 &&
      calculatedProgress <= 100;

    if (isValidProgress) {
      console.log(
        '✅ useStepNavigation: 진행률 계산 성공 -',
        calculatedProgress
      );
      return calculatedProgress;
    } else {
      console.error(
        '❌ useStepNavigation: 유효하지 않은 진행률 -',
        calculatedProgress
      );
      return 0;
    }
  } catch (error) {
    console.error('❌ useStepNavigation: 진행률 계산 실패:', error);
    return 0;
  }
};

// 스텝 유효성 검사
const validateStepRange = (targetStep: StepNumber): boolean => {
  console.log('🔧 useStepNavigation: 스텝 범위 검사 -', targetStep);

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const isValidStep = isValidStepNumber(targetStep);
  const isWithinRange = targetStep >= minStep && targetStep <= maxStep;
  const isValidRange = isValidStep && isWithinRange;

  console.log('🔧 useStepNavigation: 스텝 범위 검사 결과 -', {
    targetStep,
    minStep,
    maxStep,
    isValidStep,
    isWithinRange,
    isValidRange,
  });

  return isValidRange;
};

// 스텝 정보 계산
const calculateStepInformation = (currentStep: StepNumber): StepInformation => {
  console.log('🔧 useStepNavigation: 스텝 정보 계산 -', currentStep);

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const totalSteps = getTotalSteps();
  const isValidCurrentStep = isValidStepNumber(currentStep);

  const stepInformation: StepInformation = {
    currentStep,
    minStep,
    maxStep,
    totalSteps,
    isFirst: currentStep === minStep,
    isLast: currentStep === maxStep,
    canGoNext: currentStep < maxStep && isValidCurrentStep,
    canGoPrev: currentStep > minStep && isValidCurrentStep,
    isValid: isValidCurrentStep,
  };

  console.log('✅ useStepNavigation: 스텝 정보 계산 완료 -', stepInformation);
  return stepInformation;
};

// 안전한 스텝 초기화
const createSafeInitialStep = (): StepNumber => {
  console.log('🔧 useStepNavigation: 안전한 초기 스텝 생성');

  try {
    const minStep = getMinStep();
    const isValidMinStep = isValidStepNumber(minStep);

    if (isValidMinStep) {
      console.log('✅ useStepNavigation: 초기 스텝 설정 -', minStep);
      return minStep;
    } else {
      console.error(
        '❌ useStepNavigation: 유효하지 않은 최소 스텝, fallback 사용 -',
        minStep
      );
      return 1;
    }
  } catch (error) {
    console.error(
      '❌ useStepNavigation: 초기 스텝 생성 실패, fallback 사용:',
      error
    );
    return 1;
  }
};

// 메인 훅
export const useStepNavigation = (): StepNavigationState => {
  console.log('🚀 useStepNavigation: 훅 초기화');

  // 안전한 초기 스텝 설정
  const [currentStep, setCurrentStep] = React.useState<StepNumber>(() => {
    return createSafeInitialStep();
  });

  const [progressWidth, setProgressWidth] = React.useState<number>(0);

  // 스텝 정보 계산
  const stepInfo = React.useMemo(() => {
    console.log('🔧 useStepNavigation: 스텝 정보 메모이제이션 -', currentStep);
    return calculateStepInformation(currentStep);
  }, [currentStep]);

  // 진행률 업데이트
  React.useEffect(() => {
    console.log('🔧 useStepNavigation: 진행률 업데이트 시작 -', currentStep);

    const newProgress = calculateStepProgressWidthSafely(currentStep);

    const timer = setTimeout(() => {
      console.log('🔧 useStepNavigation: 진행률 설정 -', newProgress);
      setProgressWidth(newProgress);
    }, 100);

    return () => {
      console.log('🔧 useStepNavigation: 진행률 업데이트 타이머 정리');
      clearTimeout(timer);
    };
  }, [currentStep]);

  // 다음 스텝 이동
  const goToNextStep = React.useCallback((): void => {
    console.log('➡️ useStepNavigation: 다음 스텝 이동 시도 -', currentStep);

    const isCurrentStepValid = isValidStepNumber(currentStep);
    if (!isCurrentStepValid) {
      console.error(
        '❌ useStepNavigation: 유효하지 않은 현재 스텝 -',
        currentStep
      );
      return;
    }

    const maxStep = getMaxStep();
    if (currentStep >= maxStep) {
      console.warn('⚠️ useStepNavigation: 이미 마지막 스텝입니다');
      return;
    }

    const nextStep = getNextStep(currentStep);
    if (nextStep !== null && isValidStepNumber(nextStep)) {
      console.log('✅ useStepNavigation: 다음 스텝으로 이동 -', {
        from: currentStep,
        to: nextStep,
      });
      logStepChange(nextStep, 'next');
      setCurrentStep(nextStep);
    } else {
      console.warn(
        '⚠️ useStepNavigation: 다음 스텝을 찾을 수 없음 -',
        currentStep
      );
    }
  }, [currentStep]);

  // 이전 스텝 이동
  const goToPrevStep = React.useCallback((): void => {
    console.log('⬅️ useStepNavigation: 이전 스텝 이동 시도 -', currentStep);

    const isCurrentStepValid = isValidStepNumber(currentStep);
    if (!isCurrentStepValid) {
      console.error(
        '❌ useStepNavigation: 유효하지 않은 현재 스텝 -',
        currentStep
      );
      return;
    }

    const minStep = getMinStep();
    if (currentStep <= minStep) {
      console.warn('⚠️ useStepNavigation: 이미 첫 번째 스텝입니다');
      return;
    }

    const prevStep = getPreviousStep(currentStep);
    if (prevStep !== null && isValidStepNumber(prevStep)) {
      console.log('✅ useStepNavigation: 이전 스텝으로 이동 -', {
        from: currentStep,
        to: prevStep,
      });
      logStepChange(prevStep, 'prev');
      setCurrentStep(prevStep);
    } else {
      console.warn(
        '⚠️ useStepNavigation: 이전 스텝을 찾을 수 없음 -',
        currentStep
      );
    }
  }, [currentStep]);

  // 특정 스텝 이동
  const goToStep = React.useCallback(
    (targetStep: StepNumber): void => {
      console.log('🎯 useStepNavigation: 특정 스텝 이동 시도 -', {
        current: currentStep,
        target: targetStep,
      });

      const isTargetStepValid = validateStepRange(targetStep);
      if (!isTargetStepValid) {
        console.error(
          '❌ useStepNavigation: 유효하지 않은 목표 스텝 -',
          targetStep
        );
        return;
      }

      if (targetStep === currentStep) {
        console.log(
          '⚠️ useStepNavigation: 동일한 스텝으로 이동 시도 -',
          targetStep
        );
        return;
      }

      console.log('✅ useStepNavigation: 특정 스텝으로 이동 -', {
        from: currentStep,
        to: targetStep,
      });
      logStepChange(targetStep, 'direct');
      setCurrentStep(targetStep);
    },
    [currentStep]
  );

  // 편의 상태들 구조분해 할당
  const { isFirst, isLast, canGoNext, canGoPrev } = stepInfo;

  console.log('🚀 useStepNavigation: 훅 상태 반환 -', {
    currentStep,
    progressWidth,
    isFirst,
    isLast,
    canGoNext,
    canGoPrev,
  });

  return {
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isFirstStep: isFirst,
    isLastStep: isLast,
    canGoNext,
    canGoPrev,
    stepInfo,
    setCurrentStep,
  };
};

// 타입 추출
export type UseStepNavigationReturn = ReturnType<typeof useStepNavigation>;
