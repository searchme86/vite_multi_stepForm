//====여기부터 수정됨====
// 모달 핸들러 훅 - 무한 렌더링 방지
import { useState, useCallback, useMemo } from 'react';

// 반환 타입 정의
interface UseModalHandlersReturn {
  isMobileModalOpen: boolean;
  isDesktopModalOpen: boolean;
  handleMobileModalOpen: () => void;
  handleMobileModalClose: () => void;
  handleDesktopModalOpen: () => void;
  handleDesktopModalClose: () => void;
}

export function useModalHandlers(): UseModalHandlersReturn {
  // 모바일 모달 상태 관리
  // 모바일 미리보기 모달의 열림/닫힘 상태를 관리합니다
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);

  // 데스크톱 모달 상태 관리
  // 데스크톱 미리보기 모달의 열림/닫힘 상태를 관리합니다
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState<boolean>(false);

  // 모바일 모달 열기 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleMobileModalOpen = useCallback(() => {
    console.log('📱 모바일 모달 열기');
    setIsMobileModalOpen(true);
  }, []);

  // 모바일 모달 닫기 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleMobileModalClose = useCallback(() => {
    console.log('📱 모바일 모달 닫기');
    setIsMobileModalOpen(false);
  }, []);

  // 데스크톱 모달 열기 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleDesktopModalOpen = useCallback(() => {
    console.log('🖥️ 데스크톱 모달 열기');
    setIsDesktopModalOpen(true);
  }, []);

  // 데스크톱 모달 닫기 핸들러 메모이제이션
  // useCallback을 사용하여 함수의 참조 안정성을 보장합니다
  const handleDesktopModalClose = useCallback(() => {
    console.log('🖥️ 데스크톱 모달 닫기');
    setIsDesktopModalOpen(false);
  }, []);

  // 모든 모달 관련 상태와 핸들러를 메모이제이션
  // useMemo를 사용하여 의존성이 변경될 때만 새 객체를 생성합니다
  // 이는 이 훅을 사용하는 컴포넌트의 불필요한 리렌더링을 방지합니다
  return useMemo(
    () => ({
      isMobileModalOpen,
      isDesktopModalOpen,
      handleMobileModalOpen,
      handleMobileModalClose,
      handleDesktopModalOpen,
      handleDesktopModalClose,
    }),
    [
      isMobileModalOpen,
      isDesktopModalOpen,
      handleMobileModalOpen,
      handleMobileModalClose,
      handleDesktopModalOpen,
      handleDesktopModalClose,
    ]
  );
}
//====여기까지 수정됨====
