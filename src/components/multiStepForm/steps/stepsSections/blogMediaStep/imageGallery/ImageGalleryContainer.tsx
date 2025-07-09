// src/components/multiStepForm/steps/stepsSections/blogMediaStep/imageGallery/ImageGalleryContainer.tsx

import React from 'react';
import AccordionField from '../../../../../accordion-field';
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
  mediaFiles,
  mainImage,
  sliderImages,
}: ImageGalleryContainerProps): React.ReactNode {
  console.log('🔧 ImageGalleryContainer 렌더링 시작:', {
    mediaCount: mediaFiles.length,
    hasMainImage: !!mainImage,
    sliderCount: sliderImages.length,
  });

  // 상태 관리 훅
  const viewBuilderState = useViewBuilderState();
  const viewBuilderActions = useViewBuilderActions();

  // 상태 구조분해할당
  const {
    mode,
    view,
    sortBy,
    sortOrder,
    selectedImages,
    showPreview,
    previewLayout,
    safeImageViewConfig,
    filteredAndSortedImages,
    isImageSelected,
    getSelectedCount,
    getTotalCount,
    setMode,
    setSelectedImages,
    setShowPreview,
    setPreviewLayout,
  } = viewBuilderState;

  // 액션 구조분해할당
  const {
    handleAddAllImages,
    handleAddSelectedImages,
    handleImageSelect,
    resetSelection,
  } = viewBuilderActions;

  // 계산된 값들
  const selectedCount = getSelectedCount();
  const totalCount = getTotalCount();
  const columns = safeImageViewConfig.layout.columns;

  console.log('📊 ImageGalleryContainer 상태:', {
    mode,
    view,
    selectedCount,
    totalCount,
    showPreview,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 모드 변경 핸들러
  const handleModeChange = (newMode: 'all' | 'selected') => {
    console.log('🔧 handleModeChange 호출:', { newMode });

    setMode(newMode);

    if (newMode === 'all') {
      setSelectedImages([]);
      setShowPreview(false);
    }

    viewBuilderActions.handleModeChange(newMode);

    console.log('✅ handleModeChange 완료:', { newMode });
  };

  // 이미지 클릭 핸들러 (로컬 상태용)
  const handleImageClick = (imageUrl: string) => {
    console.log('🔧 handleImageClick 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
      mode,
    });

    if (mode === 'all') {
      console.log('📋 전체 모드에서는 이미지 클릭 불가');
      return;
    }

    if (mode === 'selected') {
      const newSelectedImages = handleImageSelect(
        imageUrl,
        mode,
        selectedImages
      );
      setSelectedImages(newSelectedImages);

      // 미리보기 상태 업데이트
      if (newSelectedImages.length > 0) {
        setShowPreview(true);
      } else {
        setShowPreview(false);
      }

      console.log('✅ handleImageClick 완료:', {
        newCount: newSelectedImages.length,
        showPreview: newSelectedImages.length > 0,
      });
    }
  };

  // 뷰 타입 변경 핸들러
  const handleViewChange = (newView: 'grid' | 'masonry') => {
    console.log('🔧 handleViewChange 호출:', { newView });

    viewBuilderState.setView(newView);

    // 미리보기 레이아웃도 동기화
    if (showPreview) {
      setPreviewLayout(newView);
    }

    console.log('✅ handleViewChange 완료:', { newView });
  };

  // 정렬 변경 핸들러
  const handleSortChange = (
    newSortBy: 'index' | 'name' | 'size',
    newSortOrder: 'asc' | 'desc'
  ) => {
    console.log('🔧 handleSortChange 호출:', { newSortBy, newSortOrder });

    viewBuilderState.setSortBy(newSortBy);
    viewBuilderState.setSortOrder(newSortOrder);

    console.log('✅ handleSortChange 완료:', { newSortBy, newSortOrder });
  };

  // 컬럼 변경 핸들러
  const handleColumnsChange = (newColumns: number) => {
    console.log('🔧 handleColumnsChange 호출:', { newColumns });

    viewBuilderActions.updateColumns(newColumns);

    console.log('✅ handleColumnsChange 완료:', { newColumns });
  };

  // 선택 초기화 핸들러
  const handleResetSelection = () => {
    console.log('🔧 handleResetSelection 호출');

    setSelectedImages([]);
    setShowPreview(false);
    resetSelection();

    console.log('✅ handleResetSelection 완료');
  };

  // 전체 이미지로 뷰 추가 핸들러
  const handleAddAllImagesView = () => {
    console.log('🔧 handleAddAllImagesView 호출:', { view, columns });

    handleAddAllImages(view, columns);

    console.log('✅ handleAddAllImagesView 완료');
  };

  // 선택된 이미지로 뷰 추가 핸들러
  const handleAddSelectedImagesView = () => {
    console.log('🔧 handleAddSelectedImagesView 호출:', {
      view,
      columns,
      selectedCount,
    });

    handleAddSelectedImages(view, columns);

    console.log('✅ handleAddSelectedImagesView 완료');
  };

  // 미리보기 레이아웃 변경 핸들러
  const handlePreviewLayoutChange = (layout: 'grid' | 'masonry') => {
    console.log('🔧 handlePreviewLayoutChange 호출:', { layout });

    setPreviewLayout(layout);

    console.log('✅ handlePreviewLayoutChange 완료:', { layout });
  };

  // 미리보기 닫기 핸들러
  const handleClosePreview = () => {
    console.log('🔧 handleClosePreview 호출');

    setShowPreview(false);

    console.log('✅ handleClosePreview 완료');
  };

  // 미리보기에서 이미지 제거 핸들러
  const handleRemoveFromPreview = (imageUrl: string) => {
    console.log('🔧 handleRemoveFromPreview 호출:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
    });

    const newSelectedImages = selectedImages.filter((img) => img !== imageUrl);
    setSelectedImages(newSelectedImages);

    if (newSelectedImages.length === 0) {
      setShowPreview(false);
    }

    console.log('✅ handleRemoveFromPreview 완료:', {
      newCount: newSelectedImages.length,
    });
  };

  const shouldShowGalleryContent = (): boolean => {
    return filteredAndSortedImages.length > 0;
  };

  const showGalleryContent = shouldShowGalleryContent();

  console.log('🎨 ImageGalleryContainer 렌더링 준비:', {
    showGalleryContent,
    mode,
    selectedCount,
    totalCount,
  });

  return (
    <AccordionField
      title="이미지 갤러리 관리"
      description="전체 이미지로 자동 갤러리를 만들거나, 개별 이미지를 선택하여 커스텀 갤러리를 만들 수 있습니다."
      defaultExpanded={true}
      id="image-gallery-management-section"
    >
      <div
        className="space-y-6"
        role="region"
        aria-labelledby="image-gallery-management-title"
      >
        {showGalleryContent ? (
          <>
            <ViewModeSelector
              currentMode={mode}
              totalImageCount={totalCount}
              selectedImageCount={selectedCount}
              onModeChange={handleModeChange}
              isDisabled={false}
            />

            <ViewBuilderControls
              mode={mode}
              view={view}
              sortBy={sortBy}
              sortOrder={sortOrder}
              columns={columns}
              selectedCount={selectedCount}
              availableCount={totalCount}
              onViewChange={handleViewChange}
              onSortChange={handleSortChange}
              onColumnsChange={handleColumnsChange}
              onResetSelection={handleResetSelection}
              onAddAllImages={handleAddAllImagesView}
              onAddSelectedImages={handleAddSelectedImagesView}
              isDisabled={false}
            />

            <AvailableImageGrid
              filteredAndSortedImages={filteredAndSortedImages}
              selectedImages={selectedImages}
              view={view}
              columns={columns}
              mode={mode}
              onImageClick={handleImageClick}
              isImageSelected={isImageSelected}
              isDisabled={false}
            />

            {showPreview ? (
              <SelectedImagePreview
                selectedImages={selectedImages}
                previewLayout={previewLayout}
                showPreview={showPreview}
                columns={columns}
                onPreviewLayoutChange={handlePreviewLayoutChange}
                onClosePreview={handleClosePreview}
                onRemoveImage={handleRemoveFromPreview}
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
      </div>
    </AccordionField>
  );
}

export default ImageGalleryContainer;
