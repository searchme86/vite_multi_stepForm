import { Card, CardBody } from '@heroui/react';
import StepTransitionWrapper from './StepTransitionWrapper';
import StepContentSwitcher from './StepContentSwitcher';
import { StepNumber } from '../types/stepTypes';

interface StepContentContainerProps {
  currentStep: StepNumber;
}

function StepContentContainer({ currentStep }: StepContentContainerProps) {
  console.log('🎬 StepContentContainer: 스텝 컨텐츠 컨테이너 렌더링', {
    currentStep,
  });

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardBody className="p-3 sm:p-6">
        <StepTransitionWrapper currentStep={currentStep}>
          <StepContentSwitcher currentStep={currentStep} />
        </StepTransitionWrapper>
      </CardBody>
    </Card>
  );
}

export default StepContentContainer;
