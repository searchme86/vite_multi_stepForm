import React from 'react';
import { StepNumber, renderStepComponent } from '../types/stepTypes';

interface StepContentSwitcherProps {
  currentStep: StepNumber;
}

function StepContentSwitcher({ currentStep }: StepContentSwitcherProps) {
  console.log('🔀 StepContentSwitcher: 스텝 컨텐츠 스위처 렌더링', {
    currentStep,
  });

  const renderCurrentStep = React.useCallback(() => {
    return renderStepComponent(currentStep);
  }, [currentStep]);

  return <>{renderCurrentStep()}</>;
}

export default StepContentSwitcher;
