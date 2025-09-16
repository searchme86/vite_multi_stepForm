import DesktopStepButtons from './DesktopStepButtons';
import DesktopConnectionLine from './DesktopConnectionLine';
import { StepNumber } from '../../types/stepTypes';

interface DesktopNavigationContainerProps {
  currentStep: StepNumber;
  onStepChange: (step: StepNumber) => void;
}

function DesktopNavigationContainer({
  currentStep,
  onStepChange,
}: DesktopNavigationContainerProps) {
  console.log(
    '🖥️ DesktopNavigationContainer: 데스크탑 네비게이션 컨테이너 렌더링',
    {
      currentStep,
    }
  );

  return (
    <div className="relative justify-between hidden mb-2 sm:flex">
      {/* <DesktopConnectionLine /> */}
      <DesktopStepButtons
        currentStep={currentStep}
        onStepChange={onStepChange}
      />
    </div>
  );
}

export default DesktopNavigationContainer;
