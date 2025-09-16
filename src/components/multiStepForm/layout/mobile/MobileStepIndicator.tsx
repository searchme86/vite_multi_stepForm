// src/components/multiStepForm/layout/mobile/MobileStepIndicator.tsx

import {
  StepNumber,
  getStepTitle,
  isValidStepNumber,
  getMinStep,
} from '../../types/stepTypes';

interface MobileStepIndicatorProps {
  currentStep: StepNumber;
}

function MobileStepIndicator({ currentStep }: MobileStepIndicatorProps) {
  console.log('📱 [MOBILE_STEP_INDICATOR] 모바일 스텝 표시기 렌더링', {
    currentStep,
    isValidStep: isValidStepNumber(currentStep),
    timestamp: new Date().toISOString(),
  });

  // 안전한 스텝 번호 검증
  const safeCurrentStep = isValidStepNumber(currentStep)
    ? currentStep
    : getMinStep();

  if (safeCurrentStep !== currentStep) {
    console.warn(
      '⚠️ [MOBILE_STEP_INDICATOR] 유효하지 않은 스텝 번호, fallback 사용:',
      {
        originalStep: currentStep,
        fallbackStep: safeCurrentStep,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // 안전한 스텝 제목 가져오기
  const stepTitle = (() => {
    try {
      return getStepTitle(safeCurrentStep);
    } catch (error) {
      console.error('❌ [MOBILE_STEP_INDICATOR] 스텝 제목 가져오기 실패:', {
        stepNumber: safeCurrentStep,
        error,
        timestamp: new Date().toISOString(),
      });
      return `스텝 ${safeCurrentStep}`;
    }
  })();

  console.log('📱 [MOBILE_STEP_INDICATOR] 스텝 타이틀 생성됨', {
    currentStep: safeCurrentStep,
    stepTitle,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="flex px-1 mb-2 sm:hidden">
      <p className="text-sm font-medium">{stepTitle}</p>
    </div>
  );
}

export default MobileStepIndicator;

console.log('📄 [MOBILE_STEP_INDICATOR] MobileStepIndicator 모듈 로드 완료');
