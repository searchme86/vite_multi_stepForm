// src/components/multiStepForm/utils/dynamicStepTypes.ts

/**
 * 💡 새로운 스텝 추가 시 수정 방법:
 * 1. stepConfig.json에서 stepConfiguration에 새 스텝 추가 (예: "5": {...})
 * 2. stepConfig.json에서 stepOrder 배열에 새 스텝 번호 추가 (예: [1, 2, 3, 4, 5])
 * 3. stepConfig.json에서 maxStep 값 업데이트 (예: 5)
 * 4. 이 파일에서 StepNumber 타입에 새 번호 추가 (예: 1 | 2 | 3 | 4 | 5)
 * 5. 이 파일에서 DYNAMIC_STEP_COMPONENTS에 새 컴포넌트 import 및 추가
 *
 * 💡 새로운 컴포넌트 추가/변경 시:
 * 1. stepConfig.json에서 해당 스텝의 component 이름 변경
 * 2. 이 파일에서 컴포넌트 import 추가/변경
 * 3. 이 파일에서 DYNAMIC_STEP_COMPONENTS 객체에 컴포넌트 추가/변경
 *
 * 💡 새로운 상태 추가 시:
 * - 스텝과 관련된 상태라면 위의 "새로운 스텝 추가" 방법 따름
 * - 폼 필드 상태라면 formFieldsConfig.json 수정 (이 파일은 수정 불필요)
 */

import stepConfig from '../config/stepConfig.json';
import React from 'react';

// 컴포넌트 매핑 import
import UserInfoStepContainer from '../steps/stepsSections/userInfoStep/UserInfoStepContainer';
import BlogBasicStepContainer from '../steps/stepsSections/blogBasicStep/BlogBasicStepContainer';
import ModularBlogEditorContainer from '../../moduleEditor/ModularBlogEditorContainer';
import BlogMediaStepContainer from '../steps/stepsSections/blogMediaStep/BlogMediaStepContainer';

interface StepComponentsMapping {
  readonly UserInfoStepContainer: typeof UserInfoStepContainer;
  readonly BlogBasicStepContainer: typeof BlogBasicStepContainer;
  readonly ModularBlogEditorContainer: typeof ModularBlogEditorContainer;
  readonly BlogMediaStepContainer: typeof BlogMediaStepContainer;
}

// 동적 컴포넌트 매핑 객체
const DYNAMIC_STEP_COMPONENTS: StepComponentsMapping = {
  UserInfoStepContainer,
  BlogBasicStepContainer,
  ModularBlogEditorContainer,
  BlogMediaStepContainer,
};

export type StepNumber = 1 | 2 | 3 | 4;

const validateStepNumber = (stepValue: unknown): stepValue is StepNumber => {
  const validStepNumbers = new Set([1, 2, 3, 4]);
  return typeof stepValue === 'number' && validStepNumbers.has(stepValue);
};

const safeGetStepNumber = (
  stepValue: unknown,
  fallbackValue: StepNumber
): StepNumber => {
  return validateStepNumber(stepValue) ? stepValue : fallbackValue;
};

export const getMinStep = (): StepNumber => {
  console.log('🔧 dynamicStepTypes: getMinStep 호출');

  const { minStep } = stepConfig;
  const safeMinStep = safeGetStepNumber(minStep, 1);

  console.log(`✅ dynamicStepTypes: minStep = ${safeMinStep}`);
  return safeMinStep;
};

export const getMaxStep = (): StepNumber => {
  console.log('🔧 dynamicStepTypes: getMaxStep 호출');

  const { maxStep } = stepConfig;
  const safeMaxStep = safeGetStepNumber(maxStep, 4);

  console.log(`✅ dynamicStepTypes: maxStep = ${safeMaxStep}`);
  return safeMaxStep;
};

// 🆕 추가: getTotalSteps 함수
export const getTotalSteps = (): number => {
  console.log('🔧 dynamicStepTypes: getTotalSteps 호출');

  const stepNumbers = getStepNumbers();
  const totalSteps = stepNumbers.length;

  console.log(`✅ dynamicStepTypes: 총 스텝 수 = ${totalSteps}`);
  return totalSteps;
};

