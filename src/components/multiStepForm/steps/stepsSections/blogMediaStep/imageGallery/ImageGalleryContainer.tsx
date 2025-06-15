// blogMediaStep/imageGallery/ImageGalleryContainer.tsx

import React, { useState, useCallback } from 'react';
import { Button, Icon } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import AccordionField from '../../components/accordion-field';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageViewBuilder } from './hooks/viewBuilder/useImageViewBuilder';
import { useImageSelection } from './hooks/gallery/useImageSelection';
import { useImageSorting } from './hooks/gallery/useImageSorting';
import { usePagination } from './hooks/gallery/usePagination';
import { useImageModal } from './hooks/gallery/useImageModal';
import { useDynamicLayout } from './hooks/layout/useDynamicLayout';
import { useMainImageManagement } from '../mainImage/hooks/useMainImageManagement';
import { formatFileSize } from './utils/galleryUtils';
import { createColumnOptions } from './utils/viewBuilderUtils';

import ImageTable from './parts/gallery/ImageTable';
import ImageCardList from './parts/gallery/ImageCardList';
import ImagePreviewModal from './parts/gallery/ImagePreviewModal';
import PaginationControls from './parts/gallery/PaginationControls';
import GalleryControls from './parts/gallery/GalleryControls';

interface ImageGalleryContainerProps {}

