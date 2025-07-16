// 📁 imageUpload/context/ImageUploadContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';
import { useImageUploadHandlers } from '../hooks/useImageUploadHandlers';
import { useMapBasedFileState } from '../hooks/useMapBasedFileState';
import type {
  ImageUploadContextValue,
  FileSelectButtonRef,
  MainImageHandlers,
} from '../types/imageUploadTypes';

interface SafeToastMessage {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary';
}

const validateToastMessage = (toast: unknown): toast is SafeToastMessage => {
  if (!toast || typeof toast !== 'object') {
    return false;
  }

  const title = Reflect.get(toast, 'title');
  const description = Reflect.get(toast, 'description');
  const color = Reflect.get(toast, 'color');

  const hasValidTitle = typeof title === 'string' && title.length > 0;
  const hasValidDescription = typeof description === 'string';
  const hasValidColor =
    typeof color === 'string' &&
    ['success', 'warning', 'danger', 'primary'].includes(color);

  return hasValidTitle && hasValidDescription && hasValidColor;
};

const ImageUploadContext = createContext<ImageUploadContextValue | null>(null);

interface ImageUploadProviderProps {
  children: ReactNode;
}

const safeExtractMainImageUrl = (formValues: unknown): string => {
  try {
    if (!formValues || typeof formValues !== 'object') {
      console.log('🔍 [EXTRACT_MAIN_IMAGE] formValues가 객체가 아님');
      return '';
    }
    const mainImage = Reflect.get(formValues, 'mainImage');
    const extractedUrl = typeof mainImage === 'string' ? mainImage : '';
    console.log('🔍 [EXTRACT_MAIN_IMAGE] 추출 결과:', { extractedUrl });
    return extractedUrl;
  } catch (error) {
    console.warn('⚠️ [EXTRACT_MAIN_IMAGE] 추출 실패:', error);
    return '';
  }
};

const safeExtractMediaFilesList = (formValues: unknown): string[] => {
  try {
    if (!formValues || typeof formValues !== 'object') {
      console.log('🔍 [EXTRACT_MEDIA] formValues가 객체가 아님');
      return [];
    }
    const media = Reflect.get(formValues, 'media');
    if (!Array.isArray(media)) {
      console.log('🔍 [EXTRACT_MEDIA] media가 배열이 아님');
      return [];
    }
    const filteredMedia = media.filter(
      (item): item is string => typeof item === 'string'
    );
    console.log('🔍 [EXTRACT_MEDIA] 추출 결과:', {
      count: filteredMedia.length,
    });
    return filteredMedia;
  } catch (error) {
    console.warn('⚠️ [EXTRACT_MEDIA] 추출 실패:', error);
    return [];
  }
};

const safeExtractSelectedFileNames = (selectionState: unknown): string[] => {
  try {
    if (!selectionState || typeof selectionState !== 'object') {
      console.log('🔍 [EXTRACT_FILENAMES] selectionState가 객체가 아님');
      return [];
    }
    const selectedFileNames = Reflect.get(selectionState, 'selectedFileNames');
    if (!Array.isArray(selectedFileNames)) {
      console.log('🔍 [EXTRACT_FILENAMES] selectedFileNames가 배열이 아님');
      return [];
    }
    const filteredNames = selectedFileNames.filter(
      (name): name is string => typeof name === 'string'
    );
    console.log('🔍 [EXTRACT_FILENAMES] 추출 결과:', {
      count: filteredNames.length,
    });
    return filteredNames;
  } catch (error) {
    console.warn('⚠️ [EXTRACT_FILENAMES] 추출 실패:', error);
    return [];
  }
};

const safeExtractSliderIndices = (selectionState: unknown): number[] => {
  try {
    if (!selectionState || typeof selectionState !== 'object') {
      console.log('🔍 [EXTRACT_SLIDER] selectionState가 객체가 아님');
      return [];
    }
    const sliderIndices = Reflect.get(selectionState, 'selectedSliderIndices');
    if (!Array.isArray(sliderIndices)) {
      console.log('🔍 [EXTRACT_SLIDER] sliderIndices가 배열이 아님');
      return [];
    }
    const filteredIndices = sliderIndices.filter(
      (index): index is number => typeof index === 'number'
    );
    console.log('🔍 [EXTRACT_SLIDER] 추출 결과:', {
      count: filteredIndices.length,
    });
    return filteredIndices;
  } catch (error) {
    console.warn('⚠️ [EXTRACT_SLIDER] 추출 실패:', error);
    return [];
  }
};

