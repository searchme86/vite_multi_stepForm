// 📁 imageUpload/hooks/useMobileTouchState.ts

import { useState, useCallback } from 'react';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('MOBILE_TOUCH');

export const useMobileTouchState = (isMobileDevice: boolean) => {
  const [touchActiveImages, setTouchActiveImages] = useState<Set<number>>(
    new Set()
  );

  logger.debug('useMobileTouchState 초기화', {
    isMobileDevice,
    touchActiveImagesCount: touchActiveImages.size,
    timestamp: new Date().toLocaleTimeString(),
  });

  const handleImageTouch = useCallback(
    (imageIndex: number) => {
      // 🔧 early return으로 중첩 방지
      if (!isMobileDevice) {
        logger.debug('모바일 디바이스가 아니므로 터치 무시', {
          imageIndex,
          isMobileDevice,
        });
        return;
      }

      logger.debug('이미지 터치 처리', {
        imageIndex,
        timestamp: new Date().toLocaleTimeString(),
      });

      setTouchActiveImages((previousTouchActiveImages) => {
        const newTouchActiveImages = new Set(previousTouchActiveImages);
        const hasExistingTouch = newTouchActiveImages.has(imageIndex);

        // 🔧 삼항연산자 사용 (&&연산자 대신)
        const touchAction = hasExistingTouch ? 'delete' : 'add';

        if (hasExistingTouch) {
          newTouchActiveImages.delete(imageIndex);
          logger.debug('터치 상태 해제', { imageIndex });
        } else {
          newTouchActiveImages.add(imageIndex);
          logger.debug('터치 상태 활성화', { imageIndex });
        }

        logger.debug('터치 상태 변경 완료', {
          imageIndex,
          touchAction,
          currentTouchCount: newTouchActiveImages.size,
        });

        return newTouchActiveImages;
      });
    },
    [isMobileDevice]
  );

  const clearAllTouchStates = useCallback(() => {
    const currentTouchCount = touchActiveImages.size;

    // 🔧 early return으로 중첩 방지
    if (currentTouchCount === 0) {
      logger.debug('이미 모든 터치 상태가 비어있음');
      return;
    }

    setTouchActiveImages(new Set());

    logger.debug('모든 터치 상태 초기화', {
      previousTouchCount: currentTouchCount,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [touchActiveImages.size]);

  const checkIsTouchActive = useCallback(
    (imageIndex: number): boolean => {
      const isTouchActive = touchActiveImages.has(imageIndex);

      logger.debug('터치 상태 확인', {
        imageIndex,
        isTouchActive,
        totalActiveTouchCount: touchActiveImages.size,
      });

      return isTouchActive;
    },
    [touchActiveImages]
  );

  const getTouchActiveImageCount = useCallback((): number => {
    const activeTouchCount = touchActiveImages.size;

    logger.debug('활성 터치 개수 조회', {
      activeTouchCount,
      timestamp: new Date().toLocaleTimeString(),
    });

    return activeTouchCount;
  }, [touchActiveImages.size]);

  return {
    touchActiveImages,
    handleImageTouch,
    clearAllTouchStates,
    checkIsTouchActive,
    getTouchActiveImageCount,
  };
};
