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
  uploadedImages: string[];
  selectedFileNames: string[];
  uploading: Record<string, number>;
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>;
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  hasActiveUploads: boolean;
  isMobileDevice: boolean;

  selectedSliderIndices: number[];
  isImageSelectedForSlider: (imageIndex: number) => boolean;

  handleFilesDropped: (files: File[]) => void;
  handleFileSelectClick: () => void;
  handleFileChange: (files: FileList) => void;

  handleDeleteButtonClick: (index: number, name: string) => void;
  handleDeleteConfirm: () => void;
  handleDeleteCancel: () => void;
  handleImageTouch: (index: number) => void;

  mainImageHandlers: MainImageHandlers | null;

  fileSelectButtonRef: React.RefObject<FileSelectButtonRef>;
}

const ImageUploadContext = createContext<ImageUploadContextValue | null>(null);

interface ImageUploadProviderProps {
  children: ReactNode;
}

function ImageUploadProvider({
  children,
}: ImageUploadProviderProps): React.ReactNode {
  console.log('🏗️ [CONTEXT] 단순화된 ImageUploadProvider 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
    simplifiedVersion: true,
  });

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

  const blogMediaIntegrationResult = useBlogMediaStepIntegration();
  const { currentFormValues: integrationFormValues } =
    blogMediaIntegrationResult;
  const { selectedSliderIndices = [] } = integrationFormValues;

  console.log('🎯 [CONTEXT] 슬라이더 선택 상태 확인 - 단순화된 방식:', {
    selectedSliderIndices,
    selectedCount: selectedSliderIndices.length,
    directAccess: true,
    timestamp: new Date().toLocaleTimeString(),
  });

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

  const checkIsImageSelectedForSlider = (imageIndex: number): boolean => {
    const isValidIndex = typeof imageIndex === 'number' && imageIndex >= 0;

    if (!isValidIndex) {
      console.log('⚠️ [CONTEXT] 유효하지 않은 이미지 인덱스:', {
        imageIndex,
      });
      return false;
    }

    const isSelected = selectedSliderIndices.includes(imageIndex);

    console.log('🔍 [CONTEXT] 슬라이더 선택 상태 확인 - 직접 체크:', {
      imageIndex,
      isSelected,
      selectedSliderIndices,
      directCheck: true,
    });

    return isSelected;
  };

  const stableMainImageHandlers = useMemo(() => {
    const {
      handleMainImageSet: handleMainImageSetAction,
      handleMainImageCancel: handleMainImageCancelAction,
      checkIsMainImage: checkIsMainImageFunction,
      checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
    } = imageUploadHandlersResult;

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

    const validHandlers: MainImageHandlers = {
      onMainImageSet: handleMainImageSetAction,
      onMainImageCancel: handleMainImageCancelAction,
      checkIsMainImage: checkIsMainImageFunction,
      checkCanSetAsMainImage: checkCanSetAsMainImageFunction,
    };

    return validHandlers;
  }, [
    imageUploadHandlersResult.handleMainImageSet,
    imageUploadHandlersResult.handleMainImageCancel,
    imageUploadHandlersResult.checkIsMainImage,
    imageUploadHandlersResult.checkCanSetAsMainImage,
  ]);

  const contextValue = useMemo<ImageUploadContextValue>(() => {
    const finalContextValue: ImageUploadContextValue = {
      uploadedImages: imageUploadHandlersResult.currentMediaFilesList,
      selectedFileNames: imageUploadHandlersResult.currentSelectedFileNames,
      uploading: imageUploadHandlersResult.uploading,
      uploadStatus: imageUploadHandlersResult.uploadStatus,
      deleteConfirmState: imageUploadHandlersResult.deleteConfirmState,
      duplicateMessageState: imageUploadHandlersResult.duplicateMessageState,
      touchActiveImages: imageUploadHandlersResult.touchActiveImages,
      hasActiveUploads: imageUploadHandlersResult.hasActiveUploads,
      isMobileDevice: imageUploadHandlersResult.isMobileDevice,

      selectedSliderIndices,
      isImageSelectedForSlider: checkIsImageSelectedForSlider,

      handleFilesDropped: imageUploadHandlersResult.handleFilesDropped,
      handleFileSelectClick: imageUploadHandlersResult.handleFileSelectClick,
      handleFileChange: imageUploadHandlersResult.handleFileChange,

      handleDeleteButtonClick:
        imageUploadHandlersResult.handleDeleteButtonClick,
      handleDeleteConfirm: imageUploadHandlersResult.handleDeleteConfirm,
      handleDeleteCancel: imageUploadHandlersResult.handleDeleteCancel,
      handleImageTouch: imageUploadHandlersResult.handleImageTouch,

      mainImageHandlers: stableMainImageHandlers,

      fileSelectButtonRef: imageUploadHandlersResult.fileSelectButtonRef,
    };

    console.log('🎯 [CONTEXT] 단순화된 Context 값 생성 완료:', {
      uploadedImagesCount: finalContextValue.uploadedImages.length,
      hasActiveUploads: finalContextValue.hasActiveUploads,
      hasMainImageHandlers: finalContextValue.mainImageHandlers !== null,
      selectedSliderCount: finalContextValue.selectedSliderIndices.length,
      simplifiedContextValue: true,
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
    imageUploadHandlersResult.handleFilesDropped,
    imageUploadHandlersResult.handleFileSelectClick,
    imageUploadHandlersResult.handleFileChange,
    imageUploadHandlersResult.handleDeleteButtonClick,
    imageUploadHandlersResult.handleDeleteConfirm,
    imageUploadHandlersResult.handleDeleteCancel,
    imageUploadHandlersResult.handleImageTouch,
    stableMainImageHandlers,
    imageUploadHandlersResult.fileSelectButtonRef,
  ]);

  console.log('✅ [CONTEXT] 단순화된 ImageUploadProvider 렌더링 완료:', {
    contextValueReady: true,
    simplifiedProviderCompleted: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <ImageUploadContext.Provider value={contextValue}>
      {children}
    </ImageUploadContext.Provider>
  );
}

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
