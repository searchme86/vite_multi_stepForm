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

const UploadProgressSection = memo((): React.ReactNode => {
  const { uploading, hasActiveUploads } = useImageUploadContext();

  logger.debug('UploadProgressSection 렌더링', {
    hasActiveUploads,
    uploadingCount: Object.keys(uploading).length,
  });

  if (!hasActiveUploads) {
    return null;
  }

  const progressEntries = useMemo(() => {
    return Object.entries(uploading).map(
      ([fileIdentifier, progressPercentage]) => {
        const roundedProgressPercentage = Math.round(progressPercentage);

        return {
          progressPercentage,
          roundedProgressPercentage,
          key: `progress-${fileIdentifier}`,
        };
      }
    );
  }, [uploading]);

  return (
    <section
      role="status"
      aria-labelledby="upload-progress-section-title"
      aria-live="polite"
      className="p-4 space-y-3 border border-blue-200 rounded-lg bg-blue-50"
    >
      <header>
        <h3
          id="upload-progress-section-title"
          className="flex items-center gap-2 text-sm font-semibold text-blue-900"
        >
          <div className="w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
          업로드 진행 중...
        </h3>
      </header>

      <main className="space-y-3">
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

const ImageUploadContent = memo((): React.ReactNode => {
  logger.debug('ImageUploadContent 렌더링');

  return (
    <div className="space-y-4">
      <FileDropZone />
      <FileSelectButton />
      <UploadProgressSection />
      <UploadedImageSection />
      <MobileTip />
    </div>
  );
});

ImageUploadContent.displayName = 'ImageUploadContent';

function ImageUploadContainer(): React.ReactNode {
  logger.info('ImageUploadContainer 렌더링 시작 - Props 완전 제거 완성');

  return (
    <ImageUploadProvider>
      <ImageUploadContent />
    </ImageUploadProvider>
  );
}

export default ImageUploadContainer;
