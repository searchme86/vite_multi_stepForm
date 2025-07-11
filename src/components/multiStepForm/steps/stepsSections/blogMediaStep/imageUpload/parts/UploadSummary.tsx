// 📁 imageUpload/parts/UploadSummary.tsx

import React, { memo, useMemo, useCallback } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('UPLOAD_SUMMARY');

interface SummaryData {
  totalImagesCount: number;
  hasMainImageHandlers: boolean;
  isDeleteConfirmVisible: boolean;
}

const calculateSummaryData = (
  uploadedImages: string[],
  hasMainImageHandlers: boolean,
  isDeleteConfirmVisible: boolean
): SummaryData => {
  const totalImagesCount = uploadedImages.length;

  return {
    totalImagesCount,
    hasMainImageHandlers,
    isDeleteConfirmVisible,
  };
};

const formatSummaryMessage = (summaryData: SummaryData): string => {
  const { totalImagesCount, hasMainImageHandlers } = summaryData;

  if (totalImagesCount === 0) {
    return '이미지를 업로드해주세요';
  }

  const mainImageText = hasMainImageHandlers ? ' (메인 이미지 설정 가능)' : '';

  return `총 ${totalImagesCount}개의 이미지가 업로드되었습니다${mainImageText}`;
};

const SummaryStats = memo(
  ({ summaryData }: { summaryData: SummaryData }): React.ReactNode => {
    const { totalImagesCount, hasMainImageHandlers } = summaryData;

    logger.debug('SummaryStats 렌더링', {
      totalImagesCount,
      hasMainImageHandlers,
    });

    const handleStatsClick = useCallback(() => {
      logger.debug('통계 클릭', { summaryData });
    }, [summaryData]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        const { key } = event;
        const isEnterOrSpace = key === 'Enter' || key === ' ';

        if (isEnterOrSpace) {
          event.preventDefault();
          handleStatsClick();
        }
      },
      [handleStatsClick]
    );

    return (
      <div
        className="flex items-center justify-between p-2 text-sm transition-colors duration-200 rounded cursor-pointer hover:bg-blue-100"
        onClick={handleStatsClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-4">
          <span className="font-medium text-blue-900">
            업로드: {totalImagesCount}개
          </span>

          {hasMainImageHandlers ? (
            <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full">
              메인 이미지 설정 가능
            </span>
          ) : null}
        </div>
      </div>
    );
  }
);

SummaryStats.displayName = 'SummaryStats';

const SummaryContent = memo(
  ({ summaryData }: { summaryData: SummaryData }): React.ReactNode => {
    const { isDeleteConfirmVisible } = summaryData;

    const summaryMessage = useMemo(
      () => formatSummaryMessage(summaryData),
      [summaryData]
    );

    logger.debug('SummaryContent 렌더링', {
      isDeleteConfirmVisible,
      summaryMessage,
    });

    return (
      <div
        className="space-y-3"
        role="region"
        aria-labelledby="upload-summary-title"
        aria-live="polite"
      >
        <header>
          <h4
            id="upload-summary-title"
            className="text-sm font-medium text-blue-800"
          >
            업로드 상태
          </h4>
          <p className="mt-1 text-xs text-blue-600">{summaryMessage}</p>
        </header>

        <main className="space-y-2">
          <SummaryStats summaryData={summaryData} />
        </main>

        {isDeleteConfirmVisible ? (
          <footer className="p-2 text-xs text-orange-600 border border-orange-200 rounded bg-orange-50">
            ⚠️ 삭제 확인이 필요합니다
          </footer>
        ) : null}
      </div>
    );
  }
);

SummaryContent.displayName = 'SummaryContent';

function UploadSummary(): React.ReactNode {
  const { uploadedImages, deleteConfirmState, mainImageHandlers } =
    useImageUploadContext();

  const summaryData = useMemo(() => {
    const { isVisible: isDeleteConfirmVisible = false } = deleteConfirmState;
    const hasMainImageHandlers = mainImageHandlers !== null;

    const calculatedSummaryData = calculateSummaryData(
      uploadedImages,
      hasMainImageHandlers,
      isDeleteConfirmVisible
    );

    logger.debug('summaryData 계산 완료', {
      uploadedImagesCount: uploadedImages.length,
      hasMainImageHandlers,
      isDeleteConfirmVisible,
      calculatedSummaryData,
    });

    return calculatedSummaryData;
  }, [uploadedImages, deleteConfirmState, mainImageHandlers]);

  logger.debug('UploadSummary 렌더링', {
    summaryData,
    timestamp: new Date().toLocaleTimeString(),
  });

  const { totalImagesCount } = summaryData;
  const shouldShowSummary = totalImagesCount > 0;

  return shouldShowSummary ? (
    <SummaryContent summaryData={summaryData} />
  ) : null;
}

export default memo(UploadSummary);
