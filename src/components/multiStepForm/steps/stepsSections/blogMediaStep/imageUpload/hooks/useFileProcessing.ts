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

// 🔧 핵심 수정: 함수형 상태 업데이트를 지원하는 타입 정의
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

// 🔧 타입 안전한 File 배열 변환 함수
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

  logger.debug('useFileProcessing 초기화 - 함수형 상태 업데이트 지원됨', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    functionalUpdateSupported: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  const processFiles = useCallback(
    (files: FileList) => {
      console.log('🔍 [PROCESS_DEBUG] processFiles 시작:', {
        입력파일개수: files.length,
        입력파일명들: Array.from(files).map((file) => file.name),
        현재저장된이미지개수: currentMediaFilesList.length,
        현재파일명개수: currentSelectedFileNames.length,
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.debug('processFiles 시작 - 함수형 업데이트 지원', {
        fileCount: files.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const mutableFilesArray = convertFileListToMutableArray(files);

      const duplicateFilterResult = filterDuplicateFiles(
        mutableFilesArray,
        currentSelectedFileNames
      );

      // 🔧 타입 안전한 변환: readonly File[] → File[]
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

      console.log('🔍 [PROCESS_DEBUG] 중복 파일 필터링 완료:', {
        입력파일개수: mutableFilesArray.length,
        고유파일개수: uniqueFiles.length,
        중복파일개수: duplicateFiles.length,
        고유파일명들: uniqueFiles.map((file) => file.name),
        중복파일명들: duplicateFiles.map((file) => file.name),
        현재저장된파일명들: currentSelectedFileNames,
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
        console.log('🔍 [PROCESS_DEBUG] 업로드할 고유 파일이 없음:', {
          uniqueFiles개수: uniqueFiles.length,
          중복제거후결과: '모든 파일이 중복되어 처리할 파일 없음',
          timestamp: new Date().toLocaleTimeString(),
        });
        logger.warn('업로드할 고유 파일이 없음');
        return;
      }

      console.log('🔍 [PROCESS_DEBUG] 개별 파일 처리 시작 - 함수형 업데이트:', {
        처리할파일개수: uniqueFiles.length,
        처리할파일명들: uniqueFiles.map((file) => file.name),
        함수형업데이트지원됨: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.info('고유 파일들 업로드 시작 - 함수형 업데이트 지원', {
        uniqueFilesCount: uniqueFiles.length,
        uniqueFileNames: uniqueFiles.map((file) => file.name),
      });

      uniqueFiles.forEach((file, index) => {
        console.log('🔍 [PROCESS_DEBUG] 개별 파일 처리 호출:', {
          파일인덱스: index,
          파일명: file.name,
          파일크기: file.size,
          파일타입: file.type,
          함수형업데이트사용: true,
          timestamp: new Date().toLocaleTimeString(),
        });
        processIndividualFile(file);
      });
    },
    [currentSelectedFileNames, callbacks, currentMediaFilesList]
  );

  const processIndividualFile = useCallback(
    (file: File) => {
      const fileId = generateSecureFileId(file.name);
      const { name: fileName } = file;

      console.log('🔍 [INDIVIDUAL_DEBUG] 개별 파일 처리 시작:', {
        파일명: fileName,
        파일ID: fileId,
        파일크기: file.size,
        파일타입: file.type,
        현재저장된파일개수: currentStateRef.current.mediaFiles.length,
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.debug('개별 파일 처리 시작 - 함수형 상태 업데이트 지원', {
        fileName,
        fileId,
        fileSize: file.size,
        timestamp: new Date().toLocaleTimeString(),
      });

      const validationResult = validateFile(file);
      const { isValid: fileIsValid, errorMessage: validationError } =
        validationResult;

      console.log('🔍 [INDIVIDUAL_DEBUG] 파일 검증 결과:', {
        파일명: fileName,
        검증결과: fileIsValid ? '✅ 유효' : '❌ 무효',
        에러메시지:
          validationError !== null && validationError !== undefined
            ? validationError
            : '없음',
        timestamp: new Date().toLocaleTimeString(),
      });

      const isInvalidFile = !fileIsValid;

      if (isInvalidFile) {
        const errorMessage =
          validationError !== null && validationError !== undefined
            ? validationError
            : 'unknown';

        console.log('🔍 [INDIVIDUAL_DEBUG] 파일 검증 실패로 처리 중단:', {
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
        return;
      }

      console.log('🔍 [INDIVIDUAL_DEBUG] 파일 처리 진행:', {
        파일명: fileName,
        파일ID: fileId,
        다음단계: 'FileReader 생성 및 처리 시작',
        timestamp: new Date().toLocaleTimeString(),
      });

      callbacks.startFileUpload(fileId, fileName);

      const handleProgress = (progress: number) => {
        console.log('🔍 [PROGRESS_DEBUG] 파일 처리 진행률:', {
          파일명: fileName,
          진행률: `${progress}%`,
          timestamp: new Date().toLocaleTimeString(),
        });
        callbacks.updateFileProgress(fileId, progress);
      };

      const handleSuccess = (result: string) => {
        console.log('🔍 [SUCCESS_DEBUG] 파일 처리 성공 - 함수형 업데이트:', {
          파일명: fileName,
          파일ID: fileId,
          결과URL길이: result.length,
          결과URL미리보기: result.slice(0, 50) + '...',
          함수형업데이트사용: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        setTimeout(() => {
          console.log(
            '🔍 [SUCCESS_DEBUG] setTimeout 콜백 실행 - 함수형 업데이트:',
            {
              파일명: fileName,
              파일ID: fileId,
              업데이트방식: '함수형 상태 업데이트',
              타입에러해결됨: true,
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          logger.debug('setTimeout 콜백 실행 - 함수형 상태 업데이트', {
            fileName,
            fileId,
            updateMethod: 'functional',
            timestamp: new Date().toLocaleTimeString(),
          });

          try {
            console.log('🔍 [SUCCESS_DEBUG] 함수형 업데이트 시작:', {
              파일명: fileName,
              파일ID: fileId,
              이전방식: '직접 배열 전달 (타입 에러)',
              새방식: '함수형 업데이트로 타입 에러 해결',
              timestamp: new Date().toLocaleTimeString(),
            });

            // 🔧 핵심 수정: 함수형 상태 업데이트로 타입 에러 해결
            callbacks.updateMediaValue((previousMediaFiles: string[]) => {
              const updatedMediaFiles = [...previousMediaFiles, result];

              console.log(
                '🔍 [FUNCTIONAL_UPDATE] 미디어 파일 함수형 업데이트:',
                {
                  파일명: fileName,
                  이전파일개수: previousMediaFiles.length,
                  새파일개수: updatedMediaFiles.length,
                  추가된파일: result.slice(0, 30) + '...',
                  타입에러해결됨: true,
                  timestamp: new Date().toLocaleTimeString(),
                }
              );

              return updatedMediaFiles;
            });

            callbacks.updateSelectedFileNames((previousFileNames: string[]) => {
              const updatedFileNames = [...previousFileNames, fileName];

              console.log('🔍 [FUNCTIONAL_UPDATE] 파일명 함수형 업데이트:', {
                파일명: fileName,
                이전파일명개수: previousFileNames.length,
                새파일명개수: updatedFileNames.length,
                추가된파일명: fileName,
                타입에러해결됨: true,
                timestamp: new Date().toLocaleTimeString(),
              });

              return updatedFileNames;
            });

            callbacks.completeFileUpload(fileId, fileName);

            console.log('🔍 [SUCCESS_DEBUG] 함수형 업데이트 완료:', {
              파일명: fileName,
              updateMediaValue호출: '함수형 업데이트 완료',
              updateSelectedFileNames호출: '함수형 업데이트 완료',
              completeFileUpload호출: '완료',
              타입에러해결: true,
              timestamp: new Date().toLocaleTimeString(),
            });

            callbacks.showToastMessage({
              title: '업로드 완료',
              description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
              color: 'success',
            });

            logger.info('파일 업로드 완료 - 함수형 업데이트로 타입 에러 해결', {
              fileName,
              fileId,
              functionalUpdateApplied: true,
              typeErrorResolved: true,
            });
          } catch (uploadError) {
            const errorMessage =
              uploadError instanceof Error
                ? uploadError.message
                : 'Unknown upload error';

            console.error('🔍 [SUCCESS_DEBUG] 업로드 처리 중 오류:', {
              파일명: fileName,
              파일ID: fileId,
              오류: errorMessage,
              timestamp: new Date().toLocaleTimeString(),
            });

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

        console.error('🔍 [ERROR_DEBUG] FileReader 에러:', {
          파일명: fileName,
          파일ID: fileId,
          오류: errorMessage,
          timestamp: new Date().toLocaleTimeString(),
        });

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

      console.log('🔍 [INDIVIDUAL_DEBUG] createFileReader 호출:', {
        파일명: fileName,
        파일ID: fileId,
        timestamp: new Date().toLocaleTimeString(),
      });

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
      console.log('🔍 [DROP_HANDLER_DEBUG] handleFilesDropped 호출:', {
        입력파일개수: droppedFilesList.length,
        입력파일명들: droppedFilesList.map((file) => file.name),
        현재저장된이미지개수: currentStateRef.current.mediaFiles.length,
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.debug('handleFilesDropped - 함수형 상태 업데이트 지원', {
        fileCount: droppedFilesList.length,
        fileNames: droppedFilesList.map((file) => file.name),
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

      console.log(
        '🔍 [DROP_HANDLER_DEBUG] FileList 변환 완료, processFiles 호출:',
        {
          변환후FileList길이: fileListObject.length,
          processFiles호출예정: true,
          함수형업데이트지원: true,
          timestamp: new Date().toLocaleTimeString(),
        }
      );

      processFiles(fileListObject);
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (changedFileList: FileList) => {
      console.log('🔍 [CHANGE_DEBUG] handleFileChange 호출:', {
        변경된파일개수: changedFileList.length,
        변경된파일명들: Array.from(changedFileList).map((file) => file.name),
        함수형업데이트지원: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      logger.debug('handleFileChange - 함수형 상태 업데이트 지원', {
        fileCount: changedFileList.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasFiles = changedFileList.length > 0;

      const changeAction = hasFiles ? 'process-files' : 'skip-processing';

      if (hasFiles) {
        console.log('🔍 [CHANGE_DEBUG] 파일 변경 감지, 처리 시작:', {
          파일개수: changedFileList.length,
          changeAction,
          함수형업데이트사용: true,
          timestamp: new Date().toLocaleTimeString(),
        });
        logger.debug('파일 변경 감지, 처리 시작 - 함수형 업데이트 지원', {
          fileCount: changedFileList.length,
          changeAction,
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

    console.log('🔍 [VALIDATE_DEBUG] 파일 처리 상태 검증:', {
      현재미디어파일개수: currentMediaFiles.length,
      현재파일명개수: currentFileNames.length,
      hasValidMediaFiles,
      hasValidFileNames,
      hasConsistentLength,
      isValidState,
      함수형업데이트지원: true,
      timestamp: new Date().toLocaleTimeString(),
    });

    logger.debug('파일 처리 상태 검증 - 함수형 업데이트 지원', {
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
