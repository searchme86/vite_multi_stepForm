// blogMediaStep/imageUpload/ImageUploadContainer.tsx [Key 중복 해결 + 디버깅용]

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

// 🔧 추가: 안전한 고유 ID 생성을 위한 카운터
let globalFileIdCounter = 0;

// 🔧 추가: 고유한 파일 ID 생성 함수
const generateSecureFileId = (fileNameForId: string): string => {
  const currentTimestamp = Date.now();
  const incrementedCounter = ++globalFileIdCounter;
  const randomIdentifier = Math.random().toString(36).substring(2, 9);
  const fileNameHash = fileNameForId.slice(0, 5).replace(/[^a-zA-Z0-9]/g, ''); // 파일명 일부 포함

  const secureFileId = `file-${currentTimestamp}-${incrementedCounter}-${randomIdentifier}-${fileNameHash}`;

  console.log('🆔 [DEBUG] 안전한 파일 ID 생성:', {
    fileNameForId: fileNameForId.slice(0, 20) + '...',
    secureFileId,
    counter: incrementedCounter,
    timestamp: new Date().toLocaleTimeString(),
  });

  return secureFileId;
};

function ImageUploadContainer(): React.ReactNode {
  const renderingId = Math.random().toString(36).substring(2, 7);

  console.log('🚀 [DEBUG] ImageUploadContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
    renderCount: renderingId,
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

  console.log('📊 [DEBUG] BlogMediaStepState 상태:', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    isDragActive,
    isMobileDevice,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  const {
    progressState: uploadProgressState,
    startFileUpload: initializeFileUpload,
    updateProgress: updateUploadProgress,
    setFileStatus: updateFileStatus,
    completeFileUpload: finalizeFileUpload,
    resetUploadState: clearUploadState,
    isUploading: isCurrentlyUploading,
    hasActiveUploads: hasOngoingUploads,
    getUploadSummary: retrieveUploadSummary,
  } = useUploadProgress();

  const {
    uploading: currentlyUploadingFiles,
    uploadStatus: fileUploadStatuses,
  } = uploadProgressState;

  const uploadingFilesKeys = Object.keys(currentlyUploadingFiles);
  const uploadStatusKeys = Object.keys(fileUploadStatuses);
  const { length: currentlyUploadingFilesCount } = uploadingFilesKeys;
  const { length: fileUploadStatusesCount } = uploadStatusKeys;

  console.log('📊 [DEBUG] UploadProgress 상태:', {
    uploadingFilesKeys,
    currentlyUploadingFilesCount,
    uploadStatusKeys,
    fileUploadStatusesCount,
    isCurrentlyUploading,
    hasOngoingUploads,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

  console.log('📊 [DEBUG] UploadProgress 상세 상태:', {
    currentlyUploadingFiles,
    fileUploadStatuses,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

  const {
    validationState: fileValidationState,
    validateFiles: performFileValidation,
    clearValidationResults: resetValidationResults,
  } = useFileValidation();

  const validationResultsKeys = Object.keys(
    fileValidationState.validationResults
  );
  const { length: validationResultsCount } = validationResultsKeys;
  const { isValidating: isCurrentlyValidating } = fileValidationState;

  console.log('📊 [DEBUG] FileValidation 상태:', {
    validationResultsCount,
    isCurrentlyValidating,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

  const imageUploadHandler = useImageUpload({
    onProgress: useCallback(
      (fileIdentifier: string, uploadProgress: number) => {
        console.log('📊 [DEBUG] onProgress 콜백 호출됨:', {
          fileIdentifier,
          uploadProgress,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
        });

        console.log('📊 [DEBUG] updateUploadProgress 호출 전:', {
          fileIdentifier,
          uploadProgress,
          timestamp: new Date().toLocaleTimeString(),
        });

        updateUploadProgress(fileIdentifier, uploadProgress);

        console.log('📊 [DEBUG] updateUploadProgress 호출 후:', {
          fileIdentifier,
          uploadProgress,
          timestamp: new Date().toLocaleTimeString(),
        });
      },
      [updateUploadProgress]
    ),

    onStatusChange: useCallback(
      (
        targetFileName: string,
        newStatus: 'uploading' | 'success' | 'error'
      ) => {
        console.log('🔄 [DEBUG] onStatusChange 콜백 호출됨:', {
          targetFileName,
          newStatus,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
        });

        console.log('🔄 [DEBUG] updateFileStatus 호출 전:', {
          targetFileName,
          newStatus,
          timestamp: new Date().toLocaleTimeString(),
        });

        updateFileStatus(targetFileName, newStatus);

        console.log('🔄 [DEBUG] updateFileStatus 호출 후:', {
          targetFileName,
          newStatus,
          timestamp: new Date().toLocaleTimeString(),
        });
      },
      [updateFileStatus]
    ),

    onComplete: useCallback(
      (
        uploadResult: string,
        completedFileName: string,
        completedFileId: string
      ) => {
        console.log('🎯 [DEBUG] *** onComplete 콜백 호출됨 (중요!) ***:', {
          completedFileName,
          completedFileId,
          resultLength: uploadResult.length,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
        });

        try {
          console.log('📝 [DEBUG] 미디어 파일 추가 시작:', {
            completedFileName,
            completedFileId,
            currentMediaFilesCount: currentMediaFilesList.length,
            timestamp: new Date().toLocaleTimeString(),
          });

          const updatedMediaFilesList = [
            ...currentMediaFilesList,
            uploadResult,
          ];

          console.log('📝 [DEBUG] updateMediaValue 호출 전:', {
            completedFileName,
            completedFileId,
            newMediaFilesCount: updatedMediaFilesList.length,
            timestamp: new Date().toLocaleTimeString(),
          });

          updateMediaValue(updatedMediaFilesList);

          console.log('📝 [DEBUG] updateMediaValue 호출 후:', {
            completedFileName,
            completedFileId,
            timestamp: new Date().toLocaleTimeString(),
          });

          const updatedSelectedFileNames = [
            ...currentSelectedFileNames,
            completedFileName,
          ];

          console.log('📝 [DEBUG] updateSelectedFileNames 호출 전:', {
            completedFileName,
            completedFileId,
            newSelectedFileNamesCount: updatedSelectedFileNames.length,
            timestamp: new Date().toLocaleTimeString(),
          });

          updateSelectedFileNames(updatedSelectedFileNames);

          console.log('📝 [DEBUG] updateSelectedFileNames 호출 후:', {
            completedFileName,
            completedFileId,
            timestamp: new Date().toLocaleTimeString(),
          });

          // 🔧 핵심 추가: 업로드 완료 처리로 uploading 상태에서 fileId 제거
          console.log(
            '🎯 [DEBUG] *** finalizeFileUpload 호출 전 (핵심!) ***:',
            {
              completedFileName,
              completedFileId,
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          finalizeFileUpload(completedFileId);

          console.log(
            '🎯 [DEBUG] *** finalizeFileUpload 호출 후 (핵심!) ***:',
            {
              completedFileName,
              completedFileId,
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          console.log('🔔 [DEBUG] 성공 토스트 메시지 표시 전:', {
            completedFileName,
            completedFileId,
            timestamp: new Date().toLocaleTimeString(),
          });

          showToastMessage({
            title: '업로드 완료',
            description: `${completedFileName} 파일이 성공적으로 업로드되었습니다.`,
            color: 'success',
          });

          console.log('🔔 [DEBUG] 성공 토스트 메시지 표시 후:', {
            completedFileName,
            completedFileId,
            timestamp: new Date().toLocaleTimeString(),
          });

          console.log('✅ [DEBUG] onComplete 처리 완료:', {
            completedFileName,
            completedFileId,
            totalFiles: updatedMediaFilesList.length,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (uploadError) {
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : 'Unknown error';

          console.error('❌ [DEBUG] onComplete 처리 중 에러:', {
            completedFileName,
            completedFileId,
            uploadError,
            errorMessage,
            timestamp: new Date().toLocaleTimeString(),
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
        finalizeFileUpload,
      ]
    ),

    onError: useCallback(
      (failedFileName: string, errorMessage: string) => {
        console.error('❌ [DEBUG] onError 콜백 호출됨:', {
          failedFileName,
          errorMessage,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
        });

        showToastMessage({
          title: '업로드 실패',
          description: errorMessage,
          color: 'danger',
        });

        console.error('❌ [DEBUG] 에러 토스트 메시지 표시 완료:', {
          failedFileName,
          errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        });
      },
      [showToastMessage]
    ),
  });

  const { handleFiles: processFiles } = imageUploadHandler;
  const hasImageUploadHandlerFiles = !!processFiles;

  console.log('🔧 [DEBUG] imageUploadHandler 생성 완료:', {
    hasHandleFiles: hasImageUploadHandlerFiles,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      const { length: droppedFilesCount } = droppedFilesList;
      const droppedFileNames = droppedFilesList.map((droppedFile) => {
        const { name: fileName } = droppedFile;
        return fileName;
      });

      console.log('📂 [DEBUG] handleFilesDropped 호출:', {
        fileCount: droppedFilesCount,
        fileNames: droppedFileNames,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (droppedFilesCount === 0) {
        console.log('⚠️ [DEBUG] 드롭된 파일이 없음');
        return;
      }

      resetValidationResults();
      handleFileSelection(droppedFilesList);
    },
    [resetValidationResults]
  );

  const handleFileSelection = useCallback(
    async (selectedFilesList: File[]) => {
      const { length: selectedFilesCount } = selectedFilesList;

      console.log('📁 [DEBUG] handleFileSelection 시작:', {
        fileCount: selectedFilesCount,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (selectedFilesCount === 0) {
        console.log('⚠️ [DEBUG] 선택된 파일이 없음');
        return;
      }

      try {
        const fileListForValidation = {
          length: selectedFilesCount,
          item: (itemIndex: number) => selectedFilesList[itemIndex] || null,
          [Symbol.iterator]: function* () {
            for (
              let iteratorIndex = 0;
              iteratorIndex < selectedFilesCount;
              iteratorIndex++
            ) {
              yield selectedFilesList[iteratorIndex];
            }
          },
        } as FileList;

        console.log('🔍 [DEBUG] 파일 검증 시작:', {
          fileCount: selectedFilesCount,
          timestamp: new Date().toLocaleTimeString(),
        });

        const { validFiles: validatedFiles, invalidFiles: rejectedFiles } =
          await performFileValidation(fileListForValidation);

        const { length: validatedFilesCount } = validatedFiles;
        const { length: rejectedFilesCount } = rejectedFiles;

        console.log('📊 [DEBUG] 파일 검증 완료:', {
          totalFiles: selectedFilesCount,
          validFiles: validatedFilesCount,
          invalidFiles: rejectedFilesCount,
          timestamp: new Date().toLocaleTimeString(),
        });

        if (rejectedFilesCount > 0) {
          showToastMessage({
            title: '파일 검증 실패',
            description: `${rejectedFilesCount}개의 파일이 지원되지 않거나 크기 제한을 초과합니다.`,
            color: 'warning',
          });
        }

        if (validatedFilesCount > 0) {
          const validatedFileNames = validatedFiles.map((validFile) => {
            const { name: fileName } = validFile;
            return fileName;
          });

          console.log('📤 [DEBUG] 유효한 파일들 업로드 시작:', {
            validFileCount: validatedFilesCount,
            fileNames: validatedFileNames,
            timestamp: new Date().toLocaleTimeString(),
          });

          console.log('🆔 [DEBUG] 파일별 ID 생성 및 업로드 초기화 시작:');

          // 🔧 안전한 파일 ID 생성으로 key 중복 방지
          validatedFiles.forEach((validFile, fileIndex) => {
            const { name: validFileName } = validFile;
            const secureUniqueFileId = generateSecureFileId(validFileName);

            console.log('🆔 [DEBUG] 안전한 개별 파일 ID 생성:', {
              fileIndex,
              validFileName,
              secureUniqueFileId,
              globalCounter: globalFileIdCounter,
              timestamp: new Date().toLocaleTimeString(),
            });

            console.log('🔄 [DEBUG] initializeFileUpload 호출 전:', {
              secureUniqueFileId,
              validFileName,
              timestamp: new Date().toLocaleTimeString(),
            });

            initializeFileUpload(secureUniqueFileId, validFileName);

            console.log('🔄 [DEBUG] initializeFileUpload 호출 후:', {
              secureUniqueFileId,
              validFileName,
              timestamp: new Date().toLocaleTimeString(),
            });
          });

          const fileListForUpload = {
            length: validatedFilesCount,
            item: (itemIndex: number) => validatedFiles[itemIndex] || null,
            [Symbol.iterator]: function* () {
              for (
                let iteratorIndex = 0;
                iteratorIndex < validatedFilesCount;
                iteratorIndex++
              ) {
                yield validatedFiles[iteratorIndex];
              }
            },
          } as FileList;

          console.log('🚀 [DEBUG] imageUploadHandler.handleFiles 호출 전:', {
            validatedFilesCount,
            timestamp: new Date().toLocaleTimeString(),
          });

          imageUploadHandler.handleFiles(fileListForUpload);

          console.log('🚀 [DEBUG] imageUploadHandler.handleFiles 호출 후:', {
            validatedFilesCount,
            timestamp: new Date().toLocaleTimeString(),
          });

          showToastMessage({
            title: '업로드 시작',
            description: `${validatedFilesCount}개의 파일 업로드를 시작합니다.`,
            color: 'primary',
          });
        }
      } catch (selectionError) {
        const errorMessage =
          selectionError instanceof Error
            ? selectionError.message
            : 'Unknown error';

        console.error('❌ [DEBUG] 파일 선택 처리 중 오류:', {
          selectionError,
          errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        });

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
    console.log('🖱️ [DEBUG] handleFileSelectClick 호출:', {
      isCurrentlyUploading,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (isCurrentlyUploading) {
      console.log('⚠️ [DEBUG] 업로드 중이므로 파일 선택 무시');
      showToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    const { current: fileSelectButtonElement } = fileSelectButtonRef;
    const clickFileInputFunction =
      fileSelectButtonElement?.clickFileInput || null;

    if (clickFileInputFunction) {
      clickFileInputFunction();
    } else {
      console.warn('⚠️ [DEBUG] fileSelectButton ref가 없음');
    }
  }, [isCurrentlyUploading, showToastMessage]);

  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      const { length: changedFileCount } = changedFileList;

      console.log('📁 [DEBUG] handleFileChange 호출:', {
        fileCount: changedFileCount,
        timestamp: new Date().toLocaleTimeString(),
      });

      if (changedFileCount > 0) {
        const filesArray = Array.from(changedFileList);
        handleFileSelection(filesArray);
      }
    },
    [handleFileSelection]
  );

  const handleDismissValidationMessage = useCallback(
    (dismissedFileName: string) => {
      console.log('🗑️ [DEBUG] handleDismissValidationMessage 호출:', {
        dismissedFileName,
        timestamp: new Date().toLocaleTimeString(),
      });
      resetValidationResults();
    },
    [resetValidationResults]
  );

  // 🔧 상태 변화 추적을 위한 useEffect 추가
  useEffect(() => {
    console.log('📊 [DEBUG] *** 업로드 상태 변화 감지 ***:', {
      hasOngoingUploads,
      isCurrentlyUploading,
      uploadingFilesKeys,
      currentlyUploadingFilesCount,
      renderingId,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [
    hasOngoingUploads,
    isCurrentlyUploading,
    currentlyUploadingFiles,
    renderingId,
  ]);

  useEffect(() => {
    const uploadSummary = retrieveUploadSummary();

    console.log('📈 [DEBUG] 업로드 요약 상태 업데이트:', {
      uploadSummary,
      hasOngoingUploads,
      renderingId,
      timestamp: new Date().toLocaleTimeString(),
    });

    const { completed: completedUploadsCount } = uploadSummary;
    const shouldClearState = !hasOngoingUploads && completedUploadsCount > 0;

    console.log('🧹 [DEBUG] 상태 정리 조건 확인:', {
      hasOngoingUploads,
      completedUploadsCount,
      shouldClearState,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (shouldClearState) {
      console.log('🎉 [DEBUG] 모든 업로드 완료, 5초 후 상태 정리 예약');

      setTimeout(() => {
        console.log('🧹 [DEBUG] 5초 후 상태 정리 실행 시작');
        clearUploadState();
        console.log('🧹 [DEBUG] 상태 정리 완료');
      }, 5000);
    }
  }, [hasOngoingUploads, retrieveUploadSummary, clearUploadState]);

  const { length: validationIssuesCount } = validationResultsKeys;

  console.log('📊 [DEBUG] 렌더링 최종 상태 요약:', {
    currentMediaCount: currentMediaFilesList.length,
    isCurrentlyUploading,
    hasOngoingUploads,
    validationIssuesCount,
    currentlyUploadingFilesCount,
    isDragActive,
    isMobileDevice,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

  const hasValidationErrors = validationIssuesCount > 0;
  const hasActiveUploadProgress =
    hasOngoingUploads || currentlyUploadingFilesCount > 0;

  console.log('📊 [DEBUG] UI 표시 조건:', {
    hasValidationErrors,
    hasActiveUploadProgress,
    renderingId,
    timestamp: new Date().toLocaleTimeString(),
  });

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
