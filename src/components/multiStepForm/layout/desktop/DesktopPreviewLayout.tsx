import React from 'react';
import { useMultiStepFormStore } from '../../store/multiStepForm/multiStepFormStore';

interface DesktopPreviewLayoutProps {
  children: React.ReactNode;
}

function DesktopPreviewLayout({ children }: DesktopPreviewLayoutProps) {
  const showPreview = useMultiStepFormStore((state) => state.showPreview);

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
    </div>
  );
}

export default DesktopPreviewLayout;
