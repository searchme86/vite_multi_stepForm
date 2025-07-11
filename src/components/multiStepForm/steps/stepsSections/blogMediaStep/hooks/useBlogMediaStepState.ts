// 📁 blogMediaStep/hooks/useBlogMediaStepState.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useHybridImageGalleryStore } from '../../../../../../store/imageGallery/imageGalleryStore';
import type {
  FormValues,
  ToastItem,
} from '../../../../../../store/shared/commonTypes';

// 🔧 핵심 추가: 함수형 상태 업데이트를 지원하는 타입 정의
type StateUpdaterFunction<T> = (previousValue: T) => T;

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
    '🔧 [BLOG_MEDIA_STATE] useBlogMediaStepState 초기화 - 함수형업데이트지원:',
    {
      currentMediaFilesCount: currentMediaFiles.length,
      syncInitialized,
      galleryStoreInitialized: galleryStore.getIsInitialized(),
      functionalUpdateSupported: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

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
      functionalUpdateEnabled: true,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [currentMediaFiles, formValues]);

  useEffect(() => {
    const interval = setInterval(() => {
      const galleryImages =
        galleryStore.getImageViewConfig().selectedImages ?? [];
      const formMediaImages = getValues('media') ?? [];

      console.log('🔍 [DEBUG] 이미지 상태 비교:', {
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
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [galleryStore, getValues]);

  const syncFromGalleryToFormCallback = useCallback(
    (galleryImages: string[]) => {
      try {
        console.log(
          '🔄 [GALLERY_TO_FORM] Zustand → React Hook Form 단방향 동기화:',
          {
            galleryImagesCount: galleryImages.length,
            functionalUpdateSupported: true,
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
            functionalUpdateApplied: true,
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
  }, []);

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
  }, [syncInitialized, getValues]);

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
  }, [syncInitialized, getValues]);

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

  // 🔥 핵심 수정: 함수형 상태 업데이트를 지원하는 setMediaValue
  const setMediaValue = useCallback(
    (filesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      console.log(
        '🔍 [SET_MEDIA_DEBUG] setMediaValue 호출 - 함수형업데이트지원:',
        {
          입력타입:
            typeof filesOrUpdater === 'function'
              ? '함수형업데이터'
              : '직접배열',
          현재갤러리개수:
            galleryStore.getImageViewConfig().selectedImages?.length ?? 0,
          현재폼개수: getValues('media')?.length ?? 0,
          함수형업데이트지원: true,
          타입에러해결예정: true,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      try {
        let finalFiles: string[];

        // 🔧 타입 안전한 함수형 업데이트 처리
        const isUpdaterFunction = typeof filesOrUpdater === 'function';

        if (isUpdaterFunction) {
          console.log(
            '🔍 [FUNCTIONAL_UPDATE] 함수형 업데이터 감지, 현재 상태로 실행:',
            {
              업데이터타입: 'function',
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          const currentMediaFiles = getValues('media') ?? [];
          finalFiles = filesOrUpdater(currentMediaFiles);

          console.log('🔍 [FUNCTIONAL_UPDATE] 함수형 업데이트 실행 완료:', {
            이전파일개수: currentMediaFiles.length,
            새파일개수: finalFiles.length,
            타입에러해결됨: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          console.log('🔍 [DIRECT_UPDATE] 직접 배열 감지:', {
            배열길이: filesOrUpdater.length,
            timestamp: new Date().toLocaleTimeString(),
          });
          finalFiles = filesOrUpdater;
        }

        console.log('🔧 [SET_MEDIA] 최종 파일 처리 시작:', {
          finalFilesCount: finalFiles.length,
          finalFilesPreview: finalFiles.map((url, index) => ({
            index,
            preview: url.slice(0, 30) + '...',
          })),
          functionalUpdateResolved: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Zustand 스토어 직접 업데이트
        const currentGalleryConfig = galleryStore.getImageViewConfig();

        console.log('🔄 [DIRECT_SYNC] Zustand 직접 동기화 시작:', {
          finalFilesCount: finalFiles.length,
          currentGalleryImagesCount:
            currentGalleryConfig.selectedImages?.length ?? 0,
          typeErrorFixed: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        const updatedConfig = {
          ...currentGalleryConfig,
          selectedImages: finalFiles,
        };

        galleryStore.setImageViewConfig(updatedConfig);

        console.log('✅ [DIRECT_SYNC] Zustand 직접 동기화 완료:', {
          syncedImagesCount: finalFiles.length,
          functionalUpdateApplied: true,
          typeErrorResolved: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 초기화 상태 설정
        const isInitializationMethodAvailable =
          typeof galleryStore.setIsInitialized === 'function';
        if (isInitializationMethodAvailable) {
          galleryStore.setIsInitialized(true);
          console.log('🔍 [STORE_DEBUG] 갤러리 스토어 초기화 상태 설정 완료');
        }

        // 콜백 트리거로 React Hook Form 동기화
        setTimeout(() => {
          console.log('🔄 [CALLBACK_TRIGGER] 콜백 트리거로 Form 동기화 시도');
          const callback = syncCallbackRef.current;
          const isCallbackAvailable =
            callback !== null && callback !== undefined;

          if (isCallbackAvailable) {
            console.log('🔍 [STORE_DEBUG] 콜백 함수 실행:', {
              콜백함수존재여부: true,
              전달할이미지개수: finalFiles.length,
              functionalUpdateComplete: true,
              timestamp: new Date().toLocaleTimeString(),
            });
            callback(finalFiles);
          } else {
            console.log('🔍 [STORE_DEBUG] 콜백 함수가 존재하지 않음');
          }
        }, 100);

        // 저장 후 갤러리 상태 확인
        setTimeout(() => {
          const updatedImages =
            galleryStore.getImageViewConfig().selectedImages ?? [];
          const updatedFormMedia = getValues('media') ?? [];
          console.log('🔍 [STORE_DEBUG] 저장 후 갤러리 상태:', {
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
            functionalUpdateWorking: true,
            typeErrorFixed: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        }, 500);
      } catch (syncError) {
        console.error('❌ [DIRECT_SYNC] 동기화 실패:', {
          error: syncError,
          functionalUpdateFailed: true,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [galleryStore, syncCallbackRef, getValues]
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

  // 🔥 핵심 수정: 함수형 상태 업데이트를 지원하는 setSelectedFileNames
  const setSelectedFileNames = useCallback(
    (namesOrUpdater: string[] | StateUpdaterFunction<string[]>) => {
      console.log(
        '🔧 [SET_NAMES_DEBUG] setSelectedFileNames 호출 - 함수형업데이트지원:',
        {
          입력타입:
            typeof namesOrUpdater === 'function'
              ? '함수형업데이터'
              : '직접배열',
          현재파일명개수: selectionState.selectedFileNames.length,
          함수형업데이트지원: true,
          타입에러해결예정: true,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      try {
        let finalNames: string[];

        // 🔧 타입 안전한 함수형 업데이트 처리
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
            타입에러해결됨: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        } else {
          console.log('🔍 [DIRECT_UPDATE] 파일명 직접 배열 감지:', {
            배열길이: namesOrUpdater.length,
            timestamp: new Date().toLocaleTimeString(),
          });
          finalNames = namesOrUpdater;
        }

        console.log('🔧 [SET_NAMES] 최종 파일명 처리:', {
          finalNamesCount: finalNames.length,
          finalNamesPreview: finalNames.slice(0, 3),
          functionalUpdateResolved: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setSelectionState((previousState) => ({
          ...previousState,
          selectedFileNames: finalNames,
        }));

        console.log('✅ [SET_NAMES] 파일명 업데이트 완료:', {
          updatedNamesCount: finalNames.length,
          functionalUpdateApplied: true,
          typeErrorResolved: true,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (updateError) {
        console.error('❌ [SET_NAMES] 파일명 업데이트 실패:', {
          error: updateError,
          functionalUpdateFailed: true,
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

    console.log('🔧 [FORCE_SYNC] 강제 동기화 실행:', {
      galleryCount: currentGalleryImages.length,
      formCount: currentFormMedia.length,
      functionalUpdateEnabled: true,
    });

    const callback = syncCallbackRef.current;
    const isCallbackAvailable = callback !== null && callback !== undefined;
    if (isCallbackAvailable) {
      callback(currentGalleryImages);
    }
  }, [getValues, galleryStore]);

  console.log(
    '✅ [BLOG_MEDIA_STATE] useBlogMediaStepState 반환 준비 - 함수형업데이트지원:',
    {
      formValuesKeys: Object.keys(formValues),
      currentMediaFilesCount: currentMediaFiles.length,
      uiStateMobile: uiState.isMobile,
      selectionStateFileNames: selectionState.selectedFileNames.length,
      toastsCount: toasts.length,
      syncInitialized,
      hasGalleryStore: galleryStore !== null && galleryStore !== undefined,
      functionalUpdateSupported: true,
      typeErrorResolved: true,
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
