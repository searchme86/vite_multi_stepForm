//====여기부터 수정됨====
// 원본 코드에서 누락된 추가 상태 관리 훅
import { useState, useRef, useEffect } from 'react';

export function useAdditionalState() {
  console.log('🎛️ 추가 상태 관리 초기화');

  // 탭 변경 상태 추적
  const [hasTabChanged, setHasTabChanged] = useState<boolean>(false);

  // 컴포넌트 마운트 상태 추적
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    return () => {
      console.log('🗑️ 컴포넌트 언마운트');
      isMountedRef.current = false;
    };
  }, []);

  return {
    hasTabChanged,
    setHasTabChanged,
    isMountedRef,
  };
}
//====여기까지 수정됨====