// 🆕 추가: getNextStep 함수
export const getNextStep = (currentStep: StepNumber): StepNumber | null => {
  console.log(
    `🔧 dynamicStepTypes: getNextStep 호출 - 현재 스텝 ${currentStep}`
  );

  const stepNumbers = getStepNumbers();
  const stepNumbersSet = new Set(stepNumbers);

  if (!stepNumbersSet.has(currentStep)) {
    console.error(
      `❌ dynamicStepTypes: 현재 스텝이 유효하지 않음 - ${currentStep}`
    );
    return null;
  }

  const sortedSteps = [...stepNumbers].sort((stepA, stepB) => stepA - stepB);
  const currentIndex = sortedSteps.findIndex((step) => step === currentStep);

  if (currentIndex === -1) {
    console.error(
      `❌ dynamicStepTypes: 현재 스텝을 찾을 수 없음 - ${currentStep}`
    );
    return null;
  }

  const nextIndex = currentIndex + 1;

  if (nextIndex >= sortedSteps.length) {
    console.log('⚠️ dynamicStepTypes: 마지막 스텝이므로 다음 스텝 없음');
    return null;
  }

  const nextStep = sortedSteps[nextIndex];
  const isValidNext = validateStepNumber(nextStep);

  if (!isValidNext) {
    console.error(
      `❌ dynamicStepTypes: 다음 스텝이 유효하지 않음 - ${nextStep}`
    );
    return null;
  }

  console.log(`✅ dynamicStepTypes: 다음 스텝 = ${nextStep}`);
  return nextStep;
};

// 🆕 추가: getPreviousStep 함수
export const getPreviousStep = (currentStep: StepNumber): StepNumber | null => {
  console.log(
    `🔧 dynamicStepTypes: getPreviousStep 호출 - 현재 스텝 ${currentStep}`
  );

  const stepNumbers = getStepNumbers();
  const stepNumbersSet = new Set(stepNumbers);

  if (!stepNumbersSet.has(currentStep)) {
    console.error(
      `❌ dynamicStepTypes: 현재 스텝이 유효하지 않음 - ${currentStep}`
    );
    return null;
  }

  const sortedSteps = [...stepNumbers].sort((stepA, stepB) => stepA - stepB);
  const currentIndex = sortedSteps.findIndex((step) => step === currentStep);

  if (currentIndex === -1) {
    console.error(
      `❌ dynamicStepTypes: 현재 스텝을 찾을 수 없음 - ${currentStep}`
    );
    return null;
  }

  const previousIndex = currentIndex - 1;

  if (previousIndex < 0) {
    console.log('⚠️ dynamicStepTypes: 첫 번째 스텝이므로 이전 스텝 없음');
    return null;
  }

  const previousStep = sortedSteps[previousIndex];
  const isValidPrevious = validateStepNumber(previousStep);

  if (!isValidPrevious) {
    console.error(
      `❌ dynamicStepTypes: 이전 스텝이 유효하지 않음 - ${previousStep}`
    );
    return null;
  }

  console.log(`✅ dynamicStepTypes: 이전 스텝 = ${previousStep}`);
  return previousStep;
};

export const getStepNumbers = (): StepNumber[] => {
  console.log('🔧 dynamicStepTypes: getStepNumbers 호출');

  const { stepOrder } = stepConfig;

  if (!Array.isArray(stepOrder)) {
    console.error('❌ dynamicStepTypes: stepOrder가 배열이 아님');
    return [1, 2, 3, 4];
  }

  const validStepNumbers: StepNumber[] = [];

  for (const stepValue of stepOrder) {
    const isValidStep = validateStepNumber(stepValue);

    if (isValidStep) {
      validStepNumbers.push(stepValue);
    }
  }

  console.log(
    `✅ dynamicStepTypes: ${validStepNumbers.length}개 스텝 번호 반환`
  );
  return validStepNumbers;
};

export const getStepTitle = (targetStep: StepNumber): string => {
  console.log(`🔧 dynamicStepTypes: getStepTitle 호출 - 스텝 ${targetStep}`);

  const { stepConfiguration } = stepConfig;
  const stepConfigMap = new Map(Object.entries(stepConfiguration));
  const stepKey = targetStep.toString();
  const stepInfo = stepConfigMap.get(stepKey);

  const stepTitle = stepInfo?.title ? stepInfo.title : '';

  console.log(`✅ dynamicStepTypes: 스텝 ${targetStep} 제목: ${stepTitle}`);
  return stepTitle;
};

export const isValidStepNumber = (
  targetStep: number
): targetStep is StepNumber => {
  console.log(`🔧 dynamicStepTypes: isValidStepNumber 호출 - ${targetStep}`);

  const validStepNumbers = getStepNumbers();
  const isValid = validStepNumbers.some(
    (stepNumber) => stepNumber === targetStep
  );

  console.log(`✅ dynamicStepTypes: 스텝 ${targetStep} 유효성: ${isValid}`);
  return isValid;
};

