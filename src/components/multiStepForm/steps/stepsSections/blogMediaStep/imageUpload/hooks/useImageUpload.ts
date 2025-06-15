// blogMediaStep/imageUpload/hooks/useImageUpload.ts - BlogMediaStep 컴포넌트

/**
 * BlogMediaStep 컴포넌트 - 이미지 업로드 관리 훅
 * 파일 업로드, 진행률 관리, 에러 처리를 담당
 * 기존 handleFiles 함수의 로직을 유지하면서 훅으로 분리
 */

import { useCallback } from 'react';
import { validateFile } from '../../utils/fileValidationUtils';

// ✅ 업로드 진행률 콜백 타입
type ProgressCallback = (fileId: string, progress: number) => void;
type StatusCallback = (
  fileName: string,
  status: 'uploading' | 'success' | 'error'
) => void;
type CompleteCallback = (result: string, fileName: string) => void;
type ErrorCallback = (fileName: string, error: string) => void;

// ✅ 업로드 옵션 타입
interface UploadOptions {
  onProgress: ProgressCallback;
  onStatusChange: StatusCallback;
  onComplete: CompleteCallback;
  onError: ErrorCallback;
}

// ✅ 업로드 훅 반환 타입
interface ImageUploadResult {
  handleFiles: (files: FileList) => void;
  handleSingleFile: (file: File) => void;
  isValidFile: (file: File) => boolean;
}

/**
 * 이미지 업로드 관리 훅
 * 기존 handleFiles 함수의 로직을 그대로 유지하면서 훅으로 분리
 */
export const useImageUpload = (options: UploadOptions): ImageUploadResult => {
  console.log('🔧 useImageUpload 훅 초기화'); // 디버깅용

  const { onProgress, onStatusChange, onComplete, onError } = options;

  // ✅ 단일 파일 처리 (기존 로직 유지)
  const handleSingleFile = useCallback(
    (file: File) => {
      console.log('🔧 handleSingleFile 호출:', {
        fileName: file.name,
        size: file.size,
        type: file.type,
      }); // 디버깅용

      const fileId = `file-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const fileName = file.name;

      // ✅ 파일 검증 (기존 로직과 동일)
      const validation = validateFile(file);
      if (!validation.isValid) {
        console.log('❌ 파일 검증 실패:', {
          fileName,
          error: validation.errorMessage,
        }); // 디버깅용
        onStatusChange(fileName, 'error');
        onError(fileName, validation.errorMessage || '파일 검증 실패');
        return;
      }

      // ✅ FileReader 생성 및 설정
      const reader = new FileReader();

      // 업로드 시작 상태 설정
      onStatusChange(fileName, 'uploading');
      onProgress(fileId, 0);

      // ✅ 진행률 이벤트 (기존 로직 유지)
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log('📊 업로드 진행률:', { fileName, progress }); // 디버깅용
          onProgress(fileId, progress);
        }
      };

      // ✅ 완료 이벤트 (기존 로직 유지 - 1.5초 지연)
      reader.onload = (e) => {
        const result = e.target?.result as string;

        console.log('📁 파일 읽기 완료:', {
          fileName,
          resultLength: result?.length || 0,
        }); // 디버깅용

        // 기존과 동일하게 1.5초 지연 후 완료 처리
        setTimeout(() => {
          try {
            console.log('✅ 업로드 완료 처리:', { fileName }); // 디버깅용

            onStatusChange(fileName, 'success');
            onComplete(result, fileName);

            // 진행률 상태에서 제거 (완료되면 더 이상 표시 안함)
            onProgress(fileId, 100);
          } catch (error) {
            console.error('❌ 업로드 완료 처리 중 에러:', { fileName, error }); // 디버깅용
            onStatusChange(fileName, 'error');
            onError(fileName, '파일 처리 중 오류가 발생했습니다.');
          }
        }, 1500); // 기존과 동일한 1.5초 지연
      };

      // ✅ 에러 이벤트
      reader.onerror = (error) => {
        console.error('❌ FileReader 에러:', { fileName, error }); // 디버깅용
        onStatusChange(fileName, 'error');
        onError(fileName, '파일 읽기 중 오류가 발생했습니다.');
      };

      // ✅ 파일 읽기 시작
      reader.readAsDataURL(file);
    },
    [onProgress, onStatusChange, onComplete, onError]
  );

  // ✅ 여러 파일 처리 (기존 Array.from(files).forEach 로직 유지)
  const handleFiles = useCallback(
    (files: FileList) => {
      console.log('🔧 handleFiles 호출:', {
        fileCount: files.length,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      if (files.length === 0) {
        console.log('⚠️ 업로드할 파일이 없음'); // 디버깅용
        return;
      }

      // 기존과 동일하게 Array.from으로 변환 후 forEach로 처리
      Array.from(files).forEach((file, fileIndex) => {
        console.log('📁 파일 처리 시작:', {
          fileName: file.name,
          fileIndex,
          totalFiles: files.length,
        }); // 디버깅용

        handleSingleFile(file);
      });

      console.log('✅ 모든 파일 처리 시작 완료:', { totalFiles: files.length }); // 디버깅용
    },
    [handleSingleFile]
  );

  // ✅ 파일 유효성 검사 함수 (별도 제공)
  const isValidFile = useCallback((file: File): boolean => {
    console.log('🔧 isValidFile 호출:', { fileName: file.name }); // 디버깅용

    const validation = validateFile(file);
    const isValid = validation.isValid;

    console.log('✅ isValidFile 결과:', { fileName: file.name, isValid }); // 디버깅용
    return isValid;
  }, []);

  console.log('✅ useImageUpload 초기화 완료'); // 디버깅용

  return {
    handleFiles,
    handleSingleFile,
    isValidFile,
  };
};
