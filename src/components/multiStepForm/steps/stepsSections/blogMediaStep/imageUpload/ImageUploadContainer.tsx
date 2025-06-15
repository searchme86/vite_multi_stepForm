// blogMediaStep/imageUpload/ImageUploadContainer.tsx

import React, { useRef, useCallback, useEffect } from 'react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageUpload } from './hooks/useImageUpload';
import { useUploadProgress } from './hooks/useUploadProgress';
import { useFileValidation } from './hooks/useFileValidation';

import FileDropZone from './parts/FileDropZone';
import FileSelectButton, {
  type FileSelectButtonRef,
} from './parts/FileSelectButton';
import UploadProgressList from './parts/UploadProgressList';
import FileValidationMessage from './parts/FileValidationMessage';

function ImageUploadContainer(): React.ReactNode {
  console.log('🔧 ImageUploadContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
  });

  const {
    formValues: currentFormValues,
    uiState: currentUiState,
    setMediaValue: updateMediaValue,
    setSelectedFileNames: updateSelectedFileNames,
    addToast: showToastMessage,
    selectionState: currentSelectionState,
  } = useBlogMediaStepState();

  const { media: currentMediaFilesList } = currentFormValues;
  const { dragActive: isDragActive, isMobile: isMobileDevice } = currentUiState;
  const { selectedFileNames: currentSelectedFileNames } = currentSelectionState;

  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  const {
    progressState: uploadProgressState,
    startFileUpload: initializeFileUpload,
    updateProgress: updateUploadProgress,
    setFileStatus: updateFileStatus,
    resetUploadState: clearUploadState,
    isUploading: isCurrentlyUploading,
    hasActiveUploads: hasOngoingUploads,
    getUploadSummary: retrieveUploadSummary,
  } = useUploadProgress();

  const {
    uploading: currentlyUploadingFiles,
    uploadStatus: fileUploadStatuses,
  } = uploadProgressState;

  const {
    validationState: fileValidationState,
    validateFiles: performFileValidation,
    clearValidationResults: resetValidationResults,
  } = useFileValidation();

  const imageUploadHandler = useImageUpload({
    onProgress: useCallback(
      (fileIdentifier: string, uploadProgress: number) => {
        console.log('📊 업로드 진행률 업데이트:', {
          fileIdentifier,
          uploadProgress,
        });
        updateUploadProgress(fileIdentifier, uploadProgress);
      },
      [updateUploadProgress]
    ),

    onStatusChange: useCallback(
      (
        targetFileName: string,
        newStatus: 'uploading' | 'success' | 'error'
      ) => {
        console.log('🔄 업로드 상태 변경:', { targetFileName, newStatus });
        updateFileStatus(targetFileName, newStatus);
      },
      [updateFileStatus]
    ),

    onComplete: useCallback(
      (uploadResult: string, completedFileName: string) => {
        console.log('✅ 파일 업로드 완료:', {
          completedFileName,
          resultLength: uploadResult.length,
        });

        try {
          const updatedMediaFilesList = [
            ...currentMediaFilesList,
            uploadResult,
          ];
          updateMediaValue(updatedMediaFilesList);

          const updatedSelectedFileNames = [
            ...currentSelectedFileNames,
            completedFileName,
          ];
          updateSelectedFileNames(updatedSelectedFileNames);

          showToastMessage({
            title: '업로드 완료',
            description: `${completedFileName} 파일이 성공적으로 업로드되었습니다.`,
            color: 'success',
          });

          console.log('📁 미디어 파일 추가 완료:', {
            completedFileName,
            totalFiles: updatedMediaFilesList.length,
          });
        } catch (uploadError) {
          console.error('❌ 파일 추가 중 오류:', {
            completedFileName,
            uploadError,
          });

          showToastMessage({
            title: '파일 추가 실패',
            description: `${completedFileName} 파일을 추가하는 중 오류가 발생했습니다.`,
            color: 'danger',
          });
        }
      },
      [
        currentMediaFilesList,
        updateMediaValue,
        updateSelectedFileNames,
        showToastMessage,
        currentSelectedFileNames,
      ]
    ),

    onError: useCallback(
      (failedFileName: string, errorMessage: string) => {
        console.error('❌ 업로드 에러:', { failedFileName, errorMessage });

        showToastMessage({
          title: '업로드 실패',
          description: errorMessage,
          color: 'danger',
        });
      },
      [showToastMessage]
    ),
  });

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      console.log('🔧 handleFilesDropped 호출:', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((droppedFile) => droppedFile.name),
      });

      if (droppedFilesList.length === 0) {
        console.log('⚠️ 드롭된 파일이 없음');
        return;
      }

      resetValidationResults();
      handleFileSelection(droppedFilesList);
    },
    [resetValidationResults]
  );

  const handleFileSelection = useCallback(
    async (selectedFilesList: File[]) => {
      console.log('🔧 handleFileSelection 호출:', {
        fileCount: selectedFilesList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (selectedFilesList.length === 0) {
        console.log('⚠️ 선택된 파일이 없음');
        return;
      }

      try {
        const fileListForValidation = {
          length: selectedFilesList.length,
          item: (itemIndex: number) => selectedFilesList[itemIndex] || null,
          [Symbol.iterator]: function* () {
            for (
              let iteratorIndex = 0;
              iteratorIndex < selectedFilesList.length;
              iteratorIndex++
            ) {
              yield selectedFilesList[iteratorIndex];
            }
          },
        } as FileList;

        console.log('🔍 파일 검증 시작:', {
          fileCount: selectedFilesList.length,
        });

        const { validFiles: validatedFiles, invalidFiles: rejectedFiles } =
          await performFileValidation(fileListForValidation);

        console.log('📊 파일 검증 완료:', {
          totalFiles: selectedFilesList.length,
          validFiles: validatedFiles.length,
          invalidFiles: rejectedFiles.length,
        });

        if (rejectedFiles.length > 0) {
          showToastMessage({
            title: '파일 검증 실패',
            description: `${rejectedFiles.length}개의 파일이 지원되지 않거나 크기 제한을 초과합니다.`,
            color: 'warning',
          });
        }

        if (validatedFiles.length > 0) {
          console.log('📤 유효한 파일들 업로드 시작:', {
            validFileCount: validatedFiles.length,
            fileNames: validatedFiles.map((validFile) => validFile.name),
          });

          validatedFiles.forEach((validFile) => {
            const uniqueFileId = `file-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`;
            initializeFileUpload(uniqueFileId, validFile.name);
          });

          const fileListForUpload = {
            length: validatedFiles.length,
            item: (itemIndex: number) => validatedFiles[itemIndex] || null,
            [Symbol.iterator]: function* () {
              for (
                let iteratorIndex = 0;
                iteratorIndex < validatedFiles.length;
                iteratorIndex++
              ) {
                yield validatedFiles[iteratorIndex];
              }
            },
          } as FileList;

          imageUploadHandler.handleFiles(fileListForUpload);

          showToastMessage({
            title: '업로드 시작',
            description: `${validatedFiles.length}개의 파일 업로드를 시작합니다.`,
            color: 'primary',
          });
        }
      } catch (selectionError) {
        console.error('❌ 파일 선택 처리 중 오류:', selectionError);

        showToastMessage({
          title: '파일 처리 오류',
          description: '파일을 처리하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [
      performFileValidation,
      showToastMessage,
      initializeFileUpload,
      imageUploadHandler,
    ]
  );

  const handleFileSelectClick = useCallback(() => {
    console.log('🔧 handleFileSelectClick 호출');

    if (isCurrentlyUploading) {
      console.log('⚠️ 업로드 중이므로 파일 선택 무시');
      showToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    fileSelectButtonRef.current?.clickFileInput();
  }, [isCurrentlyUploading, showToastMessage]);

  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🔧 handleFileChange 호출:', {
        fileCount: changedFileList.length,
      });

      if (changedFileList.length > 0) {
        const filesArray = Array.from(changedFileList);
        handleFileSelection(filesArray);
      }
    },
    [handleFileSelection]
  );

  const handleDismissValidationMessage = useCallback(
    (dismissedFileName: string) => {
      console.log('🔧 handleDismissValidationMessage 호출:', {
        dismissedFileName,
      });
      resetValidationResults();
    },
    [resetValidationResults]
  );

  useEffect(() => {
    const uploadSummary = retrieveUploadSummary();

    console.log('📈 업로드 상태 업데이트:', {
      ...uploadSummary,
      hasOngoingUploads,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (!hasOngoingUploads && uploadSummary.completed > 0) {
      console.log('🎉 모든 업로드 완료, 5초 후 상태 정리');

      setTimeout(() => {
        clearUploadState();
        console.log('🧹 업로드 상태 정리 완료');
      }, 5000);
    }
  }, [hasOngoingUploads, retrieveUploadSummary, clearUploadState]);

  console.log('📊 ImageUploadContainer 현재 상태:', {
    currentMediaCount: currentMediaFilesList.length,
    isCurrentlyUploading,
    hasOngoingUploads,
    validationIssues: Object.keys(fileValidationState.validationResults).length,
    isDragActive,
    isMobileDevice,
  });

  const hasValidationErrors =
    Object.keys(fileValidationState.validationResults).length > 0;
  const hasActiveUploadProgress =
    hasOngoingUploads || Object.keys(currentlyUploadingFiles).length > 0;

  return (
    <div
      className="space-y-4"
      role="region"
      aria-labelledby="image-upload-section"
      aria-describedby="image-upload-description"
    >
      <h2 id="image-upload-section" className="sr-only">
        이미지 업로드 섹션
      </h2>
      <p id="image-upload-description" className="sr-only">
        드래그 앤 드롭 또는 파일 선택 버튼을 통해 이미지를 업로드할 수 있습니다.
      </p>

      <FileDropZone
        dragActive={isDragActive}
        setDragActive={() => {}}
        onFilesDropped={handleFilesDropped}
        onFileSelectClick={handleFileSelectClick}
        isUploading={isCurrentlyUploading}
        className="transition-all duration-200"
      />

      <FileSelectButton
        ref={fileSelectButtonRef}
        onFileChange={handleFileChange}
        multiple={true}
        disabled={isCurrentlyUploading}
      />

      {hasValidationErrors && (
        <div role="alert" aria-labelledby="validation-errors-heading">
          <h3 id="validation-errors-heading" className="sr-only">
            파일 검증 오류
          </h3>
          <FileValidationMessage
            validationResults={fileValidationState.validationResults}
            showSuccessMessages={false}
            maxMessages={5}
            onDismiss={handleDismissValidationMessage}
            className="mt-4"
          />
        </div>
      )}

      {hasActiveUploadProgress && (
        <div
          role="status"
          aria-labelledby="upload-progress-heading"
          aria-live="polite"
        >
          <h3 id="upload-progress-heading" className="sr-only">
            업로드 진행 상황
          </h3>
          <UploadProgressList
            uploading={currentlyUploadingFiles}
            uploadStatus={fileUploadStatuses}
            className="mt-4"
            showCompleted={true}
            maxItems={10}
          />
        </div>
      )}

      {isMobileDevice && (
        <div
          className="p-3 text-sm text-blue-700 rounded-lg bg-blue-50"
          role="note"
          aria-labelledby="mobile-tip-heading"
        >
          <p id="mobile-tip-heading" className="font-medium">
            모바일 팁:
          </p>
          <p>
            여러 파일을 한 번에 선택하려면 파일 선택 시 여러 개를 선택하세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageUploadContainer;
