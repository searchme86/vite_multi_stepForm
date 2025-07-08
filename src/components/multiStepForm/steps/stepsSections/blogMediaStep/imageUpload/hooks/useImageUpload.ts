// blogMediaStep/imageUpload/hooks/useImageUpload.ts

import { useCallback } from 'react';
import { validateFile } from '../../utils/fileValidationUtils';

type ProgressCallback = (fileId: string, progress: number) => void;
type StatusCallback = (
  fileName: string,
  status: 'uploading' | 'success' | 'error'
) => void;
type CompleteCallback = (
  result: string,
  fileName: string,
  fileId: string
) => void;
type ErrorCallback = (fileName: string, error: string) => void;

interface UploadOptions {
  onProgress: ProgressCallback;
  onStatusChange: StatusCallback;
  onComplete: CompleteCallback;
  onError: ErrorCallback;
}

interface ImageUploadResult {
  handleFiles: (files: FileList) => void;
  handleSingleFile: (file: File) => void;
  isValidFile: (file: File) => boolean;
}

// 🔥 핵심 수정: 안전한 파일 ID 생성을 위한 카운터
let globalFileCounter = 0;

const generateUniqueFileId = (fileName: string): string => {
  const timestamp = Date.now();
  const counter = ++globalFileCounter;
  const randomId = Math.random().toString(36).substring(2, 9);
  const filePrefix = fileName.slice(0, 5).replace(/[^a-zA-Z0-9]/g, '');

  return `file-${timestamp}-${counter}-${randomId}-${filePrefix}`;
};

