// 📁 blogMediaStep/hooks/useBlogMediaStepState.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHybridImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type {
  FormValues,
  ToastItem,
} from '../../../../../../store/shared/commonTypes';

interface UIState {
  isMobile: boolean;
}

interface SelectionState {
  selectedFileNames: string[];
}

export const useBlogMediaStepState = () => {
  const { watch, setValue, getValues, trigger } = useFormContext<FormValues>();
  const galleryStore = useHybridImageGalleryStore();

  const [syncInitialized, setSyncInitialized] = useState(false);
  const lastSyncedMediaRef = useRef<string[]>([]);
  const syncCallbackRef = useRef<((images: string[]) => void) | null>(null);

  const formValues = watch();
  const { media: currentMediaFiles = [] } = formValues;

  const [uiState, setUIState] = useState<UIState>({
    isMobile: false,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedFileNames: [],
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  console.log(
    '🔧 [BLOG_MEDIA_STATE] useBlogMediaStepState 초기화 - 실제수정버전:',
    {
      currentMediaFilesCount: currentMediaFiles.length,
      syncInitialized,
      galleryStoreInitialized: galleryStore.getIsInitialized(),
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  // 🚨 핵심 추가: watch() 변경사항 감지 디버깅
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
      mediaFieldValue: formValues.media,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [currentMediaFiles, formValues]);

  // 🚨 핵심 추가: getValues로 실제 값 확인
  useEffect(() => {
    const interval = setInterval(() => {
      const realFormValues = getValues();
      const realMediaValue = realFormValues.media ?? [];

      console.log('🔍 [REAL_VALUES] getValues() 실제 값 확인:', {
        watchMediaCount: currentMediaFiles.length,
        realMediaCount: realMediaValue.length,
        isMatching: currentMediaFiles.length === realMediaValue.length,
        watchPreview: currentMediaFiles
          .slice(0, 1)
          .map((url) => url.slice(0, 30) + '...'),
        realPreview: realMediaValue
          .slice(0, 1)
          .map((url) => url.slice(0, 30) + '...'),
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentMediaFiles, getValues]);

  const syncFromGalleryToFormCallback = useCallback(
    (galleryImages: string[]) => {
      try {
        console.log(
          '🔄 [GALLERY_TO_FORM] Zustand → React Hook Form 단방향 동기화:',
          {
            galleryImagesCount: galleryImages.length,
            timestamp: new Date().toLocaleTimeString(),
          }
        );

        const currentFormMedia = getValues('media') ?? [];
        const lastSyncedMedia = lastSyncedMediaRef.current;

        const hasFormChanged =
          galleryImages.length !== currentFormMedia.length ||
          galleryImages.some((url, index) => url !== currentFormMedia[index]);

        const hasLastSyncChanged =
          galleryImages.length !== lastSyncedMedia.length ||
          galleryImages.some((url, index) => url !== lastSyncedMedia[index]);

        if (!hasFormChanged && !hasLastSyncChanged) {
          console.log('ℹ️ [GALLERY_TO_FORM] 동일한 데이터로 동기화 생략');
          return;
        }

        setValue('media', galleryImages, { shouldDirty: true });
        lastSyncedMediaRef.current = [...galleryImages];

        console.log(
          '✅ [GALLERY_TO_FORM] Zustand → React Hook Form 동기화 완료:',
          {
            syncedImagesCount: galleryImages.length,
            firstImagePreview:
              galleryImages.length > 0
                ? galleryImages[0]?.slice(0, 30) + '...'
                : 'none',
          }
        );
      } catch (syncError) {
        console.error('❌ [GALLERY_TO_FORM] 동기화 실패:', {
          error: syncError,
          galleryImagesCount: galleryImages.length,
        });
      }
    },
    [setValue, getValues]
  );

  useEffect(() => {
    syncCallbackRef.current = syncFromGalleryToFormCallback;
  }, [syncFromGalleryToFormCallback]);

  // 🔧 핵심 수정: 의존성 배열 변경으로 무한루프 해결
  useEffect(() => {
    if (syncInitialized) {
      console.log('🧹 [SYNC_CLEANUP] 이미 초기화됨, 중복 방지');
      return;
    }

    console.log(
      '🔧 [SYNC_SETUP] 갤러리 스토어 동기화 콜백 등록 - 한 번만 실행'
    );

    const stableSyncCallback = (images: string[]) => {
      const currentCallback = syncCallbackRef.current;
      if (currentCallback) {
        currentCallback(images);
      }
    };

    galleryStore.setReactHookFormSyncCallback(stableSyncCallback);
    setSyncInitialized(true);

    return () => {
      console.log('🧹 [SYNC_CLEANUP] 갤러리 스토어 동기화 콜백 해제');
      galleryStore.setReactHookFormSyncCallback(null);
    };
  }, []); // 🔧 핵심 수정: [galleryStore] → [] (한 번만 실행)

  useEffect(() => {
    const initializeGallerySync = async () => {
      try {
        console.log('🚀 [GALLERY_INIT] 갤러리 스토어 초기화 시작');

        const isGalleryInitialized = galleryStore.getIsInitialized();

        if (!isGalleryInitialized) {
          await galleryStore.initializeStoredImages();
          console.log('✅ [GALLERY_INIT] 갤러리 스토어 초기화 완료');
        } else {
          console.log('ℹ️ [GALLERY_INIT] 갤러리 스토어 이미 초기화됨');

          const currentGalleryImages =
            galleryStore.getImageViewConfig().selectedImages ?? [];
          const currentFormMedia = getValues('media') ?? [];

          const shouldSyncFromGallery =
            currentGalleryImages.length > 0 && currentFormMedia.length === 0;

          if (shouldSyncFromGallery) {
            console.log('🔄 [GALLERY_INIT] 초기 동기화 필요');
            const callback = syncCallbackRef.current;
            if (callback) {
              callback(currentGalleryImages);
            }
          }
        }
      } catch (initError) {
        console.error('❌ [GALLERY_INIT] 갤러리 스토어 초기화 실패:', {
          error: initError,
        });
      }
    };

    if (syncInitialized) {
      initializeGallerySync();
    }
  }, [syncInitialized, getValues]); // 🔧 galleryStore 의존성 제거

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const shouldHandlePageShow = event.persisted && syncInitialized;

      if (!shouldHandlePageShow) {
        return;
      }

      console.log('🔄 [PAGE_SHOW] 브라우저 뒤로가기 감지, 동기화 재시도');

      const timeoutId = setTimeout(() => {
        const currentGalleryImages =
          galleryStore.getImageViewConfig().selectedImages ?? [];
        const currentFormMedia = getValues('media') ?? [];

        const shouldRestoreFromGallery =
          currentGalleryImages.length > 0 && currentFormMedia.length === 0;

        if (shouldRestoreFromGallery) {
          const callback = syncCallbackRef.current;
          if (callback) {
            callback(currentGalleryImages);
          }
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [syncInitialized, getValues]); // 🔧 galleryStore 의존성 제거

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

  // 🔥 핵심 수정: React Hook Form 우회하고 Zustand 직접 업데이트
  const setMediaValue = useCallback(
    (files: string[]) => {
      console.log('🔧 [SET_MEDIA] setMediaValue 호출 시작 - 직접동기화:', {
        filesCount: files.length,
        filesPreview: files.map((url, index) => ({
          index,
          preview: url.slice(0, 30) + '...',
        })),
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        // 🚨 핵심 수정: React Hook Form 건드리지 않고 Zustand만 업데이트
        const currentGalleryConfig = galleryStore.getImageViewConfig();

        console.log('🔄 [DIRECT_SYNC] Zustand 직접 동기화 시작:', {
          filesCount: files.length,
          currentGalleryImagesCount:
            currentGalleryConfig.selectedImages?.length ?? 0,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Zustand 스토어 직접 업데이트
        galleryStore.setImageViewConfig({
          ...currentGalleryConfig,
          selectedImages: files,
        });

        console.log('✅ [DIRECT_SYNC] Zustand 직접 동기화 완료:', {
          syncedImagesCount: files.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 초기화 상태 설정
        if (typeof galleryStore.setIsInitialized === 'function') {
          galleryStore.setIsInitialized(true);
        }

        // 🔧 추가: 콜백 트리거로 React Hook Form 동기화
        setTimeout(() => {
          console.log('🔄 [CALLBACK_TRIGGER] 콜백 트리거로 Form 동기화 시도');
          const callback = syncCallbackRef.current;
          if (callback) {
            callback(files);
          }
        }, 100);
      } catch (syncError) {
        console.error('❌ [DIRECT_SYNC] 동기화 실패:', {
          error: syncError,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [galleryStore, syncCallbackRef]
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

  const setSelectedFileNames = useCallback((names: string[]) => {
    console.log('🔧 [SET_NAMES] setSelectedFileNames 호출:', {
      namesCount: names.length,
      namesPreview: names.slice(0, 3),
      timestamp: new Date().toLocaleTimeString(),
    });

    setSelectionState((previousState) => ({
      ...previousState,
      selectedFileNames: names,
    }));
  }, []);

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

    console.log('🔧 [FORCE_SYNC] 강제 동기화 실행:', {
      galleryCount: currentGalleryImages.length,
      formCount: currentFormMedia.length,
    });

    const callback = syncCallbackRef.current;
    if (callback) {
      callback(currentGalleryImages);
    }
  }, [getValues, galleryStore]);

  console.log(
    '✅ [BLOG_MEDIA_STATE] useBlogMediaStepState 반환 준비 - 실제수정버전:',
    {
      formValuesKeys: Object.keys(formValues),
      currentMediaFilesCount: currentMediaFiles.length,
      uiStateMobile: uiState.isMobile,
      selectionStateFileNames: selectionState.selectedFileNames.length,
      toastsCount: toasts.length,
      syncInitialized,
      hasGalleryStore: galleryStore !== null && galleryStore !== undefined,
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

    syncFromGalleryToForm: syncFromGalleryToFormCallback,
    forceSync,
  };
};
