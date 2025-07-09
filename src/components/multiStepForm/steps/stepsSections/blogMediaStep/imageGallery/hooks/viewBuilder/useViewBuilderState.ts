// blogMediaStep/imageGallery/hooks/viewBuilder/useViewBuilderState.ts

import { useState, useCallback, useMemo } from 'react';
import { useImageGalleryStore } from '../../../../../../../../store/imageGallery/imageGalleryStore';
import { useBlogMediaStepState } from '../../../hooks/useBlogMediaStepState';
import {
  processImageFiles,
  type ImageFileInfo,
} from '../../utils/galleryUtils';
import { createDefaultViewBuilderState } from '../../utils/viewBuilderUtils';

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
}

export interface ViewBuilderStateResult {
  // 레이아웃 설정
  view: 'grid' | 'masonry';
  sortBy: 'index' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';

  // 새로운 모드 관리
  mode: 'all' | 'selected';
  selectedImages: string[];
  showPreview: boolean;
  previewLayout: 'grid' | 'masonry';

  // 계산된 상태
  safeImageViewConfig: ImageViewConfig;
  filteredAndSortedImages: ImageFileInfo[];

  // 유틸리티 함수
  isImageSelected: (imageUrl: string) => boolean;
  getSelectedCount: () => number;
  getTotalCount: () => number;

  // 상태 변경 함수
  setView: (view: 'grid' | 'masonry') => void;
  setSortBy: (sortBy: 'index' | 'name' | 'size') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setMode: (mode: 'all' | 'selected') => void;
  setSelectedImages: (images: string[]) => void;
  setShowPreview: (show: boolean) => void;
  setPreviewLayout: (layout: 'grid' | 'masonry') => void;
  resetViewBuilderState: () => void;
}

export const useViewBuilderState = (): ViewBuilderStateResult => {
  console.log('🔧 useViewBuilderState 훅 초기화');

  // 기존 상태
  const [view, setView] = useState<'grid' | 'masonry'>('grid');
  const [sortBy, setSortBy] = useState<'index' | 'name' | 'size'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 새로운 모드 관리 상태
  const [mode, setMode] = useState<'all' | 'selected'>('all');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLayout, setPreviewLayout] = useState<'grid' | 'masonry'>(
    'grid'
  );

  const rawImageGalleryStore = useImageGalleryStore();
  const imageGalleryStore = rawImageGalleryStore as ImageGalleryStoreType;

  const imageViewConfig = imageGalleryStore?.getImageViewConfig?.() || null;
  const { formValues } = useBlogMediaStepState();
  const { media, mainImage, sliderImages } = formValues;

  const safeImageViewConfig = useMemo(() => {
    console.log('🔧 safeImageViewConfig 메모이제이션 계산');

    const defaultState = createDefaultViewBuilderState();
    const config: ImageViewConfig = imageViewConfig || {
      selectedImages: selectedImages,
      clickOrder: selectedImages.map((_, index) => index + 1),
      layout: {
        columns: 3,
        gridType: view,
      },
      filter: 'available',
    };

    console.log('✅ safeImageViewConfig 결과:', {
      selectedCount: config.selectedImages.length,
      columns: config.layout.columns,
      gridType: config.layout.gridType,
    });

    return config;
  }, [imageViewConfig, selectedImages, view]);

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

      const isSelected = selectedImages.includes(imageUrl);

      console.log('✅ isImageSelected 결과:', { isSelected });
      return isSelected;
    },
    [selectedImages]
  );

  const getSelectedCount = useCallback((): number => {
    console.log('🔧 getSelectedCount 호출');

    const count = selectedImages.length;

    console.log('✅ getSelectedCount 결과:', { count });
    return count;
  }, [selectedImages]);

  const getTotalCount = useCallback((): number => {
    console.log('🔧 getTotalCount 호출');

    const count = filteredAndSortedImages.length;

    console.log('✅ getTotalCount 결과:', { count });
    return count;
  }, [filteredAndSortedImages]);

  const handleSetView = useCallback((newView: 'grid' | 'masonry') => {
    console.log('🔧 handleSetView 호출:', { newView });

    setView(newView);
    setPreviewLayout(newView);

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

  const handleSetMode = useCallback((newMode: 'all' | 'selected') => {
    console.log('🔧 handleSetMode 호출:', { newMode });

    setMode(newMode);

    if (newMode === 'all') {
      setSelectedImages([]);
      setShowPreview(false);
    }

    console.log('✅ handleSetMode 완료:', { newMode });
  }, []);

  const handleSetSelectedImages = useCallback((images: string[]) => {
    console.log('🔧 handleSetSelectedImages 호출:', { count: images.length });

    setSelectedImages(images);

    if (images.length > 0) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }

    console.log('✅ handleSetSelectedImages 완료:', { count: images.length });
  }, []);

  const handleSetShowPreview = useCallback((show: boolean) => {
    console.log('🔧 handleSetShowPreview 호출:', { show });

    setShowPreview(show);

    console.log('✅ handleSetShowPreview 완료:', { show });
  }, []);

  const handleSetPreviewLayout = useCallback((layout: 'grid' | 'masonry') => {
    console.log('🔧 handleSetPreviewLayout 호출:', { layout });

    setPreviewLayout(layout);

    console.log('✅ handleSetPreviewLayout 완료:', { layout });
  }, []);

  const resetViewBuilderState = useCallback(() => {
    console.log('🔧 resetViewBuilderState 호출');

    setView('grid');
    setSortBy('index');
    setSortOrder('asc');
    setMode('all');
    setSelectedImages([]);
    setShowPreview(false);
    setPreviewLayout('grid');

    console.log('✅ resetViewBuilderState 완료');
  }, []);

  const selectedCount = getSelectedCount();
  const totalCount = getTotalCount();

  console.log('✅ useViewBuilderState 초기화 완료:', {
    view,
    sortBy,
    sortOrder,
    mode,
    selectedCount,
    totalCount,
    showPreview,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    // 레이아웃 설정
    view,
    sortBy,
    sortOrder,

    // 모드 관리
    mode,
    selectedImages,
    showPreview,
    previewLayout,

    // 계산된 상태
    safeImageViewConfig,
    filteredAndSortedImages,

    // 유틸리티 함수
    isImageSelected,
    getSelectedCount,
    getTotalCount,

    // 상태 변경 함수
    setView: handleSetView,
    setSortBy: handleSetSortBy,
    setSortOrder: handleSetSortOrder,
    setMode: handleSetMode,
    setSelectedImages: handleSetSelectedImages,
    setShowPreview: handleSetShowPreview,
    setPreviewLayout: handleSetPreviewLayout,
    resetViewBuilderState,
  };
};
