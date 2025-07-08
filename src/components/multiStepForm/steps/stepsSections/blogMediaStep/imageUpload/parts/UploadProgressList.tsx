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
  uniqueItemKey: string; // 🔧 추가: React key 전용 고유 식별자
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  itemType: 'uploading' | 'completed'; // 🔧 추가: 아이템 유형 구분
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

// 🔧 추가: 고유 키 생성 함수
let keyGenerationCounter = 0;
const generateUniqueItemKey = (prefix: string, identifier: string): string => {
  const currentTimestamp = Date.now();
  const incrementedCounter = ++keyGenerationCounter;
  const randomSuffix = Math.random().toString(36).substring(2, 9);

  const uniqueKey = `${prefix}-${identifier}-${currentTimestamp}-${incrementedCounter}-${randomSuffix}`;

  console.log('🔑 [DEBUG] 고유 키 생성:', {
    prefix,
    identifier: identifier.slice(0, 20) + '...',
    uniqueKey,
    timestamp: new Date().toLocaleTimeString(),
  });

  return uniqueKey;
};

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
  const uploadingEntries = Object.entries(uploading);
  const uploadStatusEntries = Object.entries(uploadStatus);
  const { length: uploadingCount } = uploadingEntries;
  const { length: statusCount } = uploadStatusEntries;

  console.log('🔧 [DEBUG] UploadProgressList 렌더링:', {
    uploadingCount,
    statusCount,
    showCompleted,
    maxItems,
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ 업로드 진행률 아이템 생성 (Key 중복 문제 해결)
  const createProgressItems = (): UploadProgressItem[] => {
    const progressItems: UploadProgressItem[] = [];

    console.log('📋 [DEBUG] 진행률 아이템 생성 시작:', {
      uploadingCount,
      statusCount,
      timestamp: new Date().toLocaleTimeString(),
    });

    // 현재 업로드 중인 파일들
    uploadingEntries.forEach(([currentFileId, currentProgress]) => {
      const mappedFileName =
        fileIdToNameMap[currentFileId] || `파일 ${currentFileId}`;
      const currentFileStatus = uploadStatus[mappedFileName] || 'uploading';

      // 🔧 업로드 중인 파일용 고유 키 생성
      const uniqueItemKey = generateUniqueItemKey('uploading', currentFileId);

      const uploadingItem: UploadProgressItem = {
        uniqueItemKey,
        fileId: currentFileId,
        fileName: mappedFileName,
        progress: currentProgress,
        status: currentFileStatus,
        itemType: 'uploading',
      };

      progressItems.push(uploadingItem);

      console.log('📤 [DEBUG] 업로딩 아이템 추가:', {
        fileName: mappedFileName,
        fileId: currentFileId,
        uniqueItemKey,
        progress: currentProgress,
        status: currentFileStatus,
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    // 완료/에러 파일들 (showCompleted가 true일 때)
    if (showCompleted) {
      console.log('✅ [DEBUG] 완료된 파일 처리 시작:', {
        showCompleted,
        timestamp: new Date().toLocaleTimeString(),
      });

      uploadStatusEntries.forEach(([statusFileName, statusValue]) => {
        // 이미 uploading에 있는 파일인지 확인
        const fileIdToNameMapValues = Object.values(fileIdToNameMap);
        const isAlreadyInUploading =
          fileIdToNameMapValues.includes(statusFileName);

        const isCompletedStatus =
          statusValue === 'success' || statusValue === 'error';
        const shouldIncludeCompletedItem =
          !isAlreadyInUploading && isCompletedStatus;

        console.log('🔍 [DEBUG] 완료 파일 조건 검사:', {
          statusFileName,
          statusValue,
          isAlreadyInUploading,
          isCompletedStatus,
          shouldIncludeCompletedItem,
          timestamp: new Date().toLocaleTimeString(),
        });

        if (shouldIncludeCompletedItem) {
          // 🔧 완료된 파일용 고유 키 생성 (fileName + timestamp + counter로 중복 방지)
          const uniqueItemKey = generateUniqueItemKey(
            'completed',
            statusFileName
          );

          const completedProgress = statusValue === 'success' ? 100 : 0;

          const completedItem: UploadProgressItem = {
            uniqueItemKey,
            fileId: `completed-${statusFileName}`, // 🔧 완료된 파일은 접두사를 붙인 고유 fileId 사용
            fileName: statusFileName,
            progress: completedProgress,
            status: statusValue,
            itemType: 'completed',
          };

          progressItems.push(completedItem);

          console.log('✅ [DEBUG] 완료 아이템 추가:', {
            fileName: statusFileName,
            uniqueItemKey,
            completedProgress,
            status: statusValue,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      });
    }

    // 최대 표시 개수로 제한
    const limitedItems = progressItems.slice(0, maxItems);
    const { length: finalItemCount } = limitedItems;

    console.log('📋 [DEBUG] 진행률 아이템 생성 완료:', {
      totalCreated: progressItems.length,
      afterLimit: finalItemCount,
      maxItems,
      timestamp: new Date().toLocaleTimeString(),
    });

    return limitedItems;
  };

  const progressItems = createProgressItems();
  const { length: progressItemCount } = progressItems;

  // ✅ 표시할 아이템이 없으면 null 반환
  if (progressItemCount === 0) {
    console.log('⚠️ [DEBUG] 표시할 업로드 진행률 없음');
    return null;
  }

  console.log('📊 [DEBUG] 최종 업로드 진행률 아이템들:', {
    itemCount: progressItemCount,
    items: progressItems.map((progressItem) => {
      const { fileName, progress, status, uniqueItemKey } = progressItem;
      return {
        fileName,
        progress,
        status,
        uniqueItemKey,
      };
    }),
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ 상태별 아이콘 반환
  const getStatusIcon = (itemStatus: string) => {
    console.log('🎨 [DEBUG] getStatusIcon 호출:', {
      itemStatus,
      timestamp: new Date().toLocaleTimeString(),
    });

    switch (itemStatus) {
      case 'uploading':
        return (
          <Icon
            icon="lucide:loader-2"
            className="text-sm animate-spin text-primary"
            aria-hidden="true"
          />
        );
      case 'success':
        return (
          <Icon
            icon="lucide:check-circle"
            className="text-sm text-success"
            aria-hidden="true"
          />
        );
      case 'error':
        return (
          <Icon
            icon="lucide:x-circle"
            className="text-sm text-danger"
            aria-hidden="true"
          />
        );
      default:
        return (
          <Icon
            icon="lucide:clock"
            className="text-sm text-default-400"
            aria-hidden="true"
          />
        );
    }
  };

  // ✅ 상태별 색상 반환
  const getProgressColor = (itemStatus: string) => {
    console.log('🎨 [DEBUG] getProgressColor 호출:', {
      itemStatus,
      timestamp: new Date().toLocaleTimeString(),
    });

    switch (itemStatus) {
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

  const uploadingKeys = Object.keys(uploading);
  const { length: remainingUploadCount } = uploadingKeys;
  const hasMoreItemsThanLimit = remainingUploadCount > maxItems;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ✅ 제목 (기존과 동일) */}
      <h4 className="text-sm font-medium">업로드 중...</h4>

      {/* ✅ 진행률 아이템들 - 🔧 고유 key 사용으로 중복 문제 해결 */}
      {progressItems.map((progressItem) => {
        const { uniqueItemKey, fileName, progress, status, itemType } =
          progressItem;

        console.log('🔄 [DEBUG] 진행률 아이템 렌더링:', {
          uniqueItemKey,
          fileName,
          progress,
          status,
          itemType,
          timestamp: new Date().toLocaleTimeString(),
        });

        return (
          <div
            key={uniqueItemKey} // 🔧 핵심: 고유한 key 사용으로 중복 문제 해결
            className="space-y-1"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${fileName} 업로드 진행률`}
          >
            {/* ✅ 파일명과 진행률 (기존 구조 유지) */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center flex-1 min-w-0 gap-2">
                {/* 상태 아이콘 */}
                {getStatusIcon(status)}

                {/* 파일명 */}
                <span className="truncate" title={fileName}>
                  {fileName}
                </span>

                {/* 🔧 디버깅용: 아이템 타입 표시 (개발 모드에서만) */}
                {/* {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-gray-400">[{itemType}]</span>
                )} */}
              </div>

              {/* 진행률 퍼센트 */}
              <span className="ml-2 text-default-500">
                {Math.round(progress)}%
              </span>
            </div>

            {/* ✅ 진행률 바 (기존과 동일) */}
            <Progress
              value={progress}
              color={getProgressColor(status) as any}
              size="sm"
              aria-label={`${fileName} 업로드 진행률 ${progress}%`}
              classNames={{
                base: 'w-full',
                track: 'bg-default-200',
                indicator: 'transition-all duration-300',
              }}
            />

            {/* ✅ 에러 메시지 (에러 상태일 때만) */}
            {status === 'error' && (
              <div className="mt-1 text-xs text-danger">
                업로드 실패 - 다시 시도해주세요
              </div>
            )}

            {/* ✅ 완료 메시지 (성공 상태일 때만) */}
            {status === 'success' && showCompleted && (
              <div className="mt-1 text-xs text-success">업로드 완료</div>
            )}
          </div>
        );
      })}

      {/* ✅ 더 많은 파일이 있을 때 표시 */}
      {hasMoreItemsThanLimit && (
        <div className="pt-1 text-xs text-center text-default-500">
          +{remainingUploadCount - maxItems}개 파일 더 업로드 중...
        </div>
      )}
    </div>
  );
}

export default UploadProgressList;
