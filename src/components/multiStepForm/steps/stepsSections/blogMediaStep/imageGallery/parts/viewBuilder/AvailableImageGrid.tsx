// blogMediaStep/imageGallery/parts/viewBuilder/AvailableImageGrid.tsx - ImageGallery 컴포넌트

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLayoutItemSize } from '../../hooks/layout/useLayoutItemSize';
import { ImageFileInfo } from '../../utils/galleryUtils';
import { formatFileSize } from '../../utils/galleryUtils';

interface AvailableImageGridProps {
  filteredAndSortedImages: ImageFileInfo[];
  selectedImages: string[];
  view: 'grid' | 'masonry';
  columns: number;
  onImageClick: (imageUrl: string) => void;
  isImageSelected: (imageUrl: string) => boolean;
}

function AvailableImageGrid({
  filteredAndSortedImages,
  selectedImages,
  view,
  columns,
  onImageClick,
  isImageSelected,
}: AvailableImageGridProps): React.ReactNode {
  console.log('🔧 AvailableImageGrid 렌더링:', {
    imageCount: filteredAndSortedImages.length,
    selectedCount: selectedImages.length,
    view,
    columns,
  });

  const layoutItemSize = useLayoutItemSize();

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

  if (filteredAndSortedImages.length === 0) {
    console.log('📷 AvailableImageGrid 사용 가능한 이미지 없음');

    return (
      <div className="p-8 text-center rounded-lg bg-default-100">
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
  });

  return (
    <motion.div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridAutoRows: '120px',
      }}
      variants={container}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {filteredAndSortedImages.map((image, index) => {
          const isSelected = isImageSelected(image.url);

          const itemStyles = layoutItemSize.getItemStyles(index, view, columns);

          console.log('🖼️ AvailableImageGrid 이미지 아이템:', {
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
                  onClick={() => onImageClick(image.url)}
                />

                <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0">
                  <p className="text-xs font-medium truncate">{image.name}</p>
                  <p className="text-xs opacity-80">
                    {formatFileSize(image.size)}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 bg-primary bg-opacity-20">
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center justify-center w-6 h-6 text-white rounded-full bg-primary">
                        <Icon icon="lucide:check" className="text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shadow-lg bg-default-800">
                    {index + 1}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

export default AvailableImageGrid;
