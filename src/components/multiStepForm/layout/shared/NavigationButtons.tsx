import PrevButton from './PrevButton';
import NextButton from './NextButton';
import SubmitButton from './SubmitButton';
import { StepNumber } from '../../types/stepTypes';

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
  });

  return (
    <div className="flex justify-between">
      <PrevButton currentStep={currentStep} onPrev={onPrev} />
      {currentStep < 5 ? <NextButton onNext={onNext} /> : <SubmitButton />}
    </div>
  );
}

export default NavigationButtons;
