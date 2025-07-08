// blogMediaStep/imageUpload/hooks/useImageUploadHandlers.ts

import { useRef, useCallback } from 'react';
import { useBlogMediaStepState } from '../../hooks/useBlogMediaStepState';
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

  console.log('🔧 [MAIN_HANDLERS] useImageUploadHandlers 초기화:', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  const uploadState = useFileUploadState();
  const duplicateHandler = useDuplicateFileHandler();
  const mobileTouchState = useMobileTouchState(isMobileDevice);

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

  return {
    // 상태들
    uploading: uploadState.uploading,
    uploadStatus: uploadState.uploadStatus,
    hasActiveUploads: uploadState.hasActiveUploads,
    deleteConfirmState: deleteConfirmation.deleteConfirmState,
    duplicateMessageState: duplicateHandler.duplicateMessageState,
    touchActiveImages: mobileTouchState.touchActiveImages,

    // Refs
    fileSelectButtonRef,

    // 핸들러들
    handleFiles: fileProcessing.processFiles,
    handleFilesDropped: fileProcessing.handleFilesDropped,
    handleFileSelectClick,
    handleFileChange: fileProcessing.handleFileChange,
    handleDeleteButtonClick: deleteConfirmation.showDeleteConfirmation,
    handleDeleteConfirm: deleteConfirmation.confirmDelete,
    handleDeleteCancel: deleteConfirmation.cancelDelete,
    handleImageTouch: mobileTouchState.handleImageTouch,

    // 기타 상태
    currentMediaFilesList,
    currentSelectedFileNames,
    isMobileDevice,
  };
};
