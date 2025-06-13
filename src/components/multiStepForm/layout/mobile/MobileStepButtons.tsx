import { Button } from '@heroui/react';
import { StepNumber, STEP_NUMBERS } from '../../types/stepTypes';

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

  const handleStepChange = (step: StepNumber) => {
    console.log('📱 MobileStepButtons: 스텝 변경 시도', {
      fromStep: currentStep,
      toStep: step,
    });
    onStepChange(step);
  };

  return (
    <div className="flex justify-between pb-2 mb-3 overflow-x-auto sm:hidden hide-scrollbar">
      {STEP_NUMBERS.map((step) => {
        const isCurrentStep = currentStep === step;

        console.log('📱 MobileStepButtons: 버튼 렌더링', {
          step,
          isCurrentStep,
        });

        return (
          <Button
            key={step}
            variant={isCurrentStep ? 'solid' : 'light'}
            color={isCurrentStep ? 'primary' : 'default'}
            onPress={() => handleStepChange(step)}
            className="flex-shrink-0 mr-2"
            size="sm"
            type="button"
          >
            {step}
          </Button>
        );
      })}
    </div>
  );
}

export default MobileStepButtons;
