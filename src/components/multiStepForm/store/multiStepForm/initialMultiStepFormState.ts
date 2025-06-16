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

const isValidStepNumberInternal = (step: number): step is StepNumber => {
  return step in INTERNAL_STEP_CONFIG;
};

const calculateStepNumbers = (): StepNumber[] => {
  console.log('🔢 calculateStepNumbers 호출됨');

  const stepNumbers: StepNumber[] = [];

  for (const key in INTERNAL_STEP_CONFIG) {
    const numKey = Number(key);
    if (isValidStepNumberInternal(numKey)) {
      stepNumbers.push(numKey);
      console.log(`📝 스텝 번호 추가: ${numKey}`);
    }
  }

  const sortedSteps = stepNumbers.sort((a, b) => a - b);
  console.log('✅ 계산된 스텝 번호들:', sortedSteps);

  return sortedSteps;
};

//====여기부터 수정됨====
/**
 * 최소 스텝을 계산하는 함수
 * 수정사항: 타입단언 제거, 구체타입 사용
 *
 * @returns 최소 스텝 번호
 */
const calculateMinStep = (): StepNumber => {
  console.log('🔍 calculateMinStep 호출됨');

  const stepNumbers = calculateStepNumbers();

  if (stepNumbers.length === 0) {
    console.warn('⚠️ 스텝 번호가 없음, 기본값 1 사용');

    // 타입단언 제거: INTERNAL_STEP_CONFIG에서 실제 존재하는 키를 사용
    // 이유: 1이 INTERNAL_STEP_CONFIG에 정의되어 있으므로 안전하게 StepNumber 타입 보장
    const defaultStep = 1;

    // 안전성 검사: INTERNAL_STEP_CONFIG에 1이 실제로 존재하는지 확인
    if (isValidStepNumberInternal(defaultStep)) {
      // TypeScript가 이제 defaultStep이 StepNumber임을 추론함
      return defaultStep;
    }

    // 최종 fallback: Object.keys를 사용하여 첫 번째 키 반환
    // 이유: INTERNAL_STEP_CONFIG에서 실제 존재하는 키를 가져와 안전성 보장
    const firstKey = Object.keys(INTERNAL_STEP_CONFIG)[0];
    const firstStepNumber = Number(firstKey);

    if (isValidStepNumberInternal(firstStepNumber)) {
      console.log('📝 fallback으로 첫 번째 config 키 사용:', firstStepNumber);
      return firstStepNumber;
    }

    // 정말 마지막 fallback (이론적으로 도달하지 않을 코드)
    throw new Error('INTERNAL_STEP_CONFIG가 비어있거나 유효하지 않음');
  }

  const minStep = stepNumbers[0];
  console.log('✅ 계산된 최소 스텝:', minStep);
  return minStep;
};

/**
 * 최대 스텝을 계산하는 함수
 * 수정사항: 타입단언 제거, 구체타입 사용
 *
 * @returns 최대 스텝 번호
 */
const calculateMaxStep = (): StepNumber => {
  console.log('🔍 calculateMaxStep 호출됨');

  const stepNumbers = calculateStepNumbers();

  if (stepNumbers.length === 0) {
    console.warn('⚠️ 스텝 번호가 없음, 기본값 5 사용');

    // 타입단언 제거: INTERNAL_STEP_CONFIG에서 실제 존재하는 키를 사용
    // 이유: 5가 INTERNAL_STEP_CONFIG에 정의되어 있으므로 안전하게 StepNumber 타입 보장
    const defaultStep = 5;

    // 안전성 검사: INTERNAL_STEP_CONFIG에 5가 실제로 존재하는지 확인
    if (isValidStepNumberInternal(defaultStep)) {
      // TypeScript가 이제 defaultStep이 StepNumber임을 추론함
      return defaultStep;
    }

    // 최종 fallback: Object.keys를 사용하여 마지막 키 반환
    // 이유: INTERNAL_STEP_CONFIG에서 실제 존재하는 키를 가져와 안전성 보장
    const configKeys = Object.keys(INTERNAL_STEP_CONFIG);
    const lastKey = configKeys[configKeys.length - 1];
    const lastStepNumber = Number(lastKey);

    if (isValidStepNumberInternal(lastStepNumber)) {
      console.log('📝 fallback으로 마지막 config 키 사용:', lastStepNumber);
      return lastStepNumber;
    }

    // 정말 마지막 fallback (이론적으로 도달하지 않을 코드)
    throw new Error('INTERNAL_STEP_CONFIG가 비어있거나 유효하지 않음');
  }

  const maxStep = stepNumbers[stepNumbers.length - 1];
  console.log('✅ 계산된 최대 스텝:', maxStep);
  return maxStep;
};
//====여기까지 수정됨====

const calculateTotalSteps = (): number => {
  console.log('🔍 calculateTotalSteps 호출됨');

  const stepNumbers = calculateStepNumbers();
  const totalSteps = stepNumbers.length;

  console.log('✅ 계산된 전체 스텝 수:', totalSteps);
  return totalSteps;
};

const calculateProgressWidth = (currentStep: StepNumber): number => {
  console.log('📊 calculateProgressWidth 호출됨, 현재 스텝:', currentStep);

  const minStep = calculateMinStep();
  const totalSteps = calculateTotalSteps();

  if (totalSteps <= 1) {
    console.log('📊 스텝이 1개뿐, 진행률 100%');
    return 100;
  }

  const progress = ((currentStep - minStep) / (totalSteps - 1)) * 100;
  const safeProgress = Math.max(0, Math.min(100, progress));

  console.log(
    `📊 진행률 계산: 스텝 ${currentStep} → ${safeProgress.toFixed(
      1
    )}% (기준: min=${minStep}, total=${totalSteps})`
  );

  return safeProgress;
};

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
      `🔍 스텝 유효성 검사: ${step} → ${isValid} (범위: ${minStep}-${maxStep})`
    );
    return isValid;
  } catch (error) {
    console.error('❌ 스텝 유효성 검사 오류:', error);
    return false;
  }
};

export const createInitialMultiStepFormState = (): MultiStepFormState => {
  console.log(
    '🏗️ createInitialMultiStepFormState 함수 호출됨 (자체 포함 버전)'
  );

  const minStep = calculateMinStep();
  console.log('📊 내부 config에서 직접 계산한 최소 스텝:', minStep);

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

  console.log('✅ 초기 상태 객체 생성 완료 (자체 포함 버전):', initialState);
  return initialState;
};

export const stepCalculations = {
  calculateStepNumbers,
  calculateMinStep,
  calculateMaxStep,
  calculateTotalSteps,
  calculateProgressWidth,
  isSafeValidStepNumber,
};
