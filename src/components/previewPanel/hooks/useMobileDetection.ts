// 모바일 환경 감지 훅
import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '../utils/constants';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    console.log('📱 모바일 감지 초기화');

    const checkMobile = () => {
      const isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
      console.log('📊 화면 크기 체크:', {
        width: window.innerWidth,
        isMobile: isMobileView,
      });
      setIsMobile(isMobileView);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      console.log('🧹 모바일 감지 리스너 정리');
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return { isMobile };
}
