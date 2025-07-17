// src/components/multiStepForm/types/stepTypes.ts
// 멀티스텝 폼의 스텝 관리를 위한 타입 정의 및 유틸리티 함수들
// 각 스텝의 컴포넌트, 설정, 네비게이션 기능을 제공

import React from 'react';
// 각 스텝별 컴포넌트들을 import - 실제 렌더링될 컴포넌트들
import UserInfoStepContainer from '../steps/stepsSections/userInfoStep/UserInfoStepContainer';
import BlogBasicStepContainer from '../steps/stepsSections/blogBasicStep/BlogBasicStepContainer';
import BlogContentStep from '../steps/blog-content-step';
import ModularBlogEditorContainer from '../../moduleEditor/ModularBlogEditorContainer';
import BlogMediaStepContainer from '../steps/stepsSections/blogMediaStep/BlogMediaStepContainer';

/**
 * 스텝별 컴포넌트들을 매핑하는 객체
 * 목적: 스텝 번호에 따라 동적으로 컴포넌트를 렌더링하기 위함
 */
export const STEP_COMPONENTS = {
  UserInfoStepContainer, // 1단계: 사용자 정보 입력 컴포넌트
  BlogBasicStepContainer, // 2단계: 블로그 기본 정보 입력 컴포넌트
  ModularBlogEditorContainer, // 4단계: 고급 에디터 컴포넌트
  BlogMediaStepContainer, // 5단계: 미디어 업로드 컴포넌트
  BlogContentStep, // 3단계: 블로그 콘텐츠 작성 컴포넌트
} as const;

/**
 * 스텝 컴포넌트 이름의 타입
 * keyof typeof를 사용하여 STEP_COMPONENTS의 키들을 타입으로 추출
 */
export type StepComponentName = keyof typeof STEP_COMPONENTS;

/**
 * 스텝 설정 객체를 생성하는 제네릭 헬퍼 함수
 * 목적: 타입 안전성을 보장하면서 스텝 설정 객체를 생성
 */
const createStepConfig = <
  T extends Record<
    number,
    {
      title: string; // 스텝의 제목
      description: string; // 스텝의 설명
      component: StepComponentName; // 렌더링할 컴포넌트 이름
      validation: readonly string[]; // 유효성 검사할 필드들
    }
  >
>(
  stepConfigurationData: T // 매개변수명을 구체적으로 명시: 스텝 설정 데이터
): T => stepConfigurationData; // 타입 체크 후 그대로 반환

/**
 * 전체 스텝들의 설정 정보
 * 목적: 각 스텝별 메타데이터 (제목, 설명, 컴포넌트, 유효성 검사 필드) 정의
 */
export const STEP_CONFIG = createStepConfig({
  1: {
    title: '유저 정보 입력', // 1단계 제목
    description: '기본 사용자 정보를 입력합니다', // 1단계 설명
    component: 'UserInfoStepContainer', // 렌더링할 컴포넌트 이름
    validation: ['nickname', 'emailPrefix', 'emailDomain'] as const, // 유효성 검사 대상 필드들
  },
  2: {
    title: '블로그 기본 정보', // 2단계 제목
    description: '블로그 제목과 설명을 입력합니다', // 2단계 설명
    component: 'BlogBasicStepContainer', // 렌더링할 컴포넌트 이름
    validation: ['title', 'description'] as const, // 블로그 제목과 설명 필드 검사
  },
  3: {
    title: '블로그 컨텐츠', // 3단계 제목
    description: '블로그 내용을 작성합니다', // 3단계 설명
    component: 'BlogContentStep', // 렌더링할 컴포넌트 이름
    validation: ['content'] as const, // 블로그 내용 필드 검사
  },
  4: {
    title: '모듈화 에디터', // 4단계 제목
    description: '고급 에디터로 내용을 편집합니다', // 4단계 설명
    component: 'ModularBlogEditorContainer', // 렌더링할 컴포넌트 이름
    validation: ['editorCompleted'] as const, // 에디터 완료 상태 검사
  },
  5: {
    title: '블로그 미디어', // 5단계 제목
    description: '이미지와 미디어를 추가합니다', // 5단계 설명
    component: 'BlogMediaStepContainer', // 렌더링할 컴포넌트 이름
    validation: [] as const, // 선택 사항이므로 유효성 검사 없음
  },
});

