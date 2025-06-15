// blogMediaStep/imageGallery/parts/viewBuilder/ViewBuilderControls.tsx - ImageGallery 컴포넌트

import React from 'react';
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  ButtonGroup,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { createColumnOptions } from '../../utils/viewBuilderUtils';

interface ViewBuilderControlsProps {
  view: 'grid' | 'masonry';
  sortBy: 'index' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  columns: number;
  selectedCount: number;
  availableCount: number;
  onViewChange: (view: 'grid' | 'masonry') => void;
  onSortChange: (
    sortBy: 'index' | 'name' | 'size',
    sortOrder: 'asc' | 'desc'
  ) => void;
  onColumnsChange: (columns: number) => void;
  onResetSelection: () => void;
  onAddToPreview: () => void;
}

function ViewBuilderControls({
  view,
  sortBy,
  sortOrder,
  columns,
  selectedCount,
  availableCount,
  onViewChange,
  onSortChange,
  onColumnsChange,
  onResetSelection,
  onAddToPreview,
}: ViewBuilderControlsProps): React.ReactNode {
  console.log('🔧 ViewBuilderControls 렌더링:', {
    view,
    sortBy,
    sortOrder,
    columns,
    selectedCount,
    availableCount,
  });

  const columnOptions = createColumnOptions();

  const handleSortSelect = (key: string) => {
    console.log('🔧 handleSortSelect 호출:', { key });

    switch (key) {
      case 'index-asc':
        onSortChange('index', 'asc');
        break;
      case 'name-asc':
        onSortChange('name', 'asc');
        break;
      case 'name-desc':
        onSortChange('name', 'desc');
        break;
      case 'size-desc':
        onSortChange('size', 'desc');
        break;
      case 'size-asc':
        onSortChange('size', 'asc');
        break;
      default:
        onSortChange('index', 'asc');
    }
  };

  const getSortLabel = () => {
    if (sortBy === 'index') return '업로드순';
    if (sortBy === 'name')
      return sortOrder === 'asc' ? '이름 (A-Z)' : '이름 (Z-A)';
    if (sortBy === 'size')
      return sortOrder === 'desc' ? '큰 파일순' : '작은 파일순';
    return '업로드순';
  };

  console.log('📊 ViewBuilderControls 상태:', {
    sortLabel: getSortLabel(),
    viewDisplayName: view === 'grid' ? '균등 그리드' : '매스너리 레이아웃',
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button
            color="warning"
            size="sm"
            variant="flat"
            startContent={<Icon icon="lucide:refresh-cw" className="text-sm" />}
            onPress={onResetSelection}
            type="button"
          >
            선택 초기화
          </Button>

          <Button
            color="primary"
            size="sm"
            variant="solid"
            startContent={
              <Icon icon="lucide:plus-circle" className="text-sm" />
            }
            onPress={onAddToPreview}
            type="button"
            isDisabled={selectedCount === 0}
          >
            해당 뷰로 추가
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ButtonGroup>
            <Button
              size="sm"
              variant={view === 'grid' ? 'solid' : 'flat'}
              onPress={() => onViewChange('grid')}
              startContent={
                <Icon icon="lucide:layout-grid" className="text-sm" />
              }
              type="button"
            >
              그리드
            </Button>
            <Button
              size="sm"
              variant={view === 'masonry' ? 'solid' : 'flat'}
              onPress={() => onViewChange('masonry')}
              startContent={
                <Icon icon="lucide:layout-dashboard" className="text-sm" />
              }
              type="button"
            >
              매스너리
            </Button>
          </ButtonGroup>

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                size="sm"
                startContent={
                  <Icon icon="lucide:arrow-up-down" className="text-sm" />
                }
                type="button"
              >
                정렬: {getSortLabel()}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="정렬 옵션"
              onAction={(key) => handleSortSelect(String(key))}
            >
              <DropdownItem key="index-asc">업로드순</DropdownItem>
              <DropdownItem key="name-asc">이름 (A-Z)</DropdownItem>
              <DropdownItem key="name-desc">이름 (Z-A)</DropdownItem>
              <DropdownItem key="size-desc">큰 파일순</DropdownItem>
              <DropdownItem key="size-asc">작은 파일순</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                size="sm"
                startContent={
                  <Icon icon="lucide:grid-3x3" className="text-sm" />
                }
                type="button"
              >
                {columns}열
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="열 개수 옵션"
              onAction={(key) => onColumnsChange(Number(key))}
            >
              {columnOptions.map((num) => (
                <DropdownItem key={num}>{num}열</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
        <span>사용 가능한 이미지 {availableCount}개</span>
        <Chip size="sm" variant="flat" color="secondary">
          {view === 'grid' ? '균등 그리드' : '매스너리 레이아웃'}
        </Chip>
        <Chip size="sm" variant="flat" color="primary">
          {columns}열
        </Chip>
        {selectedCount > 0 && (
          <Chip size="sm" variant="flat" color="success">
            {selectedCount}개 선택됨
          </Chip>
        )}
      </div>
    </div>
  );
}

export default ViewBuilderControls;
