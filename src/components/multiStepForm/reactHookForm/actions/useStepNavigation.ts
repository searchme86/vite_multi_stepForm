import React from 'react';
//====여기부터 수정됨====
import {
  StepNumber,
  getMinStep, // ✅ MIN_STEP 대신 함수 사용
  getMaxStep, // ✅ 안전성을 위해 추가
  getNextStep,
  getPreviousStep,
  isValidStepNumber, // ✅ 유효성 검사를 위해 추가
} from '../../types/stepTypes';
// stepCalculations 사용 (더 권장되는 방법)
import { stepCalculations } from '../../store/multiStepForm/initialMultiStepFormState';
//====여기까지 수정됨====
import { calculateProgress } from '../utils/stepUtils';
import { logStepChange } from '../../utils/debugUtils';

//====여기부터 수정됨====
/**
 * 스텝 네비게이션을 관리하는 커스텀 훅
 *
 * 변경사항:
 * - MIN_STEP 상수 → getMinStep() 함수 사용
 * - 안전한 초기화와 유효성 검사 추가
 * - stepCalculations 활용으로 일관된 계산 보장
 * - 더 강화된 에러 처리와 로깅
 *
 * @returns 스텝 네비게이션 상태와 액션 함수들
 */
//====여기까지 수정됨====
export const useStepNavigation = () => {
  //====여기부터 수정됨====
  // 초기 스텝을 안전하게 설정
  // 이유: getMinStep() 함수 호출로 런타임에 안전하게 최소 스텝 계산
  const [currentStep, setCurrentStep] = React.useState<StepNumber>(() => {
    const minStep = getMinStep();
    console.log('🏗️ useStepNavigation 초기화, 시작 스텝:', minStep);
    return minStep;
  });
  //====여기까지 수정됨====

  const [progressWidth, setProgressWidth] = React.useState(0);

  //====여기부터 수정됨====
  // 진행률 업데이트 효과
  React.useEffect(() => {
    console.log(
      '📊 useStepNavigation: 진행률 업데이트, 현재 스텝:',
      currentStep
    );

    // stepCalculations를 사용하여 일관된 진행률 계산
    // 이유: initialMultiStepFormState와 동일한 로직 사용으로 일관성 보장
    const progress = stepCalculations.calculateProgressWidth(currentStep);

    // 또는 기존 calculateProgress 함수 사용 (fallback)
    // const progress = calculateProgress(currentStep);

    console.log('📊 계산된 진행률:', progress);

    const timer = setTimeout(() => {
      setProgressWidth(progress);
      console.log('✅ 진행률 업데이트 완료:', progress);
    }, 100);

    return () => {
      console.log('🧹 진행률 업데이트 타이머 정리');
      clearTimeout(timer);
    };
  }, [currentStep]);
  //====여기까지 수정됨====

  //====여기부터 수정됨====
  const goToNextStep = React.useCallback(() => {
    console.log('➡️ goToNextStep: 다음 스텝으로 이동 시도, 현재:', currentStep);

    // 현재 스텝 유효성 검사
    if (!isValidStepNumber(currentStep)) {
      console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
      return;
    }

    // 최대 스텝 확인
    const maxStep = getMaxStep();
    if (currentStep >= maxStep) {
      console.warn('⚠️ 이미 마지막 스텝입니다:', { currentStep, maxStep });
      return;
    }

    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      console.log('✅ 다음 스텝으로 이동:', {
        from: currentStep,
        to: nextStep,
      });
      logStepChange(nextStep, 'next');
      setCurrentStep(nextStep);
    } else {
      console.warn('⚠️ 다음 스텝을 찾을 수 없습니다:', currentStep);
    }
  }, [currentStep]);
  //====여기까지 수정됨====

  //====여기부터 수정됨====
  const goToPrevStep = React.useCallback(() => {
    console.log('⬅️ goToPrevStep: 이전 스텝으로 이동 시도, 현재:', currentStep);

    // 현재 스텝 유효성 검사
    if (!isValidStepNumber(currentStep)) {
      console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
      return;
    }

    // 최소 스텝 확인
    const minStep = getMinStep();
    if (currentStep <= minStep) {
      console.warn('⚠️ 이미 첫 번째 스텝입니다:', { currentStep, minStep });
      return;
    }

    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      console.log('✅ 이전 스텝으로 이동:', {
        from: currentStep,
        to: prevStep,
      });
      logStepChange(prevStep, 'prev');
      setCurrentStep(prevStep);
    } else {
      console.warn('⚠️ 이전 스텝을 찾을 수 없습니다:', currentStep);
    }
  }, [currentStep]);
  //====여기까지 수정됨====

  //====여기부터 수정됨====
  const goToStep = React.useCallback(
    (step: StepNumber) => {
      console.log('🎯 goToStep: 특정 스텝으로 이동 시도:', {
        from: currentStep,
        to: step,
      });

      // 목표 스텝 유효성 검사
      if (!isValidStepNumber(step)) {
        console.error('❌ 유효하지 않은 목표 스텝:', step);
        return;
      }

      // 스텝 범위 확인
      const minStep = getMinStep();
      const maxStep = getMaxStep();

      if (step < minStep || step > maxStep) {
        console.error('❌ 스텝 범위를 벗어났습니다:', {
          targetStep: step,
          validRange: `${minStep}-${maxStep}`,
        });
        return;
      }

      console.log('✅ 특정 스텝으로 이동:', step);
      logStepChange(step, 'direct');
      setCurrentStep(step);
    },
    [currentStep]
  ); // currentStep을 의존성에 포함하여 로깅에 사용
  //====여기까지 수정됨====

  //====여기부터 추가됨====
  // 추가적인 편의 함수들
  const isFirstStep = React.useMemo(() => {
    const minStep = getMinStep();
    const result = currentStep === minStep;
    console.log('🥇 첫 번째 스텝 여부:', {
      currentStep,
      minStep,
      isFirst: result,
    });
    return result;
  }, [currentStep]);

  const isLastStep = React.useMemo(() => {
    const maxStep = getMaxStep();
    const result = currentStep === maxStep;
    console.log('🏁 마지막 스텝 여부:', {
      currentStep,
      maxStep,
      isLast: result,
    });
    return result;
  }, [currentStep]);

  const canGoNext = React.useMemo(() => {
    const maxStep = getMaxStep();
    const canMove = currentStep < maxStep && isValidStepNumber(currentStep);
    console.log('➡️ 다음 스텝 이동 가능:', { currentStep, maxStep, canMove });
    return canMove;
  }, [currentStep]);

  const canGoPrev = React.useMemo(() => {
    const minStep = getMinStep();
    const canMove = currentStep > minStep && isValidStepNumber(currentStep);
    console.log('⬅️ 이전 스텝 이동 가능:', { currentStep, minStep, canMove });
    return canMove;
  }, [currentStep]);

  // 스텝 정보 객체
  const stepInfo = React.useMemo(() => {
    return {
      currentStep,
      minStep: getMinStep(),
      maxStep: getMaxStep(),
      totalSteps: getMaxStep(), // 일반적으로 maxStep이 totalSteps와 같음
      isFirst: isFirstStep,
      isLast: isLastStep,
      canGoNext,
      canGoPrev,
      isValid: isValidStepNumber(currentStep),
    };
  }, [currentStep, isFirstStep, isLastStep, canGoNext, canGoPrev]);

  // 스텝 정보 로깅 (디버깅용)
  React.useEffect(() => {
    console.log('📊 useStepNavigation 상태 정보:', stepInfo);
  }, [stepInfo]);
  //====여기까지 추가됨====

  return {
    // 기본 상태
    currentStep,
    progressWidth,

    // 기본 액션 함수들
    goToNextStep,
    goToPrevStep,
    goToStep,

    //====여기부터 추가됨====
    // 추가된 편의 속성들
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    stepInfo,

    // 직접 스텝 설정 (고급 사용자용)
    setCurrentStep,
    //====여기까지 추가됨====
  };
};
