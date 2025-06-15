// blogMediaStep/imageUpload/ImageUploadContainer.tsx

/**
 * ImageUpload - 이미지 업로드 메인 컨테이너 컴포넌트
 * 드래그앤드롭, 파일 선택, 업로드 진행률, 검증 메시지를 통합 관리
 * 기존 BlogMediaStep의 업로드 기능을 완전히 대체하는 컨테이너
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useBlogMediaStepState } from '../hooks/useBlogMediaStepState';
import { useImageUpload } from './hooks/useImageUpload';
import { useUploadProgress } from './hooks/useUploadProgress';
import { useFileValidation } from './hooks/useFileValidation';

import FileDropZone from './parts/FileDropZone';
import FileSelectButton, {
  type FileSelectButtonRef,
} from './parts/FileSelectButton';
import UploadProgressList from './parts/UploadProgressList';
import FileValidationMessage from './parts/FileValidationMessage';

// ✅ 컨테이너 props 타입 (현재는 빈 인터페이스)
interface ImageUploadContainerProps {}

/**
 * 이미지 업로드 메인 컨테이너 컴포넌트
 * 모든 업로드 관련 기능을 통합하여 관리하는 최상위 컨테이너
 */
function ImageUploadContainer(
  props: ImageUploadContainerProps
): React.ReactNode {
  console.log('🔧 ImageUploadContainer 렌더링 시작:', {
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용 - 컨테이너 렌더링 시작을 로깅

  // ✅ 전체 상태 관리 훅에서 필요한 상태와 함수들 가져오기
  const { formValues, uiState, setMediaValue, setSelectedFileNames, addToast } =
    useBlogMediaStepState();

  // 폼 값에서 현재 미디어 파일들과 파일명들 추출
  const { media: currentMediaFiles } = formValues;
  const { dragActive, isMobile } = uiState;

  // ✅ 파일 선택 버튼 참조 (FileSelectButton 컴포넌트 제어용)
  const fileSelectButtonRef = useRef<FileSelectButtonRef>(null);

  // ✅ 업로드 진행률 관리 훅 초기화
  const {
    progressState,
    startFileUpload,
    updateProgress,
    setFileStatus,
    completeFileUpload,
    resetUploadState,
    isUploading,
    hasActiveUploads,
    getUploadSummary,
  } = useUploadProgress();

  const { uploading, uploadStatus } = progressState;

  // ✅ 파일 검증 관리 훅 초기화
  const {
    validationState,
    validateFiles,
    clearValidationResults,
    getValidationMessage,
  } = useFileValidation();

  // ✅ 이미지 업로드 처리 훅 초기화 (콜백 함수들 정의)
  const imageUpload = useImageUpload({
    // 업로드 진행률 업데이트 콜백
    onProgress: useCallback(
      (fileId: string, progress: number) => {
        console.log('📊 업로드 진행률 업데이트:', { fileId, progress }); // 디버깅용
        updateProgress(fileId, progress);
      },
      [updateProgress]
    ),

    // 업로드 상태 변경 콜백
    onStatusChange: useCallback(
      (fileName: string, status: 'uploading' | 'success' | 'error') => {
        console.log('🔄 업로드 상태 변경:', { fileName, status }); // 디버깅용
        setFileStatus(fileName, status);
      },
      [setFileStatus]
    ),

    // 업로드 완료 콜백 (파일을 미디어 목록에 추가)
    onComplete: useCallback(
      (result: string, fileName: string) => {
        console.log('✅ 파일 업로드 완료:', {
          fileName,
          resultLength: result.length,
        }); // 디버깅용

        try {
          // 기존 미디어 파일 목록에 새 파일 추가
          const newMediaFiles = [...currentMediaFiles, result];
          setMediaValue(newMediaFiles);

          // 파일명 목록도 업데이트 (기존 로직 유지)
          setSelectedFileNames((prevNames: string[]) => [
            ...prevNames,
            fileName,
          ]);

          // 성공 토스트 메시지 표시
          addToast({
            title: '업로드 완료',
            description: `${fileName} 파일이 성공적으로 업로드되었습니다.`,
            color: 'success',
          });

          console.log('📁 미디어 파일 추가 완료:', {
            fileName,
            totalFiles: newMediaFiles.length,
          }); // 디버깅용
        } catch (error) {
          console.error('❌ 파일 추가 중 오류:', { fileName, error }); // 디버깅용

          // 에러 토스트 메시지 표시
          addToast({
            title: '파일 추가 실패',
            description: `${fileName} 파일을 추가하는 중 오류가 발생했습니다.`,
            color: 'danger',
          });
        }
      },
      [currentMediaFiles, setMediaValue, setSelectedFileNames, addToast]
    ),

    // 업로드 에러 콜백
    onError: useCallback(
      (fileName: string, error: string) => {
        console.error('❌ 업로드 에러:', { fileName, error }); // 디버깅용

        // 에러 토스트 메시지 표시
        addToast({
          title: '업로드 실패',
          description: error,
          color: 'danger',
        });
      },
      [addToast]
    ),
  });

  // ✅ 파일 드롭 이벤트 핸들러 (드래그앤드롭으로 파일을 추가할 때)
  const handleFilesDropped = useCallback(
    (droppedFiles: File[]) => {
      console.log('🔧 handleFilesDropped 호출:', {
        fileCount: droppedFiles.length,
        fileNames: droppedFiles.map((f) => f.name),
      }); // 디버깅용

      if (droppedFiles.length === 0) {
        console.log('⚠️ 드롭된 파일이 없음'); // 디버깅용
        return;
      }

      // 검증 결과 초기화
      clearValidationResults();

      // 파일 검증 후 업로드 처리
      handleFileSelection(droppedFiles);
    },
    [clearValidationResults]
  );

  // ✅ 파일 선택 이벤트 핸들러 (파일 선택 버튼으로 파일을 선택할 때)
  const handleFileSelection = useCallback(
    async (selectedFiles: File[]) => {
      console.log('🔧 handleFileSelection 호출:', {
        fileCount: selectedFiles.length,
        timestamp: new Date().toLocaleTimeString(),
      }); // 디버깅용

      if (selectedFiles.length === 0) {
        console.log('⚠️ 선택된 파일이 없음'); // 디버깅용
        return;
      }

      try {
        // 파일 목록을 FileList 형태로 변환 (검증을 위해)
        const fileListForValidation = {
          length: selectedFiles.length,
          item: (index: number) => selectedFiles[index] || null,
          [Symbol.iterator]: function* () {
            for (let i = 0; i < selectedFiles.length; i++) {
              yield selectedFiles[i];
            }
          },
        } as FileList;

        // 파일 검증 수행
        console.log('🔍 파일 검증 시작:', { fileCount: selectedFiles.length }); // 디버깅용
        const { validFiles, invalidFiles } = await validateFiles(
          fileListForValidation
        );

        // 검증 결과 로깅
        console.log('📊 파일 검증 완료:', {
          totalFiles: selectedFiles.length,
          validFiles: validFiles.length,
          invalidFiles: invalidFiles.length,
        }); // 디버깅용

        // 무효한 파일이 있으면 에러 메시지 표시
        if (invalidFiles.length > 0) {
          addToast({
            title: '파일 검증 실패',
            description: `${invalidFiles.length}개의 파일이 지원되지 않거나 크기 제한을 초과합니다.`,
            color: 'warning',
          });
        }

        // 유효한 파일들만 업로드 처리
        if (validFiles.length > 0) {
          console.log('📤 유효한 파일들 업로드 시작:', {
            validFileCount: validFiles.length,
            fileNames: validFiles.map((f) => f.name),
          }); // 디버깅용

          // 각 유효한 파일에 대해 업로드 시작 알림
          validFiles.forEach((file) => {
            const fileId = `file-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 9)}`;
            startFileUpload(fileId, file.name);
          });

          // 실제 파일 업로드 처리 (기존 handleFiles 로직과 동일)
          const fileListForUpload = {
            length: validFiles.length,
            item: (index: number) => validFiles[index] || null,
            [Symbol.iterator]: function* () {
              for (let i = 0; i < validFiles.length; i++) {
                yield validFiles[i];
              }
            },
          } as FileList;

          imageUpload.handleFiles(fileListForUpload);

          // 성공 토스트 메시지
          addToast({
            title: '업로드 시작',
            description: `${validFiles.length}개의 파일 업로드를 시작합니다.`,
            color: 'primary',
          });
        }
      } catch (error) {
        console.error('❌ 파일 선택 처리 중 오류:', error); // 디버깅용

        addToast({
          title: '파일 처리 오류',
          description: '파일을 처리하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [validateFiles, addToast, startFileUpload, imageUpload]
  );

  // ✅ 파일 선택 버튼 클릭 핸들러
  const handleFileSelectClick = useCallback(() => {
    console.log('🔧 handleFileSelectClick 호출'); // 디버깅용

    if (isUploading) {
      console.log('⚠️ 업로드 중이므로 파일 선택 무시'); // 디버깅용
      addToast({
        title: '업로드 진행 중',
        description: '현재 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.',
        color: 'warning',
      });
      return;
    }

    // 파일 선택 버튼 클릭 이벤트 트리거
    fileSelectButtonRef.current?.clickFileInput();
  }, [isUploading, addToast]);

  // ✅ FileSelectButton의 파일 변경 이벤트 핸들러
  const handleFileChange = useCallback(
    (files: FileList) => {
      console.log('🔧 handleFileChange 호출:', { fileCount: files.length }); // 디버깅용

      if (files.length > 0) {
        // FileList를 File 배열로 변환 후 처리
        const filesArray = Array.from(files);
        handleFileSelection(filesArray);
      }
    },
    [handleFileSelection]
  );

  // ✅ 검증 메시지 닫기 핸들러
  const handleDismissValidationMessage = useCallback(
    (fileName: string) => {
      console.log('🔧 handleDismissValidationMessage 호출:', { fileName }); // 디버깅용
      // 현재는 개별 메시지 제거 기능이 없으므로 전체 초기화
      clearValidationResults();
    },
    [clearValidationResults]
  );

  // ✅ 업로드 상태 변경 시 로깅 및 완료 처리
  useEffect(() => {
    const summary = getUploadSummary();

    console.log('📈 업로드 상태 업데이트:', {
      ...summary,
      hasActiveUploads,
      timestamp: new Date().toLocaleTimeString(),
    }); // 디버깅용

    // 모든 업로드가 완료되면 진행률 정리
    if (!hasActiveUploads && summary.completed > 0) {
      console.log('🎉 모든 업로드 완료, 5초 후 상태 정리'); // 디버깅용

      // 5초 후 업로드 상태 초기화 (사용자가 결과를 볼 시간 제공)
      setTimeout(() => {
        resetUploadState();
        console.log('🧹 업로드 상태 정리 완료'); // 디버깅용
      }, 5000);
    }
  }, [hasActiveUploads, getUploadSummary, resetUploadState]);

  // ✅ 컨테이너 상태 로깅
  console.log('📊 ImageUploadContainer 현재 상태:', {
    currentMediaCount: currentMediaFiles.length,
    isUploading,
    hasActiveUploads,
    validationIssues: Object.keys(validationState.validationResults).length,
    dragActive,
    isMobile,
  }); // 디버깅용

  return (
    <div className="space-y-4">
      {/* ✅ 파일 드래그앤드롭 영역 */}
      <FileDropZone
        dragActive={dragActive}
        setDragActive={() => {}} // dragActive는 useBlogMediaStepState에서 관리
        onFilesDropped={handleFilesDropped}
        onFileSelectClick={handleFileSelectClick}
        isUploading={isUploading}
        className="transition-all duration-200"
      />

      {/* ✅ 숨겨진 파일 선택 버튼 */}
      <FileSelectButton
        ref={fileSelectButtonRef}
        onFileChange={handleFileChange}
        multiple={true}
        disabled={isUploading}
      />

      {/* ✅ 파일 검증 메시지 표시 (에러가 있을 때만) */}
      {Object.keys(validationState.validationResults).length > 0 && (
        <FileValidationMessage
          validationResults={validationState.validationResults}
          showSuccessMessages={false}
          maxMessages={5}
          onDismiss={handleDismissValidationMessage}
          className="mt-4"
        />
      )}

      {/* ✅ 업로드 진행률 표시 (업로드 중일 때만) */}
      {(hasActiveUploads || Object.keys(uploading).length > 0) && (
        <UploadProgressList
          uploading={uploading}
          uploadStatus={uploadStatus}
          className="mt-4"
          showCompleted={true}
          maxItems={10}
        />
      )}

      {/* ✅ 모바일에서 추가 안내 메시지 */}
      {isMobile && (
        <div className="p-3 text-sm text-blue-700 rounded-lg bg-blue-50">
          <p className="font-medium">모바일 팁:</p>
          <p>
            여러 파일을 한 번에 선택하려면 파일 선택 시 여러 개를 선택하세요.
          </p>
        </div>
      )}

      {/* ✅ 업로드 완료 후 요약 정보 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 text-xs bg-gray-100 rounded">
          <p>
            개발 정보: 총 미디어 {currentMediaFiles.length}개, 활성 업로드{' '}
            {Object.keys(uploading).length}개
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageUploadContainer;
