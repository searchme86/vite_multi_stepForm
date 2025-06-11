//====여기부터 수정됨====
// ✅ 수정: React import 추가
// 이유: React.ComponentType 타입을 사용하기 위해 React를 import해야 함
// 의미: React 컴포넌트 타입 정의시 필수적인 import
import React from 'react';
//====여기까지 수정됨====

export type StepNumber = 1 | 2 | 3 | 4 | 5;

export interface StepInfo {
  number: StepNumber;
  title: string;
  component: React.ComponentType;
}

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
