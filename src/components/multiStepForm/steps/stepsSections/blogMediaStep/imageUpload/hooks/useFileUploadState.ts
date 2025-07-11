// 📁 imageUpload/hooks/useFileUploadState.ts

import { useState, useCallback } from 'react';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('UPLOAD_STATE');

interface UploadProgressRecord {
  [fileId: string]: number;
}

interface UploadStatusRecord {
  [fileName: string]: 'uploading' | 'success' | 'error';
}

export const useFileUploadState = () => {
  const [uploading, setUploading] = useState<UploadProgressRecord>({});
  const [uploadStatus, setUploadStatus] = useState<UploadStatusRecord>({});

  logger.debug('useFileUploadState 초기화', {
    uploadingCount: Object.keys(uploading).length,
    uploadStatusCount: Object.keys(uploadStatus).length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const startFileUpload = useCallback((fileId: string, fileName: string) => {
    // 🔧 입력값 검증
    const hasValidFileId = typeof fileId === 'string' && fileId.length > 0;
    const hasValidFileName =
      typeof fileName === 'string' && fileName.length > 0;

    // 🔧 early return으로 중첩 방지
    if (!hasValidFileId || !hasValidFileName) {
      logger.error('파일 업로드 시작 실패 - 유효하지 않은 매개변수', {
        fileId,
        fileName,
        hasValidFileId,
        hasValidFileName,
      });
      return;
    }

    logger.debug('파일 업로드 시작', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploading((previousUploading) => ({
      ...previousUploading,
      [fileId]: 0,
    }));

    setUploadStatus((previousUploadStatus) => ({
      ...previousUploadStatus,
      [fileName]: 'uploading',
    }));
  }, []);

  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    // 🔧 입력값 검증
    const hasValidFileId = typeof fileId === 'string' && fileId.length > 0;
    const hasValidProgress =
      typeof progress === 'number' && progress >= 0 && progress <= 100;

    // 🔧 early return으로 중첩 방지
    if (!hasValidFileId || !hasValidProgress) {
      logger.warn('파일 진행률 업데이트 실패 - 유효하지 않은 매개변수', {
        fileId,
        progress,
        hasValidFileId,
        hasValidProgress,
      });
      return;
    }

    const roundedProgress = Math.round(progress);

    logger.debug('파일 진행률 업데이트', {
      fileId,
      originalProgress: progress,
      roundedProgress,
    });

    setUploading((previousUploading) => ({
      ...previousUploading,
      [fileId]: roundedProgress,
    }));
  }, []);

  const completeFileUpload = useCallback((fileId: string, fileName: string) => {
    // 🔧 입력값 검증
    const hasValidFileId = typeof fileId === 'string' && fileId.length > 0;
    const hasValidFileName =
      typeof fileName === 'string' && fileName.length > 0;

    // 🔧 early return으로 중첩 방지
    if (!hasValidFileId || !hasValidFileName) {
      logger.error('파일 업로드 완료 처리 실패 - 유효하지 않은 매개변수', {
        fileId,
        fileName,
        hasValidFileId,
        hasValidFileName,
      });
      return;
    }

    logger.debug('파일 업로드 완료', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploadStatus((previousUploadStatus) => ({
      ...previousUploadStatus,
      [fileName]: 'success',
    }));

    setUploading((previousUploading) => {
      // 🔧 구조분해할당으로 안전한 객체 조작
      const { [fileId]: removedFileProgress, ...remainingUploading } =
        previousUploading;

      logger.debug('업로딩 상태에서 파일 제거', {
        fileId,
        removedProgress: removedFileProgress,
        remainingCount: Object.keys(remainingUploading).length,
      });

      return remainingUploading;
    });
  }, []);

  const failFileUpload = useCallback((fileId: string, fileName: string) => {
    // 🔧 입력값 검증
    const hasValidFileId = typeof fileId === 'string' && fileId.length > 0;
    const hasValidFileName =
      typeof fileName === 'string' && fileName.length > 0;

    // 🔧 early return으로 중첩 방지
    if (!hasValidFileId || !hasValidFileName) {
      logger.error('파일 업로드 실패 처리 실패 - 유효하지 않은 매개변수', {
        fileId,
        fileName,
        hasValidFileId,
        hasValidFileName,
      });
      return;
    }

    logger.error('파일 업로드 실패', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploadStatus((previousUploadStatus) => ({
      ...previousUploadStatus,
      [fileName]: 'error',
    }));

    setUploading((previousUploading) => {
      // 🔧 구조분해할당으로 안전한 객체 조작
      const { [fileId]: removedFileProgress, ...remainingUploading } =
        previousUploading;

      logger.debug('실패한 파일을 업로딩 상태에서 제거', {
        fileId,
        removedProgress: removedFileProgress,
        remainingCount: Object.keys(remainingUploading).length,
      });

      return remainingUploading;
    });
  }, []);

  const clearUploadStatus = useCallback((fileName: string) => {
    // 🔧 입력값 검증
    const hasValidFileName =
      typeof fileName === 'string' && fileName.length > 0;

    // 🔧 early return으로 중첩 방지
    if (!hasValidFileName) {
      logger.warn('업로드 상태 초기화 실패 - 유효하지 않은 파일명', {
        fileName,
        hasValidFileName,
      });
      return;
    }

    logger.debug('업로드 상태 초기화', {
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploadStatus((previousUploadStatus) => {
      // 🔧 구조분해할당으로 안전한 객체 조작
      const { [fileName]: removedStatus, ...remainingUploadStatus } =
        previousUploadStatus;

      logger.debug('업로드 상태에서 파일 제거', {
        fileName,
        removedStatus,
        remainingCount: Object.keys(remainingUploadStatus).length,
      });

      return remainingUploadStatus;
    });
  }, []);

  const hasActiveUploads = Object.keys(uploading).length > 0;

  const getUploadProgress = useCallback(
    (fileId: string): number => {
      const progress = Reflect.get(uploading, fileId);
      const validProgress = typeof progress === 'number' ? progress : 0;

      logger.debug('업로드 진행률 조회', {
        fileId,
        progress: validProgress,
      });

      return validProgress;
    },
    [uploading]
  );

  const getUploadStatus = useCallback(
    (fileName: string): string => {
      const status = Reflect.get(uploadStatus, fileName);
      const validStatus = typeof status === 'string' ? status : 'unknown';

      logger.debug('업로드 상태 조회', {
        fileName,
        status: validStatus,
      });

      return validStatus;
    },
    [uploadStatus]
  );

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
  };
};
