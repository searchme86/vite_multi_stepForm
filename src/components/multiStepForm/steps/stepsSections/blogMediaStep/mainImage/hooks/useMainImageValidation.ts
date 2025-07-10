// 📁 blogMediaStep/mainImage/hooks/useMainImageValidation.ts

import { useCallback, useMemo } from 'react';
import type { FormValues } from '../../../../../../../store/shared/commonTypes';

interface MainImageValidationProps {
  formValues: FormValues;
}

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

export const useMainImageValidation = ({
  formValues: currentFormValues,
}: MainImageValidationProps): MainImageValidationResult => {
  console.log('🔧 useMainImageValidation 훅 초기화 - 에러수정수정');

  // 🔧 구조분해할당 + fallback 패턴으로 undefined 방지
  const safeFormValues = currentFormValues ?? {};
  const {
    media: rawMediaFilesList,
    mainImage: rawMainImageUrl,
    sliderImages: rawSliderImagesList,
  } = safeFormValues;

  const mediaFilesList = rawMediaFilesList ?? [];
  const currentMainImageUrl = rawMainImageUrl ?? '';
  const sliderImagesList = rawSliderImagesList ?? [];

  const validateMainImageSelection = useCallback(
    (imageUrl: string) => {
      const imageUrlPreview = imageUrl.slice(0, 30) + '...';

      console.log('🔧 validateMainImageSelection 호출:', {
        imageUrlPreview,
        timestamp: new Date().toLocaleTimeString(),
      });

      const isImageInMediaList = mediaFilesList.includes(imageUrl);
      if (!isImageInMediaList) {
        const result = {
          isValid: false,
          message: '선택한 이미지가 미디어 목록에 없습니다.',
        };
        console.log('❌ 메인 이미지 검증 실패 - 미디어 목록에 없음:', {
          imageUrlPreview,
          result,
        });
        return result;
      }

      const isAlreadyMainImage = currentMainImageUrl === imageUrl;
      if (isAlreadyMainImage) {
        const result = {
          isValid: false,
          message: '이미 메인 이미지로 설정되어 있습니다.',
        };
        console.log('⚠️ 메인 이미지 검증 - 이미 설정됨:', {
          imageUrlPreview,
          result,
        });
        return result;
      }

      const isInSliderImages = sliderImagesList.includes(imageUrl);
      if (isInSliderImages) {
        console.log('⚠️ 슬라이더에 포함된 이미지를 메인으로 설정하려고 함:', {
          imageUrlPreview,
        });
      }

      const result = { isValid: true };
      console.log('✅ 메인 이미지 검증 성공:', {
        imageUrlPreview,
        result,
      });
      return result;
    },
    [mediaFilesList, currentMainImageUrl, sliderImagesList]
  );

  const canSetAsMainImage = useCallback(
    (imageUrl: string): boolean => {
      const imageUrlPreview = imageUrl.slice(0, 30) + '...';

      console.log('🔧 canSetAsMainImage 호출:', {
        imageUrlPreview,
        timestamp: new Date().toLocaleTimeString(),
      });

      const isInMediaList = mediaFilesList.includes(imageUrl);
      const isNotCurrentMain = currentMainImageUrl !== imageUrl;
      const canSetImage = isInMediaList && isNotCurrentMain;

      console.log('✅ canSetAsMainImage 결과:', {
        imageUrlPreview,
        isInMediaList,
        isNotCurrentMain,
        canSetImage,
      });

      return canSetImage;
    },
    [mediaFilesList, currentMainImageUrl]
  );

  const getMainImageValidationStatus = useCallback(() => {
    console.log('🔧 getMainImageValidationStatus 호출');

    const hasMainImage =
      currentMainImageUrl !== null &&
      currentMainImageUrl !== undefined &&
      currentMainImageUrl !== '';
    const isValidMainImage =
      hasMainImage && currentMainImageUrl
        ? mediaFilesList.includes(currentMainImageUrl)
        : true;
    const issuesList: string[] = [];

    if (hasMainImage && currentMainImageUrl && !isValidMainImage) {
      issuesList.push('메인 이미지가 미디어 목록에 없습니다.');
    }

    const isMainImageInSlider =
      hasMainImage &&
      currentMainImageUrl &&
      sliderImagesList.includes(currentMainImageUrl);
    if (isMainImageInSlider) {
      issuesList.push('메인 이미지가 슬라이더에도 포함되어 있습니다.');
    }

    const validationStatus = {
      hasMainImage,
      isValidMainImage,
      issues: issuesList,
    };

    console.log('✅ getMainImageValidationStatus 결과:', {
      validationStatus,
      currentMainImagePreview:
        hasMainImage && currentMainImageUrl
          ? currentMainImageUrl.slice(0, 30) + '...'
          : 'none',
    });

    return validationStatus;
  }, [currentMainImageUrl, mediaFilesList, sliderImagesList]);

  const isMainImageInMediaList = useCallback((): boolean => {
    const hasMainImage =
      currentMainImageUrl !== null &&
      currentMainImageUrl !== undefined &&
      currentMainImageUrl !== '';

    if (!hasMainImage || !currentMainImageUrl) {
      console.log('🔧 isMainImageInMediaList - 메인 이미지 없음');
      return true;
    }

    const isInList = mediaFilesList.includes(currentMainImageUrl);
    console.log('🔧 isMainImageInMediaList:', {
      isInList,
      currentMainImagePreview: currentMainImageUrl.slice(0, 30) + '...',
    });
    return isInList;
  }, [currentMainImageUrl, mediaFilesList]);

  const validationSummaryData = useMemo(() => {
    const hasMainImage =
      currentMainImageUrl !== null &&
      currentMainImageUrl !== undefined &&
      currentMainImageUrl !== '';
    const mainImageCount = hasMainImage ? 1 : 0;
    const isMainImageValid =
      hasMainImage && currentMainImageUrl
        ? mediaFilesList.includes(currentMainImageUrl)
        : true;

    return {
      hasMainImage,
      mainImageCount,
      mediaCount: mediaFilesList.length,
      isMainImageValid,
    };
  }, [currentMainImageUrl, mediaFilesList]);

  console.log('✅ useMainImageValidation 초기화 완료 - 에러수정수정:', {
    validationSummary: validationSummaryData,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    validateMainImageSelection,
    canSetAsMainImage,
    getMainImageValidationStatus,
    isMainImageInMediaList,
  };
};
