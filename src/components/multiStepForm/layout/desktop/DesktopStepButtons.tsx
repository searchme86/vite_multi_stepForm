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

  const handleStepChange = (step: StepNumber) => {
    console.log('🖥️ DesktopStepButtons: 스텝 변경 시도', {
      fromStep: currentStep,
      toStep: step,
    });
    onStepChange(step);
  };

  return (
    <>
      {steps.map((step) => {
        const isCurrentStep = currentStep === step;

        console.log('🖥️ DesktopStepButtons: 버튼 렌더링', {
          step,
          isCurrentStep,
        });

        return (
          <Button
            key={step}
            variant={isCurrentStep ? 'solid' : 'flat'}
            color={isCurrentStep ? 'primary' : 'default'}
            onPress={() => handleStepChange(step)}
            className="z-10"
            type="button"
          >
            {step}. {getStepTitle(step)}
          </Button>
        );
      })}
    </>
  );
}

export default DesktopStepButtons;
