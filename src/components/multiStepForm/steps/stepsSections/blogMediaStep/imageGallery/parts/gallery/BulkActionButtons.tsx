// blogMediaStep/imageGallery/parts/gallery/BulkActionButtons.tsx - ImageGallery 컴포넌트

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface BulkActionButtonsProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isAllSelected: boolean;
  totalCount: number;
}

function BulkActionButtons({
  selectedCount,
  onDeleteSelected,
  onSelectAll,
  onClearSelection,
  isAllSelected,
  totalCount,
}: BulkActionButtonsProps): React.ReactNode {
  console.log('🔧 BulkActionButtons 렌더링:', {
    selectedCount,
    isAllSelected,
    totalCount,
  });

  if (selectedCount === 0) {
    console.log('📊 BulkActionButtons 선택된 항목 없음');
    return (
      <div className="flex items-center gap-2">
        <Button
          color="default"
          size="sm"
          variant="flat"
          startContent={<Icon icon="lucide:check-square" className="text-sm" />}
          onPress={onSelectAll}
          type="button"
        >
          전체 선택
        </Button>
      </div>
    );
  }

  console.log('📊 BulkActionButtons 선택된 항목 있음:', { selectedCount });

  return (
    <div className="flex items-center gap-2">
      <Button
        color="danger"
        size="sm"
        variant="flat"
        startContent={<Icon icon="lucide:trash-2" className="text-sm" />}
        onPress={onDeleteSelected}
        type="button"
      >
        {selectedCount}개 삭제
      </Button>

      {isAllSelected ? (
        <Button
          color="default"
          size="sm"
          variant="flat"
          startContent={<Icon icon="lucide:square" className="text-sm" />}
          onPress={onClearSelection}
          type="button"
        >
          선택 해제
        </Button>
      ) : (
        <Button
          color="default"
          size="sm"
          variant="flat"
          startContent={<Icon icon="lucide:check-square" className="text-sm" />}
          onPress={onSelectAll}
          type="button"
        >
          전체 선택
        </Button>
      )}

      <span className="text-sm text-default-500">
        {selectedCount}/{totalCount}개 선택됨
      </span>
    </div>
  );
}

export default BulkActionButtons;
