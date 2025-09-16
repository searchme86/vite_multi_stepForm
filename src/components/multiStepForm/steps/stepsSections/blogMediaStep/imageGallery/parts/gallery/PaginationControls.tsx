// blogMediaStep/imageGallery/parts/gallery/PaginationControls.tsx - ImageGallery 컴포넌트

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface PaginationControlsProps {
  canExpand: boolean;
  isExpanded: boolean;
  hasMoreFiles: boolean;
  showMoreCount: number;
  onLoadMoreToggle: () => void;
}

function PaginationControls({
  canExpand,
  isExpanded,
  hasMoreFiles,
  showMoreCount,
  onLoadMoreToggle,
}: PaginationControlsProps): React.ReactNode {
  console.log('🔧 PaginationControls 렌더링:', {
    canExpand,
    isExpanded,
    hasMoreFiles,
    showMoreCount,
  });

  if (!canExpand) {
    console.log('📊 PaginationControls 확장 불가');
    return null;
  }

  const getButtonContent = () => {
    if (isExpanded) {
      return (
        <>
          접기
          <Icon icon="lucide:chevron-up" className="text-sm" />
        </>
      );
    } else if (hasMoreFiles) {
      return (
        <>
          더보기
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full text-primary-600 bg-primary-100">
            {showMoreCount}
          </span>
        </>
      );
    } else {
      return (
        <>
          접기
          <Icon icon="lucide:chevron-up" className="text-sm" />
        </>
      );
    }
  };

  console.log('📊 PaginationControls 버튼 표시:', {
    buttonType: isExpanded
      ? 'collapse'
      : hasMoreFiles
      ? 'loadMore'
      : 'collapse',
  });

  return (
    <div className="pt-2 text-center">
      <Button
        variant="flat"
        color="primary"
        size="sm"
        onPress={onLoadMoreToggle}
        className="relative transition-all hover:bg-primary-50"
        type="button"
      >
        <span className="flex items-center gap-2">{getButtonContent()}</span>
      </Button>
    </div>
  );
}

export default PaginationControls;
