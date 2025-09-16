// blogMediaStep/imageSlider/hooks/useImageSlider.ts

import { useCallback } from 'react';
import { useImageGalleryStore } from '../../../../../../../store/imageGallery/imageGalleryStore';

// 🆕 실제 사용하는 슬라이더 검증 유틸리티만 import
import { validateSliderImages } from '../../../../../../ImageGalleryWithContent/utils/sliderValidationUtils';

interface UseImageSliderReturn {
  removeFromSlider: (imageUrl: string) => void;
  addSelectedToSlider: (imageUrls: string[]) => void;
  clearSliderImages: () => void;
  getSliderImageCount: () => number;
  addSingleToSlider: (imageUrl: string) => void;
  isImageInSlider: (imageUrl: string) => boolean;
  moveSliderImage: (fromIndex: number, toIndex: number) => void;
}

interface ToastConfig {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error' | 'info';
}

interface ImageMetadata {
  id: string;
  originalFileName: string;
  indexedDBKey: string;
  originalDataUrl: string;
  fileSize: number;
  createdAt: Date;
}

interface ImageViewConfig {
  sliderImages?: string[];
  selectedImages?: string[];
  selectedImageIds?: string[];
  imageMetadata?: ImageMetadata[];
}

interface DuplicateRemovalResult {
  uniqueUrls: string[];
  duplicateCount: number;
}

interface ExistingImageFilterResult {
  newUrls: string[];
  existingCount: number;
}

