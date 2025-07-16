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

interface StateUpdateOperation {
  readonly id: string;
  readonly type:
    | 'FORM_TO_STORE'
    | 'STORE_TO_FORM'
    | 'INITIALIZATION'
    | 'FORCE_SYNC'
    | 'MAIN_IMAGE_SYNC'
    | 'INTEGRITY_CHECK'
    | 'PLACEHOLDER_CLEANUP';
  readonly payload: {
    readonly mediaFiles?: string[];
    readonly mainImage?: string | null;
    readonly sliderImages?: string[];
    readonly selectedFileNames?: string[];
    readonly force?: boolean;
    readonly cleanupPlaceholders?: boolean;
  };
  readonly timestamp: number;
}

interface MediaIntegrityResult {
  readonly isValid: boolean;
  readonly mediaCount: number;
  readonly fileNamesCount: number;
  readonly hasPlaceholders: boolean;
  readonly cleanedMediaCount: number;
  readonly needsCleanup: boolean;
  readonly shouldAutoClean: boolean;
}

interface MediaRestoreResult {
  readonly cleanedMedia: string[];
  readonly cleanedFileNames: string[];
  readonly removedPlaceholders: number;
  readonly isRestored: boolean;
}

const isPlaceholderUrl = (url: string): boolean => {
  const isString = typeof url === 'string';
  if (!isString) {
    console.log('🔍 [PLACEHOLDER_CHECK] 비문자열 타입 감지:', {
      url,
      type: typeof url,
    });
    return false;
  }

  const hasPlaceholderPrefix = url.startsWith('placeholder-');
  const hasProcessingSuffix = url.includes('-processing');
  const isPlaceholder = hasPlaceholderPrefix && hasProcessingSuffix;

  console.log('🔍 [PLACEHOLDER_CHECK] 플레이스홀더 검증:', {
    url: url.slice(0, 30) + '...',
    hasPlaceholderPrefix,
    hasProcessingSuffix,
    isPlaceholder,
  });

  return isPlaceholder;
};

const safeIsPlaceholderUrl = (url: string | null): boolean => {
  if (url === null) {
    console.log('🔍 [SAFE_PLACEHOLDER_CHECK] null 값 처리');
    return false;
  }

  const isStringType = typeof url === 'string';
  if (!isStringType) {
    console.log('🔍 [SAFE_PLACEHOLDER_CHECK] 비문자열 타입:', {
      url,
      type: typeof url,
    });
    return false;
  }

  const hasLength = url.length > 0;
  if (!hasLength) {
    console.log('🔍 [SAFE_PLACEHOLDER_CHECK] 빈 문자열 처리');
    return false;
  }

  return isPlaceholderUrl(url);
};

const cleanupPlaceholderUrls = (mediaFiles: string[]): string[] => {
  const isValidArray = Array.isArray(mediaFiles);
  if (!isValidArray) {
    console.log('🧹 [CLEANUP_PLACEHOLDERS] 유효하지 않은 배열:', {
      mediaFiles,
      type: typeof mediaFiles,
    });
    return [];
  }

  const cleanedUrls = mediaFiles.filter((url) => {
    const isValidUrl = typeof url === 'string' && url.length > 0;
    if (!isValidUrl) {
      console.log('🧹 [CLEANUP_PLACEHOLDERS] 유효하지 않은 URL:', {
        url,
        type: typeof url,
      });
      return false;
    }

    const isNotPlaceholder = !isPlaceholderUrl(url);
    if (!isNotPlaceholder) {
      console.log('🧹 [CLEANUP_PLACEHOLDERS] 플레이스홀더 URL 제거:', {
        url: url.slice(0, 30) + '...',
      });
    }

    return isValidUrl && isNotPlaceholder;
  });

  console.log('🧹 [CLEANUP_PLACEHOLDERS] 플레이스홀더 URL 정리 완료:', {
    originalCount: mediaFiles.length,
    cleanedCount: cleanedUrls.length,
    removedCount: mediaFiles.length - cleanedUrls.length,
  });

  return cleanedUrls;
};

const validateMediaIntegrity = (
  mediaFiles: string[],
  selectedFileNames: string[]
): MediaIntegrityResult => {
  console.log('🔍 [INTEGRITY_CHECK] 무결성 검증 시작:', {
    mediaFilesCount: mediaFiles.length,
    selectedFileNamesCount: selectedFileNames.length,
  });

  const cleanedMedia = cleanupPlaceholderUrls(mediaFiles);
  const isLengthMatching = cleanedMedia.length === selectedFileNames.length;
  const hasNoPlaceholders = !mediaFiles.some((url) => {
    const urlString = url ?? '';
    return isPlaceholderUrl(urlString);
  });
  const needsCleanup = mediaFiles.length !== cleanedMedia.length;

  const shouldAutoClean =
    (cleanedMedia.length === 0 && selectedFileNames.length > 0) ||
    !hasNoPlaceholders ||
    Math.abs(cleanedMedia.length - selectedFileNames.length) >= 3;

  const result: MediaIntegrityResult = {
    isValid: isLengthMatching && hasNoPlaceholders,
    mediaCount: mediaFiles.length,
    fileNamesCount: selectedFileNames.length,
    hasPlaceholders: !hasNoPlaceholders,
    cleanedMediaCount: cleanedMedia.length,
    needsCleanup,
    shouldAutoClean,
  };

  console.log('🔍 [INTEGRITY_CHECK] 무결성 검증 완료:', {
    isValid: result.isValid,
    mediaCount: result.mediaCount,
    fileNamesCount: result.fileNamesCount,
    hasPlaceholders: result.hasPlaceholders,
    cleanedMediaCount: result.cleanedMediaCount,
    needsCleanup: result.needsCleanup,
    shouldAutoClean: result.shouldAutoClean,
    autoCleanReasons: {
      emptyMediaWithFileNames:
        cleanedMedia.length === 0 && selectedFileNames.length > 0,
      hasPlaceholders: !hasNoPlaceholders,
      severeLengthMismatch:
        Math.abs(cleanedMedia.length - selectedFileNames.length) >= 3,
    },
  });

  return result;
};

