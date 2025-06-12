//====여기부터 수정됨====
// 모바일 감지 훅 - 무인 렌더링 방지
import { useState, useEffect, useMemo, useCallback } from 'react';

// 반환 타입 정의
interface UseMobileDetectionReturn {
  isMobile: boolean;
  screenWidth: number;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useMobileDetection(): UseMobileDetectionReturn {
  // 화면 너비 상태 관리
  // 현재 화면의 너비를 추적합니다
  const [screenWidth, setScreenWidth] = useState<number>(() => {
    // 초기값을 함수로 제공하여 SSR 호환성 확보
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024; // SSR 환경에서의 기본값 (데스크톱으로 가정)
  });

  // 화면 크기 변경 감지 함수 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleResize = useCallback(() => {
    const newWidth = window.innerWidth;
    // 성능 최적화: 실제로 너비가 변경되었을 때만 상태 업데이트
    setScreenWidth((prevWidth) => {
      if (prevWidth !== newWidth) {
        console.log('📱 화면 너비 변경:', prevWidth, '->', newWidth);
        return newWidth;
      }
      return prevWidth;
    });
  }, []);

  // 리사이즈 이벤트 리스너 등록
  // 화면 크기가 변경될 때마다 상태를 업데이트합니다
  useEffect(() => {
    // 클라이언트 환경에서만 실행
    if (typeof window === 'undefined') return;

    // 디바운싱을 위한 타이머 ID
    let timeoutId: NodeJS.Timeout;

    // 디바운싱된 리사이즈 핸들러
    // 연속된 리사이즈 이벤트를 제한하여 성능을 최적화합니다
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100); // 100ms 디바운싱
    };

    // 이벤트 리스너 등록
    window.addEventListener('resize', debouncedHandleResize);

    // 초기 화면 크기 설정
    handleResize();

    // 클린업 함수
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  // 디바이스 타입 판별 로직 메모이제이션
  // 화면 너비가 변경될 때만 새로운 값을 계산합니다
  const deviceInfo = useMemo(() => {
    // Tailwind CSS의 기본 브레이크포인트를 사용
    const isMobile = screenWidth < 768; // md 미만
    const isTablet = screenWidth >= 768 && screenWidth < 1024; // md 이상 lg 미만
    const isDesktop = screenWidth >= 1024; // lg 이상

    console.log('🖥️ 디바이스 타입 감지:', {
      screenWidth,
      isMobile,
      isTablet,
      isDesktop,
    });

    return {
      isMobile,
      isTablet,
      isDesktop,
    };
  }, [screenWidth]);

  // 모든 디바이스 정보를 하나의 객체로 메모이제이션
  // 의존성이 변경될 때만 새 객체를 생성합니다
  return useMemo(
    () => ({
      isMobile: deviceInfo.isMobile,
      screenWidth,
      isTablet: deviceInfo.isTablet,
      isDesktop: deviceInfo.isDesktop,
    }),
    [
      deviceInfo.isMobile,
      screenWidth,
      deviceInfo.isTablet,
      deviceInfo.isDesktop,
    ]
  );
}
//====여기까지 수정됨====
