// components/ImageGalleryWithContent/hooks/useZoomFunction.tsx

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ZoomState,
  ZoomConfig,
  DeviceType,
  ImageData,
  PointerPosition,
  ImageBounds,
} from '../types/imageGalleryTypes';
import {
  getRelativePointerPosition,
  calculateZoomMaskPosition,
  calculateZoomBackgroundPosition,
  createDebugInfo,
} from '../utils/imageGalleryUtils';

interface UseZoomFunctionProps {
  currentImage: ImageData | null;
  zoomConfig: ZoomConfig;
  deviceType: DeviceType;
  onZoomStateChange?: (isActive: boolean) => void;
}

interface UseZoomFunctionReturn {
  zoomState: ZoomState;
  imageElementRef: React.RefObject<HTMLImageElement>;
  zoomViewerRef: React.RefObject<HTMLDivElement>;

  // 데스크탑 이벤트 핸들러
  handleDesktopMouseEnter: (event: MouseEvent) => void;
  handleDesktopMouseMove: (event: MouseEvent) => void;
  handleDesktopMouseLeave: () => void;

  // 모바일 이벤트 핸들러
  handleMobileTouchStart: (event: TouchEvent) => void;
  handleMobileTouchMove: (event: TouchEvent) => void;
  handleMobileTouchEnd: () => void;

  // 유틸리티
  getZoomViewerStyle: () => React.CSSProperties;
  getMaskStyle: () => React.CSSProperties;
  isZoomEnabled: boolean;
}

