// blogMediaStep/imageGallery/hooks/gallery/useImageSorting.ts - ImageGallery 컴포넌트

import { useMemo, useCallback } from 'react';
// import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';
import {
  processImageFiles,
  SortByType,
  SortOrderType,
  ImageFileInfo,
  // } from '../utils/galleryUtils';
} from '../../utils/galleryUtils.ts';

export interface SortingActions {
  setSortBy: (sortBy: SortByType) => void;
  setSortOrder: (sortOrder: SortOrderType) => void;
  getSortedImages: () => ImageFileInfo[];
  getCurrentSortBy: () => SortByType;
  getCurrentSortOrder: () => SortOrderType;
  resetSorting: () => void;
}

export const useImageSorting = (): SortingActions => {
  console.log('🔧 useImageSorting 훅 초기화');

  const {
    formValues,
    uiState,
    setSortBy: setStateSortBy,
  } = useBlogMediaStepState();

  const { media, mainImage, sliderImages } = formValues;
  const { sortBy } = uiState;

  const getSortedImages = useCallback((): ImageFileInfo[] => {
    console.log('🔧 getSortedImages 호출:', {
      mediaCount: media.length,
      sortBy,
      hasMainImage: !!mainImage,
      sliderCount: sliderImages.length,
    });

    const result = processImageFiles(
      media,
      mainImage,
      sliderImages,
      sortBy,
      'asc'
    );

    console.log('✅ getSortedImages 결과:', {
      sortedCount: result.images.length,
      totalCount: result.totalCount,
    });

    return result.images;
  }, [media, mainImage, sliderImages, sortBy]);

  const sortedImages = useMemo(() => {
    console.log('🔧 sortedImages 메모이제이션 계산');
    return getSortedImages();
  }, [getSortedImages]);

  const setSortBy = useCallback(
    (newSortBy: SortByType) => {
      console.log('🔧 setSortBy 호출:', {
        currentSortBy: sortBy,
        newSortBy,
      });

      setStateSortBy(newSortBy);

      console.log('✅ setSortBy 완료:', { newSortBy });
    },
    [sortBy, setStateSortBy]
  );

  const setSortOrder = useCallback((newSortOrder: SortOrderType) => {
    console.log('🔧 setSortOrder 호출:', { newSortOrder });

    console.log('✅ setSortOrder 완료:', { newSortOrder });
  }, []);

  const getCurrentSortBy = useCallback((): SortByType => {
    console.log('🔧 getCurrentSortBy 호출');

    console.log('✅ getCurrentSortBy 결과:', { sortBy });
    return sortBy;
  }, [sortBy]);

  const getCurrentSortOrder = useCallback((): SortOrderType => {
    console.log('🔧 getCurrentSortOrder 호출');

    const sortOrder: SortOrderType = 'asc';
    console.log('✅ getCurrentSortOrder 결과:', { sortOrder });
    return sortOrder;
  }, []);

  const resetSorting = useCallback(() => {
    console.log('🔧 resetSorting 호출');

    setSortBy('index');

    console.log('✅ resetSorting 완료');
  }, [setSortBy]);

  console.log('✅ useImageSorting 초기화 완료:', {
    sortBy,
    sortedImageCount: sortedImages.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    setSortBy,
    setSortOrder,
    getSortedImages,
    getCurrentSortBy,
    getCurrentSortOrder,
    resetSorting,
  };
};
