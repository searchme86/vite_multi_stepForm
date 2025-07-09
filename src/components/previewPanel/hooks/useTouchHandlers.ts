// src/components/previewPanel/hooks/useTouchHandlers.ts

import { useCallback, useRef, useMemo } from 'react';
import { dispatchClosePreviewPanel } from '../utils/eventHandlers';

// 터치 정보 타입 정의
interface TouchInfo {
  startY: number;
  startTime: number;
  isDragging: boolean;
  lastY: number;
  velocityData: number[];
}

// 터치 설정 상수
const TOUCH_CONFIG = {
  DISMISS_THRESHOLD: 100,
  VELOCITY_THRESHOLD: 0.5,
  DRAG_DETECT_THRESHOLD: 50,
  VELOCITY_BUFFER_SIZE: 5,
  DEBOUNCE_DELAY: 16, // ~60fps
} as const;

// 반환 타입 정의
interface UseTouchHandlersReturn {
  handleTouchStart: (touchEvent: React.TouchEvent) => void;
  handleTouchMove: (touchEvent: React.TouchEvent) => void;
  handleTouchEnd: (touchEvent: React.TouchEvent) => void;
  handleHeaderClick: () => void;
}

export function useTouchHandlers(): UseTouchHandlersReturn {
  console.log('🔧 [TOUCH_HANDLERS] 터치 핸들러 훅 초기화');

  // 터치 상태를 추적하는 ref
  const touchInfoRef = useRef<TouchInfo>({
    startY: 0,
    startTime: 0,
    isDragging: false,
    lastY: 0,
    velocityData: [],
  });

  // 디바운싱을 위한 타이머 ref (NodeJS.Timeout → number로 변경)
  const debounceTimerRef = useRef<number | null>(null);

  // 속도 계산 함수 (순수 함수)
  const calculateVelocity = useCallback(
    (touchData: TouchInfo, currentY: number, currentTime: number): number => {
      const { velocityData } = touchData;

      // 현재 데이터 추가
      velocityData.push(currentY);

      // 버퍼 크기 제한
      const maxBufferSize = TOUCH_CONFIG.VELOCITY_BUFFER_SIZE;
      const shouldTrimBuffer = velocityData.length > maxBufferSize;
      if (shouldTrimBuffer) {
        velocityData.shift();
      }

      // 속도 계산
      const hasEnoughData = velocityData.length >= 2;
      if (!hasEnoughData) return 0;

      const deltaY = velocityData[velocityData.length - 1] - velocityData[0];
      const deltaTime = currentTime - touchData.startTime;
      const velocity = Math.abs(deltaY) / Math.max(deltaTime, 1);

      return velocity;
    },
    []
  );

  // 패널 닫기 조건 확인 함수 (순수 함수)
  const shouldClosePanel = useCallback(
    (deltaY: number, velocity: number): boolean => {
      const { DISMISS_THRESHOLD, VELOCITY_THRESHOLD } = TOUCH_CONFIG;

      const isDistanceEnough = deltaY > DISMISS_THRESHOLD;
      const isVelocityEnough = deltaY > 50 && velocity > VELOCITY_THRESHOLD;

      return isDistanceEnough || isVelocityEnough;
    },
    []
  );

  // 터치 시작 핸들러
  const handleTouchStart = useCallback((touchEvent: React.TouchEvent) => {
    const { touches } = touchEvent;
    const firstTouch = touches[0];

    const hasValidTouch = firstTouch !== undefined;
    if (!hasValidTouch) {
      console.warn('⚠️ [TOUCH_START] 유효하지 않은 터치 이벤트');
      return;
    }

    const { clientY: startY } = firstTouch;
    const startTime = Date.now();

    // 터치 정보 초기화
    touchInfoRef.current = {
      startY,
      startTime,
      isDragging: false,
      lastY: startY,
      velocityData: [startY],
    };

    console.log('👆 [TOUCH_START] 터치 시작 감지:', {
      startY,
      startTime,
      touchCount: touches.length,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // 터치 이동 핸들러
  const handleTouchMove = useCallback(
    (touchEvent: React.TouchEvent) => {
      const touchInfo = touchInfoRef.current;
      const hasValidTouchInfo = touchInfo !== null;
      if (!hasValidTouchInfo) {
        console.warn('⚠️ [TOUCH_MOVE] 터치 정보 없음');
        return;
      }

      const { touches } = touchEvent;
      const firstTouch = touches[0];

      const hasValidTouch = firstTouch !== undefined;
      if (!hasValidTouch) {
        console.warn('⚠️ [TOUCH_MOVE] 유효하지 않은 터치 이벤트');
        return;
      }

      const { clientY: currentY } = firstTouch;
      const currentTime = Date.now();
      const deltaY = currentY - touchInfo.startY;
      const { DRAG_DETECT_THRESHOLD } = TOUCH_CONFIG;

      // 디바운싱 처리
      const currentTimer = debounceTimerRef.current;
      if (currentTimer !== null) {
        clearTimeout(currentTimer);
      }

      debounceTimerRef.current = setTimeout(() => {
        // 드래그 감지 로직
        const isDragDetected = Math.abs(deltaY) > DRAG_DETECT_THRESHOLD;
        const wasNotDragging = !touchInfo.isDragging;

        if (isDragDetected && wasNotDragging) {
          touchInfo.isDragging = true;
          console.log('🫳 [TOUCH_MOVE] 드래그 감지됨:', {
            deltaY,
            threshold: DRAG_DETECT_THRESHOLD,
            timestamp: new Date().toISOString(),
          });
        }

        // 속도 계산
        const velocity = calculateVelocity(touchInfo, currentY, currentTime);

        // 아래로 드래그 감지 및 로깅
        const isDownwardDrag = touchInfo.isDragging && deltaY > 0;
        if (isDownwardDrag) {
          const dragPercentage = (deltaY / window.innerHeight) * 100;

          console.log('👇 [TOUCH_MOVE] 아래로 드래그 진행:', {
            deltaY,
            dragPercentage: `${dragPercentage.toFixed(1)}%`,
            velocity: velocity.toFixed(3),
            direction: 'down',
            willClose: shouldClosePanel(deltaY, velocity),
            timestamp: new Date().toISOString(),
          });
        }

        // 마지막 Y 위치 업데이트
        touchInfo.lastY = currentY;
      }, TOUCH_CONFIG.DEBOUNCE_DELAY);
    },
    [calculateVelocity, shouldClosePanel]
  );

  // 터치 종료 핸들러
  const handleTouchEnd = useCallback(
    (touchEvent: React.TouchEvent) => {
      const touchInfo = touchInfoRef.current;
      const hasValidTouchInfo = touchInfo !== null;
      if (!hasValidTouchInfo) {
        console.warn('⚠️ [TOUCH_END] 터치 정보 없음');
        return;
      }

      // 디바운싱 타이머 정리
      const currentTimer = debounceTimerRef.current;
      if (currentTimer !== null) {
        clearTimeout(currentTimer);
        debounceTimerRef.current = null;
      }

      const { changedTouches } = touchEvent;
      const firstTouch = changedTouches[0];

      const hasValidTouch = firstTouch !== undefined;
      if (!hasValidTouch) {
        console.warn('⚠️ [TOUCH_END] 유효하지 않은 터치 이벤트');
        return;
      }

      const { clientY: endY } = firstTouch;
      const endTime = Date.now();
      const deltaY = endY - touchInfo.startY;
      const deltaTime = endTime - touchInfo.startTime;
      const velocity = Math.abs(deltaY) / Math.max(deltaTime, 1);

      // 패널 닫기 조건 확인
      const shouldClose = shouldClosePanel(deltaY, velocity);

      console.log('👆 [TOUCH_END] 터치 종료 처리:', {
        deltaY,
        deltaTime: `${deltaTime}ms`,
        velocity: velocity.toFixed(3),
        shouldClose,
        dragPercentage: `${((deltaY / window.innerHeight) * 100).toFixed(1)}%`,
        action: shouldClose ? 'CLOSE_PANEL' : 'KEEP_OPEN',
        timestamp: new Date().toISOString(),
      });

      // 패널 닫기 실행
      if (shouldClose) {
        console.log('🔽 [PANEL_ACTION] 패널 닫기 실행 - 드래그/속도 조건 충족');
        dispatchClosePreviewPanel();
      }

      // 터치 정보 초기화
      touchInfoRef.current = {
        startY: 0,
        startTime: 0,
        isDragging: false,
        lastY: 0,
        velocityData: [],
      };
    },
    [shouldClosePanel]
  );

  // 헤더 클릭 핸들러
  const handleHeaderClick = useCallback(() => {
    console.log('🖱️ [HEADER_CLICK] 헤더 클릭 감지:', {
      action: 'CLOSE_PANEL',
      trigger: 'header_click',
      timestamp: new Date().toISOString(),
    });

    dispatchClosePreviewPanel();
  }, []);

  // 모든 핸들러를 메모이제이션하여 반환
  return useMemo(
    () => ({
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleHeaderClick,
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd, handleHeaderClick]
  );
}
