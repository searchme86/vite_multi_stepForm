import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface PreviewControlsProps {
  isPreviewOpen: boolean;
  totalParagraphs: number;
  containersCount: number;
  togglePreview: () => void;
}

function PreviewControls({
  isPreviewOpen,
  totalParagraphs,
  containersCount,
  togglePreview,
}: PreviewControlsProps) {
  console.log('🎛️ [PREVIEW_CONTROLS] 렌더링:', {
    isPreviewOpen,
    totalParagraphs,
    containersCount,
  });

  const handleToggle = () => {
    console.log('👁️ [PREVIEW_CONTROLS] 미리보기 토글:', !isPreviewOpen);
    togglePreview();
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
      <span className="flex items-center gap-2 text-lg font-semibold">
        <Icon icon="lucide:eye" />
        최종 조합 미리보기 (이미지 렌더링 지원)
      </span>
      <div className="flex items-center gap-2">
        {containersCount > 0 && (
          <span className="px-2 py-1 text-xs text-gray-500 bg-white rounded-full">
            {totalParagraphs}개 단락 조합됨
          </span>
        )}
        <Button
          type="button"
          size="sm"
          variant="flat"
          onPress={handleToggle}
          startContent={
            <Icon
              icon={isPreviewOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'}
            />
          }
          aria-label={`미리보기 ${isPreviewOpen ? '접기' : '펼치기'}`}
        >
          {isPreviewOpen ? '접기' : '펼치기'}
        </Button>
      </div>
    </div>
  );
}

export default PreviewControls;
