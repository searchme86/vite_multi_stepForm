// 📁 imageUpload/parts/ImageList.tsx

import React, { memo, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import { ImageCard } from './ImageCard';

const logger = createLogger('IMAGE_LIST');

interface ImageItemData {
  readonly imageIndex: number;
  readonly imageUrl: string;
  readonly fileName: string;
  readonly isMainImage: boolean;
  readonly isSelected: boolean;
}

const checkIsMainImage = (
  imageUrl: string,
  mainImageHandlers: { checkIsMainImage: (url: string) => boolean } | null
): boolean => {
  if (
    !mainImageHandlers ||
    typeof mainImageHandlers.checkIsMainImage !== 'function'
  ) {
    return false;
  }

  try {
    return mainImageHandlers.checkIsMainImage(imageUrl);
  } catch (error) {
    console.warn('⚠️ [IMAGE_LIST] 메인 이미지 확인 실패:', error);
    return false;
  }
};

const checkIsSelectedForSlider = (
  imageIndex: number,
  isImageSelectedForSlider: ((index: number) => boolean) | null
): boolean => {
  if (
    !isImageSelectedForSlider ||
    typeof isImageSelectedForSlider !== 'function'
  ) {
    return false;
  }

  try {
    return isImageSelectedForSlider(imageIndex);
  } catch (error) {
    console.warn('⚠️ [IMAGE_LIST] 슬라이더 선택 확인 실패:', error);
    return false;
  }
};

function ImageList(): React.ReactElement | null {
  const {
    uploadedImages,
    selectedFileNames,
    touchActiveImages,
    isMobileDevice,
    mainImageHandlers,
    isImageSelectedForSlider,
  } = useImageUploadContext();

  logger.debug('ImageList 렌더링 - Map 기반 순서 배열', {
    uploadedImagesCount: uploadedImages.length,
    selectedFileNamesCount: selectedFileNames.length,
    touchActiveImagesKeys: Object.keys(touchActiveImages).length,
    isMobileDevice,
    hasMainImageHandlers: mainImageHandlers !== null,
  });

  const imageItemsData = useMemo((): ImageItemData[] => {
    const imageCount = uploadedImages.length;
    const nameCount = selectedFileNames.length;

    if (imageCount === 0) {
      return [];
    }

    if (imageCount !== nameCount) {
      console.warn('⚠️ [IMAGE_LIST] 이미지와 파일명 개수 불일치:', {
        imageCount,
        nameCount,
      });
    }

    const maxIndex = Math.min(imageCount, nameCount);
    const items: ImageItemData[] = [];

    for (let index = 0; index < maxIndex; index++) {
      const imageUrl = uploadedImages[index];
      const fileName = selectedFileNames[index];

      if (!imageUrl || !fileName) {
        console.warn('⚠️ [IMAGE_LIST] 누락된 데이터:', {
          index,
          hasImageUrl: Boolean(imageUrl),
          hasFileName: Boolean(fileName),
        });
        continue;
      }

      const isMainImage = checkIsMainImage(imageUrl, mainImageHandlers);
      const isSelected = checkIsSelectedForSlider(
        index,
        isImageSelectedForSlider
      );

      items.push({
        imageIndex: index,
        imageUrl,
        fileName,
        isMainImage,
        isSelected,
      });
    }

    console.log('📋 [IMAGE_LIST] 이미지 데이터 생성 완료:', {
      totalItems: items.length,
      mainImageCount: items.filter((item) => item.isMainImage).length,
      selectedCount: items.filter((item) => item.isSelected).length,
    });

    return items;
  }, [
    uploadedImages,
    selectedFileNames,
    mainImageHandlers,
    isImageSelectedForSlider,
  ]);

  const scrollGuideConfiguration = useMemo(() => {
    const imageCount = imageItemsData.length;
    const shouldShowScrollGuide = imageCount > 4;

    logger.debug('스크롤 가이드 설정 계산', {
      imageCount,
      shouldShowScrollGuide,
    });

    return {
      shouldShow: shouldShowScrollGuide,
      imageCount,
    };
  }, [imageItemsData.length]);

  const containerStyleConfiguration = useMemo(() => {
    const baseClassName = 'flex gap-3 pb-2 overflow-x-auto scroll-hidden';
    const scrollHiddenStyle = {
      scrollbarWidth: 'none' as const,
      msOverflowStyle: 'none' as const,
    };

    return {
      className: baseClassName,
      style: scrollHiddenStyle,
    };
  }, []);

  const accessibilityAttributes = useMemo(() => {
    const imageCount = imageItemsData.length;
    const ariaLabel = `업로드된 이미지 목록 (총 ${imageCount}개)`;

    return {
      role: 'list' as const,
      'aria-label': ariaLabel,
      'aria-live': 'polite' as const,
    };
  }, [imageItemsData.length]);

  const handleImageClick = useCallback((imageIndex: number) => {
    try {
      console.log('🖱️ [IMAGE_LIST] 이미지 클릭 처리:', {
        imageIndex,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 추가 클릭 처리 로직이 필요하면 여기에 구현
    } catch (error) {
      console.error('❌ [IMAGE_LIST] 이미지 클릭 처리 실패:', error);
    }
  }, []);

  const handleMainImageToggle = useCallback(
    (imageIndex: number, imageUrl: string) => {
      try {
        console.log('⭐ [IMAGE_LIST] 메인 이미지 토글 처리:', {
          imageIndex,
          imageUrl: imageUrl.slice(0, 30) + '...',
        });

        // 메인 이미지 토글 로직은 ImageCard 내부에서 처리됨
      } catch (error) {
        console.error('❌ [IMAGE_LIST] 메인 이미지 토글 처리 실패:', error);
      }
    },
    []
  );

  const renderImageCard = useCallback(
    (item: ImageItemData) => {
      const { imageIndex, imageUrl, fileName, isMainImage, isSelected } = item;

      return (
        <li key={`${imageIndex}-${fileName}`} role="listitem">
          <ImageCard
            imageIndex={imageIndex}
            imageUrl={imageUrl}
            fileName={fileName}
            isMainImage={isMainImage}
            isSelected={isSelected}
            showControls={true}
            onImageClick={handleImageClick}
            onMainImageToggle={handleMainImageToggle}
          />
        </li>
      );
    },
    [handleImageClick, handleMainImageToggle]
  );

  const { shouldShow: shouldShowScrollGuide } = scrollGuideConfiguration;
  const { className: containerClassName, style: containerStyle } =
    containerStyleConfiguration;

  if (imageItemsData.length === 0) {
    logger.debug('표시할 이미지가 없어서 렌더링 안함');
    return null;
  }

  return (
    <div className="relative">
      <style>{`.scroll-hidden::-webkit-scrollbar { display: none; }`}</style>

      <ul
        className={containerClassName}
        style={containerStyle}
        {...accessibilityAttributes}
      >
        {imageItemsData.map(renderImageCard)}
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

export default memo(ImageList);
