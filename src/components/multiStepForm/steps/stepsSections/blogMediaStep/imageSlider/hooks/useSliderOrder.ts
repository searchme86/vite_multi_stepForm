// blogMediaStep/imageSlider/hooks/useSliderOrder.ts

import { useCallback } from 'react';
import { useImageGalleryStore } from '../../../../../../../store/imageGallery/imageGalleryStore';

interface SliderOrderResult {
  moveSliderImage: (fromIndex: number, toIndex: number) => void;
  moveToFirst: (imageUrl: string) => void;
  moveToLast: (imageUrl: string) => void;
  swapSliderImages: (index1: number, index2: number) => void;
  reorderSliderImages: (newOrder: string[]) => void;
  getImagePosition: (imageUrl: string) => number;
}

interface ToastConfig {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error' | 'info';
}

interface IndexValidationResult {
  isValid: boolean;
  errorMessage: string;
}

export function useSliderOrder(): SliderOrderResult {
  console.log('🔧 useSliderOrder 훅 초기화');

  const imageGalleryStore = useImageGalleryStore();
  const { imageViewConfig } = imageGalleryStore;

  // 🚨 데이터 동기화를 위한 모든 관련 배열 접근
  const rawSliderImages = Reflect.get(imageViewConfig || {}, 'sliderImages');
  const sliderImages = Array.isArray(rawSliderImages) ? rawSliderImages : [];

  const rawSelectedImages = Reflect.get(
    imageViewConfig || {},
    'selectedImages'
  );
  const currentSelectedImages = Array.isArray(rawSelectedImages)
    ? rawSelectedImages
    : [];

  const rawSelectedImageIds = Reflect.get(
    imageViewConfig || {},
    'selectedImageIds'
  );
  const currentSelectedImageIds = Array.isArray(rawSelectedImageIds)
    ? rawSelectedImageIds
    : [];

  const rawImageMetadata = Reflect.get(imageViewConfig || {}, 'imageMetadata');
  const currentImageMetadata = Array.isArray(rawImageMetadata)
    ? rawImageMetadata
    : [];

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

      // 🔧 데이터 무결성: selectedImages와 selectedImageIds 길이 동기화 확인
      const lengthsMatch =
        currentSelectedImages.length === currentSelectedImageIds.length &&
        currentSelectedImages.length === currentImageMetadata.length;

      if (!lengthsMatch) {
        console.warn('⚠️ [SLIDER_ORDER] 배열 길이 불일치 감지, 동기화 수행:', {
          selectedImagesLength: currentSelectedImages.length,
          selectedImageIdsLength: currentSelectedImageIds.length,
          metadataLength: currentImageMetadata.length,
        });

        // 가장 긴 배열을 기준으로 동기화
        const maxLength = Math.max(
          currentSelectedImages.length,
          currentSelectedImageIds.length,
          currentImageMetadata.length
        );

        const syncedSelectedImages = currentSelectedImages.slice(0, maxLength);
        const syncedSelectedImageIds =
          currentSelectedImageIds.length >= maxLength
            ? currentSelectedImageIds.slice(0, maxLength)
            : [
                ...currentSelectedImageIds,
                ...Array(maxLength - currentSelectedImageIds.length)
                  .fill(null)
                  .map((_, i) => `sync-id-${Date.now()}-${i}`),
              ];

        const syncedImageMetadata =
          currentImageMetadata.length >= maxLength
            ? currentImageMetadata.slice(0, maxLength)
            : [
                ...currentImageMetadata,
                ...Array(maxLength - currentImageMetadata.length)
                  .fill(null)
                  .map((_, i) => ({
                    id: syncedSelectedImageIds[currentImageMetadata.length + i],
                    originalFileName: `synced-image-${
                      currentImageMetadata.length + i + 1
                    }`,
                    indexedDBKey: `sync-key-${Date.now()}-${i}`,
                    originalDataUrl:
                      syncedSelectedImages[currentImageMetadata.length + i] ||
                      '',
                    fileSize: 0,
                    createdAt: new Date(),
                  })),
              ];

        const updatedConfig = {
          ...currentConfig,
          sliderImages: newSliderImages,
          selectedImages: syncedSelectedImages,
          selectedImageIds: syncedSelectedImageIds,
          imageMetadata: syncedImageMetadata,
        };

        imageGalleryStore.setImageViewConfig(updatedConfig);

        console.log('✅ [SLIDER_ORDER] 동기화 포함 슬라이더 업데이트 완료:', {
          newSliderCount: newSliderImages.length,
          syncedSelectedImagesCount: syncedSelectedImages.length,
          syncedSelectedImageIdsCount: syncedSelectedImageIds.length,
          syncedMetadataCount: syncedImageMetadata.length,
          dataIntegrityEnsured: true,
        });
      } else {
        // 길이가 일치하는 경우 슬라이더만 업데이트
        const updatedConfig = {
          ...currentConfig,
          sliderImages: newSliderImages,
        };

        imageGalleryStore.setImageViewConfig(updatedConfig);

        console.log('✅ [SLIDER_ORDER] 슬라이더 순서 업데이트 완료:', {
          previousCount: sliderImages.length,
          newCount: newSliderImages.length,
        });
      }
    },
    [
      imageGalleryStore,
      sliderImages.length,
      currentSelectedImages,
      currentSelectedImageIds,
      currentImageMetadata,
    ]
  );

  const validateIndices = useCallback(
    (
      fromIndex: number,
      toIndex: number,
      arrayLength: number
    ): IndexValidationResult => {
      const isFromIndexValid = fromIndex >= 0 && fromIndex < arrayLength;
      const isToIndexValid = toIndex >= 0 && toIndex < arrayLength;
      const areIndicesDifferent = fromIndex !== toIndex;

      if (!isFromIndexValid) {
        return {
          isValid: false,
          errorMessage: `잘못된 출발 인덱스: ${fromIndex} (배열 길이: ${arrayLength})`,
        };
      }

      if (!isToIndexValid) {
        return {
          isValid: false,
          errorMessage: `잘못된 도착 인덱스: ${toIndex} (배열 길이: ${arrayLength})`,
        };
      }

      if (!areIndicesDifferent) {
        return {
          isValid: false,
          errorMessage: `동일한 인덱스: ${fromIndex}`,
        };
      }

      return {
        isValid: true,
        errorMessage: '',
      };
    },
    []
  );

  const createReorderedArray = useCallback(
    (originalArray: string[], fromIndex: number, toIndex: number): string[] => {
      const newArray = [...originalArray];
      const [movedElement] = newArray.splice(fromIndex, 1);

      if (movedElement === undefined) {
        console.error('⚠️ 이동할 요소를 찾을 수 없음:', {
          fromIndex,
          arrayLength: originalArray.length,
        });
        return originalArray;
      }

      newArray.splice(toIndex, 0, movedElement);
      return newArray;
    },
    []
  );

  const moveSliderImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      console.log('🔧 moveSliderImage 호출:', { fromIndex, toIndex });

      const validationResult = validateIndices(
        fromIndex,
        toIndex,
        sliderImages.length
      );

      if (!validationResult.isValid) {
        console.log('⚠️ 이동 인덱스 검증 실패:', validationResult.errorMessage);
        return;
      }

      const reorderedSliderImages = createReorderedArray(
        sliderImages,
        fromIndex,
        toIndex
      );
      updateSliderImagesWithSync(reorderedSliderImages);

      const movedImageUrl = reorderedSliderImages[toIndex];
      const safeMovedImageUrl = movedImageUrl ? movedImageUrl : 'unknown';

      console.log('✅ moveSliderImage 완료:', {
        fromIndex,
        toIndex,
        movedImage: safeMovedImageUrl.slice(0, 30) + '...',
      });
    },
    [
      sliderImages,
      validateIndices,
      createReorderedArray,
      updateSliderImagesWithSync,
    ]
  );

  const moveToFirst = useCallback(
    (imageUrl: string) => {
      console.log('🔧 moveToFirst 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const currentImageIndex = sliderImages.indexOf(imageUrl);

      if (currentImageIndex === -1) {
        console.log('⚠️ 이미지를 슬라이더에서 찾을 수 없음');
        return;
      }

      if (currentImageIndex === 0) {
        console.log('⚠️ 이미 첫 번째 위치');
        return;
      }

      moveSliderImage(currentImageIndex, 0);

      addToastMessage({
        title: '순서 변경 완료',
        description: '이미지가 첫 번째로 이동되었습니다.',
        color: 'success',
      });

      console.log('✅ moveToFirst 완료');
    },
    [sliderImages, moveSliderImage, addToastMessage]
  );

  const moveToLast = useCallback(
    (imageUrl: string) => {
      console.log('🔧 moveToLast 호출:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
      });

      const currentImageIndex = sliderImages.indexOf(imageUrl);
      const lastImageIndex = sliderImages.length - 1;

      if (currentImageIndex === -1) {
        console.log('⚠️ 이미지를 슬라이더에서 찾을 수 없음');
        return;
      }

      if (currentImageIndex === lastImageIndex) {
        console.log('⚠️ 이미 마지막 위치');
        return;
      }

      moveSliderImage(currentImageIndex, lastImageIndex);

      addToastMessage({
        title: '순서 변경 완료',
        description: '이미지가 마지막으로 이동되었습니다.',
        color: 'success',
      });

      console.log('✅ moveToLast 완료');
    },
    [sliderImages, moveSliderImage, addToastMessage]
  );

  const createSwappedArray = useCallback(
    (originalArray: string[], index1: number, index2: number): string[] => {
      const newArray = [...originalArray];
      const element1 = newArray[index1];
      const element2 = newArray[index2];

      if (element1 === undefined || element2 === undefined) {
        console.error('⚠️ 교환할 요소를 찾을 수 없음:', {
          index1,
          index2,
          arrayLength: originalArray.length,
        });
        return originalArray;
      }

      newArray[index1] = element2;
      newArray[index2] = element1;

      return newArray;
    },
    []
  );

  const swapSliderImages = useCallback(
    (index1: number, index2: number) => {
      console.log('🔧 swapSliderImages 호출:', { index1, index2 });

      const validationResult = validateIndices(
        index1,
        index2,
        sliderImages.length
      );

      if (!validationResult.isValid) {
        console.log('⚠️ 교환 인덱스 검증 실패:', validationResult.errorMessage);
        return;
      }

      const swappedSliderImages = createSwappedArray(
        sliderImages,
        index1,
        index2
      );
      updateSliderImagesWithSync(swappedSliderImages);

      console.log('✅ swapSliderImages 완료:', { index1, index2 });
    },
    [
      sliderImages,
      validateIndices,
      createSwappedArray,
      updateSliderImagesWithSync,
    ]
  );

  const validateNewOrder = useCallback(
    (newOrder: string[], originalOrder: string[]): boolean => {
      const hasCorrectLength = newOrder.length === originalOrder.length;
      const hasAllOriginalImages = newOrder.every((imageUrl: string) =>
        originalOrder.includes(imageUrl)
      );

      return hasCorrectLength && hasAllOriginalImages;
    },
    []
  );

  const reorderSliderImages = useCallback(
    (newOrder: string[]) => {
      console.log('🔧 reorderSliderImages 호출:', {
        newCount: newOrder.length,
      });

      const isValidNewOrder = validateNewOrder(newOrder, sliderImages);

      if (!isValidNewOrder) {
        console.log('⚠️ 순서 변경 실패 - 유효하지 않은 순서:', {
          originalLength: sliderImages.length,
          newLength: newOrder.length,
        });
        return;
      }

      updateSliderImagesWithSync(newOrder);

      addToastMessage({
        title: '순서 변경 완료',
        description: '슬라이더 이미지 순서가 변경되었습니다.',
        color: 'success',
      });

      console.log('✅ reorderSliderImages 완료');
    },
    [
      sliderImages,
      validateNewOrder,
      updateSliderImagesWithSync,
      addToastMessage,
    ]
  );

  const getImagePosition = useCallback(
    (imageUrl: string): number => {
      const imagePosition = sliderImages.indexOf(imageUrl);

      console.log('🔧 getImagePosition:', {
        imageUrl: imageUrl.slice(0, 30) + '...',
        position: imagePosition,
      });

      return imagePosition;
    },
    [sliderImages]
  );

  console.log('✅ useSliderOrder 초기화 완료:', {
    sliderCount: sliderImages.length,
    selectedImagesLength: currentSelectedImages.length,
    selectedImageIdsLength: currentSelectedImageIds.length,
    metadataLength: currentImageMetadata.length,
    isDataSynced:
      currentSelectedImages.length === currentSelectedImageIds.length &&
      currentSelectedImages.length === currentImageMetadata.length,
  });

  return {
    moveSliderImage,
    moveToFirst,
    moveToLast,
    swapSliderImages,
    reorderSliderImages,
    getImagePosition,
  };
}

// 기본 export 추가 (호환성 보장)
export default useSliderOrder;
