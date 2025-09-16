import React from 'react';
import { Button } from '@heroui/react';
import { StepNumber, getStepNumbers } from '../../types/stepTypes';

interface MobileStepButtonsProps {
  currentStep: StepNumber;
  onStepChange: (step: StepNumber) => void;
}

function MobileStepButtons({
  currentStep,
  onStepChange,
}: MobileStepButtonsProps) {
  const stepNumbers = React.useMemo(() => getStepNumbers(), []);

  const handleStepChange = (step: StepNumber) => {
    console.log('📱 MobileStepButtons: 스텝 변경 시도', {
      fromStep: currentStep,
      toStep: step,
    });
    onStepChange(step);
  };

  return (
    <div className="flex justify-between pb-2 mb-3 overflow-x-auto sm:hidden hide-scrollbar">
      {stepNumbers.map((step) => {
        const isCurrentStep = currentStep === step;

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