export const ImageUploadProvider: React.FC<ImageUploadProviderProps> = ({
  children,
}) => {
  console.log(
    '🔧 [IMAGE_UPLOAD_PROVIDER] RACE_CONDITION_FIXED Context 초기화 시작'
  );

  const blogMediaStateResult = useBlogMediaStepState();
  const blogMediaIntegrationResult = useBlogMediaStepIntegration();

  const { state: mapFileState, actions: mapFileActions } =
    useMapBasedFileState();

  const syncExecutedRef = useRef<boolean>(false);

  const legacyMainImageUrl = safeExtractMainImageUrl(
    blogMediaStateResult.formValues
  );
  const legacyMediaFiles = safeExtractMediaFilesList(
    blogMediaStateResult.formValues
  );
  const legacySelectedFileNames = safeExtractSelectedFileNames(
    blogMediaStateResult.selectionState
  );
  const selectedSliderIndices = safeExtractSliderIndices(
    blogMediaStateResult.selectionState
  );

  const performLegacyDataSync = useCallback(() => {
    if (syncExecutedRef.current) {
      console.log('🔍 [LEGACY_SYNC] 이미 동기화 완료됨, 건너뜀');
      return;
    }

    const hasLegacyData =
      legacyMediaFiles.length > 0 || legacySelectedFileNames.length > 0;

    if (hasLegacyData) {
      console.log('🔄 [LEGACY_SYNC] 레거시 → Map 동기화 시작:', {
        legacyMediaFiles: legacyMediaFiles.length,
        legacySelectedFileNames: legacySelectedFileNames.length,
      });

      try {
        legacyMediaFiles.forEach((url: string, index: number) => {
          const fileName =
            legacySelectedFileNames[index] || `legacy_file_${index + 1}`;
          const existingUrls = mapFileActions.getFileUrls();

          const isUrlAlreadyExists = existingUrls.includes(url);
          if (!isUrlAlreadyExists) {
            mapFileActions.addFile(fileName, url);
            console.log('✅ [LEGACY_SYNC] 레거시 파일 추가:', {
              fileName,
              url: url.slice(0, 30) + '...',
            });
          }
        });

        syncExecutedRef.current = true;
        console.log('✅ [LEGACY_SYNC] 레거시 → Map 동기화 완료');
      } catch (error) {
        console.error('❌ [LEGACY_SYNC] 레거시 → Map 동기화 실패:', error);
      }
    }

    const { urls: mapUrls, names: mapNames } =
      mapFileActions.convertToLegacyArrays();
    const shouldSyncMapToLegacy =
      mapUrls.length > 0 && legacyMediaFiles.length === 0;

    if (shouldSyncMapToLegacy) {
      console.log('🔄 [SYNC] Map → 레거시 동기화:', {
        mapUrls: mapUrls.length,
        mapNames: mapNames.length,
      });

      try {
        blogMediaStateResult.setMediaValue(Array.from(mapUrls));
        blogMediaStateResult.setSelectedFileNames(Array.from(mapNames));
        console.log('✅ [SYNC] Map → 레거시 동기화 완료');
      } catch (error) {
        console.error('❌ [SYNC] Map → 레거시 동기화 실패:', error);
      }
    }

    if (!hasLegacyData && !shouldSyncMapToLegacy) {
      console.log('ℹ️ [LEGACY_SYNC] 동기화할 데이터 없음, 건너뜀');
    }
  }, [
    legacyMediaFiles,
    legacySelectedFileNames,
    mapFileActions,
    blogMediaStateResult,
  ]);

  useEffect(() => {
    performLegacyDataSync();
  }, [performLegacyDataSync]);

  const { urls: currentMediaFiles, names: currentFileNames } =
    mapFileActions.convertToLegacyArrays();
  const currentMainImageUrl = legacyMainImageUrl;

  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  const mainImageHandlers = useMemo((): MainImageHandlers => {
    return {
      onMainImageSet: (imageIndex: number, imageUrl: string) => {
        try {
          blogMediaIntegrationResult.setMainImageValue(imageUrl);
          console.log('✅ [MAIN_IMAGE] 메인 이미지 설정:', {
            imageIndex,
            imageUrl: imageUrl.slice(0, 30) + '...',
          });
        } catch (error) {
          console.error('❌ [MAIN_IMAGE] 설정 실패:', error);
        }
      },
      onMainImageCancel: () => {
        try {
          blogMediaIntegrationResult.setMainImageValue('');
          console.log('✅ [MAIN_IMAGE] 메인 이미지 해제');
        } catch (error) {
          console.error('❌ [MAIN_IMAGE] 해제 실패:', error);
        }
      },
      checkIsMainImage: (imageUrl: string): boolean => {
        const isMainImage = imageUrl === currentMainImageUrl;
        console.log('🔍 [MAIN_IMAGE] 메인 이미지 확인:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          isMainImage,
        });
        return isMainImage;
      },
      checkCanSetAsMainImage: (imageUrl: string): boolean => {
        if (!imageUrl || imageUrl.length === 0) {
          console.log('🔍 [MAIN_IMAGE] 빈 URL로 설정 불가');
          return false;
        }
        const isPlaceholder =
          imageUrl.startsWith('placeholder-') &&
          imageUrl.includes('-processing');
        const isAlreadyMain = imageUrl === currentMainImageUrl;
        const canSet = !isPlaceholder && !isAlreadyMain;
        console.log('🔍 [MAIN_IMAGE] 설정 가능 여부:', {
          imageUrl: imageUrl.slice(0, 30) + '...',
          isPlaceholder,
          isAlreadyMain,
          canSet,
        });
        return canSet;
      },
    };
  }, [currentMainImageUrl, blogMediaIntegrationResult]);

  const updateMediaValueCallback = useCallback(
    (
      filesOrUpdater:
        | readonly string[]
        | ((prev: readonly string[]) => readonly string[])
    ) => {
      try {
        console.log('🔄 [UPDATE_MEDIA] 미디어 값 업데이트 시작');

        if (typeof filesOrUpdater === 'function') {
          const currentUrls = mapFileActions.getFileUrls();
          const updatedUrls = filesOrUpdater(currentUrls);

          console.log('🔄 [UPDATE_MEDIA] 함수형 업데이트:', {
            currentCount: currentUrls.length,
            updatedCount: updatedUrls.length,
          });

          updatedUrls.forEach((url: string, index: number) => {
            const fileName =
              currentFileNames[index] || `updated_file_${index + 1}`;
            const existingUrls = mapFileActions.getFileUrls();

            const isUrlAlreadyExists = existingUrls.includes(url);
            if (!isUrlAlreadyExists) {
              mapFileActions.addFile(fileName, url);
              console.log('✅ [UPDATE_MEDIA] 함수형 - 파일 추가:', {
                fileName,
                url: url.slice(0, 30) + '...',
              });
            }
          });

          blogMediaStateResult.setMediaValue(Array.from(updatedUrls));
        } else {
          console.log('🔄 [UPDATE_MEDIA] 직접 값 업데이트:', {
            filesCount: Array.from(filesOrUpdater).length,
          });

          Array.from(filesOrUpdater).forEach((url: string, index: number) => {
            const fileName =
              currentFileNames[index] || `direct_file_${index + 1}`;
            const existingUrls = mapFileActions.getFileUrls();

            const isUrlAlreadyExists = existingUrls.includes(url);
            if (!isUrlAlreadyExists) {
              mapFileActions.addFile(fileName, url);
              console.log('✅ [UPDATE_MEDIA] 직접 - 파일 추가:', {
                fileName,
                url: url.slice(0, 30) + '...',
              });
            }
          });

          blogMediaStateResult.setMediaValue(Array.from(filesOrUpdater));
        }

        console.log('✅ [UPDATE_MEDIA] 미디어 값 업데이트 완료');
      } catch (error) {
        console.error('❌ [UPDATE_MEDIA] 업데이트 실패:', error);
      }
    },
    [mapFileActions, currentFileNames, blogMediaStateResult]
  );

  const updateSelectedFileNamesCallback = useCallback(
    (
      namesOrUpdater:
        | readonly string[]
        | ((prev: readonly string[]) => readonly string[])
    ) => {
      try {
        console.log('🔄 [UPDATE_FILENAMES] 파일명 업데이트 시작');

        if (typeof namesOrUpdater === 'function') {
          const currentNames = mapFileActions.getFileNames();
          const updatedNames = namesOrUpdater(currentNames);

          console.log('🔄 [UPDATE_FILENAMES] 함수형 업데이트:', {
            currentCount: currentNames.length,
            updatedCount: updatedNames.length,
          });

          const currentUrls = mapFileActions.getFileUrls();

          currentUrls.forEach((url: string, index: number) => {
            const fileName = updatedNames[index];
            if (fileName) {
              let fileId: string | undefined;
              for (const [id, file] of mapFileState.fileMap.entries()) {
                if (
                  file &&
                  typeof file === 'object' &&
                  Reflect.get(file, 'url') === url
                ) {
                  fileId = id;
                  break;
                }
              }
              if (fileId) {
                mapFileActions.updateFile(fileId, { fileName });
                console.log('✅ [UPDATE_FILENAMES] 파일명 업데이트:', {
                  fileId,
                  fileName,
                });
              }
            }
          });

          blogMediaStateResult.setSelectedFileNames(Array.from(updatedNames));
        } else {
          console.log('🔄 [UPDATE_FILENAMES] 직접 값 업데이트:', {
            namesCount: Array.from(namesOrUpdater).length,
          });

          blogMediaStateResult.setSelectedFileNames(Array.from(namesOrUpdater));
        }

        console.log('✅ [UPDATE_FILENAMES] 파일명 업데이트 완료');
      } catch (error) {
        console.error('❌ [UPDATE_FILENAMES] 업데이트 실패:', error);
      }
    },
    [mapFileActions, mapFileState.fileMap, blogMediaStateResult]
  );

  const imageUploadHandlers = useImageUploadHandlers({
    formValues: blogMediaStateResult.formValues,
    uiState: blogMediaStateResult.uiState,
    selectionState: blogMediaStateResult.selectionState,
    updateMediaValue: updateMediaValueCallback,
    setMainImageValue: (value: string) => {
      try {
        blogMediaIntegrationResult.setMainImageValue(value);
        console.log('✅ [SET_MAIN_IMAGE] 설정 완료:', {
          value: value.slice(0, 30) + '...',
        });
      } catch (error) {
        console.error('❌ [SET_MAIN_IMAGE] 설정 실패:', error);
      }
    },
    updateSelectedFileNames: updateSelectedFileNamesCallback,
    showToastMessage: (toast: unknown) => {
      try {
        if (validateToastMessage(toast)) {
          blogMediaStateResult.addToast(toast);
          console.log('✅ [SHOW_TOAST] 토스트 표시:', toast);
        } else {
          console.warn('⚠️ [SHOW_TOAST] 유효하지 않은 토스트 메시지:', toast);
        }
      } catch (error) {
        console.error('❌ [SHOW_TOAST] 토스트 표시 실패:', error);
      }
    },
    imageGalleryStore: blogMediaIntegrationResult.imageGalleryStore,
    mapFileActions: mapFileActions,
  });

  const isImageSelectedForSlider = useMemo(() => {
    return (imageIndex: number): boolean => {
      const isSelected = selectedSliderIndices.includes(imageIndex);
      console.log('🔍 [SLIDER] 이미지 선택 확인:', { imageIndex, isSelected });
      return isSelected;
    };
  }, [selectedSliderIndices]);

  const updateSliderSelection = useMemo(() => {
    return (newSelectedIndices: number[]) => {
      try {
        const imageGalleryStore = blogMediaIntegrationResult.imageGalleryStore;
        if (imageGalleryStore && typeof imageGalleryStore === 'object') {
          const setSliderSelectedIndices = Reflect.get(
            imageGalleryStore,
            'setSliderSelectedIndices'
          );
          if (typeof setSliderSelectedIndices === 'function') {
            setSliderSelectedIndices(newSelectedIndices);
          }
        }
        console.log('✅ [SLIDER_UPDATE] 슬라이더 선택 업데이트:', {
          count: newSelectedIndices.length,
          indices: newSelectedIndices,
        });
      } catch (error) {
        console.error('❌ [SLIDER_UPDATE] 업데이트 실패:', error);
      }
    };
  }, [blogMediaIntegrationResult.imageGalleryStore]);

  useEffect(() => {
    const cleanupStaleePlaceholders = () => {
      const staleTimeout = 10000;
      const now = Date.now();

      currentMediaFiles.forEach((url: string, index: number) => {
        const isPlaceholderUrl =
          url.startsWith('placeholder-') && url.includes('-processing');

        if (isPlaceholderUrl) {
          const timestampMatch = url.match(/-(\d+)-processing$/);
          const timestampExists = timestampMatch && timestampMatch[1];

          if (timestampExists) {
            const createdTime = parseInt(timestampMatch[1], 10);
            const ageMs = now - createdTime;
            const isStale = ageMs > staleTimeout;

            if (isStale) {
              console.log('🗑️ [CLEANUP] 오래된 플레이스홀더 제거:', {
                url: url.slice(0, 50) + '...',
                ageMs,
              });

              updateMediaValueCallback((prev) =>
                prev.filter((_, i) => i !== index)
              );
              updateSelectedFileNamesCallback((prev) =>
                prev.filter((_, i) => i !== index)
              );
            }
          }
        }
      });
    };

    const cleanupTimer = setInterval(cleanupStaleePlaceholders, 5000);
    return () => clearInterval(cleanupTimer);
  }, [
    currentMediaFiles,
    updateMediaValueCallback,
    updateSelectedFileNamesCallback,
  ]);

  const contextValue = useMemo<ImageUploadContextValue>(() => {
    // 🚨 FIXED: 속성명 통일 - isVisible 사용
    const convertDeleteConfirmState = () => {
      const state = imageUploadHandlers.deleteConfirmState;
      if (!state || typeof state !== 'object') {
        return { isVisible: false, imageIndex: -1, imageUrl: '' };
      }

      const isVisible = Reflect.get(state, 'isVisible');
      const imageIndex = Reflect.get(state, 'imageIndex');
      const imageName = Reflect.get(state, 'imageName');
      const imageUrl = Reflect.get(state, 'imageUrl');

      return {
        isVisible: typeof isVisible === 'boolean' ? isVisible : false,
        imageIndex: typeof imageIndex === 'number' ? imageIndex : -1,
        imageUrl:
          typeof imageUrl === 'string'
            ? imageUrl
            : typeof imageName === 'string'
            ? imageName
            : '',
      };
    };

    const convertDuplicateMessageState = () => {
      const state = imageUploadHandlers.duplicateMessageState;
      if (!state || typeof state !== 'object') {
        return { isVisible: false, fileName: '' };
      }

      const isVisible = Reflect.get(state, 'isVisible');
      const message = Reflect.get(state, 'message');
      const fileNames = Reflect.get(state, 'fileNames');
      const fileName =
        Array.isArray(fileNames) && fileNames.length > 0
          ? fileNames[0]
          : message;

      return {
        isVisible: typeof isVisible === 'boolean' ? isVisible : false,
        fileName: typeof fileName === 'string' ? fileName : '',
      };
    };

    const createHandleFileChange = () => {
      const originalHandler = imageUploadHandlers.handleFileChange;
      return (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && typeof originalHandler === 'function') {
          console.log('🔄 [FILE_CHANGE] 파일 변경 이벤트:', {
            filesCount: files.length,
          });
          originalHandler(files);
        }
      };
    };

    const convertTouchActiveImages = () => {
      const state = imageUploadHandlers.touchActiveImages;
      if (!state) {
        return {};
      }

      if (state instanceof Set) {
        const result: Record<number, boolean> = {};
        state.forEach((index: number) => {
          result[index] = true;
        });
        return result;
      }

      if (typeof state === 'object') {
        const result: Record<number, boolean> = {};
        Object.entries(state).forEach(([key, value]) => {
          const numericKey = parseInt(key, 10);
          if (!isNaN(numericKey)) {
            result[numericKey] = !!value;
          }
        });
        return result;
      }

      return {};
    };

    const uploadingFileCount = Object.keys(
      imageUploadHandlers.uploading || {}
    ).length;
    const actuallyHasActiveUploads = uploadingFileCount > 0;

    console.log('🔍 [PHASE1_FIX] hasActiveUploads 계산:', {
      uploadingFileCount,
      actuallyHasActiveUploads,
      previousMapBasedValue: mapFileState.hasActiveUploads,
    });

    const contextValueData = {
      uploadedImages: currentMediaFiles,
      selectedFileNames: currentFileNames,
      uploading: imageUploadHandlers.uploading || {},
      uploadStatus: imageUploadHandlers.uploadStatus || {},
      deleteConfirmState: convertDeleteConfirmState(),
      duplicateMessageState: convertDuplicateMessageState(),
      touchActiveImages: convertTouchActiveImages(),
      hasActiveUploads: actuallyHasActiveUploads,
      isMobileDevice: !!imageUploadHandlers.isMobileDevice,
      selectedSliderIndices: selectedSliderIndices,
      isImageSelectedForSlider: isImageSelectedForSlider,
      updateSliderSelection: updateSliderSelection,
      handleFilesDropped: imageUploadHandlers.handleFilesDropped,
      handleFileSelectClick: imageUploadHandlers.handleFileSelectClick,
      handleFileChange: createHandleFileChange(),
      handleDeleteButtonClick: imageUploadHandlers.handleDeleteButtonClick,
      handleDeleteConfirm: imageUploadHandlers.handleDeleteConfirm,
      handleDeleteCancel: imageUploadHandlers.handleDeleteCancel,
      handleImageTouch: imageUploadHandlers.handleImageTouch,
      mainImageHandlers: mainImageHandlers,
      fileSelectButtonRef: fileSelectButtonRef,
    };

    console.log('🔧 [CONTEXT_VALUE] Context 값 생성 완료:', {
      uploadedImagesCount: contextValueData.uploadedImages.length,
      selectedFileNamesCount: contextValueData.selectedFileNames.length,
      hasActiveUploads: contextValueData.hasActiveUploads,
      selectedSliderIndicesCount: contextValueData.selectedSliderIndices.length,
    });

    return contextValueData;
  }, [
    currentMediaFiles,
    currentFileNames,
    selectedSliderIndices,
    isImageSelectedForSlider,
    updateSliderSelection,
    imageUploadHandlers,
    mainImageHandlers,
    mapFileState.hasActiveUploads,
  ]);

  const mainImageRestoreExecutedRef = useRef<boolean>(false);

  useEffect(() => {
    if (mainImageRestoreExecutedRef.current) {
      console.log('🔍 [RESTORE] 이미 복원 완료됨, 건너뜀');
      return;
    }

    const performMainImageRestore = () => {
      if (currentMainImageUrl && currentMainImageUrl.length > 0) {
        console.log('🔍 [RESTORE] 이미 메인 이미지 설정됨, 복원 건너뜀');
        return;
      }

      if (currentMediaFiles.length === 0) {
        console.log('🔍 [RESTORE] 미디어 파일 없음, 복원 건너뜀');
        return;
      }

      try {
        const backupDataString = localStorage.getItem(
          'blogMediaMainImageBackup'
        );
        if (backupDataString) {
          const backupData = JSON.parse(backupDataString);
          const backupMainImage = Reflect.get(backupData, 'mainImage');
          const backupTimestamp = Reflect.get(backupData, 'timestamp');

          if (
            typeof backupMainImage === 'string' &&
            typeof backupTimestamp === 'number' &&
            backupMainImage.length > 0
          ) {
            const isRecentBackup = Date.now() - backupTimestamp < 5 * 60 * 1000;
            const isBackupImageInCurrentFiles =
              currentMediaFiles.includes(backupMainImage);

            if (isRecentBackup && isBackupImageInCurrentFiles) {
              mainImageHandlers.onMainImageSet(-1, backupMainImage);
              mainImageRestoreExecutedRef.current = true;
              console.log('✅ [RESTORE] 메인 이미지 복원 완료:', {
                backupMainImage: backupMainImage.slice(0, 30) + '...',
              });
              return;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [RESTORE] 복원 실패:', error);
      }
    };

    const restoreTimeout = setTimeout(performMainImageRestore, 1000);
    return () => clearTimeout(restoreTimeout);
  }, [currentMediaFiles.length, currentMainImageUrl, mainImageHandlers]);

  useEffect(() => {
    if (!currentMainImageUrl || currentMainImageUrl.length === 0) {
      return;
    }

    const isMainImageStillValid =
      currentMediaFiles.includes(currentMainImageUrl);
    if (!isMainImageStillValid) {
      console.log('⚠️ [VALIDATION] 메인 이미지가 미디어 목록에 없음, 해제');
      mainImageHandlers.onMainImageCancel();
    }
  }, [currentMediaFiles.join(','), currentMainImageUrl, mainImageHandlers]);

  console.log(
    '✅ [RACE_CONDITION_FIX] RACE_CONDITION_FIXED Context 초기화 완료'
  );

  return (
    <ImageUploadContext.Provider value={contextValue}>
      {children}
    </ImageUploadContext.Provider>
  );
};

export const useImageUploadContext = (): ImageUploadContextValue => {
  const context = useContext(ImageUploadContext);

  if (!context) {
    throw new Error(
      'useImageUploadContext must be used within an ImageUploadProvider'
    );
  }

  return context;
};
