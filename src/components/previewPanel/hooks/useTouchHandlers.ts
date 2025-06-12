// 터치 이벤트 핸들러 훅
import { useRef, useCallback } from 'react';
import { StateRef } from '../types/previewPanel.types';
import {
  TOUCH_THRESHOLD,
  SWIPE_THRESHOLD,
  DRAGGING_TIMEOUT,
} from '../utils/constants';
import { dispatchClosePreviewPanel } from '../utils/eventHandlers';

export function useTouchHandlers() {
  const stateRef = useRef<StateRef>({
    touchStartY: 0,
    isDragging: false,
    isMounted: true,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    console.log('👆 터치 시작:', e.touches[0].clientY);
    stateRef.current.touchStartY = e.touches[0].clientY;
    stateRef.current.isDragging = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diffY = Math.abs(e.touches[0].clientY - stateRef.current.touchStartY);
    if (diffY > TOUCH_THRESHOLD) {
      console.log('🔄 드래그 감지:', diffY);
      stateRef.current.isDragging = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diffY = e.changedTouches[0].clientY - stateRef.current.touchStartY;
    console.log('🔽 터치 종료:', {
      diffY,
      isDragging: stateRef.current.isDragging,
    });

    if (diffY > SWIPE_THRESHOLD && stateRef.current.isDragging) {
      console.log('📤 스와이프 다운 감지 - 패널 닫기');
      dispatchClosePreviewPanel();
    }

    setTimeout(() => {
      stateRef.current.isDragging = false;
    }, DRAGGING_TIMEOUT);
  }, []);

  const handleHeaderClick = useCallback(() => {
    if (!stateRef.current.isDragging) {
      console.log('🖱️ 헤더 클릭 - 패널 닫기');
      dispatchClosePreviewPanel();
    }
  }, []);

  return {
    stateRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleHeaderClick,
  };
}
