//====여기부터 수정됨====
// ✅ 수정: import 경로 변경
// 이유: MOBILE_BREAKPOINT 상수가 constants 파일에 정의되어 있음
// 의미: 올바른 상수 경로로 import하여 모듈 의존성 해결
import { MOBILE_BREAKPOINT } from '../constants';
//====여기까지 수정됨====

export const updateMobileState = (windowWidth: number): boolean => {
  console.log('📱 responsiveActions: 모바일 상태 업데이트', windowWidth);
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  console.log('📱 responsiveActions: 모바일 여부', isMobile);
  return isMobile;
};

export const getBreakpoint = (
  windowWidth: number
): 'mobile' | 'tablet' | 'desktop' => {
  console.log('📱 responsiveActions: 브레이크포인트 확인', windowWidth);

  if (windowWidth < MOBILE_BREAKPOINT) {
    return 'mobile';
  } else if (windowWidth < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

export const isTabletSize = (windowWidth: number): boolean => {
  console.log('📱 responsiveActions: 태블릿 크기 확인', windowWidth);
  return windowWidth >= MOBILE_BREAKPOINT && windowWidth < 1024;
};

export const isDesktopSize = (windowWidth: number): boolean => {
  console.log('📱 responsiveActions: 데스크탑 크기 확인', windowWidth);
  return windowWidth >= 1024;
};

export const calculateResponsiveColumns = (
  windowWidth: number,
  maxColumns: number = 4
): number => {
  console.log('📱 responsiveActions: 반응형 열 개수 계산', {
    windowWidth,
    maxColumns,
  });

  if (windowWidth < MOBILE_BREAKPOINT) {
    return 1;
  } else if (windowWidth < 1024) {
    return Math.min(2, maxColumns);
  } else {
    return maxColumns;
  }
};

export const getResponsiveSpacing = (windowWidth: number): number => {
  console.log('📱 responsiveActions: 반응형 간격 계산', windowWidth);

  if (windowWidth < MOBILE_BREAKPOINT) {
    return 4; // 작은 간격
  } else if (windowWidth < 1024) {
    return 8; // 중간 간격
  } else {
    return 16; // 큰 간격
  }
};

export const shouldShowMobileUI = (windowWidth: number): boolean => {
  console.log('📱 responsiveActions: 모바일 UI 표시 여부', windowWidth);
  return windowWidth < MOBILE_BREAKPOINT;
};

export const shouldShowTabletUI = (windowWidth: number): boolean => {
  console.log('📱 responsiveActions: 태블릿 UI 표시 여부', windowWidth);
  return windowWidth >= MOBILE_BREAKPOINT && windowWidth < 1024;
};

export const shouldShowDesktopUI = (windowWidth: number): boolean => {
  console.log('📱 responsiveActions: 데스크탑 UI 표시 여부', windowWidth);
  return windowWidth >= 1024;
};
