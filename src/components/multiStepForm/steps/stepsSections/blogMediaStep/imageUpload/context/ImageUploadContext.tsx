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
      return '';
    }
    const mainImage = Reflect.get(formValues, 'mainImage');
    return typeof mainImage === 'string' ? mainImage : '';
  } catch (error) {
    console.warn('⚠️ [EXTRACT_MAIN_IMAGE] 추출 실패:', error);
    return '';
  }
};

const safeExtractMediaFilesList = (formValues: unknown): string[] => {
  try {
    if (!formValues || typeof formValues !== 'object') {
      return [];
    }
    const media = Reflect.get(formValues, 'media');
    if (!Array.isArray(media)) {
      return [];
    }
    return media.filter((item): item is string => typeof item === 'string');
  } catch (error) {
    console.warn('⚠️ [EXTRACT_MEDIA] 추출 실패:', error);
    return [];
  }
};

const safeExtractSelectedFileNames = (selectionState: unknown): string[] => {
  try {
    if (!selectionState || typeof selectionState !== 'object') {
      return [];
    }
    const selectedFileNames = Reflect.get(selectionState, 'selectedFileNames');
    if (!Array.isArray(selectedFileNames)) {
      return [];
    }
    return selectedFileNames.filter(
      (name): name is string => typeof name === 'string'
    );
  } catch (error) {
    console.warn('⚠️ [EXTRACT_FILENAMES] 추출 실패:', error);
    return [];
  }
};

const safeExtractSliderIndices = (selectionState: unknown): number[] => {
  try {
    if (!selectionState || typeof selectionState !== 'object') {
      return [];
    }
    const sliderIndices = Reflect.get(selectionState, 'selectedSliderIndices');
    if (!Array.isArray(sliderIndices)) {
      return [];
    }
    return sliderIndices.filter(
      (index): index is number => typeof index === 'number'
    );
  } catch (error) {
    console.warn('⚠️ [EXTRACT_SLIDER] 추출 실패:', error);
    return [];
  }
};

