import PrevButton from './PrevButton';
import NextButton from './NextButton';
import SubmitButton from './SubmitButton';
import { StepNumber, isLastStep } from '../../types/stepTypes';

interface NavigationButtonsProps {
  currentStep: StepNumber;
  onNext: () => void;
  onPrev: () => void;
}

function NavigationButtons({
  currentStep,
  onNext,
  onPrev,
}: NavigationButtonsProps) {
  console.log('🎯 NavigationButtons: 네비게이션 버튼들 렌더링', {
    currentStep,
    isLastStep: isLastStep(currentStep),
  });

  return (
    <div className="flex justify-between">
      <PrevButton currentStep={currentStep} onPrev={onPrev} />
      {!isLastStep(currentStep) ? (
        <NextButton onNext={onNext} />
      ) : (
        <SubmitButton />
      )}
    </div>
  );
}

export default NavigationButtons;
