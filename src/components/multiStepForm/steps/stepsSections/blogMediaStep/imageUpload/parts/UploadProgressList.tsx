// blogMediaStep/imageUpload/parts/UploadProgressList.tsx

import React from 'react';
import { Progress } from '@heroui/react';
import { Icon } from '@iconify/react';

// 개별 업로드 진행률 정보 타입 (단순화)
interface UploadProgressItem {
  uniqueItemKey: string; // React key 전용 식별자
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  itemType: 'uploading' | 'completed';
}

// UploadProgressList props 타입
interface UploadProgressListProps {
  uploading: Record<string, number>; // fileId -> progress
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>; // fileName -> status
  fileIdToNameMap?: Record<string, string>; // fileId -> fileName 매핑
  className?: string;
  showCompleted?: boolean;
  maxItems?: number;
}

/**
 * 업로드 진행률 목록 컴포넌트 (단순화된 버전)
 * 원본 코드의 단순한 키 생성 방식을 따라 복잡한 로직 제거
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

  console.log('🔧 UploadProgressList 렌더링 (단순화):', {
    uploadingCount,
    statusCount,
    showCompleted,
    maxItems,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔥 핵심 수정: 단순한 진행률 아이템 생성 (원본 방식)
  const createProgressItems = (): UploadProgressItem[] => {
    const progressItems: UploadProgressItem[] = [];

    console.log('📋 진행률 아이템 생성 시작 (단순화):', {
      uploadingCount,
      statusCount,
      timestamp: new Date().toLocaleTimeString(),
    });

    // 🚨 핵심: 현재 업로드 중인 파일들 (원본 코드 방식)
    uploadingEntries.forEach(([currentFileId, currentProgress]) => {
      const mappedFileName =
        fileIdToNameMap[currentFileId] !== null &&
        fileIdToNameMap[currentFileId] !== undefined
          ? fileIdToNameMap[currentFileId]
          : `파일 ${currentFileId}`;

      const currentFileStatus =
        uploadStatus[mappedFileName] !== null &&
        uploadStatus[mappedFileName] !== undefined
          ? uploadStatus[mappedFileName]
          : 'uploading';

      // 🔥 핵심 수정: 원본 코드와 동일한 단순한 키 생성
      const uniqueItemKey = currentFileId; // 원본: key={id}

      const uploadingItem: UploadProgressItem = {
        uniqueItemKey,
        fileId: currentFileId,
        fileName: mappedFileName,
        progress: currentProgress,
        status: currentFileStatus,
        itemType: 'uploading',
      };

      progressItems.push(uploadingItem);

      console.log('📤 업로딩 아이템 추가 (단순화):', {
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
      console.log('✅ 완료된 파일 처리 시작 (단순화):', {
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

        console.log('🔍 완료 파일 조건 검사 (단순화):', {
          statusFileName,
          statusValue,
          isAlreadyInUploading,
          isCompletedStatus,
          shouldIncludeCompletedItem,
          timestamp: new Date().toLocaleTimeString(),
        });

        if (shouldIncludeCompletedItem) {
          // 🔥 핵심 수정: 단순한 키 생성 (원본 방식)
          const uniqueItemKey = `completed-${statusFileName}`; // 단순하고 명확

          const completedProgress = statusValue === 'success' ? 100 : 0;

          const completedItem: UploadProgressItem = {
            uniqueItemKey,
            fileId: `completed-${statusFileName}`,
            fileName: statusFileName,
            progress: completedProgress,
            status: statusValue,
            itemType: 'completed',
          };

          progressItems.push(completedItem);

          console.log('✅ 완료 아이템 추가 (단순화):', {
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

    console.log('📋 진행률 아이템 생성 완료 (단순화):', {
      totalCreated: progressItems.length,
      afterLimit: finalItemCount,
      maxItems,
      timestamp: new Date().toLocaleTimeString(),
    });

    return limitedItems;
  };

  const progressItems = createProgressItems();
  const { length: progressItemCount } = progressItems;

  // 표시할 아이템이 없으면 null 반환
  const hasNoItemsToShow = progressItemCount === 0;
  if (hasNoItemsToShow) {
    console.log('⚠️ 표시할 업로드 진행률 없음 (단순화)');
    return null;
  }

  console.log('📊 최종 업로드 진행률 아이템들 (단순화):', {
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

  // 상태별 아이콘 반환 (기존과 동일)
  const getStatusIcon = (itemStatus: string) => {
    console.log('🎨 getStatusIcon 호출 (단순화):', {
      itemStatus,
      timestamp: new Date().toLocaleTimeString(),
    });

    const statusValue = itemStatus;

    // 삼항연산자 사용 (기본설정에 따라)
    const iconElement =
      statusValue === 'uploading' ? (
        <Icon
          icon="lucide:loader-2"
          className="text-sm animate-spin text-primary"
          aria-hidden="true"
        />
      ) : statusValue === 'success' ? (
        <Icon
          icon="lucide:check-circle"
          className="text-sm text-success"
          aria-hidden="true"
        />
      ) : statusValue === 'error' ? (
        <Icon
          icon="lucide:x-circle"
          className="text-sm text-danger"
          aria-hidden="true"
        />
      ) : (
        <Icon
          icon="lucide:clock"
          className="text-sm text-default-400"
          aria-hidden="true"
        />
      );

    return iconElement;
  };

  // 상태별 색상 반환 (기존과 동일)
  const getProgressColor = (itemStatus: string) => {
    console.log('🎨 getProgressColor 호출 (단순화):', {
      itemStatus,
      timestamp: new Date().toLocaleTimeString(),
    });

    const statusValue = itemStatus;

    // 삼항연산자 사용 (기본설정에 따라)
    const colorValue =
      statusValue === 'uploading'
        ? 'primary'
        : statusValue === 'success'
        ? 'success'
        : statusValue === 'error'
        ? 'danger'
        : 'default';

    return colorValue;
  };

  const uploadingKeys = Object.keys(uploading);
  const { length: remainingUploadCount } = uploadingKeys;
  const hasMoreItemsThanLimit = remainingUploadCount > maxItems;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 제목 (기존과 동일) */}
      <h4 className="text-sm font-medium">업로드 중...</h4>

      {/* 🔥 핵심 수정: 진행률 아이템들 - 단순한 key 사용 */}
      {progressItems.map((progressItem) => {
        const { uniqueItemKey, fileName, progress, status, itemType } =
          progressItem;

        console.log('🔄 진행률 아이템 렌더링 (단순화):', {
          uniqueItemKey,
          fileName,
          progress,
          status,
          itemType,
          timestamp: new Date().toLocaleTimeString(),
        });

        return (
          <div
            key={uniqueItemKey} // 🔥 핵심: 단순한 키 사용 (원본 방식)
            className="space-y-1"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${fileName} 업로드 진행률`}
          >
            {/* 파일명과 진행률 (기존 구조 유지) */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center flex-1 min-w-0 gap-2">
                {/* 상태 아이콘 */}
                {getStatusIcon(status)}

                {/* 파일명 */}
                <span className="truncate" title={fileName}>
                  {fileName}
                </span>
              </div>

              {/* 진행률 퍼센트 */}
              <span className="ml-2 text-default-500">
                {Math.round(progress)}%
              </span>
            </div>

            {/* 진행률 바 (기존과 동일) */}
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

            {/* 에러 메시지 (에러 상태일 때만) */}
            {status === 'error' && (
              <div className="mt-1 text-xs text-danger">
                업로드 실패 - 다시 시도해주세요
              </div>
            )}

            {/* 완료 메시지 (성공 상태일 때만) */}
            {status === 'success' && showCompleted && (
              <div className="mt-1 text-xs text-success">업로드 완료</div>
            )}
          </div>
        );
      })}

      {/* 더 많은 파일이 있을 때 표시 */}
      {hasMoreItemsThanLimit && (
        <div className="pt-1 text-xs text-center text-default-500">
          +{remainingUploadCount - maxItems}개 파일 더 업로드 중...
        </div>
      )}
    </div>
  );
}

export default UploadProgressList;