const restoreMediaWithCleanup = (
  restoredMedia: string[],
  restoredFileNames: string[]
): MediaRestoreResult => {
  console.log('🔄 [RESTORE_CLEANUP] 복원 및 정리 시작:', {
    restoredMediaCount: restoredMedia.length,
    restoredFileNamesCount: restoredFileNames.length,
  });

  const cleanedMedia: string[] = [];
  const cleanedFileNames: string[] = [];
  let removedPlaceholders = 0;

  restoredMedia.forEach((url, index) => {
    const isValidUrl = typeof url === 'string' && url.length > 0;
    if (!isValidUrl) {
      console.log('🔄 [RESTORE_CLEANUP] 유효하지 않은 URL 건너뜀:', {
        url,
        index,
        type: typeof url,
      });
      removedPlaceholders += 1;
      return;
    }

    const isNotPlaceholder = !isPlaceholderUrl(url);
    if (!isNotPlaceholder) {
      console.log('🔄 [RESTORE_CLEANUP] 플레이스홀더 URL 제거:', {
        url: url.slice(0, 30) + '...',
        index,
      });
      removedPlaceholders += 1;
      return;
    }

    cleanedMedia.push(url);
    const fileName = restoredFileNames[index];
    const hasFileName = fileName && typeof fileName === 'string';
    if (hasFileName) {
      cleanedFileNames.push(fileName);
    }
  });

  const result: MediaRestoreResult = {
    cleanedMedia,
    cleanedFileNames,
    removedPlaceholders,
    isRestored: cleanedMedia.length > 0,
  };

  console.log('🔄 [RESTORE_CLEANUP] 복원 및 정리 완료:', {
    originalMediaCount: restoredMedia.length,
    originalFileNamesCount: restoredFileNames.length,
    cleanedMediaCount: result.cleanedMedia.length,
    cleanedFileNamesCount: result.cleanedFileNames.length,
    removedPlaceholders: result.removedPlaceholders,
    isRestored: result.isRestored,
  });

  return result;
};

const initializeWithCleanup = (
  initialMediaFiles: string[],
  initialSelectedFileNames: string[]
): MediaRestoreResult => {
  console.log('🧹 [INIT_CLEANUP] 초기화 정리 시작:', {
    initialMediaFilesCount: initialMediaFiles.length,
    initialSelectedFileNamesCount: initialSelectedFileNames.length,
  });

  const hasPlaceholders = initialMediaFiles.some((url) => {
    const urlString = url ?? '';
    return isPlaceholderUrl(urlString);
  });

  if (hasPlaceholders) {
    console.log('🧹 [INIT_CLEANUP] 플레이스홀더 감지, 정리 실행');
    return restoreMediaWithCleanup(initialMediaFiles, initialSelectedFileNames);
  }

  const result: MediaRestoreResult = {
    cleanedMedia: initialMediaFiles,
    cleanedFileNames: initialSelectedFileNames,
    removedPlaceholders: 0,
    isRestored: initialMediaFiles.length > 0,
  };

  console.log(
    '🧹 [INIT_CLEANUP] 초기화 정리 완료 (플레이스홀더 없음):',
    result
  );

  return result;
};

interface ValidatedFormValues {
  media: string[];
  mainImage: string | null;
  sliderImages: string[];
}

const validateFormValues = (
  formValues: unknown
): ValidatedFormValues | null => {
  const isValidObject = formValues && typeof formValues === 'object';
  if (!isValidObject) {
    console.log('🔍 [FORM_VALIDATION] 유효하지 않은 폼 값:', {
      formValues,
      type: typeof formValues,
    });
    return null;
  }

  const media = Reflect.get(formValues, 'media');
  const mainImage = Reflect.get(formValues, 'mainImage');
  const sliderImages = Reflect.get(formValues, 'sliderImages');

  const validatedMedia = Array.isArray(media) ? media : [];
  const validatedMainImage = typeof mainImage === 'string' ? mainImage : null;
  const validatedSliderImages = Array.isArray(sliderImages) ? sliderImages : [];

  const result: ValidatedFormValues = {
    media: validatedMedia,
    mainImage: validatedMainImage,
    sliderImages: validatedSliderImages,
  };

  console.log('🔍 [FORM_VALIDATION] 폼 값 검증 완료:', {
    mediaCount: result.media.length,
    hasMainImage: result.mainImage !== null,
    sliderImagesCount: result.sliderImages.length,
  });

  return result;
};

