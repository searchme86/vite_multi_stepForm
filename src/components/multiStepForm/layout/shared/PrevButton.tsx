import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepNumber, isFirstStep } from '../../types/stepTypes';

interface PrevButtonProps {
  currentStep: StepNumber;
  onPrev: () => void;
}

function PrevButton({ currentStep, onPrev }: PrevButtonProps) {
  console.log('⬅️ PrevButton: 이전 버튼 렌더링', { currentStep });

  return (
    <Button
      variant="flat"
      color="default"
      onPress={onPrev}
      isDisabled={isFirstStep(currentStep)}
      startContent={
        <Icon icon="lucide:arrow-left" className="hidden sm:inline" />
      }
      className="px-3 sm:px-4"
      type="button"
    >
      <span className="hidden sm:inline">이전</span>
      <span className="inline sm:hidden">이전</span>
    </Button>
  );
}

export default PrevButton;