function ImageGalleryContainer(
  props: ImageGalleryContainerProps
): React.ReactNode {
  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const {
    formValues,
    uiState,
    selectionState,
    setSelectedFiles,
    orchestrator,
    addToast,
  } = useBlogMediaStepState();

  const { media: mediaFiles, mainImage, sliderImages } = formValues;
  const { isMobile } = uiState;
  const { selectedFiles } = selectionState;

  const viewBuilder = useImageViewBuilder(view, sortBy, sortOrder);
  const imageSelection = useImageSelection();
  const imageSorting = useImageSorting();
  const pagination = usePagination();
  const imageModal = useImageModal();
  const mainImageManagement = useMainImageManagement();

  const dynamicLayout = useDynamicLayout({
    config: viewBuilder.safeImageViewConfig,
    onImageClick: (imageUrl, index) => {
      imageModal.openImageModal(imageUrl, `이미지 ${index + 1}`);
    },
  });

  const displayFiles = pagination.getDisplayFiles(
    viewBuilder.filteredAndSortedImages
  );

  const modalState = imageModal.getModalState();

  const handleSortChange = useCallback(
    (newSortBy: 'index' | 'name' | 'size', newSortOrder: 'asc' | 'desc') => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      imageSorting.setSortBy(newSortBy);
    },
    [imageSorting]
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedIndices = imageSelection.getSelectedIndices();
    if (selectedIndices.length === 0) {
      addToast({
        title: '선택된 파일이 없습니다',
        description: '삭제할 파일을 먼저 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const selectedUrls = selectedIndices
      .map((index) => mediaFiles[index])
      .filter(Boolean);
    const result = orchestrator.handleBulkImageDeletion(selectedUrls);

    if (result.success) {
      imageSelection.clearSelection();
      addToast({
        title: '파일 삭제 완료',
        description: result.message,
        color: 'success',
      });
    }
  }, [imageSelection, orchestrator, mediaFiles, addToast]);

  const handleSetMainImage = useCallback(
    (index: number) => {
      const imageUrl = mediaFiles[index];
      if (imageUrl) {
        const result = orchestrator.handleMainImageChange(imageUrl);
        if (result.success) {
          addToast({
            title: '메인 이미지 설정 완료',
            description: result.message,
            color: 'success',
          });
        }
      }
    },
    [mediaFiles, orchestrator, addToast]
  );

  const handleCancelMainImage = useCallback(() => {
    const result = orchestrator.handleMainImageChange('');
    if (result.success) {
      addToast({
        title: '메인 이미지 해제 완료',
        description: result.message,
        color: 'warning',
      });
    }
  }, [orchestrator, addToast]);

  const handleToggleSlider = useCallback(
    (imageUrl: string) => {
      const result = orchestrator.handleSliderImageToggle(imageUrl);
      addToast({
        title: result.success ? '슬라이더 업데이트' : '슬라이더 업데이트 실패',
        description: result.message,
        color: result.success ? 'success' : 'warning',
      });
    },
    [orchestrator, addToast]
  );

  const handleRemoveMedia = useCallback(
    (index: number) => {
      const imageUrl = mediaFiles[index];
      if (imageUrl) {
        const result = orchestrator.handleImageDeletion(imageUrl);
        if (result.success) {
          addToast({
            title: '이미지 삭제 완료',
            description: result.message,
            color: 'success',
          });
        }
      }
    },
    [mediaFiles, orchestrator, addToast]
  );

  const isAllSelected =
    selectedFiles.length === displayFiles.length && displayFiles.length > 0;

  const paginationState = {
    visibleFilesCount: displayFiles.length,
    isExpanded: false,
    hasMoreFiles:
      viewBuilder.filteredAndSortedImages.length > displayFiles.length,
    remainingFiles:
      viewBuilder.filteredAndSortedImages.length - displayFiles.length,
    showMoreCount: Math.min(
      3,
      viewBuilder.filteredAndSortedImages.length - displayFiles.length
    ),
    canExpand: viewBuilder.filteredAndSortedImages.length > 5,
  };

  const renderEmptyState = useCallback(() => {
    return (
      <div className="p-8 text-center rounded-lg bg-default-100">
        <Icon
          icon="lucide:images"
          className="w-12 h-12 mx-auto mb-3 text-default-400"
          aria-hidden="true"
        />
        <p className="mb-3 text-default-600">업로드된 이미지가 없습니다.</p>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Icon icon="lucide:upload" />}
          onPress={() =>
            document
              .getElementById('media-upload-section')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
          aria-label="이미지 업로드 이동"
          type="button"
        >
          이미지 업로드하기
        </Button>
      </div>
    );
  }, []);

  const renderImageGallery = useCallback(() => {
    if (mediaFiles.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="space-y-4">
        <GalleryControls
          selectedCount={selectedFiles.length}
          totalCount={displayFiles.length}
          isAllSelected={isAllSelected}
          sortBy={sortBy}
          onDeleteSelected={handleDeleteSelected}
          onSelectAll={() => imageSelection.handleSelectAll(displayFiles)}
          onClearSelection={() => imageSelection.clearSelection()}
          onSortChange={handleSortChange}
        />

        <ImageTable
          displayFiles={displayFiles}
          selectedFiles={selectedFiles}
          isAllSelected={isAllSelected}
          mainImage={mainImage}
          sliderImages={sliderImages}
          uploading={{}}
          uploadStatus={{}}
          onSelectFile={imageSelection.handleSelectFile}
          onSelectAll={() => imageSelection.handleSelectAll(displayFiles)}
          onOpenModal={imageModal.openImageModal}
          onSetMainImage={handleSetMainImage}
          onCancelMainImage={handleCancelMainImage}
          onToggleSlider={handleToggleSlider}
          onRemoveMedia={handleRemoveMedia}
          formatFileSize={formatFileSize}
        />

        <ImageCardList
          displayFiles={displayFiles}
          selectedFiles={selectedFiles}
          mainImage={mainImage}
          sliderImages={sliderImages}
          uploading={{}}
          uploadStatus={{}}
          onSelectFile={imageSelection.handleSelectFile}
          onOpenModal={imageModal.openImageModal}
          onSetMainImage={handleSetMainImage}
          onCancelMainImage={handleCancelMainImage}
          onToggleSlider={handleToggleSlider}
          onRemoveMedia={handleRemoveMedia}
          formatFileSize={formatFileSize}
        />

        <PaginationControls
          canExpand={paginationState.canExpand}
          isExpanded={paginationState.isExpanded}
          hasMoreFiles={paginationState.hasMoreFiles}
          showMoreCount={paginationState.showMoreCount}
          onLoadMoreToggle={pagination.handleLoadMoreToggle}
        />
      </div>
    );
  }, [
    mediaFiles.length,
    renderEmptyState,
    selectedFiles.length,
    displayFiles,
    isAllSelected,
    sortBy,
    handleDeleteSelected,
    imageSelection,
    handleSortChange,
    mainImage,
    sliderImages,
    imageModal,
    handleSetMainImage,
    handleCancelMainImage,
    handleToggleSlider,
    handleRemoveMedia,
    paginationState,
    pagination,
  ]);

  const renderViewBuilder = useCallback(() => {
    return (
      <AccordionField
        title="이미지 뷰 만들기"
        description="사용 가능한 이미지로 나만의 갤러리를 만들어보세요."
        defaultExpanded={true}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                color="warning"
                size="sm"
                variant="flat"
                startContent={
                  <Icon icon="lucide:refresh-cw" className="text-sm" />
                }
                onPress={viewBuilder.resetSelection}
                type="button"
              >
                선택 초기화
              </Button>

              <Button
                color="primary"
                size="sm"
                variant="solid"
                startContent={
                  <Icon icon="lucide:plus-circle" className="text-sm" />
                }
                onPress={viewBuilder.handleAddToPreview}
                type="button"
                isDisabled={
                  viewBuilder.safeImageViewConfig.selectedImages.length === 0
                }
              >
                해당 뷰로 추가
              </Button>
            </div>
          </div>

          {viewBuilder.filteredAndSortedImages.length > 0 ? (
            <motion.div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${viewBuilder.safeImageViewConfig.layout.columns}, 1fr)`,
                gridAutoRows: '120px',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {viewBuilder.filteredAndSortedImages.map((image, index) => {
                  const isSelected = viewBuilder.isImageSelected(image.url);

                  return (
                    <motion.div
                      key={image.url}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`relative group cursor-pointer transition-all duration-200 hover:scale-105 ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{
                        gridColumn: 'span 1',
                        gridRow: 'span 1',
                        minHeight: '120px',
                      }}
                    >
                      <div className="relative w-full h-full overflow-hidden rounded-lg bg-default-100">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-110"
                          onClick={() =>
                            viewBuilder.handleImageClick(image.url)
                          }
                        />

                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white transition-transform duration-300 translate-y-full bg-gradient-to-t from-black/80 to-transparent group-hover:translate-y-0">
                          <p className="text-xs font-medium truncate">
                            {image.name}
                          </p>
                          <p className="text-xs opacity-80">
                            {formatFileSize(image.size)}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 bg-primary bg-opacity-20"></div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="p-8 text-center rounded-lg bg-default-100">
              <Icon
                icon="lucide:image-off"
                className="w-12 h-12 mx-auto mb-3 text-default-400"
                aria-hidden="true"
              />
              <p className="mb-3 text-default-600">
                사용 가능한 이미지가 없습니다.
              </p>
              <p className="text-sm text-default-500">
                메인 이미지나 슬라이더로 사용되지 않은 이미지만 선택할 수
                있습니다.
              </p>
            </div>
          )}
        </div>
      </AccordionField>
    );
  }, [viewBuilder]);

  return (
    <>
      <AccordionField
        title="업로드된 이미지"
        description={
          mediaFiles.length > 0
            ? `업로드된 이미지가 아래에 표시됩니다. (${mediaFiles.length}개)`
            : '업로드된 이미지가 여기에 표시됩니다.'
        }
        defaultExpanded={true}
      >
        {renderImageGallery()}
      </AccordionField>

      {mediaFiles.length > 0 && renderViewBuilder()}

      <ImagePreviewModal
        isOpen={modalState.isOpen}
        onClose={imageModal.closeImageModal}
        imageUrl={modalState.selectedImage}
        imageName={modalState.selectedImageName}
        isMobile={isMobile}
      />
    </>
  );
}

export default ImageGalleryContainer;