const extractMainImageBackupSafely = (): string => {
  console.log('💾 [BACKUP_EXTRACT] 메인이미지 백업 추출 시작');

  try {
    const backupDataString = localStorage.getItem('blogMediaMainImageBackup');
    const hasBackupData = backupDataString && backupDataString.length > 0;
    if (!hasBackupData) {
      console.log('💾 [BACKUP_EXTRACT] 백업 데이터 없음');
      return '';
    }

    const backupData = JSON.parse(backupDataString);
    const isValidBackup = backupData && typeof backupData === 'object';
    if (!isValidBackup) {
      console.log('💾 [BACKUP_EXTRACT] 유효하지 않은 백업 데이터:', {
        backupData,
      });
      return '';
    }

    const mainImage = Reflect.get(backupData, 'mainImage');
    const timestamp = Reflect.get(backupData, 'timestamp');

    const hasValidMainImage =
      mainImage !== null &&
      typeof mainImage === 'string' &&
      mainImage.length > 0;
    const hasValidTimestamp = timestamp && typeof timestamp === 'number';

    if (!hasValidMainImage || !hasValidTimestamp) {
      console.log('💾 [BACKUP_EXTRACT] 백업 데이터 필드 유효성 검사 실패:', {
        hasValidMainImage,
        hasValidTimestamp,
      });
      return '';
    }

    const isRecentBackup = Date.now() - timestamp < 5 * 60 * 1000;
    const isNotPlaceholder = !safeIsPlaceholderUrl(mainImage);

    const isValidBackupImage = isRecentBackup && isNotPlaceholder;
    const result = isValidBackupImage ? mainImage : '';

    console.log('💾 [BACKUP_EXTRACT] 백업 추출 완료:', {
      hasBackup: result.length > 0,
      isRecentBackup,
      isNotPlaceholder,
      mainImagePreview: result ? result.slice(0, 30) + '...' : 'none',
    });

    return result;
  } catch (error) {
    console.error('❌ [BACKUP_EXTRACT] 메인이미지 백업 추출 실패:', error);
    return '';
  }
};

