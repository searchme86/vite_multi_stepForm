// blogMediaStep/imageUpload/hooks/useFileUploadState.ts

import { useState, useCallback } from 'react';

export const useFileUploadState = () => {
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, 'uploading' | 'success' | 'error'>
  >({});

  console.log('🔧 [UPLOAD_STATE] useFileUploadState 초기화:', {
    uploadingCount: Object.keys(uploading).length,
    uploadStatusCount: Object.keys(uploadStatus).length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const startFileUpload = useCallback((fileId: string, fileName: string) => {
    console.log('🚀 [UPLOAD_STATE] 파일 업로드 시작:', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploading((prev) => ({ ...prev, [fileId]: 0 }));
    setUploadStatus((prev) => ({ ...prev, [fileName]: 'uploading' }));
  }, []);

  const updateFileProgress = useCallback((fileId: string, progress: number) => {
    setUploading((prev) => ({ ...prev, [fileId]: progress }));
  }, []);

  const completeFileUpload = useCallback((fileId: string, fileName: string) => {
    console.log('✅ [UPLOAD_STATE] 파일 업로드 완료:', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploadStatus((prev) => ({ ...prev, [fileName]: 'success' }));

    setUploading((prev) => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  }, []);

  const failFileUpload = useCallback((fileId: string, fileName: string) => {
    console.log('❌ [UPLOAD_STATE] 파일 업로드 실패:', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploadStatus((prev) => ({ ...prev, [fileName]: 'error' }));

    setUploading((prev) => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  }, []);

  const clearUploadStatus = useCallback((fileName: string) => {
    setUploadStatus((prev) => {
      const newState = { ...prev };
      delete newState[fileName];
      return newState;
    });
  }, []);

  const hasActiveUploads = Object.keys(uploading).length > 0;

  return {
    uploading,
    uploadStatus,
    hasActiveUploads,
    startFileUpload,
    updateFileProgress,
    completeFileUpload,
    failFileUpload,
    clearUploadStatus,
  };
};
