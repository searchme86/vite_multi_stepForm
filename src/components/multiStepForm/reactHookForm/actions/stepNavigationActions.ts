// src/components/multiStepForm/reactHookForm/actions/stepNavigationActions.ts

import {
  StepNumber,
  getMaxStep,
  getMinStep,
  getNextStep,
  getPreviousStep,
  isValidStepNumber,
} from '../../utils/dynamicStepTypes';
import { logStepChange } from '../../utils/debugUtils';

interface StepNavigationState {
  readonly currentStep: StepNumber;
  readonly minStep: StepNumber;
  readonly maxStep: StepNumber;
  readonly nextStep: StepNumber | null;
  readonly prevStep: StepNumber | null;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly canGoNext: boolean;
  readonly canGoPrev: boolean;
  readonly isValid: boolean;
}

/**
 * 다음 스텝으로 이동하는 함수
 */
export const moveToNextStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
): void => {
  console.log('➡️ 다음 스텝으로 이동 시도, 현재:', currentStep);

  // 현재 스텝 유효성 검사
  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
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
  if (nextStep !== null && isValidStepNumber(nextStep)) {
    console.log('✅ 다음 스텝으로 이동:', { from: currentStep, to: nextStep });
    logStepChange(nextStep, 'next');
    setCurrentStep(nextStep);
  } else {
    console.warn('⚠️ 다음 스텝을 찾을 수 없습니다:', currentStep);
  }
};

/**
 * 이전 스텝으로 이동하는 함수
 */
export const moveToPrevStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
): void => {
  console.log('⬅️ 이전 스텝으로 이동 시도, 현재:', currentStep);

  // 현재 스텝 유효성 검사
  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
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
  if (prevStep !== null && isValidStepNumber(prevStep)) {
    console.log('✅ 이전 스텝으로 이동:', { from: currentStep, to: prevStep });
    logStepChange(prevStep, 'prev');
    setCurrentStep(prevStep);
  } else {
    console.warn('⚠️ 이전 스텝을 찾을 수 없습니다:', currentStep);
  }
};

/**
 * 특정 스텝으로 직접 이동하는 함수
 */
export const moveToStep = (
  targetStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
): void => {
  console.log('🎯 특정 스텝으로 이동 시도, 목표:', targetStep);

  // 목표 스텝 유효성 검사
  const isTargetStepValid = isValidStepNumber(targetStep);
  if (!isTargetStepValid) {
    console.error('❌ 유효하지 않은 목표 스텝:', targetStep);
    return;
  }

  // 스텝 범위 확인
  const minStep = getMinStep();
  const maxStep = getMaxStep();

  if (targetStep < minStep || targetStep > maxStep) {
    console.error('❌ 스텝 범위를 벗어났습니다:', {
      targetStep,
      validRange: `${minStep}-${maxStep}`,
    });
    return;
  }

  console.log('✅ 특정 스텝으로 이동:', targetStep);
  logStepChange(targetStep, 'direct');
  setCurrentStep(targetStep);
};

/**
 * 다음 스텝 번호를 반환하는 함수
 */
export const getNextStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  console.log('🔍 다음 스텝 번호 조회:', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return null;
  }

  const maxStep = getMaxStep();
  if (currentStep >= maxStep) {
    console.log('ℹ️ 마지막 스텝이므로 다음 스텝 없음');
    return null;
  }

  const nextStep = getNextStep(currentStep);
  console.log('🔍 다음 스텝 번호 결과:', nextStep);
  return nextStep;
};

/**
 * 이전 스텝 번호를 반환하는 함수
 */
export const getPrevStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  console.log('🔍 이전 스텝 번호 조회:', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return null;
  }

  const minStep = getMinStep();
  if (currentStep <= minStep) {
    console.log('ℹ️ 첫 번째 스텝이므로 이전 스텝 없음');
    return null;
  }

  const prevStep = getPreviousStep(currentStep);
  console.log('🔍 이전 스텝 번호 결과:', prevStep);
  return prevStep;
};

/**
 * 현재 스텝이 첫 번째 스텝인지 확인하는 함수
 */
export const isFirstStep = (currentStep: StepNumber): boolean => {
  console.log('🔍 첫 번째 스텝 여부 확인:', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return false;
  }

  const minStep = getMinStep();
  const isFirst = currentStep === minStep;

  console.log('🔍 첫 번째 스텝 여부 결과:', { currentStep, minStep, isFirst });
  return isFirst;
};

/**
 * 현재 스텝이 마지막 스텝인지 확인하는 함수
 */
export const isLastStep = (currentStep: StepNumber): boolean => {
  console.log('🔍 마지막 스텝 여부 확인:', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return false;
  }

  const maxStep = getMaxStep();
  const isLast = currentStep === maxStep;

  console.log('🔍 마지막 스텝 여부 결과:', { currentStep, maxStep, isLast });
  return isLast;
};

/**
 * 다음 스텝으로 이동 가능한지 확인하는 함수
 */
export const canMoveToNext = (currentStep: StepNumber): boolean => {
  console.log('🔍 다음 스텝 이동 가능 여부 확인:', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return false;
  }

  const maxStep = getMaxStep();
  const canMove = currentStep < maxStep;

  console.log('🔍 다음 스텝 이동 가능 여부 결과:', {
    currentStep,
    maxStep,
    canMove,
  });
  return canMove;
};

/**
 * 이전 스텝으로 이동 가능한지 확인하는 함수
 */
export const canMoveToPrev = (currentStep: StepNumber): boolean => {
  console.log('🔍 이전 스텝 이동 가능 여부 확인:', currentStep);

  const isCurrentStepValid = isValidStepNumber(currentStep);
  if (!isCurrentStepValid) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return false;
  }

  const minStep = getMinStep();
  const canMove = currentStep > minStep;

  console.log('🔍 이전 스텝 이동 가능 여부 결과:', {
    currentStep,
    minStep,
    canMove,
  });
  return canMove;
};

/**
 * 스텝 네비게이션의 전체 상태 정보를 반환하는 함수
 */
export const getStepNavigationState = (
  currentStep: StepNumber
): StepNavigationState => {
  console.log('📊 스텝 네비게이션 상태 조회:', currentStep);

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const nextStep = getNextStepNumber(currentStep);
  const prevStep = getPrevStepNumber(currentStep);

  const navigationState: StepNavigationState = {
    currentStep,
    minStep,
    maxStep,
    nextStep,
    prevStep,
    isFirst: isFirstStep(currentStep),
    isLast: isLastStep(currentStep),
    canGoNext: canMoveToNext(currentStep),
    canGoPrev: canMoveToPrev(currentStep),
    isValid: isValidStepNumber(currentStep),
  };

  console.log('📊 스텝 네비게이션 상태 결과:', navigationState);
  return navigationState;
};

/**
 * 스텝 범위 내의 모든 스텝에 대한 네비게이션 정보를 생성하는 함수
 */
export const generateAllStepNavigationStates = (): Map<
  StepNumber,
  StepNavigationState
> => {
  console.log('📊 모든 스텝의 네비게이션 상태 생성 시작');

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const stateMap = new Map<StepNumber, StepNavigationState>();

  for (let step = minStep; step <= maxStep; step++) {
    const isStepValid = isValidStepNumber(step);

    if (isStepValid) {
      const navigationState = getStepNavigationState(step);
      stateMap.set(step, navigationState);
    }
  }

  console.log(`📊 ${stateMap.size}개 스텝의 네비게이션 상태 생성 완료`);
  return stateMap;
};
