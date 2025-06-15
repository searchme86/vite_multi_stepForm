// blogMediaStep/imageGallery/hooks/viewBuilder/useViewBuilderState.ts - ImageGallery 컴포넌트

import { useState, useCallback, useMemo } from 'react';
import { useImageGalleryStore } from '../../../../../../../../store/imageGallery/imageGalleryStore';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';
import { processImageFiles, ImageFileInfo } from '../../utils/galleryUtils';
import {
  ViewBuilderState,
  createDefaultViewBuilderState,
} from '../../utils/viewBuilderUtils';

export interface ViewBuilderStateResult {
  view: 'grid' | 'masonry';
  sortBy: 'index' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  safeImageViewConfig: ReturnType<
    typeof useImageGalleryStore
  >['getImageViewConfig'];
  filteredAndSortedImages: ImageFileInfo[];
  isImageSelected: (imageUrl: string) => boolean;
  getSelectedCount: () => number;
  setView: (view: 'grid' | 'masonry') => void;
  setSortBy: (sortBy: 'index' | 'name' | 'size') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  resetViewBuilderState: () => void;
}

export const useViewBuilderState = (): ViewBuilderStateResult => {
  console.log('🔧 useViewBuilderState 훅 초기화');

  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const imageViewConfig = useImageGalleryStore((state) =>
    state.getImageViewConfig()
  );
  const { formValues } = useBlogMediaStepState();
  const { media, mainImage, sliderImages } = formValues;

  const safeImageViewConfig = useMemo(() => {
    console.log('🔧 safeImageViewConfig 메모이제이션 계산');

    const config = imageViewConfig || createDefaultViewBuilderState();

    console.log('✅ safeImageViewConfig 결과:', {
      selectedCount: config.selectedImages.length,
      columns: config.layout.columns,
    });

    return config;
  }, [imageViewConfig]);

  const filteredAndSortedImages = useMemo(() => {
    console.log('🔧 filteredAndSortedImages 메모이제이션 계산:', {
      mediaCount: media.length,
      sortBy,
      sortOrder,
    });

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

  const getSelectedCount = useCallback((): number => {
    console.log('🔧 getSelectedCount 호출');

    const count = safeImageViewConfig.selectedImages.length;

    console.log('✅ getSelectedCount 결과:', { count });
    return count;
  }, [safeImageViewConfig.selectedImages]);

  const handleSetView = useCallback((newView: 'grid' | 'masonry') => {
    console.log('🔧 handleSetView 호출:', { newView });

    setView(newView);

    console.log('✅ handleSetView 완료:', { newView });
  }, []);

  const handleSetSortBy = useCallback(
    (newSortBy: 'index' | 'name' | 'size') => {
      console.log('🔧 handleSetSortBy 호출:', { newSortBy });

      setSortBy(newSortBy);

      console.log('✅ handleSetSortBy 완료:', { newSortBy });
    },
    []
  );

  const handleSetSortOrder = useCallback((newSortOrder: 'asc' | 'desc') => {
    console.log('🔧 handleSetSortOrder 호출:', { newSortOrder });

    setSortOrder(newSortOrder);

    console.log('✅ handleSetSortOrder 완료:', { newSortOrder });
  }, []);

  const resetViewBuilderState = useCallback(() => {
    console.log('🔧 resetViewBuilderState 호출');

    setView('grid');
    setSortBy('index');
    setSortOrder('asc');

    console.log('✅ resetViewBuilderState 완료');
  }, []);

  const selectedCount = getSelectedCount();
  const availableImageCount = filteredAndSortedImages.length;

  console.log('✅ useViewBuilderState 초기화 완료:', {
    view,
    sortBy,
    sortOrder,
    selectedCount,
    availableImageCount,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    view,
    sortBy,
    sortOrder,
    safeImageViewConfig,
    filteredAndSortedImages,
    isImageSelected,
    getSelectedCount,
    setView: handleSetView,
    setSortBy: handleSetSortBy,
    setSortOrder: handleSetSortOrder,
    resetViewBuilderState,
  };
};
