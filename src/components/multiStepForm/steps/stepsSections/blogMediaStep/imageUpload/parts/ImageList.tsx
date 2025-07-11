// 📁 imageUpload/parts/ImageList.tsx

import React, { memo, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import ImageCard from './ImageCard';

const logger = createLogger('IMAGE_LIST');

// ✅ Props 인터페이스 완전 제거 (작업지시서 목표 달성)
// ❌ interface ImageListProps - 완전 삭제됨
// ✅ Context Only 패턴으로 완전 전환

function ImageList(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const {
    uploadedImages,
    selectedFileNames,
    touchActiveImages,
    isMobileDevice,
    mainImageHandlers,
  } = useImageUploadContext();

  logger.debug('ImageList 렌더링 - Context Only 패턴', {
    uploadedImagesCount: uploadedImages.length,
    selectedFileNamesCount: selectedFileNames.length,
    touchActiveImagesCount: touchActiveImages.size,
    isMobileDevice,
    hasMainImageHandlers: mainImageHandlers !== null,
  });

  // 🚀 성능 최적화: 스크롤 가이드 표시 여부 메모이제이션
  const scrollGuideConfiguration = useMemo(() => {
    const imageCount = uploadedImages.length;
    const shouldShowScrollGuide = imageCount > 4;

    logger.debug('스크롤 가이드 설정 계산', {
      imageCount,
      shouldShowScrollGuide,
    });

    return {
      shouldShow: shouldShowScrollGuide,
      imageCount,
    };
  }, [uploadedImages.length]);

  // 🚀 성능 최적화: 컨테이너 스타일 메모이제이션
  const containerStyleConfiguration = useMemo(() => {
    const baseClassName = 'flex gap-3 pb-2 overflow-x-auto scroll-hidden';
    const scrollHiddenStyle = {
      scrollbarWidth: 'none' as const,
      msOverflowStyle: 'none' as const,
    };

    return {
      className: baseClassName,
      style: scrollHiddenStyle,
    };
  }, []);

  // 🚀 성능 최적화: 접근성 속성 메모이제이션
  const accessibilityAttributes = useMemo(() => {
    const imageCount = uploadedImages.length;
    const ariaLabel = `업로드된 이미지 목록 (총 ${imageCount}개)`;

    return {
      role: 'list' as const,
      'aria-label': ariaLabel,
      'aria-live': 'polite' as const,
    };
  }, [uploadedImages.length]);

  // 🔧 구조분해할당으로 설정값 접근
  const { shouldShow: shouldShowScrollGuide } = scrollGuideConfiguration;
  const { className: containerClassName, style: containerStyle } =
    containerStyleConfiguration;

  // 🔧 early return으로 빈 상태 처리
  if (uploadedImages.length === 0) {
    logger.debug('표시할 이미지가 없어서 렌더링 안함');
    return null;
  }

  return (
    <div className="relative">
      {/* 스크롤 숨김 스타일 */}
      <style>{`.scroll-hidden::-webkit-scrollbar { display: none; }`}</style>

      <ul
        className={containerClassName}
        style={containerStyle}
        {...accessibilityAttributes}
      >
        {/* ✅ Props 완전 제거: ImageCard가 Context에서 모든 데이터 처리 */}
        <ImageCard />
      </ul>

      {/* 스크롤 가이드 표시 */}
      {shouldShowScrollGuide ? (
        <div className="absolute top-0 right-0 z-10 flex items-center justify-center w-8 h-8 text-gray-400 pointer-events-none">
          <Icon
            icon="lucide:chevron-right"
            className="w-4 h-4"
            aria-hidden="true"
          />
        </div>
      ) : null}
    </div>
  );
}

export default memo(ImageList);
