//====여기부터 수정됨====
import {
  StepNumber,
  getMaxStep, // ✅ MAX_STEP 대신 함수 사용
  getMinStep, // ✅ MIN_STEP 대신 함수 사용
  getNextStep,
  getPreviousStep,
  isValidStepNumber, // ✅ 안전성을 위한 유효성 검사 함수 추가
} from '../../types/stepTypes';
//====여기까지 수정됨====
import { logStepChange } from '../../utils/debugUtils';

//====여기부터 수정됨====
/**
 * 다음 스텝으로 이동하는 함수
 * 이유: 안전한 스텝 이동을 위해 유효성 검사 추가
 *
 * @param currentStep 현재 스텝 번호
 * @param setCurrentStep 스텝 설정 함수
 */
//====여기까지 수정됨====
export const moveToNextStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log(
    '➡️ stepNavigationActions: 다음 스텝으로 이동 시도, 현재:',
    currentStep
  );

  //====여기부터 수정됨====
  // 현재 스텝 유효성 검사
  if (!isValidStepNumber(currentStep)) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return;
  }

  // 최대 스텝 확인 (런타임에 안전하게 계산)
  const maxStep = getMaxStep();
  if (currentStep >= maxStep) {
    console.warn('⚠️ 이미 마지막 스텝입니다:', { currentStep, maxStep });
    return;
  }
  //====여기까지 수정됨====

  const nextStep = getNextStep(currentStep);
  if (nextStep) {
    console.log('✅ 다음 스텝으로 이동:', { from: currentStep, to: nextStep });
    logStepChange(nextStep, 'next');
    setCurrentStep(nextStep);
  } else {
    console.warn('⚠️ 다음 스텝을 찾을 수 없습니다:', currentStep);
  }
};

//====여기부터 수정됨====
/**
 * 이전 스텝으로 이동하는 함수
 * 이유: 안전한 스텝 이동을 위해 유효성 검사 추가
 *
 * @param currentStep 현재 스텝 번호
 * @param setCurrentStep 스텝 설정 함수
 */
//====여기까지 수정됨====
export const moveToPrevStep = (
  currentStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log(
    '⬅️ stepNavigationActions: 이전 스텝으로 이동 시도, 현재:',
    currentStep
  );

  //====여기부터 수정됨====
  // 현재 스텝 유효성 검사
  if (!isValidStepNumber(currentStep)) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return;
  }

  // 최소 스텝 확인 (런타임에 안전하게 계산)
  const minStep = getMinStep();
  if (currentStep <= minStep) {
    console.warn('⚠️ 이미 첫 번째 스텝입니다:', { currentStep, minStep });
    return;
  }
  //====여기까지 수정됨====

  const prevStep = getPreviousStep(currentStep);
  if (prevStep) {
    console.log('✅ 이전 스텝으로 이동:', { from: currentStep, to: prevStep });
    logStepChange(prevStep, 'prev');
    setCurrentStep(prevStep);
  } else {
    console.warn('⚠️ 이전 스텝을 찾을 수 없습니다:', currentStep);
  }
};

//====여기부터 수정됨====
/**
 * 특정 스텝으로 직접 이동하는 함수
 * 이유: 목표 스텝의 유효성을 검사하여 안전한 이동 보장
 *
 * @param targetStep 목표 스텝 번호
 * @param setCurrentStep 스텝 설정 함수
 */
//====여기까지 수정됨====
export const moveToStep = (
  targetStep: StepNumber,
  setCurrentStep: (step: StepNumber) => void
) => {
  console.log(
    '🎯 stepNavigationActions: 특정 스텝으로 이동 시도, 목표:',
    targetStep
  );

  //====여기부터 수정됨====
  // 목표 스텝 유효성 검사
  if (!isValidStepNumber(targetStep)) {
    console.error('❌ 유효하지 않은 목표 스텝:', targetStep);
    return;
  }

  // 스텝 범위 확인 (런타임에 안전하게 계산)
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
  //====여기까지 수정됨====

  logStepChange(targetStep, 'direct');
  setCurrentStep(targetStep);
};

//====여기부터 수정됨====
/**
 * 다음 스텝 번호를 반환하는 함수
 * 이유: 안전한 스텝 번호 조회를 위해 유효성 검사 추가
 *
 * @param currentStep 현재 스텝 번호
 * @returns 다음 스텝 번호 또는 null
 */
