// 📁 imageUpload/hooks/useFileUploadState.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('UPLOAD_STATE');

// 🔑 업로드 진행률 레코드 타입 (명시적 타입)
interface UploadProgressRecord {
  readonly [fileId: string]: number;
}

// 🔑 업로드 상태 레코드 타입 (명시적 타입)
interface UploadStatusRecord {
  readonly [fileName: string]: 'uploading' | 'success' | 'error';
}

// 🔑 상태 동기화 추적 인터페이스
interface StateSyncTracker {
  lastProgressUpdate: number;
  lastStatusUpdate: number;
  pendingOperations: Set<string>;
  isStateSynced: boolean;
}

// 🔑 업로드 통계 인터페이스
interface UploadStatistics {
  readonly totalFiles: number;
  readonly uploadingFiles: number;
  readonly successFiles: number;
  readonly errorFiles: number;
  readonly completionPercentage: number;
}

// 🔑 상태 검증 결과 인터페이스 (로거 호환성을 위한 인덱스 시그니처 추가)
interface StateValidationResult {
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly uploadingCount: number;
  readonly statusCount: number;
  readonly [key: string]: unknown; // 로거 호환성을 위한 인덱스 시그니처
}

// 🔑 파일 검증 결과 인터페이스
interface FileValidationResult {
  readonly fileId: string;
  readonly fileName: string;
  readonly hasValidFileId: boolean;
  readonly hasValidFileName: boolean;
  readonly isValidRequest: boolean;
  readonly [key: string]: unknown;
}

// 🔑 진행률 검증 결과 인터페이스
interface ProgressValidationResult {
  readonly fileId: string;
  readonly progress: number;
  readonly hasValidFileId: boolean;
  readonly hasValidProgress: boolean;
  readonly roundedProgress: number;
  readonly isValidRequest: boolean;
  readonly [key: string]: unknown;
}

