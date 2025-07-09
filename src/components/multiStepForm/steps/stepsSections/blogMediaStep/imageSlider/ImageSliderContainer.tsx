// blogMediaStep/imageSlider/ImageSliderContainer.tsx

import React, { useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageSlider } from './hooks/useImageSlider';
import { useSliderSelection } from './hooks/useSliderSelection';
import { useSliderOrder } from './hooks/useSliderOrder';

import SliderImageSelector from './parts/SliderImageSelector';
import SelectedSliderImages from './parts/SelectedSliderImages';
import SliderAddButton from './parts/SliderAddButton';

function ImageSliderContainer(): React.ReactNode {
  console.log('🚀 ImageSliderContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  const blogMediaStepState = useBlogMediaStepState();
  const { formValues, addToast } = blogMediaStepState;
  const { media: availableMediaFileList, mainImage: selectedMainImageUrl } =
    formValues;

  console.log('📊 BlogMediaStepState 불러오기 완료:', {
    availableMediaCount: availableMediaFileList.length,
    hasMainImage: selectedMainImageUrl ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  const imageSliderHook = useImageSlider();
  const {
    localSliderImages: currentSliderImageUrlList,
    removeFromSlider: removeImageFromSliderByUrl,
    addSelectedToSlider: addSelectedImageListToSlider,
    clearSliderImages: clearAllSliderImageList,
    getSliderImageCount: getCurrentSliderImageTotalCount,
  } = imageSliderHook;

  const sliderSelectionHook = useSliderSelection();
  const {
    selectedSliderImages: selectedImageIndexList,
    handleSliderImageSelect: handleImageSelectionToggleByIndex,
    setSelectedSliderImages: updateSelectedImageIndexList,
  } = sliderSelectionHook;

  const sliderOrderHook = useSliderOrder();
  const {
    moveToFirst: moveImageToFirstPosition,
    moveToLast: moveImageToLastPosition,
  } = sliderOrderHook;

  console.log('🔧 훅 초기화 완료:', {
    sliderImageCount: currentSliderImageUrlList.length,
    selectedImageCount: selectedImageIndexList.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const getSelectedImageUrlListFromIndexList = useCallback(
    (mediaFileUrlList: string[]) => {
      console.log('🔄 getSelectedImageUrlListFromIndexList 호출:', {
        mediaFileCount: mediaFileUrlList.length,
        selectedIndexCount: selectedImageIndexList.length,
      });

      const selectedUrlList = selectedImageIndexList
        .map((imageIndex) => {
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
    updateSelectedImageIndexList([]);
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
      addToast({
        title: '선택된 이미지가 없습니다',
        description: '슬라이더에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    addSelectedImageListToSlider(selectedImageUrlList);
    clearCurrentImageSelection();

    console.log('✅ 슬라이더에 이미지 추가 완료:', {
      addedImageCount: selectedImageCount,
    });
  }, [
    selectedImageUrlList,
    addSelectedImageListToSlider,
    clearCurrentImageSelection,
    addToast,
  ]);

  const handleRemoveImageFromSliderByUrl = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleRemoveImageFromSliderByUrl 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      removeImageFromSliderByUrl(targetImageUrl);
      addToast({
        title: '슬라이더에서 제거',
        description: '이미지가 슬라이더에서 제거되었습니다.',
        color: 'success',
      });

      console.log('✅ 슬라이더에서 이미지 제거 완료');
    },
    [removeImageFromSliderByUrl, addToast]
  );

  const handleMoveImageToFirstPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleMoveImageToFirstPosition 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      moveImageToFirstPosition(targetImageUrl);

      console.log('✅ 이미지 첫 번째 위치로 이동 완료');
    },
    [moveImageToFirstPosition]
  );

  const handleMoveImageToLastPosition = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 handleMoveImageToLastPosition 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      });

      moveImageToLastPosition(targetImageUrl);

      console.log('✅ 이미지 마지막 위치로 이동 완료');
    },
    [moveImageToLastPosition]
  );

  const handleClearAllSliderImageList = useCallback(() => {
    console.log('🔧 handleClearAllSliderImageList 호출');

    clearAllSliderImageList();
    clearCurrentImageSelection();

    console.log('✅ 모든 슬라이더 이미지 초기화 완료');
  }, [clearAllSliderImageList, clearCurrentImageSelection]);

  const totalAvailableImageCount = availableMediaFileList.length;
  const currentSliderImageTotalCount = getCurrentSliderImageTotalCount();
  const { length: sliderImageCount } = currentSliderImageUrlList;
  const hasSelectedSliderImages = sliderImageCount > 0;
  const hasAvailableImageFiles = totalAvailableImageCount > 0;

  console.log('📊 렌더링 준비 상태:', {
    totalAvailableImageCount,
    currentSliderImageTotalCount,
    sliderImageCount,
    hasSelectedSliderImages,
    hasAvailableImageFiles,
    currentSelectedImageCount,
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
                사용 가능한 이미지 {totalAvailableImageCount}개 | 슬라이더{' '}
                {currentSliderImageTotalCount}개
                {currentSelectedImageCount > 0 ? (
                  <span className="ml-2 text-primary">
                    ({currentSelectedImageCount}개 선택됨)
                  </span>
                ) : null}
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

            <SliderAddButton
              selectedCount={currentSelectedImageCount}
              onAddToSlider={handleAddSelectedImageListToSlider}
              isDisabled={
                !hasAvailableImageFiles || currentSelectedImageCount === 0
              }
            />

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
              이미지를 업로드하면 슬라이더를 구성할 수 있습니다.
            </p>
          </div>
        )}
      </main>
    </section>
  );
}

export default ImageSliderContainer;
