// 📁 imageUpload/hooks/useFileUploadState.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('UPLOAD_STATE');

interface UploadProgressRecord {
  readonly [fileId: string]: number;
}

interface UploadStatusRecord {
  readonly [fileName: string]: 'uploading' | 'success' | 'error';
}

interface StateSyncTracker {
  lastProgressUpdate: number;
  lastStatusUpdate: number;
  pendingOperations: Set<string>;
  isStateSynced: boolean;
}

interface UploadStatistics {
  readonly totalFiles: number;
  readonly uploadingFiles: number;
  readonly successFiles: number;
  readonly errorFiles: number;
  readonly completionPercentage: number;
}

interface StateValidationResult {
  readonly isValid: boolean;
  readonly issues: readonly string[];
  readonly uploadingCount: number;
  readonly statusCount: number;
  readonly [key: string]: unknown;
}

interface FileValidationResult {
  readonly fileId: string;
  readonly fileName: string;
  readonly hasValidFileId: boolean;
  readonly hasValidFileName: boolean;
  readonly isValidRequest: boolean;
  readonly [key: string]: unknown;
}

interface ProgressValidationResult {
  readonly fileId: string;
  readonly progress: number;
  readonly hasValidFileId: boolean;
  readonly hasValidProgress: boolean;
  readonly roundedProgress: number;
  readonly isValidRequest: boolean;
  readonly [key: string]: unknown;
}

interface BatchStateUpdate {
  readonly type: 'start' | 'progress' | 'complete' | 'fail';
  readonly fileId: string;
  readonly fileName: string;
  readonly progress?: number;
  readonly timestamp: number;
}

interface StateUpdateQueue {
  updates: BatchStateUpdate[];
  isProcessing: boolean;
}

interface FileStateMapping {
  readonly fileId: string;
  readonly fileName: string;
  readonly url: string;
  readonly status: string;
}

interface MapFileActions {
  getFileById: (fileId: string) => FileStateMapping | undefined;
  updateFile: (
    fileId: string,
    updates: { fileName?: string; url?: string; status?: string }
  ) => void;
  removeFile: (fileId: string) => void;
  getAllFiles: () => Map<string, FileStateMapping>;
  getFileUrls: () => string[];
  getFileNames: () => string[];
}

