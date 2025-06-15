// blogMediaStep/imageUpload/parts/FileDropZone.tsx - ImageUpload

/**
 * ImageUpload - 파일 드래그 앤 드롭 영역 컴포넌트
 * 드래그 상태 시각적 표시와 파일 드롭 이벤트 처리
 * 기존 드래그앤드롭 UI 부분을 컴포넌트로 분리
 */

import React from 'react';
import { Icon } from '@iconify/react';
import { handleDragEvent, handleDropEvent } from '../../utils/dragAndDropUtils';

// ✅ FileDropZone props 타입
interface FileDropZoneProps {
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  onFilesDropped: (files: File[]) => void;
  onFileSelectClick: () => void;
  isUploading?: boolean;
  className?: string;
}

/**
 * 파일 드래그 앤 드롭 영역 컴포넌트
 * 기존 드래그앤드롭 UI를 독립적인 컴포넌트로 분리
 */
function FileDropZone({
  dragActive,
  setDragActive,
  onFilesDropped,
  onFileSelectClick,
  isUploading = false,
  className = '',
}: FileDropZoneProps): React.ReactNode {
  console.log('🔧 FileDropZone 렌더링:', {
    dragActive,
    isUploading,
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용

  // ✅ 드래그 이벤트 핸들러 (기존 handleDrag 로직 활용)
  const handleDrag = (e: React.DragEvent) => {
    console.log('🔧 FileDropZone handleDrag:', { eventType: e.type }); // 디버깅용
    handleDragEvent(e, setDragActive);
  };

  // ✅ 드롭 이벤트 핸들러 (기존 handleDrop 로직 활용)
  const handleDrop = (e: React.DragEvent) => {
    console.log('🔧 FileDropZone handleDrop'); // 디버깅용
    handleDropEvent(e, setDragActive, onFilesDropped);
  };

  // ✅ 클릭 핸들러
  const handleClick = () => {
    console.log('🔧 FileDropZone 클릭'); // 디버깅용

    if (isUploading) {
      console.log('⚠️ 업로드 중이므로 파일 선택 무시'); // 디버깅용
      return;
    }

    onFileSelectClick();
  };

  // ✅ 드래그 상태에 따른 스타일 클래스 (기존과 동일)
  const dropZoneClassName = `
    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
    ${dragActive ? 'border-primary bg-primary-50' : 'border-default-300'}
    ${
      isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400'
    }
    ${className}
  `.trim();

  console.log('🎨 FileDropZone 스타일:', {
    dragActive,
    isUploading,
    finalClassName: dropZoneClassName,
  }); // 디버깅용

  return (
    <div
      className={dropZoneClassName}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      role="region"
      aria-label="파일 업로드 영역"
      aria-describedby="drop-zone-description"
    >
      <div className="flex flex-col items-center gap-2">
        {/* ✅ 아이콘 (기존과 동일) */}
        <Icon
          icon="lucide:upload-cloud"
          className={`text-4xl transition-colors duration-200 ${
            dragActive ? 'text-primary' : 'text-default-400'
          }`}
          aria-hidden="true"
        />

        {/* ✅ 메인 메시지 (기존 로직 유지) */}
        <h3 className="text-lg font-medium">
          {isUploading
            ? '업로드 진행 중...'
            : dragActive
            ? '파일을 놓아주세요'
            : '클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요'}
        </h3>

        {/* ✅ 설명 텍스트 (기존과 동일) */}
        <p id="drop-zone-description" className="text-sm text-default-500">
          {isUploading
            ? '업로드가 완료될 때까지 기다려주세요'
            : '지원 형식: SVG, JPG, PNG (최대 10MB)'}
        </p>

        {/* ✅ 업로드 중이 아닐 때만 버튼 표시 */}
        {!isUploading && (
          <div className="mt-2">
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-primary border-primary hover:bg-primary-50">
              파일 선택
            </span>
          </div>
        )}

        {/* ✅ 업로드 중 표시 */}
        {isUploading && (
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

export default FileDropZone;
