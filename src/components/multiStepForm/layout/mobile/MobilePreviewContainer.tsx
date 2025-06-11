import MobilePreviewPanel from './MobilePreviewPanel';

interface MobilePreviewContainerProps {
  children: React.ReactNode;
}

function MobilePreviewContainer({ children }: MobilePreviewContainerProps) {
  console.log('📱 MobilePreviewContainer: 모바일 프리뷰 컨테이너 렌더링');

  return (
    <>
      {children}
      <MobilePreviewPanel />
    </>
  );
}

export default MobilePreviewContainer;
