// blogMediaStep/imageSlider/ImageSliderContainer.tsx

import React, { useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import { useImageSlider } from './hooks/useImageSlider';
import { useSliderSelection } from './hooks/useSliderSelection';
import { useSliderOrder } from './hooks/useSliderOrder';

import SliderImageSelector from './parts/SliderImageSelector';
import SelectedSliderImages from './parts/SelectedSliderImages';
import SliderAddButton from './parts/SliderAddButton';

interface ToastConfig {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error' | 'info';
}

function ImageSliderContainer(): React.ReactNode {
  console.log('🚀 ImageSliderContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  // Zustand 스토어에서 직접 상태 가져오기
  const imageGalleryStore = useImageGalleryStore();
  const { imageViewConfig } = imageGalleryStore;

  // Reflect.get을 사용하여 안전한 속성 접근
  const rawSelectedImages = Reflect.get(
    imageViewConfig || {},
    'selectedImages'
  );
  const rawMainImage = Reflect.get(imageViewConfig || {}, 'mainImage');
  const rawSliderImages = Reflect.get(imageViewConfig || {}, 'sliderImages');

  const availableMediaFileList = Array.isArray(rawSelectedImages)
    ? rawSelectedImages
    : [];
  const selectedMainImageUrl =
    typeof rawMainImage === 'string' ? rawMainImage : null;
  const currentSliderImageUrlList = Array.isArray(rawSliderImages)
    ? rawSliderImages
    : [];

  const addToastMessage = useCallback((toastConfig: ToastConfig) => {
    // TODO: 실제 토스트 스토어 연결 필요
    console.log(
      '📢 토스트 메시지:',
      toastConfig.title,
      '-',
      toastConfig.description
    );
  }, []);

  console.log('📊 갤러리 상태 불러오기 완료:', {
    availableMediaCount: availableMediaFileList.length,
    hasMainImage: selectedMainImageUrl !== null,
    mainImageUrl: selectedMainImageUrl
      ? selectedMainImageUrl.slice(0, 30) + '...'
      : null,
    sliderImageCount: currentSliderImageUrlList.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const imageSliderHook = useImageSlider();
  const {
    removeFromSlider: removeImageFromSliderByUrl,
    addSelectedToSlider: addSelectedImageListToSlider,
    clearSliderImages: clearAllSliderImageList,
    getSliderImageCount: getCurrentSliderImageTotalCount,
  } = imageSliderHook || {};

  const sliderSelectionHook = useSliderSelection();
  const {
    selectedSliderImages: selectedImageIndexList = [],
    handleSliderImageSelect: originalHandleSliderImageSelect,
    setSelectedSliderImages: updateSelectedImageIndexList,
  } = sliderSelectionHook || {};

  const sliderOrderHook = useSliderOrder();
  const {
    moveToFirst: moveImageToFirstPosition,
    moveToLast: moveImageToLastPosition,
  } = sliderOrderHook || {};

  console.log('🔧 훅 초기화 완료:', {
    sliderImageCount: currentSliderImageUrlList.length,
    selectedImageCount: selectedImageIndexList.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const availableForSliderImageList = useMemo(() => {
    const hasMainImage =
      selectedMainImageUrl !== null &&
      selectedMainImageUrl !== undefined &&
      selectedMainImageUrl.length > 0;

    if (!hasMainImage) {
      console.log('🔧 메인 이미지 없음 - 모든 이미지가 슬라이더 가능:', {
        totalImages: availableMediaFileList.length,
      });
      return availableMediaFileList;
    }

    const filteredImageList = availableMediaFileList.filter(
      (imageUrl: string) => {
        const isNotMainImage = imageUrl !== selectedMainImageUrl;
        return isNotMainImage;
      }
    );

    console.log('🔧 메인 이미지 제외한 슬라이더 가능 이미지 계산:', {
      totalImages: availableMediaFileList.length,
      mainImageUrl: selectedMainImageUrl.slice(0, 30) + '...',
      filteredCount: filteredImageList.length,
      excludedCount: availableMediaFileList.length - filteredImageList.length,
    });

    return filteredImageList;
  }, [availableMediaFileList, selectedMainImageUrl]);

  const handleImageSelectionToggleByIndex = useCallback(
    (imageIndex: number) => {
      console.log('🔧 handleImageSelectionToggleByIndex 호출:', {
        imageIndex,
        currentSelectedCount: selectedImageIndexList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (originalHandleSliderImageSelect) {
        originalHandleSliderImageSelect(imageIndex);
      }

      console.log('✅ 이미지 선택 토글 완료:', {
        imageIndex,
        finalSelectedCount: selectedImageIndexList.length,
      });
    },
    [originalHandleSliderImageSelect, selectedImageIndexList.length]
  );

  const getSelectedImageUrlListFromIndexList = useCallback(
    (mediaFileUrlList: string[]) => {
      console.log('🔄 getSelectedImageUrlListFromIndexList 호출:', {
        mediaFileCount: mediaFileUrlList.length,
        selectedIndexCount: selectedImageIndexList.length,
      });

      const selectedUrlList = selectedImageIndexList
        .map((imageIndex: number) => {
          const imageUrl = mediaFileUrlList[imageIndex];
          return imageUrl || null;
        })
        .filter((imageUrl): imageUrl is string => imageUrl !== null);

      console.log('✅ 선택된 이미지 URL 목록 생성 완료:', {
        resultCount: selectedUrlList.length,
      });

      return selectedUrlList;
    },
    [selectedImageIndexList]
  );

  const getCurrentSelectedImageCount = useCallback(() => {
    const selectedCount = selectedImageIndexList.length;
    console.log('📊 getCurrentSelectedImageCount:', { selectedCount });
    return selectedCount;
  }, [selectedImageIndexList]);

  const clearCurrentImageSelection = useCallback(() => {
    console.log('🔄 clearCurrentImageSelection 호출');

    if (updateSelectedImageIndexList) {
      updateSelectedImageIndexList([]);
    }

    console.log('✅ 선택 목록 초기화 완료');
  }, [updateSelectedImageIndexList]);

  const selectedImageUrlList = useMemo(
    () => getSelectedImageUrlListFromIndexList(availableMediaFileList),
    [getSelectedImageUrlListFromIndexList, availableMediaFileList]
  );

  const currentSelectedImageCount = useMemo(
    () => getCurrentSelectedImageCount(),
    [getCurrentSelectedImageCount]
  );

  const handleAddSelectedImageListToSlider = useCallback(() => {
    console.log('🔧 handleAddSelectedImageListToSlider 호출:', {
      selectedImageCount: selectedImageUrlList.length,
    });

    const { length: selectedImageCount } = selectedImageUrlList;

    if (selectedImageCount === 0) {
      console.log('❌ 선택된 이미지 없음 - 토스트 표시');
      addToastMessage({
        title: '선택된 이미지가 없습니다',
        description: '슬라이더에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (addSelectedImageListToSlider) {
      addSelectedImageListToSlider(selectedImageUrlList);
    }

    clearCurrentImageSelection();

    console.log('✅ 슬라이더에 이미지 추가 완료:', {
      addedImageCount: selectedImageCount,
    });
  }, [
    selectedImageUrlList,
    addSelectedImageListToSlider,
    clearCurrentImageSelection,
    addToastMessage,
  ]);

  const handleRemoveImageFromSliderByUrl = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleRemoveImageFromSliderByUrl 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (removeImageFromSliderByUrl) {
        removeImageFromSliderByUrl(targetImageUrl);
      }

      addToastMessage({
        title: '슬라이더에서 제거',
        description: '이미지가 슬라이더에서 제거되었습니다.',
        color: 'success',
      });

      console.log('✅ 슬라이더에서 이미지 제거 완료');
    },
    [removeImageFromSliderByUrl, addToastMessage]
  );

  const handleMoveImageToFirstPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleMoveImageToFirstPosition 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (moveImageToFirstPosition) {
        moveImageToFirstPosition(targetImageUrl);
      }

      console.log('✅ 이미지 첫 번째 위치로 이동 완료');
    },
    [moveImageToFirstPosition]
  );

  const handleMoveImageToLastPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleMoveImageToLastPosition 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      if (moveImageToLastPosition) {
        moveImageToLastPosition(targetImageUrl);
      }

      console.log('✅ 이미지 마지막 위치로 이동 완료');
    },
    [moveImageToLastPosition]
  );

  const handleClearAllSliderImageList = useCallback(() => {
    console.log('🔧 handleClearAllSliderImageList 호출');

    if (clearAllSliderImageList) {
      clearAllSliderImageList();
    }

    clearCurrentImageSelection();

    console.log('✅ 모든 슬라이더 이미지 초기화 완료');
  }, [clearAllSliderImageList, clearCurrentImageSelection]);

  const totalAvailableForSliderImageCount = availableForSliderImageList.length;
  const currentSliderImageTotalCount = getCurrentSliderImageTotalCount
    ? getCurrentSliderImageTotalCount()
    : 0;
  const { length: sliderImageCount } = currentSliderImageUrlList;
  const hasSelectedSliderImages = sliderImageCount > 0;
  const hasAvailableImageFiles = availableMediaFileList.length > 0;
  const canCreateSlider = totalAvailableForSliderImageCount >= 3;

  console.log('🎯 슬라이더 최소 조건 검증:', {
    totalAvailableForSliderImageCount,
    canCreateSlider,
    minimumRequired: 3,
  });

  console.log('📊 렌더링 준비 상태:', {
    totalAvailableForSliderImageCount,
    totalOriginalImages: availableMediaFileList.length,
    mainImageExists: selectedMainImageUrl !== null,
    currentSliderImageTotalCount,
    sliderImageCount,
    hasSelectedSliderImages,
    hasAvailableImageFiles,
    currentSelectedImageCount,
    canCreateSlider,
  });

  return (
    <section
      className="space-y-6"
      role="region"
      aria-labelledby="image-slider-section-title"
      aria-describedby="image-slider-section-description"
    >
      <header>
        <h2
          id="image-slider-section-title"
          className="mb-2 text-xl font-semibold text-gray-900"
        >
          이미지 슬라이더
        </h2>
        <p id="image-slider-section-description" className="text-gray-600">
          블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요.
        </p>
      </header>

      <main className="space-y-4">
        {hasAvailableImageFiles ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-sm text-default-600"
                id="slider-status-display"
                aria-live="polite"
              >
                슬라이더 가능한 이미지 {totalAvailableForSliderImageCount}개 |{' '}
                <span className="font-medium text-primary">
                  {currentSelectedImageCount}개 선택됨
                </span>
              </div>
              {hasSelectedSliderImages ? (
                <button
                  type="button"
                  onClick={handleClearAllSliderImageList}
                  className="text-sm underline rounded text-danger hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                  aria-label={`슬라이더의 모든 이미지 ${currentSliderImageTotalCount}개 초기화`}
                  aria-describedby="slider-status-display"
                >
                  모두 초기화
                </button>
              ) : null}
            </div>

            {!canCreateSlider ? (
              <div
                className="p-4 border rounded-lg bg-warning-50 border-warning-200"
                role="alert"
                aria-labelledby="slider-minimum-requirement-title"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    icon="lucide:info"
                    className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3
                      id="slider-minimum-requirement-title"
                      className="text-sm font-medium text-warning-800"
                    >
                      슬라이더 생성 조건 안내
                    </h3>
                    <p className="mt-1 text-sm text-warning-700">
                      3개 이미지부터 슬라이더를 생성할 수 있습니다.
                      <br />
                      현재 메인 이미지를 제외한 이미지가{' '}
                      {totalAvailableForSliderImageCount}개 있습니다.
                      {totalAvailableForSliderImageCount === 0
                        ? ' 추가 이미지를 업로드해주세요.'
                        : ` ${
                            3 - totalAvailableForSliderImageCount
                          }개 더 업로드해주세요.`}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <section
              role="group"
              aria-labelledby="image-selection-section-title"
            >
              <h3 id="image-selection-section-title" className="sr-only">
                슬라이더에 추가할 이미지 선택
              </h3>
              <SliderImageSelector
                mediaFiles={availableMediaFileList}
                mainImage={selectedMainImageUrl}
                localSliderImages={currentSliderImageUrlList}
                selectedSliderImages={selectedImageIndexList}
                onSliderImageSelect={handleImageSelectionToggleByIndex}
              />
            </section>

            {canCreateSlider ? (
              <SliderAddButton
                selectedCount={currentSelectedImageCount}
                onAddToSlider={handleAddSelectedImageListToSlider}
                isDisabled={
                  !hasAvailableImageFiles || currentSelectedImageCount === 0
                }
              />
            ) : null}

            {hasSelectedSliderImages ? (
              <section
                role="group"
                aria-labelledby="selected-slider-images-section-title"
              >
                <h3
                  id="selected-slider-images-section-title"
                  className="sr-only"
                >
                  선택된 슬라이더 이미지 관리
                </h3>
                <SelectedSliderImages
                  localSliderImages={currentSliderImageUrlList}
                  onRemoveFromSlider={handleRemoveImageFromSliderByUrl}
                  onMoveToFirst={handleMoveImageToFirstPosition}
                  onMoveToLast={handleMoveImageToLastPosition}
                  showOrderControls={true}
                />
              </section>
            ) : null}
          </>
        ) : (
          <div
            className="p-4 text-center rounded-lg bg-default-100"
            role="status"
            aria-label="이미지 업로드 안내"
          >
            <Icon
              icon="lucide:layout-grid"
              className="w-10 h-10 mx-auto mb-2 text-default-400"
              aria-hidden="true"
              width={40}
              height={40}
            />
            <p className="text-default-600">
              {selectedMainImageUrl !== null &&
              selectedMainImageUrl !== undefined ? (
                <>
                  메인 이미지가 설정되었습니다.
                  <br />
                  추가 이미지를 업로드하면 슬라이더를 구성할 수 있습니다.
                </>
              ) : (
                '이미지를 업로드하면 슬라이더를 구성할 수 있습니다.'
              )}
            </p>
          </div>
        )}
      </main>
    </section>
  );
}

export default ImageSliderContainer;
