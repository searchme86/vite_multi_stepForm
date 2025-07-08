// blogMediaStep/imageUpload/hooks/useUploadProgress.ts

import { useState, useCallback, useRef, useEffect } from 'react';

export type UploadStatus = 'uploading' | 'success' | 'error';

interface UploadProgressState {
  uploading: Record<string, number>;
  uploadStatus: Record<string, UploadStatus>;
  completedFiles: string[];
  errorFiles: string[];
}

// 🔥 핵심 수정: 매핑 정보 단순화
interface FileMapping {
  fileId: string;
  fileName: string;
  startTime: number;
}

interface FileUploadInfo {
  fileId: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  startTime: number;
}

interface UploadProgressHookResult {
  progressState: UploadProgressState;
  startFileUpload: (fileId: string, fileName: string) => void;
  updateProgress: (fileId: string, progress: number) => void;
  setFileStatus: (fileName: string, status: UploadStatus) => void;
  completeFileUpload: (fileId: string) => void;
  resetUploadState: () => void;
  getFileUploadInfo: (fileName: string) => FileUploadInfo | null;
  isUploading: boolean;
  hasActiveUploads: boolean;
  getUploadSummary: () => {
    total: number;
    completed: number;
    errors: number;
    inProgress: number;
  };
  getFileIdToNameMap: () => Record<string, string>;
}

