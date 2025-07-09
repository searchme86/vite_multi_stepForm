// src/components/previewPanel/utils/eventHandlers.ts

import { usePreviewPanelStore } from '../store/previewPanelStore';

// 전역 이벤트 디스패처 함수들
export const dispatchClosePreviewPanel = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { closePreviewPanel, closeAllModals } = usePreviewPanelStore.getState();

  // 패널과 모든 모달 닫기
  closePreviewPanel();
  closeAllModals();
};

export const dispatchOpenPreviewPanel = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { openPreviewPanel } = usePreviewPanelStore.getState();

  openPreviewPanel();
};

export const dispatchTogglePreviewPanel = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { togglePreviewPanel } = usePreviewPanelStore.getState();

  togglePreviewPanel();
};

export const dispatchOpenMobileModal = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { openMobileModal } = usePreviewPanelStore.getState();

  openMobileModal();
};

export const dispatchCloseMobileModal = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { closeMobileModal } = usePreviewPanelStore.getState();

  closeMobileModal();
};

export const dispatchOpenDesktopModal = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { openDesktopModal } = usePreviewPanelStore.getState();

  openDesktopModal();
};

export const dispatchCloseDesktopModal = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { closeDesktopModal } = usePreviewPanelStore.getState();

  closeDesktopModal();
};

export const dispatchCloseAllModals = (): void => {
  // Zustand 스토어에서 직접 액션 호출
  const { closeAllModals } = usePreviewPanelStore.getState();

  closeAllModals();
};

// 현재 상태 확인용 헬퍼 함수들
export const getCurrentPreviewPanelState = () => {
  const state = usePreviewPanelStore.getState();

  return {
    isPreviewPanelOpen: state.isPreviewPanelOpen,
    isMobileModalOpen: state.isMobileModalOpen,
    isDesktopModalOpen: state.isDesktopModalOpen,
    deviceType: state.deviceType,
    selectedMobileSize: state.selectedMobileSize,
  };
};
