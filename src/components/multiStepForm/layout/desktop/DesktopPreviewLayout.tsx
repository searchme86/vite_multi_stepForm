// src/components/multiStepForm/layout/desktop/DesktopPreviewLayout.tsx

import React, { useEffect, useState } from 'react';

interface DesktopPreviewLayoutProps {
  children: React.ReactNode;
  showPreview: boolean;
}

function DesktopPreviewLayout({
  children,
  showPreview,
}: DesktopPreviewLayoutProps) {
  // 🎯 모바일 감지 상태
  const [isMobile, setIsMobile] = useState(false);

  // 🎯 반응형 모바일 감지 로직
  useEffect(() => {
    const checkMobileDevice = () => {
      const mobileBreakpoint = 768; // md 브레이크포인트
      const currentWidth = window.innerWidth;
      const isMobileDevice = currentWidth < mobileBreakpoint;

      setIsMobile(isMobileDevice);

      console.log('📱 [DESKTOP_LAYOUT] 모바일 감지 결과:', {
        currentWidth,
        mobileBreakpoint,
        isMobileDevice,
        timestamp: new Date().toISOString(),
      });
    };

    // 🎯 초기 감지
    checkMobileDevice();

    // 🎯 윈도우 리사이즈 리스너
    const handleResize = () => {
      checkMobileDevice();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  console.log('🖥️ [DESKTOP_LAYOUT] 레이아웃 렌더링:', {
    showPreview,
    isMobile,
    childrenCount: React.Children.count(children),
    timestamp: new Date().toISOString(),
  });

  // 🎯 모바일에서는 기본 레이아웃 사용 (절대 위치 비활성화)
  if (isMobile) {
    return (
      <div className="flex flex-col w-full">
        {React.Children.toArray(children)[0]}
        {/* 모바일에서는 PreviewPanelContainer가 별도로 렌더링됨 */}
      </div>
    );
  }

  // 🎯 데스크탑에서만 절대 위치 레이아웃 적용
  return (
    <div className="relative flex w-full">
      {/* 🎯 폼 영역 - 미리보기 상태에 따라 너비 조절 */}
      <div
        className={`transition-all duration-700 ease-panel-smooth ${
          showPreview
            ? 'w-[calc(100%-min(28rem,40vw))]' // 반응형 너비 (최대 28rem 또는 40vw)
            : 'w-full'
        }`}
      >
        {React.Children.toArray(children)[0]}
      </div>

      {/* 🎯 미리보기 패널 - 데스크탑 전용 절대 위치 */}
      {React.Children.toArray(children)[1] && (
        <div
          className={`absolute top-0 right-0 h-full transition-all duration-700 ease-panel-smooth ${
            showPreview
              ? 'translate-x-0 opacity-100 visible w-[min(28rem,40vw)]' // 반응형 너비
              : 'translate-x-full opacity-0 invisible pointer-events-none w-[min(28rem,40vw)]'
          }`}
        >
          {React.Children.toArray(children)[1]}
        </div>
      )}
    </div>
  );
}

export default DesktopPreviewLayout;
