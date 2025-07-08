// blogMediaStep/imageUpload/parts/ImageList.tsx

import React from 'react';
import { Icon } from '@iconify/react';
import ImageCard from './ImageCard';

interface ImageListProps {
  mediaFiles: string[];
  selectedFileNames: string[];
  touchActiveImages: Set<number>;
  isMobileDevice: boolean;
  onImageTouch: (imageIndex: number) => void;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;
}

function ImageList({
  mediaFiles,
  selectedFileNames,
  touchActiveImages,
  isMobileDevice,
  onImageTouch,
  onDeleteButtonClick,
}: ImageListProps): React.ReactNode {
  console.log('📋 [IMAGE_LIST] ImageList 렌더링:', {
    mediaFilesCount: mediaFiles.length,
    selectedFileNamesCount: selectedFileNames.length,
    touchActiveImagesCount: touchActiveImages.size,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  const shouldShowScrollGuide = mediaFiles.length > 4;

  return (
    <div className="relative">
      <style>{`.scroll-hidden::-webkit-scrollbar { display: none; }`}</style>

      <ul
        className="flex gap-3 pb-2 overflow-x-auto scroll-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        role="list"
        aria-label="업로드된 이미지 목록"
      >
        {mediaFiles.map((imageUrl, imageIndex) => {
          const imageDisplayName =
            selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;
          const isTouchActive = touchActiveImages.has(imageIndex);

          return (
            <ImageCard
              key={`image-card-${imageIndex}-${imageDisplayName}`}
              imageUrl={imageUrl}
              imageIndex={imageIndex}
              imageDisplayName={imageDisplayName}
              isTouchActive={isTouchActive}
              isMobileDevice={isMobileDevice}
              onImageTouch={onImageTouch}
              onDeleteButtonClick={onDeleteButtonClick}
            />
          );
        })}
      </ul>

      {shouldShowScrollGuide && (
        <div className="absolute top-0 right-0 z-10 flex items-center justify-center w-8 h-8 text-gray-400 pointer-events-none">
          <Icon
            icon="lucide:chevron-right"
            className="w-4 h-4"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export default ImageList;