//====여기까지 수정됨====
export const getNextStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  console.log('🔍 getNextStepNumber 호출됨:', currentStep);

  //====여기부터 수정됨====
  // 현재 스텝 유효성 검사
  if (!isValidStepNumber(currentStep)) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return null;
  }

  // 최대 스텝 확인
  const maxStep = getMaxStep();
  if (currentStep >= maxStep) {
    console.log('📄 이미 마지막 스텝이므로 다음 스텝 없음:', {
      currentStep,
      maxStep,
    });
    return null;
  }
  //====여기까지 수정됨====

  const nextStep = getNextStep(currentStep);
  console.log('🔍 다음 스텝 번호:', { currentStep, nextStep });
  return nextStep;
};

//====여기부터 수정됨====
/**
 * 이전 스텝 번호를 반환하는 함수
 * 이유: 안전한 스텝 번호 조회를 위해 유효성 검사 추가
 *
 * @param currentStep 현재 스텝 번호
 * @returns 이전 스텝 번호 또는 null
 */
//====여기까지 수정됨====
export const getPrevStepNumber = (
  currentStep: StepNumber
): StepNumber | null => {
  console.log('🔍 getPrevStepNumber 호출됨:', currentStep);

  //====여기부터 수정됨====
  // 현재 스텝 유효성 검사
  if (!isValidStepNumber(currentStep)) {
    console.error('❌ 유효하지 않은 현재 스텝:', currentStep);
    return null;
  }

  // 최소 스텝 확인
  const minStep = getMinStep();
  if (currentStep <= minStep) {
    console.log('📄 이미 첫 번째 스텝이므로 이전 스텝 없음:', {
      currentStep,
      minStep,
    });
    return null;
  }
  //====여기까지 수정됨====

  const prevStep = getPreviousStep(currentStep);
  console.log('🔍 이전 스텝 번호:', { currentStep, prevStep });
  return prevStep;
};

//====여기부터 추가됨====
/**
 * 현재 스텝이 첫 번째 스텝인지 확인하는 함수
 * 이유: UI에서 이전 버튼 활성화 여부 결정에 유용
 *
 * @param currentStep 현재 스텝 번호
 * @returns 첫 번째 스텝 여부
 */
export const isFirstStep = (currentStep: StepNumber): boolean => {
  const minStep = getMinStep();
  const result = currentStep === minStep;
  console.log('🥇 첫 번째 스텝 확인:', {
    currentStep,
    minStep,
    isFirst: result,
  });
  return result;
};

/**
 * 현재 스텝이 마지막 스텝인지 확인하는 함수
 * 이유: UI에서 다음 버튼 활성화 여부 결정에 유용
 *
 * @param currentStep 현재 스텝 번호
 * @returns 마지막 스텝 여부
 */
export const isLastStep = (currentStep: StepNumber): boolean => {
  const maxStep = getMaxStep();
  const result = currentStep === maxStep;
  console.log('🏁 마지막 스텝 확인:', { currentStep, maxStep, isLast: result });
  return result;
};

/**
 * 다음 스텝으로 이동 가능한지 확인하는 함수
 * 이유: UI 상태 관리와 사용자 경험 개선
 *
 * @param currentStep 현재 스텝 번호
 * @returns 다음 스텝 이동 가능 여부
 */
export const canMoveToNext = (currentStep: StepNumber): boolean => {
  if (!isValidStepNumber(currentStep)) {
    return false;
  }

  const maxStep = getMaxStep();
  const canMove = currentStep < maxStep;
  console.log('➡️ 다음 스텝 이동 가능 여부:', {
    currentStep,
    maxStep,
    canMove,
  });
  return canMove;
};

/**
 * 이전 스텝으로 이동 가능한지 확인하는 함수
 * 이유: UI 상태 관리와 사용자 경험 개선
 *
 * @param currentStep 현재 스텝 번호
 * @returns 이전 스텝 이동 가능 여부
 */
export const canMoveToPrev = (currentStep: StepNumber): boolean => {
  if (!isValidStepNumber(currentStep)) {
    return false;
  }

  const minStep = getMinStep();
  const canMove = currentStep > minStep;
  console.log('⬅️ 이전 스텝 이동 가능 여부:', {
    currentStep,
    minStep,
    canMove,
  });
  return canMove;
};

/**
 * 스텝 네비게이션의 전체 상태 정보를 반환하는 함수
 * 이유: UI 컴포넌트에서 한 번에 모든 상태 정보 확인 가능
 *
 * @param currentStep 현재 스텝 번호
 * @returns 스텝 네비게이션 상태 객체
 */
export const getStepNavigationState = (currentStep: StepNumber) => {
  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const nextStep = getNextStepNumber(currentStep);
  const prevStep = getPrevStepNumber(currentStep);

  const state = {
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

  console.log('📊 스텝 네비게이션 상태:', state);
  return state;
};
//====여기까지 추가됨====
