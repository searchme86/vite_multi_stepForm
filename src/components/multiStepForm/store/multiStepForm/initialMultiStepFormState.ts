// src/components/multiStepForm/store/multiStepForm/initialMultiStepFormState.ts

import { FormValues } from '../../types/formTypes';
import {
  StepNumber,
  getMinStep,
  getMaxStep,
  getTotalSteps,
  calculateProgressWidth,
  isValidStepNumber,
} from '../../utils/dynamicStepTypes';
import { getDefaultFormSchemaValues } from '../../utils/formFieldsLoader';

export interface MultiStepFormState {
  readonly formValues: FormValues;
  readonly currentStep: StepNumber;
  readonly progressWidth: number;
  readonly showPreview: boolean;
  readonly editorCompletedContent: string;
  readonly isEditorCompleted: boolean;
}

// 🆕 동적 스텝 설정 검증
const validateDynamicStepConfig = (): boolean => {
  console.log('🔍 [INITIAL_STATE] 동적 스텝 설정 검증 시작');

  try {
    const minStep = getMinStep();
    const maxStep = getMaxStep();
    const totalSteps = getTotalSteps();

    const isValidMinStep = isValidStepNumber(minStep);
    const isValidMaxStep = isValidStepNumber(maxStep);
    const isValidTotalSteps = totalSteps > 0;
    const isValidRange = minStep <= maxStep;

    const allValidationsPassed =
      isValidMinStep && isValidMaxStep && isValidTotalSteps && isValidRange;

    console.log(
      `${
        allValidationsPassed ? '✅' : '❌'
      } [INITIAL_STATE] 동적 스텝 설정 검증 완료:`,
      {
        minStep,
        maxStep,
        totalSteps,
        isValidMinStep,
        isValidMaxStep,
        isValidTotalSteps,
        isValidRange,
        timestamp: new Date().toISOString(),
      }
    );

    return allValidationsPassed;
  } catch (validationError) {
    console.error('❌ [INITIAL_STATE] 스텝 설정 검증 오류:', validationError);
    return false;
  }
};

// 🆕 동적 스텝 진행률 계산
const calculateDynamicProgressWidth = (currentStep: StepNumber): number => {
  console.log('📊 [INITIAL_STATE] 동적 진행률 계산 시작:', currentStep);

  const isValidStep = isValidStepNumber(currentStep);
  if (!isValidStep) {
    console.warn(
      '⚠️ [INITIAL_STATE] 유효하지 않은 스텝, 0% 반환:',
      currentStep
    );
    return 0;
  }

  try {
    const progressWidth = calculateProgressWidth(currentStep);

    const isValidProgress =
      typeof progressWidth === 'number' &&
      progressWidth >= 0 &&
      progressWidth <= 100;

    if (isValidProgress) {
      console.log('✅ [INITIAL_STATE] 동적 진행률 계산 완료:', {
        currentStep,
        progressWidth,
        timestamp: new Date().toISOString(),
      });
      return progressWidth;
    } else {
      console.error('❌ [INITIAL_STATE] 유효하지 않은 진행률:', progressWidth);
      return 0;
    }
  } catch (progressError) {
    console.error('❌ [INITIAL_STATE] 진행률 계산 오류:', progressError);
    return 0;
  }
};

