import React from 'react';
import { getWindowDimensions } from './responsiveUtils';

interface UseResponsiveEventsProps {
  onResize?: (width: number, height: number) => void;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  throttleMs?: number;
}

export const useResponsiveEvents = ({
  onResize,
  onOrientationChange,
  throttleMs = 250,
}: UseResponsiveEventsProps = {}) => {
  console.log('📱 useResponsiveEvents: 반응형 이벤트 훅 초기화');

  const [dimensions, setDimensions] = React.useState(() =>
    getWindowDimensions()
  );
  const [orientation, setOrientation] = React.useState<
    'portrait' | 'landscape'
  >(() => (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'));

  const throttleRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleResize = React.useCallback(() => {
    console.log('📱 useResponsiveEvents: resize 이벤트 발생');

    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    throttleRef.current = setTimeout(() => {
      const newDimensions = getWindowDimensions();
      const newOrientation =
        newDimensions.height > newDimensions.width ? 'portrait' : 'landscape';

      console.log('📱 useResponsiveEvents: 크기 변경', newDimensions);
      setDimensions(newDimensions);

      if (newOrientation !== orientation) {
        console.log('📱 useResponsiveEvents: 방향 변경', newOrientation);
        setOrientation(newOrientation);
        onOrientationChange?.(newOrientation);
      }

      onResize?.(newDimensions.width, newDimensions.height);
    }, throttleMs);
  }, [onResize, onOrientationChange, orientation, throttleMs]);

  React.useEffect(() => {
    console.log('📱 useResponsiveEvents: 이벤트 리스너 등록');

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      console.log('📱 useResponsiveEvents: 이벤트 리스너 제거');
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [handleResize]);

  return {
    dimensions,
    orientation,
    width: dimensions.width,
    height: dimensions.height,
  };
};
