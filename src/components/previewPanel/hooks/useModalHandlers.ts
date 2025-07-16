// src/components/previewPanel/hooks/useModalHandlers.ts

import { useCallback, useMemo } from 'react';
import { usePreviewPanelStore } from '../store/previewPanelStore';

// 반환 타입 정의
interface UseModalHandlersReturn {
  isMobileModalOpen: boolean;
  isDesktopModalOpen: boolean;
  handleMobileModalOpen: () => void;
  handleMobileModalClose: () => void;
  handleDesktopModalOpen: () => void;
  handleDesktopModalClose: () => void;
}

/**
 * 모달 핸들러 훅 - PreviewPanelStore 통합 버전
 *
 * 수정사항:
 * - 함수 존재 체크 제거 (항상 정의되므로 불필요한 체크)
 * - 타입 안전성 향상
 *
 * @returns 모달 상태와 핸들러 함수들
 */
export function useModalHandlers(): UseModalHandlersReturn {
  console.log('🔧 [MODAL_HANDLERS] 훅 초기화 (PreviewPanelStore 통합 버전)');

  // 🎯 PreviewPanelStore에서 모바일 모달 상태 가져오기
  const isMobileModalOpen = usePreviewPanelStore(
    (state) => state.isMobileModalOpen
  );

  // 🎯 PreviewPanelStore에서 데스크톱 모달 상태 가져오기
  const isDesktopModalOpen = usePreviewPanelStore(
    (state) => state.isDesktopModalOpen
  );

  // 🎯 PreviewPanelStore에서 모바일 모달 액션들 가져오기
  const storeOpenMobileModal = usePreviewPanelStore(
    (state) => state.openMobileModal
  );
  const storeCloseMobileModal = usePreviewPanelStore(
    (state) => state.closeMobileModal
  );

  // 🎯 PreviewPanelStore에서 데스크톱 모달 액션들 가져오기
  const storeOpenDesktopModal = usePreviewPanelStore(
    (state) => state.openDesktopModal
  );
  const storeCloseDesktopModal = usePreviewPanelStore(
    (state) => state.closeDesktopModal
  );

  console.log('🔧 [MODAL_HANDLERS] 현재 모달 상태:', {
    isMobileModalOpen,
    isDesktopModalOpen,
    timestamp: new Date().toISOString(),
  });

  // 🎯 모바일 모달 열기 핸들러 - PreviewPanelStore 액션 사용
  const handleMobileModalOpen = useCallback(() => {
    console.log('📱 [MODAL_HANDLERS] 모바일 모달 열기 요청:', {
      currentState: isMobileModalOpen,
      action: 'OPEN_MOBILE_MODAL',
      timestamp: new Date().toISOString(),
    });

    storeOpenMobileModal();

    console.log('✅ [MODAL_HANDLERS] 모바일 모달 열기 완료');
  }, [isMobileModalOpen, storeOpenMobileModal]);

  // 🎯 모바일 모달 닫기 핸들러 - PreviewPanelStore 액션 사용
  const handleMobileModalClose = useCallback(() => {
    console.log('📱 [MODAL_HANDLERS] 모바일 모달 닫기 요청:', {
      currentState: isMobileModalOpen,
      action: 'CLOSE_MOBILE_MODAL',
      timestamp: new Date().toISOString(),
    });

    storeCloseMobileModal();

    console.log('✅ [MODAL_HANDLERS] 모바일 모달 닫기 완료');
  }, [isMobileModalOpen, storeCloseMobileModal]);

  // 🎯 데스크톱 모달 열기 핸들러 - PreviewPanelStore 액션 사용
  const handleDesktopModalOpen = useCallback(() => {
    console.log('🖥️ [MODAL_HANDLERS] 데스크톱 모달 열기 요청:', {
      currentState: isDesktopModalOpen,
      action: 'OPEN_DESKTOP_MODAL',
      timestamp: new Date().toISOString(),
    });

    storeOpenDesktopModal();

    console.log('✅ [MODAL_HANDLERS] 데스크톱 모달 열기 완료');
  }, [isDesktopModalOpen, storeOpenDesktopModal]);

  // 🎯 데스크톱 모달 닫기 핸들러 - PreviewPanelStore 액션 사용
  const handleDesktopModalClose = useCallback(() => {
    console.log('🖥️ [MODAL_HANDLERS] 데스크톱 모달 닫기 요청:', {
      currentState: isDesktopModalOpen,
      action: 'CLOSE_DESKTOP_MODAL',
      timestamp: new Date().toISOString(),
    });

    storeCloseDesktopModal();

    console.log('✅ [MODAL_HANDLERS] 데스크톱 모달 닫기 완료');
  }, [isDesktopModalOpen, storeCloseDesktopModal]);

  // 모든 모달 관련 상태와 핸들러를 메모이제이션
  const returnValue = useMemo((): UseModalHandlersReturn => {
    console.log('🔄 [MODAL_HANDLERS] 반환 객체 생성:', {
      isMobileModalOpen,
      isDesktopModalOpen,
      timestamp: new Date().toISOString(),
    });

    return {
      isMobileModalOpen,
      isDesktopModalOpen,
      handleMobileModalOpen,
      handleMobileModalClose,
      handleDesktopModalOpen,
      handleDesktopModalClose,
    };
  }, [
    isMobileModalOpen,
    isDesktopModalOpen,
    handleMobileModalOpen,
    handleMobileModalClose,
    handleDesktopModalOpen,
    handleDesktopModalClose,
  ]);

  console.log('✅ [MODAL_HANDLERS] 훅 초기화 완료 (PreviewPanelStore 통합)');

  return returnValue;
}
