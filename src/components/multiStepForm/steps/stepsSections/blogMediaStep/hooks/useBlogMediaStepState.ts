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

export const useBlogMediaStepState = () => {
  const { watch, setValue, getValues } = useFormContext<FormValues>();
  const galleryStore = useHybridImageGalleryStore();

  const [syncInitialized, setSyncInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  const formValues = watch();
  const { media: currentMediaFiles = [] } = formValues;

  const [uiState, setUIState] = useState<UIState>({
    isMobile: false,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedFileNames: [],
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  console.log('🔧 [BLOG_MEDIA_STATE] 단순화된 상태 관리 초기화:', {
    currentMediaFilesCount: currentMediaFiles.length,
    syncInitialized,
    galleryStoreInitialized: galleryStore.getIsInitialized(),
    simplifiedSync: true,
    reactHookFormOnly: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  useEffect(() => {
    console.log('🔍 [FORM_WATCH] React Hook Form watch() 변경 감지:', {
      mediaFilesCount: currentMediaFiles.length,
      mediaFilesPreview: currentMediaFiles.map((url, index) => ({
        index,
        preview: url.slice(0, 30) + '...',
      })),
      formValuesKeys: Object.keys(formValues),
      hasMediaField: 'media' in formValues,
      mediaFieldType: typeof formValues.media,
      simplifiedSyncEnabled: true,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [currentMediaFiles, formValues]);

  useEffect(() => {
    const interval = setInterval(() => {
      const galleryImages =
        galleryStore.getImageViewConfig().selectedImages ?? [];
      const formMediaImages = getValues('media') ?? [];

      console.log('🔍 [DEBUG] 이미지 상태 비교 - 단순화된 동기화:', {
        갤러리_스토어_개수: galleryImages.length,
        폼_개수: formMediaImages.length,
        갤러리_이미지들: galleryImages.map(
          (url, i) => `${i + 1}: ${url.slice(0, 20)}...`
        ),
        폼_이미지들: formMediaImages.map(
          (url, i) => `${i + 1}: ${url.slice(0, 20)}...`
        ),
        동기화_상태:
          galleryImages.length === formMediaImages.length
            ? '✅ 동기화됨'
            : '❌ 동기화 안됨',
        단순화된동기화: true,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [galleryStore, getValues]);

  useEffect(() => {
    const initializeGalleryOnce = async () => {
      const isCurrentlyInitializing = isInitializingRef.current;
      if (isCurrentlyInitializing) {
        console.log('🔄 [GALLERY_INIT] 이미 초기화 중이므로 중복 방지');
        return;
      }

      const isAlreadyInitialized = syncInitialized;
      if (isAlreadyInitialized) {
        console.log('🔄 [GALLERY_INIT] 이미 초기화 완료됨');
        return;
      }

      isInitializingRef.current = true;

      try {
        console.log('🚀 [GALLERY_INIT] 갤러리 스토어 단순 초기화 시작');

        const isGalleryInitialized = galleryStore.getIsInitialized();

        if (!isGalleryInitialized) {
          await galleryStore.initializeStoredImages();
          console.log('✅ [GALLERY_INIT] 갤러리 스토어 초기화 완료');
        } else {
          console.log('ℹ️ [GALLERY_INIT] 갤러리 스토어 이미 초기화됨');
        }

        const currentGalleryImages =
          galleryStore.getImageViewConfig().selectedImages ?? [];
        const currentFormMedia = getValues('media') ?? [];

        const shouldRestoreFromGallery =
          currentGalleryImages.length > 0 && currentFormMedia.length === 0;

        if (shouldRestoreFromGallery) {
          console.log('🔄 [GALLERY_INIT] 갤러리에서 폼으로 단순 복원:', {
            갤러리이미지개수: currentGalleryImages.length,
            폼이미지개수: currentFormMedia.length,
            복원예정: true,
          });

          setValue('media', currentGalleryImages, { shouldDirty: true });

          console.log('✅ [GALLERY_INIT] 단순 복원 완료');
        }

        setSyncInitialized(true);
      } catch (initError) {
        console.error('❌ [GALLERY_INIT] 갤러리 스토어 초기화 실패:', {
          error: initError,
        });
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeGalleryOnce();
  }, [galleryStore, getValues, setValue, syncInitialized]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const shouldHandlePageShow = event.persisted && syncInitialized;

      if (!shouldHandlePageShow) {
        return;
      }

      console.log('🔄 [PAGE_SHOW] 브라우저 뒤로가기 감지, 단순 복원 시도');

      const timeoutId = setTimeout(() => {
        const currentGalleryImages =
          galleryStore.getImageViewConfig().selectedImages ?? [];
        const currentFormMedia = getValues('media') ?? [];

        const shouldRestoreFromGallery =
          currentGalleryImages.length > 0 && currentFormMedia.length === 0;

        if (shouldRestoreFromGallery) {
          console.log('🔄 [PAGE_SHOW] 단순 복원 실행:', {
            갤러리이미지개수: currentGalleryImages.length,
            폼이미지개수: currentFormMedia.length,
          });

          setValue('media', currentGalleryImages, { shouldDirty: true });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [syncInitialized, getValues, setValue, galleryStore]);

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

      console.log('📱 [MOBILE_CHECK] 모바일 기기 감지:', {
        isMobileUserAgent,
        isTouchDevice,
        hasSmallScreen,
        isMobileDevice,
        userAgent: userAgent.slice(0, 50) + '...',
      });
    };

    checkMobileDevice();

    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);

  const setMediaValue = useCallback(
    (filesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      console.log('🔍 [SET_MEDIA_DEBUG] 단순화된 setMediaValue 호출:', {
        입력타입:
          typeof filesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
        현재폼개수: getValues('media')?.length ?? 0,
        단순화된처리: true,
        zustandDirectUpdate: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        let finalFiles: string[];

        const isUpdaterFunction = typeof filesOrUpdater === 'function';

        if (isUpdaterFunction) {
          console.log('🔍 [FUNCTIONAL_UPDATE] 함수형 업데이터 감지:', {
            업데이터타입: 'function',
            timestamp: new Date().toLocaleTimeString(),
          });

          const currentMediaFiles = getValues('media') ?? [];
          finalFiles = filesOrUpdater(currentMediaFiles);

          console.log('🔍 [FUNCTIONAL_UPDATE] 함수형 업데이트 실행 완료:', {
            이전파일개수: currentMediaFiles.length,
            새파일개수: finalFiles.length,
            단순화된처리: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          console.log('🔍 [DIRECT_UPDATE] 직접 배열 감지:', {
            배열길이: filesOrUpdater.length,
            timestamp: new Date().toLocaleTimeString(),
          });
          finalFiles = filesOrUpdater;
        }

        console.log('🔧 [SET_MEDIA] 단순화된 파일 처리 시작:', {
          finalFilesCount: finalFiles.length,
          finalFilesPreview: finalFiles.map((url, index) => ({
            index,
            preview: url.slice(0, 30) + '...',
          })),
          simplifiedProcessing: true,
          directZustandUpdate: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        const currentGalleryConfig = galleryStore.getImageViewConfig();

        console.log('🔄 [DIRECT_SYNC] Zustand 직접 동기화 시작:', {
          finalFilesCount: finalFiles.length,
          currentGalleryImagesCount:
            currentGalleryConfig.selectedImages?.length ?? 0,
          simplifiedSyncEnabled: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        const updatedConfig = {
          ...currentGalleryConfig,
          selectedImages: finalFiles,
        };

        galleryStore.setImageViewConfig(updatedConfig);

        console.log('✅ [DIRECT_SYNC] Zustand 직접 동기화 완료:', {
          syncedImagesCount: finalFiles.length,
          simplifiedProcessingCompleted: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        const isInitializationMethodAvailable =
          typeof galleryStore.setIsInitialized === 'function';
        if (isInitializationMethodAvailable) {
          galleryStore.setIsInitialized(true);
          console.log('🔍 [STORE_DEBUG] 갤러리 스토어 초기화 상태 설정 완료');
        }

        setValue('media', finalFiles, { shouldDirty: true });

        console.log('✅ [SIMPLIFIED_SYNC] 단순화된 동기화 완료:', {
          finalFilesCount: finalFiles.length,
          reactHookFormUpdated: true,
          zustandUpdated: true,
          noComplexCallbacks: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setTimeout(() => {
          const updatedImages =
            galleryStore.getImageViewConfig().selectedImages ?? [];
          const updatedFormMedia = getValues('media') ?? [];
          console.log('🔍 [STORE_DEBUG] 단순화된 동기화 후 상태:', {
            저장후갤러리개수: updatedImages.length,
            저장후폼개수: updatedFormMedia.length,
            저장된이미지프리뷰: updatedImages.map(
              (url, i) => `${i + 1}: ${url.slice(0, 30)}...`
            ),
            저장된폼이미지프리뷰: updatedFormMedia.map(
              (url, i) => `${i + 1}: ${url.slice(0, 30)}...`
            ),
            동기화상태:
              updatedImages.length === updatedFormMedia.length
                ? '✅ 동기화됨'
                : '❌ 동기화 안됨',
            simplifiedSyncWorking: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        }, 100);
      } catch (syncError) {
        console.error('❌ [SIMPLIFIED_SYNC] 단순화된 동기화 실패:', {
          error: syncError,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [galleryStore, getValues, setValue]
  );

  const setMainImageValue = useCallback(
    (imageUrl: string) => {
      console.log('🔧 [SET_MAIN_IMAGE] setMainImageValue 호출:', {
        imageUrlPreview: imageUrl ? imageUrl.slice(0, 30) + '...' : 'none',
        timestamp: new Date().toLocaleTimeString(),
      });

      setValue('mainImage', imageUrl, { shouldDirty: true });
    },
    [setValue]
  );

  const setSelectedFileNames = useCallback(
    (namesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      console.log('🔧 [SET_NAMES_DEBUG] 단순화된 setSelectedFileNames 호출:', {
        입력타입:
          typeof namesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
        현재파일명개수: selectionState.selectedFileNames.length,
        simplifiedProcessing: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        let finalNames: string[];

        const isUpdaterFunction = typeof namesOrUpdater === 'function';

        if (isUpdaterFunction) {
          console.log('🔍 [FUNCTIONAL_UPDATE] 파일명 함수형 업데이터 감지:', {
            업데이터타입: 'function',
            이전파일명개수: selectionState.selectedFileNames.length,
            timestamp: new Date().toLocaleTimeString(),
          });

          finalNames = namesOrUpdater(selectionState.selectedFileNames);

          console.log('🔍 [FUNCTIONAL_UPDATE] 파일명 함수형 업데이트 완료:', {
            이전파일명개수: selectionState.selectedFileNames.length,
            새파일명개수: finalNames.length,
            simplifiedProcessing: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          console.log('🔍 [DIRECT_UPDATE] 파일명 직접 배열 감지:', {
            배열길이: namesOrUpdater.length,
            timestamp: new Date().toLocaleTimeString(),
          });
          finalNames = namesOrUpdater;
        }

        console.log('🔧 [SET_NAMES] 단순화된 파일명 처리:', {
          finalNamesCount: finalNames.length,
          finalNamesPreview: finalNames.slice(0, 3),
          simplifiedProcessingEnabled: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setSelectionState((previousState) => ({
          ...previousState,
          selectedFileNames: finalNames,
        }));

        console.log('✅ [SET_NAMES] 파일명 업데이트 완료:', {
          updatedNamesCount: finalNames.length,
          simplifiedProcessingCompleted: true,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (updateError) {
        console.error('❌ [SET_NAMES] 파일명 업데이트 실패:', {
          error: updateError,
          timestamp: new Date().toLocaleTimeString(),
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
    const currentGalleryImages =
      galleryStore.getImageViewConfig().selectedImages ?? [];
    const currentFormMedia = getValues('media') ?? [];

    console.log('🔧 [FORCE_SYNC] 단순화된 강제 동기화 실행:', {
      galleryCount: currentGalleryImages.length,
      formCount: currentFormMedia.length,
      simplifiedSyncEnabled: true,
    });

    const shouldSyncFromGalleryToForm =
      currentGalleryImages.length > currentFormMedia.length;
    const shouldSyncFromFormToGallery =
      currentFormMedia.length > currentGalleryImages.length;

    if (shouldSyncFromGalleryToForm) {
      console.log('🔄 [FORCE_SYNC] 갤러리 → 폼 동기화');
      setValue('media', currentGalleryImages, { shouldDirty: true });
    } else if (shouldSyncFromFormToGallery) {
      console.log('🔄 [FORCE_SYNC] 폼 → 갤러리 동기화');
      const updatedConfig = {
        ...galleryStore.getImageViewConfig(),
        selectedImages: currentFormMedia,
      };
      galleryStore.setImageViewConfig(updatedConfig);
    } else {
      console.log('ℹ️ [FORCE_SYNC] 이미 동기화된 상태');
    }
  }, [getValues, galleryStore, setValue]);

  console.log('✅ [BLOG_MEDIA_STATE] 단순화된 상태 관리 반환 준비:', {
    formValuesKeys: Object.keys(formValues),
    currentMediaFilesCount: currentMediaFiles.length,
    uiStateMobile: uiState.isMobile,
    selectionStateFileNames: selectionState.selectedFileNames.length,
    toastsCount: toasts.length,
    syncInitialized,
    hasGalleryStore: galleryStore !== null && galleryStore !== undefined,
    simplifiedSyncEnabled: true,
    noComplexCallbacks: true,
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

    forceSync,
  };
};
