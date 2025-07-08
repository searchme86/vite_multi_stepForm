// blogMediaStep/imageUpload/parts/UploadSummary.tsx

import React from 'react';
import { type DeleteConfirmState } from '../types/imageUploadTypes';

interface UploadSummaryProps {
  mediaFiles: string[];
  deleteConfirmState: DeleteConfirmState;
  isMobileDevice: boolean;
}

function UploadSummary({
  mediaFiles,
  deleteConfirmState,
  isMobileDevice,
}: UploadSummaryProps): React.ReactNode {
  console.log('📊 [UPLOAD_SUMMARY] UploadSummary 렌더링:', {
    mediaFilesCount: mediaFiles.length,
    deleteConfirmVisible: deleteConfirmState.isVisible,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  const getTotalSizeInKB = (files: string[]): number => {
    return Math.round(
      files.reduce((totalSize, imageUrl) => totalSize + imageUrl.length, 0) /
        1024
    );
  };

  const shouldShowScrollTip =
    mediaFiles.length > 1 && !deleteConfirmState.isVisible;

  const summaryClassName = `transition-all duration-300 ${
    deleteConfirmState.isVisible
      ? 'transform -translate-y-2 opacity-70'
      : 'transform translate-y-0 opacity-100'
  }`;

  return (
    <div className={summaryClassName}>
      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-blue-800">
          총 {mediaFiles.length}개의 이미지가 업로드되었습니다
        </span>
        <span className="text-blue-600">
          총 크기: {getTotalSizeInKB(mediaFiles)} KB
        </span>
      </div>

      {shouldShowScrollTip && (
        <p className="mt-2 text-xs text-blue-600">
          💡 가로로 스크롤하여 모든 이미지를 확인하세요
          {isMobileDevice ? ' (모바일: 터치하여 상세 정보 보기)' : ''}
        </p>
      )}
    </div>
  );
}

export default UploadSummary;
