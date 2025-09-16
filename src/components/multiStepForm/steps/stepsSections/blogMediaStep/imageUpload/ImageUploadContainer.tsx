// 📁 imageUpload/ImageUploadContainer.tsx

import React, { memo, useMemo } from 'react';
import { Progress } from '@heroui/react';
import {
  ImageUploadProvider,
  useImageUploadContext,
} from './context/ImageUploadContext';
import { createLogger } from './utils/loggerUtils';
import FileDropZone from './parts/FileDropZone';
import FileSelectButton from './parts/FileSelectButton';
import UploadedImageSection from './parts/UploadedImageSection';
import MobileTip from './parts/MobileTip';

const logger = createLogger('IMAGE_UPLOAD_CONTAINER');

// 🚀 성능 최적화: 업로드 진행률 컴포넌트 (React Hooks Rules 준수)
const UploadProgressSection = memo((): React.ReactNode => {
  const { uploading, hasActiveUploads } = useImageUploadContext();

  // 🚀 성능 최적화: 모든 hooks를 early return 전에 호출 (React Hooks Rules 준수)
  const progressEntries = useMemo(() => {
    const uploadingEntries = Object.entries(uploading);

    return uploadingEntries.map(([fileIdentifier, progressPercentage]) => {
      const roundedProgressPercentage = Math.round(progressPercentage);

      return {
        fileIdentifier,
        progressPercentage,
        roundedProgressPercentage,
        key: `progress-${fileIdentifier}`,
      };
    });
  }, [uploading]);

  const sectionConfiguration = useMemo(() => {
    const baseClassName =
      'p-4 space-y-3 border border-blue-200 rounded-lg bg-blue-50';
    const headerClassName =
      'flex items-center gap-2 text-sm font-semibold text-blue-900';
    const spinnerClassName =
      'w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin';
    const mainClassName = 'space-y-3';

    return {
      baseClassName,
      headerClassName,
      spinnerClassName,
      mainClassName,
    };
  }, []);

  const accessibilityAttributes = useMemo(() => {
    const uploadingCount = Object.keys(uploading).length;
    const ariaLabel = `파일 업로드 진행 상황 (${uploadingCount}개 업로드 중)`;

    return {
      role: 'status' as const,
      'aria-labelledby': 'upload-progress-section-title',
      'aria-live': 'polite' as const,
      'aria-label': ariaLabel,
    };
  }, [uploading]);

  logger.debug('UploadProgressSection 렌더링 - React Hooks Rules 준수', {
    hasActiveUploads,
    uploadingCount: Object.keys(uploading).length,
    progressEntriesCount: progressEntries.length,
  });

  // 🔧 React Hooks Rules 준수: 모든 hooks 호출 후 early return
  if (!hasActiveUploads) {
    logger.debug('활성 업로드가 없어서 렌더링 안함');
    return null;
  }

  const { baseClassName, headerClassName, spinnerClassName, mainClassName } =
    sectionConfiguration;

  const {
    role,
    'aria-labelledby': ariaLabelledBy,
    'aria-live': ariaLive,
    'aria-label': ariaLabel,
  } = accessibilityAttributes;

  return (
    <section
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-live={ariaLive}
      aria-label={ariaLabel}
      className={baseClassName}
    >
      <header>
        <h3 id="upload-progress-section-title" className={headerClassName}>
          <div className={spinnerClassName} />
          업로드 진행 중...
        </h3>
      </header>

      <main className={mainClassName}>
        {progressEntries.map(
          ({ progressPercentage, roundedProgressPercentage, key }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-blue-800">
                  파일 업로드 중
                </span>
                <span className="font-bold text-blue-600">
                  {roundedProgressPercentage}%
                </span>
              </div>
              <Progress
                value={progressPercentage}
                color="primary"
                size="sm"
                aria-label={`파일 업로드 진행률 ${roundedProgressPercentage}%`}
                classNames={{
                  base: 'w-full',
                  track: 'bg-blue-200',
                  indicator:
                    'transition-all duration-500 ease-out bg-gradient-to-r from-blue-500 to-blue-600',
                }}
              />
            </div>
          )
        )}
      </main>
    </section>
  );
});

UploadProgressSection.displayName = 'UploadProgressSection';

// 🚀 성능 최적화: 메인 콘텐츠 컴포넌트 (React Hooks Rules 준수)
const ImageUploadContent = memo((): React.ReactNode => {
  // ✅ Context에서 fileSelectButtonRef 가져오기
  const { fileSelectButtonRef } = useImageUploadContext();

  const contentConfiguration = useMemo(() => {
    const baseClassName = 'space-y-4';
    const regionRole = 'region' as const;
    const headingId = 'image-upload-main-section-title';
    const descriptionId = 'image-upload-main-section-description';

    return {
      baseClassName,
      regionRole,
      headingId,
      descriptionId,
    };
  }, []);

  const accessibilityContent = useMemo(() => {
    const mainTitle = '이미지 업로드 및 관리 섹션';
    const mainDescription = `드래그 앤 드롭 또는 파일 선택 버튼을 통해 이미지를 업로드하고 관리할 수 있습니다.
      업로드된 이미지는 메인 이미지로 설정할 수 있습니다.`;

    return {
      mainTitle,
      mainDescription,
    };
  }, []);

  logger.debug('ImageUploadContent 렌더링 - React Hooks Rules 준수');

  const { baseClassName, regionRole, headingId, descriptionId } =
    contentConfiguration;

  const { mainTitle, mainDescription } = accessibilityContent;

  return (
    <section
      className={baseClassName}
      role={regionRole}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <header className="sr-only">
        <h2 id={headingId}>{mainTitle}</h2>
        <p id={descriptionId}>{mainDescription}</p>
      </header>

      <main className="space-y-4">
        {/* ✅ 기존 FileSelectButton을 Context를 통해 제대로 사용 */}
        <FileDropZone />
        <FileSelectButton />
        <UploadProgressSection />
        <UploadedImageSection />
        <MobileTip />
      </main>
    </section>
  );
});

ImageUploadContent.displayName = 'ImageUploadContent';

function ImageUploadContainer(): React.ReactNode {
  logger.info('ImageUploadContainer 렌더링 시작 - React Hooks Rules 완전 준수');

  return (
    <ImageUploadProvider>
      <ImageUploadContent />
    </ImageUploadProvider>
  );
}

export default ImageUploadContainer;
