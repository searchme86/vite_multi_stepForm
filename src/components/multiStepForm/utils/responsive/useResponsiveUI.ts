import React from 'react';
import { useMobileDetection } from './useMobileDetection';
import { useResponsiveEvents } from './useResponsiveEvents';
import {
  getBreakpoint,
  isTabletSize,
  isDesktopSize,
  calculateResponsiveColumns,
  getResponsiveSpacing,
} from './responsiveActions';

export const useResponsiveUI = () => {
  console.log('📱 useResponsiveUI: 반응형 UI 상태 관리 훅 초기화');

  const { isMobile } = useMobileDetection();
  const { dimensions, orientation } = useResponsiveEvents();

  const [breakpoint, setBreakpoint] = React.useState<
    'mobile' | 'tablet' | 'desktop'
  >('desktop');
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    console.log('📱 useResponsiveUI: 반응형 상태 업데이트');

    const currentBreakpoint = getBreakpoint(dimensions.width);
    const tablet = isTabletSize(dimensions.width);
    const desktop = isDesktopSize(dimensions.width);

    setBreakpoint(currentBreakpoint);
    setIsTablet(tablet);
    setIsDesktop(desktop);

    console.log('📱 useResponsiveUI: 상태 업데이트 완료', {
      breakpoint: currentBreakpoint,
      isMobile,
      isTablet: tablet,
      isDesktop: desktop,
      orientation,
    });
  }, [dimensions.width, isMobile, orientation]);

  const getResponsiveConfig = React.useCallback(
    (maxColumns: number = 4) => {
      const config = {
        columns: calculateResponsiveColumns(dimensions.width, maxColumns),
        spacing: getResponsiveSpacing(dimensions.width),
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        width: dimensions.width,
        height: dimensions.height,
      };

      console.log('📱 useResponsiveUI: 반응형 설정 생성', config);
      return config;
    },
    [dimensions, breakpoint, isMobile, isTablet, isDesktop, orientation]
  );

  const checkMobile = React.useCallback(() => {
    return isMobile;
  }, [isMobile]);

  const updateWindowDimensions = React.useCallback(
    (width: number, height: number) => {
      console.log('📱 useResponsiveUI: 창 크기 업데이트', { width, height });
      // 이미 useResponsiveEvents에서 처리되므로 여기서는 로깅만
    },
    []
  );

  const setIsMobileState = React.useCallback((mobile: boolean) => {
    console.log('📱 useResponsiveUI: 모바일 상태 직접 설정', mobile);
    // 실제 구현에서는 상태 변경이 필요할 수 있음
  }, []);

  return {
    // 기본 상태
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    orientation,

    // 창 크기
    windowWidth: dimensions.width,
    windowHeight: dimensions.height,

    // 함수들
    getBreakpoint: () => breakpoint,
    checkMobile,
    updateWindowDimensions,
    setIsMobile: setIsMobileState,
    getResponsiveConfig,
  };
};
