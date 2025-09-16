// blogMediaStep/imageGallery/parts/gallery/GalleryControls.tsx - ImageGallery 컴포넌트

import React from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import BulkActionButtons from './BulkActionButtons';
import SortingDropdown from './SortingDropdown';

interface GalleryControlsProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  sortBy: 'index' | 'name' | 'size';
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSortChange: (
    sortBy: 'index' | 'name' | 'size',
    sortOrder: 'asc' | 'desc'
  ) => void;
}

function GalleryControls({
  selectedCount,
  totalCount,
  isAllSelected,
  sortBy,
  onDeleteSelected,
  onSelectAll,
  onClearSelection,
  onSortChange,
}: GalleryControlsProps): React.ReactNode {
  console.log('🔧 GalleryControls 렌더링:', {
    selectedCount,
    totalCount,
    isAllSelected,
    sortBy,
  });

  return (
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
      <BulkActionButtons
        selectedCount={selectedCount}
        onDeleteSelected={onDeleteSelected}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        isAllSelected={isAllSelected}
        totalCount={totalCount}
      />

      <div className="flex items-center gap-2">
        <SortingDropdown currentSortBy={sortBy} onSortChange={onSortChange} />
      </div>
    </div>
  );
}

export default GalleryControls;
