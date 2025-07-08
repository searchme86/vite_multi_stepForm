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

// 안전한 고유 ID 생성을 위한 카운터
let globalFileIdCounter = 0;

// 고유한 파일 ID 생성 함수
const generateSecureFileId = (fileNameForId: string): string => {
  const currentTimestamp = Date.now();
  const incrementedCounter = ++globalFileIdCounter;
  const randomIdentifier = Math.random().toString(36).substring(2, 9);
  const fileNameHash = fileNameForId.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');

  const secureFileId = `file-${currentTimestamp}-${incrementedCounter}-${randomIdentifier}-${fileNameHash}`;

  console.log('🆔 안전한 파일 ID 생성:', {
    fileNameForId: fileNameForId.slice(0, 20) + '...',
    secureFileId,
    counter: incrementedCounter,
    timestamp: new Date().toLocaleTimeString(),
  });

  return secureFileId;
};

function ImageUploadContainer(): React.ReactNode {
  const renderingId = Math.random().toString(36).substring(2, 7);

  console.log('🚀 ImageUploadContainer 렌더링 시작 (수정된 버전):', {
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

  console.log('📊 BlogMediaStepState 상태:', {
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
    isUploading: isCurrentlyUploading,
    hasActiveUploads: hasOngoingUploads,
    getFileIdToNameMap: retrieveFileIdToNameMap,
  } = useUploadProgress();

  const {
    uploading: currentlyUploadingFiles,
    uploadStatus: fileUploadStatuses,
  } = uploadProgressState;

  // 🔥 핵심 수정: 완료된 파일들을 추적하는 ref 추가
  const completedFilesRef = useRef<Set<string>>(new Set());

  // 🚨 디버깅: 현재 상태를 실시간으로 추적하는 ref 추가
  const currentStateRef = useRef({
    mediaFiles: currentMediaFilesList,
    fileNames: currentSelectedFileNames,
  });

  // 🚨 디버깅: 상태 변경 시마다 ref 업데이트
  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };

    console.log('🔍 [STATE_CHANGE] 상태 ref 업데이트:', {
      mediaCount: currentMediaFilesList.length,
      fileNamesCount: currentSelectedFileNames.length,
      mediaFiles: currentMediaFilesList.map((_, idx) => `이미지${idx + 1}`),
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [currentMediaFilesList, currentSelectedFileNames]);

  const imageUploadHandler = useImageUpload({
    onProgress: useCallback(
      (fileIdentifier: string, uploadProgress: number) => {
        console.log('📊 onProgress 콜백 호출됨:', {
          fileIdentifier,
          uploadProgress,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
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
        console.log('🔄 onStatusChange 콜백 호출됨:', {
          targetFileName,
          newStatus,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
        });
        updateFileStatus(targetFileName, newStatus);
      },
      [updateFileStatus]
    ),

    // 🔥 핵심 수정: onComplete 콜백 대폭 개선
    onComplete: useCallback(
      (
        uploadResult: string,
        completedFileName: string,
        completedFileId: string
      ) => {
        console.log('🎯 *** [COMPLETE_START] onComplete 콜백 시작! ***:', {
          completedFileName,
          completedFileId,
          resultLength: uploadResult.length,
          renderingId,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 🚨 디버깅: 완료 시점의 현재 상태 확인
        console.log('🔍 [COMPLETE_BEFORE] 완료 전 상태 확인:', {
          completedFileName,
          propsMediaCount: currentMediaFilesList.length,
          refMediaCount: currentStateRef.current.mediaFiles.length,
          propsFileNamesCount: currentSelectedFileNames.length,
          refFileNamesCount: currentStateRef.current.fileNames.length,
          propsMediaFiles: currentMediaFilesList.map(
            (_, idx) => `이미지${idx + 1}`
          ),
          refMediaFiles: currentStateRef.current.mediaFiles.map(
            (_, idx) => `이미지${idx + 1}`
          ),
          timestamp: new Date().toLocaleTimeString(),
        });

        // 🔥 수정: 중복 완료 방지
        const completionKey = `${completedFileId}-${completedFileName}`;
        if (completedFilesRef.current.has(completionKey)) {
          console.log(
            '⚠️ [COMPLETE_DUPLICATE] 이미 완료된 파일, 중복 처리 방지:',
            {
              completedFileName,
              completedFileId,
              completionKey,
            }
          );
          return;
        }

        completedFilesRef.current.add(completionKey);

        console.log('📝 [COMPLETE_REGISTERED] 완료 파일 등록:', {
          completedFileName,
          completionKey,
          totalCompleted: completedFilesRef.current.size,
        });

        try {
          // 🚨 디버깅: ref의 최신 상태를 사용하여 계산
          const latestMediaFiles = currentStateRef.current.mediaFiles;
          const latestFileNames = currentStateRef.current.fileNames;

          console.log('🔄 [COMPLETE_CALCULATE] 새로운 상태 계산 중:', {
            completedFileName,
            latestMediaCount: latestMediaFiles.length,
            latestFileNamesCount: latestFileNames.length,
            willAddResult: uploadResult.slice(0, 50) + '...',
            timestamp: new Date().toLocaleTimeString(),
          });

          // 🔥 수정: ref의 최신 상태를 기반으로 새로운 배열 계산
          const newMediaFiles = [...latestMediaFiles, uploadResult];
          const newFileNames = [...latestFileNames, completedFileName];

          console.log('📊 [COMPLETE_NEW_STATE] 계산된 새로운 상태:', {
            completedFileName,
            beforeMediaCount: latestMediaFiles.length,
            afterMediaCount: newMediaFiles.length,
            beforeFileNamesCount: latestFileNames.length,
            afterFileNamesCount: newFileNames.length,
            newMediaFiles: newMediaFiles.map((_, idx) => `이미지${idx + 1}`),
            timestamp: new Date().toLocaleTimeString(),
          });

          console.log('🚀 [COMPLETE_UPDATE] 상태 업데이트 시작:', {
            completedFileName,
            updateMediaValue: !!updateMediaValue,
            updateSelectedFileNames: !!updateSelectedFileNames,
            timestamp: new Date().toLocaleTimeString(),
          });

          updateMediaValue(newMediaFiles);
          updateSelectedFileNames(newFileNames);

          console.log('✅ [COMPLETE_UPDATE_DONE] 상태 업데이트 완료:', {
            completedFileName,
            timestamp: new Date().toLocaleTimeString(),
          });

          // 🔥 수정: 지연된 업로드 상태 정리 (다른 완료와 겹치지 않도록)
          setTimeout(() => {
            console.log('🧹 [COMPLETE_CLEANUP] 업로드 상태 지연 정리:', {
              completedFileId,
              completedFileName,
            });
            finalizeFileUpload(completedFileId);
          }, 200 + Math.random() * 100); // 200-300ms 랜덤 지연

          showToastMessage({
            title: '업로드 완료',
            description: `${completedFileName} 파일이 성공적으로 업로드되었습니다.`,
            color: 'success',
          });

          console.log('🎉 [COMPLETE_SUCCESS] onComplete 처리 완료:', {
            completedFileName,
            completedFileId,
            timestamp: new Date().toLocaleTimeString(),
          });
        } catch (uploadError) {
          console.error('❌ [COMPLETE_ERROR] onComplete 처리 중 에러:', {
            completedFileName,
            completedFileId,
            error: uploadError,
            timestamp: new Date().toLocaleTimeString(),
          });

          // 에러 발생 시 완료 목록에서 제거
          completedFilesRef.current.delete(completionKey);

          showToastMessage({
            title: '파일 추가 실패',
            description: `파일을 추가하는 중 오류가 발생했습니다.`,
            color: 'danger',
          });
        }
      },
      [
        updateMediaValue,
        updateSelectedFileNames,
        showToastMessage,
        finalizeFileUpload,
        renderingId,
      ]
    ),

    onError: useCallback(
      (failedFileName: string, errorMessage: string) => {
        console.error('❌ onError 콜백 호출됨:', {
          failedFileName,
          errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        });
        showToastMessage({
          title: '업로드 실패',
          description: errorMessage,
          color: 'danger',
        });
      },
      [showToastMessage]
    ),
  });

  const {
    validationState: fileValidationState,
    validateFiles: performFileValidation,
    clearValidationResults: resetValidationResults,
  } = useFileValidation();

  // 파일 드롭 핸들러
  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      console.log('🚨 handleFilesDropped 호출됨:', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((f) => f.name),
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoDroppedFiles = droppedFilesList.length === 0;
      if (hasNoDroppedFiles) {
        console.log('⚠️ 드롭된 파일이 없음');
        return;
      }

      resetValidationResults();
      handleFileSelection(droppedFilesList);
    },
    [resetValidationResults]
  );

  // 🔥 핵심 수정: 파일 선택 핸들러 개선
  const handleFileSelection = useCallback(
    async (selectedFilesList: File[]) => {
      console.log('🚨 handleFileSelection 호출됨 (수정된 방식):', {
        fileCount: selectedFilesList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoSelectedFiles = selectedFilesList.length === 0;
      if (hasNoSelectedFiles) {
        console.log('⚠️ 선택된 파일이 없음');
        return;
      }

      try {
        const fileListForValidation = {
          length: selectedFilesList.length,
          item: (itemIndex: number) => selectedFilesList[itemIndex] || null,
          [Symbol.iterator]: function* () {
            for (let i = 0; i < selectedFilesList.length; i++) {
              yield selectedFilesList[i];
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

        const hasInvalidFiles = rejectedFiles.length > 0;
        if (hasInvalidFiles) {
          showToastMessage({
            title: '파일 검증 실패',
            description: `${rejectedFiles.length}개의 파일이 지원되지 않거나 크기 제한을 초과합니다.`,
            color: 'warning',
          });
        }

        const hasValidFiles = validatedFiles.length > 0;
        if (hasValidFiles) {
          console.log('📤 유효한 파일들 업로드 시작:', {
            validFileCount: validatedFiles.length,
            fileNames: validatedFiles.map((f) => f.name),
          });

          // 🔥 수정: 각 파일에 대해 순차적으로 업로드 시작 등록
          validatedFiles.forEach((validFile, fileIndex) => {
            const secureUniqueFileId = generateSecureFileId(validFile.name);

            console.log('🔄 initializeFileUpload 호출 (수정된 방식):', {
              fileId: secureUniqueFileId,
              fileName: validFile.name,
              fileIndex,
            });

            // 각 파일마다 약간의 지연을 두어 동시 시작 방지
            setTimeout(() => {
              initializeFileUpload(secureUniqueFileId, validFile.name);
            }, fileIndex * 50); // 50ms씩 지연
          });

          const fileListForUpload = {
            length: validatedFiles.length,
            item: (itemIndex: number) => validatedFiles[itemIndex] || null,
            [Symbol.iterator]: function* () {
              for (let i = 0; i < validatedFiles.length; i++) {
                yield validatedFiles[i];
              }
            },
          } as FileList;

          console.log('🚀 *** imageUploadHandler.handleFiles 호출! ***:', {
            validatedFilesCount: validatedFiles.length,
          });

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

  // 파일 선택 버튼 클릭
  const handleFileSelectClick = useCallback(() => {
    console.log('🚨 handleFileSelectClick 호출됨:', {
      isCurrentlyUploading,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (isCurrentlyUploading) {
      console.log('⚠️ 업로드 중이므로 파일 선택 무시');
      showToastMessage({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    console.log('🔧 fileSelectButtonRef.current 확인:', {
      hasRef: !!fileSelectButtonRef.current,
      timestamp: new Date().toLocaleTimeString(),
    });

    const { current: fileSelectButtonElement } = fileSelectButtonRef;
    const hasClickFunction =
      fileSelectButtonElement?.clickFileInput !== null &&
      fileSelectButtonElement?.clickFileInput !== undefined;

    if (fileSelectButtonElement && hasClickFunction) {
      console.log('🔧 clickFileInput 호출 시도');
      fileSelectButtonElement.clickFileInput();
    } else {
      console.warn('⚠️ fileSelectButton ref 또는 clickFileInput 함수가 없음:', {
        hasRef: !!fileSelectButtonElement,
        hasClickFunction,
      });
    }
  }, [isCurrentlyUploading, showToastMessage]);

  // 파일 변경 이벤트
  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🚨 handleFileChange 호출됨:', {
        fileCount: changedFileList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasChangedFiles = changedFileList.length > 0;
      if (hasChangedFiles) {
        const filesArray = Array.from(changedFileList);
        console.log('📁 파일 배열 변환 완료:', {
          filesArray: filesArray.map((f) => ({ name: f.name, size: f.size })),
        });
        handleFileSelection(filesArray);
      }
    },
    [handleFileSelection]
  );

  const handleDismissValidationMessage = useCallback(
    (dismissedFileName: string) => {
      console.log('🗑️ handleDismissValidationMessage 호출:', {
        dismissedFileName,
      });
      resetValidationResults();
    },
    [resetValidationResults]
  );

  // 🔥 수정: 업로드 상태 변화 감지 및 완료 목록 정리
  useEffect(() => {
    console.log('📊 *** [UPLOAD_STATE] 업로드 상태 변화 감지 ***:', {
      hasOngoingUploads,
      isCurrentlyUploading,
      currentlyUploadingFilesKeys: Object.keys(currentlyUploadingFiles),
      currentlyUploadingFilesCount: Object.keys(currentlyUploadingFiles).length,
      completedFilesCount: completedFilesRef.current.size,
      completedFilesList: Array.from(completedFilesRef.current),
      timestamp: new Date().toLocaleTimeString(),
    });

    // 모든 업로드가 완료되면 완료 목록 정리
    if (!hasOngoingUploads && completedFilesRef.current.size > 0) {
      setTimeout(() => {
        console.log('🧹 [CLEANUP] 완료된 파일 목록 정리:', {
          clearedCount: completedFilesRef.current.size,
          clearedFiles: Array.from(completedFilesRef.current),
        });
        completedFilesRef.current.clear();
      }, 2000); // 2초 후 정리
    }
  }, [hasOngoingUploads, isCurrentlyUploading, currentlyUploadingFiles]);

  // 🚨 디버깅: 최종 렌더링 상태 확인
  useEffect(() => {
    console.log('🔍 [FINAL_STATE] 최종 렌더링 상태:', {
      renderingId,
      currentMediaFilesListLength: currentMediaFilesList.length,
      currentSelectedFileNamesLength: currentSelectedFileNames.length,
      hasValidationErrors,
      hasActiveUploadProgress,
      hasOngoingUploads,
      isCurrentlyUploading,
      mediaFiles: currentMediaFilesList.map((url, idx) => ({
        index: idx,
        urlLength: url.length,
        fileName: currentSelectedFileNames[idx] || `이미지${idx + 1}`,
      })),
      timestamp: new Date().toLocaleTimeString(),
    });
  });

  const hasValidationErrors =
    Object.keys(fileValidationState.validationResults).length > 0;
  const hasActiveUploadProgress =
    hasOngoingUploads || Object.keys(currentlyUploadingFiles).length > 0;

  console.log('📊 렌더링 최종 상태 (수정된 방식):', {
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
        setDragActive={() => {
          console.log('🔧 setDragActive 호출됨');
        }}
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
          {(() => {
            const currentFileIdToNameMap = retrieveFileIdToNameMap();
            console.log('📊 UploadProgressList에 전달할 매핑 정보:', {
              mappingCount: Object.keys(currentFileIdToNameMap).length,
              mapping: currentFileIdToNameMap,
              uploadingFiles: Object.keys(currentlyUploadingFiles),
              timestamp: new Date().toLocaleTimeString(),
            });

            return (
              <UploadProgressList
                uploading={currentlyUploadingFiles}
                uploadStatus={fileUploadStatuses}
                fileIdToNameMap={currentFileIdToNameMap}
                className="mt-4"
                showCompleted={true}
                maxItems={10}
              />
            );
          })()}
        </div>
      )}

      {/* 업로드된 이미지 표시 영역 */}
      {(() => {
        // 🚨 디버깅: 렌더링 시점의 상태 확인
        console.log('🖼️ [RENDER] 이미지 표시 영역 렌더링:', {
          currentMediaFilesListLength: currentMediaFilesList.length,
          currentSelectedFileNamesLength: currentSelectedFileNames.length,
          currentMediaFilesList: currentMediaFilesList.map((url, idx) => ({
            index: idx,
            urlLength: url.length,
            urlStart: url.slice(0, 50) + '...',
          })),
          currentSelectedFileNames: currentSelectedFileNames,
          timestamp: new Date().toLocaleTimeString(),
          renderingId,
        });

        return (
          currentMediaFilesList.length > 0 && (
            <div
              className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              role="region"
              aria-labelledby="uploaded-images-heading"
            >
              <h3
                id="uploaded-images-heading"
                className="mb-4 text-lg font-semibold text-gray-800"
              >
                업로드된 이미지들 ({currentMediaFilesList.length}개)
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {currentMediaFilesList.map((imageUrl, imageIndex) => {
                  const imageDisplayName =
                    currentSelectedFileNames[imageIndex] ||
                    `이미지 ${imageIndex + 1}`;
                  const imageKeyForReact = `uploaded-image-${imageIndex}-${imageDisplayName}`;

                  // 🚨 디버깅: 각 이미지 렌더링 정보
                  console.log('🖼️ [RENDER_IMAGE] 개별 이미지 렌더링:', {
                    imageIndex,
                    imageDisplayName,
                    imageKeyForReact,
                    imageUrlLength: imageUrl.length,
                    imageUrlStart: imageUrl.slice(0, 50) + '...',
                    totalImages: currentMediaFilesList.length,
                    timestamp: new Date().toLocaleTimeString(),
                  });

                  return (
                    <div
                      key={imageKeyForReact}
                      className="relative overflow-hidden transition-shadow duration-200 bg-white border border-gray-200 rounded-lg shadow-sm group hover:shadow-md"
                      role="article"
                      aria-labelledby={`image-title-${imageIndex}`}
                    >
                      {/* 이미지 번호 표시 */}
                      <div className="absolute z-10 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full shadow-md top-2 left-2">
                        {imageIndex + 1}
                      </div>

                      {/* 이미지 표시 */}
                      <div className="flex items-center justify-center bg-gray-100 aspect-square">
                        <img
                          src={imageUrl}
                          alt={`업로드된 이미지 ${
                            imageIndex + 1
                          }: ${imageDisplayName}`}
                          className="object-cover w-full h-full"
                          onLoad={(loadEvent) => {
                            const { currentTarget: loadedImage } = loadEvent;
                            const { naturalWidth, naturalHeight } = loadedImage;
                            console.log('🖼️ [RENDER_LOAD] 이미지 로드 완료:', {
                              imageIndex,
                              imageDisplayName,
                              naturalWidth,
                              naturalHeight,
                              timestamp: new Date().toLocaleTimeString(),
                            });
                          }}
                          onError={(errorEvent) => {
                            console.error(
                              '❌ [RENDER_ERROR] 이미지 로드 실패:',
                              {
                                imageIndex,
                                imageDisplayName,
                                errorEvent,
                                timestamp: new Date().toLocaleTimeString(),
                              }
                            );
                          }}
                        />
                      </div>

                      {/* 이미지 정보 표시 */}
                      <div className="p-3 bg-white">
                        <h4
                          id={`image-title-${imageIndex}`}
                          className="text-sm font-medium text-gray-900 truncate"
                          title={imageDisplayName}
                        >
                          {imageDisplayName}
                        </h4>
                        <div className="mt-1 text-xs text-gray-500">
                          <span>
                            크기: {Math.round(imageUrl.length / 1024)} KB
                          </span>
                        </div>
                      </div>

                      {/* 마우스 호버 시 확대 표시 */}
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 bg-black bg-opacity-0 opacity-0 group-hover:bg-opacity-20 group-hover:opacity-100">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs font-medium text-gray-800 transition-all duration-200 bg-white rounded-full shadow-md bg-opacity-90 hover:bg-opacity-100"
                          onClick={() => {
                            console.log('🔍 [RENDER_CLICK] 이미지 클릭:', {
                              imageIndex,
                              imageDisplayName,
                              timestamp: new Date().toLocaleTimeString(),
                            });

                            // 새 창에서 이미지 열기
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(`
                              <html>
                                <head><title>${imageDisplayName}</title></head>
                                <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center;">
                                  <img src="${imageUrl}" alt="${imageDisplayName}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
                                </body>
                              </html>
                            `);
                            }
                          }}
                          aria-label={`${imageDisplayName} 큰 화면으로 보기`}
                        >
                          🔍 보기
                        </button>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        type="button"
                        className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white transition-colors duration-200 bg-red-500 rounded-full shadow-md opacity-0 top-2 right-2 hover:bg-red-600 group-hover:opacity-100"
                        onClick={() => {
                          console.log('🗑️ [RENDER_DELETE] 이미지 삭제 클릭:', {
                            imageIndex,
                            imageDisplayName,
                            timestamp: new Date().toLocaleTimeString(),
                          });

                          const shouldDelete = confirm(
                            `"${imageDisplayName}" 이미지를 삭제하시겠습니까?`
                          );

                          if (shouldDelete) {
                            const updatedMediaFiles =
                              currentMediaFilesList.filter(
                                (_, filterIndex) => filterIndex !== imageIndex
                              );
                            const updatedFileNames =
                              currentSelectedFileNames.filter(
                                (_, filterIndex) => filterIndex !== imageIndex
                              );

                            updateMediaValue(updatedMediaFiles);
                            updateSelectedFileNames(updatedFileNames);

                            console.log(
                              '🗑️ [RENDER_DELETE_DONE] 이미지 삭제 실행:',
                              {
                                imageIndex,
                                imageDisplayName,
                                beforeCount: currentMediaFilesList.length,
                                afterCount: updatedMediaFiles.length,
                                timestamp: new Date().toLocaleTimeString(),
                              }
                            );

                            showToastMessage({
                              title: '이미지 삭제 완료',
                              description: `"${imageDisplayName}" 이미지가 삭제되었습니다.`,
                              color: 'success',
                            });
                          }
                        }}
                        aria-label={`${imageDisplayName} 이미지 삭제`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 이미지 요약 정보 */}
              <div className="p-3 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-800">
                    총 {currentMediaFilesList.length}개의 이미지가
                    업로드되었습니다
                  </span>
                  <span className="text-blue-600">
                    총 크기:{' '}
                    {Math.round(
                      currentMediaFilesList.reduce(
                        (totalSize, imageUrl) => totalSize + imageUrl.length,
                        0
                      ) / 1024
                    )}{' '}
                    KB
                  </span>
                </div>
              </div>
            </div>
          )
        );
      })()}

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
