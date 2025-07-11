// 📁 imageUpload/hooks/useFileProcessing.ts

import { useRef, useCallback, useEffect } from 'react';
import { createLogger } from '../utils/loggerUtils';
import { validateFile } from '../../utils/fileValidationUtils';
import { generateSecureFileId } from '../utils/fileIdUtils';
import { filterDuplicateFiles } from '../utils/duplicateFileUtils';
import {
  createFileReader,
  convertFilesToFileList,
} from '../utils/fileProcessingUtils';

const logger = createLogger('FILE_PROCESSING');

interface FileProcessingCallbacks {
  updateMediaValue: (files: string[]) => void;
  updateSelectedFileNames: (names: string[]) => void;
  showToastMessage: (toast: unknown) => void;
  showDuplicateMessage: (files: File[]) => void;
  startFileUpload: (fileId: string, fileName: string) => void;
  updateFileProgress: (fileId: string, progress: number) => void;
  completeFileUpload: (fileId: string, fileName: string) => void;
  failFileUpload: (fileId: string, fileName: string) => void;
}

interface CurrentStateRef {
  mediaFiles: string[];
  fileNames: string[];
}

export const useFileProcessing = (
  currentMediaFilesList: string[],
  currentSelectedFileNames: string[],
  callbacks: FileProcessingCallbacks
) => {
  const currentStateRef = useRef<CurrentStateRef>({
    mediaFiles: currentMediaFilesList,
    fileNames: currentSelectedFileNames,
  });

  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };
  }, [currentMediaFilesList, currentSelectedFileNames]);

  logger.debug('useFileProcessing 초기화 - React Hook Form 중심', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const processFiles = useCallback(
    (files: FileList) => {
      logger.debug('processFiles 시작 - React Hook Form 중심', {
        fileCount: files.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const filesArray = Array.from(files);
      const { uniqueFiles, duplicateFiles } = filterDuplicateFiles(
        filesArray,
        currentSelectedFileNames
      );

      const hasDuplicateFiles = duplicateFiles.length > 0;

      // 🔧 삼항연산자 사용
      const duplicateAction = hasDuplicateFiles
        ? 'show-animation'
        : 'skip-animation';

      if (hasDuplicateFiles) {
        logger.debug('중복 파일 발견! 애니메이션 표시', {
          duplicateFileNames: duplicateFiles.map((file) => file.name),
          duplicateCount: duplicateFiles.length,
          duplicateAction,
        });

        callbacks.showDuplicateMessage(duplicateFiles);
        callbacks.showToastMessage({
          title: '중복 파일 발견',
          description: `${duplicateFiles.length}개의 중복 파일이 제외되었습니다`,
          color: 'warning',
        });
      }

      const hasNoUniqueFiles = uniqueFiles.length === 0;

      // 🔧 early return으로 중첩 방지
      if (hasNoUniqueFiles) {
        logger.warn('업로드할 고유 파일이 없음');
        return;
      }

      logger.info('고유 파일들 업로드 시작', {
        uniqueFilesCount: uniqueFiles.length,
        uniqueFileNames: uniqueFiles.map((file) => file.name),
      });

      uniqueFiles.forEach((file) => {
        processIndividualFile(file);
      });
    },
    [currentSelectedFileNames, callbacks]
  );

  const processIndividualFile = useCallback(
    (file: File) => {
      const fileId = generateSecureFileId(file.name);
      const { name: fileName } = file;

      logger.debug('개별 파일 처리 시작 - React Hook Form 중심', {
        fileName,
        fileId,
        fileSize: file.size,
        timestamp: new Date().toLocaleTimeString(),
      });

      const validationResult = validateFile(file);
      const { isValid: fileIsValid, errorMessage: validationError } =
        validationResult;

      const isInvalidFile = !fileIsValid;

      // 🔧 early return으로 중첩 방지
      if (isInvalidFile) {
        const errorMessage =
          validationError !== null && validationError !== undefined
            ? validationError
            : 'unknown';

        logger.error('파일 검증 실패', {
          fileName,
          error: errorMessage,
        });

        callbacks.failFileUpload(fileId, fileName);
        callbacks.showToastMessage({
          title: '업로드 실패',
          description:
            errorMessage !== 'unknown'
              ? errorMessage
              : `${fileName} 파일 검증에 실패했습니다.`,
          color: 'danger',
        });
        return;
      }

      callbacks.startFileUpload(fileId, fileName);

      const handleProgress = (progress: number) => {
        callbacks.updateFileProgress(fileId, progress);
      };

      const handleSuccess = (result: string) => {
        setTimeout(() => {
          logger.debug('setTimeout 콜백 실행 - React Hook Form 중심', {
            fileName,
            fileId,
            timestamp: new Date().toLocaleTimeString(),
          });

          try {
            const { mediaFiles: latestMediaFiles, fileNames: latestFileNames } =
              currentStateRef.current;

            // 🔧 React Hook Form만 업데이트 (Zustand는 자동 동기화됨)
            const updatedMediaFiles = [...latestMediaFiles, result];
            const updatedFileNames = [...latestFileNames, fileName];

            callbacks.updateMediaValue(updatedMediaFiles);
            callbacks.updateSelectedFileNames(updatedFileNames);
            callbacks.completeFileUpload(fileId, fileName);

            callbacks.showToastMessage({
              title: '업로드 완료',
              description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
              color: 'success',
            });

            logger.info('파일 업로드 완료 (자동 동기화 대기)', {
              fileName,
              fileId,
              totalMediaCount: updatedMediaFiles.length,
              reactHookFormUpdated: true,
              zustandAutoSyncPending: true,
            });
          } catch (uploadError) {
            const errorMessage =
              uploadError instanceof Error
                ? uploadError.message
                : 'Unknown upload error';

            logger.error('업로드 처리 중 오류', {
              fileName,
              fileId,
              error: errorMessage,
            });

            callbacks.failFileUpload(fileId, fileName);
            callbacks.showToastMessage({
              title: '파일 추가 실패',
              description: '파일을 추가하는 중 오류가 발생했습니다.',
              color: 'danger',
            });
          }
        }, 1500);
      };

      const handleError = (error: Error) => {
        const errorMessage =
          error instanceof Error ? error.message : 'FileReader 에러';

        logger.error('FileReader 에러', {
          fileName,
          fileId,
          error: errorMessage,
        });

        callbacks.failFileUpload(fileId, fileName);
        callbacks.showToastMessage({
          title: '업로드 실패',
          description: '파일 읽기 중 오류가 발생했습니다.',
          color: 'danger',
        });
      };

      createFileReader(
        file,
        fileId,
        handleProgress,
        handleSuccess,
        handleError
      );
    },
    [callbacks]
  );

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      logger.debug('handleFilesDropped - React Hook Form 중심', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((file) => file.name),
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoFiles = droppedFilesList.length === 0;

      // 🔧 early return으로 중첩 방지
      if (hasNoFiles) {
        logger.warn('드롭된 파일이 없음');
        return;
      }

      const fileListObject = convertFilesToFileList(droppedFilesList);
      processFiles(fileListObject);
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      logger.debug('handleFileChange - React Hook Form 중심', {
        fileCount: changedFileList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasFiles = changedFileList.length > 0;

      // 🔧 삼항연산자 사용
      const changeAction = hasFiles ? 'process-files' : 'skip-processing';

      if (hasFiles) {
        logger.debug('파일 변경 감지, 처리 시작', {
          fileCount: changedFileList.length,
          changeAction,
        });
        processFiles(changedFileList);
      } else {
        logger.debug('변경된 파일이 없음', { changeAction });
      }
    },
    [processFiles]
  );

  const validateProcessingState = useCallback((): boolean => {
    const { mediaFiles: currentMediaFiles, fileNames: currentFileNames } =
      currentStateRef.current;

    const hasValidMediaFiles = Array.isArray(currentMediaFiles);
    const hasValidFileNames = Array.isArray(currentFileNames);
    const hasConsistentLength =
      currentMediaFiles.length === currentFileNames.length;

    const isValidState =
      hasValidMediaFiles && hasValidFileNames && hasConsistentLength;

    logger.debug('파일 처리 상태 검증', {
      hasValidMediaFiles,
      hasValidFileNames,
      hasConsistentLength,
      isValidState,
      mediaFilesCount: currentMediaFiles.length,
      fileNamesCount: currentFileNames.length,
    });

    return isValidState;
  }, []);

  return {
    processFiles,
    handleFilesDropped,
    handleFileChange,
    validateProcessingState,
  };
};
