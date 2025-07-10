// blogMediaStep/imageUpload/hooks/useImageUploadHandlers.ts

import { useRef, useCallback } from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
import { useMainImageManagement } from '../../mainImage/hooks/useMainImageManagement';
import { useMainImageValidation } from '../../mainImage/hooks/useMainImageValidation';
import { useFileUploadState } from './useFileUploadState';
import { useDuplicateFileHandler } from './useDuplicateFileHandler';
import { useDeleteConfirmation } from './useDeleteConfirmation';
import { useMobileTouchState } from './useMobileTouchState';
import { useFileProcessing } from './useFileProcessing';

export const useImageUploadHandlers = () => {
  const {
    formValues: currentFormValues,
    uiState: currentUiState,
    setMediaValue: updateMediaValue,
    setSelectedFileNames: updateSelectedFileNames,
    addToast: showToastMessage,
    selectionState: currentSelectionState,
  } = useBlogMediaStepState();

  const { media: currentMediaFilesList } = currentFormValues;
  const { isMobile: isMobileDevice } = currentUiState;
  const { selectedFileNames: currentSelectedFileNames } = currentSelectionState;

  const fileSelectButtonRef = useRef<any>(null);

  console.log('🔧 [MAIN_HANDLERS] useImageUploadHandlers 초기화 - Phase1과2:', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ Phase1: 메인 이미지 관리 로직 추가
  const mainImageManagementHook = useMainImageManagement();
  const mainImageValidationHook = useMainImageValidation();

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

  // ✅ Phase2: 메인 이미지 설정 핸들러 추가
  const handleMainImageSet = useCallback(
    (imageIndex: number, imageUrl: string) => {
      const imageUrlPreview = imageUrl.slice(0, 30) + '...';

      console.log('🏠 [MAIN_IMAGE_SET] 메인 이미지 설정 핸들러 호출:', {
        imageIndex,
        imageUrlPreview,
        timestamp: new Date().toLocaleTimeString(),
      });

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

      console.log('✅ [MAIN_IMAGE_SET] 메인 이미지 설정 완료:', {
        imageIndex,
        imageUrlPreview,
      });
    },
    [
      validateMainImageSelectionFunction,
      setImageAsMainImageDirectly,
      showToastMessage,
    ]
  );

  // ✅ Phase2: 메인 이미지 해제 핸들러 추가
  const handleMainImageCancel = useCallback(() => {
    console.log('❌ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 핸들러 호출');

    cancelCurrentMainImage();

    console.log('✅ [MAIN_IMAGE_CANCEL] 메인 이미지 해제 완료');
  }, [cancelCurrentMainImage]);

  // ✅ 기존 삭제 액션 핸들러
  const handleDeleteAction = useCallback(
    (imageIndex: number, imageName: string) => {
      console.log('✅ [DELETE_ACTION] 실제 삭제 처리:', {
        imageIndex,
        imageName,
        timestamp: new Date().toLocaleTimeString(),
      });

      try {
        const updatedMediaFiles = currentMediaFilesList.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );
        const updatedFileNames = currentSelectedFileNames.filter(
          (_, filterIndex) => filterIndex !== imageIndex
        );

        updateMediaValue(updatedMediaFiles);
        updateSelectedFileNames(updatedFileNames);

        showToastMessage({
          title: '이미지 삭제 완료',
          description: `"${imageName}" 이미지가 삭제되었습니다.`,
          color: 'success',
        });

        console.log('✅ [DELETE] 이미지 삭제 완료:', {
          imageName,
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
    currentSelectedFileNames,
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
    '✅ [MAIN_HANDLERS] useImageUploadHandlers 초기화 완료 - Phase1과2:',
    {
      hasMainImageManagement: mainImageManagementHook ? true : false,
      hasMainImageValidation: mainImageValidationHook ? true : false,
      uploadingCount: Object.keys(uploadState.uploading).length,
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

    // ✅ Phase2: 새로 추가된 메인 이미지 관리 핸들러들
    handleMainImageSet,
    handleMainImageCancel,

    // ✅ Phase2: 메인 이미지 상태 체크 함수들
    checkIsMainImage: checkIsMainImageFunction,
    checkCanSetAsMainImage: checkCanSetAsMainImageFunction,

    // 기타 상태
    currentMediaFilesList,
    currentSelectedFileNames,
    isMobileDevice,
  };
};
