// components/ImageGalleryWithContent/hooks/useResponsiveLayout.tsx

import { useState, useEffect, useCallback } from 'react';
import {
  type DeviceType,
  type ResponsiveConfig,
} from '../types/imageGalleryTypes';
import {
  detectDeviceType,
  defaultBreakpoints,
  createDebugInfo,
} from '../utils/imageGalleryUtils';

interface UseResponsiveLayoutState {
  deviceType: DeviceType;
  windowWidth: number;
  windowHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLoading: boolean;
}

interface UseResponsiveLayoutReturn extends UseResponsiveLayoutState {
  updateDimensions: () => void;
  getLayoutClasses: () => {
    containerClass: string;
    leftSectionClass: string;
    rightSectionClass: string;
  };
}

function useResponsiveLayout(
  customBreakpoints?: ResponsiveConfig
): UseResponsiveLayoutReturn {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };

  const [responsiveState, setResponsiveState] =
    useState<UseResponsiveLayoutState>({
      deviceType: 'desktop',
      windowWidth: 0,
      windowHeight: 0,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLoading: true,
    });

  // 윈도우 크기 업데이트 함수
  const updateDimensions = useCallback(() => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const newDeviceType = detectDeviceType(newWidth);

    const newState: UseResponsiveLayoutState = {
      deviceType: newDeviceType,
      windowWidth: newWidth,
      windowHeight: newHeight,
      isMobile: newDeviceType === 'mobile',
      isTablet: newDeviceType === 'tablet',
      isDesktop: newDeviceType === 'desktop',
      isLoading: false,
    };

    console.log('반응형 레이아웃 업데이트:', {
      이전상태: responsiveState,
      새상태: newState,
      브레이크포인트: breakpoints,
    });

    setResponsiveState(newState);
  }, [responsiveState, breakpoints]);

  // 레이아웃 클래스 생성 함수
  const getLayoutClasses = useCallback(() => {
    const { deviceType } = responsiveState;

    const layoutClasses = {
      // 컨테이너 클래스 (모바일: 세로, 데스크탑: 가로)
      containerClass:
        deviceType === 'mobile'
          ? 'flex flex-col w-full h-auto min-h-screen bg-white'
          : 'flex flex-row w-full h-screen bg-white',

      // 좌측 섹션 클래스 (갤러리)
      leftSectionClass:
        deviceType === 'mobile'
          ? 'w-full flex-shrink-0 bg-white'
          : 'w-1/2 h-full flex-shrink-0 bg-white border-r border-gray-200',

      // 우측 섹션 클래스 (컨텐츠)
      rightSectionClass:
        deviceType === 'mobile'
          ? 'w-full flex-shrink-0 bg-gray-50 p-4'
          : 'w-1/2 h-full flex-shrink-0 bg-gray-50 p-6',
    };

    console.log('레이아웃 클래스 생성:', {
      deviceType,
      layoutClasses,
    });

    return layoutClasses;
  }, [responsiveState]);

  // 윈도우 리사이즈 이벤트 리스너 등록
  useEffect(() => {
    console.log('반응형 레이아웃 훅 초기화');

    // 초기 크기 설정
    updateDimensions();

    // 리사이즈 이벤트 핸들러
    const handleResize = () => {
      updateDimensions();
    };

    // 디바운스된 리사이즈 핸들러
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);

    // 클린업
    return () => {
      console.log('반응형 레이아웃 훅 클린업');
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [updateDimensions]);

  // 디버그 정보 생성
  useEffect(() => {
    if (!responsiveState.isLoading) {
      createDebugInfo('useResponsiveLayout', {
        deviceType: responsiveState.deviceType,
        windowWidth: responsiveState.windowWidth,
        windowHeight: responsiveState.windowHeight,
        breakpoints,
      });
    }
  }, [responsiveState, breakpoints]);

  return {
    ...responsiveState,
    updateDimensions,
    getLayoutClasses,
  };
}

export default useResponsiveLayout;
