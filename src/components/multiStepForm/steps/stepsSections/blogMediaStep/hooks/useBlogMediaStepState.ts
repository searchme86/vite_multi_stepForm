// 📁 blogMediaStep/hooks/useBlogMediaStepState.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHybridImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type {
  FormValues,
  ToastItem,
} from '../../../../../../store/shared/commonTypes';

type StateUpdaterFunction<T> = (previousValue: T) => T;

interface UIState {
  isMobile: boolean;
}

interface SelectionState {
  selectedFileNames: string[];
}

interface StateUpdateOperation {
  readonly id: string;
  readonly type:
    | 'FORM_TO_STORE'
    | 'STORE_TO_FORM'
    | 'INITIALIZATION'
    | 'FORCE_SYNC'
    | 'MAIN_IMAGE_SYNC'; // 🚨 메인이미지 동기화 타입 추가
  readonly payload: {
    readonly mediaFiles?: string[];
    readonly mainImage?: string | null; // 🚨 메인이미지 페이로드 추가
    readonly sliderImages?: string[]; // 슬라이더 이미지 추가
    readonly force?: boolean;
  };
  readonly timestamp: number;
}

export const useBlogMediaStepState = () => {
  const { watch, setValue, getValues } = useFormContext<FormValues>();
  const galleryStore = useHybridImageGalleryStore();

  const [isStateLocked, setIsStateLocked] = useState(false);
  const [syncInitialized, setSyncInitialized] = useState(false);
  const isInitializingRef = useRef(false);
  const operationQueueRef = useRef<StateUpdateOperation[]>([]);
  const isProcessingQueueRef = useRef(false);

  const formValues = watch();
  const {
    media: currentMediaFiles = [],
    mainImage: currentMainImage = null, // 🚨 메인이미지 감지 추가
    sliderImages: currentSliderImages = [], // 슬라이더 이미지 감지 추가
  } = formValues;

  const [uiState, setUIState] = useState<UIState>({
    isMobile: false,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedFileNames: [],
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 🚨 추가: 강화된 페이지 로드 완료 후 최종 동기화
  useEffect(() => {
    const performFinalMainImageSync = () => {
      const currentFormMainImage = getValues('mainImage');
      const currentGalleryConfig = galleryStore.getImageViewConfig();
      const storeMainImage = currentGalleryConfig?.mainImage;

      // localStorage 백업도 확인
      try {
        const backupDataString = localStorage.getItem(
          'blogMediaMainImageBackup'
        );
        if (backupDataString) {
          const backupData = JSON.parse(backupDataString);
          const { mainImage: backupMainImage, timestamp: backupTimestamp } =
            backupData;

          const isRecentBackup = Date.now() - backupTimestamp < 5 * 60 * 1000;

          // 우선순위: 1) Form 값, 2) Store 값, 3) 최신 백업
          if (
            !currentFormMainImage &&
            !storeMainImage &&
            isRecentBackup &&
            backupMainImage
          ) {
            console.log('🔄 [FINAL_SYNC] 최종 localStorage 백업 복원:', {
              backupMainImage: backupMainImage.slice(0, 30) + '...',
              최종백업복원: true,
            });
            setValue('mainImage', backupMainImage, { shouldDirty: true });

            // Store에도 저장
            const updatedConfig = {
              ...currentGalleryConfig,
              mainImage: backupMainImage,
            };
            galleryStore.setImageViewConfig(updatedConfig);
          }
        }
      } catch (finalSyncError) {
        console.error('❌ [FINAL_SYNC] 최종 동기화 실패:', finalSyncError);
      }
    };

    if (syncInitialized) {
      const finalSyncTimeout = setTimeout(performFinalMainImageSync, 2000);
      return () => clearTimeout(finalSyncTimeout);
    }
  }, [syncInitialized, galleryStore, setValue, getValues]);

  console.log(
    '🔧 [BLOG_MEDIA_STATE] 강화된 메인이미지 영속성 포함 상태 관리 초기화:',
    {
      currentMediaFilesCount: currentMediaFiles.length,
      currentMainImage: currentMainImage
        ? currentMainImage.slice(0, 30) + '...'
        : 'none',
      currentSliderImagesCount: currentSliderImages.length,
      syncInitialized,
      isStateLocked,
      메인이미지영속성지원: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  const acquireLock = useCallback(
    (operationType: string): boolean => {
      if (isStateLocked) {
        console.log('⏳ [STATE_LOCK] 상태 락 대기 중:', {
          operationType,
          currentLockStatus: isStateLocked,
        });
        return false;
      }

      setIsStateLocked(true);
      console.log('🔒 [STATE_LOCK] 상태 락 획득:', {
        operationType,
        lockAcquired: true,
      });
      return true;
    },
    [isStateLocked]
  );

  const releaseLock = useCallback((operationType: string) => {
    setIsStateLocked(false);
    console.log('🔓 [STATE_LOCK] 상태 락 해제:', {
      operationType,
      lockReleased: true,
    });
  }, []);

  const addToOperationQueue = useCallback((operation: StateUpdateOperation) => {
    operationQueueRef.current.push(operation);
    console.log('📝 [OPERATION_QUEUE] 작업 큐에 추가:', {
      operationType: operation.type,
      queueLength: operationQueueRef.current.length,
      operationId: operation.id,
      hasMainImage: operation.payload.mainImage !== undefined,
    });
  }, []);

  const processOperationQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) {
      return;
    }

    const hasOperations = operationQueueRef.current.length > 0;
    if (!hasOperations) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      while (operationQueueRef.current.length > 0) {
        const operation = operationQueueRef.current.shift();
        if (!operation) continue;

        const lockAcquired = acquireLock(`QUEUE_${operation.type}`);
        if (!lockAcquired) {
          operationQueueRef.current.unshift(operation);
          await new Promise((resolve) => setTimeout(resolve, 50));
          continue;
        }

        try {
          await executeOperation(operation);
        } catch (operationError) {
          console.error('❌ [QUEUE_PROCESSOR] 작업 실행 실패:', {
            operationType: operation.type,
            operationId: operation.id,
            error: operationError,
          });
        } finally {
          releaseLock(`QUEUE_${operation.type}`);
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [acquireLock, releaseLock]);

  // 🚨 핵심 수정: 메인이미지 동기화 로직 추가
  const executeOperation = useCallback(
    async (operation: StateUpdateOperation) => {
      console.log('⚡ [OPERATION_EXECUTE] 작업 실행 - 메인이미지 포함:', {
        operationType: operation.type,
        operationId: operation.id,
        hasMainImage: operation.payload.mainImage !== undefined,
        mainImagePreview: operation.payload.mainImage
          ? operation.payload.mainImage.slice(0, 30) + '...'
          : 'none',
      });

      const { type, payload } = operation;

      switch (type) {
        case 'FORM_TO_STORE': {
          const { mediaFiles = [], mainImage, sliderImages = [] } = payload;

          const currentGalleryConfig = galleryStore.getImageViewConfig();

          const updatedConfig = {
            ...currentGalleryConfig,
            selectedImages: mediaFiles,
            ...(mainImage !== undefined && { mainImage }), // 🚨 메인이미지 업데이트
            sliderImages, // 슬라이더 이미지 업데이트
          };

          galleryStore.setImageViewConfig(updatedConfig);

          console.log(
            '✅ [OPERATION_EXECUTE] 폼 → 스토어 동기화 완료 (메인이미지 포함):',
            {
              mediaFilesCount: mediaFiles.length,
              mainImageUpdated: mainImage !== undefined,
              mainImageValue: mainImage || 'null',
              sliderImagesCount: sliderImages.length,
              메인이미지영속성저장: true,
            }
          );
          break;
        }

        case 'STORE_TO_FORM': {
          const currentGalleryConfig = galleryStore.getImageViewConfig();
          const {
            selectedImages: currentGalleryImages = [],
            mainImage: storedMainImage = null,
            sliderImages: storedSliderImages = [],
          } = currentGalleryConfig;

          // 🚨 강화된 메인이미지 복원 로직
          setValue('media', currentGalleryImages, { shouldDirty: true });

          // localStorage 백업도 확인
          let finalMainImage = storedMainImage;
          try {
            const backupDataString = localStorage.getItem(
              'blogMediaMainImageBackup'
            );
            if (backupDataString) {
              const backupData = JSON.parse(backupDataString);
              const { mainImage: backupMainImage, timestamp: backupTimestamp } =
                backupData;

              // 백업이 더 최신이면 백업 우선
              const isRecentBackup =
                Date.now() - backupTimestamp < 5 * 60 * 1000;
              if (isRecentBackup && backupMainImage && !storedMainImage) {
                finalMainImage = backupMainImage;
                console.log(
                  '🔄 [STORE_TO_FORM] localStorage 백업이 더 최신, 백업 우선 사용:',
                  {
                    backupMainImage: backupMainImage.slice(0, 30) + '...',
                    localStorage백업우선: true,
                  }
                );
              }
            }
          } catch (backupError) {
            console.warn(
              '⚠️ [STORE_TO_FORM] localStorage 백업 확인 실패:',
              backupError
            );
          }

          const hasValidMainImage = finalMainImage && finalMainImage.length > 0;
          if (hasValidMainImage) {
            setValue('mainImage', finalMainImage, {
              shouldDirty: true,
              shouldTouch: true,
            });
            console.log('🔄 [STORE_TO_FORM] 강화된 메인이미지 복원:', {
              mainImage: finalMainImage
                ? finalMainImage.slice(0, 30) + '...'
                : 'none',
              source:
                finalMainImage === storedMainImage ? 'store' : 'localStorage',
              강화된메인이미지복원: true,
            });
          }

          if (storedSliderImages.length > 0) {
            setValue('sliderImages', storedSliderImages, { shouldDirty: true });
          }

          console.log(
            '✅ [OPERATION_EXECUTE] 강화된 스토어 → 폼 동기화 완료:',
            {
              galleryImagesCount: currentGalleryImages.length,
              mainImageRestored: hasValidMainImage,
              mainImageSource:
                finalMainImage === storedMainImage ? 'store' : 'localStorage',
              sliderImagesCount: storedSliderImages.length,
              강화된메인이미지영속성복원: true,
            }
          );
          break;
        }

        case 'INITIALIZATION': {
          const isGalleryInitialized = galleryStore.getIsInitialized();

          if (!isGalleryInitialized) {
            await galleryStore.initializeStoredImages();
          }

          const currentGalleryConfig = galleryStore.getImageViewConfig();
          const {
            selectedImages: currentGalleryImages = [],
            mainImage: storedMainImage = null,
            sliderImages: storedSliderImages = [],
          } = currentGalleryConfig;

          const currentFormMedia = getValues('media') ?? [];
          const currentFormMainImage = getValues('mainImage') ?? null;

          const shouldRestoreFromGallery =
            currentGalleryImages.length > 0 && currentFormMedia.length === 0;

          if (shouldRestoreFromGallery) {
            setValue('media', currentGalleryImages, { shouldDirty: true });
          }

          // 🚨 강화된 초기화 시 메인이미지 복원
          let finalMainImage = storedMainImage;

          // localStorage 백업도 확인하여 가장 적절한 값 선택
          try {
            const backupDataString = localStorage.getItem(
              'blogMediaMainImageBackup'
            );
            if (backupDataString) {
              const backupData = JSON.parse(backupDataString);
              const { mainImage: backupMainImage, timestamp: backupTimestamp } =
                backupData;

              const isRecentBackup =
                Date.now() - backupTimestamp < 5 * 60 * 1000;

              // 우선순위: 1) 현재 Form 값, 2) 최신 백업, 3) Store 값
              if (!currentFormMainImage) {
                if (isRecentBackup && backupMainImage) {
                  finalMainImage = backupMainImage;
                  console.log(
                    '🔄 [INITIALIZATION] localStorage 백업을 초기화에 사용:',
                    {
                      backupMainImage: backupMainImage.slice(0, 30) + '...',
                      초기화시localStorage백업사용: true,
                    }
                  );
                } else if (storedMainImage) {
                  finalMainImage = storedMainImage;
                }
              }
            }
          } catch (backupError) {
            console.warn(
              '⚠️ [INITIALIZATION] localStorage 백업 확인 실패:',
              backupError
            );
          }

          const shouldRestoreMainImage =
            finalMainImage &&
            finalMainImage.length > 0 &&
            !currentFormMainImage;

          if (shouldRestoreMainImage && finalMainImage) {
            setValue('mainImage', finalMainImage, {
              shouldDirty: true,
              shouldTouch: true,
            });
            console.log(
              '🔄 [INITIALIZATION] 강화된 초기화 시 메인이미지 복원:',
              {
                mainImage: finalMainImage
                  ? finalMainImage.slice(0, 30) + '...'
                  : 'none',
                source:
                  finalMainImage === storedMainImage ? 'store' : 'localStorage',
                강화된메인이미지초기화복원: true,
              }
            );
          }

          if (
            storedSliderImages.length > 0 &&
            !getValues('sliderImages')?.length
          ) {
            setValue('sliderImages', storedSliderImages, { shouldDirty: true });
          }

          setSyncInitialized(true);

          console.log('✅ [OPERATION_EXECUTE] 강화된 초기화 완료:', {
            galleryImagesCount: currentGalleryImages.length,
            formMediaCount: currentFormMedia.length,
            mediaRestored: shouldRestoreFromGallery,
            mainImageRestored: shouldRestoreMainImage,
            mainImageSource: shouldRestoreMainImage
              ? finalMainImage === storedMainImage
                ? 'store'
                : 'localStorage'
              : 'none',
            sliderImagesCount: storedSliderImages.length,
            강화된메인이미지영속성초기화: true,
          });
          break;
        }

        // 🚨 새로운 케이스: 메인이미지 전용 동기화
        case 'MAIN_IMAGE_SYNC': {
          const { mainImage } = payload;

          const currentGalleryConfig = galleryStore.getImageViewConfig();
          const updatedConfig = {
            ...currentGalleryConfig,
            mainImage: mainImage || null,
          };

          galleryStore.setImageViewConfig(updatedConfig);

          console.log('✅ [OPERATION_EXECUTE] 메인이미지 전용 동기화 완료:', {
            mainImageValue: mainImage || 'null',
            메인이미지전용동기화: true,
          });
          break;
        }

        case 'FORCE_SYNC': {
          const currentGalleryConfig = galleryStore.getImageViewConfig();
          const currentFormMedia = getValues('media') ?? [];
          const currentFormMainImage = getValues('mainImage') ?? null;
          const currentFormSliderImages = getValues('sliderImages') ?? [];

          const {
            selectedImages: galleryImages = [],
            mainImage: galleryMainImage = null,
          } = currentGalleryConfig;

          const shouldSyncFromGalleryToForm =
            galleryImages.length > currentFormMedia.length;
          const shouldSyncFromFormToGallery =
            currentFormMedia.length > galleryImages.length;
          const shouldSyncMainImageFromGallery =
            galleryMainImage && !currentFormMainImage; // 🚨 메인이미지 동기화 조건

          if (shouldSyncFromGalleryToForm) {
            setValue('media', galleryImages, { shouldDirty: true });

            // 🚨 강제 동기화 시 메인이미지도 확인
            if (shouldSyncMainImageFromGallery) {
              setValue('mainImage', galleryMainImage, { shouldDirty: true });
            }
          } else if (shouldSyncFromFormToGallery) {
            const updatedConfig = {
              ...galleryStore.getImageViewConfig(),
              selectedImages: currentFormMedia,
              mainImage: currentFormMainImage, // 🚨 메인이미지도 함께 동기화
              sliderImages: currentFormSliderImages,
            };
            galleryStore.setImageViewConfig(updatedConfig);
          }

          console.log(
            '✅ [OPERATION_EXECUTE] 강제 동기화 완료 (메인이미지 포함):',
            {
              galleryCount: galleryImages.length,
              formCount: currentFormMedia.length,
              mainImageSynced: shouldSyncMainImageFromGallery,
              syncDirection: shouldSyncFromGalleryToForm
                ? 'gallery→form'
                : shouldSyncFromFormToGallery
                ? 'form→gallery'
                : 'none',
              메인이미지강제동기화: true,
            }
          );
          break;
        }
      }
    },
    [galleryStore, setValue, getValues]
  );

  useEffect(() => {
    const initializationTimeoutId = setTimeout(() => {
      const isCurrentlyInitializing = isInitializingRef.current;
      const isAlreadyInitialized = syncInitialized;

      if (isCurrentlyInitializing || isAlreadyInitialized) {
        return;
      }

      isInitializingRef.current = true;

      const initOperation: StateUpdateOperation = {
        id: `init_${Date.now()}`,
        type: 'INITIALIZATION',
        payload: {},
        timestamp: Date.now(),
      };

      addToOperationQueue(initOperation);

      setTimeout(() => {
        isInitializingRef.current = false;
      }, 1000);
    }, 100);

    return () => clearTimeout(initializationTimeoutId);
  }, [syncInitialized, addToOperationQueue]);

  useEffect(() => {
    const queueProcessorInterval = setInterval(() => {
      processOperationQueue();
    }, 50);

    return () => clearInterval(queueProcessorInterval);
  }, [processOperationQueue]);

  // 🚨 메인이미지 변경 감지 및 자동 동기화
  useEffect(() => {
    const mainImageChangeTimeoutId = setTimeout(() => {
      if (!syncInitialized || isStateLocked) {
        return;
      }

      const currentStoredMainImage =
        galleryStore.getImageViewConfig().mainImage;
      const needsMainImageSync = currentMainImage !== currentStoredMainImage;

      if (needsMainImageSync) {
        console.log('🔍 [MAIN_IMAGE_WATCH] 메인이미지 변경 감지:', {
          currentMainImage: currentMainImage
            ? currentMainImage.slice(0, 30) + '...'
            : 'none',
          storedMainImage: currentStoredMainImage
            ? currentStoredMainImage.slice(0, 30) + '...'
            : 'none',
          needsSync: true,
        });

        const mainImageSyncOperation: StateUpdateOperation = {
          id: `main_sync_${Date.now()}`,
          type: 'MAIN_IMAGE_SYNC',
          payload: { mainImage: currentMainImage },
          timestamp: Date.now(),
        };

        addToOperationQueue(mainImageSyncOperation);
      }
    }, 200);

    return () => clearTimeout(mainImageChangeTimeoutId);
  }, [
    currentMainImage,
    syncInitialized,
    isStateLocked,
    galleryStore,
    addToOperationQueue,
  ]);

  useEffect(() => {
    const formChangeTimeoutId = setTimeout(() => {
      if (!syncInitialized || isStateLocked) {
        return;
      }

      console.log('🔍 [FORM_WATCH] 폼 변경 감지 (메인이미지 포함):', {
        mediaFilesCount: currentMediaFiles.length,
        hasMainImage: currentMainImage !== null,
        mainImagePreview: currentMainImage
          ? currentMainImage.slice(0, 30) + '...'
          : 'none',
        sliderImagesCount: currentSliderImages.length,
        메인이미지감지: true,
      });
    }, 200);

    return () => clearTimeout(formChangeTimeoutId);
  }, [
    currentMediaFiles,
    currentMainImage,
    currentSliderImages,
    syncInitialized,
    isStateLocked,
  ]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const shouldHandlePageShow =
        event.persisted && syncInitialized && !isStateLocked;

      if (!shouldHandlePageShow) {
        return;
      }

      console.log(
        '🔄 [PAGE_SHOW] 브라우저 뒤로가기 감지 - 메인이미지 포함 복원'
      );

      const restoreOperation: StateUpdateOperation = {
        id: `restore_${Date.now()}`,
        type: 'STORE_TO_FORM',
        payload: {},
        timestamp: Date.now(),
      };

      addToOperationQueue(restoreOperation);
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [syncInitialized, isStateLocked, addToOperationQueue]);

  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileUserAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      const isTouchDevice = 'ontouchstart' in window;
      const { innerWidth } = window;
      const hasSmallScreen = innerWidth <= 768;

      const isMobileDevice =
        isMobileUserAgent || (isTouchDevice && hasSmallScreen);

      setUIState((previousState) => ({
        ...previousState,
        isMobile: isMobileDevice,
      }));
    };

    checkMobileDevice();
    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);

  // 🚨 수정: 메인이미지 동기화 포함 setMediaValue
  const setMediaValue = useCallback(
    (filesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      console.log('🔍 [SET_MEDIA] 메인이미지 연동 setMediaValue:', {
        입력타입:
          typeof filesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
        isStateLocked,
        메인이미지연동처리: true,
      });

      if (isStateLocked) {
        console.log('⏳ [SET_MEDIA] 상태 락으로 인한 대기');
        return;
      }

      try {
        let finalFiles: string[];

        const isUpdaterFunction = typeof filesOrUpdater === 'function';

        if (isUpdaterFunction) {
          const currentMediaFiles = getValues('media') ?? [];
          finalFiles = filesOrUpdater(currentMediaFiles);
        } else {
          finalFiles = filesOrUpdater;
        }

        setValue('media', finalFiles, { shouldDirty: true });

        // 🚨 메인이미지 유효성 검사 및 자동 해제
        const currentMainImage = getValues('mainImage');
        const isMainImageStillValid =
          currentMainImage && finalFiles.includes(currentMainImage);

        if (currentMainImage && !isMainImageStillValid) {
          console.log(
            '⚠️ [SET_MEDIA] 메인이미지가 삭제된 미디어에 포함되어 자동 해제:',
            {
              removedMainImage: currentMainImage.slice(0, 30) + '...',
              메인이미지자동해제: true,
            }
          );

          setValue('mainImage', null, { shouldDirty: true });
        }

        const syncOperation: StateUpdateOperation = {
          id: `sync_${Date.now()}`,
          type: 'FORM_TO_STORE',
          payload: {
            mediaFiles: finalFiles,
            mainImage: isMainImageStillValid ? currentMainImage : null, // 🚨 메인이미지도 함께 전달
          },
          timestamp: Date.now(),
        };

        addToOperationQueue(syncOperation);

        console.log('✅ [SET_MEDIA] 메인이미지 연동 동기화 예약 완료:', {
          finalFilesCount: finalFiles.length,
          mainImageValid: isMainImageStillValid,
          operationId: syncOperation.id,
          메인이미지연동완료: true,
        });
      } catch (syncError) {
        console.error('❌ [SET_MEDIA] 동기화 예약 실패:', { error: syncError });
      }
    },
    [isStateLocked, getValues, setValue, addToOperationQueue]
  );

  const setMainImageValue = useCallback(
    (imageUrl: string) => {
      console.log('🔧 [SET_MAIN_IMAGE] 강화된 setMainImageValue 호출:', {
        imageUrlPreview: imageUrl ? imageUrl.slice(0, 30) + '...' : 'none',
        강화된영속성처리: true,
      });

      // 1단계: React Hook Form 즉시 업데이트
      setValue('mainImage', imageUrl, { shouldDirty: true, shouldTouch: true });

      // 2단계: localStorage 백업 저장
      try {
        const backupData = {
          mainImage: imageUrl || null,
          timestamp: Date.now(),
          source: 'setMainImageValue_state',
        };
        localStorage.setItem(
          'blogMediaMainImageBackup',
          JSON.stringify(backupData)
        );
      } catch (backupError) {
        console.error(
          '❌ [SET_MAIN_IMAGE] localStorage 백업 실패:',
          backupError
        );
      }

      // 🚨 3단계: 메인이미지 변경 시 즉시 동기화 (강화됨)
      const mainImageSyncOperation: StateUpdateOperation = {
        id: `main_direct_${Date.now()}`,
        type: 'MAIN_IMAGE_SYNC',
        payload: { mainImage: imageUrl },
        timestamp: Date.now(),
      };

      addToOperationQueue(mainImageSyncOperation);

      // 4단계: 지연 백업 (Race Condition 방지)
      setTimeout(() => {
        const currentValue = getValues('mainImage');
        if (currentValue !== imageUrl) {
          console.log('⚠️ [SET_MAIN_IMAGE] 값 불일치 감지, 재설정');
          setValue('mainImage', imageUrl, { shouldDirty: true });
        }
      }, 100);
    },
    [setValue, getValues, addToOperationQueue]
  );

  const setSelectedFileNames = useCallback(
    (namesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      try {
        let finalNames: string[];

        const isUpdaterFunction = typeof namesOrUpdater === 'function';

        if (isUpdaterFunction) {
          finalNames = namesOrUpdater(selectionState.selectedFileNames);
        } else {
          finalNames = namesOrUpdater;
        }

        setSelectionState((previousState) => ({
          ...previousState,
          selectedFileNames: finalNames,
        }));

        console.log('✅ [SET_NAMES] 파일명 업데이트 완료:', {
          updatedNamesCount: finalNames.length,
        });
      } catch (updateError) {
        console.error('❌ [SET_NAMES] 파일명 업데이트 실패:', {
          error: updateError,
        });
      }
    },
    [selectionState.selectedFileNames]
  );

  const addToast = useCallback((toast: Omit<ToastItem, 'id' | 'createdAt'>) => {
    const currentTimestamp = Date.now();
    const newToast: ToastItem = {
      ...toast,
      id: currentTimestamp.toString(),
      createdAt: new Date(),
    };

    setToasts((previousToasts) => [...previousToasts, newToast]);

    const timeoutId = setTimeout(() => {
      setToasts((previousToasts) =>
        previousToasts.filter(({ id }) => id !== newToast.id)
      );
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((previousToasts) =>
      previousToasts.filter(({ id }) => id !== toastId)
    );
  }, []);

  const forceSync = useCallback(() => {
    if (isStateLocked) {
      console.log('⏳ [FORCE_SYNC] 상태 락으로 인한 대기');
      return;
    }

    const forceSyncOperation: StateUpdateOperation = {
      id: `force_${Date.now()}`,
      type: 'FORCE_SYNC',
      payload: { force: true },
      timestamp: Date.now(),
    };

    addToOperationQueue(forceSyncOperation);

    console.log('✅ [FORCE_SYNC] 강화된 강제 동기화 예약 완료:', {
      operationId: forceSyncOperation.id,
      강화된메인이미지강제동기화: true,
    });
  }, [isStateLocked, addToOperationQueue]);

  console.log(
    '✅ [BLOG_MEDIA_STATE] 강화된 메인이미지 영속성 포함 상태 반환:',
    {
      formValuesKeys: Object.keys(formValues),
      currentMediaFilesCount: currentMediaFiles.length,
      currentMainImage: currentMainImage
        ? currentMainImage.slice(0, 30) + '...'
        : 'none',
      isStateLocked,
      queueLength: operationQueueRef.current.length,
      syncInitialized,
      강화된메인이미지영속성완료: true,
      다중백업시스템: true,
      강제동기화지원: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  return {
    formValues,
    uiState,
    selectionState,
    toasts,

    setMediaValue,
    setMainImageValue,
    setSelectedFileNames,
    addToast,
    removeToast,

    imageGalleryStore: galleryStore,
    syncInitialized,
    isStateLocked,

    forceSync,
  };
};
