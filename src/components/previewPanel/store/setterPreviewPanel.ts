// src/components/previewPanel/store/setterPreviewPanel.ts

import type { PreviewPanelState } from './initialPreviewPanelState';

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
  stateUpdater: (
    updater: (state: PreviewPanelState) => PreviewPanelState
  ) => void,
  stateGetter: () => PreviewPanelState
): PreviewPanelSetters => ({
  // 미리보기 패널 제어
  openPreviewPanel: () => {
    console.log('🔓 [SETTER] 미리보기 패널 열기 액션 실행:', {
      action: 'OPEN_PANEL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isPreviewPanelOpen: true,
    }));
  },

  closePreviewPanel: () => {
    console.log('🔒 [SETTER] 미리보기 패널 닫기 액션 실행:', {
      action: 'CLOSE_PANEL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isPreviewPanelOpen: false,
    }));
  },

  togglePreviewPanel: () => {
    const currentState = stateGetter();
    const newState = !currentState.isPreviewPanelOpen;

    console.log('🔄 [SETTER] 미리보기 패널 토글 액션:', {
      from: currentState.isPreviewPanelOpen,
      to: newState,
      action: newState ? 'OPEN_PANEL' : 'CLOSE_PANEL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((prevState) => ({
      ...prevState,
      isPreviewPanelOpen: newState,
    }));
  },

  setIsPreviewPanelOpen: (isOpen: boolean) => {
    console.log('⚙️ [SETTER] 미리보기 패널 상태 직접 설정:', {
      newState: isOpen,
      action: isOpen ? 'OPEN_PANEL' : 'CLOSE_PANEL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isPreviewPanelOpen: isOpen,
    }));
  },

  // 디바이스 타입 제어
  setDeviceType: (deviceTypeValue: 'mobile' | 'desktop') => {
    console.log('📱 [SETTER] 디바이스 타입 설정:', {
      deviceType: deviceTypeValue,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      deviceType: deviceTypeValue,
    }));
  },

  setSelectedMobileSize: (sizeValue: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    console.log('📏 [SETTER] 모바일 사이즈 선택:', {
      size: sizeValue,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      selectedMobileSize: sizeValue,
    }));
  },

  // 모달 제어
  openMobileModal: () => {
    console.log('📱 [SETTER] 모바일 모달 열기:', {
      action: 'OPEN_MOBILE_MODAL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isMobileModalOpen: true,
    }));
  },

  closeMobileModal: () => {
    console.log('📱 [SETTER] 모바일 모달 닫기:', {
      action: 'CLOSE_MOBILE_MODAL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isMobileModalOpen: false,
    }));
  },

  openDesktopModal: () => {
    console.log('🖥️ [SETTER] 데스크탑 모달 열기:', {
      action: 'OPEN_DESKTOP_MODAL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isDesktopModalOpen: true,
    }));
  },

  closeDesktopModal: () => {
    console.log('🖥️ [SETTER] 데스크탑 모달 닫기:', {
      action: 'CLOSE_DESKTOP_MODAL',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isDesktopModalOpen: false,
    }));
  },

  closeAllModals: () => {
    console.log('🔒 [SETTER] 모든 모달 닫기:', {
      action: 'CLOSE_ALL_MODALS',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isMobileModalOpen: false,
      isDesktopModalOpen: false,
    }));
  },

  // 추가 상태 제어
  setHasTabChanged: (hasChangedValue: boolean) => {
    console.log('🔄 [SETTER] 탭 변경 상태 설정:', {
      hasChanged: hasChangedValue,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      hasTabChanged: hasChangedValue,
    }));
  },

  setIsMountedRef: (isMountedValue: boolean) => {
    console.log('🔧 [SETTER] 마운트 상태 설정:', {
      isMounted: isMountedValue,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isMountedRef: isMountedValue,
    }));
  },

  // 터치 상태 제어
  setTouchStartY: (yValue: number) => {
    stateUpdater((currentState) => ({
      ...currentState,
      touchStartY: yValue,
    }));
  },

  setTouchCurrentY: (yValue: number) => {
    stateUpdater((currentState) => ({
      ...currentState,
      touchCurrentY: yValue,
    }));
  },

  setIsDragging: (isDraggingValue: boolean) => {
    stateUpdater((currentState) => ({
      ...currentState,
      isDragging: isDraggingValue,
    }));
  },

  updateTouchState: (touchUpdates: {
    startY?: number;
    currentY?: number;
    isDragging?: boolean;
  }) => {
    const { startY, currentY, isDragging } = touchUpdates;

    console.log('👆 [SETTER] 터치 상태 업데이트:', {
      startY,
      currentY,
      isDragging,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      ...(startY !== undefined && { touchStartY: startY }),
      ...(currentY !== undefined && { touchCurrentY: currentY }),
      ...(isDragging !== undefined && { isDragging }),
    }));
  },

  resetTouchState: () => {
    console.log('🔄 [SETTER] 터치 상태 초기화:', {
      action: 'RESET_TOUCH_STATE',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      touchStartY: 0,
      touchCurrentY: 0,
      isDragging: false,
    }));
  },

  // localStorage 제어
  setIsLocalStorageEnabled: (enabledValue: boolean) => {
    console.log('💾 [SETTER] localStorage 활성화 설정:', {
      enabled: enabledValue,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isLocalStorageEnabled: enabledValue,
    }));
  },

  // 디버그 제어
  setDebugMode: (enabledValue: boolean) => {
    console.log('🐛 [SETTER] 디버그 모드 설정:', {
      enabled: enabledValue,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      debugMode: enabledValue,
    }));
  },

  toggleDebugMode: () => {
    const currentState = stateGetter();
    const newDebugMode = !currentState.debugMode;

    console.log('🔄 [SETTER] 디버그 모드 토글:', {
      from: currentState.debugMode,
      to: newDebugMode,
      timestamp: new Date().toISOString(),
    });

    stateUpdater((prevState) => ({
      ...prevState,
      debugMode: newDebugMode,
    }));
  },

  // 복합 액션
  handleBackgroundClick: () => {
    console.log('🖱️ [SETTER] 배경 클릭 액션:', {
      action: 'CLOSE_PANEL',
      trigger: 'background_click',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isPreviewPanelOpen: false,
    }));
  },

  handleHeaderClick: () => {
    console.log('🖱️ [SETTER] 헤더 클릭 액션:', {
      action: 'CLOSE_PANEL',
      trigger: 'header_click',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isPreviewPanelOpen: false,
    }));
  },

  handleCloseButtonClick: () => {
    console.log('❌ [SETTER] 닫기 버튼 클릭 액션:', {
      action: 'CLOSE_PANEL_AND_MODALS',
      trigger: 'close_button_click',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
      isPreviewPanelOpen: false,
      isMobileModalOpen: false,
      isDesktopModalOpen: false,
    }));
  },

  // 초기화
  resetPreviewPanelState: () => {
    console.log('🔄 [SETTER] 미리보기 패널 상태 전체 초기화:', {
      action: 'RESET_ALL_STATE',
      timestamp: new Date().toISOString(),
    });

    stateUpdater((currentState) => ({
      ...currentState,
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
