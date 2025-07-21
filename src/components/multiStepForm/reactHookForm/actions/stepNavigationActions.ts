// src/components/multiStepForm/reactHookForm/actions/stepNavigationActions.ts

import {
  StepNumber,
  getMaxStep,
  getMinStep,
  getNextStep,
  getPreviousStep,
  isValidStepNumber,
} from '../../types/stepTypes';
import { logStepChange } from '../../utils/debugUtils';

/**
 * 다음 스텝으로 이동하는 함수
 */
export const moveToNextStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log('➡️ 다음 스텝으로 이동 시도, 현재:', currentStep);

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
) => {
  console.log('⬅️ 이전 스텝으로 이동 시도, 현재:', currentStep);

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
) => {
  console.log('🎯 특정 스텝으로 이동 시도, 목표:', targetStep);

  // 목표 스텝 유효성 검사
  if (!isValidStepNumber(targetStep)) {
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
  if (!isValidStepNumber(currentStep)) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return null;
  }

  const maxStep = getMaxStep();
  if (currentStep >= maxStep) {
    return null;
  }

  return getNextStep(currentStep);
};

/**
 * 이전 스텝 번호를 반환하는 함수
 */
export const getPrevStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  if (!isValidStepNumber(currentStep)) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return null;
  }

  const minStep = getMinStep();
  if (currentStep <= minStep) {
    return null;
  }

  return getPreviousStep(currentStep);
};

/**
 * 현재 스텝이 첫 번째 스텝인지 확인하는 함수
 */
export const isFirstStep = (currentStep: StepNumber): boolean => {
  const minStep = getMinStep();
  return currentStep === minStep;
};

/**
 * 현재 스텝이 마지막 스텝인지 확인하는 함수
 */
export const isLastStep = (currentStep: StepNumber): boolean => {
  const maxStep = getMaxStep();
  return currentStep === maxStep;
};

/**
 * 다음 스텝으로 이동 가능한지 확인하는 함수
 */
export const canMoveToNext = (currentStep: StepNumber): boolean => {
  if (!isValidStepNumber(currentStep)) {
    return false;
  }

  const maxStep = getMaxStep();
  return currentStep < maxStep;
};

/**
 * 이전 스텝으로 이동 가능한지 확인하는 함수
 */
export const canMoveToPrev = (currentStep: StepNumber): boolean => {
  if (!isValidStepNumber(currentStep)) {
    return false;
  }

  const minStep = getMinStep();
  return currentStep > minStep;
};

/**
 * 스텝 네비게이션의 전체 상태 정보를 반환하는 함수
 */
export const getStepNavigationState = (currentStep: StepNumber) => {
  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const nextStep = getNextStepNumber(currentStep);
  const prevStep = getPrevStepNumber(currentStep);

  return {
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
};
