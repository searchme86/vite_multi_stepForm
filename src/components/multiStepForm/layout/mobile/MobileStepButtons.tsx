import { Button } from '@heroui/react';
import { StepNumber } from '../../types/stepTypes';

interface MobileStepButtonsProps {
  currentStep: StepNumber;
  onStepChange: (step: StepNumber) => void;
}

function MobileStepButtons({
  currentStep,
  onStepChange,
}: MobileStepButtonsProps) {
  console.log('📱 MobileStepButtons: 모바일 스텝 버튼들 렌더링', {
    currentStep,
  });

  const steps: StepNumber[] = [1, 2, 3, 4, 5];

  return (
    <div className="flex justify-between pb-2 mb-3 overflow-x-auto sm:hidden hide-scrollbar">
      {steps.map((step) => (
        <Button
          key={step}
          variant={currentStep === step ? 'solid' : 'light'}
          color={currentStep === step ? 'primary' : 'default'}
          onPress={() => onStepChange(step)}
          className="flex-shrink-0 mr-2"
          size="sm"
          type="button"
        >
          {step}
        </Button>
      ))}
    </div>
  );
}

export default MobileStepButtons;
