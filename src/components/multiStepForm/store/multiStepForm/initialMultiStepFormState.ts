// src/components/multiStepForm/store/multiStepForm/initialMultiStepFormState.ts

import { FormValues } from '../../types/formTypes';
import { StepNumber } from '../../types/stepTypes';

export interface MultiStepFormState {
  formValues: FormValues;
  currentStep: StepNumber;
  progressWidth: number;
  showPreview: boolean;
  editorCompletedContent: string;
  isEditorCompleted: boolean;
}

const INTERNAL_STEP_CONFIG = {
  1: {
    title: '유저 정보 입력',
    description: '기본 사용자 정보를 입력합니다',
    component: 'UserInfoStepContainer',
    validation: ['nickname', 'emailPrefix', 'emailDomain'] as const,
  },
  2: {
    title: '블로그 기본 정보',
    description: '블로그 제목과 설명을 입력합니다',
    component: 'BlogBasicStepContainer',
    validation: ['title', 'description'] as const,
  },
  3: {
    title: '블로그 컨텐츠',
    description: '블로그 내용을 작성합니다',
    component: 'BlogContentStep',
    validation: ['content'] as const,
  },
  4: {
    title: '모듈화 에디터',
    description: '고급 에디터로 내용을 편집합니다',
    component: 'ModularBlogEditorContainer',
    validation: ['editorCompleted'] as const,
  },
  5: {
    title: '블로그 미디어',
    description: '이미지와 미디어를 추가합니다',
    component: 'BlogMediaStep',
    validation: [] as const,
  },
} as const;

// 스텝 번호 유효성 검증 함수
const isValidStepNumberInternal = (step: number): step is StepNumber => {
  const validSteps = [1, 2, 3, 4, 5];
  return validSteps.includes(step);
};

// 스텝 번호 계산 함수
const calculateStepNumbers = (): StepNumber[] => {
  console.log('🔢 [STEP_CALC] calculateStepNumbers 호출됨');

  const stepNumbers: StepNumber[] = [];

  // Object.keys 사용하여 안전한 키 추출
  const configKeys = Object.keys(INTERNAL_STEP_CONFIG);

  for (const configKey of configKeys) {
    const numericKey = parseInt(configKey, 10);

    if (isValidStepNumberInternal(numericKey)) {
      stepNumbers.push(numericKey);
      console.log(`📝 [STEP_CALC] 스텝 번호 추가: ${numericKey}`);
    }
  }

  const sortedSteps = stepNumbers.sort(
    (firstStep, secondStep) => firstStep - secondStep
  );
  console.log('✅ [STEP_CALC] 계산된 스텝 번호들:', sortedSteps);

  return sortedSteps;
};

/**
 * 최소 스텝을 계산하는 함수
 * 수정사항: 타입단언 제거, 구체타입 사용
 */
const calculateMinStep = (): StepNumber => {
  console.log('🔍 [STEP_CALC] calculateMinStep 호출됨');

  const stepNumbers = calculateStepNumbers();

  if (stepNumbers.length === 0) {
    console.warn('⚠️ [STEP_CALC] 스텝 번호가 없음, 기본값 1 사용');

    // 타입단언 제거: INTERNAL_STEP_CONFIG에서 실제 존재하는 키를 사용
    const defaultStep = 1;

    // 안전성 검사: INTERNAL_STEP_CONFIG에 1이 실제로 존재하는지 확인
    if (isValidStepNumberInternal(defaultStep)) {
      return defaultStep;
    }

    // fallback: Object.keys를 사용하여 첫 번째 키 반환
    const configKeys = Object.keys(INTERNAL_STEP_CONFIG);
    const { 0: firstKey } = configKeys; // 구조분해할당으로 첫 번째 키 추출

    if (firstKey) {
      const firstStepNumber = parseInt(firstKey, 10);

      if (isValidStepNumberInternal(firstStepNumber)) {
        console.log(
          '📝 [STEP_CALC] fallback으로 첫 번째 config 키 사용:',
          firstStepNumber
        );
        return firstStepNumber;
      }
    }

    // 정말 마지막 fallback
    throw new Error('INTERNAL_STEP_CONFIG가 비어있거나 유효하지 않음');
  }

  const { 0: minStep } = stepNumbers; // 구조분해할당으로 첫 번째 요소 추출

  if (minStep === undefined) {
    throw new Error('stepNumbers 배열이 비어있음');
  }

  console.log('✅ [STEP_CALC] 계산된 최소 스텝:', minStep);
  return minStep;
};

/**
 * 최대 스텝을 계산하는 함수
 * 수정사항: 타입단언 제거, 구체타입 사용
 */
