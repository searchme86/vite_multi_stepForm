// src/components/previewPanel/store/setterPreviewPanel.ts

import { type PreviewPanelState } from './initialPreviewPanelState';

export interface PreviewPanelSetters {
  // 미리보기 패널 제어
  openPreviewPanel: () => void;
  closePreviewPanel: () => void;
  togglePreviewPanel: () => void;
  setIsPreviewPanelOpen: (isOpen: boolean) => void;

  // 디바이스 타입 제어
  setDeviceType: (deviceType: 'mobile' | 'desktop') => void;
  setSelectedMobileSize: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => void;

  // 모달 제어
  openMobileModal: () => void;
  closeMobileModal: () => void;
  openDesktopModal: () => void;
  closeDesktopModal: () => void;
  closeAllModals: () => void;

  // 추가 상태 제어
  setHasTabChanged: (hasChanged: boolean) => void;
  setIsMountedRef: (isMounted: boolean) => void;

  // 터치 상태 제어
  setTouchStartY: (y: number) => void;
  setTouchCurrentY: (y: number) => void;
  setIsDragging: (isDragging: boolean) => void;
  updateTouchState: (updates: {
    startY?: number;
    currentY?: number;
    isDragging?: boolean;
  }) => void;
  resetTouchState: () => void;

  // localStorage 제어
  setIsLocalStorageEnabled: (enabled: boolean) => void;

  // 디버그 제어
  setDebugMode: (enabled: boolean) => void;
  toggleDebugMode: () => void;

  // 복합 액션
  handleBackgroundClick: () => void;
  handleHeaderClick: () => void;
  handleCloseButtonClick: () => void;

  // 초기화
  resetPreviewPanelState: () => void;
}

export const createPreviewPanelSetters = (
  set: (updater: (state: PreviewPanelState) => PreviewPanelState) => void,
  get: () => PreviewPanelState
): PreviewPanelSetters => ({
  // 미리보기 패널 제어
  openPreviewPanel: () => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: true,
    }));
  },

  closePreviewPanel: () => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: false,
    }));
  },

  togglePreviewPanel: () => {
    const currentState = get();
    const newState = !currentState.isPreviewPanelOpen;

    set((state) => ({
      ...state,
      isPreviewPanelOpen: newState,
    }));
  },

  setIsPreviewPanelOpen: (isOpen: boolean) => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: isOpen,
    }));
  },

  // 디바이스 타입 제어
  setDeviceType: (deviceType: 'mobile' | 'desktop') => {
    set((state) => ({
      ...state,
      deviceType,
    }));
  },

  setSelectedMobileSize: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    set((state) => ({
      ...state,
      selectedMobileSize: size,
    }));
  },

  // 모달 제어
  openMobileModal: () => {
    set((state) => ({
      ...state,
      isMobileModalOpen: true,
    }));
  },

  closeMobileModal: () => {
    set((state) => ({
      ...state,
      isMobileModalOpen: false,
    }));
  },

  openDesktopModal: () => {
    set((state) => ({
      ...state,
      isDesktopModalOpen: true,
    }));
  },

  closeDesktopModal: () => {
    set((state) => ({
      ...state,
      isDesktopModalOpen: false,
    }));
  },

  closeAllModals: () => {
    set((state) => ({
      ...state,
      isMobileModalOpen: false,
      isDesktopModalOpen: false,
    }));
  },

  // 추가 상태 제어
  setHasTabChanged: (hasChanged: boolean) => {
    set((state) => ({
      ...state,
      hasTabChanged: hasChanged,
    }));
  },

  setIsMountedRef: (isMounted: boolean) => {
    set((state) => ({
      ...state,
      isMountedRef: isMounted,
    }));
  },

  // 터치 상태 제어
  setTouchStartY: (y: number) => {
    set((state) => ({
      ...state,
      touchStartY: y,
    }));
  },

  setTouchCurrentY: (y: number) => {
    set((state) => ({
      ...state,
      touchCurrentY: y,
    }));
  },

  setIsDragging: (isDragging: boolean) => {
    set((state) => ({
      ...state,
      isDragging,
    }));
  },

  updateTouchState: (updates: {
    startY?: number;
    currentY?: number;
    isDragging?: boolean;
  }) => {
    set((state) => ({
      ...state,
      ...(updates.startY !== undefined && { touchStartY: updates.startY }),
      ...(updates.currentY !== undefined && {
        touchCurrentY: updates.currentY,
      }),
      ...(updates.isDragging !== undefined && {
        isDragging: updates.isDragging,
      }),
    }));
  },

  resetTouchState: () => {
    set((state) => ({
      ...state,
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
    }));
  },

  // localStorage 제어
  setIsLocalStorageEnabled: (enabled: boolean) => {
    set((state) => ({
      ...state,
      isLocalStorageEnabled: enabled,
    }));
  },

  // 디버그 제어
  setDebugMode: (enabled: boolean) => {
    set((state) => ({
      ...state,
      debugMode: enabled,
    }));
  },

  toggleDebugMode: () => {
    const currentState = get();
    const newDebugMode = !currentState.debugMode;

    set((state) => ({
      ...state,
      debugMode: newDebugMode,
    }));
  },

  // 복합 액션
  handleBackgroundClick: () => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: false,
    }));
  },

  handleHeaderClick: () => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: false,
    }));
  },

  handleCloseButtonClick: () => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: false,
      isMobileModalOpen: false,
      isDesktopModalOpen: false,
    }));
  },

  // 초기화
  resetPreviewPanelState: () => {
    set((state) => ({
      ...state,
      isPreviewPanelOpen: false,
      isMobileModalOpen: false,
      isDesktopModalOpen: false,
      hasTabChanged: false,
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
    }));
  },
});
