import DesktopNavigationContainer from '../desktop/DesktopNavigationContainer';
import MobileNavigationContainer from '../mobile/MobileNavigationContainer';
import ProgressBar from './ProgressBar';
import { StepNumber } from '../../types/stepTypes';

interface StepNavigationWrapperProps {
  currentStep: StepNumber;
  progressWidth: number;
  onStepChange: (step: StepNumber) => void;
}

function StepNavigationWrapper({
  currentStep,
  progressWidth,
  onStepChange,
}: StepNavigationWrapperProps) {
  console.log('🧭 StepNavigationWrapper: 스텝 네비게이션 래퍼 렌더링', {
    currentStep,
    progressWidth,
  });

  return (
    <div className="mb-8">
      <DesktopNavigationContainer
        currentStep={currentStep}
        onStepChange={onStepChange}
      />
      <MobileNavigationContainer
        currentStep={currentStep}
        onStepChange={onStepChange}
      />
      <ProgressBar progressWidth={progressWidth} />
    </div>
  );
}

export default StepNavigationWrapper;