const calculateMaxStep = (): StepNumber => {
  console.log('🔍 [STEP_CALC] calculateMaxStep 호출됨');

  const stepNumbers = calculateStepNumbers();

  if (stepNumbers.length === 0) {
    console.warn('⚠️ [STEP_CALC] 스텝 번호가 없음, 기본값 5 사용');

    // 타입단언 제거: INTERNAL_STEP_CONFIG에서 실제 존재하는 키를 사용
    const defaultStep = 5;

    // 안전성 검사: INTERNAL_STEP_CONFIG에 5가 실제로 존재하는지 확인
    if (isValidStepNumberInternal(defaultStep)) {
      return defaultStep;
    }

    // fallback: Object.keys를 사용하여 마지막 키 반환
    const configKeys = Object.keys(INTERNAL_STEP_CONFIG);
    const { length: totalKeys } = configKeys;
    const lastKey = configKeys[totalKeys - 1];

    if (lastKey) {
      const lastStepNumber = parseInt(lastKey, 10);

      if (isValidStepNumberInternal(lastStepNumber)) {
        console.log(
          '📝 [STEP_CALC] fallback으로 마지막 config 키 사용:',
          lastStepNumber
        );
        return lastStepNumber;
      }
    }

    // 정말 마지막 fallback
    throw new Error('INTERNAL_STEP_CONFIG가 비어있거나 유효하지 않음');
  }

  const { length: totalSteps } = stepNumbers;
  const maxStep = stepNumbers[totalSteps - 1];

  if (maxStep === undefined) {
    throw new Error('stepNumbers 배열에서 마지막 요소를 찾을 수 없음');
  }

  console.log('✅ [STEP_CALC] 계산된 최대 스텝:', maxStep);
  return maxStep;
};

// 총 스텝 개수 계산
const calculateTotalSteps = (): number => {
  console.log('🔍 [STEP_CALC] calculateTotalSteps 호출됨');

  const stepNumbers = calculateStepNumbers();
  const { length: totalSteps } = stepNumbers; // 구조분해할당으로 length 추출

  console.log('✅ [STEP_CALC] 계산된 전체 스텝 수:', totalSteps);
  return totalSteps;
};

// 진행률 계산
const calculateProgressWidth = (currentStep: StepNumber): number => {
  console.log(
    '📊 [STEP_CALC] calculateProgressWidth 호출됨, 현재 스텝:',
    currentStep
  );

  const minStep = calculateMinStep();
  const totalSteps = calculateTotalSteps();

  if (totalSteps <= 1) {
    console.log('📊 [STEP_CALC] 스텝이 1개뿐, 진행률 100%');
    return 100;
  }

  const progress = ((currentStep - minStep) / (totalSteps - 1)) * 100;
  const safeProgress = Math.max(0, Math.min(100, progress));

  console.log(
    `📊 [STEP_CALC] 진행률 계산: 스텝 ${currentStep} → ${safeProgress.toFixed(
      1
    )}% (기준: min=${minStep}, total=${totalSteps})`
  );

  return safeProgress;
};

// 안전한 스텝 유효성 검증
const isSafeValidStepNumber = (step: number): step is StepNumber => {
  try {
    if (isValidStepNumberInternal(step)) {
      return true;
    }

    const minStep = calculateMinStep();
    const maxStep = calculateMaxStep();
    const isValid =
      step >= minStep && step <= maxStep && Number.isInteger(step);

    console.log(
      `🔍 [STEP_CALC] 스텝 유효성 검사: ${step} → ${isValid} (범위: ${minStep}-${maxStep})`
    );
    return isValid;
  } catch (error) {
    console.error('❌ [STEP_CALC] 스텝 유효성 검사 오류:', error);
    return false;
  }
};

// 초기 멀티스텝 폼 상태 생성
export const createInitialMultiStepFormState = (): MultiStepFormState => {
  console.log('🏗️ [STEP_CALC] createInitialMultiStepFormState 함수 호출됨');

  const minStep = calculateMinStep();
  console.log('📊 [STEP_CALC] 내부 config에서 직접 계산한 최소 스텝:', minStep);

  const initialProgress = calculateProgressWidth(minStep);

  const initialState: MultiStepFormState = {
    formValues: {
      userImage: '',
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: '',
      title: '',
      description: '',
      tags: '',
      content: '',
      media: [],
      mainImage: null,
      sliderImages: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    },
    currentStep: minStep,
    progressWidth: initialProgress,
    showPreview: false,
    editorCompletedContent: '',
    isEditorCompleted: false,
  };

  console.log('✅ [STEP_CALC] 초기 상태 객체 생성 완료:', initialState);
  return initialState;
};

// 스텝 계산 함수들 export
export const stepCalculations = {
  calculateStepNumbers,
  calculateMinStep,
  calculateMaxStep,
  calculateTotalSteps,
  calculateProgressWidth,
  isSafeValidStepNumber,
};

console.log('📄 [STEP_CALC] initialMultiStepFormState 모듈 로드 완료');
