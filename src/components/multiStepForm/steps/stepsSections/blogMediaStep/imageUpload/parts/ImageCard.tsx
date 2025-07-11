// 📁 imageUpload/parts/ImageCard.tsx

import React, { memo, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import MainImageIndicator from '../../mainImage/parts/MainImageIndicator';

const logger = createLogger('IMAGE_CARD');

function ImageCard(): React.ReactNode {
  const {
    uploadedImages,
    selectedFileNames,
    touchActiveImages,
    isMobileDevice,
    selectedSliderIndices,
    isImageSelectedForSlider,
    handleImageTouch,
    handleDeleteButtonClick,
    mainImageHandlers,
  } = useImageUploadContext();

  logger.debug('ImageCard 렌더링 - 메인이미지 및 슬라이더 기능 추가됨', {
    uploadedImagesCount: uploadedImages.length,
    selectedFileNamesCount: selectedFileNames.length,
    touchActiveImagesCount: touchActiveImages.size,
    selectedSliderIndicesCount: selectedSliderIndices.length,
    isMobileDevice,
    hasMainImageHandlers: mainImageHandlers !== null,
  });

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

  const allMainImageStates = useMemo(() => {
    const hasMainImageHandlers = mainImageHandlers !== null;

    if (!hasMainImageHandlers) {
      logger.debug('메인 이미지 핸들러 없음 - 모든 이미지 비활성');

      return imageCardDataList.map(() => ({
        isMainImage: false,
        canSetAsMainImage: false,
        hasHandlers: false,
      }));
    }

    const { checkIsMainImage, checkCanSetAsMainImage } = mainImageHandlers;

    return imageCardDataList.map(
      ({ imageUrl, imageIndex, imageDisplayName }) => {
        const isCurrentMainImage = checkIsMainImage(imageUrl);
        const canSetMainImage = checkCanSetAsMainImage(imageUrl);

        logger.debug('메인 이미지 상태 계산', {
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
      }
    );
  }, [mainImageHandlers, imageCardDataList]);

  const allSliderSelectionStates = useMemo(() => {
    return imageCardDataList.map(({ imageIndex, imageDisplayName }) => {
      const isSliderSelected = isImageSelectedForSlider(imageIndex);

      logger.debug('슬라이더 선택 상태 계산', {
        imageIndex,
        imageDisplayName,
        isSliderSelected,
        selectedSliderIndices,
      });

      return {
        isSliderSelected,
      };
    });
  }, [imageCardDataList, isImageSelectedForSlider, selectedSliderIndices]);

  const allFileSizes = useMemo(() => {
    return imageCardDataList.map(
      ({ imageUrl, imageIndex, imageDisplayName }) => {
        const sizeInKB = Math.round(imageUrl.length / 1024);

        logger.debug('파일 크기 계산', {
          imageIndex,
          imageDisplayName,
          sizeInKB,
        });

        return sizeInKB;
      }
    );
  }, [imageCardDataList]);

  const allStyleConfigurations = useMemo(() => {
    return imageCardDataList.map(({ isTouchActive }, cardIndex) => {
      const mainImageState = allMainImageStates[cardIndex];
      const sliderSelectionState = allSliderSelectionStates[cardIndex];
      const { isMainImage: isCurrentMainImage } = mainImageState;
      const { isSliderSelected: isCurrentSliderSelected } =
        sliderSelectionState;

      // 🎯 카드 링 스타일 결정
      let cardRingClassName = '';
      if (isCurrentMainImage && isCurrentSliderSelected) {
        // 메인 + 슬라이더 선택: 파란색 메인 링 + 초록색 보조 링
        cardRingClassName =
          'ring-4 ring-blue-300 ring-offset-2 ring-offset-green-200';
      } else if (isCurrentMainImage) {
        // 메인 이미지만: 파란색 링
        cardRingClassName = 'ring-4 ring-blue-300';
      } else if (isCurrentSliderSelected) {
        // 슬라이더 선택만: 초록색 링
        cardRingClassName = 'ring-4 ring-green-400';
      }

      // 🎯 카드 보더 스타일 결정
      let cardBorderClassName = '';
      if (isCurrentMainImage && isCurrentSliderSelected) {
        // 메인 + 슬라이더: 복합 보더
        cardBorderClassName =
          'border-blue-500 bg-gradient-to-r from-blue-50 to-green-50';
      } else if (isCurrentMainImage) {
        // 메인 이미지: 파란색 보더
        cardBorderClassName = 'border-blue-500';
      } else if (isCurrentSliderSelected) {
        // 슬라이더 선택: 초록색 보더
        cardBorderClassName = 'border-green-500';
      } else {
        // 일반 이미지: 기본 보더
        cardBorderClassName = 'border-gray-200';
      }

      const cardClassName = `relative flex-shrink-0 overflow-hidden transition-all duration-300 bg-white border-2 rounded-lg shadow-sm hover:shadow-lg w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 ${cardBorderClassName} ${
        isMobileDevice ? 'cursor-pointer' : 'group'
      } ${cardRingClassName}`;

      // 🎯 이미지 블러 처리 (메인 이미지만)
      const imageClassName = isCurrentMainImage
        ? 'object-cover w-full h-full opacity-60 transition-opacity duration-300'
        : 'object-cover w-full h-full transition-opacity duration-300';

      const overlayClassName = `absolute inset-x-0 bottom-0 z-10 transition-all duration-300 transform bg-black bg-opacity-70 backdrop-blur-sm ${
        isMobileDevice
          ? isTouchActive
            ? 'translate-y-0'
            : 'translate-y-full'
          : 'translate-y-full group-hover:translate-y-0'
      }`;

      // 🎯 메인 이미지일 때는 터치 무시하도록 처리
      const shouldPreventInteraction = isCurrentMainImage;

      // 🎯 버튼들은 항상 선명하게 - 메인 이미지일 때도 명확히 보이도록
      const deleteButtonClassName = `absolute z-30 flex items-center justify-center transition-all duration-300 transform bg-red-500 shadow-lg rounded-lg hover:bg-red-600 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-6 h-6 top-1.5 right-1.5 sm:w-8 sm:h-8 sm:top-2 sm:right-2 ${
        shouldPreventInteraction
          ? 'opacity-50 cursor-not-allowed pointer-events-none'
          : isMobileDevice
          ? isTouchActive
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
          : 'opacity-0 group-hover:opacity-100'
      }`;

      // 🎯 메인 이미지 버튼들 - 삭제 버튼과 동일한 사이즈로 통일
      const mainImageButtonClassName = `absolute z-30 flex items-center justify-center transition-all duration-300 transform shadow-lg rounded-lg hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 w-6 h-6 top-1.5 right-9 sm:w-8 sm:h-8 sm:top-2 sm:right-11 ${
        isMobileDevice
          ? isTouchActive
            ? 'opacity-100'
            : isCurrentMainImage
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
          : isCurrentMainImage
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100'
      }`;

      return {
        cardClassName,
        imageClassName,
        overlayClassName,
        deleteButtonClassName,
        mainImageButtonClassName,
        shouldPreventInteraction,
      };
    });
  }, [
    imageCardDataList,
    allMainImageStates,
    allSliderSelectionStates,
    isMobileDevice,
  ]);

  const handleImageClickEvent = useCallback(
    (imageIndex: number) => {
      const imageDisplayName =
        selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;

      // 🎯 메인 이미지 상태 확인
      const mainImageState = allMainImageStates[imageIndex];
      const shouldPreventClick = mainImageState
        ? mainImageState.isMainImage
        : false;

      logger.debug('이미지 클릭 이벤트 처리', {
        imageIndex,
        imageDisplayName,
        isMobileDevice,
        shouldPreventClick,
      });

      if (!isMobileDevice) {
        logger.debug('모바일 디바이스가 아니므로 터치 이벤트 무시', {
          imageIndex,
          imageDisplayName,
        });
        return;
      }

      if (shouldPreventClick) {
        logger.debug('메인 이미지는 터치 이벤트 무시', {
          imageIndex,
          imageDisplayName,
        });
        return;
      }

      handleImageTouch(imageIndex);
    },
    [isMobileDevice, selectedFileNames, handleImageTouch, allMainImageStates]
  );

  const handleDeleteClickEvent = useCallback(
    (imageIndex: number, clickEvent: React.MouseEvent) => {
      clickEvent.stopPropagation();

      const imageDisplayName =
        selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;

      // 🎯 메인 이미지는 삭제 방지
      const mainImageState = allMainImageStates[imageIndex];
      const shouldPreventDelete = mainImageState
        ? mainImageState.isMainImage
        : false;

      logger.debug('삭제 버튼 클릭 이벤트 처리', {
        imageIndex,
        imageDisplayName,
        shouldPreventDelete,
      });

      if (shouldPreventDelete) {
        logger.warn('메인 이미지는 삭제할 수 없음', {
          imageIndex,
          imageDisplayName,
        });
        return;
      }

      handleDeleteButtonClick(imageIndex, imageDisplayName);
    },
    [selectedFileNames, handleDeleteButtonClick, allMainImageStates]
  );

  const handleMainImageSetClickEvent = useCallback(
    (imageIndex: number, imageUrl: string, clickEvent: React.MouseEvent) => {
      clickEvent.stopPropagation();

      const imageDisplayName =
        selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;

      logger.debug('메인 이미지 설정 버튼 클릭 이벤트 처리', {
        imageIndex,
        imageDisplayName,
      });

      const hasMainImageHandlers = mainImageHandlers !== null;

      if (!hasMainImageHandlers) {
        logger.warn('메인 이미지 핸들러가 없음', {
          imageIndex,
          imageDisplayName,
        });
        return;
      }

      const { onMainImageSet } = mainImageHandlers;
      onMainImageSet(imageIndex, imageUrl);
    },
    [selectedFileNames, mainImageHandlers]
  );

  const handleMainImageCancelClickEvent = useCallback(
    (imageIndex: number, clickEvent: React.MouseEvent) => {
      clickEvent.stopPropagation();

      const imageDisplayName =
        selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;

      logger.debug('메인 이미지 해제 버튼 클릭 이벤트 처리', {
        imageIndex,
        imageDisplayName,
      });

      const hasMainImageHandlers = mainImageHandlers !== null;

      if (!hasMainImageHandlers) {
        logger.warn('메인 이미지 핸들러가 없음', {
          imageIndex,
          imageDisplayName,
        });
        return;
      }

      const { onMainImageCancel } = mainImageHandlers;
      onMainImageCancel();
    },
    [selectedFileNames, mainImageHandlers]
  );

  const handleImageLoadEvent = useCallback(
    (imageIndex: number, loadEvent: React.SyntheticEvent<HTMLImageElement>) => {
      const { currentTarget: loadedImageElement } = loadEvent;
      const { naturalWidth, naturalHeight } = loadedImageElement;
      const imageDisplayName =
        selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;

      logger.debug('이미지 로드 완료', {
        imageIndex,
        imageDisplayName,
        naturalWidth,
        naturalHeight,
      });
    },
    [selectedFileNames]
  );

  const handleImageErrorEvent = useCallback(
    (
      imageIndex: number,
      errorEvent: React.SyntheticEvent<HTMLImageElement>
    ) => {
      const imageDisplayName =
        selectedFileNames[imageIndex] || `이미지 ${imageIndex + 1}`;

      logger.error('이미지 로드 실패', {
        imageIndex,
        imageDisplayName,
        errorEvent,
      });
    },
    [selectedFileNames]
  );

  if (imageCardDataList.length === 0) {
    logger.debug('표시할 이미지가 없어서 렌더링 안함');
    return null;
  }

  return (
    <>
      {imageCardDataList.map((cardData, cardIndex) => {
        const {
          imageUrl,
          imageIndex,
          imageDisplayName,
          isTouchActive,
          uniqueKey,
        } = cardData;

        if (imageUrl.length === 0) {
          logger.warn('유효하지 않은 이미지 URL', { imageIndex });
          return null;
        }

        const mainImageState = allMainImageStates[cardIndex];
        const sliderSelectionState = allSliderSelectionStates[cardIndex];
        const fileSizeInKB = allFileSizes[cardIndex];
        const styleConfig = allStyleConfigurations[cardIndex];

        const { isMainImage, canSetAsMainImage } = mainImageState;
        const { isSliderSelected } = sliderSelectionState;
        const {
          cardClassName,
          imageClassName,
          overlayClassName,
          deleteButtonClassName,
          mainImageButtonClassName,
          shouldPreventInteraction,
        } = styleConfig;

        return (
          <li
            key={uniqueKey}
            data-image-card={true}
            className={cardClassName}
            role="listitem"
            aria-labelledby={`image-title-${imageIndex}`}
            onClick={() => handleImageClickEvent(imageIndex)}
          >
            <MainImageIndicator
              isMainImage={isMainImage}
              position="top-left"
              size="md"
              showLabel={false}
            />

            {/* 🎯 메인 이미지 뱃지 */}
            {isMainImage ? (
              <div className="absolute z-30 top-2 left-2">
                <div className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-blue-500 rounded shadow-lg">
                  <Icon
                    icon="lucide:home"
                    className="w-3 h-3"
                    aria-hidden="true"
                  />
                  <span>메인</span>
                </div>
              </div>
            ) : null}

            {/* 🎯 슬라이더 선택 뱃지 */}
            {isSliderSelected ? (
              <div
                className={`absolute z-30 ${
                  isMainImage ? 'top-2 left-16' : 'top-2 left-2'
                }`}
              >
                <div className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-green-500 rounded shadow-lg">
                  <Icon
                    icon="lucide:layers"
                    className="w-3 h-3"
                    aria-hidden="true"
                  />
                  <span>슬라이더</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-center w-full h-full bg-gray-100">
              <img
                src={imageUrl}
                alt={`업로드된 이미지 ${imageIndex + 1}: ${imageDisplayName}`}
                className={imageClassName}
                onLoad={(loadEvent) =>
                  handleImageLoadEvent(imageIndex, loadEvent)
                }
                onError={(errorEvent) =>
                  handleImageErrorEvent(imageIndex, errorEvent)
                }
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
                  {isSliderSelected ? (
                    <span className="ml-2 px-1 py-0.5 text-xs bg-green-500 rounded">
                      슬라이더
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {isMainImage ? (
              <button
                type="button"
                className={`${mainImageButtonClassName} bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 ring-2 ring-white`}
                onClick={(clickEvent) =>
                  handleMainImageCancelClickEvent(imageIndex, clickEvent)
                }
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
                onClick={(clickEvent) =>
                  handleMainImageSetClickEvent(imageIndex, imageUrl, clickEvent)
                }
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
              onClick={(clickEvent) =>
                handleDeleteClickEvent(imageIndex, clickEvent)
              }
              aria-label={`${imageDisplayName} 이미지 삭제`}
              title={`${imageDisplayName} 이미지 삭제`}
              disabled={shouldPreventInteraction}
            >
              <Icon
                icon="lucide:trash-2"
                className="w-3 h-3 text-white sm:w-4 sm:h-4"
                aria-hidden="true"
              />
            </button>
          </li>
        );
      })}
    </>
  );
}

export default memo(ImageCard);
