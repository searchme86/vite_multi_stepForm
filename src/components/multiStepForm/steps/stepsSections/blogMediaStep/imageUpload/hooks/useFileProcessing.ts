// 📁 imageUpload/hooks/useFileProcessing.ts

import { useRef, useCallback, useEffect, useState } from 'react';
import { createLogger } from '../utils/loggerUtils';
import { validateFile } from '../utils/fileValidationUtils';
import { generateSecureFileId } from '../utils/fileIdUtils';
import { filterDuplicateFilesWithProcessing } from '../utils/duplicateFileUtils';
import {
  createFileReader,
  convertFilesToFileList,
} from '../utils/fileProcessingUtils';
import type { FileItem, FileStatus } from '../types/imageUploadTypes'; // 🚨 FIXED: 타입 임포트 추가

const logger = createLogger('FILE_PROCESSING');

type StateUpdaterFunction<T> = (previousValue: T) => T;

interface FileProcessingCallbacks {
  readonly updateMediaValue: (
    filesOrUpdater: readonly string[] | StateUpdaterFunction<readonly string[]>
  ) => void;
  readonly updateSelectedFileNames: (
    namesOrUpdater: readonly string[] | StateUpdaterFunction<readonly string[]>
  ) => void;
  readonly showToastMessage: (toast: unknown) => void;
  readonly showDuplicateMessage: (files: readonly File[]) => void;
  readonly startFileUpload: (fileId: string, fileName: string) => void;
  readonly updateFileProgress: (fileId: string, progress: number) => void;
  readonly completeFileUpload: (fileId: string, fileName: string) => void;
  readonly failFileUpload: (fileId: string, fileName: string) => void;
  readonly mapFileActions?: {
    addFile: (fileName: string, url: string) => string;
    updateFile: (
      fileId: string,
      updates: { fileName?: string; url?: string; status?: FileStatus }
    ) => boolean;
    removeFile: (fileId: string) => boolean;
    getFileById: (fileId: string) => FileItem | undefined;
    getFileUrls: () => string[];
    getFileNames: () => string[];
    clearAllFiles: () => void;
    reorderFiles: (newOrder: readonly string[]) => boolean;
    getFilesByStatus: (status: FileStatus) => readonly FileItem[];
  };
}

interface CurrentStateRef {
  mediaFiles: readonly string[];
  fileNames: readonly string[];
}

interface ProcessingFileInfo {
  readonly fileId: string;
  readonly fileName: string;
  readonly placeholderUrl: string;
  readonly startTime: number;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface FileProcessingResult {
  readonly processFiles: (files: FileList) => void;
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileChange: (files: FileList) => void;
  readonly validateProcessingState: () => boolean;
}

interface FileIdMapping {
  readonly fileId: string;
  readonly fileName: string;
  readonly placeholderUrl: string;
}

const convertFileListToMutableArray = (fileList: FileList): File[] => {
  const fileArray: File[] = [];

  for (let fileIndex = 0; fileIndex < fileList.length; fileIndex++) {
    const currentFile = fileList[fileIndex];

    if (currentFile) {
      fileArray.push(currentFile);
    }
  }

  console.log('🔧 [CONVERT_DEBUG] FileList 변환 완료:', {
    원본길이: fileList.length,
    변환된길이: fileArray.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  return fileArray;
};

const createSafeToastMessage = (toast: {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'danger' | 'primary';
}): unknown => {
  return {
    title: toast.title,
    description: toast.description,
    color: toast.color,
  };
};

export const useFileProcessing = (
  currentMediaFilesList: readonly string[],
  currentSelectedFileNames: readonly string[],
  callbacks: FileProcessingCallbacks
): FileProcessingResult => {
  const currentStateRef = useRef<CurrentStateRef>({
    mediaFiles: currentMediaFilesList,
    fileNames: currentSelectedFileNames,
  });

  const [processingFiles, setProcessingFiles] = useState<
    Map<string, ProcessingFileInfo>
  >(new Map());

  const processingLockRef = useRef<boolean>(false);
  const updateQueueRef = useRef<Array<() => void>>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  // 🚨 Phase 3: mapFileActions 전달 확인 강화
  const hasMapFileActions = callbacks.mapFileActions !== undefined;
  const mapFileActionsType = typeof callbacks.mapFileActions;
  const mapFileActionsMethods = hasMapFileActions
    ? Object.keys(callbacks.mapFileActions)
    : [];

  console.log('🚨 [PHASE3_FIX] useFileProcessing mapFileActions 상태:', {
    hasMapFileActions,
    mapFileActionsType,
    mapFileActionsMethods,
    mapBasedProcessing: hasMapFileActions,
    timestamp: new Date().toLocaleTimeString(),
  });

  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };
  }, [currentMediaFilesList, currentSelectedFileNames]);