export const ImageUploadProvider: React.FC<ImageUploadProviderProps> = ({
  children,
}) => {
  console.log('🔧 [IMAGE_UPLOAD_PROVIDER] Map 기반 Provider 초기화 시작');

  const blogMediaStateResult = useBlogMediaStepState();
  const blogMediaIntegrationResult = useBlogMediaStepIntegration();

  const { state: mapFileState, actions: mapFileActions } =
    useMapBasedFileState();

  const syncExecutedRef = useRef<boolean>(false);
  const lastSyncDataRef = useRef<{
    mediaFiles: string[];
    fileNames: string[];
  }>({
    mediaFiles: [],
    fileNames: [],
  });

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
      return;
    }

    const hasLegacyData =
      legacyMediaFiles.length > 0 || legacySelectedFileNames.length > 0;
    if (!hasLegacyData) {
      console.log('ℹ️ [LEGACY_SYNC] 레거시 데이터 없음, 동기화 건너뜀');
      return;
    }

    const isSameData =
      JSON.stringify(lastSyncDataRef.current.mediaFiles) ===
        JSON.stringify(legacyMediaFiles) &&
      JSON.stringify(lastSyncDataRef.current.fileNames) ===
        JSON.stringify(legacySelectedFileNames);

    if (isSameData) {
      console.log('ℹ️ [LEGACY_SYNC] 동일한 데이터, 동기화 건너뜀');
      return;
    }

    console.log('🔄 [LEGACY_SYNC] 레거시 데이터 동기화 시작:', {
      mediaCount: legacyMediaFiles.length,
      fileNameCount: legacySelectedFileNames.length,
    });

    try {
      mapFileActions.clearAllFiles();
      legacyMediaFiles.forEach((url, index) => {
        const fileName = legacySelectedFileNames[index] || `file_${index + 1}`;
        mapFileActions.addFile(fileName, url);
      });

      lastSyncDataRef.current = {
        mediaFiles: [...legacyMediaFiles],
        fileNames: [...legacySelectedFileNames],
      };

      syncExecutedRef.current = true;

      console.log('✅ [LEGACY_SYNC] 동기화 완료:', legacyMediaFiles.length);
    } catch (error) {
      console.error('❌ [LEGACY_SYNC] 동기화 실패:', error);
    }
  }, [legacyMediaFiles, legacySelectedFileNames, mapFileActions]);

  useEffect(() => {
    const syncTimeout = setTimeout(() => {
      performLegacyDataSync();
    }, 100);

    return () => clearTimeout(syncTimeout);
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
        return imageUrl === currentMainImageUrl;
      },
      checkCanSetAsMainImage: (imageUrl: string): boolean => {
        if (!imageUrl || imageUrl.length === 0) return false;
        const isPlaceholder =
          imageUrl.startsWith('placeholder-') &&
          imageUrl.includes('-processing');
        const isAlreadyMain = imageUrl === currentMainImageUrl;
        return !isPlaceholder && !isAlreadyMain;
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
        if (typeof filesOrUpdater === 'function') {
          const currentUrls = mapFileActions.getFileUrls();
          const updatedUrls = filesOrUpdater(currentUrls);

          mapFileActions.clearAllFiles();
          updatedUrls.forEach((url, index) => {
            const fileName = currentFileNames[index] || `file_${index + 1}`;
            mapFileActions.addFile(fileName, url);
          });

          blogMediaStateResult.setMediaValue(Array.from(updatedUrls));
        } else {
          mapFileActions.clearAllFiles();
          Array.from(filesOrUpdater).forEach((url, index) => {
            const fileName = currentFileNames[index] || `file_${index + 1}`;
            mapFileActions.addFile(fileName, url);
          });

          blogMediaStateResult.setMediaValue(Array.from(filesOrUpdater));
        }
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
        if (typeof namesOrUpdater === 'function') {
          const currentNames = mapFileActions.getFileNames();
          const updatedNames = namesOrUpdater(currentNames);

          const currentUrls = mapFileActions.getFileUrls();
          currentUrls.forEach((url, index) => {
            const fileName = updatedNames[index];
            if (fileName) {
              const fileId = Array.from(mapFileState.fileMap.entries()).find(
                ([, file]) => file.url === url
              )?.[0];
              if (fileId) {
                mapFileActions.updateFile(fileId, { fileName });
              }
            }
          });

          blogMediaStateResult.setSelectedFileNames(Array.from(updatedNames));
        } else {
          blogMediaStateResult.setSelectedFileNames(Array.from(namesOrUpdater));
        }
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
      } catch (error) {
        console.error('❌ [SET_MAIN_IMAGE] 설정 실패:', error);
      }
    },
    updateSelectedFileNames: updateSelectedFileNamesCallback,
    showToastMessage: (toast: unknown) => {
      try {
        if (validateToastMessage(toast)) {
          blogMediaStateResult.addToast(toast);
        } else {
          console.warn('⚠️ [SHOW_TOAST] 유효하지 않은 토스트 메시지:', toast);
        }
      } catch (error) {
        console.error('❌ [SHOW_TOAST] 토스트 표시 실패:', error);
      }
    },
    imageGalleryStore: blogMediaIntegrationResult.imageGalleryStore,
  });

  const isImageSelectedForSlider = useMemo(() => {
    return (imageIndex: number): boolean => {
      return selectedSliderIndices.includes(imageIndex);
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
        console.log(
          '✅ [SLIDER_UPDATE] 슬라이더 선택 업데이트:',
          newSelectedIndices.length
        );
      } catch (error) {
        console.error('❌ [SLIDER_UPDATE] 업데이트 실패:', error);
      }
    };
  }, [blogMediaIntegrationResult.imageGalleryStore]);

  const contextValue = useMemo<ImageUploadContextValue>(() => {
    const convertDeleteConfirmState = () => {
      const state = imageUploadHandlers.deleteConfirmState;
      if (!state || typeof state !== 'object') {
        return { isOpen: false, imageIndex: -1, imageUrl: '' };
      }

      const isVisible = Reflect.get(state, 'isVisible');
      const isOpen = Reflect.get(state, 'isOpen');
      const imageIndex = Reflect.get(state, 'imageIndex');
      const imageName = Reflect.get(state, 'imageName');
      const imageUrl = Reflect.get(state, 'imageUrl');

      return {
        isOpen:
          typeof isOpen === 'boolean'
            ? isOpen
            : typeof isVisible === 'boolean'
            ? isVisible
            : false,
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
            result[numericKey] = Boolean(value);
          }
        });
        return result;
      }

      return {};
    };

    return {
      uploadedImages: currentMediaFiles,
      selectedFileNames: currentFileNames,
      uploading: imageUploadHandlers.uploading || {},
      uploadStatus: imageUploadHandlers.uploadStatus || {},
      deleteConfirmState: convertDeleteConfirmState(),
      duplicateMessageState: convertDuplicateMessageState(),
      touchActiveImages: convertTouchActiveImages(),
      hasActiveUploads: Boolean(mapFileState.hasActiveUploads),
      isMobileDevice: Boolean(imageUploadHandlers.isMobileDevice),
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
      return;
    }

    const performMainImageRestore = () => {
      if (currentMainImageUrl && currentMainImageUrl.length > 0) {
        return;
      }

      if (currentMediaFiles.length === 0) {
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
            if (isRecentBackup && currentMediaFiles.includes(backupMainImage)) {
              mainImageHandlers.onMainImageSet(-1, backupMainImage);
              mainImageRestoreExecutedRef.current = true;
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

  console.log('✅ [IMAGE_UPLOAD_PROVIDER] Map 기반 Provider 초기화 완료:', {
    mapFileCount: mapFileState.totalFiles,
    currentMediaCount: currentMediaFiles.length,
    hasActiveUploads: mapFileState.hasActiveUploads,
    syncExecuted: syncExecutedRef.current,
  });

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
