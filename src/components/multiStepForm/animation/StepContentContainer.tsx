import { Card, CardBody } from '@heroui/react';
import StepTransitionWrapper from './StepTransitionWrapper';
import { StepNumber } from '../types/stepTypes';

interface StepContentContainerProps {
  currentStep: StepNumber;
  children: React.ReactNode;
}

function StepContentContainer({
  currentStep,
  children,
}: StepContentContainerProps) {
  console.log('🎬 StepContentContainer: 스텝 컨텐츠 컨테이너 렌더링', {
    currentStep,
    hasChildren: !!children,
  });

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardBody className="p-3 sm:p-6">
        <StepTransitionWrapper currentStep={currentStep}>
          {children}
        </StepTransitionWrapper>
      </CardBody>
    </Card>
  );
}

export default StepContentContainer;
