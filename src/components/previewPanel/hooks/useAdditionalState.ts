//====여기부터 수정됨====
// 추가 상태 관리 훅 - 무한 렌더링 방지
import { useState, useRef, useMemo, useCallback } from 'react';

// 반환 타입 정의
// 타입을 명확히 정의하여 TypeScript의 타입 추론을 돕습니다
interface UseAdditionalStateReturn {
  hasTabChanged: boolean;
  setHasTabChanged: (value: boolean) => void;
  isMountedRef: React.MutableRefObject<boolean>;
}

export function useAdditionalState(): UseAdditionalStateReturn {
  // 탭 변경 상태 관리
  // 탭이 변경되었는지를 추적하는 상태입니다
  const [hasTabChanged, setHasTabChangedState] = useState<boolean>(false);

  // 컴포넌트 마운트 상태 추적
  // 컴포넌트가 마운트되었는지를 추적하는 ref입니다
  const isMountedRef = useRef<boolean>(true);

  // setHasTabChanged 함수를 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  // 이를 통해 이 함수를 의존성으로 사용하는 useEffect의 불필요한 재실행을 방지합니다
  const setHasTabChanged = useCallback((value: boolean) => {
    // 마운트된 상태에서만 상태 업데이트
    // 언마운트된 컴포넌트에서 setState 호출을 방지합니다
    if (isMountedRef.current) {
      setHasTabChangedState(value);
      console.log('📋 탭 변경 상태 업데이트:', value);
    }
  }, []);

  // 반환 객체를 메모이제이션
  // useMemo를 사용하여 의존성이 변경될 때만 새 객체를 생성합니다
  // 이는 이 훅을 사용하는 컴포넌트의 불필요한 리렌더링을 방지합니다
  return useMemo(
    () => ({
      hasTabChanged,
      setHasTabChanged,
      isMountedRef,
    }),
    [hasTabChanged, setHasTabChanged] // isMountedRef는 ref이므로 의존성에 포함하지 않습니다
  );
}
//====여기까지 수정됨====
