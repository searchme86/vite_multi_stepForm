// blogMediaStep/mainImage/hooks/useMainImageValidation.ts

import { useCallback, useMemo } from 'react';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';

interface MainImageValidationResult {
  validateMainImageSelection: (imageUrl: string) => {
    isValid: boolean;
    message?: string;
  };
  canSetAsMainImage: (imageUrl: string) => boolean;
  getMainImageValidationStatus: () => {
    hasMainImage: boolean;
    isValidMainImage: boolean;
    issues: string[];
  };
  isMainImageInMediaList: () => boolean;
}

export const useMainImageValidation = (): MainImageValidationResult => {
  console.log('🔧 useMainImageValidation 훅 초기화');

  const { currentFormValues } = useBlogMediaStepIntegration();
  const { media: mediaFiles, mainImage, sliderImages } = currentFormValues;

  const validateMainImageSelection = useCallback(
    (imageUrl: string) => {
      console.log('🔧 validateMainImageSelection 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      if (!mediaFiles.includes(imageUrl)) {
        const result = {
          isValid: false,
          message: '선택한 이미지가 미디어 목록에 없습니다.',
        };
        console.log('❌ 메인 이미지 검증 실패 - 미디어 목록에 없음:', result);
        return result;
      }

      if (mainImage === imageUrl) {
        const result = {
          isValid: false,
          message: '이미 메인 이미지로 설정되어 있습니다.',
        };
        console.log('⚠️ 메인 이미지 검증 - 이미 설정됨:', result);
        return result;
      }

      if (sliderImages.includes(imageUrl)) {
        console.log('⚠️ 슬라이더에 포함된 이미지를 메인으로 설정하려고 함');
      }

      const result = { isValid: true };
      console.log('✅ 메인 이미지 검증 성공:', result);
      return result;
    },
    [mediaFiles, mainImage, sliderImages]
  );

  const canSetAsMainImage = useCallback(
    (imageUrl: string): boolean => {
      console.log('🔧 canSetAsMainImage 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const canSet = mediaFiles.includes(imageUrl) && mainImage !== imageUrl;
      console.log('✅ canSetAsMainImage 결과:', { canSet });
      return canSet;
    },
    [mediaFiles, mainImage]
  );

  const getMainImageValidationStatus = useCallback(() => {
    console.log('🔧 getMainImageValidationStatus 호출');

    const hasMainImage = !!mainImage;
    const isValidMainImage = hasMainImage
      ? mediaFiles.includes(mainImage)
      : true;
    const issues: string[] = [];

    if (hasMainImage && !isValidMainImage) {
      issues.push('메인 이미지가 미디어 목록에 없습니다.');
    }

    if (hasMainImage && sliderImages.includes(mainImage)) {
      issues.push('메인 이미지가 슬라이더에도 포함되어 있습니다.');
    }

    const status = { hasMainImage, isValidMainImage, issues };
    console.log('✅ getMainImageValidationStatus 결과:', status);
    return status;
  }, [mainImage, mediaFiles, sliderImages]);

  const isMainImageInMediaList = useCallback((): boolean => {
    if (!mainImage) {
      console.log('🔧 isMainImageInMediaList - 메인 이미지 없음');
      return true;
    }

    const isInList = mediaFiles.includes(mainImage);
    console.log('🔧 isMainImageInMediaList:', { isInList });
    return isInList;
  }, [mainImage, mediaFiles]);

  const validationSummary = useMemo(() => {
    return {
      hasMainImage: !!mainImage,
      mainImageCount: mainImage ? 1 : 0,
      mediaCount: mediaFiles.length,
      isMainImageValid: !mainImage || mediaFiles.includes(mainImage),
    };
  }, [mainImage, mediaFiles]);

  console.log('✅ useMainImageValidation 초기화 완료:', validationSummary);

  return {
    validateMainImageSelection,
    canSetAsMainImage,
    getMainImageValidationStatus,
    isMainImageInMediaList,
  };
};
