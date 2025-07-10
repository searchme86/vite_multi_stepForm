// components/ImageGalleryWithContent/parts/ZoomViewer.tsx

import { useCallback, useEffect } from 'react';
import type { ZoomViewerProps } from '../types/imageGalleryTypes';
import { createDebugInfo } from '../utils/imageGalleryUtils';

function ZoomViewer({
  isActive,
  currentImage,
  zoomState,
  zoomConfig,
  deviceType,
  className = '',
}: ZoomViewerProps) {
  // 설정 구조분해할당 (fallback 제공)
  const { enableZoom = true, zoomScale = 5, maskSizeRatio = 0.2 } = zoomConfig;

  // 현재 이미지 구조분해할당 (fallback 제공)
  const {
    url: currentImageUrl = '',
    alt: currentImageAlt = '',
    title: currentImageTitle = '',
  } = currentImage || {};

  // 줌 상태 구조분해할당 (fallback 제공)
  const {
    maskPosition = { x: 0, y: 0, clientX: 0, clientY: 0 },
    imageBounds = null,
  } = zoomState;

  // Early return - 줌이 비활성화된 경우
  if (!enableZoom || !isActive || !currentImage || !imageBounds) {
    return null;
  }

  // Early return - 이미지 URL이 없는 경우
  if (!currentImageUrl) {
    console.warn('줌 뷰어: 이미지 URL이 없습니다');
    return null;
  }

  // 확대 배경 위치 계산
  const calculateZoomBackgroundPosition = useCallback(() => {
    const backgroundPositionX = -maskPosition.x * zoomScale;
    const backgroundPositionY = -maskPosition.y * zoomScale;

    console.log('줌 배경 위치 계산:', {
      maskPosition,
      zoomScale,
      backgroundPositionX,
      backgroundPositionY,
    });

    return {
      backgroundPositionX,
      backgroundPositionY,
    };
  }, [maskPosition, zoomScale]);

  // 줌 뷰어 스타일 생성
  const generateZoomViewerStyle = useCallback((): React.CSSProperties => {
    const { backgroundPositionX, backgroundPositionY } =
      calculateZoomBackgroundPosition();

    const zoomViewerStyle: React.CSSProperties = {
      backgroundImage: `url(${currentImageUrl})`,
      backgroundSize: `${imageBounds.width * zoomScale}px ${
        imageBounds.height * zoomScale
      }px`,
      backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#f8f9fa',
    };

    console.log('줌 뷰어 스타일 생성:', zoomViewerStyle);

    return zoomViewerStyle;
  }, [
    calculateZoomBackgroundPosition,
    currentImageUrl,
    imageBounds,
    zoomScale,
  ]);

  // 마스크 스타일 생성 (모바일용)
  const generateMaskStyle = useCallback((): React.CSSProperties => {
    const maskSize = imageBounds.width * maskSizeRatio;

    const maskStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${maskSize}px`,
      height: `${maskSize}px`,
      left: `${maskPosition.x}px`,
      top: `${maskPosition.y}px`,
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
      border: '2px solid rgba(255, 255, 255, 0.8)',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 20,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    };

    console.log('마스크 스타일 생성:', maskStyle);

    return maskStyle;
  }, [imageBounds, maskSizeRatio, maskPosition]);

  // 데스크탑 줌 뷰어 렌더링
  const renderDesktopZoomViewer = useCallback(() => {
    const containerClass = `
      absolute inset-0 w-full h-full
      bg-white border border-gray-200 rounded-lg overflow-hidden
      shadow-lg z-30
      ${className}
    `.trim();

    const zoomViewerStyle = generateZoomViewerStyle();

    return (
      <div
        className={containerClass}
        style={zoomViewerStyle}
        role="img"
        aria-label={`확대된 이미지: ${currentImageAlt}`}
        aria-describedby="zoom-viewer-description"
        data-zoom-scale={zoomScale}
        data-device-type={deviceType}
      >
        {/* 줌 정보 오버레이 */}
        <div className="absolute px-2 py-1 text-xs text-white bg-black rounded top-2 left-2 bg-opacity-70">
          {zoomScale}x 확대
        </div>

        {/* 접근성을 위한 숨겨진 설명 */}
        <span id="zoom-viewer-description" className="sr-only">
          {currentImageTitle ? `${currentImageTitle} - ` : ''}
          마우스를 움직여서 이미지의 다른 부분을 확대해서 볼 수 있습니다
        </span>
      </div>
    );
  }, [
    className,
    generateZoomViewerStyle,
    currentImageAlt,
    currentImageTitle,
    zoomScale,
    deviceType,
  ]);

  // 모바일 줌 뷰어 렌더링
  const renderMobileZoomViewer = useCallback(() => {
    const overlayClass = `
      absolute inset-0 w-full h-full
      flex items-center justify-center
      bg-black bg-opacity-50 z-30
      ${className}
    `.trim();

    const zoomContainerClass = `
      relative w-4/5 h-4/5 max-w-sm max-h-96
      bg-white border border-gray-200 rounded-lg overflow-hidden
      shadow-xl
    `.trim();

    const zoomViewerStyle = generateZoomViewerStyle();
    const maskStyle = generateMaskStyle();

    return (
      <div
        className={overlayClass}
        role="dialog"
        aria-label="확대된 이미지 뷰어"
        aria-modal="true"
        data-zoom-scale={zoomScale}
        data-device-type={deviceType}
      >
        <div className={zoomContainerClass}>
          {/* 줌 이미지 영역 */}
          <div
            className="w-full h-full"
            style={zoomViewerStyle}
            role="img"
            aria-label={`확대된 이미지: ${currentImageAlt}`}
          />

          {/* 줌 정보 헤더 */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 text-white bg-black bg-opacity-80">
            <span className="text-sm font-medium">
              {currentImageTitle || '이미지 확대'}
            </span>
            <span className="px-2 py-1 text-xs bg-white rounded bg-opacity-20">
              {zoomScale}x
            </span>
          </div>

          {/* 터치 가이드 */}
          <div className="absolute bottom-0 left-0 right-0 p-2 text-white bg-black bg-opacity-80">
            <p className="text-xs text-center">
              터치를 유지하며 이동하여 다른 부분을 확대해보세요
            </p>
          </div>
        </div>

        {/* 원본 이미지 위의 마스크 표시 (참고용) */}
        <div style={maskStyle} aria-hidden="true" />
      </div>
    );
  }, [
    className,
    generateZoomViewerStyle,
    generateMaskStyle,
    currentImageAlt,
    currentImageTitle,
    zoomScale,
    deviceType,
  ]);

  // 디버그 정보 로깅
  useEffect(() => {
    createDebugInfo('ZoomViewer', {
      isActive,
      deviceType,
      currentImageId: currentImage?.id,
      zoomScale,
      maskPosition,
      imageBounds: {
        width: imageBounds.width,
        height: imageBounds.height,
      },
    });
  }, [
    isActive,
    deviceType,
    currentImage,
    zoomScale,
    maskPosition,
    imageBounds,
  ]);

  // 디바이스 타입에 따른 렌더링 분기
  return deviceType === 'desktop'
    ? renderDesktopZoomViewer()
    : renderMobileZoomViewer();
}

export default ZoomViewer;
