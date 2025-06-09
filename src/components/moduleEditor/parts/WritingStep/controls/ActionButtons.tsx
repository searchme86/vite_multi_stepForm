import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ActionButtonsProps {
  saveAllToContext: () => void;
  completeEditor: () => void;
}

function ActionButtons({
  saveAllToContext,
  completeEditor,
}: ActionButtonsProps) {
  console.log('⚡ [ACTION_BUTTONS] 렌더링');

  const handleSave = () => {
    console.log('💾 [ACTION_BUTTONS] 저장 버튼 클릭');
    saveAllToContext();
  };

  const handleComplete = () => {
    console.log('✅ [ACTION_BUTTONS] 완성 버튼 클릭');
    completeEditor();
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        color="secondary"
        variant="flat"
        onPress={handleSave}
        startContent={<Icon icon="lucide:save" />}
        aria-label="현재 작성 내용 저장"
      >
        저장
      </Button>
      <Button
        type="button"
        color="success"
        onPress={handleComplete}
        endContent={<Icon icon="lucide:check" />}
        aria-label="글 작성 완료"
      >
        완성
      </Button>
    </div>
  );
}

export default ActionButtons;