export const useUploadProgress = (): UploadProgressHookResult => {
  console.log('🔧 useUploadProgress 훅 초기화 (수정된 버전)');

  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, UploadStatus>
  >({});
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [errorFiles, setErrorFiles] = useState<string[]>([]);

  // 🔥 핵심 수정: 파일 매핑을 더 안전하게 관리
  const fileMappingsRef = useRef<Record<string, FileMapping>>({});

  const startFileUpload = useCallback((fileId: string, fileName: string) => {
    console.log('🔧 startFileUpload 호출 (수정된 버전):', {
      fileId,
      fileName,
      timestamp: new Date().toLocaleTimeString(),
    });

    // 🔥 수정: 매핑 정보 등록
    fileMappingsRef.current[fileId] = {
      fileId,
      fileName,
      startTime: Date.now(),
    };

    console.log('📝 파일 매핑 등록:', {
      fileId,
      fileName,
      totalMappings: Object.keys(fileMappingsRef.current).length,
    });

    // 진행률 0%로 시작
    setUploading((previousUploading) => {
      const newUploading = { ...previousUploading, [fileId]: 0 };
      console.log('📊 업로드 시작 (수정된 방식):', {
        fileId,
        fileName,
        activeUploads: Object.keys(newUploading).length,
      });
      return newUploading;
    });

    // 상태를 uploading으로 설정
    setUploadStatus((previousStatus) => {
      const newStatus = {
        ...previousStatus,
        [fileName]: 'uploading' as UploadStatus,
      };
      console.log('🔄 업로드 상태 변경 (수정된 방식):', {
        fileName,
        status: 'uploading',
      });
      return newStatus;
    });
  }, []);

  const updateProgress = useCallback((fileId: string, progress: number) => {
    console.log('🔧 updateProgress 호출 (수정된 방식):', {
      fileId,
      progress,
      timestamp: new Date().toLocaleTimeString(),
    });

    setUploading((previousUploading) => {
      const newUploading = { ...previousUploading, [fileId]: progress };

      const mappingInfo = fileMappingsRef.current[fileId];
      const fileName = mappingInfo?.fileName || 'unknown';

      console.log('📊 진행률 업데이트 (수정된 방식):', {
        fileId,
        fileName,
        progress,
        timestamp: new Date().toLocaleTimeString(),
      });

      return newUploading;
    });
  }, []);

  const setFileStatus = useCallback(
    (fileName: string, status: UploadStatus) => {
      console.log('🔧 setFileStatus 호출 (수정된 방식):', {
        fileName,
        status,
        timestamp: new Date().toLocaleTimeString(),
      });

      setUploadStatus((previousStatus) => {
        const newStatus = { ...previousStatus, [fileName]: status };
        console.log('🔄 파일 상태 업데이트 (수정된 방식):', {
          fileName,
          status,
        });
        return newStatus;
      });

      // 완료된 파일 목록 업데이트
      const isSuccessStatus = status === 'success';
      if (isSuccessStatus) {
        setCompletedFiles((previousCompleted) => {
          const isFileAlreadyCompleted = previousCompleted.includes(fileName);
          if (!isFileAlreadyCompleted) {
            const newCompleted = [...previousCompleted, fileName];
            console.log('✅ 완료된 파일 추가 (수정된 방식):', {
              fileName,
              totalCompleted: newCompleted.length,
            });
            return newCompleted;
          }
          return previousCompleted;
        });
      }

      // 에러 파일 목록 업데이트
      const isErrorStatus = status === 'error';
      if (isErrorStatus) {
        setErrorFiles((previousErrors) => {
          const isFileAlreadyInErrors = previousErrors.includes(fileName);
          if (!isFileAlreadyInErrors) {
            const newErrors = [...previousErrors, fileName];
            console.log('❌ 에러 파일 추가 (수정된 방식):', {
              fileName,
              totalErrors: newErrors.length,
            });
            return newErrors;
          }
          return previousErrors;
        });
      }
    },
    []
  );

  // 🔥 핵심 수정: 파일 업로드 완료 처리 개선
  const completeFileUpload = useCallback((fileId: string) => {
    console.log('🔧 completeFileUpload 호출 (수정된 방식):', {
      fileId,
      timestamp: new Date().toLocaleTimeString(),
    });

    const mappingInfo = fileMappingsRef.current[fileId];
    const fileName = mappingInfo?.fileName;

    console.log('📋 완료 처리할 파일 정보:', {
      fileId,
      fileName: fileName || 'unknown',
      hasMappingInfo: !!mappingInfo,
    });

    // 🔥 수정: 약간의 지연 후 진행률에서 제거 (동시 완료 시 충돌 방지)
    setTimeout(() => {
      setUploading((previousUploading) => {
        const newUploading = { ...previousUploading };
        const hasFile = newUploading[fileId] !== undefined;

        if (hasFile) {
          delete newUploading[fileId];
          console.log('📊 업로드 완료 - 진행률에서 제거 (수정된 방식):', {
            fileId,
            fileName: fileName || 'unknown',
            remainingUploads: Object.keys(newUploading).length,
          });
        }

        return newUploading;
      });

      // 매핑 정보 정리
      if (fileName && fileMappingsRef.current[fileId]) {
        delete fileMappingsRef.current[fileId];
        console.log('🧹 매핑 정보 정리 완료:', {
          fileId,
          fileName,
          remainingMappings: Object.keys(fileMappingsRef.current).length,
        });
      }
    }, 100); // 100ms 지연으로 동시 완료 시 충돌 방지
  }, []);

  const resetUploadState = useCallback(() => {
    console.log('🔧 resetUploadState 호출 (수정된 방식)');

    setUploading({});
    setUploadStatus({});
    setCompletedFiles([]);
    setErrorFiles([]);
    fileMappingsRef.current = {};

    console.log('✅ 업로드 상태 초기화 완료 (수정된 방식)');
  }, []);

  const getFileUploadInfo = useCallback(
    (fileName: string): FileUploadInfo | null => {
      console.log('🔧 getFileUploadInfo 호출 (수정된 방식):', { fileName });

      // 🔥 수정: 매핑 검색 로직 개선
      let foundFileId = '';
      let foundMapping: FileMapping | null = null;

      const mappingEntries = Object.entries(fileMappingsRef.current);
      for (const [currentFileId, mappingInfo] of mappingEntries) {
        const isMatchingFileName = mappingInfo.fileName === fileName;
        if (isMatchingFileName) {
          foundFileId = currentFileId;
          foundMapping = mappingInfo;
          break;
        }
      }

      const progress = foundFileId ? uploading[foundFileId] || 0 : 0;
      const status = uploadStatus[fileName] || 'uploading';

      const hasNoMappingAndNoStatus = !foundMapping && !uploadStatus[fileName];
      if (hasNoMappingAndNoStatus) {
        console.log('⚠️ 파일 정보 없음 (수정된 방식):', { fileName });
        return null;
      }

      const info: FileUploadInfo = {
        fileId: foundFileId || '',
        fileName,
        progress,
        status,
        startTime: foundMapping?.startTime || Date.now(),
      };

      console.log('✅ getFileUploadInfo 결과 (수정된 방식):', info);
      return info;
    },
    [uploading, uploadStatus]
  );

  const getFileIdToNameMap = useCallback((): Record<string, string> => {
    console.log('🔧 getFileIdToNameMap 호출 (수정된 방식)');

    const mappingEntries = Object.entries(fileMappingsRef.current);
    const fileIdToNameMapping: Record<string, string> = {};

    for (const [fileId, mappingInfo] of mappingEntries) {
      fileIdToNameMapping[fileId] = mappingInfo.fileName;
    }

    console.log('✅ getFileIdToNameMap 결과 (수정된 방식):', {
      mappingCount: Object.keys(fileIdToNameMapping).length,
      mappings: fileIdToNameMapping,
    });

    return fileIdToNameMapping;
  }, []);

  const getUploadSummary = useCallback(() => {
    const activeUploads = Object.keys(uploading).length;
    const completed = completedFiles.length;
    const errors = errorFiles.length;
    const total = completed + errors + activeUploads;

    const summary = {
      total,
      completed,
      errors,
      inProgress: activeUploads,
    };

    console.log('📊 업로드 요약 (수정된 방식):', summary);
    return summary;
  }, [uploading, completedFiles, errorFiles]);

  // 계산된 상태값들
  const hasActiveUploads = Object.keys(uploading).length > 0;
  const isUploading = hasActiveUploads;

  // 상태 변경 로깅
  useEffect(() => {
    const summary = getUploadSummary();
    console.log('📈 업로드 상태 변경 (수정된 방식):', {
      ...summary,
      hasActiveUploads,
      uploadingKeys: Object.keys(uploading),
      mappingCount: Object.keys(fileMappingsRef.current).length,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [
    uploading,
    uploadStatus,
    completedFiles,
    errorFiles,
    getUploadSummary,
    hasActiveUploads,
  ]);

  // 진행률 상태 객체
  const progressState: UploadProgressState = {
    uploading,
    uploadStatus,
    completedFiles,
    errorFiles,
  };

  console.log('✅ useUploadProgress 초기화 완료 (수정된 방식):', {
    hasActiveUploads,
    completedCount: completedFiles.length,
    errorCount: errorFiles.length,
  });

  return {
    progressState,
    startFileUpload,
    updateProgress,
    setFileStatus,
    completeFileUpload,
    resetUploadState,
    getFileUploadInfo,
    isUploading,
    hasActiveUploads,
    getUploadSummary,
    getFileIdToNameMap,
  };
};
