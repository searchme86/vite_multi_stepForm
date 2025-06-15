// blogMediaStep/imageUpload/hooks/useFileValidation.ts - ImageUpload

/**
 * ImageUpload - 파일 검증 관리 훅
 * 파일 형식, 크기 검증과 에러 메시지 관리를 담당
 * 기존 파일 검증 로직을 훅으로 분리하여 재사용성 향상
 */

import { useCallback, useState } from 'react';
import {
  validateFile,
  type FileValidationResult,
} from '../../utils/fileValidationUtils';

// ✅ 검증 상태 타입
interface ValidationState {
  isValidating: boolean;
  validationResults: Record<string, FileValidationResult>;
  invalidFiles: string[];
}

// ✅ 파일 검증 훅 반환 타입
interface FileValidationHookResult {
  validationState: ValidationState;
  validateFiles: (
    files: FileList
  ) => Promise<{ validFiles: File[]; invalidFiles: File[] }>;
  validateSingleFile: (file: File) => FileValidationResult;
  clearValidationResults: () => void;
  getValidationMessage: (fileName: string) => string | null;
  isFileValid: (fileName: string) => boolean;
}

/**
 * 파일 검증 관리 훅
 * 여러 파일의 검증 상태를 관리하고 에러 메시지를 제공
 */
export const useFileValidation = (): FileValidationHookResult => {
  console.log('🔧 useFileValidation 훅 초기화'); // 디버깅용

  // ✅ 검증 상태 관리
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    validationResults: {},
    invalidFiles: [],
  });

  // ✅ 단일 파일 검증 (기존 로직 유지)
  const validateSingleFile = useCallback((file: File): FileValidationResult => {
    console.log('🔧 validateSingleFile 호출:', {
      fileName: file.name,
      size: file.size,
      type: file.type,
    }); // 디버깅용

    const result = validateFile(file);

    console.log('✅ validateSingleFile 결과:', {
      fileName: file.name,
      isValid: result.isValid,
      errorMessage: result.errorMessage,
    }); // 디버깅용

    return result;
  }, []);

  // ✅ 여러 파일 검증
  const validateFiles = useCallback(
    async (
      files: FileList
    ): Promise<{ validFiles: File[]; invalidFiles: File[] }> => {
      console.log('🔧 validateFiles 호출:', { fileCount: files.length }); // 디버깅용

      setValidationState((prev) => ({ ...prev, isValidating: true }));

      const validFiles: File[] = [];
      const invalidFiles: File[] = [];
      const newValidationResults: Record<string, FileValidationResult> = {};
      const newInvalidFileNames: string[] = [];

      // 각 파일 검증
      Array.from(files).forEach((file) => {
        const result = validateSingleFile(file);

        newValidationResults[file.name] = result;

        if (result.isValid) {
          validFiles.push(file);
          console.log('✅ 유효한 파일:', { fileName: file.name }); // 디버깅용
        } else {
          invalidFiles.push(file);
          newInvalidFileNames.push(file.name);
          console.log('❌ 무효한 파일:', {
            fileName: file.name,
            reason: result.errorMessage,
          }); // 디버깅용
        }
      });

      // 상태 업데이트
      setValidationState({
        isValidating: false,
        validationResults: {
          ...validationState.validationResults,
          ...newValidationResults,
        },
        invalidFiles: [
          ...new Set([...validationState.invalidFiles, ...newInvalidFileNames]),
        ],
      });

      const results = { validFiles, invalidFiles };

      console.log('✅ validateFiles 완료:', {
        totalFiles: files.length,
        validCount: validFiles.length,
        invalidCount: invalidFiles.length,
      }); // 디버깅용

      return results;
    },
    [
      validateSingleFile,
      validationState.validationResults,
      validationState.invalidFiles,
    ]
  );

  // ✅ 검증 결과 초기화
  const clearValidationResults = useCallback(() => {
    console.log('🔧 clearValidationResults 호출'); // 디버깅용

    setValidationState({
      isValidating: false,
      validationResults: {},
      invalidFiles: [],
    });

    console.log('✅ 검증 결과 초기화 완료'); // 디버깅용
  }, []);

  // ✅ 특정 파일의 검증 메시지 반환
  const getValidationMessage = useCallback(
    (fileName: string): string | null => {
      console.log('🔧 getValidationMessage 호출:', { fileName }); // 디버깅용

      const result = validationState.validationResults[fileName];
      const message = result?.errorMessage || null;

      console.log('✅ getValidationMessage 결과:', { fileName, message }); // 디버깅용
      return message;
    },
    [validationState.validationResults]
  );

  // ✅ 특정 파일의 유효성 확인
  const isFileValid = useCallback(
    (fileName: string): boolean => {
      console.log('🔧 isFileValid 호출:', { fileName }); // 디버깅용

      const result = validationState.validationResults[fileName];
      const isValid = result?.isValid || false;

      console.log('✅ isFileValid 결과:', { fileName, isValid }); // 디버깅용
      return isValid;
    },
    [validationState.validationResults]
  );

  console.log('✅ useFileValidation 초기화 완료:', {
    validationResultCount: Object.keys(validationState.validationResults)
      .length,
    invalidFileCount: validationState.invalidFiles.length,
    isValidating: validationState.isValidating,
  }); // 디버깅용

  return {
    validationState,
    validateFiles,
    validateSingleFile,
    clearValidationResults,
    getValidationMessage,
    isFileValid,
  };
};
