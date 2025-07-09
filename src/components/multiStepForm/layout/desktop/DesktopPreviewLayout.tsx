// src/components/multiStepForm/layout/desktop/DesktopPreviewLayout.tsx

import React from 'react';

interface DesktopPreviewLayoutProps {
  children: React.ReactNode;
  showPreview: boolean;
}

function DesktopPreviewLayout({
  children,
  showPreview,
}: DesktopPreviewLayoutProps) {
  console.log('🖥️ [DESKTOP_LAYOUT] 레이아웃 렌더링:', {
    showPreview,
    childrenCount: React.Children.count(children),
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="relative flex w-full">
      {/* 🎯 폼 영역 - 미리보기 상태에 따라 너비 조절 */}
      <div
        className={`transition-all duration-700 ease-panel-smooth ${
          showPreview ? 'w-[calc(100%-24rem)]' : 'w-full'
        }`}
      >
        {React.Children.toArray(children)[0]}
      </div>

      {/* 🎯 미리보기 패널 - 절대 위치로 고정하여 레이아웃 변경 방지 */}
      {React.Children.toArray(children)[1] && (
        <div
          className={`absolute top-0 right-0 w-96 h-full transition-all duration-700 ease-panel-smooth ${
            showPreview
              ? 'translate-x-0 opacity-100 visible'
              : 'translate-x-full opacity-0 invisible pointer-events-none'
          }`}
        >
          {React.Children.toArray(children)[1]}
        </div>
      )}
    </div>
  );
}

export default DesktopPreviewLayout;
