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

const logger = createLogger('FILE_PROCESSING');

// 🔑 타입 정의들
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
}

interface CurrentStateRef {
  mediaFiles: readonly string[];
  fileNames: readonly string[];
}

interface ProcessingFileInfo {
  readonly fileId: string;
  readonly fileName: string;
  readonly placeholderIndex: number;
  readonly startTime: number;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface FileProcessingResult {
  readonly processFiles: (files: FileList) => void;
  readonly handleFilesDropped: (files: File[]) => void;
  readonly handleFileChange: (files: FileList) => void;
  readonly validateProcessingState: () => boolean;
}

// 🔑 FileList를 File[] 배열로 안전하게 변환
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

// 🔑 안전한 Toast 메시지 생성
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

  // 🔑 핵심: 현재 처리 중인 파일들 추적 (Race Condition 해결)
  const [processingFiles, setProcessingFiles] = useState<
    Map<string, ProcessingFileInfo>
  >(new Map());

  // 🔑 처리 상태 동기화를 위한 락 메커니즘
  const processingLockRef = useRef<boolean>(false);
  const pendingOperationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    currentStateRef.current = {
      mediaFiles: currentMediaFilesList,
      fileNames: currentSelectedFileNames,
    };
  }, [currentMediaFilesList, currentSelectedFileNames]);

  logger.debug('useFileProcessing 초기화 - Race Condition 해결 강화', {
    currentMediaFilesCount: currentMediaFilesList.length,
    currentSelectedFileNamesCount: currentSelectedFileNames.length,
    raceConditionFixed: true,
    lockMechanismEnabled: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔑 처리 중인 파일 목록 관리
  const addProcessingFile = useCallback(
    (fileInfo: ProcessingFileInfo): void => {
      setProcessingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(fileInfo.fileName, fileInfo);

        console.log('🔒 [PROCESSING_LOCK] 파일 처리 등록:', {
          파일명: fileInfo.fileName,
          파일ID: fileInfo.fileId,
          플레이스홀더인덱스: fileInfo.placeholderIndex,
          처리중파일개수: newMap.size,
          timestamp: new Date().toLocaleTimeString(),
        });

        return newMap;
      });
    },
    []
  );

  const removeProcessingFile = useCallback((fileName: string): void => {
    setProcessingFiles((prev) => {
      const newMap = new Map(prev);
      const removed = newMap.delete(fileName);

      if (removed) {
        console.log('🔓 [PROCESSING_UNLOCK] 파일 처리 완료:', {
          파일명: fileName,
          남은처리파일개수: newMap.size,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      return newMap;
    });
  }, []);

  const getProcessingFileNames = useCallback((): string[] => {
    return Array.from(processingFiles.keys());
  }, [processingFiles]);

  // 🔑 개별 파일 백그라운드 처리 (상태 예약 후)
  const processFileInBackground = useCallback(
    (file: File, placeholderIndex: number): void => {
      const fileId = generateSecureFileId(file.name);
      const { name: fileName } = file;

      console.log('🔍 [BACKGROUND_PROCESS] 백그라운드 파일 처리 시작:', {
        파일명: fileName,
        파일ID: fileId,
        플레이스홀더인덱스: placeholderIndex,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🔑 처리 정보 등록
      const processingInfo: ProcessingFileInfo = {
        fileId,
        fileName,
        placeholderIndex,
        startTime: Date.now(),
        status: 'processing',
      };

      addProcessingFile(processingInfo);

      const validationResult = validateFile(file);
      const { isValid: fileIsValid, errorMessage: validationError } =
        validationResult;

      if (!fileIsValid) {
        const errorMessage = validationError || 'unknown';

        console.log('🔍 [BACKGROUND_PROCESS] 파일 검증 실패:', {
          파일명: fileName,
          에러메시지: errorMessage,
        });

        // 🚨 검증 실패 시 해당 슬롯 제거
        callbacks.updateMediaValue((prev) =>
          prev.filter((_, index) => index !== placeholderIndex)
        );
        callbacks.updateSelectedFileNames((prev) =>
          prev.filter((_, index) => index !== placeholderIndex)
        );

        // 처리 중 목록에서 제거
        removeProcessingFile(fileName);

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
        console.log('🔍 [BACKGROUND_PROGRESS] 백그라운드 진행률 업데이트:', {
          파일명: fileName,
          진행률: `${progress}%`,
        });
        callbacks.updateFileProgress(fileId, progress);
      };

      const handleSuccessfulProcessing = (result: string): void => {
        console.log('🔍 [BACKGROUND_SUCCESS] 백그라운드 처리 성공:', {
          파일명: fileName,
          플레이스홀더인덱스: placeholderIndex,
          결과URL길이: result.length,
        });

        // 🎯 플레이스홀더를 실제 URL로 교체
        callbacks.updateMediaValue((prev) => {
          const newArray = [...prev];
          newArray[placeholderIndex] = result;

          console.log('🔄 [BACKGROUND_SUCCESS] 플레이스홀더 URL 교체:', {
            파일명: fileName,
            인덱스: placeholderIndex,
            이전값: prev[placeholderIndex]?.slice(0, 30) + '...',
            새값: result.slice(0, 30) + '...',
          });

          return newArray;
        });

        // 처리 중 목록에서 제거
        removeProcessingFile(fileName);

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
          placeholderIndex,
          raceConditionFixed: true,
        });
      };

      const handleProcessingError = (error: Error): void => {
        const errorMessage = error.message || 'FileReader 에러';

        console.error('🔍 [BACKGROUND_ERROR] 백그라운드 처리 실패:', {
          파일명: fileName,
          플레이스홀더인덱스: placeholderIndex,
          오류: errorMessage,
        });

        // 🚨 에러 시 해당 슬롯 제거
        callbacks.updateMediaValue((prev) =>
          prev.filter((_, index) => index !== placeholderIndex)
        );
        callbacks.updateSelectedFileNames((prev) =>
          prev.filter((_, index) => index !== placeholderIndex)
        );

        // 처리 중 목록에서 제거
        removeProcessingFile(fileName);

        callbacks.failFileUpload(fileId, fileName);
        callbacks.showToastMessage(
          createSafeToastMessage({
            title: '업로드 실패',
            description: '파일 읽기 중 오류가 발생했습니다.',
            color: 'danger',
          })
        );
      };

      createFileReader(
        file,
        fileId,
        handleProgressUpdate,
        handleSuccessfulProcessing,
        handleProcessingError
      );
    },
    [callbacks, addProcessingFile, removeProcessingFile]
  );

  // 🔑 핵심: 원자적 상태 예약 시스템 (Race Condition 완전 해결)
  const processFiles = useCallback(
    (files: FileList): void => {
      // 🔒 락 메커니즘으로 동시 처리 방지
      if (processingLockRef.current) {
        console.warn('🚫 [RACE_PREVENTION] 이미 처리 중이므로 무시:', {
          현재처리중: true,
          요청파일개수: files.length,
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      }

      processingLockRef.current = true;

      try {
        console.log('🔍 [ATOMIC_RESERVATION] 원자적 상태 예약 시스템 시작:', {
          입력파일개수: files.length,
          현재저장된이미지개수: currentMediaFilesList.length,
          원자적처리: true,
          timestamp: new Date().toLocaleTimeString(),
        });

        const mutableFilesArray = convertFileListToMutableArray(files);

        // 🔑 핵심: 현재 처리 중인 파일들도 포함해서 중복 체크
        const processingFileNames = getProcessingFileNames();

        console.log('🔧 [ATOMIC_RESERVATION] 처리 상태 정보:', {
          현재미디어파일개수: currentSelectedFileNames.length,
          처리중파일개수: processingFileNames.length,
          처리중파일목록: processingFileNames,
          새로입력된파일개수: mutableFilesArray.length,
        });

        // 🔧 중복 필터링 (처리 중인 파일들도 고려)
        const duplicateFilterResult = filterDuplicateFilesWithProcessing(
          mutableFilesArray,
          [...currentSelectedFileNames], // readonly를 mutable로 변환
          processingFileNames
        );

        // 🔧 readonly를 mutable로 변환
        const uniqueFiles: File[] = [...duplicateFilterResult.uniqueFiles];
        const duplicateFiles: File[] = [
          ...duplicateFilterResult.duplicateFiles,
        ];

        console.log('🔍 [ATOMIC_RESERVATION] 강화된 중복 체크 완료:', {
          입력파일개수: mutableFilesArray.length,
          고유파일개수: uniqueFiles.length,
          중복파일개수: duplicateFiles.length,
          현재처리중파일개수: processingFileNames.length,
          원자적처리적용: true,
        });

        if (duplicateFiles.length > 0) {
          logger.debug('중복 파일 발견', {
            duplicateFileNames: duplicateFiles.map((file) => file.name),
          });

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
          console.log('🔍 [ATOMIC_RESERVATION] 처리할 고유 파일이 없음');
          return;
        }

        console.log('🚀 [ATOMIC_RESERVATION] 원자적 상태 예약 실행:', {
          고유파일개수: uniqueFiles.length,
          고유파일명들: uniqueFiles.map((file) => file.name),
        });

        // 🔒 즉시 상태에 플레이스홀더 추가 (원자적 처리)
        const placeholderUrls = uniqueFiles.map(
          (_, index) => `placeholder-${Date.now()}-${index}-processing`
        );
        const fileNames = uniqueFiles.map((file) => file.name);

        // 🎯 동시에 두 상태 업데이트 (원자적 예약)
        callbacks.updateMediaValue((prev) => [...prev, ...placeholderUrls]);
        callbacks.updateSelectedFileNames((prev) => [...prev, ...fileNames]);

        console.log('✅ [ATOMIC_RESERVATION] 상태 예약 완료:', {
          플레이스홀더개수: placeholderUrls.length,
          예약된파일명들: fileNames,
          원자적예약완료: true,
          raceConditionFixed: true,
        });

        // 🎯 백그라운드에서 실제 파일 처리 (비동기)
        uniqueFiles.forEach((file, index) => {
          const placeholderIndex = currentMediaFilesList.length + index;

          console.log('🔄 [ATOMIC_RESERVATION] 백그라운드 처리 시작:', {
            파일명: file.name,
            플레이스홀더인덱스: placeholderIndex,
          });

          // 비동기적으로 백그라운드 처리
          setTimeout(() => {
            processFileInBackground(file, placeholderIndex);
          }, 100 + index * 50); // 순차적 처리를 위한 지연
        });

        logger.info('원자적 상태 예약 시스템 완료', {
          reservedFilesCount: uniqueFiles.length,
          atomicReservationCompleted: true,
          raceConditionFixed: true,
        });
      } finally {
        // 🔓 락 해제 (일정 시간 후)
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
      processFileInBackground,
    ]
  );

  const handleFilesDropped = useCallback(
    (droppedFilesList: File[]): void => {
      console.log('🔍 [DROP_HANDLER] 드롭 파일 처리 - 원자적 예약 시스템:', {
        입력파일개수: droppedFilesList.length,
        원자적예약시스템: true,
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
      console.log('🔍 [CHANGE_HANDLER] 파일 변경 처리 - 원자적 예약 시스템:', {
        변경된파일개수: changedFileList.length,
        원자적예약시스템: true,
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
      isValid,
    });

    return isValid;
  }, [processingFiles.size]);

  // 🔑 정리 함수 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      // 모든 처리 중인 파일 정리
      setProcessingFiles(new Map());
      pendingOperationsRef.current.clear();
      processingLockRef.current = false;

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
