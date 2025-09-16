// blogMediaStep/imageGallery/hooks/viewBuilder/useImageViewBuilder.ts

import { useCallback, useMemo } from 'react';
import { useImageGalleryStore } from '../../../../../../../../store/imageGallery/imageGalleryStore';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';
import {
  calculateImageSelection,
  createGalleryViewConfig,
  validateViewBuilderSelection,
  generateSuccessMessage,
  resetViewBuilderSelection,
} from '../../utils/viewBuilderUtils';

import { processImageFiles, ImageFileInfo } from '../../utils/galleryUtils';

interface ImageViewConfig {
  selectedImages: string[];
  clickOrder: number[];
  layout: {
    columns: number;
    gridType: 'grid' | 'masonry';
  };
  filter: 'all' | 'available';
}

interface ImageGalleryStoreType {
  getImageViewConfig: () => ImageViewConfig | null;
  updateImageViewConfig: (config: Partial<ImageViewConfig>) => void;
  addCustomGalleryView: (config: unknown) => void;
}

export interface ViewBuilderResult {
  safeImageViewConfig: ImageViewConfig;
  filteredAndSortedImages: ImageFileInfo[];
  handleImageClick: (imageUrl: string) => void;
  resetSelection: () => void;
  updateColumns: (columns: number) => void;
  handleAddToPreview: () => void;
  isImageSelected: (imageUrl: string) => boolean;
}

export const useImageViewBuilder = (
  view: 'grid' | 'masonry',
  sortBy: 'index' | 'name' | 'size',
  sortOrder: 'asc' | 'desc'
): ViewBuilderResult => {
  console.log('🔧 useImageViewBuilder 훅 초기화:', { view, sortBy, sortOrder });

  const rawImageGalleryStore = useImageGalleryStore();
  const imageGalleryStore = rawImageGalleryStore as ImageGalleryStoreType;

  const imageViewConfig = imageGalleryStore?.getImageViewConfig?.() || null;
  const updateImageViewConfig = imageGalleryStore?.updateImageViewConfig;
  const addCustomGalleryView = imageGalleryStore?.addCustomGalleryView;

  const { formValues, addToast } = useBlogMediaStepState();
  const { media, mainImage, sliderImages } = formValues;

  const safeImageViewConfig = useMemo(() => {
    console.log('🔧 safeImageViewConfig 메모이제이션 계산');

    const config: ImageViewConfig = imageViewConfig || {
      selectedImages: [],
      clickOrder: [],
      layout: {
        columns: 3,
        gridType: 'grid',
      },
      filter: 'available',
    };

    console.log('✅ safeImageViewConfig 결과:', {
      selectedCount: config.selectedImages.length,
      columns: config.layout.columns,
    });

    return config;
  }, [imageViewConfig]);

  const filteredAndSortedImages = useMemo(() => {
    console.log('🔧 filteredAndSortedImages 메모이제이션 계산');

    const result = processImageFiles(
      media,
      mainImage,
      sliderImages,
      sortBy,
      sortOrder
    );

    console.log('✅ filteredAndSortedImages 결과:', {
      totalCount: result.totalCount,
      actualCount: result.images.length,
    });

    return result.images;
  }, [media, mainImage, sliderImages, sortBy, sortOrder]);

  const handleImageClick = useCallback(
    (imageUrl: string) => {
      console.log('🔧 handleImageClick 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      if (!updateImageViewConfig) {
        console.log('⚠️ updateImageViewConfig 함수가 없음');
        return;
      }

      const selectionUpdate = calculateImageSelection(
        safeImageViewConfig.selectedImages,
        safeImageViewConfig.clickOrder,
        imageUrl
      );

      updateImageViewConfig(selectionUpdate);

      console.log('✅ handleImageClick 완료:', {
        selectedCount: selectionUpdate.selectedImages.length,
        action: safeImageViewConfig.selectedImages.includes(imageUrl)
          ? 'removed'
          : 'added',
      });
    },
    [updateImageViewConfig, safeImageViewConfig]
  );

  const resetSelection = useCallback(() => {
    console.log('🔧 resetSelection 호출');

    if (!updateImageViewConfig) {
      console.log('⚠️ updateImageViewConfig 함수가 없음');
      return;
    }

    const resetState = resetViewBuilderSelection();
    const resetConfig: Partial<ImageViewConfig> = {
      selectedImages: resetState.selectedImages,
      clickOrder: resetState.clickOrder,
      layout: resetState.layout,
      filter: 'available',
    };

    updateImageViewConfig(resetConfig);

    addToast({
      title: '선택 초기화',
      description: '모든 설정이 초기 상태로 되돌아갔습니다.',
      color: 'success',
    });

    console.log('✅ resetSelection 완료');
  }, [updateImageViewConfig, addToast]);

  const updateColumns = useCallback(
    (columns: number) => {
      console.log('🔧 updateColumns 호출:', { columns });

      if (!updateImageViewConfig) {
        console.log('⚠️ updateImageViewConfig 함수가 없음');
        return;
      }

      updateImageViewConfig({
        layout: {
          ...safeImageViewConfig.layout,
          columns,
        },
      });

      console.log('✅ updateColumns 완료:', { columns });
    },
    [updateImageViewConfig, safeImageViewConfig]
  );

  const handleAddToPreview = useCallback(() => {
    console.log('🔧 handleAddToPreview 호출:', {
      selectedCount: safeImageViewConfig.selectedImages.length,
    });

    if (!validateViewBuilderSelection(safeImageViewConfig.selectedImages)) {
      addToast({
        title: '이미지를 선택해주세요',
        description: '미리보기에 추가할 이미지를 먼저 선택해주세요.',
        color: 'warning',
      });
      console.log('⚠️ 선택된 이미지가 없음');
      return;
    }

    const galleryConfig = createGalleryViewConfig(
      safeImageViewConfig.selectedImages,
      safeImageViewConfig.clickOrder,
      safeImageViewConfig.layout.columns,
      view
    );

    if (addCustomGalleryView) {
      addCustomGalleryView(galleryConfig);
    }

    const successMessage = generateSuccessMessage(
      safeImageViewConfig.selectedImages.length,
      view
    );

    addToast({
      title: '갤러리 뷰 추가 완료',
      description: successMessage,
      color: 'success',
    });

    resetSelection();

    console.log('✅ handleAddToPreview 완료:', {
      galleryId: galleryConfig.id,
      selectedCount: safeImageViewConfig.selectedImages.length,
      view,
    });
  }, [
    safeImageViewConfig,
    view,
    addCustomGalleryView,
    addToast,
    resetSelection,
  ]);

  const isImageSelected = useCallback(
    (imageUrl: string): boolean => {
      console.log('🔧 isImageSelected 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const isSelected = safeImageViewConfig.selectedImages.includes(imageUrl);

      console.log('✅ isImageSelected 결과:', { isSelected });
      return isSelected;
    },
    [safeImageViewConfig.selectedImages]
  );

  console.log('✅ useImageViewBuilder 초기화 완료:', {
    selectedCount: safeImageViewConfig.selectedImages.length,
    filteredCount: filteredAndSortedImages.length,
    view,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    safeImageViewConfig,
    filteredAndSortedImages,
    handleImageClick,
    resetSelection,
    updateColumns,
    handleAddToPreview,
    isImageSelected,
  };
};
