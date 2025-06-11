//====여기부터 수정됨====
// ✅ 수정: React import 추가
// 이유: React.ReactNode 타입을 사용하기 위해 React를 import해야 함
// 의미: JSX 사용 및 React 타입 정의시 필수적인 import
import React from 'react';
//====여기까지 수정됨====
import DesktopPreviewPanel from './DesktopPreviewPanel';

interface DesktopPreviewLayoutProps {
  showPreview: boolean;
  children: React.ReactNode;
}

function DesktopPreviewLayout({
  showPreview,
  children,
}: DesktopPreviewLayoutProps) {
  console.log('🖥️ DesktopPreviewLayout: 데스크탑 프리뷰 레이아웃 렌더링', {
    showPreview,
  });

  return (
    <div
      className={`flex flex-col ${
        showPreview ? 'lg:flex-row' : ''
      } transition-all duration-500 ease ${showPreview ? 'gap-4' : ''}`}
    >
      <div
        className={`transition-all duration-500 ease ${
          showPreview ? 'lg:w-1/2' : 'w-full'
        } overflow-y-auto mb-4 lg:mb-0`}
      >
        {children}
      </div>
      <DesktopPreviewPanel showPreview={showPreview} />
    </div>
  );
}

export default DesktopPreviewLayout;
