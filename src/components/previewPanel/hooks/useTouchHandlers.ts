//====여기부터 수정됨====
// 터치 핸들러 훅 - 무한 렌더링 방지
import { useCallback, useRef, useMemo } from 'react';
import { dispatchClosePreviewPanel } from '../utils/eventHandlers';

// 터치 정보 타입 정의
interface TouchInfo {
  startY: number;
  startTime: number;
  isDragging: boolean;
}

// 반환 타입 정의
interface UseTouchHandlersReturn {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleHeaderClick: () => void;
}

export function useTouchHandlers(): UseTouchHandlersReturn {
  // 터치 상태를 추적하는 ref
  // 컴포넌트 리렌더링과 무관하게 터치 정보를 유지합니다
  const touchInfoRef = useRef<TouchInfo>({
    startY: 0,
    startTime: 0,
    isDragging: false,
  });

  // 터치 시작 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // 터치 시작 지점과 시간을 기록합니다
    const touch = e.touches[0];
    if (touch) {
      touchInfoRef.current = {
        startY: touch.clientY,
        startTime: Date.now(),
        isDragging: false,
      };
      console.log('👆 터치 시작:', touch.clientY);
    }
  }, []);

  // 터치 이동 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !touchInfoRef.current) return;

    const currentY = touch.clientY;
    const deltaY = currentY - touchInfoRef.current.startY;
    const threshold = 50; // 드래그 감지 임계값

    // 임계값을 넘으면 드래그 상태로 설정
    if (Math.abs(deltaY) > threshold) {
      touchInfoRef.current.isDragging = true;
    }

    // 아래로 드래그 시 패널 닫기 준비
    if (touchInfoRef.current.isDragging && deltaY > threshold) {
      console.log('👇 아래로 드래그 감지:', deltaY);
      // 실제 패널 위치 조정은 CSS transition에 맡기고
      // 여기서는 상태 추적만 합니다
    }
  }, []);

  // 터치 종료 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchInfoRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const endY = touch.clientY;
    const deltaY = endY - touchInfoRef.current.startY;
    const deltaTime = Date.now() - touchInfoRef.current.startTime;
    const velocity = Math.abs(deltaY) / deltaTime; // 속도 계산

    const dismissThreshold = 100; // 패널 닫기 임계값
    const velocityThreshold = 0.5; // 속도 임계값

    // 충분히 아래로 드래그했거나 빠른 속도로 아래로 스와이프한 경우 패널 닫기
    if (
      deltaY > dismissThreshold ||
      (deltaY > 50 && velocity > velocityThreshold)
    ) {
      console.log(
        '✅ 패널 닫기 조건 충족 - deltaY:',
        deltaY,
        'velocity:',
        velocity
      );
      dispatchClosePreviewPanel();
    } else {
      console.log(
        '❌ 패널 닫기 조건 미충족 - deltaY:',
        deltaY,
        'velocity:',
        velocity
      );
    }

    // 터치 정보 초기화
    touchInfoRef.current = {
      startY: 0,
      startTime: 0,
      isDragging: false,
    };
  }, []);

  // 헤더 클릭 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleHeaderClick = useCallback(() => {
    console.log('🖱️ 헤더 클릭 - 패널 닫기');
    dispatchClosePreviewPanel();
  }, []);

  // 모든 핸들러를 하나의 객체로 메모이제이션
  // useMemo를 사용하여 의존성이 변경될 때만 새 객체를 생성합니다
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
//====여기까지 수정됨====
