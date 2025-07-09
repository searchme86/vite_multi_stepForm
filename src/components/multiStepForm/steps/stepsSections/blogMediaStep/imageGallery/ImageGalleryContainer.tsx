// blogMediaStep/imageGallery/ImageGalleryContainer.tsx

import React from 'react';
import { useViewBuilderState } from './hooks/viewBuilder/useViewBuilderState';
import { useViewBuilderActions } from './hooks/viewBuilder/useViewBuilderActions';
import ViewModeSelector from './parts/viewBuilder/ViewModeSelector';
import ViewBuilderControls from './parts/viewBuilder/ViewBuilderControls';
import AvailableImageGrid from './parts/viewBuilder/AvailableImageGrid';
import SelectedImagePreview from './parts/viewBuilder/SelectedImagePreview';

interface ImageGalleryContainerProps {
  mediaFiles: string[];
  mainImage: string | null;
  sliderImages: string[];
}

function ImageGalleryContainer({
  mediaFiles: availableMediaFileList,
  mainImage: selectedMainImageUrl,
  sliderImages: currentSliderImageList,
}: ImageGalleryContainerProps): React.ReactNode {
  console.log('🚀 ImageGalleryContainer 렌더링 시작:', {
    mediaFileCount: availableMediaFileList.length,
    hasMainImage: selectedMainImageUrl ? true : false,
    sliderImageCount: currentSliderImageList.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const viewBuilderStateHook = useViewBuilderState();
  const viewBuilderActionsHook = useViewBuilderActions();

  console.log('📊 ViewBuilder 훅 초기화 완료:', {
    hasStateHook: viewBuilderStateHook ? true : false,
    hasActionsHook: viewBuilderActionsHook ? true : false,
    timestamp: new Date().toLocaleTimeString(),
  });

  const {
    mode: currentViewMode,
    view: currentViewType,
    sortBy: currentSortByOption,
    sortOrder: currentSortOrderDirection,
    selectedImages: selectedImageUrlList,
    showPreview: isPreviewVisible,
    previewLayout: selectedPreviewLayoutType,
    safeImageViewConfig: imageViewConfigurationData,
    filteredAndSortedImages: processedImageList,
    isImageSelected: checkIsImageSelectedFunction,
    getSelectedCount: getSelectedImageCountFunction,
    getTotalCount: getTotalImageCountFunction,
    setMode: updateViewModeFunction,
    setSelectedImages: updateSelectedImageListFunction,
    setShowPreview: updatePreviewVisibilityFunction,
    setPreviewLayout: updatePreviewLayoutFunction,
  } = viewBuilderStateHook;

  const {
    handleAddAllImages: handleAddAllImagesToGalleryFunction,
    handleAddSelectedImages: handleAddSelectedImagesToGalleryFunction,
    handleImageSelect: handleImageSelectionToggleFunction,
    resetSelection: resetImageSelectionFunction,
  } = viewBuilderActionsHook;

  const selectedImageCount = getSelectedImageCountFunction();
  const totalAvailableImageCount = getTotalImageCountFunction();
  const { layout: layoutConfiguration } = imageViewConfigurationData;
  const { columns: columnCount } = layoutConfiguration;

  console.log('📊 ImageGalleryContainer 현재 상태:', {
    currentViewMode,
    currentViewType,
    selectedImageCount,
    totalAvailableImageCount,
    isPreviewVisible,
    columnCount,
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleViewModeChange = (newViewMode: 'all' | 'selected') => {
    console.log('🔧 handleViewModeChange 호출:', {
      newViewMode,
      previousMode: currentViewMode,
    });

    updateViewModeFunction(newViewMode);

    if (newViewMode === 'all') {
      console.log('🔄 전체 모드로 변경 - 선택 및 미리보기 초기화');
      updateSelectedImageListFunction([]);
      updatePreviewVisibilityFunction(false);
    }

    viewBuilderActionsHook.handleModeChange(newViewMode);

    console.log('✅ handleViewModeChange 완료:', {
      newViewMode,
      selectionCleared: newViewMode === 'all',
    });
  };

  const handleImageClickForSelection = (targetImageUrl: string) => {
    console.log('🔧 handleImageClickForSelection 호출:', {
      targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      currentViewMode,
    });

    if (currentViewMode === 'all') {
      console.log('📋 전체 모드에서는 이미지 선택 불가 - 요청 무시');
      return;
    }

    if (currentViewMode !== 'selected') {
      console.log('❌ 선택 모드가 아님 - 요청 무시');
      return;
    }

    const updatedSelectedImageList = handleImageSelectionToggleFunction(
      targetImageUrl,
      currentViewMode,
      selectedImageUrlList
    );

    updateSelectedImageListFunction(updatedSelectedImageList);

    const { length: newSelectedCount } = updatedSelectedImageList;
    const shouldShowPreview = newSelectedCount > 0;

    updatePreviewVisibilityFunction(shouldShowPreview);

    console.log('✅ handleImageClickForSelection 완료:', {
      newSelectedCount,
      shouldShowPreview,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleViewTypeChange = (newViewType: 'grid' | 'masonry') => {
    console.log('🔧 handleViewTypeChange 호출:', {
      newViewType,
      previousType: currentViewType,
    });

    viewBuilderStateHook.setView(newViewType);

    if (isPreviewVisible) {
      console.log('🔄 미리보기 레이아웃 동기화');
      updatePreviewLayoutFunction(newViewType);
    }

    console.log('✅ handleViewTypeChange 완료:', {
      newViewType,
      previewLayoutSynced: isPreviewVisible,
    });
  };

  const handleSortOptionChange = (
    newSortByOption: 'index' | 'name' | 'size',
    newSortOrderDirection: 'asc' | 'desc'
  ) => {
    console.log('🔧 handleSortOptionChange 호출:', {
      newSortByOption,
      newSortOrderDirection,
      previousSortBy: currentSortByOption,
      previousSortOrder: currentSortOrderDirection,
    });

    viewBuilderStateHook.setSortBy(newSortByOption);
    viewBuilderStateHook.setSortOrder(newSortOrderDirection);

    console.log('✅ handleSortOptionChange 완료:', {
      newSortByOption,
      newSortOrderDirection,
    });
  };

  const handleColumnCountChange = (newColumnCount: number) => {
    console.log('🔧 handleColumnCountChange 호출:', {
      newColumnCount,
      previousColumnCount: columnCount,
    });

    viewBuilderActionsHook.updateColumns(newColumnCount);

    console.log('✅ handleColumnCountChange 완료:', { newColumnCount });
  };

  const handleResetImageSelection = () => {
    console.log('🔧 handleResetImageSelection 호출');

    updateSelectedImageListFunction([]);
    updatePreviewVisibilityFunction(false);
    resetImageSelectionFunction();

    console.log('✅ handleResetImageSelection 완료 - 모든 선택 초기화됨');
  };

  const handleAddAllImagesToGalleryView = () => {
    console.log('🔧 handleAddAllImagesToGalleryView 호출:', {
      currentViewType,
      columnCount,
      totalAvailableImageCount,
    });

    handleAddAllImagesToGalleryFunction(currentViewType, columnCount);

    console.log('✅ handleAddAllImagesToGalleryView 완료');
  };

  const handleAddSelectedImagesToGalleryView = () => {
    console.log('🔧 handleAddSelectedImagesToGalleryView 호출:', {
      currentViewType,
      columnCount,
      selectedImageCount,
    });

    handleAddSelectedImagesToGalleryFunction(currentViewType, columnCount);

    console.log('✅ handleAddSelectedImagesToGalleryView 완료');
  };

  const handlePreviewLayoutTypeChange = (newLayoutType: 'grid' | 'masonry') => {
    console.log('🔧 handlePreviewLayoutTypeChange 호출:', {
      newLayoutType,
      previousLayoutType: selectedPreviewLayoutType,
    });

    updatePreviewLayoutFunction(newLayoutType);

    console.log('✅ handlePreviewLayoutTypeChange 완료:', { newLayoutType });
  };

  const handleClosePreviewModal = () => {
    console.log('🔧 handleClosePreviewModal 호출');

    updatePreviewVisibilityFunction(false);

    console.log('✅ handleClosePreviewModal 완료 - 미리보기 닫힘');
  };

  const handleRemoveImageFromPreview = (targetImageUrl: string) => {
    console.log('🔧 handleRemoveImageFromPreview 호출:', {
      targetImageUrl: targetImageUrl.slice(0, 30) + '...',
      currentSelectedCount: selectedImageCount,
    });

    const filteredSelectedImageList = selectedImageUrlList.filter(
      (imageUrl) => imageUrl !== targetImageUrl
    );

    updateSelectedImageListFunction(filteredSelectedImageList);

    const { length: remainingImageCount } = filteredSelectedImageList;

    if (remainingImageCount === 0) {
      console.log('🔄 선택된 이미지 없음 - 미리보기 닫기');
      updatePreviewVisibilityFunction(false);
    }

    console.log('✅ handleRemoveImageFromPreview 완료:', {
      remainingImageCount,
      previewClosed: remainingImageCount === 0,
    });
  };

  const checkShouldShowGalleryContent = (): boolean => {
    const { length: processedImageCount } = processedImageList;
    const hasProcessedImages = processedImageCount > 0;

    console.log('🔍 checkShouldShowGalleryContent:', {
      processedImageCount,
      hasProcessedImages,
    });

    return hasProcessedImages;
  };

  const shouldShowGalleryContent = checkShouldShowGalleryContent();

  console.log('🎨 ImageGalleryContainer 최종 렌더링 준비:', {
    shouldShowGalleryContent,
    currentViewMode,
    selectedImageCount,
    totalAvailableImageCount,
    isPreviewVisible,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <section
      className="space-y-6"
      role="region"
      aria-labelledby="image-gallery-section-title"
      aria-describedby="image-gallery-section-description"
    >
      <header>
        <h2
          id="image-gallery-section-title"
          className="mb-2 text-xl font-semibold text-gray-900"
        >
          이미지 갤러리 관리
        </h2>
        <p id="image-gallery-section-description" className="text-gray-600">
          전체 이미지로 자동 갤러리를 만들거나, 개별 이미지를 선택하여 커스텀
          갤러리를 만들 수 있습니다.
        </p>
      </header>

      <main className="space-y-6">
        {shouldShowGalleryContent ? (
          <>
            <ViewModeSelector
              currentMode={currentViewMode}
              totalImageCount={totalAvailableImageCount}
              selectedImageCount={selectedImageCount}
              onModeChange={handleViewModeChange}
              isDisabled={false}
            />

            <ViewBuilderControls
              mode={currentViewMode}
              view={currentViewType}
              sortBy={currentSortByOption}
              sortOrder={currentSortOrderDirection}
              columns={columnCount}
              selectedCount={selectedImageCount}
              availableCount={totalAvailableImageCount}
              onViewChange={handleViewTypeChange}
              onSortChange={handleSortOptionChange}
              onColumnsChange={handleColumnCountChange}
              onResetSelection={handleResetImageSelection}
              onAddAllImages={handleAddAllImagesToGalleryView}
              onAddSelectedImages={handleAddSelectedImagesToGalleryView}
              isDisabled={false}
            />

            <AvailableImageGrid
              filteredAndSortedImages={processedImageList}
              selectedImages={selectedImageUrlList}
              view={currentViewType}
              columns={columnCount}
              mode={currentViewMode}
              onImageClick={handleImageClickForSelection}
              isImageSelected={checkIsImageSelectedFunction}
              isDisabled={false}
            />

            {isPreviewVisible ? (
              <SelectedImagePreview
                selectedImages={selectedImageUrlList}
                previewLayout={selectedPreviewLayoutType}
                showPreview={isPreviewVisible}
                columns={columnCount}
                onPreviewLayoutChange={handlePreviewLayoutTypeChange}
                onClosePreview={handleClosePreviewModal}
                onRemoveImage={handleRemoveImageFromPreview}
              />
            ) : null}
          </>
        ) : (
          <div
            className="p-8 text-center rounded-lg bg-default-100"
            role="status"
            aria-label="사용 가능한 이미지가 없음"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-default-200">
                <svg
                  className="w-8 h-8 text-default-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-default-900">
                  사용 가능한 이미지가 없습니다
                </h3>
                <p className="text-sm text-default-600">
                  갤러리를 만들기 위해서는 먼저 이미지를 업로드해주세요.
                </p>
                <p className="text-xs text-default-500">
                  메인 이미지나 슬라이더로 사용되지 않은 이미지만 갤러리에
                  사용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </section>
  );
}

export default ImageGalleryContainer;
