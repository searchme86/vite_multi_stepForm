// 📁 imageUpload/context/ImageUploadContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
  useRef,
} from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';
import { useImageUploadHandlers } from '../hooks/useImageUploadHandlers';
import type {
  ImageUploadContextValue,
  FileSelectButtonRef,
  MainImageHandlers,
} from '../types/imageUploadTypes';

// 🔧 토스트 메시지 타입 정의
interface SafeToastMessage {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary';
}

// 🔧 타입 안전한 토스트 검증 함수
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

// 🔧 타입 안전한 값 추출 함수들
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
  console.log(
    '🔧 [IMAGE_UPLOAD_PROVIDER] 에러 해결된 Provider 초기화 - useImageUploadHandlers 통합'
  );

  // 🔧 기본 hooks (에러 없는 순서로 호출)
  const blogMediaStateResult = useBlogMediaStepState();
  const blogMediaIntegrationResult = useBlogMediaStepIntegration();

  // 🔧 안전한 값 추출
  const currentMainImageUrl = safeExtractMainImageUrl(
    blogMediaStateResult.formValues
  );
  const mediaFilesList = safeExtractMediaFilesList(
    blogMediaStateResult.formValues
  );
  const selectedFileNames = safeExtractSelectedFileNames(
    blogMediaStateResult.selectionState
  );
  const selectedSliderIndices = safeExtractSliderIndices(
    blogMediaStateResult.selectionState
  );

  // 🔧 FileSelectButton 참조 생성
  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  // 🔧 메인 이미지 핸들러 생성
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

  // ✅ useImageUploadHandlers 통합 사용
  const imageUploadHandlers = useImageUploadHandlers({
    formValues: blogMediaStateResult.formValues,
    uiState: blogMediaStateResult.uiState,
    selectionState: blogMediaStateResult.selectionState,
    updateMediaValue: (filesOrUpdater) => {
      try {
        if (typeof filesOrUpdater === 'function') {
          const currentMedia = mediaFilesList;
          const updatedMedia = filesOrUpdater(currentMedia);
          blogMediaStateResult.setMediaValue(Array.from(updatedMedia));
        } else {
          blogMediaStateResult.setMediaValue(Array.from(filesOrUpdater));
        }
      } catch (error) {
        console.error('❌ [UPDATE_MEDIA] 업데이트 실패:', error);
      }
    },
    setMainImageValue: (value: string) => {
      try {
        blogMediaIntegrationResult.setMainImageValue(value);
      } catch (error) {
        console.error('❌ [SET_MAIN_IMAGE] 설정 실패:', error);
      }
    },
    updateSelectedFileNames: (namesOrUpdater) => {
      try {
        if (typeof namesOrUpdater === 'function') {
          const currentNames = selectedFileNames;
          const updatedNames = namesOrUpdater(currentNames);
          blogMediaStateResult.setSelectedFileNames(Array.from(updatedNames));
        } else {
          blogMediaStateResult.setSelectedFileNames(Array.from(namesOrUpdater));
        }
      } catch (error) {
        console.error('❌ [UPDATE_FILENAMES] 업데이트 실패:', error);
      }
    },
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

  // 🔧 sliderIndices 관련 함수들
  const isImageSelectedForSlider = useMemo(() => {
    return (imageIndex: number): boolean => {
      return selectedSliderIndices.includes(imageIndex);
    };
  }, [selectedSliderIndices]);

  // 🔧 메모화된 Context 값 생성 (완전한 타입 일치)
  const contextValue = useMemo<ImageUploadContextValue>(() => {
    return {
      // ✅ 상태 데이터 (올바른 이름과 타입으로 매핑)
      uploadedImages: mediaFilesList, // ✅ 이름 수정
      selectedFileNames: selectedFileNames, // ✅ 추가
      uploading: imageUploadHandlers.uploading || {}, // ✅ fallback 추가
      uploadStatus: imageUploadHandlers.uploadStatus || {}, // ✅ fallback 추가
      deleteConfirmState: imageUploadHandlers.deleteConfirmState, // ✅ 추가
      duplicateMessageState: imageUploadHandlers.duplicateMessageState, // ✅ 추가
      touchActiveImages: imageUploadHandlers.touchActiveImages, // ✅ 추가
      hasActiveUploads: imageUploadHandlers.hasActiveUploads, // ✅ 추가
      isMobileDevice: imageUploadHandlers.isMobileDevice, // ✅ 추가

      // ✅ 슬라이더 선택 상태 추가
      selectedSliderIndices: selectedSliderIndices, // ✅ 추가
      isImageSelectedForSlider: isImageSelectedForSlider, // ✅ 추가

      // ✅ 파일 처리 핸들러 (올바른 매핑)
      handleFilesDropped: imageUploadHandlers.handleFilesDropped, // ✅ 추가
      handleFileSelectClick: imageUploadHandlers.handleFileSelectClick, // ✅ 추가
      handleFileChange: imageUploadHandlers.handleFileChange, // ✅ 추가

      // ✅ 이미지 관리 핸들러 (올바른 매핑)
      handleDeleteButtonClick: imageUploadHandlers.handleDeleteButtonClick, // ✅ 추가
      handleDeleteConfirm: imageUploadHandlers.handleDeleteConfirm, // ✅ 추가
      handleDeleteCancel: imageUploadHandlers.handleDeleteCancel, // ✅ 추가
      handleImageTouch: imageUploadHandlers.handleImageTouch, // ✅ 추가

      // ✅ 메인 이미지 핸들러
      mainImageHandlers: mainImageHandlers, // ✅ 추가

      // ✅ 참조 객체
      fileSelectButtonRef: fileSelectButtonRef, // ✅ 추가
    };
  }, [
    mediaFilesList,
    selectedFileNames,
    selectedSliderIndices,
    isImageSelectedForSlider,
    imageUploadHandlers,
    mainImageHandlers,
  ]);

  // 🚨 강화된 메인 이미지 복원 로직 (기존 유지)
  useEffect(() => {
    const performSafeMainImageRestore = async () => {
      console.log('🔄 [SAFE_RESTORE] 에러 안전한 메인 이미지 복원 시작:', {
        currentMainImageUrl: currentMainImageUrl || 'none',
        mediaFilesCount: mediaFilesList.length,
        에러안전복원: true,
      });

      if (currentMainImageUrl && currentMainImageUrl.length > 0) {
        console.log('ℹ️ [SAFE_RESTORE] 이미 메인 이미지가 있음, 복원 생략');
        return;
      }

      try {
        // localStorage 백업 확인
        const backupDataString = localStorage.getItem(
          'blogMediaMainImageBackup'
        );
        if (backupDataString) {
          try {
            const backupData = JSON.parse(backupDataString);
            const backupMainImage = Reflect.get(backupData, 'mainImage');
            const backupTimestamp = Reflect.get(backupData, 'timestamp');

            if (
              typeof backupMainImage === 'string' &&
              typeof backupTimestamp === 'number' &&
              backupMainImage.length > 0
            ) {
              const isRecentBackup =
                Date.now() - backupTimestamp < 5 * 60 * 1000;

              if (isRecentBackup && mediaFilesList.includes(backupMainImage)) {
                console.log(
                  '🔄 [SAFE_RESTORE] localStorage 백업에서 메인 이미지 복원'
                );
                mainImageHandlers.onMainImageSet(-1, backupMainImage);
                return;
              }
            }
          } catch (parseError) {
            console.warn(
              '⚠️ [SAFE_RESTORE] localStorage 백업 파싱 실패:',
              parseError
            );
          }
        }

        // Zustand Store에서 복원
        try {
          const imageGalleryStore =
            blogMediaIntegrationResult.imageGalleryStore;
          if (imageGalleryStore && typeof imageGalleryStore === 'object') {
            const getIsInitialized = Reflect.get(
              imageGalleryStore,
              'getIsInitialized'
            );
            const initializeStoredImages = Reflect.get(
              imageGalleryStore,
              'initializeStoredImages'
            );
            const getImageViewConfig = Reflect.get(
              imageGalleryStore,
              'getImageViewConfig'
            );

            if (typeof getIsInitialized === 'function') {
              const isStoreInitialized = Boolean(getIsInitialized());

              if (
                !isStoreInitialized &&
                typeof initializeStoredImages === 'function'
              ) {
                console.log('🔄 [SAFE_RESTORE] 갤러리 스토어 초기화 중...');
                await initializeStoredImages();
              }
            }

            if (typeof getImageViewConfig === 'function') {
              const currentGalleryConfig = getImageViewConfig();
              const storeMainImage = currentGalleryConfig?.mainImage;

              if (
                typeof storeMainImage === 'string' &&
                storeMainImage.length > 0 &&
                mediaFilesList.includes(storeMainImage)
              ) {
                console.log(
                  '🔄 [SAFE_RESTORE] Zustand Store에서 메인 이미지 복원'
                );
                mainImageHandlers.onMainImageSet(-1, storeMainImage);
                return;
              }
            }
          }
        } catch (storeError) {
          console.error(
            '❌ [SAFE_RESTORE] Zustand Store 복원 실패:',
            storeError
          );
        }

        console.log('ℹ️ [SAFE_RESTORE] 복원할 메인 이미지 없음');
      } catch (restoreError) {
        console.error('❌ [SAFE_RESTORE] 메인 이미지 복원 실패:', restoreError);
      }
    };

    const safeRestoreTimeout = setTimeout(() => {
      performSafeMainImageRestore().catch((error) => {
        console.error('❌ [SAFE_RESTORE] 복원 프로세스 실패:', error);
      });
    }, 500);

    return () => clearTimeout(safeRestoreTimeout);
  }, [
    mediaFilesList,
    currentMainImageUrl,
    mainImageHandlers,
    blogMediaIntegrationResult,
  ]);

  // 🚨 미디어 목록 변경 시 메인 이미지 유효성 검사 (기존 유지)
  useEffect(() => {
    const validateMainImageOnMediaChange = () => {
      if (!currentMainImageUrl || currentMainImageUrl.length === 0) {
        return;
      }

      const isMainImageStillValid =
        mediaFilesList.includes(currentMainImageUrl);

      if (!isMainImageStillValid) {
        console.log(
          '⚠️ [SAFE_VALIDATION] 메인 이미지가 미디어 목록에 없음, 해제'
        );

        try {
          mainImageHandlers.onMainImageCancel();

          const clearBackupData = {
            mainImage: null,
            timestamp: Date.now(),
            source: 'safeMediaValidation',
            reason: 'imageRemovedFromMediaList',
          };
          localStorage.setItem(
            'blogMediaMainImageBackup',
            JSON.stringify(clearBackupData)
          );
        } catch (clearError) {
          console.warn('⚠️ [SAFE_VALIDATION] 해제 실패:', clearError);
        }
      }
    };

    validateMainImageOnMediaChange();
  }, [mediaFilesList, currentMainImageUrl, mainImageHandlers]);

  console.log('✅ [IMAGE_UPLOAD_PROVIDER] 에러 해결된 Provider 초기화 완료:', {
    mediaFilesCount: mediaFilesList.length,
    selectedFileNamesCount: selectedFileNames.length,
    hasMainImage: Boolean(currentMainImageUrl),
    hasActiveUploads: imageUploadHandlers.hasActiveUploads,
    uploadingCount: Object.keys(imageUploadHandlers.uploading || {}).length,
    contextValueComplete: true,
    timestamp: new Date().toLocaleTimeString(),
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
