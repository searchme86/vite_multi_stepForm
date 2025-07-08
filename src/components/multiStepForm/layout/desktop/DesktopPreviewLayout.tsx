import React from 'react';
import { useMultiStepFormStore } from '../../store/multiStepForm/multiStepFormStore';

interface DesktopPreviewLayoutProps {
  children: React.ReactNode;
}

function DesktopPreviewLayout({ children }: DesktopPreviewLayoutProps) {
  const showPreview = useMultiStepFormStore((state) => state.showPreview);

  return (
    <div
      className={`flex ${
        showPreview ? 'transition-all duration-500 ease gap-4' : 'w-full'
      }`}
    >
      {children}
    </div>
  );
}

export default DesktopPreviewLayout;
