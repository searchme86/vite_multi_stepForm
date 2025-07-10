// blogMediaStep/hooks/useBlogMediaStepIntegration.ts

import { useCallback, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useToastStore } from '../../../../../../store/toast/toastStore';
import { useImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type { ImageViewConfig } from '../../../../../../store/shared/commonTypes';
// import { useFormDataStore } from '../../../../../../store/formData/formDataStore';

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

// FormDataStoreType 제거 - 현재 사용하지 않음
// interface FormDataStoreType {
//   updateFormData?: (data: Partial<BlogMediaFormFields>) => void;
// }

interface BlogMediaStepIntegrationResult {
  toastStore: ToastStoreType;
  // formDataStore: FormDataStoreType;
  setMediaValue: (value: string[]) => void;
  setMainImageValue: (value: string) => void;
  setSliderImagesValue: (value: string[]) => void;
  currentFormValues: BlogMediaFormFields;
  addToast: (toast: ToastData) => void;

  // ✅ 새로 추가: Zustand 갤러리 스토어 관련
  imageGalleryStore: ReturnType<typeof useImageGalleryStore>;
  syncToImageGalleryStore: (config: Partial<ImageViewConfig>) => void;
}

export const useBlogMediaStepIntegration =
  (): BlogMediaStepIntegrationResult => {
    console.log('🔧 useBlogMediaStepIntegration 훅 초기화 - Zustand연동');

    const { setValue, watch } = useFormContext();

    const rawToastStore = useToastStore();
    const imageGalleryStore = useImageGalleryStore(); // ✅ 추가: 갤러리 스토어
    // const rawFormDataStore = useFormDataStore();

    const toastStore: ToastStoreType = {
      addToast: rawToastStore?.addToast || (() => {}),
    };

    // const formDataStore: FormDataStoreType = {
    //   updateFormData: rawFormDataStore?.updateFormData,
    // };

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

    // ✅ 새로 추가: Zustand 갤러리 스토어 동기화 함수
    const syncToImageGalleryStore = useCallback(
      (config: Partial<ImageViewConfig>) => {
        if (!imageGalleryStore) {
          console.log('⚠️ [INTEGRATION_SYNC] imageGalleryStore가 없음');
          return;
        }

        try {
          // 타입 안전한 메서드 접근
          const updateImageViewConfig = Reflect.get(
            imageGalleryStore,
            'updateImageViewConfig'
          );

          if (typeof updateImageViewConfig !== 'function') {
            console.error(
              '❌ [INTEGRATION_SYNC] updateImageViewConfig가 함수가 아님'
            );
            return;
          }

          updateImageViewConfig(config);

          console.log('✅ [INTEGRATION_SYNC] 갤러리 스토어 동기화 완료:', {
            selectedImagesCount: config.selectedImages?.length || 0,
            clickOrderLength: config.clickOrder?.length || 0,
            hasLayout: config.layout ? true : false,
            hasFilter: config.filter ? true : false,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (integrationSyncError) {
          console.error('❌ [INTEGRATION_SYNC] 갤러리 스토어 동기화 실패:', {
            error: integrationSyncError,
            config,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      },
      [imageGalleryStore]
    );

    // ✅ 새로 추가: 자동 갤러리 동기화 함수
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

        const galleryConfig: Partial<ImageViewConfig> = {
          selectedImages: media,
          clickOrder: clickOrderArray,
          layout: {
            columns: 3,
            gridType: 'grid',
          },
          filter: 'all',
        };

        syncToImageGalleryStore(galleryConfig);

        console.log('🔄 [AUTO_SYNC] 자동 갤러리 동기화 실행:', {
          mediaCount: media.length,
          mainImageIndex: mainImage ? media.indexOf(mainImage) : -1,
          clickOrderLength: clickOrderArray.length,
          timestamp: new Date().toLocaleTimeString(),
        });
      },
      [syncToImageGalleryStore]
    );

    const setMediaValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setMediaValue 호출 - Zustand연동:', {
          count: value.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('media', value);

        // ✅ 새로 추가: 미디어 변경 시 자동 갤러리 동기화
        const updatedFormValues: BlogMediaFormFields = {
          ...currentFormValues,
          media: value,
        };
        autoSyncFormToGalleryStore(updatedFormValues);

        // if (formDataStore?.updateFormData) {
        //   formDataStore.updateFormData({ media: value });
        // }
      },
      // [setValue, formDataStore]
      [setValue, currentFormValues, autoSyncFormToGalleryStore]
    );

    const setMainImageValue = useCallback(
      (value: string) => {
        console.log('🔄 setMainImageValue 호출 - Zustand연동:', {
          hasValue: !!value,
          valueLength: value?.length || 0,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('mainImage', value);

        // ✅ 새로 추가: 메인 이미지 변경 시 자동 갤러리 동기화
        const updatedFormValues: BlogMediaFormFields = {
          ...currentFormValues,
          mainImage: value,
        };
        autoSyncFormToGalleryStore(updatedFormValues);

        // if (formDataStore?.updateFormData) {
        //   formDataStore.updateFormData({ mainImage: value });
        // }
      },
      // [setValue, formDataStore]
      [setValue, currentFormValues, autoSyncFormToGalleryStore]
    );

    const setSliderImagesValue = useCallback(
      (value: string[]) => {
        console.log('🔄 setSliderImagesValue 호출 - Zustand연동:', {
          count: value.length,
          firstImage: value[0]?.slice(0, 30) + '...' || 'none',
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('sliderImages', value);

        // 슬라이더 이미지는 갤러리 스토어 동기화에 직접적인 영향을 주지 않으므로
        // 별도 동기화는 하지 않음 (필요 시 CustomGalleryView로 관리)

        // if (formDataStore?.updateFormData) {
        //   formDataStore.updateFormData({ sliderImages: value });
        // }
      },
      // [setValue, formDataStore]
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
        console.log('📊 폼 값 변경 감지 - Zustand연동:', {
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

        // ✅ 새로 추가: 폼 값 변경 시 갤러리 스토어 동기화 (미디어나 메인 이미지 변경 시만)
        const shouldSyncToGallery = hasMediaChanged || hasMainImageChanged;
        if (shouldSyncToGallery) {
          console.log('🔄 [FORM_CHANGE_SYNC] 폼 변경으로 갤러리 동기화 실행');
          autoSyncFormToGalleryStore(current);
        }

        // if (formDataStore?.updateFormData) {
        //   formDataStore.updateFormData(updateData);
        // }

        prevFormValuesRef.current = { ...current };

        console.log('✅ 스토어 동기화 완료 - Zustand연동:', updateData);
      }
      // }, [currentFormValues, formDataStore]);
    }, [currentFormValues, autoSyncFormToGalleryStore]);

    useEffect(() => {
      console.log('✅ useBlogMediaStepIntegration 초기화 완료 - Zustand연동:', {
        hasToastStore: !!toastStore,
        hasImageGalleryStore: !!imageGalleryStore,
        // hasFormDataStore: !!formDataStore,
        initialFormValues: currentFormValues,
        zustandSyncEnabled: true,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, [imageGalleryStore]);

    return {
      toastStore,
      // formDataStore,
      setMediaValue,
      setMainImageValue,
      setSliderImagesValue,
      currentFormValues,
      addToast,

      // ✅ 새로 추가: Zustand 갤러리 스토어 관련
      imageGalleryStore,
      syncToImageGalleryStore,
    };
  };
