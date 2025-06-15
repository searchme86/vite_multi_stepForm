// blogMediaStep/imageSlider/ImageSliderContainer.tsx

import React from 'react';
import { Icon } from '@iconify/react';
import AccordionField from '../../components/accordion-field';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageSlider } from './hooks/useImageSlider';
import { useSliderSelection } from './hooks/useSliderSelection';
import { useSliderOrder } from './hooks/useSliderOrder';

import SliderImageSelector from './parts/SliderImageSelector';
import SelectedSliderImages from './parts/SelectedSliderImages';
import SliderAddButton from './parts/SliderAddButton';

function ImageSliderContainer(): React.ReactNode {
  const { formValues, addToast } = useBlogMediaStepState();
  const { media: mediaFiles, mainImage } = formValues;

  const {
    localSliderImages,
    toggleSliderSelection,
    removeFromSlider,
    addSelectedToSlider,
    clearSliderImages,
    isImageInSlider,
    getSliderImageCount,
  } = useImageSlider();

  const {
    selectedSliderImages,
    handleSliderImageSelect,
    clearSliderSelection,
    getSelectedImageUrls,
    getSelectedCount,
    isImageSelected,
  } = useSliderSelection();

  const { moveToFirst, moveToLast, moveSliderImage, reorderSliderImages } =
    useSliderOrder();

  const handleAddSelectedToSlider = () => {
    const selectedUrls = getSelectedImageUrls(mediaFiles);

    if (selectedUrls.length === 0) {
      addToast({
        title: '선택된 이미지가 없습니다',
        description: '슬라이더에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    addSelectedToSlider(selectedUrls);
    clearSliderSelection();
  };

  const handleRemoveFromSlider = (imageUrl: string) => {
    removeFromSlider(imageUrl);
    addToast({
      title: '슬라이더에서 제거',
      description: '이미지가 슬라이더에서 제거되었습니다.',
      color: 'success',
    });
  };

  const handleMoveToFirst = (imageUrl: string) => {
    moveToFirst(imageUrl);
  };

  const handleMoveToLast = (imageUrl: string) => {
    moveToLast(imageUrl);
  };

  const handleClearAll = () => {
    clearSliderImages();
    clearSliderSelection();
  };

  const handleToggleImage = (imageUrl: string) => {
    toggleSliderSelection(imageUrl);
  };

  return (
    <AccordionField
      title="이미지 슬라이더"
      description="블로그 하단에 표시될 이미지 슬라이더를 위한 이미지들을 선택해주세요."
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {mediaFiles.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-default-600">
                사용 가능한 이미지 {mediaFiles.length}개 | 슬라이더{' '}
                {getSliderImageCount()}개
              </div>
              {localSliderImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-sm underline text-danger hover:text-danger-600"
                >
                  모두 초기화
                </button>
              )}
            </div>

            <SliderImageSelector
              mediaFiles={mediaFiles}
              mainImage={mainImage}
              localSliderImages={localSliderImages}
              selectedSliderImages={selectedSliderImages}
              onSliderImageSelect={handleSliderImageSelect}
            />

            <SliderAddButton
              selectedCount={getSelectedCount()}
              onAddToSlider={handleAddSelectedToSlider}
              isDisabled={mediaFiles.length === 0 || getSelectedCount() === 0}
            />

            <SelectedSliderImages
              localSliderImages={localSliderImages}
              onRemoveFromSlider={handleRemoveFromSlider}
              onMoveToFirst={handleMoveToFirst}
              onMoveToLast={handleMoveToLast}
              showOrderControls={true}
            />
          </>
        ) : (
          <div className="p-4 text-center rounded-lg bg-default-100">
            <Icon
              icon="lucide:layout-grid"
              className="w-10 h-10 mx-auto mb-2 text-default-400"
              aria-hidden="true"
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
