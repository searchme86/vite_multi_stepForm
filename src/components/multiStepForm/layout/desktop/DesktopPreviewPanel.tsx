import { Card, CardBody } from '@heroui/react';
import PreviewPanel from '../../preview-panel';

interface DesktopPreviewPanelProps {
  showPreview: boolean;
}

function DesktopPreviewPanel({ showPreview }: DesktopPreviewPanelProps) {
  console.log('🖥️ DesktopPreviewPanel: 데스크탑 프리뷰 패널 렌더링', {
    showPreview,
  });

  if (!showPreview) return null;

  return (
    <div className="hidden md:block w-full lg:w-1/2 h-[500px] lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
      <Card className="h-full shadow-sm">
        <CardBody className="p-3 sm:p-6">
          <PreviewPanel />
        </CardBody>
      </Card>
    </div>
  );
}

export default DesktopPreviewPanel;