/**
 * 스텝 번호 타입 - STEP_CONFIG의 키들을 타입으로 추출
 */
export type StepNumber = keyof typeof STEP_CONFIG;

/**
 * 스텝 설정 전체의 타입
 */
export type StepConfig = typeof STEP_CONFIG;

/**
 * 개별 스텝 정보의 타입
 */
export type StepInfo = StepConfig[StepNumber];

/**
 * 주어진 숫자가 유효한 스텝 번호인지 확인하는 타입 가드 함수
 * 목적: 런타임에 스텝 번호의 유효성을 검사하고 타입을 좁힘
 */
export const isValidStepNumber = (
  targetStepNumber: number
): targetStepNumber is StepNumber => {
  // in 연산자를 사용하여 STEP_CONFIG에 해당 키가 존재하는지 확인
  return targetStepNumber in STEP_CONFIG;
};

/**
 * 스텝 컴포넌트 이름으로 실제 컴포넌트를 가져오는 함수
 * 목적: 컴포넌트 이름 문자열을 실제 React 컴포넌트로 변환
 */
export const getStepComponent = (
  stepComponentName: StepComponentName
): React.ComponentType<Record<string, unknown>> => {
  // 구조분해할당을 사용하여 STEP_COMPONENTS에서 해당 컴포넌트 추출
  const { [stepComponentName]: selectedComponent } = STEP_COMPONENTS;
  return selectedComponent;
};

/**
 * 스텝 번호에 해당하는 컴포넌트를 렌더링하는 함수
 * 목적: 현재 스텝에 맞는 컴포넌트를 접근성 속성과 함께 렌더링
 * 에러 수정: STEP_CONFIG[currentStepNumber] undefined 방지
 */
