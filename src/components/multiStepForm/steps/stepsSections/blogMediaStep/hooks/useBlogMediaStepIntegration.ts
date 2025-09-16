// 📁 blogMediaStep/hooks/useBlogMediaStepIntegration.ts

import { useCallback, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useToastStore } from '../../../../../../store/toast/toastStore';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type { HybridImageViewConfig } from '../../../../../../store/shared/commonTypes';

interface BlogMediaFormFields {
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
  selectedSliderIndices: number[];
}

interface ToastData {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary';
  hideCloseButton?: boolean;
}

interface ToastStoreType {
  addToast: (toast: ToastData) => void;
}

interface BlogMediaStepIntegrationResult {
  toastStore: ToastStoreType;
  setMediaValue: (value: string[]) => void;
  setMainImageValue: (value: string) => void;
  setSliderImagesValue: (value: string[]) => void;
  setSelectedSliderIndicesValue: (value: number[]) => void;
  currentFormValues: BlogMediaFormFields;
  addToast: (toast: ToastData) => void;

  imageGalleryStore: ReturnType<typeof useImageGalleryStore>;
  syncToImageGalleryStore: (config: Partial<HybridImageViewConfig>) => void;
}

export const useBlogMediaStepIntegration =
  (): BlogMediaStepIntegrationResult => {
    console.log('🔧 [INTEGRATION] 단순화된 통합 훅 초기화');

    const { setValue, watch } = useFormContext();

    const rawToastStore = useToastStore();
    const imageGalleryStore = useImageGalleryStore();

    const toastStore: ToastStoreType = {
      addToast: rawToastStore?.addToast || (() => {}),
    };

    const prevFormValuesRef = useRef<BlogMediaFormFields>({
      media: [],
      mainImage: null,
      sliderImages: [],
      selectedSliderIndices: [],
    });

    const currentMedia = watch('media') || [];
    const currentMainImage = watch('mainImage') || null;
    const currentSliderImages = watch('sliderImages') || [];
    const currentSelectedSliderIndices = watch('selectedSliderIndices') || [];

    const currentFormValues: BlogMediaFormFields = {
      media: currentMedia,
      mainImage: currentMainImage,
      sliderImages: currentSliderImages,
      selectedSliderIndices: currentSelectedSliderIndices,
    };

    const syncToImageGalleryStore = useCallback(
      (config: Partial<HybridImageViewConfig>) => {
        const hasImageGalleryStore =
          imageGalleryStore !== null && imageGalleryStore !== undefined;

        if (!hasImageGalleryStore) {
          console.log('⚠️ [INTEGRATION_SYNC] imageGalleryStore가 없음');
          return;
        }

        try {
          const { updateImageViewConfig } = imageGalleryStore;
          const isValidUpdateFunction =
            typeof updateImageViewConfig === 'function';

          if (!isValidUpdateFunction) {
            console.error(
              '❌ [INTEGRATION_SYNC] updateImageViewConfig가 함수가 아님'
            );
            return;
          }

          updateImageViewConfig(config);

          const selectedImagesCount = config.selectedImages?.length || 0;
          const selectedImageIdsCount = config.selectedImageIds?.length || 0;
          const clickOrderLength = config.clickOrder?.length || 0;
          const hasLayout =
            config.layout !== null && config.layout !== undefined;
          const hasFilter =
            config.filter !== null && config.filter !== undefined;

          console.log('✅ [INTEGRATION_SYNC] 갤러리 스토어 직접 동기화 완료:', {
            selectedImagesCount,
            selectedImageIdsCount,
            clickOrderLength,
            hasLayout,
            hasFilter,
            simplifiedSync: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (integrationSyncError) {
          const errorMessage =
            integrationSyncError instanceof Error
              ? integrationSyncError.message
              : 'Unknown sync error';

          console.error('❌ [INTEGRATION_SYNC] 갤러리 스토어 동기화 실패:', {
            error: errorMessage,
            config,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      },
      [imageGalleryStore]
    );

    const setMediaValue = useCallback(
      (value: string[]) => {
        console.log('🔄 [SET_MEDIA] 단순화된 미디어 값 설정:', {
          count: value.length,
          directUpdate: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('media', value);

        const currentGalleryConfig = imageGalleryStore?.getImageViewConfig();
        if (currentGalleryConfig) {
          const updatedConfig = {
            ...currentGalleryConfig,
            selectedImages: value,
          };

          console.log('🔄 [SET_MEDIA] 갤러리 스토어 직접 업데이트:', {
            newImageCount: value.length,
            directGalleryUpdate: true,
          });

          imageGalleryStore?.setImageViewConfig(updatedConfig);
        }
      },
      [setValue, imageGalleryStore]
    );

    const setMainImageValue = useCallback(
      (value: string) => {
        console.log('🔄 [SET_MAIN_IMAGE] 단순화된 메인 이미지 설정:', {
          hasValue: value !== null && value !== undefined && value.length > 0,
          valueLength: value?.length || 0,
          directUpdate: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('mainImage', value);
      },
      [setValue]
    );

    const setSliderImagesValue = useCallback(
      (value: string[]) => {
        console.log('🔄 [SET_SLIDER] 단순화된 슬라이더 이미지 설정:', {
          count: value.length,
          firstImage:
            value.length > 0 ? value[0]?.slice(0, 30) + '...' : 'none',
          directUpdate: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('sliderImages', value);
      },
      [setValue]
    );

    const setSelectedSliderIndicesValue = useCallback(
      (value: number[]) => {
        console.log('🔄 [SET_SLIDER_INDICES] 슬라이더 선택 인덱스 설정:', {
          count: value.length,
          indices: value,
          timestamp: new Date().toLocaleTimeString(),
        });

        const isValidArray = Array.isArray(value);

        if (!isValidArray) {
          console.error('❌ 유효하지 않은 인덱스 배열:', { value });
          return;
        }

        const hasValidIndices = value.every(
          (indexItem) => typeof indexItem === 'number' && indexItem >= 0
        );

        if (!hasValidIndices) {
          console.error('❌ 배열에 유효하지 않은 인덱스가 포함됨:', { value });
          return;
        }

        setValue('selectedSliderIndices', value);

        console.log('✅ 슬라이더 선택 상태 설정 완료:', {
          newIndicesCount: value.length,
          newIndices: value,
        });
      },
      [setValue]
    );

    const addToast = useCallback(
      (toast: ToastData) => {
        console.log('🔔 [ADD_TOAST] 토스트 메시지 추가:', {
          title: toast.title,
          color: toast.color,
          timestamp: new Date().toLocaleTimeString(),
        });

        toastStore.addToast(toast);
      },
      [toastStore]
    );

    useEffect(() => {
      const prev = prevFormValuesRef.current;
      const current = currentFormValues;

      const hasMediaChanged =
        JSON.stringify(prev.media) !== JSON.stringify(current.media);
      const hasMainImageChanged = prev.mainImage !== current.mainImage;
      const hasSliderImagesChanged =
        JSON.stringify(prev.sliderImages) !==
        JSON.stringify(current.sliderImages);
      const hasSelectedSliderIndicesChanged =
        JSON.stringify(prev.selectedSliderIndices) !==
        JSON.stringify(current.selectedSliderIndices);

      const hasAnyChanged =
        hasMediaChanged ||
        hasMainImageChanged ||
        hasSliderImagesChanged ||
        hasSelectedSliderIndicesChanged;

      if (hasAnyChanged) {
        console.log('📊 [FORM_CHANGE] 폼 값 변경 감지 - 단순화된 처리:', {
          hasMediaChanged,
          hasMainImageChanged,
          hasSliderImagesChanged,
          hasSelectedSliderIndicesChanged,
          mediaCount: current.media.length,
          hasMainImage:
            current.mainImage !== null && current.mainImage !== undefined,
          sliderCount: current.sliderImages.length,
          selectedSliderIndicesCount: current.selectedSliderIndices.length,
          simplifiedProcessing: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        prevFormValuesRef.current = { ...current };

        console.log('✅ [FORM_CHANGE] 단순화된 폼 변경 처리 완료');
      }
    }, [currentFormValues]);

    useEffect(() => {
      const hasToastStore = toastStore !== null && toastStore !== undefined;
      const hasImageGalleryStore =
        imageGalleryStore !== null && imageGalleryStore !== undefined;
      const isHybridMode = imageGalleryStore?.getIsHybridMode?.() || false;

      console.log('✅ [INTEGRATION] 단순화된 통합 훅 초기화 완료:', {
        hasToastStore,
        hasImageGalleryStore,
        initialFormValues: currentFormValues,
        simplifiedSyncEnabled: true,
        isHybridMode,
        noComplexAutoSync: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (
        hasImageGalleryStore &&
        typeof imageGalleryStore.initializeStoredImages === 'function'
      ) {
        const isInitialized = imageGalleryStore.getIsInitialized?.() || false;
        const isNotInitialized = !isInitialized;

        if (isNotInitialized) {
          console.log('🔄 [COMPONENT_INIT] 컴포넌트에서 이미지 단순 복원 시작');
          imageGalleryStore
            .initializeStoredImages()
            .then(() => {
              console.log('✅ [COMPONENT_INIT] 컴포넌트 이미지 복원 완료');
            })
            .catch((initError) => {
              const errorMessage =
                initError instanceof Error
                  ? initError.message
                  : 'Unknown init error';

              console.error('❌ [COMPONENT_INIT] 컴포넌트 이미지 복원 실패:', {
                error: errorMessage,
              });
            });
        }
      }
    }, [imageGalleryStore]);

    return {
      toastStore,
      setMediaValue,
      setMainImageValue,
      setSliderImagesValue,
      setSelectedSliderIndicesValue,
      currentFormValues,
      addToast,

      imageGalleryStore,
      syncToImageGalleryStore,
    };
  };
