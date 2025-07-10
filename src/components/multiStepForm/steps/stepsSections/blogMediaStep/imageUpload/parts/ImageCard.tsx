// blogMediaStep/imageUpload/parts/ImageCard.tsx

import React from 'react';
import { Icon } from '@iconify/react';
import MainImageIndicator from '../../mainImage/parts/MainImageIndicator';

interface ImageCardProps {
  imageUrl: string;
  imageIndex: number;
  imageDisplayName: string;
  isTouchActive: boolean;
  isMobileDevice: boolean;
  onImageTouch: (imageIndex: number) => void;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;

  // ✅ Phase2: 메인 이미지 관련 props 추가
  isMainImage?: boolean;
  canSetAsMainImage?: boolean;
  onMainImageSet?: (imageIndex: number, imageUrl: string) => void;
  onMainImageCancel?: () => void;
}

function ImageCard({
  imageUrl,
  imageIndex,
  imageDisplayName,
  isTouchActive,
  isMobileDevice,
  onImageTouch,
  onDeleteButtonClick,

  // ✅ Phase2: 메인 이미지 관련 props (기본값 설정)
  isMainImage = false,
  canSetAsMainImage = false,
  onMainImageSet,
  onMainImageCancel,
}: ImageCardProps): React.ReactNode {
  const imageKeyForReact = `uploaded-image-${imageIndex}-${imageDisplayName}`;

  console.log('🖼️ [IMAGE_CARD] ImageCard 렌더링 - 왕관위치변경:', {
    imageIndex,
    imageDisplayName,
    isTouchActive,
    isMobileDevice,
    isMainImage,
    canSetAsMainImage,
    hasMainImageSetHandler: typeof onMainImageSet === 'function',
    hasMainImageCancelHandler: typeof onMainImageCancel === 'function',
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleImageClick = () => {
    if (!isMobileDevice) {
      return;
    }
    onImageTouch(imageIndex);
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteButtonClick(imageIndex, imageDisplayName);
  };

  // ✅ Phase2: 메인 이미지 설정 핸들러
  const handleMainImageSetClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    console.log('🏠 [MAIN_IMAGE_SET] 메인 이미지 설정 버튼 클릭:', {
      imageIndex,
      imageDisplayName,
      canSetAsMainImage,
    });

    if (!onMainImageSet) {
      console.log('⚠️ [MAIN_IMAGE_SET] 메인 이미지 설정 핸들러가 없음');
      return;
    }

    if (!canSetAsMainImage) {
      console.log('⚠️ [MAIN_IMAGE_SET] 메인 이미지로 설정할 수 없음');
      return;
    }

    onMainImageSet(imageIndex, imageUrl);
  };

  // ✅ Phase2: 메인 이미지 해제 핸들러
  const handleMainImageCancelClick = (event: React.MouseEvent) => {
    event.stopPropagation();

    console.log('❌ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 버튼 클릭:', {
      imageIndex,
      imageDisplayName,
      isMainImage,
    });

    if (!onMainImageCancel) {
      console.log('⚠️ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 핸들러가 없음');
      return;
    }

    if (!isMainImage) {
      console.log('⚠️ [MAIN_IMAGE_CANCEL] 현재 메인 이미지가 아님');
      return;
    }

    onMainImageCancel();
  };

  const handleImageLoad = (
    loadEvent: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const { currentTarget: loadedImage } = loadEvent;
    const { naturalWidth, naturalHeight } = loadedImage;

    console.log('🖼️ [IMAGE_LOAD] 이미지 로드 완료:', {
      imageIndex,
      imageDisplayName,
      naturalWidth,
      naturalHeight,
    });
  };

  const handleImageError = (
    errorEvent: React.SyntheticEvent<HTMLImageElement>
  ) => {
    console.error('❌ [IMAGE_ERROR] 이미지 로드 실패:', {
      imageIndex,
      imageDisplayName,
      errorEvent,
    });
  };

  const getFileSizeInKB = (url: string): number => {
    return Math.round(url.length / 1024);
  };

  // ✅ Phase2: 메인 이미지 상태에 따른 스타일 조정
  const cardClassName = `relative flex-shrink-0 overflow-hidden transition-shadow duration-300 bg-white border-2 rounded-lg shadow-sm hover:shadow-lg w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 ${
    isMainImage ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
  } ${isMobileDevice ? 'cursor-pointer' : 'group'}`;

  const overlayClassName = `absolute inset-x-0 bottom-0 z-10 transition-all duration-300 transform bg-black bg-opacity-70 backdrop-blur-sm ${
    isMobileDevice
      ? isTouchActive
        ? 'translate-y-0'
        : 'translate-y-full'
      : 'translate-y-full group-hover:translate-y-0'
  }`;

  const deleteButtonClassName = `absolute z-20 flex items-center justify-center transition-all duration-300 transform bg-red-500 shadow-lg rounded-lg hover:bg-red-600 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-6 h-6 top-1.5 right-1.5 sm:w-8 sm:h-8 sm:top-2 sm:right-2 ${
    isMobileDevice
      ? isTouchActive
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none'
      : 'opacity-0 group-hover:opacity-100'
  }`;

  // ✅ 수정: 메인 이미지 버튼을 삭제 버튼 왼쪽에 위치 (5px 간격)
  const mainImageButtonClassName = `absolute z-20 flex items-center justify-center transition-all duration-300 transform shadow-lg rounded-lg hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 w-6 h-6 top-1.5 right-9 sm:w-8 sm:h-8 sm:top-2 sm:right-11 ${
    isMobileDevice
      ? isTouchActive
        ? 'opacity-100'
        : 'opacity-0 pointer-events-none'
      : 'opacity-0 group-hover:opacity-100'
  }`;

  return (
    <li
      key={imageKeyForReact}
      data-image-card={true}
      className={cardClassName}
      role="listitem"
      aria-labelledby={`image-title-${imageIndex}`}
      onClick={handleImageClick}
    >
      {/* ✅ 왕관: 숫자 카운팅 제거 - 더 이상 숫자 표시 안함 */}

      {/* ✅ 왕관: 메인 이미지 표시기를 좌측 상단으로 이동 */}
      <MainImageIndicator
        isMainImage={isMainImage}
        position="top-left"
        size="md"
        showLabel={false}
      />

      {/* 이미지 표시 영역 */}
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <img
          src={imageUrl}
          alt={`업로드된 이미지 ${imageIndex + 1}: ${imageDisplayName}`}
          className="object-cover w-full h-full"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* 오버레이 정보 영역 */}
      <div className={overlayClassName}>
        <div className="p-2 text-white sm:p-3">
          <h4
            id={`image-title-${imageIndex}`}
            className="text-xs font-medium truncate sm:text-sm"
            title={imageDisplayName}
          >
            {imageDisplayName}
          </h4>
          <div className="mt-1 text-xs text-gray-200">
            <span>{getFileSizeInKB(imageUrl)} KB</span>
            {/* ✅ Phase2: 메인 이미지 상태 표시 */}
            {isMainImage && (
              <span className="ml-2 px-1 py-0.5 text-xs bg-blue-500 rounded">
                메인
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ✅ 수정: 메인 이미지 관리 버튼들 (삭제 버튼 왼쪽에 먼저 배치) */}
      {isMainImage ? (
        // 현재 메인 이미지인 경우 → 해제 버튼 표시 (삭제 버튼 왼쪽)
        <button
          type="button"
          className={`${mainImageButtonClassName} bg-orange-500 hover:bg-orange-600 focus:ring-orange-500`}
          onClick={handleMainImageCancelClick}
          aria-label={`${imageDisplayName} 메인 이미지 해제`}
          title="메인 이미지 해제"
        >
          <Icon
            icon="lucide:x"
            className="w-3 h-3 text-white sm:w-4 sm:h-4"
            aria-hidden="true"
          />
        </button>
      ) : canSetAsMainImage ? (
        // 메인 이미지로 설정 가능한 경우 → 홈 버튼 표시 (삭제 버튼 왼쪽)
        <button
          type="button"
          className={`${mainImageButtonClassName} bg-green-500 hover:bg-green-600 focus:ring-green-500`}
          onClick={handleMainImageSetClick}
          aria-label={`${imageDisplayName} 메인 이미지로 설정`}
          title="메인 이미지로 설정"
        >
          <Icon
            icon="lucide:home"
            className="w-3 h-3 text-white sm:w-4 sm:h-4"
            aria-hidden="true"
          />
        </button>
      ) : null}

      {/* 삭제 버튼 (가장 오른쪽) */}
      <button
        type="button"
        className={deleteButtonClassName}
        onClick={handleDeleteClick}
        aria-label={`${imageDisplayName} 이미지 삭제`}
        title={`${imageDisplayName} 이미지 삭제`}
      >
        <Icon
          icon="lucide:trash-2"
          className="w-3 h-3 text-white sm:w-4 sm:h-4"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

export default ImageCard;
