// components/ImageGalleryWithContent/container/ImageGalleryContainer.tsx

import { useState, useCallback, useEffect } from 'react';
import type {
  ImageGalleryWithContentProps,
  GalleryState,
  ZoomState,
} from './types/imageGalleryTypes';
import {
  defaultGalleryConfig,
  defaultZoomConfig,
  mockCoffeeImages,
  mockContentData,
  normalizeImageIndex,
  createDebugInfo,
} from './utils/imageGalleryUtils';
import useResponsiveLayout from './hooks/useResponsiveLayout';
import MainSlider from './parts/MainSlider';
import ContentArea from './parts/ContentArea';

function ImageGalleryContainer({
  images = mockCoffeeImages,
  rightContent = mockContentData,
  galleryConfig = {},
  zoomConfig = {},
  responsiveConfig,
  className = '',
  onImageChange,
  onZoomStateChange,
}: ImageGalleryWithContentProps) {
  // 설정 병합
  const finalGalleryConfig = { ...defaultGalleryConfig, ...galleryConfig };
  const finalZoomConfig = { ...defaultZoomConfig, ...zoomConfig };

  // 반응형 레이아웃 훅
  const {
    deviceType,
    isMobile,
    isDesktop,
    windowWidth,
    windowHeight,
    getLayoutClasses,
    isLoading: isLayoutLoading,
  } = useResponsiveLayout(responsiveConfig);

  // 갤러리 상태
  const [galleryState, setGalleryState] = useState<GalleryState>({
    currentImageIndex: finalGalleryConfig.initialSlide ?? 0,
    isLoading: true,
    hasError: false,
    errorMessage: '',
    totalImages: images.length,
    isInitialized: false,
  });

  // 줌 상태
  const [zoomState, setZoomState] = useState<ZoomState>({
    isActive: false,
    maskPosition: { x: 0, y: 0, clientX: 0, clientY: 0 },
    zoomAreaPosition: { x: 0, y: 0, clientX: 0, clientY: 0 },
    currentScale: finalZoomConfig.zoomScale ?? 5,
    imageBounds: null,
  });

  // 레이아웃 클래스 가져오기
  const { containerClass, leftSectionClass, rightSectionClass } =
    getLayoutClasses();

  // 이미지 변경 핸들러
  const handleImageChange = useCallback(
    (newIndex: number) => {
      const normalizedIndex = normalizeImageIndex(newIndex, images.length);

      setGalleryState((prev) => ({
        ...prev,
        currentImageIndex: normalizedIndex,
      }));

      const newImageData = images[normalizedIndex];

      console.log('이미지 변경:', {
        이전인덱스: galleryState.currentImageIndex,
        새인덱스: normalizedIndex,
        새이미지: newImageData,
      });

      // 외부 콜백 호출
      onImageChange?.(normalizedIndex, newImageData);
    },
    [images, galleryState.currentImageIndex, onImageChange]
  );

  // 줌 상태 변경 핸들러
  const handleZoomStateChange = useCallback(
    (isZooming: boolean) => {
      setZoomState((prev) => ({
        ...prev,
        isActive: isZooming,
      }));

      console.log('줌 상태 변경:', { isZooming, deviceType });

      // 외부 콜백 호출
      onZoomStateChange?.(isZooming);
    },
    [deviceType, onZoomStateChange]
  );

  // 마우스 호버 핸들러 (데스크탑 전용)
  const handleMouseEnterImage = useCallback(
    (_event: MouseEvent) => {
      if (!isDesktop || !finalZoomConfig.enableZoom) {
        return;
      }

      console.log('이미지 마우스 진입 (데스크탑)');
      handleZoomStateChange(true);
    },
    [isDesktop, finalZoomConfig.enableZoom, handleZoomStateChange]
  );

  const handleMouseLeaveImage = useCallback(() => {
    if (!isDesktop) {
      return;
    }

    console.log('이미지 마우스 이탈 (데스크탑)');
    handleZoomStateChange(false);
  }, [isDesktop, handleZoomStateChange]);

  // 터치 상호작용 핸들러 (모바일 전용)
  const handleTouchInteraction = useCallback(
    (event: TouchEvent, type: 'start' | 'move' | 'end') => {
      if (!isMobile || !finalZoomConfig.touchZoomEnabled) {
        return;
      }

      console.log('터치 상호작용 (모바일):', {
        type,
        touches: event.touches.length,
      });

      switch (type) {
        case 'start':
          handleZoomStateChange(true);
          break;
        case 'end':
          handleZoomStateChange(false);
          break;
        case 'move':
          // 터치 이동 처리는 ZoomViewer에서 담당
          break;
      }
    },
    [isMobile, finalZoomConfig.touchZoomEnabled, handleZoomStateChange]
  );

  // 컴포넌트 초기화
  useEffect(() => {
    console.log('ImageGalleryContainer 초기화');

    if (images.length > 0) {
      setGalleryState((prev) => ({
        ...prev,
        isLoading: false,
        hasError: false,
        totalImages: images.length,
        isInitialized: true,
      }));
    } else {
      setGalleryState((prev) => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage: '이미지 데이터가 없습니다',
        totalImages: 0,
        isInitialized: true,
      }));
    }
  }, [images]);

  // 디버그 정보 로깅
  useEffect(() => {
    if (galleryState.isInitialized && !isLayoutLoading) {
      createDebugInfo('ImageGalleryContainer', {
        galleryState,
        zoomState,
        deviceType,
        windowWidth,
        windowHeight,
        finalGalleryConfig,
        finalZoomConfig,
        imagesLength: images.length,
      });
    }
  }, [
    galleryState,
    zoomState,
    deviceType,
    windowWidth,
    windowHeight,
    isLayoutLoading,
    finalGalleryConfig,
    finalZoomConfig,
    images.length,
  ]);

  // 로딩 상태 처리
  if (isLayoutLoading || galleryState.isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">갤러리를 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (galleryState.hasError) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white">
        <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-red-50">
          <div className="text-xl text-red-500">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700">오류 발생</h3>
          <p className="text-center text-red-600">
            {galleryState.errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`${containerClass} ${className}`}
      role="main"
      aria-label="이미지 갤러리"
      data-device-type={deviceType}
      data-total-images={galleryState.totalImages}
      data-current-index={galleryState.currentImageIndex}
    >
      {/* 좌측 갤러리 섹션 */}
      <section className={leftSectionClass} aria-label="이미지 갤러리">
        <MainSlider
          images={images}
          currentImageIndex={galleryState.currentImageIndex}
          galleryConfig={finalGalleryConfig}
          onImageChange={handleImageChange}
          onImageHover={handleMouseEnterImage}
          onImageLeave={handleMouseLeaveImage}
          onTouchInteraction={handleTouchInteraction}
          className="w-full h-full"
        />
      </section>

      {/* 우측 컨텐츠 섹션 */}
      <section className={rightSectionClass} aria-label="제품 정보">
        <ContentArea
          contentData={rightContent}
          isZoomActive={zoomState.isActive}
          deviceType={deviceType}
          className="w-full h-full"
        />
      </section>
    </main>
  );
}

export default ImageGalleryContainer;
