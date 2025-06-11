import React from 'react';
import { checkIsMobile } from './responsiveUtils';

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    console.log('📱 useMobileDetection: 모바일 감지 초기화');

    const handleResize = () => {
      console.log('📱 useMobileDetection: resize 이벤트 발생');
      setIsMobile(checkIsMobile());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      console.log('📱 useMobileDetection: resize 이벤트 리스너 제거');
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile };
};
