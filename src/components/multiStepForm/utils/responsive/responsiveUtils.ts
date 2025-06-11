import { MOBILE_BREAKPOINT } from '../constants';

export const checkIsMobile = (): boolean => {
  console.log('📱 checkIsMobile: 모바일 여부 확인');
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  console.log(
    '📱 checkIsMobile 결과:',
    isMobile,
    '(width:',
    window.innerWidth,
    ')'
  );
  return isMobile;
};

export const getWindowDimensions = () => {
  console.log('📐 getWindowDimensions: 창 크기 가져오기');
  const dimensions = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  console.log('📐 getWindowDimensions 결과:', dimensions);
  return dimensions;
};
