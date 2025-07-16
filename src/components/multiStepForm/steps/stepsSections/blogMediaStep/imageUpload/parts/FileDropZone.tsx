// 📁 imageUpload/parts/FileDropZone.tsx

import React, { memo, useCallback, useMemo, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('FILE_DROP_ZONE');

interface DragState {
  readonly isDragActive: boolean;
  readonly dragCounter: number;
}

interface FileValidationResult {
  readonly validFiles: File[];
  readonly invalidFiles: File[];
  readonly totalSize: number;
}

interface DropZoneState {
  readonly isDisabled: boolean;
  readonly statusMessage: string;
  readonly description: string;
  readonly showUploadButton: boolean;
}

const validateDroppedFile = (file: File): boolean => {
  const isFileInstance = file instanceof File;
  const hasValidSize = file.size > 0 && file.size <= 10 * 1024 * 1024;
  const hasValidName = typeof file.name === 'string' && file.name.length > 0;

  const supportedTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ]);
  const hasValidType = supportedTypes.has(file.type) ? true : false;

  return isFileInstance && hasValidSize && hasValidName && hasValidType;
};

const validateFileList = (files: File[]): FileValidationResult => {
  const validFiles: File[] = [];
  const invalidFiles: File[] = [];
  let totalSize = 0;

  files.forEach((file) => {
    if (validateDroppedFile(file)) {
      validFiles.push(file);
      totalSize += file.size;
    } else {
      invalidFiles.push(file);
    }
  });

  return {
    validFiles,
    invalidFiles,
    totalSize,
  };
};

const handleDragEventSafely = (
  event: React.DragEvent<HTMLDivElement>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
): void => {
  event.preventDefault();
  event.stopPropagation();

  const { type } = event;

  console.log('🔄 [DRAG_EVENT] 드래그 이벤트 처리:', {
    type,
    timestamp: new Date().toLocaleTimeString(),
  });

  if (type === 'dragenter') {
    setDragState((prev) => ({
      isDragActive: true,
      dragCounter: prev.dragCounter + 1,
    }));
  } else if (type === 'dragleave') {
    setDragState((prev) => {
      const newCounter = prev.dragCounter - 1;
      return {
        isDragActive: newCounter > 0,
        dragCounter: Math.max(0, newCounter),
      };
    });
  } else if (type === 'dragover') {
    setDragState((prev) => ({
      ...prev,
      isDragActive: true,
    }));
  }
};

const extractFilesFromDataTransfer = (dataTransfer: DataTransfer): File[] => {
  try {
    const { files, items } = dataTransfer;

    if (files && files.length > 0) {
      return Array.from(files);
    }

    if (items && items.length > 0) {
      const extractedFiles: File[] = [];
      Array.from(items).forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            extractedFiles.push(file);
          }
        }
      });
      return extractedFiles;
    }

    return [];
  } catch (error) {
    console.error(
      '❌ [FILE_EXTRACTION] DataTransfer에서 파일 추출 실패:',
      error
    );
    return [];
  }
};

