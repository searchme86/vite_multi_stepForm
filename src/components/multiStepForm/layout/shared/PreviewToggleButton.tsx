// src/components/multiStepForm/layout/shared/PreviewToggleButton.tsx

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { usePreviewPanelStore } from '../../../previewPanel/store/previewPanelStore';

function PreviewToggleButton() {
  console.log('👁️ [PREVIEW_TOGGLE_BUTTON] 컴포넌트 렌더링 시작');

  // Zustand에서 직접 상태 구독 - props 제거
  const previewPanelOpenStatus = usePreviewPanelStore((state) => {
    console.log(
      '🔍 [PREVIEW_TOGGLE_BUTTON] Zustand 상태 구독 - isPreviewPanelOpen:',
      state.isPreviewPanelOpen
    );
    return state.isPreviewPanelOpen;
  });

  const togglePreviewPanelAction = usePreviewPanelStore((state) => {
    console.log(
      '🔍 [PREVIEW_TOGGLE_BUTTON] Zustand 액션 구독 - togglePreviewPanel 함수 가져옴'
    );
    return state.togglePreviewPanel;
  });

  // 버튼 텍스트 계산 (삼항연산자 사용)
  const buttonText = previewPanelOpenStatus
    ? '미리보기 숨기기'
    : '미리보기 보기';
  const iconName = previewPanelOpenStatus ? 'lucide:eye-off' : 'lucide:eye';

  console.log('📊 [PREVIEW_TOGGLE_BUTTON] 렌더링 상태:', {
    previewPanelOpenStatus,
    buttonText,
    iconName,
    renderTime: new Date().toLocaleTimeString(),
  });

  const handleToggleButtonClick = () => {
    console.group('🖱️ [PREVIEW_TOGGLE_BUTTON] 버튼 클릭 이벤트');
    console.log('클릭 시 현재 상태:', previewPanelOpenStatus);
    console.log('클릭 후 예상 상태:', !previewPanelOpenStatus);
    console.log('togglePreviewPanel 액션 호출 시작');

    togglePreviewPanelAction();

    console.log('togglePreviewPanel 액션 호출 완료');
    console.groupEnd();
  };

  return (
    <div className="md:block">
      <Button
        color="primary"
        variant="flat"
        size="sm"
        fullWidth
        startContent={<Icon icon={iconName} />}
        onPress={handleToggleButtonClick}
        className="whitespace-nowrap"
        type="button"
        aria-label={buttonText}
      >
        {buttonText}
      </Button>
    </div>
  );
}

export default PreviewToggleButton;