// 🆕 동적 FormValues 생성 함수
const createDynamicInitialFormValues = (): FormValues => {
  console.log('🔧 [INITIAL_STATE] 동적 FormValues 생성 시작');

  try {
    const dynamicFormValues = getDefaultFormSchemaValues();

    console.log('✅ [INITIAL_STATE] 동적 FormValues 생성 완료:', {
      fieldCount: Object.keys(dynamicFormValues).length,
      fieldNames: Object.keys(dynamicFormValues),
      timestamp: new Date().toISOString(),
    });

    return dynamicFormValues;
  } catch (formValuesError) {
    console.error(
      '❌ [INITIAL_STATE] 동적 FormValues 생성 실패:',
      formValuesError
    );

    // Fallback: 기본값 반환
    return {
      userImage: '',
      nickname: '',
      emailPrefix: '',
      emailDomain: '',
      bio: '',
      title: '',
      description: '',
      media: [],
      mainImage: null,
      sliderImages: [],
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }
};

// 🆕 동적 초기 상태 생성
export const createInitialMultiStepFormState = (): MultiStepFormState => {
  console.log('🚀 [INITIAL_STATE] 동적 초기 상태 생성 시작');

  try {
    // 동적 스텝 설정 검증
    const isConfigValid = validateDynamicStepConfig();
    if (!isConfigValid) {
      throw new Error('동적 스텝 설정이 유효하지 않음');
    }

    const minStep = getMinStep();
    const totalSteps = getTotalSteps();
    const progressWidth = calculateDynamicProgressWidth(minStep);
    const formValues = createDynamicInitialFormValues();

    const initialState: MultiStepFormState = {
      formValues,
      currentStep: minStep,
      progressWidth,
      showPreview: false,
      editorCompletedContent: '',
      isEditorCompleted: false,
    };

    console.log('✅ [INITIAL_STATE] 동적 초기 상태 생성 완료:', {
      currentStep: minStep,
      totalSteps,
      progressWidth,
      fieldCount: Object.keys(formValues).length,
      timestamp: new Date().toISOString(),
    });

    return initialState;
  } catch (initError) {
    console.error('❌ [INITIAL_STATE] 동적 초기 상태 생성 실패:', initError);

    // Fallback 상태
    const fallbackFormValues = createDynamicInitialFormValues();

    return {
      formValues: fallbackFormValues,
      currentStep: 1,
      progressWidth: 0,
      showPreview: false,
      editorCompletedContent: '',
      isEditorCompleted: false,
    };
  }
};

// 🆕 동적 스텝 계산 시스템 (stepCalculations 교체)
export const dynamicStepCalculations = {
  // 동적 스텝 번호 계산
  calculateStepNumbers: (): StepNumber[] => {
    console.log('🔧 [STEP_CALC] 동적 스텝 번호 계산');

    try {
      const minStep = getMinStep();
      const maxStep = getMaxStep();
      const stepNumbers: StepNumber[] = [];

      for (let step = minStep; step <= maxStep; step++) {
        const isValidStep = isValidStepNumber(step);
        if (isValidStep) {
          stepNumbers.push(step);
        }
      }

      console.log('✅ [STEP_CALC] 동적 스텝 번호 계산 완료:', stepNumbers);
      return stepNumbers;
    } catch (stepCalcError) {
      console.error('❌ [STEP_CALC] 스텝 번호 계산 실패:', stepCalcError);
      return [1, 2, 3, 4];
    }
  },

  // 최소 스텝 계산
  calculateMinStep: (): StepNumber => {
    console.log('🔧 [STEP_CALC] 최소 스텝 계산');

    try {
      const minStep = getMinStep();
      console.log('✅ [STEP_CALC] 최소 스텝 계산 완료:', minStep);
      return minStep;
    } catch (minStepError) {
      console.error('❌ [STEP_CALC] 최소 스텝 계산 실패:', minStepError);
      return 1;
    }
  },

  // 최대 스텝 계산
  calculateMaxStep: (): StepNumber => {
    console.log('🔧 [STEP_CALC] 최대 스텝 계산');

    try {
      const maxStep = getMaxStep();
      console.log('✅ [STEP_CALC] 최대 스텝 계산 완료:', maxStep);
      return maxStep;
    } catch (maxStepError) {
      console.error('❌ [STEP_CALC] 최대 스텝 계산 실패:', maxStepError);
      return 4;
    }
  },

  // 총 스텝 수 계산
  calculateTotalSteps: (): number => {
    console.log('🔧 [STEP_CALC] 총 스텝 수 계산');

    try {
      const totalSteps = getTotalSteps();
      console.log('✅ [STEP_CALC] 총 스텝 수 계산 완료:', totalSteps);
      return totalSteps;
    } catch (totalStepsError) {
      console.error('❌ [STEP_CALC] 총 스텝 수 계산 실패:', totalStepsError);
      return 4;
    }
  },

  // 진행률 계산
  calculateProgressWidth: (currentStep: StepNumber): number => {
    console.log('📊 [STEP_CALC] 진행률 계산:', currentStep);
    return calculateDynamicProgressWidth(currentStep);
  },

  // 스텝 유효성 검사
  isSafeValidStepNumber: (step: number): step is StepNumber => {
    console.log('🔍 [STEP_CALC] 스텝 유효성 검사:', step);

    const isValid = isValidStepNumber(step);
    console.log(
      `${isValid ? '✅' : '❌'} [STEP_CALC] 스텝 유효성 검사 결과: ${isValid}`
    );
    return isValid;
  },

  // 타입 안전 스텝 유효성 검사
  isValidStepNumberSafe: (step: unknown): step is StepNumber => {
    console.log('🔍 [STEP_CALC] 타입 안전 스텝 검사:', step);

    const isNumberType = typeof step === 'number';
    if (!isNumberType) {
      console.log('❌ [STEP_CALC] 숫자 타입이 아님:', typeof step);
      return false;
    }

    const isValid = isValidStepNumber(step);
    console.log(
      `${
        isValid ? '✅' : '❌'
      } [STEP_CALC] 타입 안전 스텝 검사 결과: ${isValid}`
    );
    return isValid;
  },

  // 안전한 상태 생성
  createSafeState: (): MultiStepFormState => {
    console.log('🛡️ [STEP_CALC] 안전한 상태 생성');
    return createInitialMultiStepFormState();
  },

  // 설정 검증
  validateConfig: (): boolean => {
    console.log('🔍 [STEP_CALC] 설정 검증');
    return validateDynamicStepConfig();
  },
};

// 🆕 하위 호환성을 위한 stepCalculations export (기존 코드 호환성)
export const stepCalculations = dynamicStepCalculations;

console.log(
  '📄 [INITIAL_STATE] ✅ 사용하지 않는 변수 제거 완료된 initialMultiStepFormState 모듈 로드 완료'
);
console.log('🎯 [INITIAL_STATE] 주요 수정사항:', {
  unusedFunctionsRemoved: '사용하지 않는 함수 완전 제거',
  cleanCodeStructure: '깔끔한 코드 구조 유지',
  noUnusedVariables: '사용하지 않는 변수 0개',
  maintainedFunctionality: '기존 기능 완전 유지',
});
