// 📁 blogMediaStep/imageUpload/hooks/useImageUploadHandlers.ts

import { useRef, useCallback } from 'react';
import { useMainImageManagement } from '../../mainImage/hooks/useMainImageManagement';
import { useMainImageValidation } from '../../mainImage/hooks/useMainImageValidation';
import { useFileUploadState } from './useFileUploadState';
import { useDuplicateFileHandler } from './useDuplicateFileHandler';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useMobileTouchState } from './useMobileTouchState';
import { useFileProcessing } from './useFileProcessing';
import type {
  FormValues,
  ToastItem,
} from '../../../../../../../store/shared/commonTypes';

interface ImageUploadHandlersProps {
  formValues: FormValues;
  uiState: {
    isMobile: boolean;
  };
  selectionState: {
    selectedFileNames: string[];
  };
  updateMediaValue: (files: string[]) => void;
  setMainImageValue: (imageUrl: string) => void;
  updateSelectedFileNames: (names: string[]) => void;
  showToastMessage: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => void;
  imageGalleryStore: any;
}

export const useImageUploadHandlers = ({
  formValues: currentFormValues,
  uiState: currentUiState,
  selectionState: currentSelectionState,
  updateMediaValue,
  setMainImageValue,
  updateSelectedFileNames,
  showToastMessage,
  imageGalleryStore: galleryStoreInstance,
}: ImageUploadHandlersProps) => {
  const { media: mediaFromForm } = currentFormValues;
  const currentMediaFilesList = mediaFromForm ?? [];
  const { isMobile: isMobileDevice } = currentUiState;
  const { selectedFileNames: currentSelectedFileNames } = currentSelectionState;

  const fileSelectButtonRef = useRef<any>(null);

  console.log(
    '🔧 [MAIN_HANDLERS] useImageUploadHandlers 초기화 - 중복훅호출제거:',
    {
      currentMediaFilesCount: currentMediaFilesList.length,
      currentSelectedFileNamesCount: currentSelectedFileNames.length,
      isMobileDevice,
      hasGalleryStore:
        galleryStoreInstance !== null && galleryStoreInstance !== undefined,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  // 🔧 메인 이미지 관리 훅들 - Props 방식으로 변경
  const mainImageManagementHook = useMainImageManagement({
    formValues: currentFormValues,
    setMainImageValue,
    addToast: showToastMessage,
  });

  const mainImageValidationHook = useMainImageValidation({
    formValues: currentFormValues,
  });

  const {
    setAsMainImageDirect: setImageAsMainImageDirectly,
    cancelMainImage: cancelCurrentMainImage,
    isMainImage: checkIsMainImageFunction,
  } = mainImageManagementHook;

  const {
    canSetAsMainImage: checkCanSetAsMainImageFunction,
    validateMainImageSelection: validateMainImageSelectionFunction,
  } = mainImageValidationHook;

  const uploadState = useFileUploadState();
  const duplicateHandler = useDuplicateFileHandler();
  const mobileTouchState = useMobileTouchState(isMobileDevice);

  // 🔧 메인 이미지 설정 핸들러 (React Hook Form 중심)
  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      const imageUrlPreview = imageUrl.slice(0, 30) + '...';

      console.log(
        '🏠 [MAIN_IMAGE_SET] 메인 이미지 설정 핸들러 호출 - 중복훅호출제거:',
        {
          imageIndex,
          imageUrlPreview,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      const validationResult = validateMainImageSelectionFunction(imageUrl);
      const { isValid: isValidSelection, message: validationMessage } =
        validationResult;

      if (!isValidSelection) {
        console.log('❌ [MAIN_IMAGE_SET] 메인 이미지 설정 불가능:', {
          imageIndex,
          imageUrlPreview,
          validationMessage,
        });

        showToastMessage({
          title: '메인 이미지 설정 불가',
          description: validationMessage ?? '메인 이미지로 설정할 수 없습니다.',
          color: 'warning',
        });
        return;
      }

      setImageAsMainImageDirectly(imageIndex);

      console.log(
        '✅ [MAIN_IMAGE_SET] 메인 이미지 설정 완료 (자동 동기화 대기):',
        {
          imageIndex,
          imageUrlPreview,
          reactHookFormUpdated: true,
          zustandAutoSyncPending: true,
        }
      );
    },
    [
      validateMainImageSelectionFunction,
      setImageAsMainImageDirectly,
      showToastMessage,
    ]
  );

  // 🔧 메인 이미지 해제 핸들러 (React Hook Form 중심)
  const handleMainImageCancel = useCallback(() => {
    console.log(
      '❌ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 핸들러 호출 - 중복훅호출제거'
    );

    cancelCurrentMainImage();

    console.log(
      '✅ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 완료 (자동 동기화 대기):',
      {
        reactHookFormUpdated: true,
        zustandAutoSyncPending: true,
      }
    );
  }, [cancelCurrentMainImage]);

  // 🔧 삭제 액션 핸들러 (React Hook Form 중심)
  const handleDeleteAction = useCallback(
    (imageIndex: number, imageName: string) => {
      console.log('✅ [DELETE_ACTION] 실제 삭제 처리 - 중복훅호출제거:', {
        imageIndex,
        imageName,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        const safeCurrentMediaFiles = currentMediaFilesList ?? [];
        const safeCurrentSelectedFileNames = currentSelectedFileNames ?? [];

        const updatedMediaFiles = safeCurrentMediaFiles.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );
        const updatedFileNames = safeCurrentSelectedFileNames.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );

        updateMediaValue(updatedMediaFiles);
        updateSelectedFileNames(updatedFileNames);

        showToastMessage({
          title: '이미지 삭제 완료',
          description: `"${imageName}" 이미지가 삭제되었습니다.`,
          color: 'success',
        });

        console.log('✅ [DELETE] 이미지 삭제 완료 (자동 동기화 대기):', {
          imageName,
          remainingMediaCount: updatedMediaFiles.length,
          reactHookFormUpdated: true,
          zustandAutoSyncPending: true,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (deleteError) {
        console.error('❌ [DELETE_ERROR] 삭제 처리 중 오류:', {
          imageName,
          error: deleteError,
        });

        showToastMessage({
          title: '삭제 실패',
          description: '이미지 삭제 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [
      currentMediaFilesList,
      currentSelectedFileNames,
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
    ]
  );

  const deleteConfirmation = useDeleteConfirmation(handleDeleteAction);

  const fileProcessing = useFileProcessing(
    currentMediaFilesList,
    currentSelectedFileNames ?? [],
    {
      updateMediaValue,
      updateSelectedFileNames,
      showToastMessage,
      showDuplicateMessage: duplicateHandler.showDuplicateMessage,
      startFileUpload: uploadState.startFileUpload,
      updateFileProgress: uploadState.updateFileProgress,
      completeFileUpload: uploadState.completeFileUpload,
      failFileUpload: uploadState.failFileUpload,
    }
  );

  const handleFileSelectClick = useCallback(() => {
    const hasActiveUploads = uploadState.hasActiveUploads;

    console.log('🚨 [CLICK] handleFileSelectClick:', {
      hasActiveUploads,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (hasActiveUploads) {
      console.log('⚠️ [CLICK] 업로드 중이므로 파일 선택 무시');
      showToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    const { current: fileSelectButtonElement } = fileSelectButtonRef;
    const hasClickFunction = fileSelectButtonElement?.clickFileInput;

    if (hasClickFunction) {
      fileSelectButtonElement.clickFileInput();
    }
  }, [uploadState.hasActiveUploads, showToastMessage]);

  console.log(
    '✅ [MAIN_HANDLERS] useImageUploadHandlers 초기화 완료 - 중복훅호출제거:',
    {
      hasMainImageManagement:
        mainImageManagementHook !== null &&
        mainImageManagementHook !== undefined,
      hasMainImageValidation:
        mainImageValidationHook !== null &&
        mainImageValidationHook !== undefined,
      uploadingCount: Object.keys(uploadState.uploading).length,
      hasGalleryStore:
        galleryStoreInstance !== null && galleryStoreInstance !== undefined,
      reactHookFormCentricSync: true,
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  return {
    // 기존 상태들
    uploading: uploadState.uploading,
    uploadStatus: uploadState.uploadStatus,
    hasActiveUploads: uploadState.hasActiveUploads,
    deleteConfirmState: deleteConfirmation.deleteConfirmState,
    duplicateMessageState: duplicateHandler.duplicateMessageState,
    touchActiveImages: mobileTouchState.touchActiveImages,

    // Refs
    fileSelectButtonRef,

    // 기존 핸들러들
    handleFiles: fileProcessing.processFiles,
    handleFilesDropped: fileProcessing.handleFilesDropped,
    handleFileSelectClick,
    handleFileChange: fileProcessing.handleFileChange,
    handleDeleteButtonClick: deleteConfirmation.showDeleteConfirmation,
    handleDeleteConfirm: deleteConfirmation.confirmDelete,
    handleDeleteCancel: deleteConfirmation.cancelDelete,
    handleImageTouch: mobileTouchState.handleImageTouch,

    // 메인 이미지 관리 핸들러들
    handleMainImageSet,
    handleMainImageCancel,

    // 메인 이미지 상태 체크 함수들
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,

    // 기타 상태
    currentMediaFilesList,
    currentSelectedFileNames: currentSelectedFileNames ?? [],
    isMobileDevice,

    // 갤러리 스토어 참조만 유지
    imageGalleryStore: galleryStoreInstance,
  };
};
