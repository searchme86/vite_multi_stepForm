// 📁 imageUpload/parts/UploadSummary.tsx

import React, { memo, useMemo, useCallback } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('UPLOAD_SUMMARY');

interface SummaryData {
  totalImagesCount: number;
  selectedImagesCount: number;
  hasMainImageHandlers: boolean;
  isDeleteConfirmVisible: boolean;
  selectionPercentage: number;
}

const calculateSummaryData = (
  uploadedImages: string[],
  selectedFileNames: string[],
  hasMainImageHandlers: boolean,
  isDeleteConfirmVisible: boolean
): SummaryData => {
  const totalImagesCount = uploadedImages.length;
  const selectedImagesCount = selectedFileNames.length;
  const selectionPercentage =
    totalImagesCount > 0
      ? Math.round((selectedImagesCount / totalImagesCount) * 100)
      : 0;

  return {
    totalImagesCount,
    selectedImagesCount,
    hasMainImageHandlers,
    isDeleteConfirmVisible,
    selectionPercentage,
  };
};

const formatSummaryMessage = (summaryData: SummaryData): string => {
  const { totalImagesCount, selectedImagesCount, hasMainImageHandlers } =
    summaryData;

  // 🔧 early return으로 중첩 방지
  if (totalImagesCount === 0) {
    return '이미지를 업로드해주세요';
  }

  if (selectedImagesCount === 0) {
    const mainImageText = hasMainImageHandlers
      ? ' (메인 이미지 설정 가능)'
      : '';
    return `총 ${totalImagesCount}개의 이미지가 업로드되었습니다${mainImageText}`;
  }

  if (selectedImagesCount === totalImagesCount) {
    return `모든 이미지가 선택되었습니다 (${totalImagesCount}개)`;
  }

  return `${totalImagesCount}개 중 ${selectedImagesCount}개가 선택되었습니다`;
};

const SummaryProgressBar = memo(
  ({ percentage }: { percentage: number }): React.ReactNode => {
    const progressBarStyle = useMemo(
      () => ({ width: `${percentage}%` }),
      [percentage]
    );

    logger.debug('SummaryProgressBar 렌더링', { percentage });

    return (
      <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
        <div
          className="h-2 transition-all duration-500 ease-out bg-blue-600 rounded-full"
          style={progressBarStyle}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`선택 진행률 ${percentage}%`}
        />
      </div>
    );
  }
);

SummaryProgressBar.displayName = 'SummaryProgressBar';

const SummaryStats = memo(
  ({ summaryData }: { summaryData: SummaryData }): React.ReactNode => {
    const {
      totalImagesCount,
      selectedImagesCount,
      selectionPercentage,
      hasMainImageHandlers,
    } = summaryData;

    logger.debug('SummaryStats 렌더링', {
      totalImagesCount,
      selectedImagesCount,
      selectionPercentage,
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

          {selectedImagesCount > 0 ? (
            <span className="text-blue-700">선택: {selectedImagesCount}개</span>
          ) : null}

          {hasMainImageHandlers ? (
            <span className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full">
              메인 이미지 설정 가능
            </span>
          ) : null}
        </div>

        {selectedImagesCount > 0 ? (
          <span className="text-xs font-semibold text-blue-600">
            {selectionPercentage}%
          </span>
        ) : null}
      </div>
    );
  }
);

SummaryStats.displayName = 'SummaryStats';

const SummaryContent = memo(
  ({ summaryData }: { summaryData: SummaryData }): React.ReactNode => {
    const { isDeleteConfirmVisible, selectionPercentage } = summaryData;

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
            업로드 요약
          </h4>
          <p className="mt-1 text-xs text-blue-600">{summaryMessage}</p>
        </header>

        <main className="space-y-2">
          <SummaryStats summaryData={summaryData} />

          {selectionPercentage > 0 ? (
            <SummaryProgressBar percentage={selectionPercentage} />
          ) : null}
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
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const {
    uploadedImages,
    selectedFileNames,
    deleteConfirmState,
    mainImageHandlers,
  } = useImageUploadContext();

  const summaryData = useMemo(() => {
    const { isVisible: isDeleteConfirmVisible = false } = deleteConfirmState;
    const hasMainImageHandlers = mainImageHandlers !== null;

    const calculatedSummaryData = calculateSummaryData(
      uploadedImages,
      selectedFileNames,
      hasMainImageHandlers,
      isDeleteConfirmVisible
    );

    logger.debug('summaryData 계산 완료', {
      uploadedImagesCount: uploadedImages.length,
      selectedFileNamesCount: selectedFileNames.length,
      hasMainImageHandlers,
      isDeleteConfirmVisible,
      calculatedSummaryData,
    });

    return calculatedSummaryData;
  }, [
    uploadedImages,
    selectedFileNames,
    deleteConfirmState,
    mainImageHandlers,
  ]);

  logger.debug('UploadSummary 렌더링', {
    summaryData,
    timestamp: new Date().toLocaleTimeString(),
  });

  const { totalImagesCount } = summaryData;
  const shouldShowSummary = totalImagesCount > 0;

  // 🔧 삼항연산자 사용 (&&연산자 대신)
  return shouldShowSummary ? (
    <SummaryContent summaryData={summaryData} />
  ) : null;
}

export default memo(UploadSummary);
