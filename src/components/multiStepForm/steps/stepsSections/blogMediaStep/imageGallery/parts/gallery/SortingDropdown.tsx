// blogMediaStep/imageGallery/parts/gallery/SortingDropdown.tsx - ImageGallery 컴포넌트

import React, { useMemo } from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { Icon } from '@iconify/react';

interface SortingOption {
  key: string;
  label: string;
  sortBy: 'index' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
}

interface SortingDropdownProps {
  currentSortBy: 'index' | 'name' | 'size';
  onSortChange: (
    sortBy: 'index' | 'name' | 'size',
    sortOrder: 'asc' | 'desc'
  ) => void;
}

function SortingDropdown({
  currentSortBy,
  onSortChange,
}: SortingDropdownProps): React.ReactNode {
  console.log('🔧 SortingDropdown 렌더링:', { currentSortBy });

  const sortingOptions: SortingOption[] = useMemo(
    () => [
      {
        key: 'index-asc',
        label: '업로드순',
        sortBy: 'index',
        sortOrder: 'asc',
      },
      {
        key: 'name-asc',
        label: '이름 (A-Z)',
        sortBy: 'name',
        sortOrder: 'asc',
      },
      {
        key: 'name-desc',
        label: '이름 (Z-A)',
        sortBy: 'name',
        sortOrder: 'desc',
      },
      {
        key: 'size-desc',
        label: '큰 파일순',
        sortBy: 'size',
        sortOrder: 'desc',
      },
      {
        key: 'size-asc',
        label: '작은 파일순',
        sortBy: 'size',
        sortOrder: 'asc',
      },
    ],
    []
  );

  const currentOption = useMemo(() => {
    return sortingOptions.find((option) => option.sortBy === currentSortBy);
  }, [sortingOptions, currentSortBy]);

  const handleSortSelect = (key: string) => {
    console.log('🔧 handleSortSelect 호출:', { key });

    const option = sortingOptions.find((opt) => opt.key === key);
    if (option) {
      onSortChange(option.sortBy, option.sortOrder);
      console.log('✅ handleSortSelect 완료:', {
        sortBy: option.sortBy,
        sortOrder: option.sortOrder,
      });
    }
  };

  console.log('📊 SortingDropdown 상태:', {
    currentSortBy,
    currentOptionLabel: currentOption?.label,
    totalOptions: sortingOptions.length,
  });

  return (
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
          정렬: {currentOption?.label || '업로드순'}
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="정렬 옵션"
        onAction={(key) => handleSortSelect(String(key))}
      >
        {sortingOptions.map((option) => (
          <DropdownItem
            key={option.key}
            className={currentSortBy === option.sortBy ? 'bg-primary-50' : ''}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

export default SortingDropdown;
