// 📁 imageUpload/parts/UploadedImageSection.tsx

import React, { memo, useMemo } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import ImageList from './ImageList';
import DuplicateMessage from './DuplicateMessage';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import UploadSummary from './UploadSummary';

const logger = createLogger('UPLOADED_IMAGE_SECTION');

function UploadedImageSection(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const {
    uploadedImages,
    selectedFileNames,
    deleteConfirmState,
    mainImageHandlers,
  } = useImageUploadContext();

  logger.debug('UploadedImageSection 렌더링', {
    uploadedImagesCount: uploadedImages.length,
    selectedFileNamesCount: selectedFileNames.length,
    deleteConfirmVisible: deleteConfirmState.isVisible,
    hasMainImageHandlers: mainImageHandlers !== null,
  });

  // 🚀 성능 최적화: 업로드된 이미지 존재 여부 메모이제이션
  const hasUploadedImages = useMemo(() => {
    const imageCount = uploadedImages.length;
    const hasImages = imageCount > 0;

    logger.debug('업로드된 이미지 존재 여부 계산', {
      imageCount,
      hasImages,
    });

    return hasImages;
  }, [uploadedImages.length]);

  // 🔧 early return으로 중첩 방지
  if (!hasUploadedImages) {
    logger.debug('업로드된 이미지가 없어서 렌더링 안함');
    return null;
  }

  // 🚀 성능 최적화: 푸터 높이 계산 메모이제이션
  const footerConfiguration = useMemo(() => {
    const { isVisible: isDeleteConfirmVisible } = deleteConfirmState;
    const minimumHeight = isDeleteConfirmVisible ? '120px' : '60px';

    logger.debug('푸터 구성 계산', {
      isDeleteConfirmVisible,
      minimumHeight,
    });

    return {
      minimumHeight,
      hasDeleteConfirm: isDeleteConfirmVisible,
    };
  }, [deleteConfirmState.isVisible]);

  // 🚀 성능 최적화: 메인 이미지 기능 상태 메모이제이션
  const mainImageFeatureInfo = useMemo(() => {
    const isMainImageFeatureAvailable = mainImageHandlers !== null;

    logger.debug('메인 이미지 기능 상태 계산', {
      isMainImageFeatureAvailable,
    });

    return {
      isAvailable: isMainImageFeatureAvailable,
      statusLabel: isMainImageFeatureAvailable ? '메인 이미지 설정 가능' : '',
    };
  }, [mainImageHandlers]);

  // 🔧 구조분해할당으로 설정값 접근
  const { minimumHeight: footerMinHeight } = footerConfiguration;
  const {
    isAvailable: isMainImageFeatureAvailable,
    statusLabel: mainImageStatusLabel,
  } = mainImageFeatureInfo;

  return (
    <section
      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
      role="region"
      aria-labelledby="uploaded-images-heading"
    >
      <header className="flex items-center justify-between mb-4">
        <h3
          id="uploaded-images-heading"
          className="text-lg font-semibold text-gray-800"
        >
          업로드된 이미지들 ({uploadedImages.length}개)
          {isMainImageFeatureAvailable ? (
            <span className="px-2 py-1 ml-2 text-xs text-blue-700 bg-blue-100 rounded-full">
              {mainImageStatusLabel}
            </span>
          ) : null}
        </h3>
        {/* ✅ Props 없이 Component 사용 */}
        <DuplicateMessage />
      </header>

      <main>
        {/* ✅ Props 없이 Component 사용 */}
        <ImageList />
      </main>

      <footer
        className="relative p-3 mt-4 overflow-hidden border border-blue-200 rounded-lg bg-blue-50"
        style={{ minHeight: footerMinHeight }}
      >
        {/* ✅ Props 없이 Component 사용 */}
        <UploadSummary />
        <DeleteConfirmDialog />
      </footer>
    </section>
  );
}

export default memo(UploadedImageSection);
