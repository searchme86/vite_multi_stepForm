// blogMediaStep/imageGallery/hooks/viewBuilder/useViewBuilderActions.ts

import { useCallback } from 'react';
import { useImageGalleryStore } from '../../../../../../../../store/imageGallery/imageGalleryStore';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';
import {
  calculateImageSelection,
  createGalleryViewConfig,
  resetViewBuilderSelection,
  createAllImagesGalleryConfig,
  generateViewTypeDisplayName,
  type ImageSelectionUpdate,
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
  // 기존 액션들
  handleImageClick: (imageUrl: string) => void;
  resetSelection: () => void;
  updateColumns: (columns: number) => void;
  updateGridType: (gridType: 'grid' | 'masonry') => void;

  // 새로운 모드별 액션들
  handleAddAllImages: (layout: 'grid' | 'masonry', columns: number) => void;
  handleAddSelectedImages: (
    layout: 'grid' | 'masonry',
    columns: number
  ) => void;
  handleModeChange: (mode: 'all' | 'selected') => void;
  handleImageSelect: (
    imageUrl: string,
    currentMode: 'all' | 'selected',
    currentSelectedImages: string[]
  ) => string[];

  // 유틸리티 액션들
  bulkSelectImages: (imageUrls: string[]) => void;
  clearAllSelections: () => void;
  toggleImageSelection: (
    imageUrl: string,
    currentSelectedImages: string[]
  ) => string[];
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

  // 기존 이미지 클릭 핸들러 (Store 연동용)
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

  // 전체 이미지로 뷰 생성 (새로운 기능)
  const handleAddAllImages = useCallback(
    (layout: 'grid' | 'masonry', columns: number) => {
      console.log('🔧 handleAddAllImages 호출:', { layout, columns });

      const { formValues } = useBlogMediaStepState();
      const { media, mainImage, sliderImages } = formValues;

      // 사용 가능한 모든 이미지 필터링
      const availableImages = media.filter(
        (img) =>
          (!mainImage || mainImage !== img) &&
          !(Array.isArray(sliderImages) && sliderImages.includes(img))
      );

      if (availableImages.length === 0) {
        addToast({
          title: '사용 가능한 이미지가 없습니다',
          description: '갤러리에 추가할 수 있는 이미지가 없습니다.',
          color: 'warning',
        });
        console.log('⚠️ 사용 가능한 이미지가 없음');
        return;
      }

      const galleryConfig = createAllImagesGalleryConfig(
        availableImages,
        columns,
        layout
      );

      if (addCustomGalleryView) {
        addCustomGalleryView(galleryConfig);
      }

      const displayName = generateViewTypeDisplayName(layout);
      addToast({
        title: '전체 이미지 갤러리 뷰 추가 완료',
        description: `${availableImages.length}개 이미지로 구성된 ${displayName} 갤러리가 미리보기에 추가되었습니다.`,
        color: 'success',
      });

      console.log('✅ handleAddAllImages 완료:', {
        galleryId: galleryConfig.id,
        imageCount: availableImages.length,
        layout,
        columns,
      });
    },
    [addCustomGalleryView, addToast]
  );

  // 선택된 이미지로 뷰 생성 (기존 기능 개선)
  const handleAddSelectedImages = useCallback(
    (layout: 'grid' | 'masonry', columns: number) => {
      console.log('🔧 handleAddSelectedImages 호출:', { layout, columns });

      if (!updateImageViewConfig || !addCustomGalleryView) {
        console.log('⚠️ 필요한 스토어 함수가 없음');
        return;
      }

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
        columns,
        layout
      );

      addCustomGalleryView(galleryConfig);

      const displayName = generateViewTypeDisplayName(layout);
      addToast({
        title: '선택된 이미지 갤러리 뷰 추가 완료',
        description: `${safeImageViewConfig.selectedImages.length}개 이미지로 구성된 ${displayName} 갤러리가 미리보기에 추가되었습니다.`,
        color: 'success',
      });

      // 선택 상태 초기화
      resetSelection();

      console.log('✅ handleAddSelectedImages 완료:', {
        galleryId: galleryConfig.id,
        selectedCount: safeImageViewConfig.selectedImages.length,
        layout,
        columns,
      });
    },
    [safeImageViewConfig, addCustomGalleryView, addToast, updateImageViewConfig]
  );

  // 모드 변경 핸들러 (새로운 기능)
  const handleModeChange = useCallback(
    (mode: 'all' | 'selected') => {
      console.log('🔧 handleModeChange 호출:', { mode });

      if (mode === 'all' && updateImageViewConfig) {
        // 전체 모드로 변경 시 선택 상태 초기화
        updateImageViewConfig({
          selectedImages: [],
          clickOrder: [],
        });
      }

      console.log('✅ handleModeChange 완료:', { mode });
    },
    [updateImageViewConfig]
  );

  // 로컬 이미지 선택 핸들러 (새로운 기능 - Store와 분리된 로컬 상태용)
  const handleImageSelect = useCallback(
    (
      imageUrl: string,
      currentMode: 'all' | 'selected',
      currentSelectedImages: string[]
    ): string[] => {
      console.log('🔧 handleImageSelect 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        currentMode,
        currentCount: currentSelectedImages.length,
      });

      if (currentMode === 'all') {
        console.log('⚠️ 전체 모드에서는 개별 선택 불가');
        return currentSelectedImages;
      }

      const isSelected = currentSelectedImages.includes(imageUrl);
      let newSelectedImages: string[];

      if (isSelected) {
        newSelectedImages = currentSelectedImages.filter(
          (img) => img !== imageUrl
        );
      } else {
        newSelectedImages = [...currentSelectedImages, imageUrl];
      }

      console.log('✅ handleImageSelect 완료:', {
        action: isSelected ? 'removed' : 'added',
        newCount: newSelectedImages.length,
      });

      return newSelectedImages;
    },
    []
  );

  // 이미지 선택 토글 (유틸리티)
  const toggleImageSelection = useCallback(
    (imageUrl: string, currentSelectedImages: string[]): string[] => {
      console.log('🔧 toggleImageSelection 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        currentCount: currentSelectedImages.length,
      });

      const isSelected = currentSelectedImages.includes(imageUrl);
      const newSelection = isSelected
        ? currentSelectedImages.filter((img) => img !== imageUrl)
        : [...currentSelectedImages, imageUrl];

      console.log('✅ toggleImageSelection 완료:', {
        action: isSelected ? 'removed' : 'added',
        newCount: newSelection.length,
      });

      return newSelection;
    },
    []
  );

  // 선택 상태 초기화
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

  // 컬럼 수 업데이트
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

  // 그리드 타입 업데이트
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

  // 일괄 선택
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

  // 모든 선택 해제
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
    // 기존 액션들
    handleImageClick,
    resetSelection,
    updateColumns,
    updateGridType,

    // 새로운 모드별 액션들
    handleAddAllImages,
    handleAddSelectedImages,
    handleModeChange,
    handleImageSelect,

    // 유틸리티 액션들
    bulkSelectImages,
    clearAllSelections,
    toggleImageSelection,
  };
};
