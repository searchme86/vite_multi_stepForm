import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface NextButtonProps {
  onNext: () => void;
}

function NextButton({ onNext }: NextButtonProps) {
  console.log('➡️ NextButton: 다음 버튼 렌더링');

  return (
    <Button
      color="primary"
      onPress={onNext}
      endContent={
        <Icon icon="lucide:arrow-right" className="hidden sm:inline" />
      }
      className="px-3 sm:px-4"
      type="button"
    >
      <span className="hidden sm:inline">다음</span>
      <span className="inline sm:hidden">다음</span>
    </Button>
  );
}

export default NextButton;
