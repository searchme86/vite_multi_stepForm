// blogMediaStep/imageSlider/hooks/useImageSlider.ts

import { useCallback } from 'react';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';

interface ImageSliderResult {
  localSliderImages: string[];
  toggleSliderSelection: (imageUrl: string) => void;
  removeFromSlider: (imageUrl: string) => void;
  addSelectedToSlider: (selectedImages: string[]) => void;
  clearSliderImages: () => void;
  isImageInSlider: (imageUrl: string) => boolean;
  getSliderImageCount: () => number;
}

export const useImageSlider = (): ImageSliderResult => {
  console.log('🔧 useImageSlider 훅 초기화');

  const { currentFormValues, setSliderImagesValue, addToast } =
    useBlogMediaStepIntegration();

  const { sliderImages: localSliderImages, mainImage } = currentFormValues;

  const toggleSliderSelection = useCallback(
    (imageUrl: string) => {
      console.log('🔧 toggleSliderSelection 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      if (mainImage === imageUrl) {
        addToast({
          title: '선택 불가',
          description: '이미 메인 이미지로 선택된 이미지입니다.',
          color: 'warning',
        });
        console.log('⚠️ 메인 이미지는 슬라이더에 추가 불가');
        return;
      }

      const newImages = localSliderImages.includes(imageUrl)
        ? localSliderImages.filter((img) => img !== imageUrl)
        : [...localSliderImages, imageUrl];

      setSliderImagesValue(newImages);

      console.log('✅ toggleSliderSelection 완료:', {
        action: localSliderImages.includes(imageUrl) ? 'removed' : 'added',
        newCount: newImages.length,
      });
    },
    [mainImage, localSliderImages, setSliderImagesValue, addToast]
  );

  const removeFromSlider = useCallback(
    (imageUrl: string) => {
      console.log('🔧 removeFromSlider 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const newImages = localSliderImages.filter((img) => img !== imageUrl);
      setSliderImagesValue(newImages);

      console.log('✅ removeFromSlider 완료:', { newCount: newImages.length });
    },
    [localSliderImages, setSliderImagesValue]
  );

  const addSelectedToSlider = useCallback(
    (selectedImages: string[]) => {
      console.log('🔧 addSelectedToSlider 호출:', {
        count: selectedImages.length,
      });

      if (selectedImages.length === 0) {
        addToast({
          title: '선택된 이미지가 없습니다',
          description: '슬라이더에 추가할 이미지를 먼저 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      const newSliderImages: string[] = [];

      selectedImages.forEach((imageUrl) => {
        if (
          imageUrl &&
          imageUrl !== mainImage &&
          !localSliderImages.includes(imageUrl)
        ) {
          newSliderImages.push(imageUrl);
        }
      });

      if (newSliderImages.length === 0) {
        addToast({
          title: '추가할 수 있는 이미지가 없습니다',
          description: '메인 이미지이거나 이미 슬라이더에 추가된 이미지입니다.',
          color: 'warning',
        });
        return;
      }

      const updatedImages = [...localSliderImages, ...newSliderImages];
      setSliderImagesValue(updatedImages);

      addToast({
        title: '슬라이더에 추가 완료',
        description: `${newSliderImages.length}개의 이미지가 슬라이더에 추가되었습니다.`,
        color: 'success',
      });

      console.log('✅ addSelectedToSlider 완료:', {
        기존: localSliderImages.length,
        추가: newSliderImages.length,
        최종: updatedImages.length,
      });
    },
    [localSliderImages, mainImage, setSliderImagesValue, addToast]
  );

  const clearSliderImages = useCallback(() => {
    console.log('🔧 clearSliderImages 호출');

    setSliderImagesValue([]);

    addToast({
      title: '슬라이더 초기화',
      description: '모든 슬라이더 이미지가 제거되었습니다.',
      color: 'success',
    });

    console.log('✅ clearSliderImages 완료');
  }, [setSliderImagesValue, addToast]);

  const isImageInSlider = useCallback(
    (imageUrl: string): boolean => {
      const result = localSliderImages.includes(imageUrl);
      console.log('🔧 isImageInSlider:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        result,
      });
      return result;
    },
    [localSliderImages]
  );

  const getSliderImageCount = useCallback((): number => {
    const count = localSliderImages.length;
    console.log('🔧 getSliderImageCount:', { count });
    return count;
  }, [localSliderImages]);

  console.log('✅ useImageSlider 초기화 완료:', {
    sliderCount: localSliderImages.length,
    hasMainImage: !!mainImage,
  });

  return {
    localSliderImages,
    toggleSliderSelection,
    removeFromSlider,
    addSelectedToSlider,
    clearSliderImages,
    isImageInSlider,
    getSliderImageCount,
  };
};