export const useImageUpload = (
  uploadOptions: UploadOptions
): ImageUploadResult => {
  console.log('🚀 useImageUpload 훅 초기화 (수정된 버전):', {
    timestamp: new Date().toLocaleTimeString(),
    hasOnProgress: !!uploadOptions.onProgress,
    hasOnStatusChange: !!uploadOptions.onStatusChange,
    hasOnComplete: !!uploadOptions.onComplete,
    hasOnError: !!uploadOptions.onError,
  });

  const {
    onProgress: progressUpdateCallback,
    onStatusChange: statusChangeCallback,
    onComplete: completionCallback,
    onError: errorHandlingCallback,
  } = uploadOptions;

  const handleSingleFile = useCallback(
    (uploadTargetFile: File) => {
      console.log('🔥 handleSingleFile 수정된 버전 시작:', {
        fileName: uploadTargetFile.name,
        size: uploadTargetFile.size,
        type: uploadTargetFile.type,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🔥 핵심 수정: 더 안전한 파일 ID 생성
      const uniqueFileIdentifier = generateUniqueFileId(uploadTargetFile.name);

      console.log('🆔 안전한 파일 ID 생성:', {
        fileName: uploadTargetFile.name,
        fileId: uniqueFileIdentifier,
        counter: globalFileCounter,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 파일 검증
      const validationResult = validateFile(uploadTargetFile);
      const { isValid: fileIsValid, errorMessage: validationError } =
        validationResult;

      console.log('🔍 파일 검증 결과:', {
        fileName: uploadTargetFile.name,
        fileId: uniqueFileIdentifier,
        isValid: fileIsValid,
        error: validationError || 'none',
        timestamp: new Date().toLocaleTimeString(),
      });

      if (!fileIsValid) {
        console.log('❌ 파일 검증 실패 - 콜백 호출:', {
          fileName: uploadTargetFile.name,
          fileId: uniqueFileIdentifier,
          error: validationError,
        });

        statusChangeCallback(uploadTargetFile.name, 'error');
        const errorText =
          validationError !== null && validationError !== undefined
            ? validationError
            : '파일 검증 실패';
        errorHandlingCallback(uploadTargetFile.name, errorText);
        return;
      }

      // FileReader 생성
      const fileReaderInstance = new FileReader();

      console.log('📖 FileReader 생성 및 이벤트 설정:', {
        fileName: uploadTargetFile.name,
        fileId: uniqueFileIdentifier,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 업로드 시작 상태 설정
      console.log('🔄 업로드 시작 - 상태 초기화:', {
        fileName: uploadTargetFile.name,
        fileId: uniqueFileIdentifier,
        timestamp: new Date().toLocaleTimeString(),
      });

      statusChangeCallback(uploadTargetFile.name, 'uploading');
      progressUpdateCallback(uniqueFileIdentifier, 0);

      // 진행률 이벤트
      fileReaderInstance.onprogress = (progressEvent) => {
        console.log('📊 FileReader onprogress 이벤트:', {
          fileName: uploadTargetFile.name,
          fileId: uniqueFileIdentifier,
          loaded: progressEvent.loaded,
          total: progressEvent.total,
          lengthComputable: progressEvent.lengthComputable,
          timestamp: new Date().toLocaleTimeString(),
        });

        const isProgressCalculatable = progressEvent.lengthComputable;
        if (isProgressCalculatable) {
          const currentProgress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );

          console.log('📊 진행률 콜백 호출:', {
            fileName: uploadTargetFile.name,
            fileId: uniqueFileIdentifier,
            progress: currentProgress,
            timestamp: new Date().toLocaleTimeString(),
          });

          progressUpdateCallback(uniqueFileIdentifier, currentProgress);
        }
      };

      // 🔥 핵심 수정: 완료 이벤트 처리 로직 개선
      fileReaderInstance.onload = (loadCompletionEvent) => {
        console.log('📁 *** FileReader onload 이벤트 발생! ***:', {
          fileName: uploadTargetFile.name,
          fileId: uniqueFileIdentifier,
          hasResult: !!loadCompletionEvent.target?.result,
          timestamp: new Date().toLocaleTimeString(),
        });

        const { target: readerTarget } = loadCompletionEvent;
        const readResult = readerTarget?.result;
        const resultAsString = typeof readResult === 'string' ? readResult : '';

        console.log('📁 파일 읽기 완료 - setTimeout 시작:', {
          fileName: uploadTargetFile.name,
          fileId: uniqueFileIdentifier,
          resultLength: resultAsString.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 원본 코드와 동일한 1.5초 지연 후 처리
        setTimeout(() => {
          console.log('⏰ *** setTimeout 콜백 실행 (수정된 방식)! ***:', {
            fileName: uploadTargetFile.name,
            fileId: uniqueFileIdentifier,
            timestamp: new Date().toLocaleTimeString(),
          });

          try {
            console.log('🔄 상태 업데이트 시작 (수정된 순서):', {
              fileName: uploadTargetFile.name,
              fileId: uniqueFileIdentifier,
              timestamp: new Date().toLocaleTimeString(),
            });

            // 1. 진행률 100%로 설정
            progressUpdateCallback(uniqueFileIdentifier, 100);

            // 2. 성공 상태로 변경
            statusChangeCallback(uploadTargetFile.name, 'success');

            // 3. 완료 콜백 호출 (미디어 파일 추가)
            console.log('🎯 *** onComplete 콜백 호출 (수정된 방식)! ***:', {
              fileName: uploadTargetFile.name,
              fileId: uniqueFileIdentifier,
              resultLength: resultAsString.length,
              timestamp: new Date().toLocaleTimeString(),
            });

            completionCallback(
              resultAsString,
              uploadTargetFile.name,
              uniqueFileIdentifier
            );

            console.log('✅ 모든 완료 처리 끝 (수정된 방식):', {
              fileName: uploadTargetFile.name,
              fileId: uniqueFileIdentifier,
              timestamp: new Date().toLocaleTimeString(),
            });
          } catch (uploadProcessError) {
            console.error('❌ setTimeout 내부 에러:', {
              fileName: uploadTargetFile.name,
              fileId: uniqueFileIdentifier,
              error: uploadProcessError,
              timestamp: new Date().toLocaleTimeString(),
            });

            statusChangeCallback(uploadTargetFile.name, 'error');
            errorHandlingCallback(
              uploadTargetFile.name,
              '파일 처리 중 오류가 발생했습니다.'
            );
          }
        }, 1500); // 원본과 동일한 1.5초 지연

        console.log('⏰ setTimeout 등록 완료 (수정된 방식):', {
          fileName: uploadTargetFile.name,
          fileId: uniqueFileIdentifier,
          timestamp: new Date().toLocaleTimeString(),
        });
      };

      // 에러 이벤트
      fileReaderInstance.onerror = (readerErrorEvent) => {
        console.error('❌ FileReader 에러 이벤트:', {
          fileName: uploadTargetFile.name,
          fileId: uniqueFileIdentifier,
          error: readerErrorEvent,
          timestamp: new Date().toLocaleTimeString(),
        });

        statusChangeCallback(uploadTargetFile.name, 'error');
        errorHandlingCallback(
          uploadTargetFile.name,
          '파일 읽기 중 오류가 발생했습니다.'
        );
      };

      // 파일 읽기 시작
      console.log('📖 *** FileReader.readAsDataURL 시작! ***:', {
        fileName: uploadTargetFile.name,
        fileId: uniqueFileIdentifier,
        timestamp: new Date().toLocaleTimeString(),
      });

      fileReaderInstance.readAsDataURL(uploadTargetFile);

      console.log('📖 FileReader.readAsDataURL 호출 완료:', {
        fileName: uploadTargetFile.name,
        fileId: uniqueFileIdentifier,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [
      progressUpdateCallback,
      statusChangeCallback,
      completionCallback,
      errorHandlingCallback,
    ]
  );

  const handleFiles = useCallback(
    (fileListToProcess: FileList) => {
      console.log('🚨 *** handleFiles 호출됨 (수정된 방식)! ***:', {
        fileCount: fileListToProcess.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const hasNoFiles = fileListToProcess.length === 0;
      if (hasNoFiles) {
        console.log('⚠️ 업로드할 파일이 없음');
        return;
      }

      console.log('📁 Array.from으로 파일 변환 시작:', {
        originalLength: fileListToProcess.length,
        timestamp: new Date().toLocaleTimeString(),
      });

      const fileArrayFromList = Array.from(fileListToProcess);

      console.log('📁 파일 배열 변환 완료, forEach 시작:', {
        arrayLength: fileArrayFromList.length,
        fileNames: fileArrayFromList.map(
          (individualFile) => individualFile.name
        ),
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🔥 핵심 수정: 파일들을 순차적으로 처리하되 각각 고유 ID 보장
      fileArrayFromList.forEach((individualFile, fileArrayIndex) => {
        console.log('📁 개별 파일 처리 시작 (수정된 방식):', {
          fileName: individualFile.name,
          fileIndex: fileArrayIndex,
          totalFiles: fileArrayFromList.length,
          timestamp: new Date().toLocaleTimeString(),
        });

        // 각 파일마다 약간의 지연을 두어 ID 중복 방지
        setTimeout(() => {
          handleSingleFile(individualFile);

          console.log('📁 handleSingleFile 호출 완료 (지연 처리):', {
            fileName: individualFile.name,
            fileIndex: fileArrayIndex,
            timestamp: new Date().toLocaleTimeString(),
          });
        }, fileArrayIndex * 10); // 각 파일마다 10ms 지연
      });

      console.log('✅ 모든 파일 처리 시작 완료 (수정된 방식):', {
        totalFiles: fileArrayFromList.length,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [handleSingleFile]
  );

  const isValidFile = useCallback((fileToValidate: File): boolean => {
    console.log('🔧 isValidFile 호출:', {
      fileName: fileToValidate.name,
      timestamp: new Date().toLocaleTimeString(),
    });

    const validationCheck = validateFile(fileToValidate);
    const { isValid: fileValidationResult } = validationCheck;

    console.log('✅ isValidFile 결과:', {
      fileName: fileToValidate.name,
      isValid: fileValidationResult,
      timestamp: new Date().toLocaleTimeString(),
    });

    return fileValidationResult;
  }, []);

  console.log('✅ useImageUpload 초기화 완료 (수정된 버전):', {
    timestamp: new Date().toLocaleTimeString(),
  });

  return {
    handleFiles,
    handleSingleFile,
    isValidFile,
  };
};
