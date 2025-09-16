import React from 'react';
import { Button } from '@heroui/react';
import {
  StepNumber,
  getStepNumbers,
  getStepTitle,
} from '../../types/stepTypes';

interface DesktopStepButtonsProps {
  currentStep: StepNumber;
  onStepChange: (step: StepNumber) => void;
}

function DesktopStepButtons({
  currentStep,
  onStepChange,
}: DesktopStepButtonsProps) {
  const stepNumbers = React.useMemo(() => getStepNumbers(), []);

  const handleStepChange = (step: StepNumber) => {
    console.log('🖥️ DesktopStepButtons: 스텝 변경 시도', {
      fromStep: currentStep,
      toStep: step,
    });
    onStepChange(step);
  };

  return (
    <>
      {stepNumbers.map((step) => {
        const isCurrentStep = currentStep === step;

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
