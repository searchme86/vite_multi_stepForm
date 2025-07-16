// 📁 imageUpload/components/ImageCard.tsx

import React, { useMemo, useCallback } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';

interface ImageCardProps {
  readonly imageIndex: number;
  readonly imageUrl: string;
  readonly fileName: string;
  readonly isMainImage?: boolean;
  readonly isSelected?: boolean;
  readonly showControls?: boolean;
  readonly onImageClick?: (imageIndex: number) => void;
  readonly onMainImageToggle?: (imageIndex: number, imageUrl: string) => void;
}

interface ImageCardState {
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly isProcessing: boolean;
  readonly uploadProgress: number;
}

interface TouchState {
  readonly isActive: boolean;
  readonly startTime: number;
}

const checkIsPlaceholderUrl = (url: string): boolean => {
  return url.startsWith('placeholder-') && url.includes('-processing');
};

const extractUploadProgress = (
  uploading: Record<string, number>,
  fileName: string
): number => {
  const progress = Reflect.get(uploading, fileName);
  return typeof progress === 'number' ? progress : 0;
};

const extractUploadStatus = (
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>,
  fileName: string
): 'uploading' | 'success' | 'error' | 'idle' => {
  const status = Reflect.get(uploadStatus, fileName);
  return typeof status === 'string' &&
    ['uploading', 'success', 'error'].includes(status)
    ? status
    : 'idle';
};

const checkIsTouchActive = (
  touchActiveImages: Record<number, boolean>,
  imageIndex: number
): boolean => {
  const isActive = Reflect.get(touchActiveImages, imageIndex);
  return typeof isActive === 'boolean' ? isActive : false;
};