  logger.debug('useFileProcessing 초기화 - Map 기반 ID 처리', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    hasMapFileActions,
    mapBasedProcessing: hasMapFileActions,
    timestamp: new Date().toLocaleTimeString(),
  });

  const processUpdateQueue = useCallback((): void => {
    if (isProcessingQueueRef.current) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      while (updateQueueRef.current.length > 0) {
        const updateFunction = updateQueueRef.current.shift();
        if (updateFunction) {
          updateFunction();
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, []);

  const enqueueStateUpdate = useCallback(
    (updateFunction: () => void): void => {
      updateQueueRef.current.push(updateFunction);

      Promise.resolve().then(() => {
        processUpdateQueue();
      });
    },
    [processUpdateQueue]
  );

  const addProcessingFile = useCallback(
    (fileInfo: ProcessingFileInfo): void => {
      setProcessingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileInfo.fileId, fileInfo);

        console.log('🔒 [PROCESSING_LOCK] 파일 처리 등록:', {
          파일명: fileInfo.fileName,
          파일ID: fileInfo.fileId,
          플레이스홀더URL: fileInfo.placeholderUrl,
          처리중파일개수: newMap.size,
        });

        return newMap;
      });
    },
    []
  );

  const removeProcessingFile = useCallback((fileId: string): void => {
    setProcessingFiles((prev) => {
      const newMap = new Map(prev);
      const removed = newMap.delete(fileId);

      if (removed) {
        console.log('🔓 [PROCESSING_UNLOCK] 파일 처리 완료:', {
          파일ID: fileId,
          남은처리파일개수: newMap.size,
        });
      }

      return newMap;
    });
  }, []);

  const getProcessingFileNames = useCallback((): string[] => {
    return Array.from(processingFiles.values()).map((file) => file.fileName);
  }, [processingFiles]);

  // 🚨 Phase 3: processFileInBackgroundById 강화
  const processFileInBackgroundById = useCallback(
    (file: File, fileName: string, mapping: FileIdMapping): void => {
      const { fileId, placeholderUrl } = mapping;

      console.log('🔧 [BACKGROUND_START] 파일 처리 시작:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        파일ID: fileId,
        플레이스홀더URL: placeholderUrl,
        mapAvailable: !!callbacks.mapFileActions,
        hasMapFileActions,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🚨 파일 검증 강화
      const validationResult = validateFile(file);
      const { isValid: fileIsValid, errorMessage: validationError } =
        validationResult;

      if (!fileIsValid) {
        const errorMessage = validationError || 'unknown';

        console.error('❌ [VALIDATION_FAIL] 파일 검증 실패:', {
          fileName,
          fileId,
          errorMessage,
        });

        // 🚨 플레이스홀더 제거 로직 추가
        if (callbacks.mapFileActions) {
          console.log('🗑️ [CLEANUP] 검증 실패한 플레이스홀더 제거:', {
            fileId,
          });
          callbacks.mapFileActions.removeFile(fileId);

          const updatedUrls = callbacks.mapFileActions.getFileUrls();
          const updatedNames = callbacks.mapFileActions.getFileNames();

          enqueueStateUpdate(() => {
            callbacks.updateMediaValue(updatedUrls);
            callbacks.updateSelectedFileNames(updatedNames);
          });
        }

        removeProcessingFile(fileId);

        callbacks.showToastMessage(
          createSafeToastMessage({
            title: '업로드 실패',
            description:
              errorMessage !== 'unknown'
                ? errorMessage
                : `${fileName} 파일 검증에 실패했습니다.`,
            color: 'danger',
          })
        );
        return;
      }

      callbacks.startFileUpload(fileId, fileName);

      const handleProgressUpdate = (progress: number): void => {
        console.log('📊 [BACKGROUND_PROGRESS] 진행률 업데이트:', {
          fileName,
          fileId,
          progress: `${progress}%`,
        });
        callbacks.updateFileProgress(fileId, progress);
      };

      // 🚨 FileReader 성공 처리 강화
      const handleSuccessfulProcessing = (result: string): void => {
        console.log('✅ [BACKGROUND_SUCCESS] 파일 변환 성공:', {
          fileName,
          fileId,
          resultLength: result.length,
          resultPreview: result.slice(0, 50) + '...',
          hasMapFileActions,
        });

        if (callbacks.mapFileActions) {
          console.log('🔄 [MAP_UPDATE] Map 기반 파일 업데이트:', {
            fileId,
            url: result.slice(0, 50) + '...',
          });

          callbacks.mapFileActions.updateFile(fileId, {
            url: result,
            status: 'completed',
          });

          const updatedUrls = callbacks.mapFileActions.getFileUrls();
          const updatedNames = callbacks.mapFileActions.getFileNames();

          console.log('📋 [MAP_SYNC] Map → 레거시 동기화:', {
            updatedUrlsCount: updatedUrls.length,
            updatedNamesCount: updatedNames.length,
          });

          enqueueStateUpdate(() => {
            callbacks.updateMediaValue(updatedUrls);
            callbacks.updateSelectedFileNames(updatedNames);
          });
        } else {
          console.log('🔄 [LEGACY_UPDATE] 레거시 기반 파일 업데이트');

          enqueueStateUpdate(() => {
            callbacks.updateMediaValue((prev) => {
              const newUrls = [...prev];
              const placeholderIndex = newUrls.findIndex((url) =>
                url.includes(fileId)
              );
              if (placeholderIndex !== -1) {
                newUrls[placeholderIndex] = result;
                console.log(
                  '✅ [LEGACY_REPLACE] 플레이스홀더 → 실제 URL 교체:',
                  {
                    index: placeholderIndex,
                    oldUrl: prev[placeholderIndex]?.slice(0, 30) + '...',
                    newUrl: result.slice(0, 30) + '...',
                  }
                );
              }
              return newUrls;
            });
          });
        }

        removeProcessingFile(fileId);

        callbacks.completeFileUpload(fileId, fileName);
        callbacks.showToastMessage(
          createSafeToastMessage({
            title: '업로드 완료',
            description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
            color: 'success',
          })
        );

        logger.info('백그라운드 파일 업로드 완료', {
          fileName,
          fileId,
          resultLength: result.length,
          mapBasedProcessing: hasMapFileActions,
        });
      };

      // 🚨 FileReader 에러 처리 강화
      const handleProcessingError = (error: Error): void => {
        const errorMessage = error.message || 'FileReader 에러';

        console.error('❌ [BACKGROUND_ERROR] 파일 처리 실패:', {
          fileName,
          fileId,
          error: errorMessage,
          errorStack: error.stack,
        });

        if (callbacks.mapFileActions) {
          console.log('🗑️ [CLEANUP] 처리 실패한 플레이스홀더 제거:', {
            fileId,
          });
          callbacks.mapFileActions.removeFile(fileId);

          const updatedUrls = callbacks.mapFileActions.getFileUrls();
          const updatedNames = callbacks.mapFileActions.getFileNames();

          enqueueStateUpdate(() => {
            callbacks.updateMediaValue(updatedUrls);
            callbacks.updateSelectedFileNames(updatedNames);
          });
        } else {
          enqueueStateUpdate(() => {
            callbacks.updateMediaValue((prev) =>
              prev.filter((url) => !url.includes(fileId))
            );
            callbacks.updateSelectedFileNames((prev) =>
              prev.filter((name) => name !== fileName)
            );
          });
        }

        removeProcessingFile(fileId);

        callbacks.failFileUpload(fileId, fileName);
        callbacks.showToastMessage(
          createSafeToastMessage({
            title: '업로드 실패',
            description: `${fileName} 파일 읽기 중 오류가 발생했습니다.`,
            color: 'danger',
          })
        );
      };

      try {
        console.log('📖 [READ_START] FileReader 시작:', {
          fileName,
          fileId,
          fileSize: file.size,
        });

        createFileReader(
          file,
          fileId,
          handleProgressUpdate,
          handleSuccessfulProcessing,
          handleProcessingError
        );
      } catch (readerError) {
        console.error('🚨 [READER_CREATE_ERROR] FileReader 생성 실패:', {
          fileName,
          fileId,
          error: readerError,
        });

        const readerErrorObj =
          readerError instanceof Error
            ? readerError
            : new Error(`FileReader 생성 실패: ${fileName}`);
        handleProcessingError(readerErrorObj);
      }
    },
    [callbacks, enqueueStateUpdate, removeProcessingFile, hasMapFileActions]
  );

  const processFiles = useCallback(
    (files: FileList): void => {
      if (processingLockRef.current) {
        console.warn('🚫 [RACE_PREVENTION] 이미 처리 중이므로 무시:', {
          현재처리중: true,
          요청파일개수: files.length,
        });
        return;
      }

      processingLockRef.current = true;

      try {
        console.log('🔍 [PROCESS] 파일 처리 시작:', {
          입력파일개수: files.length,
          현재미디어파일개수: currentMediaFilesList.length,
          현재파일명개수: currentSelectedFileNames.length,
          hasMapFileActions,
          timestamp: new Date().toLocaleTimeString(),
        });

        const mutableFilesArray = convertFileListToMutableArray(files);
        const processingFileNames = getProcessingFileNames();

        const duplicateFilterResult = filterDuplicateFilesWithProcessing(
          mutableFilesArray,
          [...currentSelectedFileNames],
          processingFileNames
        );

        const uniqueFiles: File[] = [...duplicateFilterResult.uniqueFiles];
        const duplicateFiles: File[] = [
          ...duplicateFilterResult.duplicateFiles,
        ];

        console.log('🔍 [PROCESS] 중복 체크 완료:', {
          입력파일개수: mutableFilesArray.length,
          고유파일개수: uniqueFiles.length,
          중복파일개수: duplicateFiles.length,
        });

        if (duplicateFiles.length > 0) {
          callbacks.showDuplicateMessage(duplicateFiles);
          callbacks.showToastMessage(
            createSafeToastMessage({
              title: '중복 파일 발견',
              description: `${duplicateFiles.length}개의 중복 파일이 제외되었습니다`,
              color: 'warning',
            })
          );
        }

        if (uniqueFiles.length === 0) {
          console.log('🔍 [PROCESS] 처리할 고유 파일이 없음');
          return;
        }

        const fileMappings = new Map<string, FileIdMapping>();
        const placeholderUrls: string[] = [];

        uniqueFiles.forEach((file) => {
          const fileId = generateSecureFileId(file.name);
          const timestampSuffix = Date.now(); // 타임스탬프 추가
          const placeholderUrl = `placeholder-${fileId}-${timestampSuffix}-processing`;

          if (callbacks.mapFileActions) {
            console.log('📁 [MAP_ADD] Map에 파일 추가:', {
              fileName: file.name,
              placeholderUrl,
            });

            const addedFileId = callbacks.mapFileActions.addFile(
              file.name,
              placeholderUrl
            );

            fileMappings.set(file.name, {
              fileId: addedFileId,
              fileName: file.name,
              placeholderUrl,
            });
          } else {
            placeholderUrls.push(placeholderUrl);
            fileMappings.set(file.name, {
              fileId,
              fileName: file.name,
              placeholderUrl,
            });
          }
        });

        console.log('✅ [PROCESS] 파일 매핑 생성 완료:', {
          매핑개수: fileMappings.size,
          hasMapFileActions,
          파일ID들: Array.from(fileMappings.values()).map((m) => m.fileId),
        });

        if (callbacks.mapFileActions) {
          const updatedUrls = callbacks.mapFileActions.getFileUrls();
          const updatedNames = callbacks.mapFileActions.getFileNames();

          console.log('🔄 [MAP_STATE_UPDATE] Map 상태 업데이트:', {
            updatedUrlsCount: updatedUrls.length,
            updatedNamesCount: updatedNames.length,
          });

          enqueueStateUpdate(() => {
            callbacks.updateMediaValue(updatedUrls);
            callbacks.updateSelectedFileNames(updatedNames);
          });
        } else {
          const fileNames = uniqueFiles.map((file) => file.name);

          enqueueStateUpdate(() => {
            callbacks.updateMediaValue((prev) => [...prev, ...placeholderUrls]);
            callbacks.updateSelectedFileNames((prev) => [
              ...prev,
              ...fileNames,
            ]);
          });
        }

        console.log('✅ [PROCESS] 상태 업데이트 완료');

        uniqueFiles.forEach((file, index) => {
          const mapping = fileMappings.get(file.name);
          if (!mapping) {
            console.error('🚨 [PROCESSING] 파일 매핑을 찾을 수 없음:', {
              파일명: file.name,
            });
            return;
          }

          const processingInfo: ProcessingFileInfo = {
            fileId: mapping.fileId,
            fileName: file.name,
            placeholderUrl: mapping.placeholderUrl,
            startTime: Date.now(),
            status: 'processing',
          };

          addProcessingFile(processingInfo);

          // 🚨 지연 시간 조정으로 안정성 개선
          setTimeout(() => {
            console.log('🚀 [BACKGROUND_TRIGGER] 백그라운드 처리 시작:', {
              fileName: file.name,
              fileId: mapping.fileId,
              index,
            });
            processFileInBackgroundById(file, file.name, mapping);
          }, 100 + index * 50);
        });

        logger.info('파일 처리 완료', {
          processedFilesCount: uniqueFiles.length,
          mappingsCreated: fileMappings.size,
          mapBasedProcessing: hasMapFileActions,
        });
      } finally {
        setTimeout(() => {
          processingLockRef.current = false;
          console.log('🔓 [RACE_PREVENTION] 처리 락 해제');
        }, 500);
      }
    },
    [
      currentSelectedFileNames,
      currentMediaFilesList,
      getProcessingFileNames,
      callbacks,
      enqueueStateUpdate,
      processFileInBackgroundById,
      addProcessingFile,
      hasMapFileActions,
    ]
  );

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]): void => {
      console.log('🔍 [DROP_HANDLER] 드롭 파일 처리:', {
        입력파일개수: droppedFilesList.length,
      });

      if (droppedFilesList.length === 0) {
        return;
      }

      const fileListObject = convertFilesToFileList(droppedFilesList);
      processFiles(fileListObject);
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (changedFileList: FileList): void => {
      console.log('🔍 [CHANGE_HANDLER] 파일 변경 처리:', {
        변경된파일개수: changedFileList.length,
      });

      if (changedFileList.length > 0) {
        processFiles(changedFileList);
      }
    },
    [processFiles]
  );

  const validateProcessingState = useCallback((): boolean => {
    const { mediaFiles: currentMediaFiles, fileNames: currentFileNames } =
      currentStateRef.current;

    const isValidMediaFiles = Array.isArray(currentMediaFiles);
    const isValidFileNames = Array.isArray(currentFileNames);
    const isLengthMatching =
      currentMediaFiles.length === currentFileNames.length;

    const isValid = isValidMediaFiles && isValidFileNames && isLengthMatching;

    logger.debug('처리 상태 검증', {
      isValidMediaFiles,
      isValidFileNames,
      isLengthMatching,
      mediaFilesLength: currentMediaFiles.length,
      fileNamesLength: currentFileNames.length,
      processingFilesCount: processingFiles.size,
      hasMapFileActions,
      isValid,
    });

    return isValid;
  }, [processingFiles.size, hasMapFileActions]);

  useEffect(() => {
    return () => {
      setProcessingFiles(new Map());
      updateQueueRef.current.length = 0;
      processingLockRef.current = false;
      isProcessingQueueRef.current = false;

      console.log('🧹 [CLEANUP] useFileProcessing 정리 완료');
    };
  }, []);

  return {
    processFiles,
    handleFilesDropped,
    handleFileChange,
    validateProcessingState,
  };
};
