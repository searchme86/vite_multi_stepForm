// 📁 imageUpload/parts/ImageCard.tsx

import React, { memo, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import MainImageIndicator from '../../mainImage/parts/MainImageIndicator';

const logger = createLogger('IMAGE_CARD');

// ✅ Props 인터페이스 완전 제거 (작업지시서 목표 달성)
// ❌ interface ImageCardProps - 완전 삭제됨
// ✅ Context Only 패턴으로 완전 전환

function ImageCard(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const {
    uploadedImages,
    selectedFileNames,
    touchActiveImages,
    isMobileDevice,
    handleImageTouch,
    handleDeleteButtonClick,
    mainImageHandlers,
  } = useImageUploadContext();

  logger.debug('ImageCard 렌더링 - Context Only 패턴', {
    uploadedImagesCount: uploadedImages.length,
    selectedFileNamesCount: selectedFileNames.length,
    touchActiveImagesCount: touchActiveImages.size,
    isMobileDevice,
    hasMainImageHandlers: mainImageHandlers !== null,
  });

  // 🚀 성능 최적화: 이미지 카드 데이터 메모이제이션
  const imageCardDataList = useMemo(() => {
    logger.debug('이미지 카드 데이터 메모이제이션 실행', {
      imageCount: uploadedImages.length,
    });

    return uploadedImages.map((imageUrl, imageIndex) => {
      const imageDisplayName =
        selectedFileNames[imageIndex] !== undefined
          ? selectedFileNames[imageIndex]
          : `이미지 ${imageIndex + 1}`;

      const isTouchActive = touchActiveImages.has(imageIndex);
      const uniqueKey = `image-card-${imageIndex}-${imageDisplayName}`;

      return {
        imageUrl,
        imageIndex,
        imageDisplayName,
        isTouchActive,
        uniqueKey,
      };
    });
  }, [uploadedImages, selectedFileNames, touchActiveImages]);

  // 🔧 early return으로 빈 상태 처리
  if (imageCardDataList.length === 0) {
    logger.debug('표시할 이미지가 없어서 렌더링 안함');
    return null;
  }

  // 🚀 성능 최적화: 개별 이미지 카드 렌더링 함수
  const renderSingleImageCard = useCallback(
    (cardData: {
      imageUrl: string;
      imageIndex: number;
      imageDisplayName: string;
      isTouchActive: boolean;
      uniqueKey: string;
    }) => {
      const {
        imageUrl,
        imageIndex,
        imageDisplayName,
        isTouchActive,
        uniqueKey,
      } = cardData;

      // 🔧 유효하지 않은 이미지 URL 처리
      if (imageUrl.length === 0) {
        logger.warn('유효하지 않은 이미지 URL', { imageIndex });
        return null;
      }

      // 🚀 성능 최적화: 메인 이미지 상태 계산
      const mainImageStatusInfo = useMemo(() => {
        const hasMainImageHandlers = mainImageHandlers !== null;

        if (!hasMainImageHandlers) {
          logger.debug('메인 이미지 핸들러 없음', {
            imageIndex,
            imageDisplayName,
          });

          return {
            isMainImage: false,
            canSetAsMainImage: false,
            hasHandlers: false,
          };
        }

        const { checkIsMainImage, checkCanSetAsMainImage } = mainImageHandlers;
        const isCurrentMainImage = checkIsMainImage(imageUrl);
        const canSetMainImage = checkCanSetAsMainImage(imageUrl);

        logger.debug('메인 이미지 상태 계산 완료', {
          imageIndex,
          imageDisplayName,
          isCurrentMainImage,
          canSetMainImage,
        });

        return {
          isMainImage: isCurrentMainImage,
          canSetAsMainImage: canSetMainImage,
          hasHandlers: true,
        };
      }, [mainImageHandlers, imageUrl, imageIndex, imageDisplayName]);

      // 🚀 성능 최적화: 이벤트 핸들러 메모이제이션
      const handleImageClickEvent = useCallback(() => {
        logger.debug('이미지 클릭 이벤트 처리', {
          imageIndex,
          imageDisplayName,
          isMobileDevice,
        });

        // 🔧 early return으로 중첩 방지
        if (!isMobileDevice) {
          logger.debug('모바일 디바이스가 아니므로 터치 이벤트 무시', {
            imageIndex,
            imageDisplayName,
          });
          return;
        }

        handleImageTouch(imageIndex);
      }, [isMobileDevice, imageIndex, imageDisplayName]);

      const handleDeleteClickEvent = useCallback(
        (clickEvent: React.MouseEvent) => {
          clickEvent.stopPropagation();

          logger.debug('삭제 버튼 클릭 이벤트 처리', {
            imageIndex,
            imageDisplayName,
          });

          handleDeleteButtonClick(imageIndex, imageDisplayName);
        },
        [imageIndex, imageDisplayName]
      );

      const handleMainImageSetClickEvent = useCallback(
        (clickEvent: React.MouseEvent) => {
          clickEvent.stopPropagation();

          logger.debug('메인 이미지 설정 버튼 클릭 이벤트 처리', {
            imageIndex,
            imageDisplayName,
          });

          const hasMainImageHandlers = mainImageHandlers !== null;
          const { canSetAsMainImage: canSetMainImage } = mainImageStatusInfo;

          // 🔧 early return으로 중첩 방지
          if (!hasMainImageHandlers) {
            logger.warn('메인 이미지 핸들러가 없음', {
              imageIndex,
              imageDisplayName,
            });
            return;
          }

          if (!canSetMainImage) {
            logger.warn('메인 이미지로 설정할 수 없음', {
              imageIndex,
              imageDisplayName,
            });
            return;
          }

          const { onMainImageSet } = mainImageHandlers;
          onMainImageSet(imageIndex, imageUrl);
        },
        [
          mainImageHandlers,
          mainImageStatusInfo,
          imageIndex,
          imageDisplayName,
          imageUrl,
        ]
      );

      const handleMainImageCancelClickEvent = useCallback(
        (clickEvent: React.MouseEvent) => {
          clickEvent.stopPropagation();

          logger.debug('메인 이미지 해제 버튼 클릭 이벤트 처리', {
            imageIndex,
            imageDisplayName,
          });

          const hasMainImageHandlers = mainImageHandlers !== null;
          const { isMainImage: isCurrentMainImage } = mainImageStatusInfo;

          // 🔧 early return으로 중첩 방지
          if (!hasMainImageHandlers) {
            logger.warn('메인 이미지 핸들러가 없음', {
              imageIndex,
              imageDisplayName,
            });
            return;
          }

          if (!isCurrentMainImage) {
            logger.warn('현재 메인 이미지가 아님', {
              imageIndex,
              imageDisplayName,
            });
            return;
          }

          const { onMainImageCancel } = mainImageHandlers;
          onMainImageCancel();
        },
        [mainImageHandlers, mainImageStatusInfo, imageIndex, imageDisplayName]
      );

      const handleImageLoadEvent = useCallback(
        (loadEvent: React.SyntheticEvent<HTMLImageElement>) => {
          const { currentTarget: loadedImageElement } = loadEvent;
          const { naturalWidth, naturalHeight } = loadedImageElement;

          logger.debug('이미지 로드 완료', {
            imageIndex,
            imageDisplayName,
            naturalWidth,
            naturalHeight,
          });
        },
        [imageIndex, imageDisplayName]
      );

      const handleImageErrorEvent = useCallback(
        (errorEvent: React.SyntheticEvent<HTMLImageElement>) => {
          logger.error('이미지 로드 실패', {
            imageIndex,
            imageDisplayName,
            errorEvent,
          });
        },
        [imageIndex, imageDisplayName]
      );

      // 🚀 성능 최적화: 파일 크기 계산 메모이제이션
      const fileSizeInKB = useMemo(() => {
        const sizeInKB = Math.round(imageUrl.length / 1024);

        logger.debug('파일 크기 계산', {
          imageIndex,
          imageDisplayName,
          sizeInKB,
        });

        return sizeInKB;
      }, [imageUrl, imageIndex, imageDisplayName]);

      // 🚀 성능 최적화: 스타일 구성 메모이제이션
      const styleConfiguration = useMemo(() => {
        const { isMainImage: isCurrentMainImage } = mainImageStatusInfo;

        const cardClassName = `relative flex-shrink-0 overflow-hidden transition-shadow duration-300 bg-white border-2 rounded-lg shadow-sm hover:shadow-lg w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 ${
          isCurrentMainImage
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-200'
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

        const mainImageButtonClassName = `absolute z-20 flex items-center justify-center transition-all duration-300 transform shadow-lg rounded-lg hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 w-6 h-6 top-1.5 right-9 sm:w-8 sm:h-8 sm:top-2 sm:right-11 ${
          isMobileDevice
            ? isTouchActive
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
            : 'opacity-0 group-hover:opacity-100'
        }`;

        return {
          cardClassName,
          overlayClassName,
          deleteButtonClassName,
          mainImageButtonClassName,
        };
      }, [mainImageStatusInfo.isMainImage, isMobileDevice, isTouchActive]);

      // 🔧 구조분해할당으로 데이터 접근
      const { isMainImage, canSetAsMainImage } = mainImageStatusInfo;
      const {
        cardClassName,
        overlayClassName,
        deleteButtonClassName,
        mainImageButtonClassName,
      } = styleConfiguration;

      return (
        <li
          key={uniqueKey}
          data-image-card={true}
          className={cardClassName}
          role="listitem"
          aria-labelledby={`image-title-${imageIndex}`}
          onClick={handleImageClickEvent}
        >
          <MainImageIndicator
            isMainImage={isMainImage}
            position="top-left"
            size="md"
            showLabel={false}
          />

          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <img
              src={imageUrl}
              alt={`업로드된 이미지 ${imageIndex + 1}: ${imageDisplayName}`}
              className="object-cover w-full h-full"
              onLoad={handleImageLoadEvent}
              onError={handleImageErrorEvent}
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
                <span>{fileSizeInKB} KB</span>
                {isMainImage ? (
                  <span className="ml-2 px-1 py-0.5 text-xs bg-blue-500 rounded">
                    메인
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {isMainImage ? (
            <button
              type="button"
              className={`${mainImageButtonClassName} bg-orange-500 hover:bg-orange-600 focus:ring-orange-500`}
              onClick={handleMainImageCancelClickEvent}
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
            <button
              type="button"
              className={`${mainImageButtonClassName} bg-green-500 hover:bg-green-600 focus:ring-green-500`}
              onClick={handleMainImageSetClickEvent}
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

          <button
            type="button"
            className={deleteButtonClassName}
            onClick={handleDeleteClickEvent}
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
    },
    [
      isMobileDevice,
      handleImageTouch,
      handleDeleteButtonClick,
      mainImageHandlers,
    ]
  );

  return (
    <>{imageCardDataList.map((cardData) => renderSingleImageCard(cardData))}</>
  );
}

export default memo(ImageCard);