function FileDropZone(): React.ReactElement {
  const {
    handleFilesDropped,
    handleFileChange,
    hasActiveUploads,
    uploading,
    uploadStatus,
  } = useImageUploadContext();

  const [dragState, setDragState] = useState<DragState>({
    isDragActive: false,
    dragCounter: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadStatistics = useMemo(() => {
    const uploadingCount = Object.keys(uploading).length;
    const statusCount = Object.keys(uploadStatus).length;
    const totalActiveUploads = uploadingCount + statusCount;

    return {
      uploadingCount,
      statusCount,
      totalActiveUploads,
      hasAnyUploads: totalActiveUploads > 0,
    };
  }, [uploading, uploadStatus]);

  const dropZoneState = useMemo((): DropZoneState => {
    const isDisabled = hasActiveUploads;

    let statusMessage: string;
    let description: string;
    let showUploadButton: boolean;

    if (hasActiveUploads) {
      statusMessage = '업로드 진행 중...';
      description = '업로드가 완료될 때까지 기다려주세요';
      showUploadButton = false;
    } else if (dragState.isDragActive) {
      statusMessage = '파일을 놓아주세요';
      description = '지원 형식: SVG, JPG, PNG (최대 10MB)';
      showUploadButton = false;
    } else {
      statusMessage = '클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요';
      description = '지원 형식: SVG, JPG, PNG (최대 10MB)';
      showUploadButton = true;
    }

    return {
      isDisabled,
      statusMessage,
      description,
      showUploadButton,
    };
  }, [hasActiveUploads, dragState.isDragActive]);

  const handleDragEnterEvent = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (dropZoneState.isDisabled) {
        return;
      }
      handleDragEventSafely(event, setDragState);
    },
    [dropZoneState.isDisabled]
  );

  const handleDragOverEvent = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (dropZoneState.isDisabled) {
        return;
      }
      handleDragEventSafely(event, setDragState);
    },
    [dropZoneState.isDisabled]
  );

  const handleDragLeaveEvent = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (dropZoneState.isDisabled) {
        return;
      }
      handleDragEventSafely(event, setDragState);
    },
    [dropZoneState.isDisabled]
  );

  const handleDropEvent = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setDragState({
        isDragActive: false,
        dragCounter: 0,
      });

      if (dropZoneState.isDisabled) {
        console.log('🚫 [DROP_EVENT] 업로드 중이므로 드롭 무시');
        return;
      }

      try {
        console.log('🔄 [DROP_EVENT] 드롭 이벤트 처리 시작');

        const { dataTransfer } = event;
        if (!dataTransfer) {
          console.warn('⚠️ [DROP_EVENT] DataTransfer 객체 없음');
          return;
        }

        const droppedFiles = extractFilesFromDataTransfer(dataTransfer);

        if (droppedFiles.length === 0) {
          console.warn('⚠️ [DROP_EVENT] 드롭된 파일 없음');
          return;
        }

        console.log('🔍 [DROP_EVENT] 드롭된 파일들:', {
          fileCount: droppedFiles.length,
          fileNames: droppedFiles.map((f) => f.name),
          fileSizes: droppedFiles.map((f) => f.size),
        });

        const validation = validateFileList(droppedFiles);
        const { validFiles, invalidFiles } = validation;

        if (invalidFiles.length > 0) {
          console.warn('⚠️ [DROP_EVENT] 유효하지 않은 파일들:', {
            invalidCount: invalidFiles.length,
            invalidFileNames: invalidFiles.map((f) => f.name),
          });
        }

        if (validFiles.length === 0) {
          console.warn('🚨 [DROP_EVENT] 유효한 파일이 없음');
          return;
        }

        console.log('✅ [DROP_EVENT] 유효한 파일들로 처리:', {
          validFileCount: validFiles.length,
          validFileNames: validFiles.map((f) => f.name),
        });

        handleFilesDropped(validFiles);
      } catch (error) {
        console.error('❌ [DROP_EVENT] 드롭 처리 실패:', error);
        logger.error('드롭 이벤트 처리 중 오류', { error });
      }
    },
    [dropZoneState.isDisabled, handleFilesDropped]
  );

  const handleFileSelectClick = useCallback(() => {
    if (dropZoneState.isDisabled) {
      console.log('🚫 [FILE_SELECT] 업로드 중이므로 파일 선택 차단');
      return;
    }

    const input = fileInputRef.current;
    if (input) {
      console.log('🔍 [FILE_SELECT] 파일 선택 다이얼로그 열기');
      input.click();
    } else {
      console.warn('🚨 [FILE_SELECT] 파일 input 요소를 찾을 수 없음');
    }
  }, [dropZoneState.isDisabled]);

  const handleFileChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const { target } = event;
        const { files } = target;

        console.log('🔍 [FILE_CHANGE] 파일 변경 이벤트:', {
          hasFiles: files !== null,
          fileCount: files ? files.length : 0,
        });

        if (!files || files.length === 0) {
          console.warn('🚨 [FILE_CHANGE] 선택된 파일이 없음');
          return;
        }

        const selectedFiles = Array.from(files);
        const validation = validateFileList(selectedFiles);
        const { validFiles, invalidFiles } = validation;

        if (invalidFiles.length > 0) {
          console.warn('⚠️ [FILE_CHANGE] 유효하지 않은 파일들:', {
            invalidCount: invalidFiles.length,
            invalidFileNames: invalidFiles.map((f) => f.name),
          });
        }

        if (validFiles.length > 0) {
          console.log('✅ [FILE_CHANGE] 유효한 파일들 처리:', {
            validCount: validFiles.length,
            validFileNames: validFiles.map((f) => f.name),
          });

          handleFilesDropped(validFiles);
        }

        target.value = '';
        console.log('✅ [FILE_CHANGE] 파일 변경 처리 완료');
      } catch (error) {
        console.error('❌ [FILE_CHANGE] 파일 변경 처리 실패:', error);
        logger.error('파일 변경 처리 중 오류', { error });
      }
    },
    [handleFileChange]
  );

  const dropZoneClassName = useMemo(() => {
    const baseClasses = [
      'border-2',
      'border-dashed',
      'rounded-lg',
      'p-8',
      'text-center',
      'cursor-pointer',
      'transition-all',
      'duration-200',
    ];

    if (dropZoneState.isDisabled) {
      baseClasses.push('opacity-50', 'cursor-not-allowed', 'border-gray-300');
    } else if (dragState.isDragActive) {
      baseClasses.push('border-blue-500', 'bg-blue-50');
    } else {
      baseClasses.push(
        'border-gray-300',
        'hover:border-blue-400',
        'hover:bg-gray-50'
      );
    }

    return baseClasses.join(' ');
  }, [dropZoneState.isDisabled, dragState.isDragActive]);

  const iconClassName = useMemo(() => {
    const baseClasses = ['text-4xl', 'transition-colors', 'duration-200'];

    if (dropZoneState.isDisabled) {
      baseClasses.push('text-gray-400');
    } else if (dragState.isDragActive) {
      baseClasses.push('text-blue-500');
    } else {
      baseClasses.push('text-gray-400', 'hover:text-blue-500');
    }

    return baseClasses.join(' ');
  }, [dropZoneState.isDisabled, dragState.isDragActive]);

  console.log('🔍 [FILE_DROP_ZONE] Map 기반 렌더링:', {
    isDragActive: dragState.isDragActive,
    dragCounter: dragState.dragCounter,
    isDisabled: dropZoneState.isDisabled,
    uploadStatistics,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <section
      className={dropZoneClassName}
      onDragEnter={handleDragEnterEvent}
      onDragOver={handleDragOverEvent}
      onDragLeave={handleDragLeaveEvent}
      onDrop={handleDropEvent}
      onClick={handleFileSelectClick}
      role="region"
      aria-label="파일 업로드 영역"
      aria-describedby="dropzone-description"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
        onChange={handleFileChangeEvent}
        className="hidden"
        aria-label="파일 선택"
      />

      <main className="flex flex-col items-center gap-2">
        <Icon
          icon={hasActiveUploads ? 'lucide:loader-2' : 'lucide:upload-cloud'}
          className={`${iconClassName} ${
            hasActiveUploads ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        />

        <h3 className="text-lg font-medium">{dropZoneState.statusMessage}</h3>

        <p id="dropzone-description" className="text-sm text-gray-500">
          {dropZoneState.description}
        </p>

        {dropZoneState.showUploadButton && (
          <div className="mt-2">
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 transition-colors border border-blue-600 rounded-lg hover:bg-blue-50">
              파일 선택
            </span>
          </div>
        )}

        {hasActiveUploads && (
          <div className="flex items-center gap-2 mt-2 text-blue-600">
            <Icon
              icon="lucide:loader-2"
              className="text-sm animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm">
              파일 처리 중... ({uploadStatistics.uploadingCount}개 업로드 중)
            </span>
          </div>
        )}
      </main>
    </section>
  );
}

export default memo(FileDropZone);
