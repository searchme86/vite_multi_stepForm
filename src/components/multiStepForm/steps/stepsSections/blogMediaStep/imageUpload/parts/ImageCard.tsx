// blogMediaStep/imageUpload/parts/ImageCard.tsx

import React from 'react';
import { Icon } from '@iconify/react';

interface ImageCardProps {
  imageUrl: string;
  imageIndex: number;
  imageDisplayName: string;
  isTouchActive: boolean;
  isMobileDevice: boolean;
  onImageTouch: (imageIndex: number) => void;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;
}

function ImageCard({
  imageUrl,
  imageIndex,
  imageDisplayName,
  isTouchActive,
  isMobileDevice,
  onImageTouch,
  onDeleteButtonClick,
}: ImageCardProps): React.ReactNode {
  const imageKeyForReact = `uploaded-image-${imageIndex}-${imageDisplayName}`;

  console.log('🖼️ [IMAGE_CARD] ImageCard 렌더링:', {
    imageIndex,
    imageDisplayName,
    isTouchActive,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleImageClick = () => {
    if (!isMobileDevice) {
      return;
    }
    onImageTouch(imageIndex);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteButtonClick(imageIndex, imageDisplayName);
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

  const cardClassName = `relative flex-shrink-0 overflow-hidden transition-shadow duration-300 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 ${
    isMobileDevice ? 'cursor-pointer' : 'group'
  }`;

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

  return (
    <li
      key={imageKeyForReact}
      data-image-card={true}
      className={cardClassName}
      role="listitem"
      aria-labelledby={`image-title-${imageIndex}`}
      onClick={handleImageClick}
    >
      <div className="absolute z-20 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full shadow-md top-1.5 left-1.5 sm:w-6 sm:h-6 sm:top-2 sm:left-2">
        {imageIndex + 1}
      </div>

      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <img
          src={imageUrl}
          alt={`업로드된 이미지 ${imageIndex + 1}: ${imageDisplayName}`}
          className="object-cover w-full h-full"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

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
          </div>
        </div>
      </div>

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
