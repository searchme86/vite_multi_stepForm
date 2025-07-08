// blogMediaStep/imageUpload/hooks/useMobileTouchState.ts

import { useState, useCallback, useEffect } from 'react';

export const useMobileTouchState = (isMobileDevice: boolean) => {
  const [touchActiveImages, setTouchActiveImages] = useState<Set<number>>(
    new Set()
  );

  console.log('🔧 [MOBILE_TOUCH] useMobileTouchState 초기화:', {
    isMobileDevice,
    touchActiveImagesCount: touchActiveImages.size,
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleImageTouch = useCallback(
    (imageIndex: number) => {
      console.log('📱 [TOUCH] 이미지 터치:', {
        imageIndex,
        isMobileDevice,
        timestamp: new Date().toLocaleTimeString(),
      });

      setTouchActiveImages((prevTouchActive) => {
        const newTouchActive = new Set(prevTouchActive);

        const isCurrentlyActive = newTouchActive.has(imageIndex);

        if (isCurrentlyActive) {
          newTouchActive.delete(imageIndex);
          console.log('📱 [TOUCH] 터치 상태 비활성화:', { imageIndex });
        } else {
          newTouchActive.add(imageIndex);
          console.log('📱 [TOUCH] 터치 상태 활성화:', { imageIndex });
        }

        return newTouchActive;
      });
    },
    [isMobileDevice]
  );

  const clearAllTouchStates = useCallback(() => {
    console.log('📱 [TOUCH] 모든 터치 상태 리셋');
    setTouchActiveImages(new Set());
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Element;
      const isImageCard = target.closest('[data-image-card]');

      const hasActiveTouches = touchActiveImages.size > 0;
      const shouldClearTouches = !isImageCard && hasActiveTouches;

      if (shouldClearTouches) {
        console.log('📱 [TOUCH] 외부 클릭으로 터치 상태 리셋');
        clearAllTouchStates();
      }
    };

    if (isMobileDevice) {
      document.addEventListener('click', handleDocumentClick);

      return () => {
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [touchActiveImages.size, isMobileDevice, clearAllTouchStates]);

  return {
    touchActiveImages,
    handleImageTouch,
    clearAllTouchStates,
  };
};
