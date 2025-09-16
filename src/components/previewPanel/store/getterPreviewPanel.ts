// src/components/previewPanel/store/getterPreviewPanel.ts

import type { PreviewPanelState } from './initialPreviewPanelState';
import type { MobileDeviceSize } from '../types/previewPanel.types';

export interface PreviewPanelGetters {
  // 기본 상태 getter
  getIsPreviewOpen: () => boolean;
  getDeviceType: () => 'mobile' | 'desktop';
  getSelectedMobileSize: () => MobileDeviceSize;

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
    const currentState = get();
    const { isPreviewPanelOpen } = currentState;
    return isPreviewPanelOpen;
  },

  getDeviceType: () => {
    const currentState = get();
    const { deviceType } = currentState;
    return deviceType;
  },

  // 🎯 모바일 사이즈 getter - 360, 768 픽셀 기반으로 변경
  getSelectedMobileSize: () => {
    const currentState = get();
    const { selectedMobileSize } = currentState;
    return selectedMobileSize;
  },

  // 모달 상태 getter
  getIsMobileModalOpen: () => {
    const currentState = get();
    const { isMobileModalOpen } = currentState;
    return isMobileModalOpen;
  },

  getIsDesktopModalOpen: () => {
    const currentState = get();
    const { isDesktopModalOpen } = currentState;
    return isDesktopModalOpen;
  },

  getIsAnyModalOpen: () => {
    const currentState = get();
    const { isMobileModalOpen, isDesktopModalOpen } = currentState;
    return isMobileModalOpen || isDesktopModalOpen;
  },

  // 추가 상태 getter
  getHasTabChanged: () => {
    const currentState = get();
    const { hasTabChanged } = currentState;
    return hasTabChanged;
  },

  getIsMountedRef: () => {
    const currentState = get();
    const { isMountedRef } = currentState;
    return isMountedRef;
  },

  // 터치 상태 getter
  getTouchState: () => {
    const currentState = get();
    const { touchStartY, touchCurrentY, isDragging } = currentState;

    return {
      startY: touchStartY,
      currentY: touchCurrentY,
      isDragging,
    };
  },

  // 복합 상태 getter
  getShouldShowMobileOverlay: () => {
    const currentState = get();
    const { deviceType, isPreviewPanelOpen } = currentState;
    const isMobileDevice = deviceType === 'mobile';
    const isPanelOpen = isPreviewPanelOpen;

    return isMobileDevice && isPanelOpen;
  },

  getShouldShowPanel: () => {
    const currentState = get();
    const { isPreviewPanelOpen } = currentState;
    return isPreviewPanelOpen;
  },

  getPanelTransformClass: () => {
    const currentState = get();
    const { deviceType, isPreviewPanelOpen } = currentState;
    const isMobileDevice = deviceType === 'mobile';
    const isPanelOpen = isPreviewPanelOpen;

    const isMobileAndClosed = isMobileDevice && !isPanelOpen;

    return isMobileAndClosed ? 'translate-y-full' : 'translate-y-0';
  },

  // localStorage 상태 getter
  getIsLocalStorageEnabled: () => {
    const currentState = get();
    const { isLocalStorageEnabled } = currentState;
    return isLocalStorageEnabled;
  },

  // 디버그 상태 getter
  getDebugMode: () => {
    const currentState = get();
    const { debugMode } = currentState;
    return debugMode;
  },
});
