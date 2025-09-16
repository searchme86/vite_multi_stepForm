// blogMediaStep/imageGallery/parts/viewBuilder/AvailableImageGrid.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Chip } from '@heroui/react';
import { useLayoutItemSize } from '../../hooks/layout/useLayoutItemSize';
import { type ImageFileInfo } from '../../utils/galleryUtils';
import { formatFileSize } from '../../utils/galleryUtils';

interface AvailableImageGridProps {
  filteredAndSortedImages: ImageFileInfo[];
  selectedImages: string[];
  view: 'grid' | 'masonry';
  columns: number;
  mode: 'all' | 'selected';
  onImageClick: (imageUrl: string) => void;
  isImageSelected: (imageUrl: string) => boolean;
  isDisabled?: boolean;
}

function AvailableImageGrid({
  filteredAndSortedImages,
  selectedImages,
  view,
  columns,
  mode,
  onImageClick,
  isImageSelected,
  isDisabled = false,
}: AvailableImageGridProps): React.ReactNode {
  console.log('🔧 AvailableImageGrid 렌더링:', {
    imageCount: filteredAndSortedImages.length,
    selectedCount: selectedImages.length,
    view,
    columns,
    mode,
    isDisabled,
  });

  const layoutItemSize = useLayoutItemSize();

  const handleImageInteraction = (imageUrl: string) => {
    console.log('🔧 handleImageInteraction 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
      mode,
      isDisabled,
    });

    if (isDisabled) {
      console.log('⚠️ 비활성화 상태에서 이미지 클릭 시도');
      return;
    }

    if (mode === 'all') {
      console.log('📋 전체 모드에서는 이미지 선택 불가');
      return;
    }

    if (mode === 'selected') {
      onImageClick(imageUrl);
      console.log('✅ 선택 모드에서 이미지 클릭 처리 완료');
    }
  };

  const handleKeyboardInteraction = (
    keyboardEvent: React.KeyboardEvent,
    imageUrl: string
  ) => {
    console.log('🔧 handleKeyboardInteraction 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
      mode,
    });

    const { key: pressedKey } = keyboardEvent;

    const isActivationKey = pressedKey === 'Enter' || pressedKey === ' ';
    if (!isActivationKey) {
      return;
    }

    keyboardEvent.preventDefault();
    handleImageInteraction(imageUrl);

    console.log('✅ handleKeyboardInteraction 완료');
  };

  const getImageCursorStyle = (): string => {
    if (isDisabled) return 'cursor-not-allowed';
    if (mode === 'all') return 'cursor-default';
    if (mode === 'selected') return 'cursor-pointer';
    return 'cursor-default';
  };

  const getImageAriaLabel = (
    image: ImageFileInfo,
    isSelected: boolean
  ): string => {
    const { name: imageName, size: imageSize } = image;
    const sizeText = formatFileSize(imageSize);

    if (mode === 'all') {
      return `${imageName}, ${sizeText}, 전체 모드에서 보기 전용`;
    }

    if (mode === 'selected') {
      const selectionText = isSelected ? '선택됨' : '선택되지 않음';
      return `${imageName}, ${sizeText}, ${selectionText}, 클릭하여 선택 상태 변경`;
    }

    return `${imageName}, ${sizeText}`;
  };

  const getImageTabIndex = (): number => {
    return mode === 'selected' && !isDisabled ? 0 : -1;
  };

  const shouldShowSelectionIndicator = (imageUrl: string): boolean => {
    return mode === 'selected' && isImageSelected(imageUrl);
  };

  const shouldShowModeIndicator = (): boolean => {
    return mode === 'all';
  };

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

  const imageCursorStyle = getImageCursorStyle();
  const imageTabIndex = getImageTabIndex();
  const showModeIndicator = shouldShowModeIndicator();

  if (filteredAndSortedImages.length === 0) {
    console.log('📷 AvailableImageGrid 사용 가능한 이미지 없음');

    return (
      <div
        className="p-8 text-center rounded-lg bg-default-100"
        role="status"
        aria-label="사용 가능한 이미지가 없음"
      >
        <Icon
          icon="lucide:image-off"
          className="w-12 h-12 mx-auto mb-3 text-default-400"
          aria-hidden="true"
        />
        <p className="mb-3 text-default-600">사용 가능한 이미지가 없습니다.</p>
        <p className="text-sm text-default-500">
          메인 이미지나 슬라이더로 사용되지 않은 이미지만 선택할 수 있습니다.
        </p>
      </div>
    );
  }

  console.log('🎨 AvailableImageGrid 그리드 렌더링:', {
    imageCount: filteredAndSortedImages.length,
    view,
    columns,
    mode,
  });

  return (
    <div className="space-y-4">
      {showModeIndicator ? (
        <div className="flex items-center justify-center p-3 rounded-lg bg-primary-50">
          <Chip
            size="md"
            variant="flat"
            color="primary"
            startContent={
              <Icon icon="lucide:eye" className="text-sm" aria-hidden="true" />
            }
          >
            전체 모드 - 모든 이미지 보기 (클릭 비활성화)
          </Chip>
        </div>
      ) : null}

      <motion.div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: '120px',
        }}
        variants={container}
        initial="hidden"
        animate="show"
        role="grid"
        aria-label={`사용 가능한 이미지 ${
          view === 'grid' ? '균등 그리드' : '매스너리'
        } 레이아웃`}
        aria-rowcount={Math.ceil(filteredAndSortedImages.length / columns)}
        aria-colcount={columns}
      >
        <AnimatePresence>
          {filteredAndSortedImages.map((image, index) => {
            const isSelected = shouldShowSelectionIndicator(image.url);
            const itemStyles = layoutItemSize.getItemStyles(
              index,
              view,
              columns
            );
            const imageAriaLabel = getImageAriaLabel(image, isSelected);

            const gridRowIndex = Math.floor(index / columns) + 1;
            const gridColIndex = (index % columns) + 1;

            console.log('🖼️ AvailableImageGrid 이미지 아이템:', {
              index,
              imageName: image.name,
              isSelected,
              mode,
              itemStyles,
            });

            return (
              <motion.div
                key={image.url}
                layout
                variants={item}
                className={`relative group transition-all duration-200 ${
                  mode === 'selected' ? 'hover:scale-105' : ''
                } ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                } ${imageCursorStyle}`}
                style={{
                  gridColumn: itemStyles.gridColumn,
                  gridRow: itemStyles.gridRow,
                  minHeight: '120px',
                }}
                role="gridcell"
                aria-rowindex={gridRowIndex}
                aria-colindex={gridColIndex}
                tabIndex={imageTabIndex}
                aria-label={imageAriaLabel}
                onClick={() => handleImageInteraction(image.url)}
                onKeyDown={(keyboardEvent) =>
                  handleKeyboardInteraction(keyboardEvent, image.url)
                }
              >
                <div className="relative w-full h-full overflow-hidden rounded-lg bg-default-100">
                  <img
                    src={image.url}
                    alt={`갤러리 이미지: ${image.name}`}
                    className={`object-cover w-full h-full transition-transform duration-200 ${
                      mode === 'selected' && !isDisabled
                        ? 'group-hover:scale-110'
                        : ''
                    } ${mode === 'all' ? 'opacity-80' : ''}`}
                    loading="lazy"
                    draggable={false}
                  />

                  {mode === 'all' ? (
                    <div className="absolute inset-0 bg-default-500 bg-opacity-10" />
                  ) : null}

                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0 group-focus-visible:translate-y-0">
                    <p
                      className="text-xs font-medium truncate"
                      title={image.name}
                    >
                      {image.name}
                    </p>
                    <p className="text-xs opacity-80">
                      {formatFileSize(image.size)}
                    </p>
                  </div>

                  {isSelected ? (
                    <div className="absolute inset-0 bg-primary bg-opacity-20">
                      <div className="absolute flex items-center justify-center w-8 h-8 text-white rounded-full shadow-lg top-2 right-2 bg-primary">
                        <Icon
                          icon="lucide:check"
                          className="text-sm"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Chip
                          size="sm"
                          variant="solid"
                          color="primary"
                          className="text-xs"
                        >
                          선택됨
                        </Chip>
                      </div>
                    </div>
                  ) : null}

                  {mode === 'selected' && !isSelected && !isDisabled ? (
                    <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-secondary bg-opacity-10 group-hover:opacity-100">
                      <div className="absolute flex items-center justify-center w-8 h-8 text-white transition-opacity duration-300 rounded-full opacity-0 top-2 right-2 bg-secondary group-hover:opacity-100">
                        <Icon
                          icon="lucide:plus"
                          className="text-sm"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="absolute top-2 left-2">
                    <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg bg-default-800">
                      {index + 1}
                    </div>
                  </div>

                  {mode === 'all' ? (
                    <div className="absolute top-2 right-2">
                      <Chip
                        size="sm"
                        variant="solid"
                        color="default"
                        startContent={
                          <Icon
                            icon="lucide:eye"
                            className="text-xs"
                            aria-hidden="true"
                          />
                        }
                        className="opacity-80"
                      >
                        보기 전용
                      </Chip>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {mode === 'selected' && selectedImages.length === 0 ? (
        <div
          className="p-4 text-center border rounded-lg bg-warning-50 border-warning-200"
          role="status"
          aria-live="polite"
        >
          <Icon
            icon="lucide:mouse-pointer-click"
            className="w-8 h-8 mx-auto mb-2 text-warning-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-warning-800">
            이미지를 클릭하여 선택해주세요
          </p>
          <p className="text-xs text-warning-600">
            선택된 이미지들로 커스텀 갤러리를 만들 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default AvailableImageGrid;
