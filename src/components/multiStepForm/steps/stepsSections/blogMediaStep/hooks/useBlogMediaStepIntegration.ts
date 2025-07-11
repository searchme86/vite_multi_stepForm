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
  selectedSliderIndices: number[]; // ✅ 새로 추가: 슬라이더 선택된 이미지 인덱스들
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
  setSelectedSliderIndicesValue: (value: number[]) => void; // ✅ 새로 추가
  currentFormValues: BlogMediaFormFields;
  addToast: (toast: ToastData) => void;

  // ✅ 수정: 하이브리드 갤러리 스토어 관련
  imageGalleryStore: ReturnType<typeof useImageGalleryStore>;
  syncToImageGalleryStore: (config: Partial<HybridImageViewConfig>) => void;
}

export const useBlogMediaStepIntegration =
  (): BlogMediaStepIntegrationResult => {
    console.log(
      '🔧 useBlogMediaStepIntegration 훅 초기화 - 하이브리드 연동 + 슬라이더 선택'
    );

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
      selectedSliderIndices: [], // ✅ 초기값 추가
    });

    const currentMedia = watch('media') || [];
    const currentMainImage = watch('mainImage') || null;
    const currentSliderImages = watch('sliderImages') || [];
    const currentSelectedSliderIndices = watch('selectedSliderIndices') || []; // ✅ 새로 추가

    const currentFormValues: BlogMediaFormFields = {
      media: currentMedia,
      mainImage: currentMainImage,
      sliderImages: currentSliderImages,
      selectedSliderIndices: currentSelectedSliderIndices, // ✅ 새로 추가
    };

    // ✅ 수정: 하이브리드 갤러리 스토어 동기화 함수
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

          console.log(
            '✅ [INTEGRATION_SYNC] 하이브리드 갤러리 스토어 동기화 완료:',
            {
              selectedImagesCount,
              selectedImageIdsCount,
              clickOrderLength,
              hasLayout,
              hasFilter,
              timestamp: new Date().toLocaleTimeString(),
            }
          );
        } catch (integrationSyncError) {
          const errorMessage =
            integrationSyncError instanceof Error
              ? integrationSyncError.message
              : 'Unknown sync error';

          console.error(
            '❌ [INTEGRATION_SYNC] 하이브리드 갤러리 스토어 동기화 실패:',
            {
              error: errorMessage,
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

        const hasMainImage =
          mainImage !== null && mainImage !== undefined && mainImage.length > 0;
        if (hasMainImage) {
          const mainImageIndex = media.indexOf(mainImage);
          const isValidMainImageIndex = mainImageIndex >= 0;

          if (isValidMainImageIndex) {
            clickOrderArray = [
              mainImageIndex,
              ...clickOrderArray.filter((index) => index !== mainImageIndex),
            ];
          }
        }

        // ✅ 수정: HybridImageViewConfig 타입 사용
        const currentTimestamp = Date.now();
        const selectedImageIds = media.map(
          (_, index) => `form_image_${currentTimestamp}_${index}`
        );

        const galleryConfig: Partial<HybridImageViewConfig> = {
          selectedImages: media,
          selectedImageIds,
          clickOrder: clickOrderArray,
          layout: {
            columns: 3,
            gridType: 'grid',
          },
          filter: 'all',
        };

        syncToImageGalleryStore(galleryConfig);

        const mainImageIndex = hasMainImage ? media.indexOf(mainImage) : -1;

        console.log('🔄 [AUTO_SYNC] 자동 하이브리드 갤러리 동기화 실행:', {
          mediaCount: media.length,
          selectedImageIdsCount: selectedImageIds.length,
          mainImageIndex,
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
          hasValue: value !== null && value !== undefined && value.length > 0,
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
          firstImage:
            value.length > 0 ? value[0]?.slice(0, 30) + '...' : 'none',
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('sliderImages', value);

        // 슬라이더 이미지는 하이브리드 갤러리 스토어 동기화에 직접적인 영향을 주지 않으므로
        // 별도 동기화는 하지 않음 (필요 시 HybridCustomGalleryView로 관리)
      },
      [setValue]
    );

    // ✅ 새로 추가: 슬라이더 선택 상태 설정 함수
    const setSelectedSliderIndicesValue = useCallback(
      (value: number[]) => {
        console.log('🔄 setSelectedSliderIndicesValue 호출:', {
          count: value.length,
          indices: value,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 🔧 입력값 검증
        const isValidArray = Array.isArray(value);

        if (!isValidArray) {
          console.error('❌ 유효하지 않은 인덱스 배열:', { value });
          return;
        }

        // 🔧 각 인덱스의 유효성 검증
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
      const hasSelectedSliderIndicesChanged = // ✅ 새로 추가
        JSON.stringify(prev.selectedSliderIndices) !==
        JSON.stringify(current.selectedSliderIndices);

      const hasAnyChanged =
        hasMediaChanged ||
        hasMainImageChanged ||
        hasSliderImagesChanged ||
        hasSelectedSliderIndicesChanged; // ✅ 조건 추가

      if (hasAnyChanged) {
        console.log('📊 폼 값 변경 감지 - 하이브리드 연동 + 슬라이더 선택:', {
          hasMediaChanged,
          hasMainImageChanged,
          hasSliderImagesChanged,
          hasSelectedSliderIndicesChanged, // ✅ 새로 추가
          mediaCount: current.media.length,
          hasMainImage:
            current.mainImage !== null && current.mainImage !== undefined,
          sliderCount: current.sliderImages.length,
          selectedSliderIndicesCount: current.selectedSliderIndices.length, // ✅ 새로 추가
          timestamp: new Date().toLocaleTimeString(),
        });

        const updateData: Partial<BlogMediaFormFields> = {};

        if (hasMediaChanged) updateData.media = current.media;
        if (hasMainImageChanged) updateData.mainImage = current.mainImage;
        if (hasSliderImagesChanged)
          updateData.sliderImages = current.sliderImages;
        if (hasSelectedSliderIndicesChanged)
          updateData.selectedSliderIndices = current.selectedSliderIndices; // ✅ 새로 추가

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
      const hasToastStore = toastStore !== null && toastStore !== undefined;
      const hasImageGalleryStore =
        imageGalleryStore !== null && imageGalleryStore !== undefined;
      const isHybridMode = imageGalleryStore?.getIsHybridMode?.() || false;

      console.log(
        '✅ useBlogMediaStepIntegration 초기화 완료 - 하이브리드 연동 + 슬라이더 선택:',
        {
          hasToastStore,
          hasImageGalleryStore,
          initialFormValues: currentFormValues,
          hybridSyncEnabled: true,
          isHybridMode,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      // 🆕 자동 이미지 복원 초기화
      if (
        hasImageGalleryStore &&
        typeof imageGalleryStore.initializeStoredImages === 'function'
      ) {
        const isInitialized = imageGalleryStore.getIsInitialized?.() || false;
        const isNotInitialized = !isInitialized;

        if (isNotInitialized) {
          console.log('🔄 [COMPONENT_INIT] 컴포넌트에서 이미지 자동 복원 시작');
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
      setSelectedSliderIndicesValue, // ✅ 새로 추가
      currentFormValues,
      addToast,

      // ✅ 수정: 하이브리드 갤러리 스토어 관련
      imageGalleryStore,
      syncToImageGalleryStore,
    };
  };
