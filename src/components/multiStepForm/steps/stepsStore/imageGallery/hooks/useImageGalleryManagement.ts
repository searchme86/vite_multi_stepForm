import React from 'react';
import { useImageViewConfig } from './useImageViewConfig';
import { useCustomGalleryViews } from './useCustomGalleryViews';
import {
  ImageViewConfig,
  CustomGalleryView,
} from '../../../../types/galleryTypes.ts';

export const useImageGalleryManagement = () => {
  console.log(
    '🖼️ useImageGalleryManagement: 이미지/갤러리 통합 관리 훅 초기화'
  );

  const imageConfig = useImageViewConfig();
  const galleryViews = useCustomGalleryViews();

  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [galleryMode, setGalleryMode] = React.useState<
    'grid' | 'list' | 'masonry'
  >('grid');

  const selectImage = React.useCallback((imageUrl: string) => {
    console.log('🖼️ useImageGalleryManagement: 이미지 선택', imageUrl);
    setSelectedImages((prev) =>
      prev.includes(imageUrl)
        ? prev.filter((url) => url !== imageUrl)
        : [...prev, imageUrl]
    );
  }, []);

  const selectAllImages = React.useCallback((images: string[]) => {
    console.log('🖼️ useImageGalleryManagement: 모든 이미지 선택');
    setSelectedImages(images);
  }, []);

  const clearSelection = React.useCallback(() => {
    console.log('🖼️ useImageGalleryManagement: 선택 해제');
    setSelectedImages([]);
  }, []);

  const createGalleryFromSelection = React.useCallback(
    (name: string) => {
      console.log('🖼️ useImageGalleryManagement: 선택된 이미지로 갤러리 생성');

      const newGallery: CustomGalleryView = {
        id: `gallery-${Date.now()}`,
        name,
        config: imageConfig.imageViewConfig,
        images: selectedImages,
        createdAt: new Date(),
      };

      galleryViews.addCustomGalleryView(newGallery);
      clearSelection();

      return newGallery;
    },
    [selectedImages, imageConfig.imageViewConfig, galleryViews, clearSelection]
  );

  const getGalleryStats = React.useCallback(() => {
    const stats = {
      totalGalleries: galleryViews.customGalleryViews.length,
      totalImages: galleryViews.customGalleryViews.reduce(
        (acc, gallery) => acc + gallery.images.length,
        0
      ),
      selectedCount: selectedImages.length,
      currentMode: galleryMode,
    };

    console.log('🖼️ useImageGalleryManagement: 갤러리 통계', stats);
    return stats;
  }, [galleryViews.customGalleryViews, selectedImages.length, galleryMode]);

  return {
    // Image Config
    ...imageConfig,

    // Gallery Views
    ...galleryViews,

    // Selection Management
    selectedImages,
    selectImage,
    selectAllImages,
    clearSelection,

    // Gallery Mode
    galleryMode,
    setGalleryMode,

    // Gallery Creation
    createGalleryFromSelection,

    // Stats
    getGalleryStats,
  };
};