export const isFirstStep = (targetStep: StepNumber): boolean => {
  console.log(`🔧 dynamicStepTypes: isFirstStep 호출 - 스텝 ${targetStep}`);

  const minStepNumber = getMinStep();
  const isFirst = targetStep === minStepNumber;

  console.log(
    `✅ dynamicStepTypes: 스텝 ${targetStep} 첫 번째 여부: ${isFirst}`
  );
  return isFirst;
};

export const isLastStep = (targetStep: StepNumber): boolean => {
  console.log(`🔧 dynamicStepTypes: isLastStep 호출 - 스텝 ${targetStep}`);

  const maxStepNumber = getMaxStep();
  const isLast = targetStep === maxStepNumber;

  console.log(`✅ dynamicStepTypes: 스텝 ${targetStep} 마지막 여부: ${isLast}`);
  return isLast;
};

// 🆕 추가: 동적 진행률 계산 함수
export const calculateProgressWidth = (targetStep: StepNumber): number => {
  console.log(
    `🔧 dynamicStepTypes: calculateProgressWidth 호출 - 스텝 ${targetStep}`
  );

  const isValid = isValidStepNumber(targetStep);

  if (!isValid) {
    console.error(`❌ dynamicStepTypes: 유효하지 않은 스텝 - ${targetStep}`);
    return 0;
  }

  const minStep = getMinStep();
  const maxStep = getMaxStep();
  const totalSteps = getTotalSteps();

  if (totalSteps <= 1) {
    console.log('✅ dynamicStepTypes: 스텝이 1개뿐이므로 100% 반환');
    return 100;
  }

  if (targetStep < minStep) {
    console.log('✅ dynamicStepTypes: 최소 스텝보다 작으므로 0% 반환');
    return 0;
  }

  if (targetStep > maxStep) {
    console.log('✅ dynamicStepTypes: 최대 스텝보다 크므로 100% 반환');
    return 100;
  }

  // 진행률 계산: (현재 스텝 - 최소 스텝) / (최대 스텝 - 최소 스텝) * 100
  const progressValue = ((targetStep - minStep) / (maxStep - minStep)) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progressValue));

  console.log(
    `✅ dynamicStepTypes: 스텝 ${targetStep} 진행률 = ${clampedProgress}%`
  );
  return clampedProgress;
};

export const renderStepComponent = (
  currentStep: StepNumber
): React.ReactNode => {
  console.log(
    `🎨 dynamicStepTypes: renderStepComponent 호출 - 스텝 ${currentStep}`
  );

  const isValidStep = isValidStepNumber(currentStep);

  if (!isValidStep) {
    console.error(
      `❌ dynamicStepTypes: 유효하지 않은 스텝 번호 - ${currentStep}`
    );
    const fallbackStep = getMinStep();
    return renderStepComponent(fallbackStep);
  }

  const { stepConfiguration } = stepConfig;
  const stepConfigMap = new Map(Object.entries(stepConfiguration));
  const stepKey = currentStep.toString();
  const stepInfo = stepConfigMap.get(stepKey);

  if (!stepInfo?.component) {
    console.error(
      `❌ dynamicStepTypes: 스텝 ${currentStep}의 컴포넌트 정보가 없음`
    );
    return React.createElement(
      'div',
      {
        className: 'p-4 border border-red-300 bg-red-50 rounded-lg',
        role: 'alert',
      },
      `스텝 ${currentStep}의 컴포넌트 정보를 찾을 수 없습니다.`
    );
  }

  const { component: componentName } = stepInfo;
  const componentMap = new Map(Object.entries(DYNAMIC_STEP_COMPONENTS));
  const SelectedComponent = componentMap.get(componentName);

  if (!SelectedComponent) {
    console.error(
      `❌ dynamicStepTypes: 컴포넌트를 찾을 수 없음 - ${componentName}`
    );
    return React.createElement(
      'div',
      {
        className: 'p-4 border border-red-300 bg-red-50 rounded-lg',
        role: 'alert',
      },
      `컴포넌트 "${componentName}"를 찾을 수 없습니다.`
    );
  }

  const accessibilityProps = {
    'aria-label': `스텝 ${currentStep} 컴포넌트`,
    role: 'main',
    'aria-live': 'polite',
  };

  console.log(
    `✅ dynamicStepTypes: 컴포넌트 렌더링 성공 - 스텝 ${currentStep}, 컴포넌트 ${componentName}`
  );

  return React.createElement(SelectedComponent, accessibilityProps);
};