export const useBlogMediaStepState = () => {
  const { watch, setValue, getValues } = useFormContext<FormValues>();
  const galleryStore = useHybridImageGalleryStore();

  const [isStateLocked, setIsStateLocked] = useState(false);
  const [syncInitialized, setSyncInitialized] = useState(false);
  const [integrityCheckEnabled, setIntegrityCheckEnabled] = useState(true);

  const isInitializingRef = useRef(false);
  const operationQueueRef = useRef<StateUpdateOperation[]>([]);
  const isProcessingQueueRef = useRef(false);
  const lastIntegrityCheckRef = useRef<number>(0);
  const integrityCheckCountRef = useRef<number>(0);
  const lastAutoCleanTimestampRef = useRef<number>(0);

  const formValues = watch();
  const validatedFormValues = validateFormValues(formValues);

  const {
    media: currentMediaFiles = [],
    mainImage: currentMainImage = null,
    sliderImages: currentSliderImages = [],
  } = validatedFormValues || {};

  const [uiState, setUIState] = useState<UIState>({
    isMobile: false,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedFileNames: [],
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  console.log('🔧 [BLOG_MEDIA_STATE] 상태 정보:', {
    currentMediaFilesCount: currentMediaFiles.length,
    currentMainImagePreview: currentMainImage
      ? currentMainImage.slice(0, 30) + '...'
      : 'none',
    currentSliderImagesCount: currentSliderImages.length,
    selectedFileNamesCount: selectionState.selectedFileNames.length,
    syncInitialized,
    isStateLocked,
    integrityCheckEnabled,
    hasPlaceholders: currentMediaFiles.some((url) => {
      const urlString = url ?? '';
      return isPlaceholderUrl(urlString);
    }),
    integrityCheckCount: integrityCheckCountRef.current,
    timestamp: new Date().toLocaleTimeString(),
  });

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
      hasCleanupFlag: operation.payload.cleanupPlaceholders === true,
    });
  }, []);

  const executeOperation = useCallback(
    async (operation: StateUpdateOperation) => {
      console.log('⚡ [OPERATION_EXECUTE] 작업 실행:', {
        operationType: operation.type,
        operationId: operation.id,
        hasMainImage: operation.payload.mainImage !== undefined,
        hasCleanupFlag: operation.payload.cleanupPlaceholders === true,
        mainImagePreview: operation.payload.mainImage
          ? operation.payload.mainImage.slice(0, 30) + '...'
          : 'none',
      });

      const { type, payload } = operation;

      switch (type) {
        case 'PLACEHOLDER_CLEANUP': {
          const currentFormMedia = getValues('media') ?? [];
          const currentFormFileNames = selectionState.selectedFileNames;

          const { cleanedMedia, cleanedFileNames, removedPlaceholders } =
            initializeWithCleanup(currentFormMedia, currentFormFileNames);

          const needsCleanup = removedPlaceholders > 0;
          if (needsCleanup) {
            setValue('media', cleanedMedia, { shouldDirty: true });
            setSelectionState((prev) => ({
              ...prev,
              selectedFileNames: cleanedFileNames,
            }));

            console.log('✅ [PLACEHOLDER_CLEANUP] 플레이스홀더 정리 완료:', {
              원본미디어: currentFormMedia.length,
              정리된미디어: cleanedMedia.length,
              원본파일명: currentFormFileNames.length,
              정리된파일명: cleanedFileNames.length,
              제거된플레이스홀더: removedPlaceholders,
            });
          }
          break;
        }

        case 'INTEGRITY_CHECK': {
          integrityCheckCountRef.current += 1;
          const currentTime = Date.now();
          const timeSinceLastAutoClean =
            currentTime - lastAutoCleanTimestampRef.current;

          console.log('🔍 [INTEGRITY_CHECK] 무결성 체크 시작:', {
            checkCount: integrityCheckCountRef.current,
            timeSinceLastAutoClean,
            autoCleanCooldown: timeSinceLastAutoClean > 3000,
          });

          if (integrityCheckCountRef.current > 10) {
            console.warn(
              '🚨 [INTEGRITY_CHECK] 체크 횟수 초과, 무결성 검사 일시 중단'
            );
            setIntegrityCheckEnabled(false);

            setTimeout(() => {
              setIntegrityCheckEnabled(true);
              integrityCheckCountRef.current = 0;
              console.log('🔄 [INTEGRITY_CHECK] 무결성 검사 재활성화');
            }, 30000);

            break;
          }

          const currentFormMedia = getValues('media') ?? [];
          const currentFormFileNames = selectionState.selectedFileNames;

          const integrityResult = validateMediaIntegrity(
            currentFormMedia,
            currentFormFileNames
          );

          if (!integrityResult.isValid && integrityResult.shouldAutoClean) {
            if (timeSinceLastAutoClean < 3000) {
              console.log('⏳ [INTEGRITY_CHECK] 자동 정리 쿨다운 중, 건너뜀');
              break;
            }

            console.warn(
              '🚨 [INTEGRITY_CHECK] 심각한 무결성 실패 감지, 자동 정리 실행'
            );

            const { cleanedMedia, cleanedFileNames } = restoreMediaWithCleanup(
              currentFormMedia,
              currentFormFileNames
            );

            setValue('media', cleanedMedia, { shouldDirty: true });
            setSelectionState((prev) => ({
              ...prev,
              selectedFileNames: cleanedFileNames,
            }));

            try {
              localStorage.removeItem('blogMediaSliderPersistenceBackup');
              localStorage.removeItem('blogMediaMainImageBackup');
              localStorage.removeItem('blogMediaStep_media');
              localStorage.removeItem('blogMediaStep_selectedFileNames');
              localStorage.removeItem('blogMediaStep_mainImage');
              console.log('✅ [INTEGRITY_CHECK] localStorage 정리 완료');
            } catch (storageError) {
              console.error(
                '❌ [INTEGRITY_CHECK] localStorage 정리 실패:',
                storageError
              );
            }

            lastAutoCleanTimestampRef.current = currentTime;

            console.log('✅ [INTEGRITY_CHECK] 자동 정리 완료:', {
              정리된미디어: cleanedMedia.length,
              정리된파일명: cleanedFileNames.length,
              영속성데이터정리: true,
              자동정리타임스탬프: lastAutoCleanTimestampRef.current,
            });
          } else if (!integrityResult.isValid) {
            console.log(
              'ℹ️ [INTEGRITY_CHECK] 경미한 무결성 불일치 감지, 자동 정리 건너뜀:',
              {
                mediaCount: integrityResult.mediaCount,
                fileNamesCount: integrityResult.fileNamesCount,
                shouldAutoClean: integrityResult.shouldAutoClean,
              }
            );
          }

          lastIntegrityCheckRef.current = Date.now();
          break;
        }

        case 'FORM_TO_STORE': {
          const {
            mediaFiles = [],
            mainImage,
            sliderImages = [],
            selectedFileNames = [],
          } = payload;

          const cleanedMediaFiles = cleanupPlaceholderUrls(mediaFiles);
          const currentGalleryConfig = galleryStore.getImageViewConfig();

          const updatedConfig = {
            ...currentGalleryConfig,
            selectedImages: cleanedMediaFiles,
            ...(mainImage !== undefined && { mainImage }),
            sliderImages: cleanedMediaFiles.filter((url) =>
              sliderImages.includes(url)
            ),
          };

          galleryStore.setImageViewConfig(updatedConfig);

          console.log('✅ [FORM_TO_STORE] 폼→스토어 동기화:', {
            원본미디어: mediaFiles.length,
            정리된미디어: cleanedMediaFiles.length,
            mainImageUpdated: mainImage !== undefined,
            selectedFileNamesCount: selectedFileNames.length,
          });
          break;
        }

        case 'STORE_TO_FORM': {
          const currentGalleryConfig = galleryStore.getImageViewConfig();
          const {
            selectedImages: currentGalleryImages = [],
            mainImage: storedMainImage = null,
            sliderImages: storedSliderImages = [],
          } = currentGalleryConfig;

          const cleanedGalleryImages =
            cleanupPlaceholderUrls(currentGalleryImages);
          setValue('media', cleanedGalleryImages, { shouldDirty: true });

          let finalMainImage = storedMainImage;
          const backupMainImage = extractMainImageBackupSafely();

          const hasBackupMainImage = backupMainImage.length > 0;
          const hasStoredMainImage =
            storedMainImage && storedMainImage.length > 0;

          if (hasBackupMainImage && !hasStoredMainImage) {
            finalMainImage = backupMainImage;
            console.log(
              '🔄 [STORE_TO_FORM] localStorage 백업 메인이미지 사용:',
              {
                backupMainImage: backupMainImage.slice(0, 30) + '...',
                localStorage백업우선: true,
              }
            );
          }

          const hasValidMainImage = finalMainImage && finalMainImage.length > 0;
          const isMainImageNotPlaceholder =
            hasValidMainImage && !safeIsPlaceholderUrl(finalMainImage);

          if (hasValidMainImage && isMainImageNotPlaceholder) {
            setValue('mainImage', finalMainImage, {
              shouldDirty: true,
              shouldTouch: true,
            });
          } else if (finalMainImage === null) {
            setValue('mainImage', null, {
              shouldDirty: true,
              shouldTouch: true,
            });
          }

          const cleanedSliderImages =
            cleanupPlaceholderUrls(storedSliderImages);
          const hasCleanedSliderImages = cleanedSliderImages.length > 0;
          if (hasCleanedSliderImages) {
            setValue('sliderImages', cleanedSliderImages, {
              shouldDirty: true,
            });
          }

          console.log('✅ [STORE_TO_FORM] 스토어→폼 동기화:', {
            원본갤러리이미지: currentGalleryImages.length,
            정리된갤러리이미지: cleanedGalleryImages.length,
            mainImageRestored: hasValidMainImage && isMainImageNotPlaceholder,
            원본슬라이더이미지: storedSliderImages.length,
            정리된슬라이더이미지: cleanedSliderImages.length,
          });
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

          const { cleanedMedia: cleanedGalleryImages } = initializeWithCleanup(
            currentGalleryImages,
            []
          );

          const shouldRestoreFromGallery =
            cleanedGalleryImages.length > 0 && currentFormMedia.length === 0;

          if (shouldRestoreFromGallery) {
            setValue('media', cleanedGalleryImages, { shouldDirty: true });
          }

          let finalMainImage = storedMainImage;
          const backupMainImage = extractMainImageBackupSafely();

          const hasCurrentFormMainImage =
            currentFormMainImage && currentFormMainImage.length > 0;
          if (!hasCurrentFormMainImage) {
            const hasBackupMainImage = backupMainImage.length > 0;
            const hasStoredMainImage =
              storedMainImage && storedMainImage.length > 0;

            if (hasBackupMainImage) {
              finalMainImage = backupMainImage;
              console.log(
                '🔄 [INITIALIZATION] localStorage 백업을 초기화에 사용:',
                {
                  backupMainImage: backupMainImage.slice(0, 30) + '...',
                  초기화시localStorage백업사용: true,
                }
              );
            } else if (hasStoredMainImage) {
              finalMainImage = storedMainImage;
            }
          }

          const shouldRestoreMainImage =
            finalMainImage &&
            finalMainImage.length > 0 &&
            !safeIsPlaceholderUrl(finalMainImage) &&
            !hasCurrentFormMainImage;

          if (shouldRestoreMainImage && finalMainImage) {
            setValue('mainImage', finalMainImage, {
              shouldDirty: true,
              shouldTouch: true,
            });
          } else if (finalMainImage === null && !hasCurrentFormMainImage) {
            setValue('mainImage', null, {
              shouldDirty: true,
              shouldTouch: true,
            });
          }

          const { cleanedMedia: cleanedSliderImages } = initializeWithCleanup(
            storedSliderImages,
            []
          );

          const shouldRestoreSliderImages =
            cleanedSliderImages.length > 0 &&
            !getValues('sliderImages')?.length;

          if (shouldRestoreSliderImages) {
            setValue('sliderImages', cleanedSliderImages, {
              shouldDirty: true,
            });
          }

          setSyncInitialized(true);

          console.log('✅ [INITIALIZATION] 초기화 완료:', {
            원본갤러리이미지: currentGalleryImages.length,
            정리된갤러리이미지: cleanedGalleryImages.length,
            mediaRestored: shouldRestoreFromGallery,
            mainImageRestored: shouldRestoreMainImage,
            원본슬라이더이미지: storedSliderImages.length,
            정리된슬라이더이미지: cleanedSliderImages.length,
          });
          break;
        }

        case 'MAIN_IMAGE_SYNC': {
          const { mainImage } = payload;
          const isValidMainImage = mainImage && typeof mainImage === 'string';
          const isNotPlaceholder =
            isValidMainImage && !safeIsPlaceholderUrl(mainImage);

          const finalMainImage =
            isValidMainImage && isNotPlaceholder ? mainImage : null;

          const currentGalleryConfig = galleryStore.getImageViewConfig();
          const updatedConfig = {
            ...currentGalleryConfig,
            mainImage: finalMainImage,
          };

          galleryStore.setImageViewConfig(updatedConfig);

          console.log('✅ [MAIN_IMAGE_SYNC] 메인이미지 동기화:', {
            mainImageValue: finalMainImage || 'null',
            isPlaceholderFiltered: isValidMainImage && !isNotPlaceholder,
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

          const { cleanedMedia: cleanedGalleryImages } = initializeWithCleanup(
            galleryImages,
            []
          );
          const { cleanedMedia: cleanedFormMedia } = initializeWithCleanup(
            currentFormMedia,
            []
          );

          const shouldSyncFromGalleryToForm =
            cleanedGalleryImages.length > cleanedFormMedia.length;
          const shouldSyncFromFormToGallery =
            cleanedFormMedia.length > cleanedGalleryImages.length;

          const shouldSyncMainImageFromGallery =
            galleryMainImage &&
            !safeIsPlaceholderUrl(galleryMainImage) &&
            !currentFormMainImage;

          if (shouldSyncFromGalleryToForm) {
            setValue('media', cleanedGalleryImages, { shouldDirty: true });

            if (shouldSyncMainImageFromGallery) {
              setValue('mainImage', galleryMainImage, { shouldDirty: true });
            } else if (galleryMainImage === null) {
              setValue('mainImage', null, { shouldDirty: true });
            }
          } else if (shouldSyncFromFormToGallery) {
            const finalMainImage =
              currentFormMainImage &&
              !safeIsPlaceholderUrl(currentFormMainImage)
                ? currentFormMainImage
                : null;

            const { cleanedMedia: cleanedSliderImages } = initializeWithCleanup(
              currentFormSliderImages,
              []
            );

            const updatedConfig = {
              ...galleryStore.getImageViewConfig(),
              selectedImages: cleanedFormMedia,
              mainImage: finalMainImage,
              sliderImages: cleanedSliderImages,
            };
            galleryStore.setImageViewConfig(updatedConfig);
          }

          console.log('✅ [FORCE_SYNC] 강제 동기화:', {
            원본갤러리: galleryImages.length,
            정리된갤러리: cleanedGalleryImages.length,
            원본폼미디어: currentFormMedia.length,
            정리된폼미디어: cleanedFormMedia.length,
            syncDirection: shouldSyncFromGalleryToForm
              ? 'gallery→form'
              : shouldSyncFromFormToGallery
              ? 'form→gallery'
              : 'none',
            mainImageSynced: shouldSyncMainImageFromGallery,
          });
          break;
        }
      }
    },
    [
      galleryStore,
      setValue,
      getValues,
      selectionState.selectedFileNames,
      addToOperationQueue,
      setIntegrityCheckEnabled,
    ]
  );

  const processOperationQueue = useCallback(async () => {
    const isAlreadyProcessing = isProcessingQueueRef.current;
    if (isAlreadyProcessing) {
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
        const hasOperation = operation !== undefined;
        if (!hasOperation) {
          continue;
        }

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
  }, [acquireLock, releaseLock, executeOperation]);

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
        payload: { cleanupPlaceholders: true },
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

  useEffect(() => {
    const mainImageChangeTimeoutId = setTimeout(() => {
      const isNotInitialized = !syncInitialized;
      const isLocked = isStateLocked;
      if (isNotInitialized || isLocked) {
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
          payload: {
            mainImage:
              currentMainImage && typeof currentMainImage === 'string'
                ? currentMainImage
                : null,
          },
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
    const integrityCheckTimeoutId = setTimeout(() => {
      const isNotInitialized = !syncInitialized;
      const isLocked = isStateLocked;
      const isIntegrityCheckDisabled = !integrityCheckEnabled;

      if (isNotInitialized || isLocked || isIntegrityCheckDisabled) {
        return;
      }

      const timeSinceLastCheck = Date.now() - lastIntegrityCheckRef.current;
      const shouldPerformIntegrityCheck = timeSinceLastCheck > 10000;

      const hasSerialMismatch =
        Math.abs(
          currentMediaFiles.length - selectionState.selectedFileNames.length
        ) >= 3;
      const hasPlaceholders = currentMediaFiles.some((url) => {
        const urlString = url ?? '';
        return isPlaceholderUrl(urlString);
      });

      if (
        shouldPerformIntegrityCheck &&
        (hasSerialMismatch || hasPlaceholders)
      ) {
        console.log('🔍 [INTEGRITY_CHECK_CONDITION] 조건부 무결성 체크 실행:', {
          hasSerialMismatch,
          hasPlaceholders,
          mediaCount: currentMediaFiles.length,
          fileNamesCount: selectionState.selectedFileNames.length,
          checkCount: integrityCheckCountRef.current,
        });

        const integrityCheckOperation: StateUpdateOperation = {
          id: `integrity_${Date.now()}`,
          type: 'INTEGRITY_CHECK',
          payload: {},
          timestamp: Date.now(),
        };

        addToOperationQueue(integrityCheckOperation);
      } else if (shouldPerformIntegrityCheck) {
        console.log(
          'ℹ️ [INTEGRITY_CHECK_SKIP] 경미한 불일치, 무결성 체크 건너뜀:',
          {
            mediaCount: currentMediaFiles.length,
            fileNamesCount: selectionState.selectedFileNames.length,
            차이: Math.abs(
              currentMediaFiles.length - selectionState.selectedFileNames.length
            ),
          }
        );
      }
    }, 1000);

    return () => clearTimeout(integrityCheckTimeoutId);
  }, [
    currentMediaFiles,
    selectionState.selectedFileNames,
    syncInitialized,
    isStateLocked,
    integrityCheckEnabled,
    addToOperationQueue,
  ]);

  useEffect(() => {
    const placeholderCheckTimeoutId = setTimeout(() => {
      const isNotInitialized = !syncInitialized;
      const isLocked = isStateLocked;

      if (isNotInitialized || isLocked) {
        return;
      }

      const hasPlaceholders = currentMediaFiles.some((url) => {
        const urlString = url ?? '';
        return isPlaceholderUrl(urlString);
      });

      if (hasPlaceholders) {
        console.log('🧹 [PLACEHOLDER_WATCH] 플레이스홀더 감지, 정리 작업 예약');

        const placeholderCleanupOperation: StateUpdateOperation = {
          id: `placeholder_cleanup_${Date.now()}`,
          type: 'PLACEHOLDER_CLEANUP',
          payload: { cleanupPlaceholders: true },
          timestamp: Date.now(),
        };

        addToOperationQueue(placeholderCleanupOperation);
      }
    }, 500);

    return () => clearTimeout(placeholderCheckTimeoutId);
  }, [currentMediaFiles, syncInitialized, isStateLocked, addToOperationQueue]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      const shouldHandlePageShow =
        event.persisted && syncInitialized && !isStateLocked;
      if (!shouldHandlePageShow) {
        return;
      }

      console.log('🔄 [PAGE_SHOW] 브라우저 뒤로가기 감지 - 복원');

      const restoreOperation: StateUpdateOperation = {
        id: `restore_${Date.now()}`,
        type: 'STORE_TO_FORM',
        payload: { cleanupPlaceholders: true },
        timestamp: Date.now(),
      };

      addToOperationQueue(restoreOperation);
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [syncInitialized, isStateLocked, addToOperationQueue]);

  useEffect(() => {
    const checkMobileDevice = () => {
      const { userAgent } = navigator;
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

      console.log('📱 [MOBILE_CHECK] 모바일 디바이스 체크:', {
        isMobileUserAgent,
        isTouchDevice,
        hasSmallScreen,
        isMobileDevice,
      });
    };

    checkMobileDevice();
    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);

  const setMediaValue = useCallback(
    (filesOrUpdater: string[] | ((prev: string[]) => string[])) => {
      console.log('🔍 [SET_MEDIA] setMediaValue 시작:', {
        입력타입:
          typeof filesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
        isStateLocked,
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

        const cleanedFiles = cleanupPlaceholderUrls(finalFiles);
        setValue('media', cleanedFiles, { shouldDirty: true });

        const currentMainImage = getValues('mainImage');
        const isMainImageValid =
          currentMainImage &&
          typeof currentMainImage === 'string' &&
          cleanedFiles.includes(currentMainImage) &&
          !safeIsPlaceholderUrl(currentMainImage);

        if (currentMainImage && !isMainImageValid) {
          console.log(
            '⚠️ [SET_MEDIA] 메인이미지 유효성 검사 실패, 자동 해제:',
            {
              removedMainImage: currentMainImage.slice(0, 30) + '...',
              reason: !cleanedFiles.includes(currentMainImage)
                ? 'not_in_media'
                : 'is_placeholder',
            }
          );

          setValue('mainImage', null, { shouldDirty: true });
        }

        const syncOperation: StateUpdateOperation = {
          id: `sync_${Date.now()}`,
          type: 'FORM_TO_STORE',
          payload: {
            mediaFiles: cleanedFiles,
            mainImage: isMainImageValid ? currentMainImage : null,
            selectedFileNames: selectionState.selectedFileNames,
          },
          timestamp: Date.now(),
        };

        addToOperationQueue(syncOperation);

        console.log('✅ [SET_MEDIA] 동기화 예약 완료:', {
          원본파일수: finalFiles.length,
          정리된파일수: cleanedFiles.length,
          mainImageValid: isMainImageValid,
          operationId: syncOperation.id,
        });
      } catch (syncError) {
        console.error('❌ [SET_MEDIA] 동기화 예약 실패:', { error: syncError });
      }
    },
    [
      isStateLocked,
      getValues,
      setValue,
      addToOperationQueue,
      selectionState.selectedFileNames,
    ]
  );

  const setMainImageValue = useCallback(
    (imageUrlOrNull: string | null) => {
      console.log('🔧 [SET_MAIN_IMAGE] setMainImageValue 시작:', {
        imageUrlPreview: imageUrlOrNull
          ? imageUrlOrNull.slice(0, 30) + '...'
          : 'null',
        isNull: imageUrlOrNull === null,
        isPlaceholder: imageUrlOrNull
          ? safeIsPlaceholderUrl(imageUrlOrNull)
          : false,
      });

      if (imageUrlOrNull === null) {
        setValue('mainImage', null, {
          shouldDirty: true,
          shouldTouch: true,
        });

        try {
          const backupData = {
            mainImage: null,
            timestamp: Date.now(),
            source: 'setMainImageValue_null',
          };
          localStorage.setItem(
            'blogMediaMainImageBackup',
            JSON.stringify(backupData)
          );
          console.log('💾 [SET_MAIN_IMAGE] null 값 localStorage 백업 완료');
        } catch (backupError) {
          console.error(
            '❌ [SET_MAIN_IMAGE] null 값 localStorage 백업 실패:',
            backupError
          );
        }

        const mainImageSyncOperation: StateUpdateOperation = {
          id: `main_null_${Date.now()}`,
          type: 'MAIN_IMAGE_SYNC',
          payload: { mainImage: null },
          timestamp: Date.now(),
        };

        addToOperationQueue(mainImageSyncOperation);

        console.log('✅ [SET_MAIN_IMAGE] null 값 처리 완료');
        return;
      }

      const isValidImageUrl =
        typeof imageUrlOrNull === 'string' && imageUrlOrNull.length > 0;
      const isNotPlaceholder =
        isValidImageUrl && !safeIsPlaceholderUrl(imageUrlOrNull);
      const finalImageUrl =
        isValidImageUrl && isNotPlaceholder ? imageUrlOrNull : null;

      setValue('mainImage', finalImageUrl, {
        shouldDirty: true,
        shouldTouch: true,
      });

      try {
        const backupData = {
          mainImage: finalImageUrl || null,
          timestamp: Date.now(),
          source: 'setMainImageValue_string',
        };
        localStorage.setItem(
          'blogMediaMainImageBackup',
          JSON.stringify(backupData)
        );
        console.log('💾 [SET_MAIN_IMAGE] localStorage 백업 완료');
      } catch (backupError) {
        console.error(
          '❌ [SET_MAIN_IMAGE] localStorage 백업 실패:',
          backupError
        );
      }

      const mainImageSyncOperation: StateUpdateOperation = {
        id: `main_direct_${Date.now()}`,
        type: 'MAIN_IMAGE_SYNC',
        payload: { mainImage: finalImageUrl },
        timestamp: Date.now(),
      };

      addToOperationQueue(mainImageSyncOperation);

      setTimeout(() => {
        const currentValue = getValues('mainImage');
        const isValueMismatch = currentValue !== finalImageUrl;
        if (isValueMismatch) {
          console.log('⚠️ [SET_MAIN_IMAGE] 값 불일치 감지, 재설정');
          setValue('mainImage', finalImageUrl, { shouldDirty: true });
        }
      }, 100);

      console.log('✅ [SET_MAIN_IMAGE] 처리 완료:', {
        원본URL: imageUrlOrNull || 'none',
        최종URL: finalImageUrl || 'none',
        플레이스홀더필터링: isValidImageUrl && !isNotPlaceholder,
      });
    },
    [setValue, getValues, addToOperationQueue]
  );

  const setSelectedFileNames = useCallback(
    (namesOrUpdater: string[] | ((prev: string[]) => string[])) => {
      console.log('📝 [SET_NAMES] setSelectedFileNames 시작:', {
        입력타입:
          typeof namesOrUpdater === 'function' ? '함수형업데이터' : '직접배열',
      });

      try {
        let finalNames: string[];

        const isUpdaterFunction = typeof namesOrUpdater === 'function';
        if (isUpdaterFunction) {
          finalNames = namesOrUpdater(selectionState.selectedFileNames);
        } else {
          finalNames = namesOrUpdater;
        }

        const cleanedNames = finalNames.filter(
          (name) => typeof name === 'string' && name.length > 0
        );

        setSelectionState((previousState) => ({
          ...previousState,
          selectedFileNames: cleanedNames,
        }));

        console.log('✅ [SET_NAMES] 파일명 업데이트 완료:', {
          원본파일명수: finalNames.length,
          정리된파일명수: cleanedNames.length,
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

    const toastType = Reflect.get(newToast, 'type') ?? 'unknown';
    const toastMessage = Reflect.get(newToast, 'message');
    const hasMessage = toastMessage && typeof toastMessage === 'string';
    const messagePreview = hasMessage
      ? toastMessage.slice(0, 30) + '...'
      : 'no_message';

    console.log('🍞 [TOAST] 토스트 추가:', {
      toastId: newToast.id,
      type: toastType,
      message: messagePreview,
      hasMessage: hasMessage,
      toastKeys: Object.keys(newToast),
    });

    const timeoutId = setTimeout(() => {
      setToasts((previousToasts) =>
        previousToasts.filter(({ id }) => id !== newToast.id)
      );
      console.log('🍞 [TOAST] 토스트 자동 제거:', { toastId: newToast.id });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((previousToasts) =>
      previousToasts.filter(({ id }) => id !== toastId)
    );
    console.log('🍞 [TOAST] 토스트 수동 제거:', { toastId });
  }, []);

  const forceSync = useCallback(() => {
    if (isStateLocked) {
      console.log('⏳ [FORCE_SYNC] 상태 락으로 인한 대기');
      return;
    }

    const forceSyncOperation: StateUpdateOperation = {
      id: `force_${Date.now()}`,
      type: 'FORCE_SYNC',
      payload: { force: true, cleanupPlaceholders: true },
      timestamp: Date.now(),
    };

    addToOperationQueue(forceSyncOperation);

    console.log('✅ [FORCE_SYNC] 강제 동기화 예약:', {
      operationId: forceSyncOperation.id,
    });
  }, [isStateLocked, addToOperationQueue]);

  const toggleIntegrityCheck = useCallback((enabled: boolean) => {
    setIntegrityCheckEnabled(enabled);
    if (enabled) {
      integrityCheckCountRef.current = 0;
    }
    console.log('🔧 [INTEGRITY_CHECK] 무결성 검사 토글:', {
      enabled,
      resetCounter: enabled ? true : false,
    });
  }, []);

  const performManualIntegrityCheck = useCallback(() => {
    if (isStateLocked) {
      console.log('⏳ [MANUAL_INTEGRITY] 상태 락으로 인한 대기');
      return;
    }

    const manualIntegrityOperation: StateUpdateOperation = {
      id: `manual_integrity_${Date.now()}`,
      type: 'INTEGRITY_CHECK',
      payload: {},
      timestamp: Date.now(),
    };

    addToOperationQueue(manualIntegrityOperation);

    console.log('✅ [MANUAL_INTEGRITY] 수동 무결성 검사 예약');
  }, [isStateLocked, addToOperationQueue]);

  console.log('✅ [BLOG_MEDIA_STATE] 타입 안전성 확보 완료:', {
    formValuesKeys: validatedFormValues ? Object.keys(validatedFormValues) : [],
    currentMediaFilesCount: currentMediaFiles.length,
    selectedFileNamesCount: selectionState.selectedFileNames.length,
    currentMainImage: currentMainImage
      ? currentMainImage.slice(0, 30) + '...'
      : 'none',
    isStateLocked,
    queueLength: operationQueueRef.current.length,
    syncInitialized,
    integrityCheckEnabled,
    hasPlaceholders: currentMediaFiles.some((url) => {
      const urlString = url ?? '';
      return isPlaceholderUrl(urlString);
    }),
    integrityCheckCount: integrityCheckCountRef.current,
    lastAutoCleanTime: lastAutoCleanTimestampRef.current,
    타입안전성확보: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    formValues: validatedFormValues,
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
    integrityCheckEnabled,

    forceSync,
    toggleIntegrityCheck,
    performManualIntegrityCheck,

    placeholderUtils: {
      isPlaceholderUrl,
      cleanupPlaceholderUrls,
      validateMediaIntegrity,
      initializeWithCleanup,
      safeIsPlaceholderUrl,
    },
  };
};
