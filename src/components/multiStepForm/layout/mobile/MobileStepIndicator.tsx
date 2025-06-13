import { StepNumber, getStepTitle } from '../../types/stepTypes';

interface MobileStepIndicatorProps {
  currentStep: StepNumber;
}

function MobileStepIndicator({ currentStep }: MobileStepIndicatorProps) {
  console.log('📱 MobileStepIndicator: 모바일 스텝 표시기 렌더링', {
    currentStep,
  });

  const stepTitle = getStepTitle(currentStep);

  console.log('📱 MobileStepIndicator: 스텝 타이틀 생성됨', {
    currentStep,
    stepTitle,
  });

  return (
    <div className="flex px-1 mb-2 sm:hidden">
      <p className="text-sm font-medium">{stepTitle}</p>
    </div>
  );
}

export default MobileStepIndicator;
