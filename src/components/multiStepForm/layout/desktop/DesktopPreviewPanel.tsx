// 📁 파일 위치: multiStepForm/layout/desktop/DesktopPreviewPanel.tsx
import { Card, CardBody } from '@heroui/react';
// import PreviewPanel from '../../preview-panel';
// import PreviewPanel from '../../preview-panel';
// import { usePreviewManagementStore } from '../../store/previewManagement/previewManagementStore';
// import { usePreviewManagementStore } from '../../../../store/';
import PreviewPanelContainer from '../../../previewPanel/PreviewPanelContainer';

function DesktopPreviewPanel() {
  console.log('🖥️ DesktopPreviewPanel: 데스크탑 프리뷰 패널 렌더링 시작');

  // const showPreview = usePreviewManagementStore((state) => state.showPreview);

  // console.log('🖥️ DesktopPreviewPanel: Zustand에서 상태 로드됨', {
  //   showPreview,
  //   timestamp: new Date().toLocaleTimeString(),
  // });

  // if (!showPreview) {
  //   console.log('🖥️ DesktopPreviewPanel: 프리뷰 숨김 상태, 렌더링 안함');
  //   return null;
  // }
  {
    console.log('🖥️ DesktopPreviewPanel: PreviewPanel 컴포넌트 렌더링');
  }

  return (
    <div className="hidden md:block w-full lg:w-1/2 h-[500px] lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
      <Card className="h-full shadow-sm">
        <CardBody className="p-3 sm:p-6">
          <PreviewPanelContainer />
        </CardBody>
      </Card>
    </div>
  );
}

export default DesktopPreviewPanel;
