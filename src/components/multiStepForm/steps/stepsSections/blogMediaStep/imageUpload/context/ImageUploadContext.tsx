// 📁 imageUpload/context/ImageUploadContext.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useImageUploadHandlers } from '../hooks/useImageUploadHandlers';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
import { useBlogMediaStepIntegration } from '../../hooks/useBlogMediaStepIntegration';
import type {
  MainImageHandlers,
  DeleteConfirmState,
  DuplicateMessageState,
} from '../types/imageUploadTypes';

interface FileSelectButtonRef {
  clickFileInput: () => void;
}

interface ImageUploadContextValue {
  // 🎯 상태 데이터 (읽기 전용)
  uploadedImages: string[];
  selectedFileNames: string[];
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  hasActiveUploads: boolean;
  isMobileDevice: boolean;

  // 🎯 슬라이더 선택 상태 (새로 추가)
  selectedSliderIndices: number[];
  isImageSelectedForSlider: (imageIndex: number) => boolean;

  // 🎯 파일 처리 핸들러 (메모이제이션됨)
  handleFilesDropped: (files: File[]) => void;
  handleFileSelectClick: () => void;
  handleFileChange: (files: FileList) => void;

  // 🎯 이미지 관리 핸들러 (메모이제이션됨)
  handleDeleteButtonClick: (index: number, name: string) => void;
  handleDeleteConfirm: () => void;
  handleDeleteCancel: () => void;
  handleImageTouch: (index: number) => void;

  // 🎯 메인 이미지 핸들러 (안정된 참조)
  mainImageHandlers: MainImageHandlers | null;

  // 🎯 참조 객체
  fileSelectButtonRef: React.RefObject<FileSelectButtonRef>;
}

const ImageUploadContext = createContext<ImageUploadContextValue | null>(null);

interface ImageUploadProviderProps {
  children: ReactNode;
}

