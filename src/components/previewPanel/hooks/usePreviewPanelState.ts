//====여기부터 수정됨====
// 미리보기 패널 상태 관리 훅 - 무한 렌더링 방지
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// 모바일 디바이스 크기 타입 정의
type MobileSize = 'sm' | 'md' | 'lg';

// Props 타입 정의
interface UsePreviewPanelStateProps {
  isMobile: boolean;
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (value: boolean) => void;
}

// 반환 타입 정의
interface UsePreviewPanelStateReturn {
  selectedMobileSize: MobileSize;
  setSelectedMobileSize: (size: MobileSize) => void;
}

export function usePreviewPanelState({
  isMobile,
  isPreviewPanelOpen,
  setIsPreviewPanelOpen,
}: UsePreviewPanelStateProps): UsePreviewPanelStateReturn {
  // 모바일 크기 선택 상태 관리
  // 모바일 미리보기에서 선택된 디바이스 크기를 관리합니다
  const [selectedMobileSize, setSelectedMobileSizeState] =
    useState<MobileSize>('md');

  // 이전 패널 상태를 추적하는 ref
  // 패널 상태 변경을 감지하기 위해 사용합니다
  const prevPanelStateRef = useRef<boolean>(isPreviewPanelOpen);

  // 모바일 크기 설정 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const setSelectedMobileSize = useCallback((size: MobileSize) => {
    console.log('📏 모바일 크기 변경:', size);
    setSelectedMobileSizeState(size);
  }, []);

  // 패널 상태 변경 감지 및 로깅
  // 패널이 열리거나 닫힐 때만 실행되어 과도한 로깅을 방지합니다
  useEffect(() => {
    if (prevPanelStateRef.current !== isPreviewPanelOpen) {
      console.log(
        `🎯 미리보기 패널 상태 변경: ${isPreviewPanelOpen ? '열림' : '닫힘'} (${
          isMobile ? '모바일' : '데스크톱'
        })`
      );
      prevPanelStateRef.current = isPreviewPanelOpen;
    }
  }, [isPreviewPanelOpen, isMobile]);

  // 모바일 상태 변경 시 패널 상태 초기화
  // 모바일↔데스크톱 전환 시 패널을 닫아 UX를 개선합니다
  useEffect(() => {
    // 모바일에서 데스크톱으로 전환 시에만 패널 닫기
    // 데스크톱에서는 패널이 항상 보이도록 하기 위함입니다
    if (!isMobile && isPreviewPanelOpen) {
      console.log('💻 데스크톱 모드로 전환 - 패널 상태 유지');
    } else if (isMobile && !isPreviewPanelOpen) {
      console.log('📱 모바일 모드로 전환 - 패널 상태 유지');
    }
  }, [isMobile, isPreviewPanelOpen, setIsPreviewPanelOpen]);

  // 반환 객체 메모이제이션
  // useMemo를 사용하여 의존성이 변경될 때만 새 객체를 생성합니다
  return useMemo(
    () => ({
      selectedMobileSize,
      setSelectedMobileSize,
    }),
    [selectedMobileSize, setSelectedMobileSize]
  );
}
//====여기까지 수정됨====
