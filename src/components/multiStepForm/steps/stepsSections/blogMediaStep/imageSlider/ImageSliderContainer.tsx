// blogMediaStep/imageSlider/ImageSliderContainer.tsx

import React, { useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import AccordionField from '../../../../../accordion-field';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageSlider } from './hooks/useImageSlider';
import { useSliderSelection } from './hooks/useSliderSelection';
import { useSliderOrder } from './hooks/useSliderOrder';

import SliderImageSelector from './parts/SliderImageSelector';
import SelectedSliderImages from './parts/SelectedSliderImages';
import SliderAddButton from './parts/SliderAddButton';

function ImageSliderContainer(): React.ReactNode {
  const { formValues, addToast } = useBlogMediaStepState();
  const { media: availableMediaFiles, mainImage: selectedMainImage } =
    formValues;

  const {
    localSliderImages: currentSliderImageList,
    removeFromSlider: removeImageFromSlider,
    addSelectedToSlider: addSelectedImagesToSlider,
    clearSliderImages: clearAllSliderImages,
    getSliderImageCount: getCurrentSliderImageCount,
  } = useImageSlider();

  const {
    selectedSliderImages: selectedImageIndices,
    handleSliderImageSelect: handleImageSelectionToggle,
    setSelectedSliderImages: updateSelectedImageIndices,
  } = useSliderSelection();

  const { moveToFirst: moveImageToFirst, moveToLast: moveImageToLast } =
    useSliderOrder();

  const getSelectedImageUrlsFromIndices = useCallback(
    (mediaFileList: string[]) => {
      return selectedImageIndices
        .map((imageIndex) => mediaFileList[imageIndex])
        .filter((imageUrl) => imageUrl !== undefined);
    },
    [selectedImageIndices]
  );

  const getCurrentSelectedCount = useCallback(() => {
    return selectedImageIndices.length;
  }, [selectedImageIndices]);

  const clearCurrentSelection = useCallback(() => {
    updateSelectedImageIndices([]);
  }, [updateSelectedImageIndices]);

  const selectedImageUrls = useMemo(
    () => getSelectedImageUrlsFromIndices(availableMediaFiles),
    [getSelectedImageUrlsFromIndices, availableMediaFiles]
  );

  const currentSelectedCount = useMemo(
    () => getCurrentSelectedCount(),
    [getCurrentSelectedCount]
  );

  const handleAddSelectedImagesToSlider = useCallback(() => {
    if (selectedImageUrls.length === 0) {
      addToast({
        title: '선택된 이미지가 없습니다',
        description: '슬라이더에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    addSelectedImagesToSlider(selectedImageUrls);
    clearCurrentSelection();
  }, [
    selectedImageUrls,
    addSelectedImagesToSlider,
    clearCurrentSelection,
    addToast,
  ]);

  const handleRemoveImageFromSlider = useCallback(
    (targetImageUrl: string) => {
      removeImageFromSlider(targetImageUrl);
      addToast({
        title: '슬라이더에서 제거',
        description: '이미지가 슬라이더에서 제거되었습니다.',
        color: 'success',
      });
    },
    [removeImageFromSlider, addToast]
  );

  const handleMoveImageToFirst = useCallback(
    (targetImageUrl: string) => {
      moveImageToFirst(targetImageUrl);
    },
    [moveImageToFirst]
  );

  const handleMoveImageToLast = useCallback(
    (targetImageUrl: string) => {
      moveImageToLast(targetImageUrl);
    },
    [moveImageToLast]
  );

  const handleClearAllSliderImages = useCallback(() => {
    clearAllSliderImages();
    clearCurrentSelection();
  }, [clearAllSliderImages, clearCurrentSelection]);

  const totalAvailableImages = availableMediaFiles.length;
  const currentSliderImageCount = getCurrentSliderImageCount();
  const hasSliderImages = currentSliderImageList.length > 0;
  const hasAvailableImages = totalAvailableImages > 0;

  return (
    <AccordionField
      title="이미지 슬라이더"
      description="블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요."
      defaultExpanded={true}
    >
      <div
        className="space-y-4"
        role="region"
        aria-labelledby="image-slider-section"
      >
        {hasAvailableImages ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-sm text-default-600"
                id="slider-status"
                aria-live="polite"
              >
                사용 가능한 이미지 {totalAvailableImages}개 | 슬라이더{' '}
                {currentSliderImageCount}개
                {currentSelectedCount > 0 && (
                  <span className="ml-2 text-primary">
                    ({currentSelectedCount}개 선택됨)
                  </span>
                )}
              </div>
              {hasSliderImages && (
                <button
                  type="button"
                  onClick={handleClearAllSliderImages}
                  className="text-sm underline rounded text-danger hover:text-danger-600 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                  aria-label={`슬라이더의 모든 이미지 ${currentSliderImageCount}개 초기화`}
                  aria-describedby="slider-status"
                >
                  모두 초기화
                </button>
              )}
            </div>

            <div role="group" aria-labelledby="image-selection-heading">
              <h3 id="image-selection-heading" className="sr-only">
                슬라이더에 추가할 이미지 선택
              </h3>
              <SliderImageSelector
                mediaFiles={availableMediaFiles}
                mainImage={selectedMainImage}
                localSliderImages={currentSliderImageList}
                selectedSliderImages={selectedImageIndices}
                onSliderImageSelect={handleImageSelectionToggle}
              />
            </div>

            <SliderAddButton
              selectedCount={currentSelectedCount}
              onAddToSlider={handleAddSelectedImagesToSlider}
              isDisabled={!hasAvailableImages || currentSelectedCount === 0}
            />

            {hasSliderImages && (
              <div
                role="group"
                aria-labelledby="selected-slider-images-heading"
              >
                <h3 id="selected-slider-images-heading" className="sr-only">
                  선택된 슬라이더 이미지 관리
                </h3>
                <SelectedSliderImages
                  localSliderImages={currentSliderImageList}
                  onRemoveFromSlider={handleRemoveImageFromSlider}
                  onMoveToFirst={handleMoveImageToFirst}
                  onMoveToLast={handleMoveImageToLast}
                  showOrderControls={true}
                />
              </div>
            )}
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
      </div>
    </AccordionField>
  );
}

export default ImageSliderContainer;