function ImageUploadProvider({
  children,
}: ImageUploadProviderProps): React.ReactNode {
  console.log('🏗️ [CONTEXT] ImageUploadProvider 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 기존 useBlogMediaStepState 유지 (변경 없음)
  const blogMediaStepStateResult = useBlogMediaStepState();
  const {
    formValues: currentFormValues,
    uiState: currentUiState,
    selectionState: currentSelectionState,
    setMediaValue: updateMediaValue,
    setMainImageValue: updateMainImageValue,
    setSelectedFileNames: updateSelectedFileNames,
    addToast: showToastMessage,
    imageGalleryStore: galleryStoreInstance,
  } = blogMediaStepStateResult;

  // 🚀 새로 추가: 슬라이더 선택 상태 가져오기
  const blogMediaIntegrationResult = useBlogMediaStepIntegration();
  const { currentFormValues: integrationFormValues } =
    blogMediaIntegrationResult;
  const { selectedSliderIndices = [] } = integrationFormValues;

  console.log('🎯 [CONTEXT] 슬라이더 선택 상태 확인:', {
    selectedSliderIndices,
    selectedCount: selectedSliderIndices.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 기존 useImageUploadHandlers 유지 (변경 없음)
  const imageUploadHandlersResult = useImageUploadHandlers({
    formValues: currentFormValues,
    uiState: currentUiState,
    selectionState: currentSelectionState,
    updateMediaValue,
    setMainImageValue: updateMainImageValue,
    updateSelectedFileNames,
    showToastMessage,
    imageGalleryStore: galleryStoreInstance,
  });

  // 🚀 새로 추가: 슬라이더 선택 체크 함수
  const checkIsImageSelectedForSlider = useMemo(() => {
    return (imageIndex: number): boolean => {
      const isValidIndex = typeof imageIndex === 'number' && imageIndex >= 0;

      if (!isValidIndex) {
        console.log('⚠️ [CONTEXT] 유효하지 않은 이미지 인덱스:', {
          imageIndex,
        });
        return false;
      }

      const isSelected = selectedSliderIndices.includes(imageIndex);

      console.log('🔍 [CONTEXT] 슬라이더 선택 상태 확인:', {
        imageIndex,
        isSelected,
        selectedSliderIndices,
      });

      return isSelected;
    };
  }, [selectedSliderIndices]);

  // 🚀 성능 최적화: 안정된 메인 이미지 핸들러 객체 생성
  const stableMainImageHandlers = useMemo(() => {
    const {
      handleMainImageSet: handleMainImageSetAction,
      handleMainImageCancel: handleMainImageCancelAction,
      checkIsMainImage: checkIsMainImageFunction,
      checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
    } = imageUploadHandlersResult;

    // 모든 핸들러가 유효한 경우에만 객체 생성
    const hasAllHandlers =
      typeof handleMainImageSetAction === 'function' &&
      typeof handleMainImageCancelAction === 'function' &&
      typeof checkIsMainImageFunction === 'function' &&
      typeof checkCanSetAsMainImageFunction === 'function';

    if (!hasAllHandlers) {
      console.log('⚠️ [CONTEXT] 메인 이미지 핸들러 불완전:', {
        hasSetHandler: typeof handleMainImageSetAction === 'function',
        hasCancelHandler: typeof handleMainImageCancelAction === 'function',
        hasCheckIsMainHandler: typeof checkIsMainImageFunction === 'function',
        hasCheckCanSetHandler:
          typeof checkCanSetAsMainImageFunction === 'function',
      });
      return null;
    }

    return {
      onMainImageSet: handleMainImageSetAction,
      onMainImageCancel: handleMainImageCancelAction,
      checkIsMainImage: checkIsMainImageFunction,
      checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
    } satisfies MainImageHandlers;
  }, [
    imageUploadHandlersResult.handleMainImageSet,
    imageUploadHandlersResult.handleMainImageCancel,
    imageUploadHandlersResult.checkIsMainImage,
    imageUploadHandlersResult.checkCanSetAsMainImage,
  ]);

  // 🚀 성능 최적화: 파일 처리 핸들러들 메모이제이션
  const memoizedFileHandlers = useMemo(
    () => ({
      handleFilesDropped: imageUploadHandlersResult.handleFilesDropped,
      handleFileSelectClick: imageUploadHandlersResult.handleFileSelectClick,
      handleFileChange: imageUploadHandlersResult.handleFileChange,
    }),
    [
      imageUploadHandlersResult.handleFilesDropped,
      imageUploadHandlersResult.handleFileSelectClick,
      imageUploadHandlersResult.handleFileChange,
    ]
  );

  // 🚀 성능 최적화: 이미지 관리 핸들러들 메모이제이션
  const memoizedImageManagementHandlers = useMemo(
    () => ({
      handleDeleteButtonClick:
        imageUploadHandlersResult.handleDeleteButtonClick,
      handleDeleteConfirm: imageUploadHandlersResult.handleDeleteConfirm,
      handleDeleteCancel: imageUploadHandlersResult.handleDeleteCancel,
      handleImageTouch: imageUploadHandlersResult.handleImageTouch,
    }),
    [
      imageUploadHandlersResult.handleDeleteButtonClick,
      imageUploadHandlersResult.handleDeleteConfirm,
      imageUploadHandlersResult.handleDeleteCancel,
      imageUploadHandlersResult.handleImageTouch,
    ]
  );

  // 🚀 성능 최적화: 전체 Context 값 메모이제이션
  const contextValue = useMemo<ImageUploadContextValue>(() => {
    const finalContextValue: ImageUploadContextValue = {
      // 상태 데이터
      uploadedImages: imageUploadHandlersResult.currentMediaFilesList,
      selectedFileNames: imageUploadHandlersResult.currentSelectedFileNames,
      uploading: imageUploadHandlersResult.uploading,
      uploadStatus: imageUploadHandlersResult.uploadStatus,
      deleteConfirmState: imageUploadHandlersResult.deleteConfirmState,
      duplicateMessageState: imageUploadHandlersResult.duplicateMessageState,
      touchActiveImages: imageUploadHandlersResult.touchActiveImages,
      hasActiveUploads: imageUploadHandlersResult.hasActiveUploads,
      isMobileDevice: imageUploadHandlersResult.isMobileDevice,

      // 🚀 새로 추가: 슬라이더 선택 상태
      selectedSliderIndices,
      isImageSelectedForSlider: checkIsImageSelectedForSlider,

      // 메모이제이션된 핸들러들
      ...memoizedFileHandlers,
      ...memoizedImageManagementHandlers,

      // 안정된 메인 이미지 핸들러
      mainImageHandlers: stableMainImageHandlers,

      // 참조 객체
      fileSelectButtonRef: imageUploadHandlersResult.fileSelectButtonRef,
    };

    console.log('🎯 [CONTEXT] Context 값 생성 완료:', {
      uploadedImagesCount: finalContextValue.uploadedImages.length,
      hasActiveUploads: finalContextValue.hasActiveUploads,
      hasMainImageHandlers: finalContextValue.mainImageHandlers !== null,
      selectedSliderCount: finalContextValue.selectedSliderIndices.length,
      timestamp: new Date().toLocaleTimeString(),
    });

    return finalContextValue;
  }, [
    imageUploadHandlersResult.currentMediaFilesList,
    imageUploadHandlersResult.currentSelectedFileNames,
    imageUploadHandlersResult.uploading,
    imageUploadHandlersResult.uploadStatus,
    imageUploadHandlersResult.deleteConfirmState,
    imageUploadHandlersResult.duplicateMessageState,
    imageUploadHandlersResult.touchActiveImages,
    imageUploadHandlersResult.hasActiveUploads,
    imageUploadHandlersResult.isMobileDevice,
    selectedSliderIndices,
    checkIsImageSelectedForSlider,
    memoizedFileHandlers,
    memoizedImageManagementHandlers,
    stableMainImageHandlers,
    imageUploadHandlersResult.fileSelectButtonRef,
  ]);

  console.log('✅ [CONTEXT] ImageUploadProvider 렌더링 완료:', {
    contextValueReady: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <ImageUploadContext.Provider value={contextValue}>
      {children}
    </ImageUploadContext.Provider>
  );
}

// 🛡️ 타입 안전한 Context Hook
function useImageUploadContext(): ImageUploadContextValue {
  const contextResult = useContext(ImageUploadContext);

  if (contextResult === null || contextResult === undefined) {
    throw new Error(
      'useImageUploadContext must be used within ImageUploadProvider. ' +
        'Make sure the component is wrapped with <ImageUploadProvider>.'
    );
  }

  return contextResult;
}

export { ImageUploadProvider, useImageUploadContext };
export type { ImageUploadContextValue };
