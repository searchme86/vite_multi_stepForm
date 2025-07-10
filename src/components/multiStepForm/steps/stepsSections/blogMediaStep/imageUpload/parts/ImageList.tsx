// blogMediaStep/imageUpload/parts/ImageList.tsx

import React from 'react';
import { Icon } from '@iconify/react';
import ImageCard from './ImageCard';
import { type MainImageHandlers } from '../types/imageUploadTypes';

interface ImageListProps {
  mediaFiles: string[];
  selectedFileNames: string[];
  touchActiveImages: Set<number>;
  isMobileDevice: boolean;
  onImageTouch: (imageIndex: number) => void;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;

  // ✅ Phase3: 메인 이미지 관련 props 추가
  mainImageHandlers?: MainImageHandlers;
}

function ImageList({
  mediaFiles,
  selectedFileNames,
  touchActiveImages,
  isMobileDevice,
  onImageTouch,
  onDeleteButtonClick,

  // ✅ Phase3: 메인 이미지 핸들러 구조분해할당
  mainImageHandlers,
}: ImageListProps): React.ReactNode {
  console.log('📋 [IMAGE_LIST] ImageList 렌더링 - Phase3 메인이미지기능추가:', {
    mediaFilesCount: mediaFiles.length,
    selectedFileNamesCount: selectedFileNames.length,
    touchActiveImagesCount: touchActiveImages.size,
    isMobileDevice,
    hasMainImageHandlers: mainImageHandlers ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ Phase3: 메인 이미지 핸들러들 구조분해할당 (fallback 처리)
  const {
    onMainImageSet: handleMainImageSetAction,
    onMainImageCancel: handleMainImageCancelAction,
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
  } = mainImageHandlers ?? {
    onMainImageSet: undefined,
    onMainImageCancel: undefined,
    checkIsMainImage: undefined,
    checkCanSetAsMainImage: undefined,
  };

  const hasMainImageHandlers = mainImageHandlers ? true : false;
  const shouldShowScrollGuide = mediaFiles.length > 4;

  console.log('📋 [IMAGE_LIST] 메인 이미지 핸들러 상태 - Phase3:', {
    hasMainImageHandlers,
    hasSetHandler: handleMainImageSetAction ? true : false,
    hasCancelHandler: handleMainImageCancelAction ? true : false,
    hasCheckIsMainHandler: checkIsMainImageFunction ? true : false,
    hasCheckCanSetHandler: checkCanSetAsMainImageFunction ? true : false,
  });

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
            selectedFileNames[imageIndex] ?? `이미지 ${imageIndex + 1}`;
          const isTouchActive = touchActiveImages.has(imageIndex);

          // ✅ Phase3: 메인 이미지 상태 체크 (안전하게 호출)
          const isCurrentMainImage = checkIsMainImageFunction
            ? checkIsMainImageFunction(imageUrl)
            : false;

          const canSetAsMainImage = checkCanSetAsMainImageFunction
            ? checkCanSetAsMainImageFunction(imageUrl)
            : false;

          console.log('🖼️ [IMAGE_LIST] ImageCard 렌더링 준비:', {
            imageIndex,
            imageDisplayName,
            isCurrentMainImage,
            canSetAsMainImage,
            hasMainImageHandlers,
            timestamp: new Date().toLocaleTimeString(),
          });

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
              // ✅ Phase3: 메인 이미지 관련 props 전달
              isMainImage={isCurrentMainImage}
              canSetAsMainImage={canSetAsMainImage}
              onMainImageSet={handleMainImageSetAction}
              onMainImageCancel={handleMainImageCancelAction}
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
