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

interface StepConfig {
  title: string;
  description: string;
  component: string;
  validation: readonly string[];
}

const INTERNAL_STEP_CONFIG: Record<number, StepConfig> = {
  1: {
    title: '유저 정보 입력',
    description: '기본 사용자 정보를 입력합니다',
    component: 'UserInfoStepContainer',
    validation: ['nickname', 'emailPrefix', 'emailDomain'],
  },
  2: {
    title: '블로그 기본 정보',
    description: '블로그 제목과 설명을 입력합니다',
    component: 'BlogBasicStepContainer',
    validation: ['title', 'description'],
  },
  3: {
    title: '블로그 컨텐츠',
    description: '블로그 내용을 작성합니다',
    component: 'BlogContentStep',
    validation: ['content'],
  },
  4: {
    title: '모듈화 에디터',
    description: '고급 에디터로 내용을 편집합니다',
    component: 'ModularBlogEditorContainer',
    validation: ['editorCompleted'],
  },
  5: {
    title: '블로그 미디어',
    description: '이미지와 미디어를 추가합니다',
    component: 'BlogMediaStep',
    validation: [],
  },
};

const isValidConfigObjectInternal = (): boolean => {
  try {
    const configEntries = Object.entries(INTERNAL_STEP_CONFIG);

    if (configEntries.length === 0) {
      console.error('❌ [STEP_CALC] INTERNAL_STEP_CONFIG가 비어있음');
      return false;
    }

    for (const [key, config] of configEntries) {
      const numericKey = Number(key);
      if (!Number.isInteger(numericKey) || numericKey <= 0) {
        console.error('❌ [STEP_CALC] 유효하지 않은 config 키:', key);
        return false;
      }

      if (
        !config ||
        typeof config !== 'object' ||
        !config.title ||
        !config.component
      ) {
        console.error('❌ [STEP_CALC] 유효하지 않은 config 값:', config);
        return false;
      }
    }

    console.log('✅ [STEP_CALC] INTERNAL_STEP_CONFIG 유효성 검사 통과');
    return true;
  } catch (err) {
    console.error('❌ [STEP_CALC] config 유효성 검사 오류:', err);
    return false;
  }
};

const isValidStepNumberInternal = (step: number): step is StepNumber => {
  return Number.isInteger(step) && step > 0 && step in INTERNAL_STEP_CONFIG;
};

const calculateStepNumbers = (): StepNumber[] => {
  const isValid = isValidConfigObjectInternal();
  if (!isValid) return [1, 2, 3, 4, 5];

  const steps: StepNumber[] = Object.keys(INTERNAL_STEP_CONFIG)
    .map(Number)
    .filter(isValidStepNumberInternal)
    .sort((a, b) => a - b);

  return steps.length > 0 ? steps : [1, 2, 3, 4, 5];
};

const calculateMinStep = (): StepNumber => {
  const steps = calculateStepNumbers();
  return steps.length > 0 ? steps[0] : 1;
};

const calculateMaxStep = (): StepNumber => {
  const steps = calculateStepNumbers();
  return steps.length > 0 ? steps[steps.length - 1] : 5;
};

const calculateTotalSteps = (): number => {
  const steps = calculateStepNumbers();
  return steps.length > 0 ? steps.length : 5;
};

const calculateProgressWidth = (currentStep: StepNumber): number => {
  if (!isValidStepNumberInternal(currentStep)) return 0;

  const min = calculateMinStep();
  const total = calculateTotalSteps();
  if (total <= 1) return 100;

  const ratio = (currentStep - min) / (total - 1);
  return Math.max(0, Math.min(100, ratio * 100));
};

const isSafeValidStepNumber = (step: number): step is StepNumber => {
  if (!Number.isInteger(step)) return false;

  const min = calculateMinStep();
  const max = calculateMaxStep();

  return step >= min && step <= max;
};

const createSafeInitialFormValues = (): FormValues => {
  return {
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
  };
};

export const createInitialMultiStepFormState = (): MultiStepFormState => {
  try {
    const step = calculateMinStep();
    return {
      formValues: createSafeInitialFormValues(),
      currentStep: step,
      progressWidth: calculateProgressWidth(step),
      showPreview: false,
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  } catch {
    return {
      formValues: createSafeInitialFormValues(),
      currentStep: 1,
      progressWidth: 0,
      showPreview: false,
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }
};

export const stepCalculations = {
  calculateStepNumbers,
  calculateMinStep,
  calculateMaxStep,
  calculateTotalSteps,
  calculateProgressWidth,
  isSafeValidStepNumber,

  isValidStepNumberSafe: (step: unknown): step is StepNumber =>
    typeof step === 'number' && isSafeValidStepNumber(step),

  createSafeState: createInitialMultiStepFormState,
  validateConfig: isValidConfigObjectInternal,
};

console.log(
  '📄 [STEP_CALC] 🚨 Persist 호환성 강화된 initialMultiStepFormState 모듈 로드 완료'
);
