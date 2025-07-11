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

type StateUpdaterFunction<T> = (previousValue: T) => T;

interface FileProcessingCallbacks {
  updateMediaValue: (
    filesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
  updateSelectedFileNames: (
    namesOrUpdater: string[] | StateUpdaterFunction<string[]>
  ) => void;
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

const convertFileListToMutableArray = (fileList: FileList): File[] => {
  const fileArray: File[] = [];
  const fileListLength = fileList.length;

  for (let fileIndex = 0; fileIndex < fileListLength; fileIndex++) {
    const currentFile = fileList[fileIndex];
    const isValidFile = currentFile !== null && currentFile !== undefined;

    if (isValidFile) {
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

  logger.debug('useFileProcessing 초기화 - 순차처리 모드 활성화', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    sequentialProcessingEnabled: true,
    raceConditionFixed: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  const processIndividualFileAsync = useCallback(
    (file: File): Promise<void> => {
      return new Promise((resolveFileProcessing, rejectFileProcessing) => {
        const fileId = generateSecureFileId(file.name);
        const { name: fileName } = file;

        console.log('🔍 [SEQUENTIAL_DEBUG] 순차 처리 - 개별 파일 시작:', {
          파일명: fileName,
          파일ID: fileId,
          파일크기: file.size,
          파일타입: file.type,
          현재저장된파일개수: currentStateRef.current.mediaFiles.length,
          순차처리모드: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        logger.debug('순차 파일 처리 시작', {
          fileName,
          fileId,
          fileSize: file.size,
          sequentialMode: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        const validationResult = validateFile(file);
        const { isValid: fileIsValid, errorMessage: validationError } =
          validationResult;

        console.log('🔍 [SEQUENTIAL_DEBUG] 파일 검증 결과:', {
          파일명: fileName,
          검증결과: fileIsValid ? '✅ 유효' : '❌ 무효',
          에러메시지:
            validationError !== null && validationError !== undefined
              ? validationError
              : '없음',
          timestamp: new Date().toLocaleTimeString(),
        });

        if (!fileIsValid) {
          const errorMessage =
            validationError !== null && validationError !== undefined
              ? validationError
              : 'unknown';

          console.log('🔍 [SEQUENTIAL_DEBUG] 파일 검증 실패로 처리 중단:', {
            파일명: fileName,
            에러메시지: errorMessage,
            timestamp: new Date().toLocaleTimeString(),
          });

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

          rejectFileProcessing(new Error(`파일 검증 실패: ${errorMessage}`));
          return;
        }

        console.log('🔍 [SEQUENTIAL_DEBUG] 파일 처리 진행:', {
          파일명: fileName,
          파일ID: fileId,
          다음단계: 'FileReader 생성 및 처리 시작',
          timestamp: new Date().toLocaleTimeString(),
        });

        callbacks.startFileUpload(fileId, fileName);

        const handleProgressUpdate = (progress: number) => {
          console.log('🔍 [SEQUENTIAL_PROGRESS] 파일 처리 진행률:', {
            파일명: fileName,
            진행률: `${progress}%`,
            timestamp: new Date().toLocaleTimeString(),
          });
          callbacks.updateFileProgress(fileId, progress);
        };

        const handleSuccessfulProcessing = (result: string) => {
          console.log('🔍 [SEQUENTIAL_SUCCESS] 파일 처리 성공:', {
            파일명: fileName,
            파일ID: fileId,
            결과URL길이: result.length,
            결과URL미리보기: result.slice(0, 50) + '...',
            순차처리완료: true,
            timestamp: new Date().toLocaleTimeString(),
          });

          setTimeout(() => {
            console.log('🔍 [SEQUENTIAL_SUCCESS] 상태 업데이트 실행:', {
              파일명: fileName,
              파일ID: fileId,
              업데이트방식: '함수형 상태 업데이트',
              순차처리모드: true,
              timestamp: new Date().toLocaleTimeString(),
            });

            logger.debug('순차 처리 - 상태 업데이트 실행', {
              fileName,
              fileId,
              updateMethod: 'functional',
              sequentialMode: true,
              timestamp: new Date().toLocaleTimeString(),
            });

            try {
              console.log('🔍 [SEQUENTIAL_SUCCESS] 함수형 업데이트 시작:', {
                파일명: fileName,
                파일ID: fileId,
                이전방식: '동시 처리로 인한 Race Condition',
                새방식: '순차 처리로 Race Condition 해결',
                timestamp: new Date().toLocaleTimeString(),
              });

              callbacks.updateMediaValue((previousMediaFiles: string[]) => {
                const updatedMediaFiles = [...previousMediaFiles, result];

                console.log(
                  '🔍 [SEQUENTIAL_UPDATE] 미디어 파일 순차 업데이트:',
                  {
                    파일명: fileName,
                    이전파일개수: previousMediaFiles.length,
                    새파일개수: updatedMediaFiles.length,
                    추가된파일: result.slice(0, 30) + '...',
                    순차처리완료: true,
                    raceConditionFixed: true,
                    timestamp: new Date().toLocaleTimeString(),
                  }
                );

                return updatedMediaFiles;
              });

              callbacks.updateSelectedFileNames(
                (previousFileNames: string[]) => {
                  const updatedFileNames = [...previousFileNames, fileName];

                  console.log('🔍 [SEQUENTIAL_UPDATE] 파일명 순차 업데이트:', {
                    파일명: fileName,
                    이전파일명개수: previousFileNames.length,
                    새파일명개수: updatedFileNames.length,
                    추가된파일명: fileName,
                    순차처리완료: true,
                    raceConditionFixed: true,
                    timestamp: new Date().toLocaleTimeString(),
                  });

                  return updatedFileNames;
                }
              );

              callbacks.completeFileUpload(fileId, fileName);

              console.log('🔍 [SEQUENTIAL_SUCCESS] 순차 처리 완료:', {
                파일명: fileName,
                updateMediaValue호출: '함수형 업데이트 완료',
                updateSelectedFileNames호출: '함수형 업데이트 완료',
                completeFileUpload호출: '완료',
                순차처리완료: true,
                raceConditionResolved: true,
                timestamp: new Date().toLocaleTimeString(),
              });

              callbacks.showToastMessage({
                title: '업로드 완료',
                description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
                color: 'success',
              });

              logger.info('순차 파일 업로드 완료', {
                fileName,
                fileId,
                sequentialProcessingCompleted: true,
                raceConditionFixed: true,
              });

              resolveFileProcessing();
            } catch (uploadError) {
              const errorMessage =
                uploadError instanceof Error
                  ? uploadError.message
                  : 'Unknown upload error';

              console.error('🔍 [SEQUENTIAL_ERROR] 업로드 처리 중 오류:', {
                파일명: fileName,
                파일ID: fileId,
                오류: errorMessage,
                timestamp: new Date().toLocaleTimeString(),
              });

              logger.error('순차 업로드 처리 중 오류', {
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

              rejectFileProcessing(
                uploadError instanceof Error
                  ? uploadError
                  : new Error(errorMessage)
              );
            }
          }, 1500);
        };

        const handleProcessingError = (error: Error) => {
          const errorMessage =
            error instanceof Error ? error.message : 'FileReader 에러';

          console.error('🔍 [SEQUENTIAL_ERROR] FileReader 에러:', {
            파일명: fileName,
            파일ID: fileId,
            오류: errorMessage,
            timestamp: new Date().toLocaleTimeString(),
          });

          logger.error('순차 처리 - FileReader 에러', {
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

          rejectFileProcessing(error);
        };

        console.log('🔍 [SEQUENTIAL_DEBUG] createFileReader 호출:', {
          파일명: fileName,
          파일ID: fileId,
          순차처리모드: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        createFileReader(
          file,
          fileId,
          handleProgressUpdate,
          handleSuccessfulProcessing,
          handleProcessingError
        );
      });
    },
    [callbacks]
  );

  const processFiles = useCallback(
    async (files: FileList) => {
      console.log('🔍 [SEQUENTIAL_PROCESS] 순차 파일 처리 시작:', {
        입력파일개수: files.length,
        입력파일명들: Array.from(files).map((file) => file.name),
        현재저장된이미지개수: currentMediaFilesList.length,
        순차처리모드: true,
        raceConditionFix: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.debug('순차 파일 처리 시작', {
        fileCount: files.length,
        sequentialMode: true,
        raceConditionFixed: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const mutableFilesArray = convertFileListToMutableArray(files);

      const duplicateFilterResult = filterDuplicateFiles(
        mutableFilesArray,
        currentSelectedFileNames
      );

      const uniqueFiles: File[] = [];
      const duplicateFiles: File[] = [];

      const {
        uniqueFiles: resultUniqueFiles,
        duplicateFiles: resultDuplicateFiles,
      } = duplicateFilterResult;

      const hasUniqueFiles =
        resultUniqueFiles !== null && resultUniqueFiles !== undefined;
      if (hasUniqueFiles) {
        const uniqueFilesLength = resultUniqueFiles.length;
        for (
          let uniqueIndex = 0;
          uniqueIndex < uniqueFilesLength;
          uniqueIndex++
        ) {
          const uniqueFile = resultUniqueFiles[uniqueIndex];
          const isValidUniqueFile =
            uniqueFile !== null && uniqueFile !== undefined;

          if (isValidUniqueFile) {
            uniqueFiles.push(uniqueFile);
          }
        }
      }

      const hasDuplicateFiles =
        resultDuplicateFiles !== null && resultDuplicateFiles !== undefined;
      if (hasDuplicateFiles) {
        const duplicateFilesLength = resultDuplicateFiles.length;
        for (
          let duplicateIndex = 0;
          duplicateIndex < duplicateFilesLength;
          duplicateIndex++
        ) {
          const duplicateFile = resultDuplicateFiles[duplicateIndex];
          const isValidDuplicateFile =
            duplicateFile !== null && duplicateFile !== undefined;

          if (isValidDuplicateFile) {
            duplicateFiles.push(duplicateFile);
          }
        }
      }

      console.log('🔍 [SEQUENTIAL_PROCESS] 중복 파일 필터링 완료:', {
        입력파일개수: mutableFilesArray.length,
        고유파일개수: uniqueFiles.length,
        중복파일개수: duplicateFiles.length,
        고유파일명들: uniqueFiles.map((file) => file.name),
        중복파일명들: duplicateFiles.map((file) => file.name),
        현재저장된파일명들: currentSelectedFileNames,
        순차처리예정: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasDuplicatesFound = duplicateFiles.length > 0;

      if (hasDuplicatesFound) {
        logger.debug('중복 파일 발견! 애니메이션 표시', {
          duplicateFileNames: duplicateFiles.map((file) => file.name),
          duplicateCount: duplicateFiles.length,
        });

        callbacks.showDuplicateMessage(duplicateFiles);
        callbacks.showToastMessage({
          title: '중복 파일 발견',
          description: `${duplicateFiles.length}개의 중복 파일이 제외되었습니다`,
          color: 'warning',
        });
      }

      const hasNoUniqueFiles = uniqueFiles.length === 0;

      if (hasNoUniqueFiles) {
        console.log('🔍 [SEQUENTIAL_PROCESS] 처리할 고유 파일이 없음:', {
          uniqueFiles개수: uniqueFiles.length,
          중복제거후결과: '모든 파일이 중복되어 처리할 파일 없음',
          timestamp: new Date().toLocaleTimeString(),
        });
        logger.warn('처리할 고유 파일이 없음');
        return;
      }

      console.log(
        '🚀 [SEQUENTIAL_PROCESS] 순차 처리 시작 - Race Condition 해결:',
        {
          처리할파일개수: uniqueFiles.length,
          처리할파일명들: uniqueFiles.map((file) => file.name),
          이전방식: 'forEach 동시 처리 (Race Condition 발생)',
          새방식: 'for...of 순차 처리 (Race Condition 해결)',
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      logger.info('순차 파일 처리 시작 - Race Condition 해결', {
        uniqueFilesCount: uniqueFiles.length,
        uniqueFileNames: uniqueFiles.map((file) => file.name),
        processingMethod: 'sequential',
        raceConditionFixed: true,
      });

      try {
        for (const file of uniqueFiles) {
          console.log('🔍 [SEQUENTIAL_LOOP] 순차 처리 - 파일 처리 시작:', {
            파일명: file.name,
            파일크기: file.size,
            파일타입: file.type,
            처리방식: '순차 처리 (Race Condition 해결)',
            timestamp: new Date().toLocaleTimeString(),
          });

          await processIndividualFileAsync(file);

          console.log('🔍 [SEQUENTIAL_LOOP] 순차 처리 - 파일 처리 완료:', {
            파일명: file.name,
            처리완료: true,
            다음파일준비: true,
            raceConditionAvoided: true,
            timestamp: new Date().toLocaleTimeString(),
          });
        }

        console.log('✅ [SEQUENTIAL_COMPLETE] 모든 파일 순차 처리 완료:', {
          처리된파일개수: uniqueFiles.length,
          처리된파일명들: uniqueFiles.map((file) => file.name),
          raceConditionResolved: true,
          sequentialProcessingSuccess: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        logger.info('모든 파일 순차 처리 완료', {
          processedFilesCount: uniqueFiles.length,
          raceConditionFixed: true,
          sequentialProcessingCompleted: true,
        });
      } catch (sequentialError) {
        const errorMessage =
          sequentialError instanceof Error
            ? sequentialError.message
            : 'Unknown sequential processing error';

        console.error('❌ [SEQUENTIAL_ERROR] 순차 처리 중 오류:', {
          오류: errorMessage,
          처리중이던파일개수: uniqueFiles.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        logger.error('순차 처리 중 오류', {
          error: errorMessage,
          uniqueFilesCount: uniqueFiles.length,
        });

        callbacks.showToastMessage({
          title: '순차 처리 실패',
          description: '파일 순차 처리 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [
      currentSelectedFileNames,
      callbacks,
      currentMediaFilesList,
      processIndividualFileAsync,
    ]
  );

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]) => {
      console.log(
        '🔍 [DROP_HANDLER_DEBUG] handleFilesDropped 호출 - 순차처리:',
        {
          입력파일개수: droppedFilesList.length,
          입력파일명들: droppedFilesList.map((file) => file.name),
          현재저장된이미지개수: currentStateRef.current.mediaFiles.length,
          순차처리모드: true,
          raceConditionFixed: true,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      logger.debug('handleFilesDropped - 순차 처리 모드', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((file) => file.name),
        sequentialMode: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoFiles = droppedFilesList.length === 0;

      if (hasNoFiles) {
        console.log('🔍 [DROP_HANDLER_DEBUG] 드롭된 파일이 없음:', {
          파일개수: droppedFilesList.length,
          timestamp: new Date().toLocaleTimeString(),
        });
        logger.warn('드롭된 파일이 없음');
        return;
      }

      console.log('🔍 [DROP_HANDLER_DEBUG] FileList 변환 시작:', {
        입력파일개수: droppedFilesList.length,
        변환함수: 'convertFilesToFileList',
        timestamp: new Date().toLocaleTimeString(),
      });

      const fileListObject = convertFilesToFileList(droppedFilesList);

      console.log('🔍 [DROP_HANDLER_DEBUG] 순차 처리 호출 예정:', {
        변환후FileList길이: fileListObject.length,
        processFiles호출예정: true,
        순차처리모드: true,
        raceConditionFixed: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      processFiles(fileListObject);
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🔍 [CHANGE_DEBUG] handleFileChange 호출 - 순차처리:', {
        변경된파일개수: changedFileList.length,
        변경된파일명들: Array.from(changedFileList).map((file) => file.name),
        순차처리모드: true,
        raceConditionFixed: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.debug('handleFileChange - 순차 처리 모드', {
        fileCount: changedFileList.length,
        sequentialMode: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasFiles = changedFileList.length > 0;

      const changeAction = hasFiles
        ? 'process-files-sequential'
        : 'skip-processing';

      if (hasFiles) {
        console.log('🔍 [CHANGE_DEBUG] 파일 변경 감지, 순차 처리 시작:', {
          파일개수: changedFileList.length,
          changeAction,
          순차처리사용: true,
          raceConditionFixed: true,
          timestamp: new Date().toLocaleTimeString(),
        });
        logger.debug('파일 변경 감지, 순차 처리 시작', {
          fileCount: changedFileList.length,
          changeAction,
          sequentialMode: true,
        });
        processFiles(changedFileList);
      } else {
        console.log('🔍 [CHANGE_DEBUG] 변경된 파일이 없음:', {
          파일개수: changedFileList.length,
          changeAction,
          timestamp: new Date().toLocaleTimeString(),
        });
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

    console.log('🔍 [VALIDATE_DEBUG] 순차 처리 상태 검증:', {
      현재미디어파일개수: currentMediaFiles.length,
      현재파일명개수: currentFileNames.length,
      hasValidMediaFiles,
      hasValidFileNames,
      hasConsistentLength,
      isValidState,
      순차처리모드: true,
      raceConditionFixed: true,
      timestamp: new Date().toLocaleTimeString(),
    });

    logger.debug('순차 처리 상태 검증', {
      hasValidMediaFiles,
      hasValidFileNames,
      hasConsistentLength,
      isValidState,
      mediaFilesCount: currentMediaFiles.length,
      fileNamesCount: currentFileNames.length,
      sequentialMode: true,
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
