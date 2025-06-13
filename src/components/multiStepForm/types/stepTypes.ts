import React from 'react';
import UserInfoStep from '../steps/user-info-step';
import BlogBasicStep from '../steps/blog-basic-step';
import BlogContentStep from '../steps/blog-content-step';
import BlogMediaStep from '../steps/blog-media-step';
import ModularBlogEditorContainer from '../../moduleEditor/ModularBlogEditorContainer';

export const STEP_COMPONENTS = {
  UserInfoStep,
  BlogBasicStep,
  BlogContentStep,
  ModularBlogEditorContainer,
  BlogMediaStep,
} as const;

export type StepComponentName = keyof typeof STEP_COMPONENTS;

const createStepConfig = <
  T extends Record<
    number,
    {
      title: string;
      description: string;
      component: StepComponentName;
      validation: readonly string[];
    }
  >
>(
  config: T
) => config;

export const STEP_CONFIG = createStepConfig({
  1: {
    title: '유저 정보 입력',
    description: '기본 사용자 정보를 입력합니다',
    component: 'UserInfoStep',
    validation: ['nickname', 'emailPrefix', 'emailDomain'] as const,
  },
  2: {
    title: '블로그 기본 정보',
    description: '블로그 제목과 설명을 입력합니다',
    component: 'BlogBasicStep',
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
});

export type StepNumber = keyof typeof STEP_CONFIG;
export type StepConfig = typeof STEP_CONFIG;
export type StepInfo = StepConfig[StepNumber];

export const isValidStepNumber = (step: number): step is StepNumber => {
  return step in STEP_CONFIG;
};

const getStepNumbers = (): StepNumber[] => {
  const result: StepNumber[] = [];
  for (const key in STEP_CONFIG) {
    const numKey = Number(key);
    if (isValidStepNumber(numKey)) {
      result.push(numKey);
    }
  }
  return result.sort((a, b) => a - b);
};

export const STEP_NUMBERS: readonly StepNumber[] = getStepNumbers();
export const TOTAL_STEPS = STEP_NUMBERS.length;
export const MIN_STEP: StepNumber = STEP_NUMBERS[0];
export const MAX_STEP: StepNumber = STEP_NUMBERS[STEP_NUMBERS.length - 1];

export const getStepComponent = (componentName: StepComponentName) => {
  return STEP_COMPONENTS[componentName];
};

export const renderStepComponent = (step: StepNumber) => {
  const stepConfig = STEP_CONFIG[step];
  const Component = STEP_COMPONENTS[stepConfig.component];
  return React.createElement(Component);
};

export const getStepConfig = (step: StepNumber) => {
  return STEP_CONFIG[step];
};

export const getStepTitle = (step: StepNumber): string => {
  return STEP_CONFIG[step].title;
};

export const getStepDescription = (step: StepNumber): string => {
  return STEP_CONFIG[step].description;
};

export const getStepComponentName = (step: StepNumber): StepComponentName => {
  return STEP_CONFIG[step].component;
};

export const getStepValidationFields = (
  step: StepNumber
): readonly string[] => {
  return STEP_CONFIG[step].validation;
};

export const getNextStep = (currentStep: StepNumber): StepNumber | null => {
  const currentIndex = STEP_NUMBERS.indexOf(currentStep);
  const nextIndex = currentIndex + 1;
  return nextIndex < STEP_NUMBERS.length ? STEP_NUMBERS[nextIndex] : null;
};

export const getPreviousStep = (currentStep: StepNumber): StepNumber | null => {
  const currentIndex = STEP_NUMBERS.indexOf(currentStep);
  const prevIndex = currentIndex - 1;
  return prevIndex >= 0 ? STEP_NUMBERS[prevIndex] : null;
};

export const isLastStep = (step: StepNumber): boolean => {
  return step === MAX_STEP;
};

export const isFirstStep = (step: StepNumber): boolean => {
  return step === MIN_STEP;
};

export interface StepNavigationProps {
  currentStep: StepNumber;
  totalSteps: number;
  onStepChange: (step: StepNumber) => void;
}

export interface ProgressBarProps {
  currentStep: StepNumber;
  totalSteps: number;
  progressWidth: number;
}

export interface StepValidationResult {
  isValid: boolean;
  errorMessage?: string;
}
