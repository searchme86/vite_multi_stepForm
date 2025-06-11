import MobileStepButtons from './MobileStepButtons';
import MobileStepIndicator from './MobileStepIndicator';
import { StepNumber } from '../../types/stepTypes';

interface MobileNavigationContainerProps {
  currentStep: StepNumber;
  onStepChange: (step: StepNumber) => void;
}

function MobileNavigationContainer({
  currentStep,
  onStepChange,
}: MobileNavigationContainerProps) {
  console.log(
    '📱 MobileNavigationContainer: 모바일 네비게이션 컨테이너 렌더링',
    { currentStep }
  );

  return (
    <div className="sm:hidden">
      <MobileStepButtons
        currentStep={currentStep}
        onStepChange={onStepChange}
      />
      <MobileStepIndicator currentStep={currentStep} />
    </div>
  );
}

export default MobileNavigationContainer;