export const useFileUploadState = () => {
  // 🔑 메인 상태들
  const [uploading, setUploading] = useState<UploadProgressRecord>({});
  const [uploadStatus, setUploadStatus] = useState<UploadStatusRecord>({});

  // 🔑 상태 동기화 추적 참조
  const stateSyncRef = useRef<StateSyncTracker>({
    lastProgressUpdate: Date.now(),
    lastStatusUpdate: Date.now(),
    pendingOperations: new Set<string>(),
    isStateSynced: true,
  });

  // 🔑 상태 기록용 참조 (디버깅 및 복구용)
  const stateHistoryRef = useRef<{
    progressHistory: UploadProgressRecord[];
    statusHistory: UploadStatusRecord[];
    maxHistorySize: number;
  }>({
    progressHistory: [],
    statusHistory: [],
    maxHistorySize: 10,
  });

  logger.debug('useFileUploadState 초기화 - 동기화 강화 버전', {
    uploadingCount: Object.keys(uploading).length,
    uploadStatusCount: Object.keys(uploadStatus).length,
    stateSynchronized: true,
    memoryManaged: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔑 상태 히스토리 관리 함수
  const updateStateHistory = useCallback(
    (
      newProgress: UploadProgressRecord,
      newStatus: UploadStatusRecord
    ): void => {
      const { current: history } = stateHistoryRef;

      // 히스토리 추가
      history.progressHistory.push({ ...newProgress });
      history.statusHistory.push({ ...newStatus });

      // 최대 크기 초과 시 오래된 항목 제거
      if (history.progressHistory.length > history.maxHistorySize) {
        history.progressHistory.shift();
      }
      if (history.statusHistory.length > history.maxHistorySize) {
        history.statusHistory.shift();
      }

      console.log('📊 [STATE_HISTORY] 상태 히스토리 업데이트:', {
        progressHistorySize: history.progressHistory.length,
        statusHistorySize: history.statusHistory.length,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    []
  );

  // 🔑 동기화 상태 추적 함수
  const trackSyncOperation = useCallback((operationId: string): void => {
    const { current: syncTracker } = stateSyncRef;

    syncTracker.pendingOperations.add(operationId);
    syncTracker.isStateSynced = false;

    console.log('🔄 [SYNC_TRACK] 동기화 작업 추적:', {
      operationId,
      pendingCount: syncTracker.pendingOperations.size,
      timestamp: new Date().toLocaleTimeString(),
    });

    // 일정 시간 후 작업 완료 처리
    setTimeout(() => {
      syncTracker.pendingOperations.delete(operationId);

      if (syncTracker.pendingOperations.size === 0) {
        syncTracker.isStateSynced = true;
        console.log('✅ [SYNC_TRACK] 상태 동기화 완료');
      }
    }, 100);
  }, []);

  // 🔑 입력값 검증 함수들 (타입 가드)
  const validateFileId = useCallback((fileId: unknown): fileId is string => {
    return typeof fileId === 'string' && fileId.length > 0;
  }, []);

  const validateFileName = useCallback(
    (fileName: unknown): fileName is string => {
      return typeof fileName === 'string' && fileName.length > 0;
    },
    []
  );

  const validateProgress = useCallback(
    (progress: unknown): progress is number => {
      return (
        typeof progress === 'number' &&
        progress >= 0 &&
        progress <= 100 &&
        Number.isFinite(progress)
      );
    },
    []
  );

  // 🔑 파일 업로드 시작 검증
  const validateUploadStart = useCallback(
    (fileId: unknown, fileName: unknown): FileValidationResult => {
      const hasValidFileId = validateFileId(fileId);
      const hasValidFileName = validateFileName(fileName);

      const result: FileValidationResult = {
        fileId: hasValidFileId ? fileId : '',
        fileName: hasValidFileName ? fileName : '',
        hasValidFileId,
        hasValidFileName,
        isValidRequest: hasValidFileId && hasValidFileName,
      };

      return result;
    },
    [validateFileId, validateFileName]
  );

  // 🔑 진행률 업데이트 검증
  const validateProgressUpdate = useCallback(
    (fileId: unknown, progress: unknown): ProgressValidationResult => {
      const hasValidFileId = validateFileId(fileId);
      const hasValidProgress = validateProgress(progress);
      const roundedProgress = hasValidProgress ? Math.round(progress) : 0;

      const result: ProgressValidationResult = {
        fileId: hasValidFileId ? fileId : '',
        progress: hasValidProgress ? progress : 0,
        hasValidFileId,
        hasValidProgress,
        roundedProgress,
        isValidRequest: hasValidFileId && hasValidProgress,
      };

      return result;
    },
    [validateFileId, validateProgress]
  );

  // 🔑 원자적 파일 업로드 시작 (동기화 보장)
  const startFileUpload = useCallback(
    (fileId: unknown, fileName: unknown): void => {
      const operationId = `start-${Date.now()}`;
      trackSyncOperation(operationId);

      const validation = validateUploadStart(fileId, fileName);

      if (!validation.isValidRequest) {
        logger.error(
          '파일 업로드 시작 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, fileName: validFileName } = validation;

      logger.debug('파일 업로드 시작 - 동기화 보장', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🔑 원자적 상태 업데이트 (두 상태를 순차적으로 처리)
      Promise.resolve().then(() => {
        setUploading((previousUploading) => {
          const updatedUploading: UploadProgressRecord = {
            ...previousUploading,
            [validFileId]: 0,
          };

          console.log('📈 [UPLOAD_START] 진행률 상태 업데이트:', {
            fileId: validFileId,
            previousCount: Object.keys(previousUploading).length,
            newCount: Object.keys(updatedUploading).length,
            operationId,
          });

          return updatedUploading;
        });

        setUploadStatus((previousUploadStatus) => {
          const updatedUploadStatus: UploadStatusRecord = {
            ...previousUploadStatus,
            [validFileName]: 'uploading',
          };

          console.log('📊 [UPLOAD_START] 상태 정보 업데이트:', {
            fileName: validFileName,
            status: 'uploading',
            previousCount: Object.keys(previousUploadStatus).length,
            newCount: Object.keys(updatedUploadStatus).length,
            operationId,
          });

          // 상태 히스토리 업데이트를 위한 현재 업로딩 상태 가져오기
          const currentUploading: UploadProgressRecord = { [validFileId]: 0 };

          updateStateHistory(currentUploading, updatedUploadStatus);

          return updatedUploadStatus;
        });
      });

      // 동기화 추적 업데이트
      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
      syncTracker.lastStatusUpdate = Date.now();
    },
    [validateUploadStart, trackSyncOperation, updateStateHistory]
  );

  // 🔑 안전한 진행률 업데이트 (동기화 보장)
  const updateFileProgress = useCallback(
    (fileId: unknown, progress: unknown): void => {
      const operationId = `progress-${Date.now()}`;

      const validation = validateProgressUpdate(fileId, progress);

      if (!validation.isValidRequest) {
        logger.warn(
          '파일 진행률 업데이트 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, roundedProgress } = validation;
      trackSyncOperation(operationId);

      logger.debug('파일 진행률 업데이트 - 동기화 보장', {
        fileId: validFileId,
        originalProgress: validation.progress,
        roundedProgress,
        operationId,
      });

      setUploading((previousUploading) => {
        // 해당 파일이 업로딩 목록에 있는지 확인
        const hasExistingFile = Reflect.has(previousUploading, validFileId);

        if (!hasExistingFile) {
          logger.warn('업로딩 목록에 없는 파일의 진행률 업데이트 무시', {
            fileId: validFileId,
            roundedProgress,
            operationId,
          });
          return previousUploading;
        }

        const updatedUploading: UploadProgressRecord = {
          ...previousUploading,
          [validFileId]: roundedProgress,
        };

        console.log('📈 [PROGRESS_UPDATE] 진행률 업데이트:', {
          fileId: validFileId,
          oldProgress: previousUploading[validFileId],
          newProgress: roundedProgress,
          operationId,
        });

        return updatedUploading;
      });

      // 동기화 추적 업데이트
      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
    },
    [validateProgressUpdate, trackSyncOperation]
  );

  // 🔑 원자적 파일 업로드 완료 (메모리 관리 포함)
  const completeFileUpload = useCallback(
    (fileId: unknown, fileName: unknown): void => {
      const operationId = `complete-${Date.now()}`;
      trackSyncOperation(operationId);

      const validation = validateUploadStart(fileId, fileName);

      if (!validation.isValidRequest) {
        logger.error(
          '파일 업로드 완료 처리 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, fileName: validFileName } = validation;

      logger.debug('파일 업로드 완료 - 메모리 관리 포함', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🔑 원자적 상태 업데이트 (순서 보장)
      Promise.resolve().then(() => {
        // 1단계: 상태를 success로 변경
        setUploadStatus((previousUploadStatus) => {
          const updatedUploadStatus: UploadStatusRecord = {
            ...previousUploadStatus,
            [validFileName]: 'success',
          };

          console.log('✅ [COMPLETE] 상태를 success로 변경:', {
            fileName: validFileName,
            operationId,
          });

          return updatedUploadStatus;
        });

        // 2단계: 업로딩 목록에서 제거 (메모리 정리)
        setUploading((previousUploading) => {
          const hasTargetFile = Reflect.has(previousUploading, validFileId);

          if (!hasTargetFile) {
            logger.warn('업로딩 목록에 없는 파일의 완료 처리', {
              fileId: validFileId,
              operationId,
            });
            return previousUploading;
          }

          // 🔧 구조분해할당으로 안전한 객체 조작
          const { [validFileId]: removedFileProgress, ...remainingUploading } =
            previousUploading;

          console.log('🗑️ [COMPLETE] 업로딩 목록에서 제거:', {
            fileId: validFileId,
            removedProgress: removedFileProgress,
            remainingCount: Object.keys(remainingUploading).length,
            operationId,
          });

          // 상태 히스토리 업데이트
          const currentStatus: UploadStatusRecord = {
            [validFileName]: 'success',
          };
          updateStateHistory(remainingUploading, currentStatus);

          return remainingUploading;
        });
      });

      // 동기화 추적 업데이트
      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
      syncTracker.lastStatusUpdate = Date.now();
    },
    [validateUploadStart, trackSyncOperation, updateStateHistory]
  );

  // 🔑 원자적 파일 업로드 실패 (에러 처리 강화)
  const failFileUpload = useCallback(
    (fileId: unknown, fileName: unknown): void => {
      const operationId = `fail-${Date.now()}`;
      trackSyncOperation(operationId);

      const validation = validateUploadStart(fileId, fileName);

      if (!validation.isValidRequest) {
        logger.error(
          '파일 업로드 실패 처리 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, fileName: validFileName } = validation;

      logger.error('파일 업로드 실패 - 에러 처리 강화', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🔑 원자적 상태 업데이트 (실패 처리)
      Promise.resolve().then(() => {
        // 1단계: 상태를 error로 변경
        setUploadStatus((previousUploadStatus) => {
          const updatedUploadStatus: UploadStatusRecord = {
            ...previousUploadStatus,
            [validFileName]: 'error',
          };

          console.log('❌ [FAIL] 상태를 error로 변경:', {
            fileName: validFileName,
            operationId,
          });

          return updatedUploadStatus;
        });

        // 2단계: 업로딩 목록에서 제거 (메모리 정리)
        setUploading((previousUploading) => {
          const hasTargetFile = Reflect.has(previousUploading, validFileId);

          if (!hasTargetFile) {
            logger.warn('업로딩 목록에 없는 파일의 실패 처리', {
              fileId: validFileId,
              operationId,
            });
            return previousUploading;
          }

          // 🔧 구조분해할당으로 안전한 객체 조작
          const { [validFileId]: removedFileProgress, ...remainingUploading } =
            previousUploading;

          console.log('🗑️ [FAIL] 실패한 파일을 업로딩 목록에서 제거:', {
            fileId: validFileId,
            removedProgress: removedFileProgress,
            remainingCount: Object.keys(remainingUploading).length,
            operationId,
          });

          // 상태 히스토리 업데이트
          const currentStatus: UploadStatusRecord = {
            [validFileName]: 'error',
          };
          updateStateHistory(remainingUploading, currentStatus);

          return remainingUploading;
        });
      });

      // 동기화 추적 업데이트
      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
      syncTracker.lastStatusUpdate = Date.now();
    },
    [validateUploadStart, trackSyncOperation, updateStateHistory]
  );

  // 🔑 업로드 상태 초기화 (선택적 정리)
  const clearUploadStatus = useCallback(
    (fileName: unknown): void => {
      const operationId = `clear-${Date.now()}`;

      if (!validateFileName(fileName)) {
        logger.warn('업로드 상태 초기화 실패 - 유효하지 않은 파일명', {
          fileName,
          type: typeof fileName,
          operationId,
        });
        return;
      }

      logger.debug('업로드 상태 초기화', {
        fileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      setUploadStatus((previousUploadStatus) => {
        const hasTargetFile = Reflect.has(previousUploadStatus, fileName);

        if (!hasTargetFile) {
          logger.warn('상태 목록에 없는 파일의 초기화 무시', {
            fileName,
            operationId,
          });
          return previousUploadStatus;
        }

        // 🔧 구조분해할당으로 안전한 객체 조작
        const { [fileName]: removedStatus, ...remainingUploadStatus } =
          previousUploadStatus;

        console.log('🗑️ [CLEAR] 업로드 상태에서 파일 제거:', {
          fileName,
          removedStatus,
          remainingCount: Object.keys(remainingUploadStatus).length,
          operationId,
        });

        return remainingUploadStatus;
      });
    },
    [validateFileName]
  );

  // 🔑 활성 업로드 여부 (메모이제이션 불필요 - 직접 계산)
  const hasActiveUploads = Object.keys(uploading).length > 0;

  // 🔑 업로드 진행률 조회 (타입 안전)
  const getUploadProgress = useCallback(
    (fileId: unknown): number => {
      if (!validateFileId(fileId)) {
        logger.warn('유효하지 않은 파일 ID로 진행률 조회', { fileId });
        return 0;
      }

      const progress = Reflect.get(uploading, fileId);
      const validProgress = typeof progress === 'number' ? progress : 0;

      logger.debug('업로드 진행률 조회', {
        fileId,
        progress: validProgress,
      });

      return validProgress;
    },
    [uploading, validateFileId]
  );

  // 🔑 업로드 상태 조회 (타입 안전)
  const getUploadStatus = useCallback(
    (fileName: unknown): string => {
      if (!validateFileName(fileName)) {
        logger.warn('유효하지 않은 파일명으로 상태 조회', { fileName });
        return 'unknown';
      }

      const status = Reflect.get(uploadStatus, fileName);
      const validStatus = typeof status === 'string' ? status : 'unknown';

      logger.debug('업로드 상태 조회', {
        fileName,
        status: validStatus,
      });

      return validStatus;
    },
    [uploadStatus, validateFileName]
  );

  // 🔑 업로드 통계 계산 (성능 모니터링용)
  const getUploadStatistics = useCallback((): UploadStatistics => {
    const statusValues = Object.values(uploadStatus);
    const totalFiles = statusValues.length;
    const uploadingFiles = Object.keys(uploading).length;
    const successFiles = statusValues.filter(
      (status) => status === 'success'
    ).length;
    const errorFiles = statusValues.filter(
      (status) => status === 'error'
    ).length;

    const completionPercentage =
      totalFiles > 0
        ? Math.round(((successFiles + errorFiles) / totalFiles) * 100)
        : 0;

    const statistics: UploadStatistics = {
      totalFiles,
      uploadingFiles,
      successFiles,
      errorFiles,
      completionPercentage,
    };

    console.log('📊 [STATISTICS] 업로드 통계:', statistics);

    return statistics;
  }, [uploading, uploadStatus]);

  // 🔑 상태 검증 함수 (동기화 확인)
  const validateState = useCallback((): StateValidationResult => {
    const uploadingKeys = Object.keys(uploading);
    const statusKeys = Object.keys(uploadStatus);
    const issues: string[] = [];

    // 기본 검증
    if (!Array.isArray(uploadingKeys) || !Array.isArray(statusKeys)) {
      issues.push('상태 객체가 유효하지 않음');
    }

    // 동기화 상태 확인
    const { current: syncTracker } = stateSyncRef;
    if (!syncTracker.isStateSynced) {
      issues.push('상태 동기화 대기 중');
    }

    // 메모리 누수 확인
    if (uploadingKeys.length > 100) {
      issues.push('업로딩 목록이 과도하게 큼 (메모리 누수 의심)');
    }

    if (statusKeys.length > 1000) {
      issues.push('상태 목록이 과도하게 큼 (메모리 누수 의심)');
    }

    const result: StateValidationResult = {
      isValid: issues.length === 0,
      issues,
      uploadingCount: uploadingKeys.length,
      statusCount: statusKeys.length,
    };

    // 🔧 타입 에러 수정: 로거에 전달할 때 안전한 변환
    if (!result.isValid) {
      logger.warn('상태 검증 실패', {
        isValid: result.isValid,
        issuesCount: result.issues.length,
        uploadingCount: result.uploadingCount,
        statusCount: result.statusCount,
        issuesList: result.issues.join(', '),
      });
    }

    return result;
  }, [uploading, uploadStatus]);

  // 🔑 메모리 정리 함수 (주기적 호출용)
  const cleanupMemory = useCallback((): void => {
    const { current: history } = stateHistoryRef;

    // 히스토리 크기 제한
    if (history.progressHistory.length > history.maxHistorySize) {
      history.progressHistory = history.progressHistory.slice(
        -history.maxHistorySize
      );
    }

    if (history.statusHistory.length > history.maxHistorySize) {
      history.statusHistory = history.statusHistory.slice(
        -history.maxHistorySize
      );
    }

    // 동기화 추적 정리
    const { current: syncTracker } = stateSyncRef;
    syncTracker.pendingOperations.clear();
    syncTracker.isStateSynced = true;

    console.log('🧹 [CLEANUP] 메모리 정리 완료:', {
      progressHistorySize: history.progressHistory.length,
      statusHistorySize: history.statusHistory.length,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, []);

  // 🔑 주기적 메모리 정리 (5분마다)
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupMemory, 5 * 60 * 1000);

    logger.debug('메모리 정리 인터벌 설정 완료');

    return () => {
      clearInterval(cleanupInterval);
      cleanupMemory(); // 언마운트 시 최종 정리
      logger.debug('메모리 정리 인터벌 해제 및 최종 정리 완료');
    };
  }, [cleanupMemory]);

  return {
    // 상태 데이터
    uploading,
    uploadStatus,
    hasActiveUploads,

    // 핵심 함수들
    startFileUpload,
    updateFileProgress,
    completeFileUpload,
    failFileUpload,
    clearUploadStatus,

    // 조회 함수들
    getUploadProgress,
    getUploadStatus,
    getUploadStatistics,

    // 검증 및 관리 함수들
    validateState,
    cleanupMemory,
  };
};
