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
  currentFormValues: BlogMediaFormFields;
  addToast: (toast: ToastData) => void;

  // ✅ 수정: 하이브리드 갤러리 스토어 관련
  imageGalleryStore: ReturnType<typeof useImageGalleryStore>;
  syncToImageGalleryStore: (config: Partial<HybridImageViewConfig>) => void;
}

export const useBlogMediaStepIntegration =
  (): BlogMediaStepIntegrationResult => {
    console.log('🔧 useBlogMediaStepIntegration 훅 초기화 - 하이브리드 연동');

    const { setValue, watch } = useFormContext();

    const rawToastStore = useToastStore();
    const imageGalleryStore = useImageGalleryStore(); // ✅ 수정: 하이브리드 스토어 사용

    const toastStore: ToastStoreType = {
      addToast: rawToastStore?.addToast || (() => {}),
    };

    const prevFormValuesRef = useRef<BlogMediaFormFields>({
      media: [],
      mainImage: null,
      sliderImages: [],
    });

    const currentMedia = watch('media') || [];
    const currentMainImage = watch('mainImage') || null;
    const currentSliderImages = watch('sliderImages') || [];

    const currentFormValues: BlogMediaFormFields = {
      media: currentMedia,
      mainImage: currentMainImage,
      sliderImages: currentSliderImages,
    };

    // ✅ 수정: 하이브리드 갤러리 스토어 동기화 함수
    const syncToImageGalleryStore = useCallback(
      (config: Partial<HybridImageViewConfig>) => {
        if (!imageGalleryStore) {
          console.log('⚠️ [INTEGRATION_SYNC] imageGalleryStore가 없음');
          return;
        }

        try {
          // ✅ 수정: 하이브리드 스토어의 updateImageViewConfig 메서드 사용
          const updateImageViewConfig = imageGalleryStore.updateImageViewConfig;

          if (typeof updateImageViewConfig !== 'function') {
            console.error(
              '❌ [INTEGRATION_SYNC] updateImageViewConfig가 함수가 아님'
            );
            return;
          }

          updateImageViewConfig(config);

          console.log(
            '✅ [INTEGRATION_SYNC] 하이브리드 갤러리 스토어 동기화 완료:',
            {
              selectedImagesCount: config.selectedImages?.length || 0,
              selectedImageIdsCount: config.selectedImageIds?.length || 0,
              clickOrderLength: config.clickOrder?.length || 0,
              hasLayout: config.layout ? true : false,
              hasFilter: config.filter ? true : false,
              timestamp: new Date().toLocaleTimeString(),
            }
          );
        } catch (integrationSyncError) {
          console.error(
            '❌ [INTEGRATION_SYNC] 하이브리드 갤러리 스토어 동기화 실패:',
            {
              error: integrationSyncError,
              config,
              timestamp: new Date().toLocaleTimeString(),
            }
          );
        }
      },
      [imageGalleryStore]
    );

    // ✅ 수정: 하이브리드 타입에 맞는 자동 갤러리 동기화 함수
    const autoSyncFormToGalleryStore = useCallback(
      (formValues: BlogMediaFormFields) => {
        const { media, mainImage } = formValues;

        // 메인 이미지가 있는 경우 해당 인덱스를 첫 번째로 설정
        let clickOrderArray = media.map((_, imageIndex) => imageIndex);

        if (mainImage) {
          const mainImageIndex = media.indexOf(mainImage);
          if (mainImageIndex >= 0) {
            clickOrderArray = [
              mainImageIndex,
              ...clickOrderArray.filter((index) => index !== mainImageIndex),
            ];
          }
        }

        // ✅ 수정: HybridImageViewConfig 타입 사용
        const galleryConfig: Partial<HybridImageViewConfig> = {
          selectedImages: media,
          selectedImageIds: media.map(
            (_, index) => `form_image_${Date.now()}_${index}`
          ), // 임시 ID 생성
          clickOrder: clickOrderArray,
          layout: {
            columns: 3,
            gridType: 'grid',
          },
          filter: 'all',
        };

        syncToImageGalleryStore(galleryConfig);

        console.log('🔄 [AUTO_SYNC] 자동 하이브리드 갤러리 동기화 실행:', {
          mediaCount: media.length,
          selectedImageIdsCount: galleryConfig.selectedImageIds?.length || 0,
          mainImageIndex: mainImage ? media.indexOf(mainImage) : -1,
          clickOrderLength: clickOrderArray.length,
          timestamp: new Date().toLocaleTimeString(),
        });
      },
      [syncToImageGalleryStore]
    );

    const setMediaValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setMediaValue 호출 - 하이브리드 연동:', {
          count: value.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('media', value);

        // ✅ 수정: 미디어 변경 시 자동 하이브리드 갤러리 동기화
        const updatedFormValues: BlogMediaFormFields = {
          ...currentFormValues,
          media: value,
        };
        autoSyncFormToGalleryStore(updatedFormValues);
      },
      [setValue, currentFormValues, autoSyncFormToGalleryStore]
    );

    const setMainImageValue = useCallback(
      (value: string) => {
        console.log('🔄 setMainImageValue 호출 - 하이브리드 연동:', {
          hasValue: !!value,
          valueLength: value?.length || 0,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('mainImage', value);

        // ✅ 수정: 메인 이미지 변경 시 자동 하이브리드 갤러리 동기화
        const updatedFormValues: BlogMediaFormFields = {
          ...currentFormValues,
          mainImage: value,
        };
        autoSyncFormToGalleryStore(updatedFormValues);
      },
      [setValue, currentFormValues, autoSyncFormToGalleryStore]
    );

    const setSliderImagesValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setSliderImagesValue 호출 - 하이브리드 연동:', {
          count: value.length,
          firstImage: value[0]?.slice(0, 30) + '...' || 'none',
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('sliderImages', value);

        // 슬라이더 이미지는 하이브리드 갤러리 스토어 동기화에 직접적인 영향을 주지 않으므로
        // 별도 동기화는 하지 않음 (필요 시 HybridCustomGalleryView로 관리)
      },
      [setValue]
    );

    const addToast = useCallback(
      (toast: ToastData) => {
        console.log('🔔 addToast 호출:', {
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

      const hasAnyChanged =
        hasMediaChanged || hasMainImageChanged || hasSliderImagesChanged;

      if (hasAnyChanged) {
        console.log('📊 폼 값 변경 감지 - 하이브리드 연동:', {
          hasMediaChanged,
          hasMainImageChanged,
          hasSliderImagesChanged,
          mediaCount: current.media.length,
          hasMainImage: !!current.mainImage,
          sliderCount: current.sliderImages.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        const updateData: Partial<BlogMediaFormFields> = {};

        if (hasMediaChanged) updateData.media = current.media;
        if (hasMainImageChanged) updateData.mainImage = current.mainImage;
        if (hasSliderImagesChanged)
          updateData.sliderImages = current.sliderImages;

        // ✅ 수정: 폼 값 변경 시 하이브리드 갤러리 스토어 동기화
        const shouldSyncToGallery = hasMediaChanged || hasMainImageChanged;
        if (shouldSyncToGallery) {
          console.log(
            '🔄 [FORM_CHANGE_SYNC] 폼 변경으로 하이브리드 갤러리 동기화 실행'
          );
          autoSyncFormToGalleryStore(current);
        }

        prevFormValuesRef.current = { ...current };

        console.log('✅ 하이브리드 스토어 동기화 완료:', updateData);
      }
    }, [currentFormValues, autoSyncFormToGalleryStore]);

    useEffect(() => {
      console.log(
        '✅ useBlogMediaStepIntegration 초기화 완료 - 하이브리드 연동:',
        {
          hasToastStore: !!toastStore,
          hasImageGalleryStore: !!imageGalleryStore,
          initialFormValues: currentFormValues,
          hybridSyncEnabled: true,
          isHybridMode: imageGalleryStore?.getIsHybridMode?.() || false,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      // 🆕 자동 이미지 복원 초기화
      if (
        imageGalleryStore &&
        typeof imageGalleryStore.initializeStoredImages === 'function'
      ) {
        const isInitialized = imageGalleryStore.getIsInitialized?.() || false;
        if (!isInitialized) {
          console.log('🔄 [COMPONENT_INIT] 컴포넌트에서 이미지 자동 복원 시작');
          imageGalleryStore
            .initializeStoredImages()
            .then(() => {
              console.log('✅ [COMPONENT_INIT] 컴포넌트 이미지 복원 완료');
            })
            .catch((initError) => {
              console.error('❌ [COMPONENT_INIT] 컴포넌트 이미지 복원 실패:', {
                error: initError,
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
      currentFormValues,
      addToast,

      // ✅ 수정: 하이브리드 갤러리 스토어 관련
      imageGalleryStore,
      syncToImageGalleryStore,
    };
  };
