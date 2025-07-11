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

// 🔧 상태 락 및 큐 시스템 추가
interface StateUpdateOperation {
  readonly id: string;
  readonly type:
    | 'FORM_TO_STORE'
    | 'STORE_TO_FORM'
    | 'INITIALIZATION'
    | 'FORCE_SYNC';
  readonly payload: {
    readonly mediaFiles?: string[];
    readonly force?: boolean;
  };
  readonly timestamp: number;
}

export const useBlogMediaStepState = () => {
  const { watch, setValue, getValues } = useFormContext<FormValues>();
  const galleryStore = useHybridImageGalleryStore();

  // 🚨 Race Condition 해결: 상태 락 시스템
  const [isStateLocked, setIsStateLocked] = useState(false);
  const [syncInitialized, setSyncInitialized] = useState(false);
  const isInitializingRef = useRef(false);
  const operationQueueRef = useRef<StateUpdateOperation[]>([]);
  const isProcessingQueueRef = useRef(false);

  const formValues = watch();
  const { media: currentMediaFiles = [] } = formValues;

  const [uiState, setUIState] = useState<UIState>({
    isMobile: false,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedFileNames: [],
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  console.log('🔧 [BLOG_MEDIA_STATE] Race Condition 해결된 상태 관리 초기화:', {
    currentMediaFilesCount: currentMediaFiles.length,
    syncInitialized,
    isStateLocked,
    queueLength: operationQueueRef.current.length,
    galleryStoreInitialized: galleryStore.getIsInitialized(),
    raceConditionFixed: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 상태 락 관리 함수들
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

  // 🔧 큐 시스템: 순차 처리
  const addToOperationQueue = useCallback((operation: StateUpdateOperation) => {
    operationQueueRef.current.push(operation);
    console.log('📝 [OPERATION_QUEUE] 작업 큐에 추가:', {
      operationType: operation.type,
      queueLength: operationQueueRef.current.length,
      operationId: operation.id,
    });
  }, []);

  const processOperationQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) {
      console.log('⏳ [QUEUE_PROCESSOR] 이미 큐 처리 중');
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
          // 락 획득 실패 시 다시 큐에 넣고 잠시 대기
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
          // 다음 작업과의 간격 보장
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, [acquireLock, releaseLock]);

  // 🔧 작업 실행 함수
  const executeOperation = useCallback(
    async (operation: StateUpdateOperation) => {
      console.log('⚡ [OPERATION_EXECUTE] 작업 실행:', {
        operationType: operation.type,
        operationId: operation.id,
        payload: operation.payload,
      });

      const { type, payload } = operation;

      switch (type) {
        case 'FORM_TO_STORE': {
          const { mediaFiles = [] } = payload;
          const currentGalleryConfig = galleryStore.getImageViewConfig();

          const updatedConfig = {
            ...currentGalleryConfig,
            selectedImages: mediaFiles,
          };

          galleryStore.setImageViewConfig(updatedConfig);

          console.log('✅ [OPERATION_EXECUTE] 폼 → 스토어 동기화 완료:', {
            mediaFilesCount: mediaFiles.length,
          });
          break;
        }

        case 'STORE_TO_FORM': {
          const currentGalleryImages =
            galleryStore.getImageViewConfig().selectedImages ?? [];

          setValue('media', currentGalleryImages, { shouldDirty: true });

          console.log('✅ [OPERATION_EXECUTE] 스토어 → 폼 동기화 완료:', {
            galleryImagesCount: currentGalleryImages.length,
          });
          break;
        }

        case 'INITIALIZATION': {
          const isGalleryInitialized = galleryStore.getIsInitialized();

          if (!isGalleryInitialized) {
            await galleryStore.initializeStoredImages();
          }

          const currentGalleryImages =
            galleryStore.getImageViewConfig().selectedImages ?? [];
          const currentFormMedia = getValues('media') ?? [];

          const shouldRestoreFromGallery =
            currentGalleryImages.length > 0 && currentFormMedia.length === 0;

          if (shouldRestoreFromGallery) {
            setValue('media', currentGalleryImages, { shouldDirty: true });
          }

          setSyncInitialized(true);

          console.log('✅ [OPERATION_EXECUTE] 초기화 완료:', {
            galleryImagesCount: currentGalleryImages.length,
            formMediaCount: currentFormMedia.length,
            restored: shouldRestoreFromGallery,
          });
          break;
        }

        case 'FORCE_SYNC': {
          const currentGalleryImages =
            galleryStore.getImageViewConfig().selectedImages ?? [];
          const currentFormMedia = getValues('media') ?? [];

          const shouldSyncFromGalleryToForm =
            currentGalleryImages.length > currentFormMedia.length;
          const shouldSyncFromFormToGallery =
            currentFormMedia.length > currentGalleryImages.length;

          if (shouldSyncFromGalleryToForm) {
            setValue('media', currentGalleryImages, { shouldDirty: true });
          } else if (shouldSyncFromFormToGallery) {
            const updatedConfig = {
              ...galleryStore.getImageViewConfig(),
              selectedImages: currentFormMedia,
            };
            galleryStore.setImageViewConfig(updatedConfig);
          }

          console.log('✅ [OPERATION_EXECUTE] 강제 동기화 완료:', {
            galleryCount: currentGalleryImages.length,
            formCount: currentFormMedia.length,
            syncDirection: shouldSyncFromGalleryToForm
              ? 'gallery→form'
              : shouldSyncFromFormToGallery
              ? 'form→gallery'
              : 'none',
          });
          break;
        }
      }
    },
    [galleryStore, setValue, getValues]
  );

  // 🚨 Race Condition 해결: 디바운스된 단일 초기화
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

      // 초기화 완료 후 플래그 해제
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 1000);
    }, 100); // 디바운스: 100ms

    return () => clearTimeout(initializationTimeoutId);
  }, [syncInitialized, addToOperationQueue]);

  // 🔧 큐 처리기 실행
  useEffect(() => {
    const queueProcessorInterval = setInterval(() => {
      processOperationQueue();
    }, 50); // 50ms마다 큐 확인

    return () => clearInterval(queueProcessorInterval);
  }, [processOperationQueue]);

  // 🚨 Race Condition 해결: 폼 변경 감지 (디바운스)
  useEffect(() => {
    const formChangeTimeoutId = setTimeout(() => {
      if (!syncInitialized || isStateLocked) {
        return;
      }

      console.log('🔍 [FORM_WATCH] 폼 변경 감지 (디바운스됨):', {
        mediaFilesCount: currentMediaFiles.length,
        isStateLocked,
        syncInitialized,
      });
    }, 200); // 디바운스: 200ms

    return () => clearTimeout(formChangeTimeoutId);
  }, [currentMediaFiles, syncInitialized, isStateLocked]);

  // 🚨 Race Condition 해결: 페이지 복원 (단일 이벤트)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const shouldHandlePageShow =
        event.persisted && syncInitialized && !isStateLocked;

      if (!shouldHandlePageShow) {
        return;
      }

      console.log('🔄 [PAGE_SHOW] 브라우저 뒤로가기 감지');

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

  // 모바일 감지 (변경 없음)
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

  // 🚨 Race Condition 해결: 큐 기반 미디어 설정
  const setMediaValue = useCallback(
    (filesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      console.log('🔍 [SET_MEDIA] Race Condition 해결된 setMediaValue:', {
        입력타입:
          typeof filesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
        isStateLocked,
        raceConditionFixed: true,
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

        // React Hook Form 즉시 업데이트
        setValue('media', finalFiles, { shouldDirty: true });

        // Zustand 동기화는 큐로 처리
        const syncOperation: StateUpdateOperation = {
          id: `sync_${Date.now()}`,
          type: 'FORM_TO_STORE',
          payload: { mediaFiles: finalFiles },
          timestamp: Date.now(),
        };

        addToOperationQueue(syncOperation);

        console.log('✅ [SET_MEDIA] 큐 기반 동기화 예약 완료:', {
          finalFilesCount: finalFiles.length,
          operationId: syncOperation.id,
        });
      } catch (syncError) {
        console.error('❌ [SET_MEDIA] 동기화 예약 실패:', {
          error: syncError,
        });
      }
    },
    [isStateLocked, getValues, setValue, addToOperationQueue]
  );

  const setMainImageValue = useCallback(
    (imageUrl: string) => {
      console.log('🔧 [SET_MAIN_IMAGE] setMainImageValue 호출:', {
        imageUrlPreview: imageUrl ? imageUrl.slice(0, 30) + '...' : 'none',
      });

      setValue('mainImage', imageUrl, { shouldDirty: true });
    },
    [setValue]
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

  // 🚨 Race Condition 해결: 큐 기반 강제 동기화
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

    console.log('✅ [FORCE_SYNC] 강제 동기화 예약 완료:', {
      operationId: forceSyncOperation.id,
    });
  }, [isStateLocked, addToOperationQueue]);

  console.log('✅ [BLOG_MEDIA_STATE] Race Condition 해결된 상태 반환:', {
    formValuesKeys: Object.keys(formValues),
    currentMediaFilesCount: currentMediaFiles.length,
    isStateLocked,
    queueLength: operationQueueRef.current.length,
    syncInitialized,
    raceConditionFixed: true,
    stateQueueSystem: true,
    timestamp: new Date().toLocaleTimeString(),
  });

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
    isStateLocked, // 추가: 외부에서 상태 확인 가능

    forceSync,
  };
};
