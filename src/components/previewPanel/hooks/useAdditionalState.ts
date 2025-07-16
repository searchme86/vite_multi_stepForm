// src/components/previewPanel/hooks/useAdditionalState.ts

import { useRef, useMemo, useCallback } from 'react';
import { usePreviewPanelStore } from '../store/previewPanelStore';

// 반환 타입 정의
interface UseAdditionalStateReturn {
  hasTabChanged: boolean;
  setHasTabChanged: (value: boolean) => void;
  isMountedRef: React.MutableRefObject<boolean>;
}

/**
 * 추가 상태 관리 훅 - PreviewPanelStore 통합 버전
 *
 * 수정사항:
 * - 미사용 변수 제거 (storeSetIsMountedRef, isMountedFromStore)
 * - 타입 안전성 향상
 * - 불필요한 스토어 접근 제거
 *
 * @returns 탭 변경 상태와 마운트 상태 관련 함수들
 */
export function useAdditionalState(): UseAdditionalStateReturn {
  console.log('🔧 [ADDITIONAL_STATE] 훅 초기화 (PreviewPanelStore 통합 버전)');

  // 🎯 PreviewPanelStore에서 탭 변경 상태 가져오기
  const hasTabChanged = usePreviewPanelStore((state) => state.hasTabChanged);

  // 🎯 PreviewPanelStore에서 탭 변경 상태 설정 함수 가져오기
  const storeSetHasTabChanged = usePreviewPanelStore(
    (state) => state.setHasTabChanged
  );

  // 컴포넌트 마운트 상태 추적 ref
  const isMountedRef = useRef<boolean>(true);

  console.log('🔧 [ADDITIONAL_STATE] 현재 상태:', {
    hasTabChanged,
    isMountedRefValue: isMountedRef.current,
    timestamp: new Date().toISOString(),
  });

  // 🎯 탭 변경 상태 설정 함수 - PreviewPanelStore 액션 사용
  const setHasTabChanged = useCallback(
    (newValue: boolean) => {
      console.log('📋 [ADDITIONAL_STATE] 탭 변경 상태 업데이트 요청:', {
        currentValue: hasTabChanged,
        newValue,
        isMounted: isMountedRef.current,
        timestamp: new Date().toISOString(),
      });

      // 마운트된 상태에서만 상태 업데이트
      const shouldUpdateState = isMountedRef.current;
      if (shouldUpdateState) {
        storeSetHasTabChanged(newValue);

        console.log('✅ [ADDITIONAL_STATE] 탭 변경 상태 업데이트 완료:', {
          newValue,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn(
          '⚠️ [ADDITIONAL_STATE] 언마운트된 상태에서 업데이트 요청 무시:',
          {
            requestedValue: newValue,
            isMounted: isMountedRef.current,
            timestamp: new Date().toISOString(),
          }
        );
      }
    },
    [hasTabChanged, storeSetHasTabChanged]
  );

  // 반환 객체를 메모이제이션
  const returnValue = useMemo((): UseAdditionalStateReturn => {
    console.log('🔄 [ADDITIONAL_STATE] 반환 객체 생성:', {
      hasTabChanged,
      hasSetFunction: !!setHasTabChanged,
      hasRefObject: !!isMountedRef,
      timestamp: new Date().toISOString(),
    });

    return {
      hasTabChanged,
      setHasTabChanged,
      isMountedRef,
    };
  }, [hasTabChanged, setHasTabChanged]);

  console.log('✅ [ADDITIONAL_STATE] 훅 초기화 완료 (PreviewPanelStore 통합)');

  return returnValue;
}
