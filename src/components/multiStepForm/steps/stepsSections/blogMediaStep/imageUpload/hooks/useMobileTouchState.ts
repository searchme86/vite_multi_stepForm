// 📁 blogMediaStep/imageUpload/hooks/useMobileTouchState.ts

import { useState, useCallback } from 'react';

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
      if (!isMobileDevice) {
        console.log('🔧 [MOBILE_TOUCH] 모바일 디바이스가 아니므로 터치 무시:', {
          imageIndex,
          isMobileDevice,
        });
        return;
      }

      console.log('🔧 [MOBILE_TOUCH] 이미지 터치 처리:', {
        imageIndex,
        timestamp: new Date().toLocaleTimeString(),
      });

      setTouchActiveImages((previousTouchActiveImages) => {
        const newTouchActiveImages = new Set(previousTouchActiveImages);

        if (newTouchActiveImages.has(imageIndex)) {
          newTouchActiveImages.delete(imageIndex);
          console.log('✅ [MOBILE_TOUCH] 터치 상태 해제:', { imageIndex });
        } else {
          newTouchActiveImages.add(imageIndex);
          console.log('✅ [MOBILE_TOUCH] 터치 상태 활성화:', { imageIndex });
        }

        return newTouchActiveImages;
      });
    },
    [isMobileDevice]
  );

  return {
    touchActiveImages,
    handleImageTouch,
  };
};