export const ImageCard: React.FC<ImageCardProps> = ({
  imageIndex,
  imageUrl,
  fileName,
  isMainImage = false,
  isSelected = false,
  showControls = true,
  onImageClick,
  onMainImageToggle,
}) => {
  console.log('🖼️ [IMAGE_CARD] Map 기반 이미지 카드 렌더링:', {
    imageIndex,
    fileName,
    imageUrl: imageUrl.slice(0, 30) + '...',
    isMainImage,
    isSelected,
  });

  const {
    uploading,
    uploadStatus,
    touchActiveImages,
    handleDeleteButtonClick,
    handleImageTouch,
    mainImageHandlers,
    isMobileDevice,
  } = useImageUploadContext();

  const cardState = useMemo((): ImageCardState => {
    const isPlaceholder = checkIsPlaceholderUrl(imageUrl);
    const uploadProgress = extractUploadProgress(uploading, fileName);
    const currentUploadStatus = extractUploadStatus(uploadStatus, fileName);

    return {
      isLoading: isPlaceholder || currentUploadStatus === 'uploading',
      hasError: currentUploadStatus === 'error',
      isProcessing: isPlaceholder,
      uploadProgress,
    };
  }, [imageUrl, fileName, uploading, uploadStatus]);

  const touchState = useMemo((): TouchState => {
    const isActive = checkIsTouchActive(touchActiveImages, imageIndex);
    return {
      isActive,
      startTime: Date.now(),
    };
  }, [touchActiveImages, imageIndex]);

  const handleImageClickSafely = useCallback(() => {
    try {
      console.log('🖱️ [IMAGE_CARD] 이미지 클릭 처리:', {
        imageIndex,
        fileName,
        hasClickHandler: onImageClick !== undefined,
      });

      const hasClickHandler = typeof onImageClick === 'function';
      if (hasClickHandler) {
        onImageClick(imageIndex);
      }
    } catch (error) {
      console.error('❌ [IMAGE_CARD] 이미지 클릭 처리 실패:', error);
    }
  }, [imageIndex, fileName, onImageClick]);

  const handleDeleteClickSafely = useCallback(() => {
    try {
      console.log('🗑️ [IMAGE_CARD] 삭제 버튼 클릭:', {
        imageIndex,
        fileName,
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      handleDeleteButtonClick(imageIndex, imageUrl);
    } catch (error) {
      console.error('❌ [IMAGE_CARD] 삭제 처리 실패:', error);
    }
  }, [imageIndex, fileName, imageUrl, handleDeleteButtonClick]);

  const handleMainImageToggleSafely = useCallback(() => {
    try {
      console.log('⭐ [IMAGE_CARD] 메인 이미지 토글:', {
        imageIndex,
        fileName,
        currentIsMainImage: isMainImage,
      });

      if (isMainImage) {
        mainImageHandlers.onMainImageCancel();
      } else {
        const canSetAsMain = mainImageHandlers.checkCanSetAsMainImage(imageUrl);
        if (canSetAsMain) {
          mainImageHandlers.onMainImageSet(imageIndex, imageUrl);
        }
      }

      const hasToggleHandler = typeof onMainImageToggle === 'function';
      if (hasToggleHandler) {
        onMainImageToggle(imageIndex, imageUrl);
      }
    } catch (error) {
      console.error('❌ [IMAGE_CARD] 메인 이미지 토글 실패:', error);
    }
  }, [
    imageIndex,
    fileName,
    imageUrl,
    isMainImage,
    mainImageHandlers,
    onMainImageToggle,
  ]);

  const handleTouchStartSafely = useCallback(() => {
    try {
      const isMobile = isMobileDevice;
      if (isMobile) {
        console.log('📱 [IMAGE_CARD] 모바일 터치 시작:', {
          imageIndex,
          fileName,
        });

        handleImageTouch(imageIndex);
      }
    } catch (error) {
      console.error('❌ [IMAGE_CARD] 터치 처리 실패:', error);
    }
  }, [imageIndex, fileName, isMobileDevice, handleImageTouch]);

  const canSetAsMainImage = useMemo(() => {
    return mainImageHandlers.checkCanSetAsMainImage(imageUrl);
  }, [imageUrl, mainImageHandlers]);

  const imageAltText = useMemo(() => {
    return `${fileName} 이미지${isMainImage ? ' (메인 이미지)' : ''}`;
  }, [fileName, isMainImage]);

  const cardClassName = useMemo(() => {
    const baseClasses = [
      'relative',
      'rounded-lg',
      'overflow-hidden',
      'border-2',
      'transition-all',
      'duration-200',
      'cursor-pointer',
    ];

    if (isMainImage) {
      baseClasses.push('border-blue-500', 'ring-2', 'ring-blue-200');
    } else if (isSelected) {
      baseClasses.push('border-green-500', 'ring-2', 'ring-green-200');
    } else {
      baseClasses.push('border-gray-200', 'hover:border-gray-300');
    }

    if (cardState.hasError) {
      baseClasses.push('border-red-500', 'bg-red-50');
    }

    if (touchState.isActive) {
      baseClasses.push('scale-95', 'opacity-75');
    }

    return baseClasses.join(' ');
  }, [isMainImage, isSelected, cardState.hasError, touchState.isActive]);

  const progressBarStyle = useMemo(() => {
    const progressPercentage = Math.max(
      0,
      Math.min(100, cardState.uploadProgress)
    );
    return {
      width: `${progressPercentage}%`,
      transition: 'width 0.3s ease-in-out',
    };
  }, [cardState.uploadProgress]);

  return (
    <article
      className={cardClassName}
      onClick={handleImageClickSafely}
      onTouchStart={handleTouchStartSafely}
      role="button"
      tabIndex={0}
      aria-label={imageAltText}
    >
      <header className="relative">
        <img
          src={imageUrl}
          alt={imageAltText}
          className={`w-full h-48 object-cover ${
            cardState.isLoading ? 'opacity-50' : 'opacity-100'
          }`}
          loading="lazy"
          draggable={false}
        />

        {cardState.isLoading && (
          <section className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25">
            <div className="text-sm font-medium text-white">
              {cardState.isProcessing
                ? '처리 중...'
                : `${cardState.uploadProgress}%`}
            </div>
          </section>
        )}

        {cardState.isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200">
            <div
              className="h-full transition-all duration-300 bg-blue-500"
              style={progressBarStyle}
            />
          </div>
        )}

        {cardState.hasError && (
          <section className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75">
            <div className="text-sm font-medium text-white">업로드 실패</div>
          </section>
        )}
      </header>

      {showControls && !cardState.isLoading && (
        <footer className="absolute flex gap-2 top-2 right-2">
          {canSetAsMainImage && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleMainImageToggleSafely();
              }}
              className={`px-2 py-1 text-xs rounded ${
                isMainImage
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={
                isMainImage ? '메인 이미지 해제' : '메인 이미지로 설정'
              }
            >
              {isMainImage ? '메인' : '메인 설정'}
            </button>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleDeleteClickSafely();
            }}
            className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
            aria-label={`${fileName} 삭제`}
          >
            삭제
          </button>
        </footer>
      )}

      <main className="p-3">
        <h3
          className="text-sm font-medium text-gray-900 truncate"
          title={fileName}
        >
          {fileName}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {isMainImage && '⭐ 메인 이미지'}
            {isSelected && !isMainImage && '✓ 선택됨'}
            {!isMainImage && !isSelected && cardState.hasError && '❌ 오류'}
            {!isMainImage && !isSelected && !cardState.hasError && '📷 이미지'}
          </span>

          {cardState.isLoading && (
            <span className="text-xs font-medium text-blue-600">
              {cardState.uploadProgress}%
            </span>
          )}
        </div>
      </main>
    </article>
  );
};