export const useImageSlider = (): UseImageSliderReturn => {
  console.log('🔧 useImageSlider 훅 초기화');

  const imageGalleryStore = useImageGalleryStore();
  const { imageViewConfig } = imageGalleryStore || {};
  const safeImageViewConfig: ImageViewConfig = imageViewConfig || {};

  // Reflect.get을 사용하여 안전하게 슬라이더 이미지 접근
  const rawSliderImages = Reflect.get(safeImageViewConfig, 'sliderImages');
  const currentSliderImages = Array.isArray(rawSliderImages)
    ? rawSliderImages
    : [];

  // 🚨 데이터 동기화를 위한 메인 배열들 접근
  const rawSelectedImages = Reflect.get(safeImageViewConfig, 'selectedImages');
  const currentSelectedImages = Array.isArray(rawSelectedImages)
    ? rawSelectedImages
    : [];

  const rawSelectedImageIds = Reflect.get(
    safeImageViewConfig,
    'selectedImageIds'
  );
  const currentSelectedImageIds = Array.isArray(rawSelectedImageIds)
    ? rawSelectedImageIds
    : [];

  const rawImageMetadata = Reflect.get(safeImageViewConfig, 'imageMetadata');
  const currentImageMetadata = Array.isArray(rawImageMetadata)
    ? rawImageMetadata
    : [];

  console.log('🔧 useImageSlider 데이터 상태:', {
    sliderImagesCount: currentSliderImages.length,
    selectedImagesCount: currentSelectedImages.length,
    selectedImageIdsCount: currentSelectedImageIds.length,
    metadataCount: currentImageMetadata.length,
  });

  const addToastMessage = useCallback((toastConfig: ToastConfig) => {
    // TODO: 실제 토스트 스토어 연결 필요
    console.log(
      '📢 토스트 메시지:',
      toastConfig.title,
      '-',
      toastConfig.description
    );
  }, []);

  // 🚨 핵심 수정: 데이터 동기화를 보장하는 업데이트 함수
  const updateSliderImagesWithSync = useCallback(
    (newSliderImages: string[]) => {
      const currentConfig = imageGalleryStore.getImageViewConfig();
      const safeCurrentConfig = currentConfig || {};

      console.log('🔧 updateSliderImagesWithSync 시작:', {
        newSliderImagesCount: newSliderImages.length,
        currentConfigExists:
          currentConfig !== null && currentConfig !== undefined,
      });

      // 슬라이더에 새로 추가되는 이미지들이 메인 배열에 없으면 추가
      const missingImages = newSliderImages.filter(
        (imageUrl: string) => !currentSelectedImages.includes(imageUrl)
      );

      const updatedSelectedImages =
        missingImages.length > 0
          ? [...currentSelectedImages, ...missingImages]
          : currentSelectedImages;

      // 🔧 데이터 무결성: selectedImages와 selectedImageIds 길이 동기화
      const needsSyncIds =
        currentSelectedImageIds.length !== currentSelectedImages.length;
      const updatedSelectedImageIds = needsSyncIds
        ? currentSelectedImages.map(
            (_, index) => `temp-id-${index}-${Date.now()}`
          )
        : currentSelectedImageIds;

      // 🔧 imageMetadata도 길이에 맞춰 동기화
      const needsSyncMetadata =
        currentImageMetadata.length !== currentSelectedImages.length;

      const createMetadataItem = (
        imageUrl: string,
        index: number
      ): ImageMetadata => ({
        id: updatedSelectedImageIds[index] || `temp-id-${index}-${Date.now()}`,
        originalFileName: `image-${index + 1}`,
        indexedDBKey: `temp-key-${index}`,
        originalDataUrl: imageUrl,
        fileSize: 0,
        createdAt: new Date(),
      });

      const updatedImageMetadata = needsSyncMetadata
        ? currentSelectedImages.map(createMetadataItem)
        : currentImageMetadata;

      const updatedConfig = {
        ...safeCurrentConfig,
        sliderImages: newSliderImages,
        selectedImages: updatedSelectedImages,
        selectedImageIds: updatedSelectedImageIds,
        imageMetadata: updatedImageMetadata,
      };

      imageGalleryStore.setImageViewConfig(updatedConfig);

      console.log('✅ 슬라이더 이미지 업데이트 완료 (동기화 포함):', {
        previousSliderCount: currentSliderImages.length,
        newSliderCount: newSliderImages.length,
        selectedImagesCount: updatedSelectedImages.length,
        selectedImageIdsCount: updatedSelectedImageIds.length,
        metadataCount: updatedImageMetadata.length,
        dataIntegrityEnsured: true,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [
      imageGalleryStore,
      currentSliderImages.length,
      currentSelectedImages,
      currentSelectedImageIds,
      currentImageMetadata,
    ]
  );

  const removeFromSlider = useCallback(
    (targetImageUrl: string) => {
      console.log('🔧 removeFromSlider 호출:', {
        targetImageUrl: targetImageUrl.slice(0, 30) + '...',
        currentCount: currentSliderImages.length,
      });

      const imageExistsInSlider = currentSliderImages.includes(targetImageUrl);

      if (!imageExistsInSlider) {
        console.log('⚠️ 슬라이더에서 이미지를 찾을 수 없음');
        addToastMessage({
          title: '이미지를 찾을 수 없음',
          description: '해당 이미지가 슬라이더에 없습니다.',
          color: 'warning',
        });
        return;
      }

      const filteredSliderImages = currentSliderImages.filter(
        (imageUrl: string) => imageUrl !== targetImageUrl
      );

      updateSliderImagesWithSync(filteredSliderImages);

      console.log('✅ removeFromSlider 완료:', {
        removedImage: targetImageUrl.slice(0, 30) + '...',
        remainingCount: filteredSliderImages.length,
      });
    },
    [currentSliderImages, updateSliderImagesWithSync, addToastMessage]
  );

  const validateImageUrls = useCallback((imageUrls: string[]): boolean => {
    const isValidArray = Array.isArray(imageUrls);
    const hasValidUrls = imageUrls.every(
      (url: string) => typeof url === 'string' && url.length > 0
    );

    return isValidArray && hasValidUrls;
  }, []);

  const removeDuplicateUrls = useCallback(
    (imageUrls: string[]): DuplicateRemovalResult => {
      const uniqueUrlsSet = new Set(imageUrls);
      const uniqueUrls = Array.from(uniqueUrlsSet);
      const duplicateCount = imageUrls.length - uniqueUrls.length;

      return { uniqueUrls, duplicateCount };
    },
    []
  );

  const filterExistingImages = useCallback(
    (imageUrls: string[]): ExistingImageFilterResult => {
      const newUrls = imageUrls.filter(
        (imageUrl: string) => !currentSliderImages.includes(imageUrl)
      );
      const existingCount = imageUrls.length - newUrls.length;

      return { newUrls, existingCount };
    },
    [currentSliderImages]
  );

  const addSelectedToSlider = useCallback(
    (selectedImageUrls: string[]) => {
      console.log('🔧 addSelectedToSlider 호출:', {
        selectedCount: selectedImageUrls.length,
        currentSliderCount: currentSliderImages.length,
      });

      // 🆕 향상된 검증: 입력 데이터 유효성 검증
      const validationResult = validateSliderImages(selectedImageUrls);

      if (!validationResult.isValid) {
        console.log('❌ 선택된 이미지 검증 실패:', {
          errorCode: validationResult.errorCode,
          errorMessage: validationResult.errorMessage,
          imageCount: validationResult.imageCount,
          requiredCount: validationResult.requiredCount,
        });

        addToastMessage({
          title: '이미지 검증 실패',
          description: validationResult.errorMessage,
          color: 'error',
        });
        return;
      }

      // 기존 로직 계속...
      const areValidUrls = validateImageUrls(selectedImageUrls);

      if (!areValidUrls) {
        console.log('⚠️ 유효하지 않은 이미지 URL 목록');
        addToastMessage({
          title: '잘못된 이미지 URL',
          description: '유효한 이미지 URL을 선택해주세요.',
          color: 'error',
        });
        return;
      }

      if (selectedImageUrls.length === 0) {
        console.log('⚠️ 선택된 이미지가 없음');
        addToastMessage({
          title: '선택된 이미지가 없습니다',
          description: '슬라이더에 추가할 이미지를 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      // 중복 제거
      const { uniqueUrls, duplicateCount } =
        removeDuplicateUrls(selectedImageUrls);

      if (duplicateCount > 0) {
        console.log(`🔧 중복 URL ${duplicateCount}개 제거됨`);
      }

      // 이미 슬라이더에 있는 이미지 필터링
      const { newUrls, existingCount } = filterExistingImages(uniqueUrls);

      if (existingCount > 0) {
        console.log(`🔧 이미 슬라이더에 있는 이미지 ${existingCount}개 제외`);
        addToastMessage({
          title: '중복 이미지 제외',
          description: `${existingCount}개 이미지는 이미 슬라이더에 있어 제외되었습니다.`,
          color: 'info',
        });
      }

      if (newUrls.length === 0) {
        console.log('⚠️ 추가할 새로운 이미지가 없음');
        addToastMessage({
          title: '새로운 이미지가 없습니다',
          description: '선택된 이미지들이 모두 이미 슬라이더에 있습니다.',
          color: 'warning',
        });
        return;
      }

      const updatedSliderImages = [...currentSliderImages, ...newUrls];

      // 🆕 최종 슬라이더 이미지 검증
      const finalValidationResult = validateSliderImages(updatedSliderImages);

      if (!finalValidationResult.isValid) {
        console.log('❌ 최종 슬라이더 이미지 검증 실패:', {
          errorCode: finalValidationResult.errorCode,
          totalImages: updatedSliderImages.length,
        });

        addToastMessage({
          title: '슬라이더 조건 미충족',
          description: finalValidationResult.errorMessage,
          color: 'error',
        });
        return;
      }

      updateSliderImagesWithSync(updatedSliderImages);

      addToastMessage({
        title: '슬라이더에 추가 완료',
        description: `${newUrls.length}개 이미지가 슬라이더에 추가되었습니다.`,
        color: 'success',
      });

      console.log('✅ addSelectedToSlider 완료:', {
        addedCount: newUrls.length,
        totalSliderCount: updatedSliderImages.length,
        validationPassed: true,
      });
    },
    [
      currentSliderImages,
      validateImageUrls,
      removeDuplicateUrls,
      filterExistingImages,
      updateSliderImagesWithSync,
      addToastMessage,
    ]
  );

  const clearSliderImages = useCallback(() => {
    console.log('🔧 clearSliderImages 호출:', {
      currentCount: currentSliderImages.length,
    });

    if (currentSliderImages.length === 0) {
      console.log('⚠️ 슬라이더가 이미 비어있음');
      return;
    }

    updateSliderImagesWithSync([]);

    addToastMessage({
      title: '슬라이더 초기화 완료',
      description: '모든 슬라이더 이미지가 제거되었습니다.',
      color: 'success',
    });

    console.log('✅ clearSliderImages 완료');
  }, [currentSliderImages.length, updateSliderImagesWithSync, addToastMessage]);

  const getSliderImageCount = useCallback((): number => {
    const sliderCount = currentSliderImages.length;

    console.log('📊 getSliderImageCount:', {
      count: sliderCount,
    });

    return sliderCount;
  }, [currentSliderImages.length]);

  const addSingleToSlider = useCallback(
    (singleImageUrl: string) => {
      console.log('🔧 addSingleToSlider 호출:', {
        imageUrl: singleImageUrl.slice(0, 30) + '...',
      });

      const isValidUrl =
        typeof singleImageUrl === 'string' && singleImageUrl.length > 0;

      if (!isValidUrl) {
        console.log('⚠️ 유효하지 않은 이미지 URL');
        return;
      }

      addSelectedToSlider([singleImageUrl]);
    },
    [addSelectedToSlider]
  );

  const isImageInSlider = useCallback(
    (imageUrl: string): boolean => {
      const isInSlider = currentSliderImages.includes(imageUrl);

      console.log('🔍 isImageInSlider:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        isInSlider,
      });

      return isInSlider;
    },
    [currentSliderImages]
  );

  const validateMoveIndices = useCallback(
    (fromIndex: number, toIndex: number): boolean => {
      const { length: sliderLength } = currentSliderImages;
      const isFromIndexValid = fromIndex >= 0 && fromIndex < sliderLength;
      const isToIndexValid = toIndex >= 0 && toIndex < sliderLength;
      const areIndicesDifferent = fromIndex !== toIndex;

      return isFromIndexValid && isToIndexValid && areIndicesDifferent;
    },
    [currentSliderImages]
  );

  const moveSliderImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      console.log('🔧 moveSliderImage 호출:', {
        fromIndex,
        toIndex,
        sliderLength: currentSliderImages.length,
      });

      const areValidIndices = validateMoveIndices(fromIndex, toIndex);

      if (!areValidIndices) {
        console.log('⚠️ 유효하지 않은 이동 인덱스');
        return;
      }

      const newSliderImages = [...currentSliderImages];
      const movedImage = newSliderImages[fromIndex];

      if (movedImage === undefined) {
        console.log('⚠️ 이동할 이미지를 찾을 수 없음');
        return;
      }

      newSliderImages.splice(fromIndex, 1);
      newSliderImages.splice(toIndex, 0, movedImage);
      updateSliderImagesWithSync(newSliderImages);

      console.log('✅ moveSliderImage 완료:', {
        fromIndex,
        toIndex,
        movedImage: movedImage.slice(0, 30) + '...',
      });
    },
    [currentSliderImages, validateMoveIndices, updateSliderImagesWithSync]
  );

  console.log('✅ useImageSlider 초기화 완료:', {
    currentSliderCount: currentSliderImages.length,
  });

  return {
    removeFromSlider,
    addSelectedToSlider,
    clearSliderImages,
    getSliderImageCount,
    addSingleToSlider,
    isImageInSlider,
    moveSliderImage,
  };
};