export const renderStepComponent = (
  currentStepNumber: StepNumber
): React.ReactNode => {
  console.log('🎨 [STEP_TYPES] 스텝 컴포넌트 렌더링 시작:', {
    currentStepNumber,
    timestamp: new Date().toISOString(),
  });

  // 🔍 스텝 번호 유효성 검증 추가
  if (!isValidStepNumber(currentStepNumber)) {
    console.error('❌ [STEP_TYPES] 유효하지 않은 스텝 번호:', {
      currentStepNumber,
      validSteps: Object.keys(STEP_CONFIG),
      timestamp: new Date().toISOString(),
    });

    // fallback으로 첫 번째 스텝 사용
    const fallbackStepNumber = getMinStep();
    console.warn('⚠️ [STEP_TYPES] fallback으로 스텝 사용:', fallbackStepNumber);
    return renderStepComponent(fallbackStepNumber);
  }

  // 🔍 STEP_CONFIG에서 스텝 정보 안전하게 가져오기
  const stepConfigData = STEP_CONFIG[currentStepNumber];

  if (!stepConfigData) {
    console.error('❌ [STEP_TYPES] 스텝 설정 데이터를 찾을 수 없음:', {
      currentStepNumber,
      availableSteps: Object.keys(STEP_CONFIG),
      timestamp: new Date().toISOString(),
    });

    // fallback 컴포넌트 반환
    return React.createElement(
      'div',
      {
        className: 'p-4 border border-red-300 bg-red-50 rounded-lg',
      },
      [
        React.createElement(
          'h3',
          {
            key: 'title',
            className: 'text-red-700 font-semibold',
          },
          '스텝 로드 실패'
        ),
        React.createElement(
          'p',
          {
            key: 'description',
            className: 'text-red-600 text-sm mt-2',
          },
          `스텝 ${currentStepNumber}의 설정 데이터를 찾을 수 없습니다.`
        ),
      ]
    );
  }

  // STEP_CONFIG에서 현재 스텝의 컴포넌트 이름 추출
  const { component: componentName } = stepConfigData;

  console.log('🔍 [STEP_TYPES] 스텝 정보 확인:', {
    stepNumber: currentStepNumber,
    componentName,
    timestamp: new Date().toISOString(),
  });

  // 🔍 컴포넌트 이름 유효성 검증
  if (!(componentName in STEP_COMPONENTS)) {
    console.error('❌ [STEP_TYPES] 컴포넌트를 찾을 수 없음:', {
      componentName,
      availableComponents: Object.keys(STEP_COMPONENTS),
      timestamp: new Date().toISOString(),
    });

    // fallback 컴포넌트 반환
    return React.createElement(
      'div',
      {
        className: 'p-4 border border-red-300 bg-red-50 rounded-lg',
      },
      [
        React.createElement(
          'h3',
          {
            key: 'title',
            className: 'text-red-700 font-semibold',
          },
          '컴포넌트 로드 실패'
        ),
        React.createElement(
          'p',
          {
            key: 'description',
            className: 'text-red-600 text-sm mt-2',
          },
          `컴포넌트 "${componentName}"를 찾을 수 없습니다.`
        ),
      ]
    );
  }

  // STEP_COMPONENTS에서 실제 컴포넌트 추출
  const { [componentName]: SelectedComponent } = STEP_COMPONENTS;

  // 웹 접근성을 위한 ARIA 속성들 정의
  const accessibilityProps: Record<string, unknown> = {
    'aria-label': `스텝 ${currentStepNumber} 컴포넌트`,
    role: 'main',
    'aria-live': 'polite',
    'aria-describedby': `step-${currentStepNumber}-description`,
  };

  console.log('✅ [STEP_TYPES] 컴포넌트 렌더링 성공:', {
    stepNumber: currentStepNumber,
    componentName,
    timestamp: new Date().toISOString(),
  });

  // React.createElement를 사용하여 동적으로 컴포넌트 생성
  return React.createElement(SelectedComponent, accessibilityProps);
};

/**
 * 특정 스텝의 전체 설정 정보를 가져오는 함수
 */
export const getStepConfig = (targetStepNumber: StepNumber): StepInfo => {
  const stepConfigurationData = STEP_CONFIG[targetStepNumber];
  return stepConfigurationData;
};

/**
 * 특정 스텝의 제목을 가져오는 함수
 */
export const getStepTitle = (targetStepNumber: StepNumber): string => {
  const { title: stepTitle } = STEP_CONFIG[targetStepNumber];
  return stepTitle;
};

/**
 * 특정 스텝의 설명을 가져오는 함수
 */
export const getStepDescription = (targetStepNumber: StepNumber): string => {
  const { description: stepDescription } = STEP_CONFIG[targetStepNumber];
  return stepDescription;
};

/**
 * 특정 스텝의 컴포넌트 이름을 가져오는 함수
 */
export const getStepComponentName = (
  targetStepNumber: StepNumber
): StepComponentName => {
  const { component: componentName } = STEP_CONFIG[targetStepNumber];
  return componentName;
};

/**
 * 특정 스텝의 유효성 검사 필드 목록을 가져오는 함수
 */
export const getStepValidationFields = (
  targetStepNumber: StepNumber
): readonly string[] => {
  const { validation: validationFields } = STEP_CONFIG[targetStepNumber];
  return validationFields;
};

/**
 * 모든 스텝 번호들을 정렬된 배열로 가져오는 함수
 */
export const getStepNumbers = (): StepNumber[] => {
  const sortedStepNumbers: StepNumber[] = [];

  for (const stepKey in STEP_CONFIG) {
    const numericStepKey = parseInt(stepKey, 10);

    if (isValidStepNumber(numericStepKey)) {
      sortedStepNumbers.push(numericStepKey);
    }
  }

  return sortedStepNumbers.sort(
    (firstStep, secondStep) => firstStep - secondStep
  );
};

