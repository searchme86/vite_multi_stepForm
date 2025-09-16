// src/components/previewPanel/hooks/usePreviewPanelState.ts

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { usePreviewPanelStore } from '../store/previewPanelStore';
import type { MobileDeviceSize } from '../types/previewPanel.types';

// Props 타입 정의
interface UsePreviewPanelStateProps {
  isMobile: boolean;
  isPreviewPanelOpen: boolean;
}

// 반환 타입 정의
interface UsePreviewPanelStateReturn {
  selectedMobileSize: MobileDeviceSize;
  setSelectedMobileSize: (size: MobileDeviceSize) => void;
}

/**
 * 미리보기 패널 상태 관리 훅 - PreviewPanelStore 통합 버전
 *
 * 수정사항:
 * - 미사용 변수 제거 (setIsPreviewPanelOpen)
 * - Props 타입 수정 (불필요한 함수 제거)
 * - 타입 안전성 향상
 *
 * @param props - 훅 설정 props
 * @returns 모바일 사이즈 관련 상태와 함수들
 */
export function usePreviewPanelState({
  isMobile,
  isPreviewPanelOpen,
}: UsePreviewPanelStateProps): UsePreviewPanelStateReturn {
  console.log(
    '🔧 [PREVIEW_PANEL_STATE] 훅 초기화 (PreviewPanelStore 통합 버전)'
  );

  // 🎯 PreviewPanelStore에서 모바일 사이즈 상태 가져오기
  const selectedMobileSize = usePreviewPanelStore(
    (state) => state.selectedMobileSize
  );

  // 🎯 PreviewPanelStore에서 모바일 사이즈 설정 함수 가져오기
  const storeSetSelectedMobileSize = usePreviewPanelStore(
    (state) => state.setSelectedMobileSize
  );

  // 이전 패널 상태를 추적하는 ref
  const prevPanelStateRef = useRef<boolean>(isPreviewPanelOpen);

  console.log('🔧 [PREVIEW_PANEL_STATE] 현재 상태:', {
    isMobile,
    isPreviewPanelOpen,
    selectedMobileSize,
    timestamp: new Date().toISOString(),
  });

  // 🎯 모바일 크기 설정 핸들러 - PreviewPanelStore 액션 사용
  const setSelectedMobileSize = useCallback(
    (requestedSize: MobileDeviceSize) => {
      console.log('📏 [PREVIEW_PANEL_STATE] 모바일 크기 변경 요청:', {
        currentSize: selectedMobileSize,
        requestedSize,
        timestamp: new Date().toISOString(),
      });

      // 🎯 PreviewPanelStore의 액션 함수 호출
      storeSetSelectedMobileSize(requestedSize);

      console.log('✅ [PREVIEW_PANEL_STATE] 모바일 크기 변경 완료:', {
        newSize: requestedSize,
        timestamp: new Date().toISOString(),
      });
    },
    [selectedMobileSize, storeSetSelectedMobileSize]
  );

  // 패널 상태 변경 감지 및 로깅
  useEffect(() => {
    const hasStateChanged = prevPanelStateRef.current !== isPreviewPanelOpen;

    if (hasStateChanged) {
      console.log('🎯 [PREVIEW_PANEL_STATE] 패널 상태 변경 감지:', {
        previousState: prevPanelStateRef.current,
        currentState: isPreviewPanelOpen,
        deviceType: isMobile ? 'mobile' : 'desktop',
        action: isPreviewPanelOpen ? '열림' : '닫힘',
        timestamp: new Date().toISOString(),
      });

      prevPanelStateRef.current = isPreviewPanelOpen;
    }
  }, [isPreviewPanelOpen, isMobile]);

  // 모바일 상태 변경 시 로깅
  useEffect(() => {
    console.log('📱 [PREVIEW_PANEL_STATE] 디바이스 타입 변경 감지:', {
      isMobile,
      isPreviewPanelOpen,
      selectedMobileSize,
      deviceType: isMobile ? 'mobile' : 'desktop',
      timestamp: new Date().toISOString(),
    });

    // 모바일에서 데스크톱으로 전환 시 로깅
    if (!isMobile && isPreviewPanelOpen) {
      console.log(
        '💻 [PREVIEW_PANEL_STATE] 데스크톱 모드로 전환 - 패널 상태 유지'
      );
    } else if (isMobile && !isPreviewPanelOpen) {
      console.log(
        '📱 [PREVIEW_PANEL_STATE] 모바일 모드로 전환 - 패널 상태 유지'
      );
    }
  }, [isMobile, isPreviewPanelOpen, selectedMobileSize]);

  // 반환 객체 메모이제이션
  const returnValue = useMemo((): UsePreviewPanelStateReturn => {
    console.log('🔄 [PREVIEW_PANEL_STATE] 반환 객체 생성:', {
      selectedMobileSize,
      hasSetFunction: !!setSelectedMobileSize,
      timestamp: new Date().toISOString(),
    });

    return {
      selectedMobileSize,
      setSelectedMobileSize,
    };
  }, [selectedMobileSize, setSelectedMobileSize]);

  console.log(
    '✅ [PREVIEW_PANEL_STATE] 훅 초기화 완료 (PreviewPanelStore 통합)'
  );

  return returnValue;
}
