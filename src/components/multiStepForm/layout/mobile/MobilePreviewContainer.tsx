// 📁 파일 위치: multiStepForm/layout/mobile/MobilePreviewContainer.tsx
function MobilePreviewContainer({ children }: { children: React.ReactNode }) {
  console.log('📱 MobilePreviewContainer: 모바일 프리뷰 컨테이너 렌더링');

  return (
    <>
      {children}
      <MobilePreviewPanel />
    </>
  );
}

function MobilePreviewPanel() {
  console.log('📱 MobilePreviewPanel: 모바일 프리뷰 패널 렌더링');

  return (
    <div className="md:hidden">
      {/* PreviewPanel 컴포넌트는 내부적으로 Zustand Store를 사용할 예정 */}
      <PreviewPanel />
    </div>
  );
}

export { MobilePreviewContainer, MobilePreviewPanel };