/**
 * 가장 작은 스텝 번호 (시작 스텝)를 가져오는 함수
 */
export const getMinStep = (): StepNumber => {
  const availableStepNumbers = getStepNumbers();
  const [firstStepNumber] = availableStepNumbers;

  if (firstStepNumber !== undefined) {
    return firstStepNumber;
  }

  const configKeys = Object.keys(STEP_CONFIG);
  const [firstConfigKey] = configKeys;
  const firstAvailableStep = parseInt(firstConfigKey, 10);

  if (isValidStepNumber(firstAvailableStep)) {
    return firstAvailableStep;
  }

  throw new Error('STEP_CONFIG에 유효한 스텝이 없습니다');
};

/**
 * 가장 큰 스텝 번호 (마지막 스텝)를 가져오는 함수
 */
export const getMaxStep = (): StepNumber => {
  const availableStepNumbers = getStepNumbers();
  const totalStepsCount = availableStepNumbers.length;
  const lastStepNumber = availableStepNumbers[totalStepsCount - 1];

  if (lastStepNumber !== undefined) {
    return lastStepNumber;
  }

  const configKeys = Object.keys(STEP_CONFIG);
  const totalConfigKeys = configKeys.length;
  const lastConfigKey = configKeys[totalConfigKeys - 1];
  const lastAvailableStep = parseInt(lastConfigKey, 10);

  if (isValidStepNumber(lastAvailableStep)) {
    return lastAvailableStep;
  }

  throw new Error('STEP_CONFIG에 유효한 스텝이 없습니다');
};

/**
 * 전체 스텝 개수를 가져오는 함수
 */
export const getTotalSteps = (): number => {
  const availableStepNumbers = getStepNumbers();
  const { length: totalStepsCount } = availableStepNumbers;
  return totalStepsCount;
};

/**
 * 현재 스텝의 다음 스텝을 가져오는 함수
 */
export const getNextStep = (
  currentStepNumber: StepNumber
): StepNumber | null => {
  const availableStepNumbers = getStepNumbers();
  const currentStepIndex = availableStepNumbers.indexOf(currentStepNumber);
  const nextStepIndex = currentStepIndex + 1;
  const { length: totalStepsCount } = availableStepNumbers;

  return nextStepIndex < totalStepsCount
    ? availableStepNumbers[nextStepIndex]
    : null;
};

/**
 * 현재 스텝의 이전 스텝을 가져오는 함수
 */
export const getPreviousStep = (
  currentStepNumber: StepNumber
): StepNumber | null => {
  const availableStepNumbers = getStepNumbers();
  const currentStepIndex = availableStepNumbers.indexOf(currentStepNumber);
  const previousStepIndex = currentStepIndex - 1;

  return previousStepIndex >= 0
    ? availableStepNumbers[previousStepIndex]
    : null;
};

/**
 * 주어진 스텝이 마지막 스텝인지 확인하는 함수
 */
export const isLastStep = (targetStepNumber: StepNumber): boolean => {
  const maximumStepNumber = getMaxStep();
  return targetStepNumber === maximumStepNumber;
};

/**
 * 주어진 스텝이 첫 번째 스텝인지 확인하는 함수
 */
export const isFirstStep = (targetStepNumber: StepNumber): boolean => {
  const minimumStepNumber = getMinStep();
  return targetStepNumber === minimumStepNumber;
};

/**
 * 스텝 네비게이션 컴포넌트에서 사용할 Props 인터페이스
 */
export interface StepNavigationProps {
  currentStep: StepNumber;
  totalSteps: number;
  onStepChange: (targetStepNumber: StepNumber) => void;
}

/**
 * 진행률 표시 컴포넌트에서 사용할 Props 인터페이스
 */
export interface ProgressBarProps {
  currentStep: StepNumber;
  totalSteps: number;
  progressWidth: number;
}

/**
 * 스텝 유효성 검사 결과 인터페이스
 */
export interface StepValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

console.log('📄 [STEP_TYPES] stepTypes 모듈 로드 완료');