function useZoomFunction({
  currentImage,
  zoomConfig,
  deviceType,
  onZoomStateChange,
}: UseZoomFunctionProps): UseZoomFunctionReturn {
  const imageElementRef = useRef<HTMLImageElement>(null);
  const zoomViewerRef = useRef<HTMLDivElement>(null);

  // 줌 설정 구조분해할당 (fallback 제공)
  const {
    enableZoom = true,
    zoomScale = 5,
    maskSizeRatio = 0.2,
    touchZoomEnabled = true,
  } = zoomConfig;

  // 줌 상태
  const [zoomState, setZoomState] = useState<ZoomState>({
    isActive: false,
    maskPosition: { x: 0, y: 0, clientX: 0, clientY: 0 },
    zoomAreaPosition: { x: 0, y: 0, clientX: 0, clientY: 0 },
    currentScale: zoomScale,
    imageBounds: null,
  });

  // 줌 활성화 여부 계산
  const isZoomEnabled =
    enableZoom &&
    currentImage !== null &&
    (deviceType === 'desktop' ? true : touchZoomEnabled);

  // 이미지 경계 정보 가져오기
  const getImageBounds = useCallback((): ImageBounds | null => {
    const imageElement = imageElementRef.current;

    if (!imageElement) {
      console.warn('이미지 엘리먼트를 찾을 수 없습니다');
      return null;
    }

    const rect = imageElement.getBoundingClientRect();
    const imageBounds: ImageBounds = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    };

    console.log('이미지 경계 정보 계산:', imageBounds);

    return imageBounds;
  }, []);

  // 줌 상태 업데이트
  const updateZoomState = useCallback(
    (
      isActive: boolean,
      pointerPosition?: PointerPosition,
      imageBounds?: ImageBounds | null
    ) => {
      setZoomState((prevState) => {
        const newState: ZoomState = {
          ...prevState,
          isActive,
          imageBounds: imageBounds ?? prevState.imageBounds,
        };

        // 활성 상태이고 포인터 위치가 있을 때만 위치 계산
        if (isActive && pointerPosition && imageBounds) {
          const maskPosition = calculateZoomMaskPosition(
            pointerPosition,
            imageBounds,
            maskSizeRatio
          );

          newState.maskPosition = maskPosition;
          newState.zoomAreaPosition = pointerPosition;
        }

        console.log('줌 상태 업데이트:', {
          이전상태: prevState.isActive,
          새상태: newState.isActive,
          포인터위치: pointerPosition,
          마스크위치: newState.maskPosition,
        });

        return newState;
      });

      // 외부 콜백 호출
      onZoomStateChange?.(isActive);
    },
    [maskSizeRatio, onZoomStateChange]
  );

  // 데스크탑 마우스 진입 핸들러
  const handleDesktopMouseEnter = useCallback(
    (event: MouseEvent) => {
      if (deviceType !== 'desktop' || !isZoomEnabled) {
        return;
      }

      const imageBounds = getImageBounds();
      if (!imageBounds) {
        return;
      }

      const { clientX, clientY } = event;
      const pointerPosition = getRelativePointerPosition(
        clientX,
        clientY,
        imageBounds
      );

      console.log('데스크탑 마우스 진입 - 줌 활성화');
      updateZoomState(true, pointerPosition, imageBounds);
    },
    [deviceType, isZoomEnabled, getImageBounds, updateZoomState]
  );

  // 데스크탑 마우스 이동 핸들러
  const handleDesktopMouseMove = useCallback(
    (event: MouseEvent) => {
      if (
        deviceType !== 'desktop' ||
        !zoomState.isActive ||
        !zoomState.imageBounds
      ) {
        return;
      }

      const { clientX, clientY } = event;
      const { imageBounds } = zoomState;
      const pointerPosition = getRelativePointerPosition(
        clientX,
        clientY,
        imageBounds
      );

      updateZoomState(true, pointerPosition, imageBounds);
    },
    [deviceType, zoomState.isActive, zoomState.imageBounds, updateZoomState]
  );

  // 데스크탑 마우스 이탈 핸들러
  const handleDesktopMouseLeave = useCallback(() => {
    if (deviceType !== 'desktop') {
      return;
    }

    console.log('데스크탑 마우스 이탈 - 줌 비활성화');
    updateZoomState(false);
  }, [deviceType, updateZoomState]);

  // 모바일 터치 시작 핸들러
  const handleMobileTouchStart = useCallback(
    (event: TouchEvent) => {
      if (deviceType === 'desktop' || !isZoomEnabled) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const imageBounds = getImageBounds();
      if (!imageBounds) {
        return;
      }

      const { clientX, clientY } = touch;
      const pointerPosition = getRelativePointerPosition(
        clientX,
        clientY,
        imageBounds
      );

      console.log('모바일 터치 시작 - 줌 활성화');
      updateZoomState(true, pointerPosition, imageBounds);
    },
    [deviceType, isZoomEnabled, getImageBounds, updateZoomState]
  );

  // 모바일 터치 이동 핸들러
  const handleMobileTouchMove = useCallback(
    (event: TouchEvent) => {
      if (
        deviceType === 'desktop' ||
        !zoomState.isActive ||
        !zoomState.imageBounds
      ) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const { clientX, clientY } = touch;
      const { imageBounds } = zoomState;
      const pointerPosition = getRelativePointerPosition(
        clientX,
        clientY,
        imageBounds
      );

      updateZoomState(true, pointerPosition, imageBounds);
    },
    [deviceType, zoomState.isActive, zoomState.imageBounds, updateZoomState]
  );

  // 모바일 터치 종료 핸들러
  const handleMobileTouchEnd = useCallback(() => {
    if (deviceType === 'desktop') {
      return;
    }

    console.log('모바일 터치 종료 - 줌 비활성화');
    updateZoomState(false);
  }, [deviceType, updateZoomState]);

  // 줌 뷰어 스타일 계산
  const getZoomViewerStyle = useCallback((): React.CSSProperties => {
    if (!zoomState.isActive || !currentImage || !zoomState.imageBounds) {
      return { display: 'none' };
    }

    const { imageBounds, maskPosition } = zoomState;
    const { backgroundPositionX, backgroundPositionY } =
      calculateZoomBackgroundPosition(
        maskPosition,
        zoomScale,
        imageBounds.width,
        imageBounds.height
      );

    const zoomViewerStyle: React.CSSProperties = {
      display: 'block',
      backgroundImage: `url(${currentImage.url})`,
      backgroundSize: `${imageBounds.width * zoomScale}px ${
        imageBounds.height * zoomScale
      }px`,
      backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
      backgroundRepeat: 'no-repeat',
    };

    console.log('줌 뷰어 스타일 계산:', {
      backgroundSize: zoomViewerStyle.backgroundSize,
      backgroundPosition: zoomViewerStyle.backgroundPosition,
    });

    return zoomViewerStyle;
  }, [zoomState, currentImage, zoomScale]);

  // 마스크 스타일 계산
  const getMaskStyle = useCallback((): React.CSSProperties => {
    if (!zoomState.isActive || !zoomState.imageBounds) {
      return { display: 'none' };
    }

    const { imageBounds, maskPosition } = zoomState;
    const maskSize = imageBounds.width * maskSizeRatio;

    const maskStyle: React.CSSProperties = {
      display: 'block',
      position: 'absolute',
      width: `${maskSize}px`,
      height: `${maskSize}px`,
      left: `${maskPosition.x}px`,
      top: `${maskPosition.y}px`,
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      pointerEvents: 'none',
      zIndex: 10,
    };

    console.log('마스크 스타일 계산:', {
      width: maskStyle.width,
      height: maskStyle.height,
      left: maskStyle.left,
      top: maskStyle.top,
    });

    return maskStyle;
  }, [zoomState, maskSizeRatio]);

  // 디버그 정보 로깅
  useEffect(() => {
    if (zoomState.isActive) {
      createDebugInfo('useZoomFunction', {
        zoomState,
        deviceType,
        currentImage: currentImage?.id,
        zoomConfig: {
          enableZoom,
          zoomScale,
          maskSizeRatio,
          touchZoomEnabled,
        },
      });
    }
  }, [
    zoomState,
    deviceType,
    currentImage,
    enableZoom,
    zoomScale,
    maskSizeRatio,
    touchZoomEnabled,
  ]);

  return {
    zoomState,
    imageElementRef,
    zoomViewerRef,
    handleDesktopMouseEnter,
    handleDesktopMouseMove,
    handleDesktopMouseLeave,
    handleMobileTouchStart,
    handleMobileTouchMove,
    handleMobileTouchEnd,
    getZoomViewerStyle,
    getMaskStyle,
    isZoomEnabled,
  };
}

export default useZoomFunction;
