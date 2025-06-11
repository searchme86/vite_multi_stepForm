import { Button } from '@heroui/react';
import { StepNumber } from '../../types/stepTypes';
import { getStepTitle } from '../../reactHookForm/utils/stepUtils';

interface DesktopStepButtonsProps {
  currentStep: StepNumber;
  onStepChange: (step: StepNumber) => void;
}

function DesktopStepButtons({
  currentStep,
  onStepChange,
}: DesktopStepButtonsProps) {
  console.log('🖥️ DesktopStepButtons: 데스크탑 스텝 버튼들 렌더링', {
    currentStep,
  });

  const steps: StepNumber[] = [1, 2, 3, 4, 5];

  return (
    <div className="relative justify-between hidden mb-2 sm:flex">
      {/* 연결선 배경 */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-default-200 -translate-y-1/2 z-0"></div>

      {steps.map((step) => (
        <Button
          key={step}
          variant={currentStep === step ? 'solid' : 'flat'}
          color={currentStep === step ? 'primary' : 'default'}
          onPress={() => onStepChange(step)}
          className="z-10"
          type="button"
        >
          {step}. {getStepTitle(step)}
        </Button>
      ))}
    </div>
  );
}

export default DesktopStepButtons;
