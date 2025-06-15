// blogMediaStep/imageUpload/parts/UploadProgressList.tsx - ImageUpload

/**
 * ImageUpload - 업로드 진행률 목록 컴포넌트
 * 파일별 업로드 진행률과 상태를 시각적으로 표시
 * 기존 업로드 진행률 UI 부분을 독립 컴포넌트로 분리
 */

import React from 'react';
import { Progress } from '@heroui/react';
import { Icon } from '@iconify/react';

// ✅ 개별 업로드 진행률 정보 타입
interface UploadProgressItem {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

// ✅ UploadProgressList props 타입
interface UploadProgressListProps {
  uploading: Record<string, number>; // fileId -> progress
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>; // fileName -> status
  fileIdToNameMap?: Record<string, string>; // fileId -> fileName 매핑
  className?: string;
  showCompleted?: boolean;
  maxItems?: number;
}

/**
 * 업로드 진행률 목록 컴포넌트
 * 기존 업로드 진행률 표시 로직을 독립 컴포넌트로 분리
 */
function UploadProgressList({
  uploading,
  uploadStatus,
  fileIdToNameMap = {},
  className = '',
  showCompleted = false,
  maxItems = 5,
}: UploadProgressListProps): React.ReactNode {
  console.log('🔧 UploadProgressList 렌더링:', {
    uploadingCount: Object.keys(uploading).length,
    statusCount: Object.keys(uploadStatus).length,
    showCompleted,
    timestamp: new Date().toLocaleTimeString(),
  }); // 디버깅용

  // ✅ 업로드 진행률 아이템 생성
  const createProgressItems = (): UploadProgressItem[] => {
    const items: UploadProgressItem[] = [];

    // 현재 업로드 중인 파일들
    Object.entries(uploading).forEach(([fileId, progress]) => {
      const fileName = fileIdToNameMap[fileId] || `파일 ${fileId}`;
      const status = uploadStatus[fileName] || 'uploading';

      items.push({
        fileId,
        fileName,
        progress,
        status,
      });
    });

    // 완료/에러 파일들 (showCompleted가 true일 때)
    if (showCompleted) {
      Object.entries(uploadStatus).forEach(([fileName, status]) => {
        // 이미 uploading에 있는 파일은 제외
        const isAlreadyInUploading =
          Object.values(fileIdToNameMap).includes(fileName);

        if (
          !isAlreadyInUploading &&
          (status === 'success' || status === 'error')
        ) {
          items.push({
            fileId: fileName, // 완료된 파일은 fileId 대신 fileName 사용
            fileName,
            progress: status === 'success' ? 100 : 0,
            status,
          });
        }
      });
    }

    return items.slice(0, maxItems); // 최대 표시 개수 제한
  };

  const progressItems = createProgressItems();

  // ✅ 표시할 아이템이 없으면 null 반환
  if (progressItems.length === 0) {
    console.log('⚠️ 표시할 업로드 진행률 없음'); // 디버깅용
    return null;
  }

  console.log('📊 업로드 진행률 아이템들:', {
    itemCount: progressItems.length,
    items: progressItems.map((item) => ({
      fileName: item.fileName,
      progress: item.progress,
      status: item.status,
    })),
  }); // 디버깅용

  // ✅ 상태별 아이콘 반환
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return (
          <Icon
            icon="lucide:loader-2"
            className="text-sm animate-spin text-primary"
          />
        );
      case 'success':
        return (
          <Icon icon="lucide:check-circle" className="text-sm text-success" />
        );
      case 'error':
        return <Icon icon="lucide:x-circle" className="text-sm text-danger" />;
      default:
        return (
          <Icon icon="lucide:clock" className="text-sm text-default-400" />
        );
    }
  };

  // ✅ 상태별 색상 반환
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'primary';
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ✅ 제목 (기존과 동일) */}
      <h4 className="text-sm font-medium">업로드 중...</h4>

      {/* ✅ 진행률 아이템들 */}
      {progressItems.map((item) => (
        <div
          key={item.fileId}
          className="space-y-1"
          role="progressbar"
          aria-valuenow={item.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${item.fileName} 업로드 진행률`}
        >
          {/* ✅ 파일명과 진행률 (기존 구조 유지) */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center flex-1 min-w-0 gap-2">
              {/* 상태 아이콘 */}
              {getStatusIcon(item.status)}

              {/* 파일명 */}
              <span className="truncate" title={item.fileName}>
                {item.fileName}
              </span>
            </div>

            {/* 진행률 퍼센트 */}
            <span className="ml-2 text-default-500">
              {Math.round(item.progress)}%
            </span>
          </div>

          {/* ✅ 진행률 바 (기존과 동일) */}
          <Progress
            value={item.progress}
            color={getProgressColor(item.status) as any}
            size="sm"
            aria-label={`${item.fileName} 업로드 진행률 ${item.progress}%`}
            classNames={{
              base: 'w-full',
              track: 'bg-default-200',
              indicator: 'transition-all duration-300',
            }}
          />

          {/* ✅ 에러 메시지 (에러 상태일 때만) */}
          {item.status === 'error' && (
            <div className="mt-1 text-xs text-danger">
              업로드 실패 - 다시 시도해주세요
            </div>
          )}

          {/* ✅ 완료 메시지 (성공 상태일 때만) */}
          {item.status === 'success' && showCompleted && (
            <div className="mt-1 text-xs text-success">업로드 완료</div>
          )}
        </div>
      ))}

      {/* ✅ 더 많은 파일이 있을 때 표시 */}
      {Object.keys(uploading).length > maxItems && (
        <div className="pt-1 text-xs text-center text-default-500">
          +{Object.keys(uploading).length - maxItems}개 파일 더 업로드 중...
        </div>
      )}
    </div>
  );
}

export default UploadProgressList;
