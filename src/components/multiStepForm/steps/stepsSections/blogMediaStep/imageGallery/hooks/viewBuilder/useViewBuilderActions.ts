// blogMediaStep/imageGallery/hooks/viewBuilder/useViewBuilderActions.ts

import { useCallback } from 'react';
import { useImageGalleryStore } from '../../../../../../../../store/imageGallery/imageGalleryStore';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';
import {
  calculateImageSelection,
  createGalleryViewConfig,
  resetViewBuilderSelection,
  ImageSelectionUpdate,
} from '../../utils/viewBuilderUtils';

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

export interface ViewBuilderActionsResult {
  handleImageClick: (imageUrl: string) => void;
  resetSelection: () => void;
  updateColumns: (columns: number) => void;
  handleAddToPreview: (view: 'grid' | 'masonry') => void;
  updateGridType: (gridType: 'grid' | 'masonry') => void;
  bulkSelectImages: (imageUrls: string[]) => void;
  clearAllSelections: () => void;
}

export const useViewBuilderActions = (): ViewBuilderActionsResult => {
  console.log('🔧 useViewBuilderActions 훅 초기화');

  const rawImageGalleryStore = useImageGalleryStore();
  const imageGalleryStore = rawImageGalleryStore as ImageGalleryStoreType;

  const imageViewConfig = imageGalleryStore?.getImageViewConfig?.() || null;
  const updateImageViewConfig = imageGalleryStore?.updateImageViewConfig;
  const addCustomGalleryView = imageGalleryStore?.addCustomGalleryView;

  const { addToast } = useBlogMediaStepState();

  const safeImageViewConfig: ImageViewConfig = imageViewConfig || {
    selectedImages: [],
    clickOrder: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'available',
  };

  const handleImageClick = useCallback(
    (imageUrl: string) => {
      console.log('🔧 handleImageClick 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      if (!updateImageViewConfig) {
        console.log('⚠️ updateImageViewConfig 함수가 없음');
        return;
      }

      const selectionUpdate: ImageSelectionUpdate = calculateImageSelection(
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

  const handleAddToPreview = useCallback(
    (view: 'grid' | 'masonry') => {
      console.log('🔧 handleAddToPreview 호출:', {
        view,
        selectedCount: safeImageViewConfig.selectedImages.length,
      });

      if (safeImageViewConfig.selectedImages.length === 0) {
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

      const displayName = view === 'grid' ? '균등 그리드' : '매스너리 레이아웃';
      addToast({
        title: '갤러리 뷰 추가 완료',
        description: `${safeImageViewConfig.selectedImages.length}개 이미지로 구성된 ${displayName} 갤러리가 미리보기에 추가되었습니다.`,
        color: 'success',
      });

      resetSelection();

      console.log('✅ handleAddToPreview 완료:', {
        galleryId: galleryConfig.id,
        selectedCount: safeImageViewConfig.selectedImages.length,
        view,
      });
    },
    [safeImageViewConfig, addCustomGalleryView, addToast, resetSelection]
  );

  const updateGridType = useCallback(
    (gridType: 'grid' | 'masonry') => {
      console.log('🔧 updateGridType 호출:', { gridType });

      if (!updateImageViewConfig) {
        console.log('⚠️ updateImageViewConfig 함수가 없음');
        return;
      }

      updateImageViewConfig({
        layout: {
          ...safeImageViewConfig.layout,
          gridType,
        },
      });

      console.log('✅ updateGridType 완료:', { gridType });
    },
    [updateImageViewConfig, safeImageViewConfig]
  );

  const bulkSelectImages = useCallback(
    (imageUrls: string[]) => {
      console.log('🔧 bulkSelectImages 호출:', { count: imageUrls.length });

      if (!updateImageViewConfig) {
        console.log('⚠️ updateImageViewConfig 함수가 없음');
        return;
      }

      const newClickOrder = imageUrls.map((_, index) => index + 1);

      updateImageViewConfig({
        selectedImages: [...imageUrls],
        clickOrder: newClickOrder,
      });

      console.log('✅ bulkSelectImages 완료:', {
        selectedCount: imageUrls.length,
        clickOrderCount: newClickOrder.length,
      });
    },
    [updateImageViewConfig]
  );

  const clearAllSelections = useCallback(() => {
    console.log('🔧 clearAllSelections 호출');

    if (!updateImageViewConfig) {
      console.log('⚠️ updateImageViewConfig 함수가 없음');
      return;
    }

    updateImageViewConfig({
      selectedImages: [],
      clickOrder: [],
    });

    console.log('✅ clearAllSelections 완료');
  }, [updateImageViewConfig]);

  console.log('✅ useViewBuilderActions 초기화 완료:', {
    selectedCount: safeImageViewConfig.selectedImages.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    handleImageClick,
    resetSelection,
    updateColumns,
    handleAddToPreview,
    updateGridType,
    bulkSelectImages,
    clearAllSelections,
  };
};
