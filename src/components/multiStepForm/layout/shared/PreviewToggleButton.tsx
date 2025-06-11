import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface PreviewToggleButtonProps {
  showPreview: boolean;
  onToggle: () => void;
}

function PreviewToggleButton({
  showPreview,
  onToggle,
}: PreviewToggleButtonProps) {
  console.log('👁️ PreviewToggleButton: 프리뷰 토글 버튼 렌더링', {
    showPreview,
  });

  return (
    <div className="hidden md:block">
      <Button
        color="primary"
        variant="flat"
        size="sm"
        fullWidth
        startContent={
          <Icon icon={showPreview ? 'lucide:eye-off' : 'lucide:eye'} />
        }
        onPress={onToggle}
        className="whitespace-nowrap"
        type="button"
      >
        {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
      </Button>
    </div>
  );
}

export default PreviewToggleButton;
