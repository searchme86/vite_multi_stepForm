// blogMediaStep/imageUpload/hooks/useUploadProgress.ts - ImageUpload

/**
 * ImageUpload - 업로드 진행률 관리 훅
 * 파일별 업로드 진행률과 상태를 관리
 * 기존 uploading, uploadStatus 상태 관리 로직을 훅으로 분리
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ✅ 업로드 상태 타입 (기존과 동일)
export type UploadStatus = 'uploading' | 'success' | 'error';

// ✅ 업로드 진행률 상태 타입
interface UploadProgressState {
  uploading: Record<string, number>; // fileId -> progress (0-100)
  uploadStatus: Record<string, UploadStatus>; // fileName -> status
  completedFiles: string[]; // 완료된 파일명 목록
  errorFiles: string[]; // 에러 발생 파일명 목록
}

// ✅ 개별 파일 업로드 정보
interface FileUploadInfo {
  fileId: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  startTime: number;
}

// ✅ 업로드 진행률 훅 반환 타입
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
}

/**
 * 업로드 진행률 관리 훅
 * 기존 uploading, uploadStatus 상태를 관리하는 로직을 훅으로 분리
 */
export const useUploadProgress = (): UploadProgressHookResult => {
  console.log('🔧 useUploadProgress 훅 초기화'); // 디버깅용

  // ✅ 업로드 진행률 상태 (기존 구조 유지)
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, UploadStatus>
  >({});
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [errorFiles, setErrorFiles] = useState<string[]>([]);

  // ✅ 파일ID와 파일명 매핑을 위한 ref
  const fileIdToNameRef = useRef<Record<string, string>>({});
  const fileNameToIdRef = useRef<Record<string, string>>({});

  // ✅ 파일 업로드 시작
  const startFileUpload = useCallback((fileId: string, fileName: string) => {
    console.log('🔧 startFileUpload 호출:', { fileId, fileName }); // 디버깅용

    // 매핑 정보 저장
    fileIdToNameRef.current[fileId] = fileName;
    fileNameToIdRef.current[fileName] = fileId;

    // 진행률 0%로 시작
    setUploading((prev) => {
      const newUploading = { ...prev, [fileId]: 0 };
      console.log('📊 업로드 시작:', {
        fileId,
        fileName,
        activeUploads: Object.keys(newUploading).length,
      }); // 디버깅용
      return newUploading;
    });

    // 상태를 uploading으로 설정
    setUploadStatus((prev) => {
      const newStatus = { ...prev, [fileName]: 'uploading' as UploadStatus };
      console.log('🔄 업로드 상태 변경:', { fileName, status: 'uploading' }); // 디버깅용
      return newStatus;
    });
  }, []);

  // ✅ 진행률 업데이트 (기존 로직 유지)
  const updateProgress = useCallback((fileId: string, progress: number) => {
    console.log('🔧 updateProgress 호출:', { fileId, progress }); // 디버깅용

    setUploading((prev) => {
      const newUploading = { ...prev, [fileId]: progress };

      const fileName = fileIdToNameRef.current[fileId];
      console.log('📊 진행률 업데이트:', {
        fileId,
        fileName: fileName || 'unknown',
        progress,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      return newUploading;
    });
  }, []);

  // ✅ 파일 상태 설정
  const setFileStatus = useCallback(
    (fileName: string, status: UploadStatus) => {
      console.log('🔧 setFileStatus 호출:', { fileName, status }); // 디버깅용

      setUploadStatus((prev) => {
        const newStatus = { ...prev, [fileName]: status };
        console.log('🔄 파일 상태 업데이트:', { fileName, status }); // 디버깅용
        return newStatus;
      });

      // 완료된 파일 목록 업데이트
      if (status === 'success') {
        setCompletedFiles((prev) => {
          if (!prev.includes(fileName)) {
            const newCompleted = [...prev, fileName];
            console.log('✅ 완료된 파일 추가:', {
              fileName,
              totalCompleted: newCompleted.length,
            }); // 디버깅용
            return newCompleted;
          }
          return prev;
        });
      }

      // 에러 파일 목록 업데이트
      if (status === 'error') {
        setErrorFiles((prev) => {
          if (!prev.includes(fileName)) {
            const newErrors = [...prev, fileName];
            console.log('❌ 에러 파일 추가:', {
              fileName,
              totalErrors: newErrors.length,
            }); // 디버깅용
            return newErrors;
          }
          return prev;
        });
      }
    },
    []
  );

  // ✅ 파일 업로드 완료 처리
  const completeFileUpload = useCallback((fileId: string) => {
    console.log('🔧 completeFileUpload 호출:', { fileId }); // 디버깅용

    const fileName = fileIdToNameRef.current[fileId];

    // 진행률에서 제거 (기존 로직 유지)
    setUploading((prev) => {
      const newUploading = { ...prev };
      delete newUploading[fileId];

      console.log('📊 업로드 완료 - 진행률에서 제거:', {
        fileId,
        fileName: fileName || 'unknown',
        remainingUploads: Object.keys(newUploading).length,
      }); // 디버깅용

      return newUploading;
    });

    // 매핑 정보 정리
    if (fileName) {
      delete fileIdToNameRef.current[fileId];
      delete fileNameToIdRef.current[fileName];
    }
  }, []);

  // ✅ 업로드 상태 초기화
  const resetUploadState = useCallback(() => {
    console.log('🔧 resetUploadState 호출'); // 디버깅용

    setUploading({});
    setUploadStatus({});
    setCompletedFiles([]);
    setErrorFiles([]);
    fileIdToNameRef.current = {};
    fileNameToIdRef.current = {};

    console.log('✅ 업로드 상태 초기화 완료'); // 디버깅용
  }, []);

  // ✅ 특정 파일의 업로드 정보 조회
  const getFileUploadInfo = useCallback(
    (fileName: string): FileUploadInfo | null => {
      console.log('🔧 getFileUploadInfo 호출:', { fileName }); // 디버깅용

      const fileId = fileNameToIdRef.current[fileName];
      const progress = fileId ? uploading[fileId] || 0 : 0;
      const status = uploadStatus[fileName] || 'uploading';

      if (!fileId && !uploadStatus[fileName]) {
        console.log('⚠️ 파일 정보 없음:', { fileName }); // 디버깅용
        return null;
      }

      const info: FileUploadInfo = {
        fileId: fileId || '',
        fileName,
        progress,
        status,
        startTime: Date.now(), // 실제로는 시작 시간을 저장해야 함
      };

      console.log('✅ getFileUploadInfo 결과:', info); // 디버깅용
      return info;
    },
    [uploading, uploadStatus]
  );

  // ✅ 업로드 요약 정보
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

    console.log('📊 업로드 요약:', summary); // 디버깅용
    return summary;
  }, [uploading, completedFiles, errorFiles]);

  // ✅ 계산된 상태값들
  const hasActiveUploads = Object.keys(uploading).length > 0;
  const isUploading = hasActiveUploads;

  // ✅ 상태 변경 로깅
  useEffect(() => {
    const summary = getUploadSummary();
    console.log('📈 업로드 상태 변경:', {
      ...summary,
      hasActiveUploads,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용
  }, [
    uploading,
    uploadStatus,
    completedFiles,
    errorFiles,
    getUploadSummary,
    hasActiveUploads,
  ]);

  // ✅ 진행률 상태 객체
  const progressState: UploadProgressState = {
    uploading,
    uploadStatus,
    completedFiles,
    errorFiles,
  };

  console.log('✅ useUploadProgress 초기화 완료:', {
    hasActiveUploads,
    completedCount: completedFiles.length,
    errorCount: errorFiles.length,
  }); // 디버깅용

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
  };
};
