// blogMediaStep/imageGallery/parts/viewBuilder/ViewBuilderControls.tsx

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
  // 모드 관리
  mode: 'all' | 'selected';

  // 레이아웃 설정
  view: 'grid' | 'masonry';
  sortBy: 'index' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  columns: number;

  // 이미지 개수
  selectedCount: number;
  availableCount: number;

  // 이벤트 핸들러
  onViewChange: (view: 'grid' | 'masonry') => void;
  onSortChange: (
    sortBy: 'index' | 'name' | 'size',
    sortOrder: 'asc' | 'desc'
  ) => void;
  onColumnsChange: (columns: number) => void;
  onResetSelection: () => void;
  onAddAllImages: () => void;
  onAddSelectedImages: () => void;

  // 상태 제어
  isDisabled?: boolean;
}

function ViewBuilderControls({
  mode,
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
  onAddAllImages,
  onAddSelectedImages,
  isDisabled = false,
}: ViewBuilderControlsProps): React.ReactNode {
  console.log('🔧 ViewBuilderControls 렌더링:', {
    mode,
    view,
    sortBy,
    sortOrder,
    columns,
    selectedCount,
    availableCount,
    isDisabled,
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

    console.log('✅ handleSortSelect 완료:', { key });
  };

  const handleViewSelect = (targetView: 'grid' | 'masonry') => {
    console.log('🔧 handleViewSelect 호출:', { targetView });

    if (isDisabled) {
      console.log('⚠️ 비활성화 상태에서 뷰 변경 시도');
      return;
    }

    onViewChange(targetView);

    console.log('✅ handleViewSelect 완료:', { targetView });
  };

  const handleColumnsSelect = (targetColumns: number) => {
    console.log('🔧 handleColumnsSelect 호출:', { targetColumns });

    if (isDisabled) {
      console.log('⚠️ 비활성화 상태에서 열 개수 변경 시도');
      return;
    }

    onColumnsChange(targetColumns);

    console.log('✅ handleColumnsSelect 완료:', { targetColumns });
  };

  const getSortLabel = (): string => {
    if (sortBy === 'index') return '업로드순';
    if (sortBy === 'name')
      return sortOrder === 'asc' ? '이름 (A-Z)' : '이름 (Z-A)';
    if (sortBy === 'size')
      return sortOrder === 'desc' ? '큰 파일순' : '작은 파일순';
    return '업로드순';
  };

  const getViewDisplayName = (): string => {
    return view === 'grid' ? '균등 그리드' : '매스너리 레이아웃';
  };

  const getAllModeButtonText = (): string => {
    return availableCount > 0
      ? `전체 이미지로 뷰 추가 (${availableCount}개)`
      : '전체 이미지로 뷰 추가';
  };

  const getSelectedModeButtonText = (): string => {
    return selectedCount > 0
      ? `선택된 이미지로 뷰 추가 (${selectedCount}개)`
      : '선택된 이미지로 뷰 추가';
  };

  const isAllModeButtonEnabled = (): boolean => {
    return mode === 'all' && availableCount > 0 && !isDisabled;
  };

  const isSelectedModeButtonEnabled = (): boolean => {
    return mode === 'selected' && selectedCount > 0 && !isDisabled;
  };

  const isResetButtonEnabled = (): boolean => {
    return mode === 'selected' && selectedCount > 0 && !isDisabled;
  };

  const sortLabel = getSortLabel();
  const viewDisplayName = getViewDisplayName();
  const allModeButtonText = getAllModeButtonText();
  const selectedModeButtonText = getSelectedModeButtonText();

  console.log('📊 ViewBuilderControls 상태:', {
    sortLabel,
    viewDisplayName,
    allModeEnabled: isAllModeButtonEnabled(),
    selectedModeEnabled: isSelectedModeButtonEnabled(),
    resetEnabled: isResetButtonEnabled(),
  });

  const renderAllModeControls = () => {
    console.log('🔧 renderAllModeControls 렌더링');

    return (
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="전체 모드 액션 버튼"
        >
          <Button
            color="primary"
            size="sm"
            variant="solid"
            startContent={
              <Icon
                icon="lucide:images"
                className="text-sm"
                aria-hidden="true"
              />
            }
            onPress={onAddAllImages}
            type="button"
            isDisabled={!isAllModeButtonEnabled()}
            aria-label={`전체 ${availableCount}개 이미지로 갤러리 뷰 생성`}
          >
            {allModeButtonText}
          </Button>

          <ButtonGroup
            isDisabled={isDisabled}
            role="radiogroup"
            aria-label="전체 모드 레이아웃 선택"
          >
            <Button
              size="sm"
              variant={view === 'grid' ? 'solid' : 'flat'}
              color={view === 'grid' ? 'secondary' : 'default'}
              onPress={() => handleViewSelect('grid')}
              startContent={
                <Icon
                  icon="lucide:layout-grid"
                  className="text-sm"
                  aria-hidden="true"
                />
              }
              type="button"
              aria-label="균등 그리드 레이아웃"
              aria-pressed={view === 'grid'}
              role="radio"
            >
              그리드
            </Button>
            <Button
              size="sm"
              variant={view === 'masonry' ? 'solid' : 'flat'}
              color={view === 'masonry' ? 'secondary' : 'default'}
              onPress={() => handleViewSelect('masonry')}
              startContent={
                <Icon
                  icon="lucide:layout-dashboard"
                  className="text-sm"
                  aria-hidden="true"
                />
              }
              type="button"
              aria-label="매스너리 레이아웃"
              aria-pressed={view === 'masonry'}
              role="radio"
            >
              매스너리
            </Button>
          </ButtonGroup>
        </div>

        <div
          className="flex items-center gap-2"
          role="toolbar"
          aria-label="전체 모드 설정 도구"
        >
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                size="sm"
                startContent={
                  <Icon
                    icon="lucide:arrow-up-down"
                    className="text-sm"
                    aria-hidden="true"
                  />
                }
                type="button"
                isDisabled={isDisabled}
                aria-label={`현재 정렬: ${sortLabel}`}
              >
                정렬: {sortLabel}
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
                  <Icon
                    icon="lucide:grid-3x3"
                    className="text-sm"
                    aria-hidden="true"
                  />
                }
                type="button"
                isDisabled={isDisabled}
                aria-label={`현재 ${columns}열 그리드`}
              >
                {columns}열
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="열 개수 옵션"
              onAction={(key) => handleColumnsSelect(Number(key))}
            >
              {columnOptions.map((num) => (
                <DropdownItem key={num}>{num}열</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    );
  };

  const renderSelectedModeControls = () => {
    console.log('🔧 renderSelectedModeControls 렌더링');

    return (
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="선택 모드 액션 버튼"
        >
          <Button
            color="warning"
            size="sm"
            variant="flat"
            startContent={
              <Icon
                icon="lucide:refresh-cw"
                className="text-sm"
                aria-hidden="true"
              />
            }
            onPress={onResetSelection}
            type="button"
            isDisabled={!isResetButtonEnabled()}
            aria-label="선택된 이미지 모두 초기화"
          >
            선택 초기화
          </Button>

          <Button
            color="primary"
            size="sm"
            variant="solid"
            startContent={
              <Icon
                icon="lucide:plus-circle"
                className="text-sm"
                aria-hidden="true"
              />
            }
            onPress={onAddSelectedImages}
            type="button"
            isDisabled={!isSelectedModeButtonEnabled()}
            aria-label={`선택된 ${selectedCount}개 이미지로 갤러리 뷰 생성`}
          >
            {selectedModeButtonText}
          </Button>
        </div>

        <div
          className="flex items-center gap-2"
          role="toolbar"
          aria-label="선택 모드 설정 도구"
        >
          <ButtonGroup
            isDisabled={isDisabled}
            role="radiogroup"
            aria-label="선택 모드 레이아웃 선택"
          >
            <Button
              size="sm"
              variant={view === 'grid' ? 'solid' : 'flat'}
              color={view === 'grid' ? 'secondary' : 'default'}
              onPress={() => handleViewSelect('grid')}
              startContent={
                <Icon
                  icon="lucide:layout-grid"
                  className="text-sm"
                  aria-hidden="true"
                />
              }
              type="button"
              aria-label="균등 그리드 레이아웃"
              aria-pressed={view === 'grid'}
              role="radio"
            >
              그리드
            </Button>
            <Button
              size="sm"
              variant={view === 'masonry' ? 'solid' : 'flat'}
              color={view === 'masonry' ? 'secondary' : 'default'}
              onPress={() => handleViewSelect('masonry')}
              startContent={
                <Icon
                  icon="lucide:layout-dashboard"
                  className="text-sm"
                  aria-hidden="true"
                />
              }
              type="button"
              aria-label="매스너리 레이아웃"
              aria-pressed={view === 'masonry'}
              role="radio"
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
                  <Icon
                    icon="lucide:arrow-up-down"
                    className="text-sm"
                    aria-hidden="true"
                  />
                }
                type="button"
                isDisabled={isDisabled}
                aria-label={`현재 정렬: ${sortLabel}`}
              >
                정렬: {sortLabel}
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
                  <Icon
                    icon="lucide:grid-3x3"
                    className="text-sm"
                    aria-hidden="true"
                  />
                }
                type="button"
                isDisabled={isDisabled}
                aria-label={`현재 ${columns}열 그리드`}
              >
                {columns}열
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="열 개수 옵션"
              onAction={(key) => handleColumnsSelect(Number(key))}
            >
              {columnOptions.map((num) => (
                <DropdownItem key={num}>{num}열</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    );
  };

  const renderStatusChips = () => {
    console.log('🔧 renderStatusChips 렌더링');

    return (
      <div
        className="flex flex-wrap items-center gap-2 text-sm text-default-600"
        role="status"
        aria-live="polite"
        aria-label="현재 갤러리 상태 정보"
      >
        <span>사용 가능한 이미지 {availableCount}개</span>

        <Chip size="sm" variant="flat" color="secondary">
          {viewDisplayName}
        </Chip>

        <Chip size="sm" variant="flat" color="primary">
          {columns}열
        </Chip>

        {mode === 'all' ? (
          <Chip size="sm" variant="flat" color="success">
            전체 모드
          </Chip>
        ) : null}

        {mode === 'selected' && selectedCount > 0 ? (
          <Chip size="sm" variant="flat" color="warning">
            {selectedCount}개 선택됨
          </Chip>
        ) : null}

        {mode === 'selected' && selectedCount === 0 ? (
          <Chip size="sm" variant="flat" color="danger">
            이미지를 선택해주세요
          </Chip>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {mode === 'all' ? renderAllModeControls() : renderSelectedModeControls()}
      {renderStatusChips()}
    </div>
  );
}

export default ViewBuilderControls;
