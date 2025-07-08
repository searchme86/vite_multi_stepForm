// blogMediaStep/imageUpload/ImageUploadContainer.tsx

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';

import FileDropZone from './parts/FileDropZone';
import FileSelectButton, {
  type FileSelectButtonRef,
} from './parts/FileSelectButton';
import { Progress } from '@heroui/react';
import { validateFile } from '../utils/fileValidationUtils';

// 안전한 고유 ID 생성을 위한 카운터
let globalFileIdCounter = 0;

// 고유한 파일 ID 생성 함수
const generateSecureFileId = (fileNameForId: string): string => {
  const currentTimestamp = Date.now();
  const incrementedCounter = ++globalFileIdCounter;
  const randomIdentifier = Math.random().toString(36).substring(2, 9);
  const fileNameHash = fileNameForId.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');

  const secureFileId = `file-${currentTimestamp}-${incrementedCounter}-${randomIdentifier}-${fileNameHash}`;

  console.log('🆔 [FILE_ID] 안전한 파일 ID 생성:', {
    fileNameForId: fileNameForId.slice(0, 20) + '...',
    secureFileId,
    counter: incrementedCounter,
    timestamp: new Date().toLocaleTimeString(),
  });

  return secureFileId;
};

function ImageUploadContainer(): React.ReactNode {
  console.log('🚀 [CONTAINER] ImageUploadContainer 렌더링 시작 (원본방식):', {
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

  console.log('📊 [STATE] BlogMediaStepState 현재 상태 (원본방식):', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    isDragActive,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  // 🔥 핵심 수정: 최신 상태 추적을 위한 ref 추가
  const currentStateRef = useRef({
    mediaFiles: currentMediaFilesList,
    fileNames: currentSelectedFileNames,
  });

  // 상태 변경 시마다 ref 업데이트
  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };
  }, [currentMediaFilesList, currentSelectedFileNames]);

  // ✅ 원본 방식: 단순한 상태 관리 (복잡한 매핑 제거)
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, 'uploading' | 'success' | 'error'>
  >({});

  // ✅ 원본 방식: 단순한 파일 처리 함수
  const handleFiles = useCallback(
    (files: FileList) => {
      console.log('🚨 [FILES] handleFiles 시작 (원본방식):', {
        fileCount: files.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      Array.from(files).forEach((file, fileIndex) => {
        const reader = new FileReader();
        const fileId = generateSecureFileId(file.name);
        const { name: fileName } = file;

        console.log('📁 [FILE_PROCESS] 개별 파일 처리 시작 (원본방식):', {
          fileName,
          fileId,
          fileIndex,
          fileSize: file.size,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 파일 검증
        const validationResult = validateFile(file);
        const { isValid: fileIsValid, errorMessage: validationError } =
          validationResult;

        if (!fileIsValid) {
          console.log('❌ [VALIDATION] 파일 검증 실패 (원본방식):', {
            fileName,
            error: validationError || 'unknown',
          });

          setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
          showToastMessage({
            title: '업로드 실패',
            description:
              validationError || `${fileName} 파일 검증에 실패했습니다.`,
            color: 'danger',
          });
          return;
        }

        // ✅ 원본 방식: 단순한 상태 설정
        setUploading((prev) => ({ ...prev, [fileId]: 0 }));
        setUploadStatus((prev) => ({ ...prev, [fileName]: 'uploading' }));

        reader.onprogress = (event) => {
          const { lengthComputable, loaded, total } = event;
          if (lengthComputable) {
            const progress = Math.round((loaded / total) * 100);
            setUploading((prev) => ({ ...prev, [fileId]: progress }));

            console.log('📊 [PROGRESS] 진행률 업데이트 (원본방식):', {
              fileName,
              fileId,
              progress,
              timestamp: new Date().toLocaleTimeString(),
            });
          }
        };

        // ✅ 원본 방식: 단순한 완료 처리
        reader.onload = (e) => {
          const { target: readerTarget } = e;
          const result = readerTarget?.result as string;

          console.log('📁 [READER_LOAD] FileReader 완료 (원본방식):', {
            fileName,
            fileId,
            resultLength: result ? result.length : 0,
            timestamp: new Date().toLocaleTimeString(),
          });

          // ✅ 원본과 동일한 1.5초 지연 처리
          setTimeout(() => {
            console.log('⏰ [TIMEOUT] setTimeout 콜백 실행 (원본방식):', {
              fileName,
              fileId,
              timestamp: new Date().toLocaleTimeString(),
            });

            try {
              // 🔥 핵심 수정: ref로 최신 상태 참조하여 클로저 문제 해결
              const latestMediaFiles = currentStateRef.current.mediaFiles;
              const latestFileNames = currentStateRef.current.fileNames;

              updateMediaValue([...latestMediaFiles, result]);
              updateSelectedFileNames([...latestFileNames, fileName]);

              setUploadStatus((prev) => ({ ...prev, [fileName]: 'success' }));

              // ✅ 원본 방식: 단순한 업로딩 상태 제거
              setUploading((prev) => {
                const newState = { ...prev };
                delete newState[fileId];
                return newState;
              });

              showToastMessage({
                title: '업로드 완료',
                description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
                color: 'success',
              });

              console.log('✅ [SUCCESS] 파일 업로드 완료 (원본방식):', {
                fileName,
                fileId,
                timestamp: new Date().toLocaleTimeString(),
              });
            } catch (uploadError) {
              console.error('❌ [ERROR] 업로드 처리 중 오류 (원본방식):', {
                fileName,
                fileId,
                error: uploadError,
                timestamp: new Date().toLocaleTimeString(),
              });

              setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
              showToastMessage({
                title: '파일 추가 실패',
                description: '파일을 추가하는 중 오류가 발생했습니다.',
                color: 'danger',
              });
            }
          }, 1500); // 원본과 동일한 1.5초 지연
        };

        reader.onerror = (error) => {
          console.error('❌ [READER_ERROR] FileReader 에러 (원본방식):', {
            fileName,
            fileId,
            error,
            timestamp: new Date().toLocaleTimeString(),
          });

          setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
          showToastMessage({
            title: '업로드 실패',
            description: '파일 읽기 중 오류가 발생했습니다.',
            color: 'danger',
          });
        };

        reader.readAsDataURL(file);
      });
    },
    [updateMediaValue, updateSelectedFileNames, showToastMessage]
  );

  // 파일 드롭 핸들러
  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      console.log('🚨 [DROP] handleFilesDropped (원본방식):', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((f) => f.name),
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoFiles = droppedFilesList.length === 0;
      if (hasNoFiles) {
        console.log('⚠️ [DROP] 드롭된 파일이 없음');
        return;
      }

      const fileListObject = {
        length: droppedFilesList.length,
        item: (index: number) => droppedFilesList[index] || null,
        [Symbol.iterator]: function* () {
          for (let i = 0; i < droppedFilesList.length; i++) {
            yield droppedFilesList[i];
          }
        },
      } as FileList;

      handleFiles(fileListObject);
    },
    [handleFiles]
  );

  // 파일 선택 버튼 클릭
  const handleFileSelectClick = useCallback(() => {
    const hasActiveUploads = Object.keys(uploading).length > 0;

    console.log('🚨 [CLICK] handleFileSelectClick (원본방식):', {
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
  }, [uploading, showToastMessage]);

  // 파일 변경 이벤트
  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🚨 [CHANGE] handleFileChange (원본방식):', {
        fileCount: changedFileList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasFiles = changedFileList.length > 0;
      if (hasFiles) {
        handleFiles(changedFileList);
      }
    },
    [handleFiles]
  );

  // ✅ 원본 방식: 단순한 업로드 상태 확인
  const hasActiveUploads = Object.keys(uploading).length > 0;
  const isCurrentlyUploading = hasActiveUploads;

  console.log('📊 [RENDER] 렌더링 최종 상태 (원본방식):', {
    hasActiveUploads,
    isCurrentlyUploading,
    uploadingKeys: Object.keys(uploading),
    uploadStatusKeys: Object.keys(uploadStatus),
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
          console.log('🔧 setDragActive 호출됨 (원본방식)');
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

      {/* ✅ 원본 방식: 단순한 업로드 진행률 표시 */}
      {hasActiveUploads && (
        <div
          role="status"
          aria-labelledby="upload-progress-heading"
          aria-live="polite"
          className="space-y-2"
        >
          <h3 id="upload-progress-heading" className="text-sm font-medium">
            업로드 중...
          </h3>

          {/* ✅ 원본과 동일한 단순한 진행률 표시 */}
          {Object.entries(uploading).map(([fileId, progress]) => {
            console.log('🔄 [PROGRESS_ITEM] 진행률 아이템 렌더링 (원본방식):', {
              fileId,
              progress,
              timestamp: new Date().toLocaleTimeString(),
            });

            return (
              <div key={fileId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>파일 업로드 중</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress
                  value={progress}
                  color="primary"
                  size="sm"
                  aria-label={`파일 업로드 진행률 ${progress}%`}
                  classNames={{
                    base: 'w-full',
                    track: 'bg-default-200',
                    indicator: 'transition-all duration-300',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 업로드된 이미지 표시 영역 */}
      {(() => {
        const hasUploadedImages = currentMediaFilesList.length > 0;

        console.log('🖼️ [RENDER] 이미지 표시 영역 렌더링 (원본방식):', {
          hasUploadedImages,
          currentMediaFilesListLength: currentMediaFilesList.length,
          currentSelectedFileNamesLength: currentSelectedFileNames.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        return hasUploadedImages ? (
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
                          console.log(
                            '🖼️ [IMAGE_LOAD] 이미지 로드 완료 (원본방식):',
                            {
                              imageIndex,
                              imageDisplayName,
                              naturalWidth,
                              naturalHeight,
                            }
                          );
                        }}
                        onError={(errorEvent) => {
                          console.error(
                            '❌ [IMAGE_ERROR] 이미지 로드 실패 (원본방식):',
                            {
                              imageIndex,
                              imageDisplayName,
                              errorEvent,
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

                    {/* 삭제 버튼 */}
                    <button
                      type="button"
                      className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white transition-colors duration-200 bg-red-500 rounded-full shadow-md opacity-0 top-2 right-2 hover:bg-red-600 group-hover:opacity-100"
                      onClick={() => {
                        const shouldDelete = confirm(
                          `"${imageDisplayName}" 이미지를 삭제하시겠습니까?`
                        );

                        if (shouldDelete) {
                          // 🔥 핵심 수정: ref로 최신 상태 참조하여 클로저 문제 해결
                          const latestMediaFiles =
                            currentStateRef.current.mediaFiles;
                          const latestFileNames =
                            currentStateRef.current.fileNames;

                          const updatedMediaFiles = latestMediaFiles.filter(
                            (_, filterIndex) => filterIndex !== imageIndex
                          );
                          const updatedFileNames = latestFileNames.filter(
                            (_, filterIndex) => filterIndex !== imageIndex
                          );

                          updateMediaValue(updatedMediaFiles);
                          updateSelectedFileNames(updatedFileNames);

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
        ) : null;
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
