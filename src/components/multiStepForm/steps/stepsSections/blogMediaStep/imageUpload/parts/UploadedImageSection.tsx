// 📁 imageUpload/parts/UploadedImageSection.tsx

import React, { memo, useMemo } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import ImageList from './ImageList';
import DuplicateMessage from './DuplicateMessage';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import UploadSummary from './UploadSummary';

const logger = createLogger('UPLOADED_IMAGE_SECTION');

interface SectionMetrics {
  readonly totalImages: number;
  readonly processingImages: number;
  readonly completedImages: number;
  readonly hasMainImage: boolean;
  readonly isAllCompleted: boolean;
}

interface AccessibilityConfig {
  readonly role: 'region';
  readonly headingId: string;
  readonly regionLabel: string;
  readonly liveRegion: 'polite';
}

interface StyleConfiguration {
  readonly sectionClassName: string;
  readonly headerClassName: string;
  readonly headingClassName: string;
  readonly statusBadgeClassName: string;
  readonly footerClassName: string;
  readonly footerMinHeight: string;
}

const calculateSectionMetrics = (
  uploadedImages: readonly string[],
  uploading: Record<string, number>,
  uploadStatus: Record<string, 'uploading' | 'success' | 'error'>,
  mainImageHandlers: { checkIsMainImage: (url: string) => boolean } | null
): SectionMetrics => {
  const totalImages = uploadedImages.length;

  const processingImageCount = Object.keys(uploading).length;
  const statusValues = Object.values(uploadStatus);
  const completedImageCount = statusValues.filter(
    (status) => status === 'success' || status === 'error'
  ).length;

  const hasMainImageSet =
    mainImageHandlers !== null &&
    uploadedImages.some((url) => mainImageHandlers.checkIsMainImage(url));

  const isAllProcessingCompleted =
    processingImageCount === 0 && completedImageCount === totalImages;

  return {
    totalImages,
    processingImages: processingImageCount,
    completedImages: completedImageCount,
    hasMainImage: hasMainImageSet,
    isAllCompleted: isAllProcessingCompleted,
  };
};

const createAccessibilityConfig = (
  totalImages: number
): AccessibilityConfig => {
  const headingId = 'uploaded-images-section-heading';
  const regionLabel = `업로드된 이미지 관리 섹션 (총 ${totalImages}개 이미지)`;

  return {
    role: 'region',
    headingId,
    regionLabel,
    liveRegion: 'polite',
  };
};

const createStyleConfiguration = (
  hasDeleteConfirm: boolean
): StyleConfiguration => {
  const sectionClassName = 'p-4 border border-gray-200 rounded-lg bg-gray-50';
  const headerClassName = 'flex items-center justify-between mb-4';
  const headingClassName = 'text-lg font-semibold text-gray-800';
  const statusBadgeClassName =
    'px-2 py-1 ml-2 text-xs text-blue-700 bg-blue-100 rounded-full';
  const footerClassName =
    'relative p-3 mt-4 overflow-hidden border border-blue-200 rounded-lg bg-blue-50';
  const footerMinHeight = hasDeleteConfirm ? '120px' : '60px';

  return {
    sectionClassName,
    headerClassName,
    headingClassName,
    statusBadgeClassName,
    footerClassName,
    footerMinHeight,
  };
};

const extractDeleteConfirmState = (
  deleteConfirmState: unknown
): { isOpen: boolean } => {
  if (!deleteConfirmState || typeof deleteConfirmState !== 'object') {
    return { isOpen: false };
  }

  const isVisible = Reflect.get(deleteConfirmState, 'isVisible');
  const isOpen = Reflect.get(deleteConfirmState, 'isOpen');

  return {
    isOpen:
      typeof isOpen === 'boolean'
        ? isOpen
        : typeof isVisible === 'boolean'
        ? isVisible
        : false,
  };
};

function UploadedImageSection(): React.ReactNode {
  const {
    uploadedImages,
    selectedFileNames,
    uploading,
    uploadStatus,
    deleteConfirmState,
    mainImageHandlers,
  } = useImageUploadContext();

  console.log('🖼️ [UPLOADED_IMAGE_SECTION] Map 기반 섹션 렌더링:', {
    uploadedImagesCount: uploadedImages.length,
    selectedFileNamesCount: selectedFileNames.length,
    uploadingCount: Object.keys(uploading).length,
    uploadStatusCount: Object.keys(uploadStatus).length,
  });

  const sectionMetrics = useMemo((): SectionMetrics => {
    return calculateSectionMetrics(
      uploadedImages,
      uploading,
      uploadStatus,
      mainImageHandlers
    );
  }, [uploadedImages, uploading, uploadStatus, mainImageHandlers]);

  const deleteConfirmInfo = useMemo(() => {
    return extractDeleteConfirmState(deleteConfirmState);
  }, [deleteConfirmState]);

  const accessibilityConfig = useMemo((): AccessibilityConfig => {
    return createAccessibilityConfig(sectionMetrics.totalImages);
  }, [sectionMetrics.totalImages]);

  const styleConfig = useMemo((): StyleConfiguration => {
    return createStyleConfiguration(deleteConfirmInfo.isOpen);
  }, [deleteConfirmInfo.isOpen]);

  const statusBadgeText = useMemo((): string => {
    const {
      totalImages,
      processingImages,
      completedImages,
      hasMainImage,
      isAllCompleted,
    } = sectionMetrics;

    if (processingImages > 0) {
      return `처리 중 ${processingImages}개`;
    }

    if (hasMainImage && isAllCompleted) {
      return '메인 이미지 설정됨';
    }

    if (isAllCompleted) {
      return '업로드 완료';
    }

    return `${completedImages}/${totalImages} 완료`;
  }, [sectionMetrics]);

  const shouldShowMainImageFeature = useMemo((): boolean => {
    return mainImageHandlers !== null && sectionMetrics.totalImages > 0;
  }, [mainImageHandlers, sectionMetrics.totalImages]);

  if (sectionMetrics.totalImages === 0) {
    console.log(
      '📭 [UPLOADED_IMAGE_SECTION] 업로드된 이미지가 없어서 렌더링 생략'
    );
    return null;
  }

  logger.debug('UploadedImageSection Map 기반 렌더링', {
    totalImages: sectionMetrics.totalImages,
    processingImages: sectionMetrics.processingImages,
    completedImages: sectionMetrics.completedImages,
    hasMainImage: sectionMetrics.hasMainImage,
    statusBadgeText,
    shouldShowMainImageFeature,
  });

  return (
    <section
      className={styleConfig.sectionClassName}
      role={accessibilityConfig.role}
      aria-labelledby={accessibilityConfig.headingId}
      aria-live={accessibilityConfig.liveRegion}
      aria-label={accessibilityConfig.regionLabel}
    >
      <header className={styleConfig.headerClassName}>
        <div className="flex items-center">
          <h3
            id={accessibilityConfig.headingId}
            className={styleConfig.headingClassName}
          >
            업로드된 이미지들 ({sectionMetrics.totalImages}개)
          </h3>
          {shouldShowMainImageFeature && (
            <span className={styleConfig.statusBadgeClassName}>
              {statusBadgeText}
            </span>
          )}
        </div>
        <DuplicateMessage />
      </header>

      <main aria-label="이미지 목록 영역">
        <ImageList />
      </main>

      <footer
        className={styleConfig.footerClassName}
        style={{ minHeight: styleConfig.footerMinHeight }}
        aria-label="업로드 요약 및 작업 영역"
      >
        <UploadSummary />
        <DeleteConfirmDialog />
      </footer>
    </section>
  );
}

export default memo(UploadedImageSection);
