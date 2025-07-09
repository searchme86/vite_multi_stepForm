// src/components/previewPanel/store/getterPreviewPanel.ts

import { type PreviewPanelState } from './initialPreviewPanelState';

export interface PreviewPanelGetters {
  // 기본 상태 getter
  getIsPreviewOpen: () => boolean;
  getDeviceType: () => 'mobile' | 'desktop';
  getSelectedMobileSize: () => 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // 모달 상태 getter
  getIsMobileModalOpen: () => boolean;
  getIsDesktopModalOpen: () => boolean;
  getIsAnyModalOpen: () => boolean;

  // 추가 상태 getter
  getHasTabChanged: () => boolean;
  getIsMountedRef: () => boolean;

  // 터치 상태 getter
  getTouchState: () => {
    startY: number;
    currentY: number;
    isDragging: boolean;
  };

  // 복합 상태 getter
  getShouldShowMobileOverlay: () => boolean;
  getShouldShowPanel: () => boolean;
  getPanelTransformClass: () => string;

  // localStorage 상태 getter
  getIsLocalStorageEnabled: () => boolean;

  // 디버그 상태 getter
  getDebugMode: () => boolean;
}

export const createPreviewPanelGetters = (
  get: () => PreviewPanelState
): PreviewPanelGetters => ({
  // 기본 상태 getter
  getIsPreviewOpen: () => {
    const state = get();
    return state.isPreviewPanelOpen;
  },

  getDeviceType: () => {
    const state = get();
    return state.deviceType;
  },

  getSelectedMobileSize: () => {
    const state = get();
    return state.selectedMobileSize;
  },

  // 모달 상태 getter
  getIsMobileModalOpen: () => {
    const state = get();
    return state.isMobileModalOpen;
  },

  getIsDesktopModalOpen: () => {
    const state = get();
    return state.isDesktopModalOpen;
  },

  getIsAnyModalOpen: () => {
    const state = get();
    return state.isMobileModalOpen || state.isDesktopModalOpen;
  },

  // 추가 상태 getter
  getHasTabChanged: () => {
    const state = get();
    return state.hasTabChanged;
  },

  getIsMountedRef: () => {
    const state = get();
    return state.isMountedRef;
  },

  // 터치 상태 getter
  getTouchState: () => {
    const state = get();
    return {
      startY: state.touchStartY,
      currentY: state.touchCurrentY,
      isDragging: state.isDragging,
    };
  },

  // 복합 상태 getter
  getShouldShowMobileOverlay: () => {
    const state = get();
    return state.deviceType === 'mobile' && state.isPreviewPanelOpen;
  },

  getShouldShowPanel: () => {
    const state = get();
    return state.isPreviewPanelOpen;
  },

  getPanelTransformClass: () => {
    const state = get();
    const isMobile = state.deviceType === 'mobile';

    if (isMobile && !state.isPreviewPanelOpen) {
      return 'translate-y-full';
    }
    return 'translate-y-0';
  },

  // localStorage 상태 getter
  getIsLocalStorageEnabled: () => {
    const state = get();
    return state.isLocalStorageEnabled;
  },

  // 디버그 상태 getter
  getDebugMode: () => {
    const state = get();
    return state.debugMode;
  },
});
