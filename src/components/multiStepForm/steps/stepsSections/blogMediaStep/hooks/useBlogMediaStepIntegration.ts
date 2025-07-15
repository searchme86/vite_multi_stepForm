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
    console.log('🔧 [INTEGRATION] 메인이미지 영속성 포함 통합 훅 초기화');

    const { setValue, watch, getValues } = useFormContext();

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

          console.log('✅ [INTEGRATION_SYNC] 갤러리 스토어 동기화 완료:', {
            selectedImagesCount: config.selectedImages?.length || 0,
            hasMainImage: config.mainImage !== undefined,
            mainImagePreview: config.mainImage
              ? config.mainImage.slice(0, 30) + '...'
              : 'none',
            sliderImagesCount: config.sliderImages?.length || 0,
            메인이미지영속성동기화: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (integrationSyncError) {
          console.error('❌ [INTEGRATION_SYNC] 갤러리 스토어 동기화 실패:', {
            error: integrationSyncError,
            config,
          });
        }
      },
      [imageGalleryStore]
    );

    const setMediaValue = useCallback(
      (value: string[]) => {
        console.log('🔄 [SET_MEDIA] 미디어 값 설정:', {
          count: value.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('media', value);

        const currentGalleryConfig = imageGalleryStore?.getImageViewConfig();
        if (currentGalleryConfig) {
          const updatedConfig = {
            ...currentGalleryConfig,
            selectedImages: value,
          };

          imageGalleryStore?.setImageViewConfig(updatedConfig);
        }
      },
      [setValue, imageGalleryStore]
    );

    // 🚨 강화된 핵심 수정: 다중 백업 영속성 저장 로직
    const setMainImageValue = useCallback(
      (value: string) => {
        console.log(
          '🔄 [SET_MAIN_IMAGE] 강화된 메인 이미지 설정 - 다중 영속성:',
          {
            hasValue: value !== null && value !== undefined && value.length > 0,
            valuePreview: value ? value.slice(0, 30) + '...' : 'none',
            다중영속성저장: true,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        // 1단계: React Hook Form 즉시 업데이트
        setValue('mainImage', value, { shouldDirty: true, shouldTouch: true });

        // 🚨 2단계: localStorage 직접 백업 저장 (즉시 실행)
        try {
          const backupData = {
            mainImage: value || null,
            timestamp: Date.now(),
            source: 'setMainImageValue',
          };
          localStorage.setItem(
            'blogMediaMainImageBackup',
            JSON.stringify(backupData)
          );
          console.log(
            '💾 [SET_MAIN_IMAGE] localStorage 직접 백업 완료:',
            backupData
          );
        } catch (localStorageError) {
          console.error(
            '❌ [SET_MAIN_IMAGE] localStorage 백업 실패:',
            localStorageError
          );
        }

        // 🚨 3단계: Zustand Store 영속성 업데이트 (강화됨)
        const currentGalleryConfig = imageGalleryStore?.getImageViewConfig();
        if (currentGalleryConfig && imageGalleryStore) {
          const updatedConfig = {
            ...currentGalleryConfig,
            mainImage: value || null,
            lastMainImageUpdate: Date.now(), // 🆕 타임스탬프 추가
          };

          console.log('💾 [SET_MAIN_IMAGE] Zustand 스토어 영속성 저장:', {
            mainImageValue: value || 'null',
            timestamp: updatedConfig.lastMainImageUpdate,
            configUpdated: true,
          });

          // 즉시 저장 + 강제 영속성 트리거
          imageGalleryStore.updateImageViewConfig(updatedConfig);

          // 🆕 강제 영속성 보장을 위한 추가 호출
          setTimeout(() => {
            try {
              imageGalleryStore.updateImageViewConfig(updatedConfig);
              console.log('🔄 [SET_MAIN_IMAGE] 지연 영속성 백업 완료');
            } catch (delayedError) {
              console.error(
                '❌ [SET_MAIN_IMAGE] 지연 백업 실패:',
                delayedError
              );
            }
          }, 100);

          console.log(
            '✅ [SET_MAIN_IMAGE] 강화된 메인 이미지 영속성 저장 완료'
          );
        }

        // 🚨 4단계: React Hook Form 재검증 (Race Condition 방지)
        setTimeout(() => {
          const currentFormValue = getValues('mainImage');
          if (currentFormValue !== value) {
            console.log('⚠️ [SET_MAIN_IMAGE] Form 값 불일치 감지, 재설정:', {
              expected: value || 'null',
              actual: currentFormValue || 'null',
            });
            setValue('mainImage', value, { shouldDirty: true });
          }
        }, 50);
      },
      [setValue, getValues, imageGalleryStore]
    );

    const setSliderImagesValue = useCallback(
      (value: string[]) => {
        console.log('🔄 [SET_SLIDER] 슬라이더 이미지 설정:', {
          count: value.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        setValue('sliderImages', value);

        // 🔧 슬라이더도 스토어에 저장
        const currentGalleryConfig = imageGalleryStore?.getImageViewConfig();
        if (currentGalleryConfig && imageGalleryStore) {
          const updatedConfig = {
            ...currentGalleryConfig,
            sliderImages: value,
          };

          imageGalleryStore.updateImageViewConfig(updatedConfig);
        }
      },
      [setValue, imageGalleryStore]
    );

    const setSelectedSliderIndicesValue = useCallback(
      (value: number[]) => {
        console.log('🔄 [SET_SLIDER_INDICES] 슬라이더 선택 인덱스 설정:', {
          count: value.length,
          indices: value,
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
      },
      [setValue]
    );

    const addToast = useCallback(
      (toast: ToastData) => {
        console.log('🔔 [ADD_TOAST] 토스트 메시지 추가:', {
          title: toast.title,
          color: toast.color,
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
        console.log(
          '📊 [FORM_CHANGE] 폼 값 변경 감지 - 메인이미지 영속성 포함:',
          {
            hasMediaChanged,
            hasMainImageChanged,
            hasSliderImagesChanged,
            mediaCount: current.media.length,
            hasMainImage:
              current.mainImage !== null && current.mainImage !== undefined,
            mainImagePreview: current.mainImage
              ? current.mainImage.slice(0, 30) + '...'
              : 'none',
            메인이미지영속성처리: true,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        prevFormValuesRef.current = { ...current };
      }
    }, [currentFormValues]);

    // 🚨 강화된 추가: localStorage 백업에서 메인이미지 복원
    useEffect(() => {
      const restoreMainImageFromBackup = () => {
        try {
          const backupDataString = localStorage.getItem(
            'blogMediaMainImageBackup'
          );
          if (!backupDataString) return;

          const backupData = JSON.parse(backupDataString);
          const { mainImage: backupMainImage, timestamp: backupTimestamp } =
            backupData;

          // 5분 이내의 백업만 유효
          const isRecentBackup = Date.now() - backupTimestamp < 5 * 60 * 1000;
          if (!isRecentBackup) {
            console.log('⏰ [BACKUP_RESTORE] 백업이 너무 오래됨, 무시');
            return;
          }

          const currentFormMainImage = currentFormValues.mainImage;
          const needsRestore = backupMainImage && !currentFormMainImage;

          if (needsRestore) {
            console.log(
              '🔄 [BACKUP_RESTORE] localStorage 백업에서 메인이미지 복원:',
              {
                backupMainImage: backupMainImage.slice(0, 30) + '...',
                backupTimestamp: new Date(backupTimestamp).toLocaleTimeString(),
                localStorage백업복원: true,
              }
            );

            setValue('mainImage', backupMainImage, { shouldDirty: true });

            // Zustand에도 즉시 동기화
            const currentGalleryConfig =
              imageGalleryStore?.getImageViewConfig();
            if (currentGalleryConfig && imageGalleryStore) {
              const updatedConfig = {
                ...currentGalleryConfig,
                mainImage: backupMainImage,
              };
              imageGalleryStore.updateImageViewConfig(updatedConfig);
            }
          }
        } catch (restoreError) {
          console.error(
            '❌ [BACKUP_RESTORE] localStorage 백업 복원 실패:',
            restoreError
          );
        }
      };

      // 컴포넌트 마운트 시 즉시 복원 시도
      const restoreTimeout = setTimeout(restoreMainImageFromBackup, 100);

      return () => clearTimeout(restoreTimeout);
    }, [setValue, imageGalleryStore, currentFormValues.mainImage]);

    // 🚨 핵심 추가: 스토어 복원 시 메인 이미지도 함께 복원
    useEffect(() => {
      const hasImageGalleryStore =
        imageGalleryStore !== null && imageGalleryStore !== undefined;

      if (
        hasImageGalleryStore &&
        typeof imageGalleryStore.initializeStoredImages === 'function'
      ) {
        const isInitialized = imageGalleryStore.getIsInitialized?.() || false;

        if (!isInitialized) {
          console.log('🔄 [COMPONENT_INIT] 메인이미지 포함 이미지 복원 시작');

          imageGalleryStore
            .initializeStoredImages()
            .then(() => {
              console.log(
                '✅ [COMPONENT_INIT] 이미지 복원 완료, 메인이미지 확인 중'
              );

              // 🚨 복원 후 메인 이미지 동기화
              const restoredConfig = imageGalleryStore.getImageViewConfig();
              const { mainImage: restoredMainImage } = restoredConfig;

              const hasRestoredMainImage =
                restoredMainImage && restoredMainImage.length > 0;
              const currentFormMainImage = currentFormValues.mainImage;
              const needsMainImageRestore =
                hasRestoredMainImage && !currentFormMainImage;

              if (needsMainImageRestore) {
                console.log('🔄 [MAIN_IMAGE_RESTORE] 저장된 메인이미지 복원:', {
                  restoredMainImage: restoredMainImage.slice(0, 30) + '...',
                  메인이미지복원: true,
                });

                setValue('mainImage', restoredMainImage);
              }

              console.log('✅ [COMPONENT_INIT] 메인이미지 포함 복원 완료:', {
                hasRestoredMainImage,
                needsMainImageRestore,
                메인이미지영속성복원: true,
              });
            })
            .catch((initError) => {
              console.error('❌ [COMPONENT_INIT] 이미지 복원 실패:', {
                error: initError,
              });
            });
        }
      }
    }, [imageGalleryStore, setValue, currentFormValues.mainImage]);

    // 🚨 최종 보험: 페이지 로드 완료 후 강제 동기화
    useEffect(() => {
      const forceFinalSync = () => {
        const hasImageGalleryStore =
          imageGalleryStore !== null && imageGalleryStore !== undefined;
        if (!hasImageGalleryStore) return;

        const isInitialized = imageGalleryStore.getIsInitialized?.() || false;
        if (!isInitialized) return;

        const currentFormMainImage = currentFormValues.mainImage;
        const currentStoreConfig = imageGalleryStore.getImageViewConfig();
        const storeMainImage = currentStoreConfig?.mainImage;

        // 불일치 감지 시 Store 우선으로 복원
        if (storeMainImage && !currentFormMainImage) {
          console.log('🔄 [FINAL_SYNC] Store에서 Form으로 최종 복원:', {
            storeMainImage: storeMainImage.slice(0, 30) + '...',
            최종강제복원: true,
          });
          setValue('mainImage', storeMainImage, { shouldDirty: true });
        }
        // Form이 있는데 Store에 없으면 Form 우선으로 저장
        else if (currentFormMainImage && !storeMainImage) {
          console.log('🔄 [FINAL_SYNC] Form에서 Store로 최종 저장:', {
            formMainImage: currentFormMainImage.slice(0, 30) + '...',
            최종강제저장: true,
          });
          const updatedConfig = {
            ...currentStoreConfig,
            mainImage: currentFormMainImage,
          };
          imageGalleryStore.updateImageViewConfig(updatedConfig);
        }
      };

      // 3초 후 최종 동기화 (모든 초기화 완료 후)
      const finalSyncTimeout = setTimeout(forceFinalSync, 3000);

      return () => clearTimeout(finalSyncTimeout);
    }, [imageGalleryStore, currentFormValues.mainImage, setValue]);

    console.log(
      '✅ [INTEGRATION] 강화된 메인이미지 영속성 포함 통합 훅 초기화 완료:',
      {
        hasToastStore: toastStore !== null,
        hasImageGalleryStore: imageGalleryStore !== null,
        currentMainImage: currentFormValues.mainImage
          ? currentFormValues.mainImage.slice(0, 30) + '...'
          : 'none',
        메인이미지영속성지원: true,
        timestamp: new Date().toLocaleTimeString(),
      }
    );

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
