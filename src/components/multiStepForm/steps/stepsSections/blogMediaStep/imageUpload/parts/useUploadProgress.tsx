// blogMediaStep/imageUpload/parts/UploadProgressList.tsx

import React from 'react';
import { Progress } from '@heroui/react';

// ✅ 원본 방식: 단순한 props 타입 (복잡한 매핑 제거)
interface UploadProgressListProps {
  uploading: Record<string, number>; // fileId -> progress
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>; // fileName -> status
  className?: string;
}

/**
 * ✅ 원본 방식: 단순한 업로드 진행률 목록 컴포넌트
 * Object.entries(uploading).map()으로만 처리 (복잡한 로직 제거)
 */
function UploadProgressList({
  uploading,
  uploadStatus,
  className = '',
}: UploadProgressListProps): React.ReactNode {
  console.log('🔧 UploadProgressList 렌더링 (원본 방식):', {
    uploadingCount: Object.keys(uploading).length,
    uploadStatusCount: Object.keys(uploadStatus).length,
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ 원본 방식: 단순한 업로딩 상태 확인
  const uploadingEntries = Object.entries(uploading);
  const hasNoUploading = uploadingEntries.length === 0;

  // ✅ 원본과 동일: 업로딩 중인 파일이 없으면 null 반환
  if (hasNoUploading) {
    console.log('⚠️ 표시할 업로드 진행률 없음 (원본 방식)');
    return null;
  }

  console.log('📊 최종 업로드 진행률 아이템들 (원본 방식):', {
    uploadingEntries: uploadingEntries.map(([fileId, progress]) => ({
      fileId,
      progress,
    })),
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ✅ 원본과 동일한 제목 */}
      <h4 className="text-sm font-medium">업로드 중...</h4>

      {/* ✅ 원본 방식: Object.entries(uploading).map()으로만 처리 */}
      {uploadingEntries.map(([fileId, progress]) => {
        console.log('🔄 진행률 아이템 렌더링 (원본 방식):', {
          fileId,
          progress,
          timestamp: new Date().toLocaleTimeString(),
        });

        return (
          <div
            key={fileId} // ✅ 원본과 동일: key={id}
            className="space-y-1"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`파일 업로드 진행률 ${progress}%`}
          >
            {/* ✅ 원본과 동일한 진행률 표시 */}
            <div className="flex justify-between text-xs">
              <span>파일 업로드 중</span>
              <span>{Math.round(progress)}%</span>
            </div>

            {/* ✅ 원본과 동일한 Progress 컴포넌트 */}
            <Progress
              value={progress}
              color="primary"
              size="sm"
              aria-label={`파일 업로드 진행률 ${progress}%`}
              classNames={{
                base: 'w-full',
                track: 'bg-default-200',
                indicator: 'transition-all duration-300',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default UploadProgressList;
