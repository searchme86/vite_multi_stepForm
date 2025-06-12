// 모달 상태 관리 훅
import { useCallback } from 'react';
import { useDisclosure } from '@heroui/react';

export function useModalHandlers() {
  console.log('🗂️ 모달 핸들러 초기화');

  const {
    isOpen: isMobileModalOpen,
    onOpen: onMobileModalOpen,
    onClose: onMobileModalClose,
  } = useDisclosure();

  const {
    isOpen: isDesktopModalOpen,
    onOpen: onDesktopModalOpen,
    onClose: onDesktopModalClose,
  } = useDisclosure();

  const handleMobileModalOpen = useCallback(() => {
    if (!isMobileModalOpen) {
      console.log('📱 모바일 모달 열기');
      onMobileModalOpen();
    }
  }, [isMobileModalOpen, onMobileModalOpen]);

  const handleMobileModalClose = useCallback(() => {
    console.log('📱 모바일 모달 닫기');
    onMobileModalClose();
  }, [onMobileModalClose]);

  const handleDesktopModalOpen = useCallback(() => {
    console.log('🖥️ 데스크탑 모달 열기');
    onDesktopModalOpen();
  }, [onDesktopModalOpen]);

  const handleDesktopModalClose = useCallback(() => {
    console.log('🖥️ 데스크탑 모달 닫기');
    onDesktopModalClose();
  }, [onDesktopModalClose]);

  return {
    isMobileModalOpen,
    isDesktopModalOpen,
    handleMobileModalOpen,
    handleMobileModalClose,
    handleDesktopModalOpen,
    handleDesktopModalClose,
  };
}
