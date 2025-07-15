// 📁 imageUpload/parts/FileDropZone.tsx

import React, { memo, useCallback, useMemo, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import {
  handleDragEvent,
  handleDropEvent,
  // } from '../../../blogMediaStep/utils/dragAndDropUtils';
} from '../utils/dragAndDropUtils.ts';

const logger = createLogger('FILE_DROP_ZONE');

function FileDropZone(): React.ReactNode {
  const { handleFilesDropped, handleFileChange, hasActiveUploads } =
    useImageUploadContext();

  const [isDragActive, setIsDragActive] = useState(false);

  // 🔧 간단한 input ref (복잡한 로직 제거)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEventCallback = useCallback((dragEvent: React.DragEvent) => {
    try {
      handleDragEvent(dragEvent, setIsDragActive);
    } catch (error) {
      logger.error('드래그 이벤트 처리 중 오류', { error });
    }
  }, []);

  const handleDropEventCallback = useCallback(
    (dropEvent: React.DragEvent) => {
      try {
        handleDropEvent(dropEvent, setIsDragActive, handleFilesDropped);
      } catch (error) {
        logger.error('드롭 이벤트 처리 중 오류', { error });
      }
    },
    [handleFilesDropped]
  );

  // ✅ 간단한 파일 선택 - 복잡한 ref 연결 없음
  const handleFileSelectClick = useCallback(() => {
    if (hasActiveUploads) {
      console.log('업로드 중이므로 파일 선택 차단');
      return;
    }

    const input = fileInputRef.current;
    if (input) {
      input.click(); // 끝!
      console.log('✅ 파일 선택 다이얼로그 열기');
    }
  }, [hasActiveUploads]);

  // ✅ 파일 변경 처리 - 간단함
  const handleFileChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileChange(files);
        event.target.value = ''; // 같은 파일 재선택 가능
      }
    },
    [handleFileChange]
  );

  const dropZoneClassName = useMemo(() => {
    const baseClasses =
      'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200';
    const stateClasses = isDragActive
      ? 'border-primary bg-primary-50'
      : 'border-default-300 hover:border-primary-400';
    const uploadClasses = hasActiveUploads
      ? 'opacity-50 cursor-not-allowed'
      : '';

    return `${baseClasses} ${stateClasses} ${uploadClasses}`;
  }, [isDragActive, hasActiveUploads]);

  const iconClassName = useMemo(() => {
    return `text-4xl transition-colors duration-200 ${
      isDragActive ? 'text-primary' : 'text-default-400'
    }`;
  }, [isDragActive]);

  const message = useMemo(() => {
    if (hasActiveUploads) return '업로드 진행 중...';
    if (isDragActive) return '파일을 놓아주세요';
    return '클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요';
  }, [hasActiveUploads, isDragActive]);

  const description = hasActiveUploads
    ? '업로드가 완료될 때까지 기다려주세요'
    : '지원 형식: SVG, JPG, PNG (최대 10MB)';

  return (
    <div
      className={dropZoneClassName}
      onDragEnter={handleDragEventCallback}
      onDragOver={handleDragEventCallback}
      onDragLeave={handleDragEventCallback}
      onDrop={handleDropEventCallback}
      onClick={handleFileSelectClick}
      role="region"
      aria-label="파일 업로드 영역"
    >
      {/* 숨겨진 파일 input - 간단함! */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg"
        onChange={handleFileChangeEvent}
        className="hidden"
        aria-label="파일 선택"
      />

      <div className="flex flex-col items-center gap-2">
        <Icon
          icon="lucide:upload-cloud"
          className={iconClassName}
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium">{message}</h3>
        <p className="text-sm text-default-500">{description}</p>

        {!hasActiveUploads && (
          <div className="mt-2">
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-primary border-primary hover:bg-primary-50">
              파일 선택
            </span>
          </div>
        )}

        {hasActiveUploads && (
          <div className="flex items-center gap-2 mt-2 text-primary">
            <Icon
              icon="lucide:loader-2"
              className="text-sm animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm">파일 처리 중...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(FileDropZone);
