// blogMediaStep/imageGallery/parts/viewBuilder/ImageViewBuilderPanel.tsx - ImageGallery 컴포넌트

import React, { useState, useCallback } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useImageViewBuilder } from '../../hooks/viewBuilder/useImageViewBuilder';
import { useLayoutItemSize } from '../../hooks/layout/useLayoutItemSize';
import { formatFileSize } from '../../utils/galleryUtils';
import { createColumnOptions } from '../../utils/viewBuilderUtils';

interface ImageViewBuilderPanelProps {
  mediaFiles: string[];
  mainImage: string | null;
  sliderImages: string[];
}

function ImageViewBuilderPanel({
  mediaFiles,
  mainImage,
  sliderImages,
}: ImageViewBuilderPanelProps): React.ReactNode {
  console.log('🔧 ImageViewBuilderPanel 렌더링 시작:', {
    mediaCount: mediaFiles.length,
    hasMainImage: !!mainImage,
    sliderCount: sliderImages.length,
  });

  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const viewBuilder = useImageViewBuilder(view, sortBy, sortOrder);
  const layoutItemSize = useLayoutItemSize();
  const columnOptions = createColumnOptions();

  const handleViewChange = useCallback((newView: 'grid' | 'masonry') => {
    console.log('🔧 handleViewChange 호출:', { newView });
    setView(newView);
    console.log('✅ handleViewChange 완료');
  }, []);

  const handleSortChange = useCallback(
    (newSortBy: 'index' | 'name' | 'size', newSortOrder: 'asc' | 'desc') => {
      console.log('🔧 handleSortChange 호출:', { newSortBy, newSortOrder });
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      console.log('✅ handleSortChange 완료');
    },
    []
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.02 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  console.log('📊 ImageViewBuilderPanel 상태:', {
    view,
    sortBy,
    sortOrder,
    selectedCount: viewBuilder.safeImageViewConfig.selectedImages.length,
    filteredCount: viewBuilder.filteredAndSortedImages.length,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              color="warning"
              size="sm"
              variant="flat"
              startContent={
                <Icon icon="lucide:refresh-cw" className="text-sm" />
              }
              onPress={viewBuilder.resetSelection}
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
              onPress={viewBuilder.handleAddToPreview}
              type="button"
              isDisabled={
                viewBuilder.safeImageViewConfig.selectedImages.length === 0
              }
            >
              해당 뷰로 추가
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ButtonGroup>
              <Button
                size="sm"
                variant={view === 'grid' ? 'solid' : 'flat'}
                onPress={() => handleViewChange('grid')}
                startContent={
                  <Icon icon="lucide:layout-grid" className="text-sm" />
                }
              >
                그리드
              </Button>
              <Button
                size="sm"
                variant={view === 'masonry' ? 'solid' : 'flat'}
                onPress={() => handleViewChange('masonry')}
                startContent={
                  <Icon icon="lucide:layout-dashboard" className="text-sm" />
                }
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
                >
                  정렬
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="정렬 옵션">
                <DropdownItem
                  key="index-asc"
                  onPress={() => handleSortChange('index', 'asc')}
                >
                  업로드순
                </DropdownItem>
                <DropdownItem
                  key="name-asc"
                  onPress={() => handleSortChange('name', 'asc')}
                >
                  이름 (A-Z)
                </DropdownItem>
                <DropdownItem
                  key="name-desc"
                  onPress={() => handleSortChange('name', 'desc')}
                >
                  이름 (Z-A)
                </DropdownItem>
                <DropdownItem
                  key="size-desc"
                  onPress={() => handleSortChange('size', 'desc')}
                >
                  큰 파일순
                </DropdownItem>
                <DropdownItem
                  key="size-asc"
                  onPress={() => handleSortChange('size', 'asc')}
                >
                  작은 파일순
                </DropdownItem>
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
                >
                  {viewBuilder.safeImageViewConfig.layout.columns}열
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="열 개수 옵션">
                {columnOptions.map((num) => (
                  <DropdownItem
                    key={num}
                    onPress={() => viewBuilder.updateColumns(num)}
                  >
                    {num}열
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-default-600">
          <span>
            사용 가능한 이미지 {viewBuilder.filteredAndSortedImages.length}개
          </span>
          <Chip size="sm" variant="flat" color="secondary">
            {view === 'grid' ? '균등 그리드' : '매스너리 레이아웃'}
          </Chip>
          <Chip size="sm" variant="flat" color="primary">
            {viewBuilder.safeImageViewConfig.layout.columns}열
          </Chip>
        </div>
      </div>

      {viewBuilder.filteredAndSortedImages.length > 0 ? (
        <motion.div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${viewBuilder.safeImageViewConfig.layout.columns}, 1fr)`,
            gridAutoRows: '120px',
          }}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {viewBuilder.filteredAndSortedImages.map((image, index) => {
              const isSelected = viewBuilder.isImageSelected(image.url);

              const itemStyles = layoutItemSize.getItemStyles(
                index,
                view,
                viewBuilder.safeImageViewConfig.layout.columns
              );

              console.log('🖼️ 뷰빌더 이미지 아이템 렌더링:', {
                index,
                imageName: image.name,
                isSelected,
                itemStyles,
              });

              return (
                <motion.div
                  key={image.url}
                  layout
                  variants={item}
                  className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  style={{
                    gridColumn: itemStyles.gridColumn,
                    gridRow: itemStyles.gridRow,
                    minHeight: '120px',
                  }}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-lg bg-default-100">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-110"
                      onClick={() => viewBuilder.handleImageClick(image.url)}
                    />

                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0">
                      <p className="text-xs font-medium truncate">
                        {image.name}
                      </p>
                      <p className="text-xs opacity-80">
                        {formatFileSize(image.size)}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute inset-0 bg-primary bg-opacity-20"></div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="p-8 text-center rounded-lg bg-default-100">
          <Icon
            icon="lucide:image-off"
            className="w-12 h-12 mx-auto mb-3 text-default-400"
            aria-hidden="true"
          />
          <p className="mb-3 text-default-600">
            사용 가능한 이미지가 없습니다.
          </p>
          <p className="text-sm text-default-500">
            메인 이미지나 슬라이더로 사용되지 않은 이미지만 선택할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageViewBuilderPanel;
