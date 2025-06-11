import PreviewPanel from '../../preview-panel';

function MobilePreviewPanel() {
  console.log('📱 MobilePreviewPanel: 모바일 프리뷰 패널 렌더링');

  return (
    <div className="md:hidden">
      <PreviewPanel />
    </div>
  );
}

export default MobilePreviewPanel;
