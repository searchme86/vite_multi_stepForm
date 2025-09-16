// src/components/multiStepForm/layout/shared/PreviewToggleButton.tsx

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { usePreviewPanelStore } from '../../../previewPanel/store/previewPanelStore';

function PreviewToggleButton() {
  // Zustand에서 미리보기 패널 상태 직접 구독
  const isPreviewPanelOpen = usePreviewPanelStore(
    (state) => state.isPreviewPanelOpen
  );
  const togglePreviewPanel = usePreviewPanelStore(
    (state) => state.togglePreviewPanel
  );

  console.log('👁️ PreviewToggleButton: 프리뷰 토글 버튼 렌더링', {
    isPreviewPanelOpen,
  });

  const handleTogglePreview = () => {
    console.log('🔄 PreviewToggleButton: 미리보기 토글 실행');
    togglePreviewPanel();
  };

  return (
    <div className="md:block">
      <Button
        color="primary"
        variant="flat"
        size="sm"
        fullWidth
        startContent={
          <Icon icon={isPreviewPanelOpen ? 'lucide:eye-off' : 'lucide:eye'} />
        }
        onPress={handleTogglePreview}
        className="whitespace-nowrap"
        type="button"
      >
        {isPreviewPanelOpen ? '미리보기 숨기기' : '미리보기 보기'}
      </Button>
    </div>
  );
}

export default PreviewToggleButton;