export const useFileUploadState = (mapFileActions?: MapFileActions) => {
  const [uploading, setUploading] = useState<UploadProgressRecord>({});
  const [uploadStatus, setUploadStatus] = useState<UploadStatusRecord>({});

  const stateSyncRef = useRef<StateSyncTracker>({
    lastProgressUpdate: Date.now(),
    lastStatusUpdate: Date.now(),
    pendingOperations: new Set<string>(),
    isStateSynced: true,
  });

  const stateHistoryRef = useRef<{
    progressHistory: UploadProgressRecord[];
    statusHistory: UploadStatusRecord[];
    maxHistorySize: number;
  }>({
    progressHistory: [],
    statusHistory: [],
    maxHistorySize: 10,
  });

  const updateQueueRef = useRef<StateUpdateQueue>({
    updates: [],
    isProcessing: false,
  });

  logger.debug('useFileUploadState 초기화 - Map 기반 파일 ID 추적', {
    uploadingCount: Object.keys(uploading).length,
    uploadStatusCount: Object.keys(uploadStatus).length,
    mapBasedTracking: true,
    stateSynchronized: true,
    memoryManaged: true,
    batchedUpdatesEnabled: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  const processBatchedUpdates = useCallback((): void => {
    if (updateQueueRef.current.isProcessing) {
      return;
    }

    updateQueueRef.current.isProcessing = true;
    const currentUpdates = [...updateQueueRef.current.updates];
    updateQueueRef.current.updates.length = 0;

    if (currentUpdates.length === 0) {
      updateQueueRef.current.isProcessing = false;
      return;
    }

    console.log('🔄 [BATCH_UPDATES] Map 기반 배치 상태 업데이트 처리:', {
      updateCount: currentUpdates.length,
      timestamp: new Date().toLocaleTimeString(),
    });

    unstable_batchedUpdates(() => {
      currentUpdates.forEach((update) => {
        const { type, fileId, fileName, progress, timestamp } = update;

        console.log('🔧 [BATCH_UPDATES] Map 기반 개별 업데이트 처리:', {
          type,
          fileId,
          fileName,
          progress,
          timestamp,
        });

        switch (type) {
          case 'start':
            setUploading((prev) => ({ ...prev, [fileId]: 0 }));
            setUploadStatus((prev) => ({ ...prev, [fileName]: 'uploading' }));

            if (mapFileActions) {
              mapFileActions.updateFile(fileId, { status: 'uploading' });
              console.log('🗃️ [MAP_SYNC] Map 상태 동기화 - 업로드 시작:', {
                fileId,
                fileName,
              });
            }
            break;

          case 'progress':
            if (typeof progress === 'number') {
              setUploading((prev) => ({ ...prev, [fileId]: progress }));

              if (mapFileActions) {
                const fileData = mapFileActions.getFileById(fileId);
                if (fileData) {
                  console.log('🗃️ [MAP_SYNC] Map 진행률 추적:', {
                    fileId,
                    fileName: fileData.fileName,
                    progress,
                  });
                }
              }
            }
            break;

          case 'complete':
            setUploadStatus((prev) => ({ ...prev, [fileName]: 'success' }));
            setUploading((prev) => {
              const { [fileId]: removed, ...remaining } = prev;
              return remaining;
            });

            if (mapFileActions) {
              mapFileActions.updateFile(fileId, { status: 'completed' });
              console.log('🗃️ [MAP_SYNC] Map 상태 동기화 - 업로드 완료:', {
                fileId,
                fileName,
              });
            }
            break;

          case 'fail':
            setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));
            setUploading((prev) => {
              const { [fileId]: removed, ...remaining } = prev;
              return remaining;
            });

            if (mapFileActions) {
              mapFileActions.updateFile(fileId, { status: 'failed' });
              console.log('🗃️ [MAP_SYNC] Map 상태 동기화 - 업로드 실패:', {
                fileId,
                fileName,
              });
            }
            break;
        }
      });
    });

    updateQueueRef.current.isProcessing = false;
    console.log('✅ [BATCH_UPDATES] Map 기반 배치 상태 업데이트 완료');
  }, [mapFileActions]);

  const enqueueBatchUpdate = useCallback(
    (update: BatchStateUpdate): void => {
      updateQueueRef.current.updates.push(update);

      Promise.resolve().then(() => {
        processBatchedUpdates();
      });
    },
    [processBatchedUpdates]
  );

  const trackSyncOperation = useCallback((operationId: string): void => {
    const { current: syncTracker } = stateSyncRef;

    syncTracker.pendingOperations.add(operationId);
    syncTracker.isStateSynced = false;

    console.log('🔄 [SYNC_TRACK] Map 기반 동기화 작업 추적:', {
      operationId,
      pendingCount: syncTracker.pendingOperations.size,
      timestamp: new Date().toLocaleTimeString(),
    });

    setTimeout(() => {
      syncTracker.pendingOperations.delete(operationId);

      if (syncTracker.pendingOperations.size === 0) {
        syncTracker.isStateSynced = true;
        console.log('✅ [SYNC_TRACK] Map 기반 상태 동기화 완료');
      }
    }, 100);
  }, []);

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

  const startFileUpload = useCallback(
    (fileId: unknown, fileName: unknown): void => {
      const operationId = `start-${Date.now()}`;
      trackSyncOperation(operationId);

      const validation = validateUploadStart(fileId, fileName);

      if (!validation.isValidRequest) {
        logger.error(
          'Map 기반 파일 업로드 시작 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, fileName: validFileName } = validation;

      if (mapFileActions) {
        const fileData = mapFileActions.getFileById(validFileId);
        if (!fileData) {
          logger.warn('Map에서 파일 ID를 찾을 수 없음:', {
            fileId: validFileId,
            fileName: validFileName,
          });
        } else {
          console.log('🗃️ [MAP_VALIDATION] Map에서 파일 확인 완료:', {
            fileId: validFileId,
            mapFileName: fileData.fileName,
            mapStatus: fileData.status,
          });
        }
      }

      logger.debug('Map 기반 파일 업로드 시작 - 배치 업데이트 사용', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      enqueueBatchUpdate({
        type: 'start',
        fileId: validFileId,
        fileName: validFileName,
        timestamp: Date.now(),
      });

      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
      syncTracker.lastStatusUpdate = Date.now();

      console.log('✅ [UPLOAD_START] Map 기반 파일 업로드 시작 배치 예약:', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
      });
    },
    [
      validateUploadStart,
      trackSyncOperation,
      enqueueBatchUpdate,
      mapFileActions,
    ]
  );

  const updateFileProgress = useCallback(
    (fileId: unknown, progress: unknown): void => {
      const operationId = `progress-${Date.now()}`;

      const validation = validateProgressUpdate(fileId, progress);

      if (!validation.isValidRequest) {
        logger.warn(
          'Map 기반 파일 진행률 업데이트 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, roundedProgress } = validation;
      trackSyncOperation(operationId);

      if (mapFileActions) {
        const fileData = mapFileActions.getFileById(validFileId);
        if (fileData) {
          console.log('🗃️ [MAP_PROGRESS] Map 기반 진행률 추적:', {
            fileId: validFileId,
            fileName: fileData.fileName,
            progress: roundedProgress,
            currentStatus: fileData.status,
          });
        }
      }

      logger.debug('Map 기반 파일 진행률 업데이트 - 배치 업데이트 사용', {
        fileId: validFileId,
        originalProgress: validation.progress,
        roundedProgress,
        operationId,
      });

      const hasExistingFile = Reflect.has(uploading, validFileId);

      if (!hasExistingFile) {
        logger.warn('업로딩 목록에 없는 파일의 진행률 업데이트 무시', {
          fileId: validFileId,
          roundedProgress,
          operationId,
        });
        return;
      }

      enqueueBatchUpdate({
        type: 'progress',
        fileId: validFileId,
        fileName: '',
        progress: roundedProgress,
        timestamp: Date.now(),
      });

      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();

      console.log('✅ [PROGRESS_UPDATE] Map 기반 진행률 업데이트 배치 예약:', {
        fileId: validFileId,
        roundedProgress,
        operationId,
      });
    },
    [
      validateProgressUpdate,
      trackSyncOperation,
      enqueueBatchUpdate,
      uploading,
      mapFileActions,
    ]
  );

  const completeFileUpload = useCallback(
    (fileId: unknown, fileName: unknown): void => {
      const operationId = `complete-${Date.now()}`;
      trackSyncOperation(operationId);

      const validation = validateUploadStart(fileId, fileName);

      if (!validation.isValidRequest) {
        logger.error(
          'Map 기반 파일 업로드 완료 처리 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, fileName: validFileName } = validation;

      if (mapFileActions) {
        const fileData = mapFileActions.getFileById(validFileId);
        if (fileData) {
          console.log('🗃️ [MAP_COMPLETE] Map 기반 완료 처리:', {
            fileId: validFileId,
            fileName: validFileName,
            currentUrl: fileData.url,
            currentStatus: fileData.status,
          });
        }
      }

      logger.debug('Map 기반 파일 업로드 완료 - 배치 업데이트 사용', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      enqueueBatchUpdate({
        type: 'complete',
        fileId: validFileId,
        fileName: validFileName,
        timestamp: Date.now(),
      });

      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
      syncTracker.lastStatusUpdate = Date.now();

      console.log('✅ [COMPLETE] Map 기반 파일 업로드 완료 배치 예약:', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
      });
    },
    [
      validateUploadStart,
      trackSyncOperation,
      enqueueBatchUpdate,
      mapFileActions,
    ]
  );

  const failFileUpload = useCallback(
    (fileId: unknown, fileName: unknown): void => {
      const operationId = `fail-${Date.now()}`;
      trackSyncOperation(operationId);

      const validation = validateUploadStart(fileId, fileName);

      if (!validation.isValidRequest) {
        logger.error(
          'Map 기반 파일 업로드 실패 처리 실패 - 유효하지 않은 매개변수',
          validation
        );
        return;
      }

      const { fileId: validFileId, fileName: validFileName } = validation;

      if (mapFileActions) {
        const fileData = mapFileActions.getFileById(validFileId);
        if (fileData) {
          console.log('🗃️ [MAP_FAIL] Map 기반 실패 처리:', {
            fileId: validFileId,
            fileName: validFileName,
            currentUrl: fileData.url,
            currentStatus: fileData.status,
          });
        }
      }

      logger.error('Map 기반 파일 업로드 실패 - 배치 업데이트 사용', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      enqueueBatchUpdate({
        type: 'fail',
        fileId: validFileId,
        fileName: validFileName,
        timestamp: Date.now(),
      });

      const { current: syncTracker } = stateSyncRef;
      syncTracker.lastProgressUpdate = Date.now();
      syncTracker.lastStatusUpdate = Date.now();

      console.log('❌ [FAIL] Map 기반 파일 업로드 실패 배치 예약:', {
        fileId: validFileId,
        fileName: validFileName,
        operationId,
      });
    },
    [
      validateUploadStart,
      trackSyncOperation,
      enqueueBatchUpdate,
      mapFileActions,
    ]
  );

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

      logger.debug('Map 기반 업로드 상태 초기화', {
        fileName,
        operationId,
        timestamp: new Date().toLocaleTimeString(),
      });

      unstable_batchedUpdates(() => {
        setUploadStatus((previousUploadStatus) => {
          const hasTargetFile = Reflect.has(previousUploadStatus, fileName);

          if (!hasTargetFile) {
            logger.warn('상태 목록에 없는 파일의 초기화 무시', {
              fileName,
              operationId,
            });
            return previousUploadStatus;
          }

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
      });
    },
    [validateFileName]
  );

  const hasActiveUploads = Object.keys(uploading).length > 0;

  const getUploadProgress = useCallback(
    (fileId: unknown): number => {
      if (!validateFileId(fileId)) {
        logger.warn('유효하지 않은 파일 ID로 진행률 조회', { fileId });
        return 0;
      }

      const progress = Reflect.get(uploading, fileId);
      const validProgress = typeof progress === 'number' ? progress : 0;

      if (mapFileActions) {
        const fileData = mapFileActions.getFileById(fileId);
        if (fileData) {
          console.log('🗃️ [MAP_QUERY] Map 기반 진행률 조회:', {
            fileId,
            fileName: fileData.fileName,
            progress: validProgress,
            mapStatus: fileData.status,
          });
        }
      }

      logger.debug('업로드 진행률 조회', {
        fileId,
        progress: validProgress,
      });

      return validProgress;
    },
    [uploading, validateFileId, mapFileActions]
  );

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

    if (mapFileActions) {
      const allMapFiles = mapFileActions.getAllFiles();
      console.log('📊 [MAP_STATISTICS] Map 기반 통계 포함:', {
        ...statistics,
        mapFileCount: allMapFiles.size,
        mapFileIds: Array.from(allMapFiles.keys()),
      });
    }

    console.log('📊 [STATISTICS] 업로드 통계:', statistics);

    return statistics;
  }, [uploading, uploadStatus, mapFileActions]);

  const validateState = useCallback((): StateValidationResult => {
    const uploadingKeys = Object.keys(uploading);
    const statusKeys = Object.keys(uploadStatus);
    const issues: string[] = [];

    if (!Array.isArray(uploadingKeys) || !Array.isArray(statusKeys)) {
      issues.push('상태 객체가 유효하지 않음');
    }

    const { current: syncTracker } = stateSyncRef;
    if (!syncTracker.isStateSynced) {
      issues.push('상태 동기화 대기 중');
    }

    if (updateQueueRef.current.isProcessing) {
      issues.push('배치 업데이트 처리 중');
    }

    if (uploadingKeys.length > 100) {
      issues.push('업로딩 목록이 과도하게 큼 (메모리 누수 의심)');
    }

    if (statusKeys.length > 1000) {
      issues.push('상태 목록이 과도하게 큼 (메모리 누수 의심)');
    }

    if (mapFileActions) {
      const allMapFiles = mapFileActions.getAllFiles();
      if (allMapFiles.size > 1000) {
        issues.push('Map 파일 목록이 과도하게 큼');
      }
    }

    const result: StateValidationResult = {
      isValid: issues.length === 0,
      issues,
      uploadingCount: uploadingKeys.length,
      statusCount: statusKeys.length,
      batchedUpdatesEnabled: true,
      queueProcessing: updateQueueRef.current.isProcessing,
      mapBasedTracking: mapFileActions !== undefined,
    };

    if (!result.isValid) {
      logger.warn('Map 기반 상태 검증 실패', {
        isValid: result.isValid,
        issuesCount: result.issues.length,
        uploadingCount: result.uploadingCount,
        statusCount: result.statusCount,
        issuesList: result.issues.join(', '),
        batchedUpdatesEnabled: result.batchedUpdatesEnabled,
        mapBasedTracking: result.mapBasedTracking,
      });
    }

    return result;
  }, [uploading, uploadStatus, mapFileActions]);

  const cleanupMemory = useCallback((): void => {
    const { current: history } = stateHistoryRef;

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

    const { current: syncTracker } = stateSyncRef;
    syncTracker.pendingOperations.clear();
    syncTracker.isStateSynced = true;

    updateQueueRef.current.updates.length = 0;
    updateQueueRef.current.isProcessing = false;

    console.log('🧹 [CLEANUP] Map 기반 메모리 정리 완료:', {
      progressHistorySize: history.progressHistory.length,
      statusHistorySize: history.statusHistory.length,
      updateQueueCleared: true,
      mapBasedTracking: mapFileActions !== undefined,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [mapFileActions]);

  useEffect(() => {
    const cleanupInterval = setInterval(cleanupMemory, 5 * 60 * 1000);

    logger.debug('Map 기반 메모리 정리 인터벌 설정 완료');

    return () => {
      clearInterval(cleanupInterval);
      cleanupMemory();
      logger.debug('Map 기반 메모리 정리 인터벌 해제 및 최종 정리 완료');
    };
  }, [cleanupMemory]);

  return {
    uploading,
    uploadStatus,
    hasActiveUploads,
    startFileUpload,
    updateFileProgress,
    completeFileUpload,
    failFileUpload,
    clearUploadStatus,
    getUploadProgress,
    getUploadStatus,
    getUploadStatistics,
    validateState,
    cleanupMemory,
  };
};
