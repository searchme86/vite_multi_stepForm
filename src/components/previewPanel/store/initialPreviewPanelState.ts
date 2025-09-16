// src/components/previewPanel/store/initialPreviewPanelState.ts

import type { MobileDeviceSize } from '../types/previewPanel.types';

export interface PreviewPanelState {
  // 미리보기 패널 기본 상태
  isPreviewPanelOpen: boolean;

  // 🎯 디바이스 관련 상태 - 360, 768 픽셀 기반으로 변경
  deviceType: 'mobile' | 'desktop';
  selectedMobileSize: MobileDeviceSize;

  // 모달 상태
  isMobileModalOpen: boolean;
  isDesktopModalOpen: boolean;

  // 추가 상태
  hasTabChanged: boolean;
  isMountedRef: boolean;

  // 터치 관련 상태
  touchStartY: number;
  touchCurrentY: number;
  isDragging: boolean;

  // localStorage 동기화 상태
  isLocalStorageEnabled: boolean;

  // 디버그 상태
  debugMode: boolean;
}

export const initialPreviewPanelState: PreviewPanelState = {
  // 미리보기 패널 기본 상태 - 모바일/데스크탑 모두 비활성화로 시작
  isPreviewPanelOpen: false,

  // 🎯 디바이스 관련 상태 - 360px 기본값으로 설정
  deviceType: 'desktop',
  selectedMobileSize: '360',

  // 모달 상태
  isMobileModalOpen: false,
  isDesktopModalOpen: false,

  // 추가 상태
  hasTabChanged: false,
  isMountedRef: false,

  // 터치 관련 상태
  touchStartY: 0,
  touchCurrentY: 0,
  isDragging: false,

  // localStorage 동기화 상태
  isLocalStorageEnabled: true,

  // 디버그 상태
  debugMode: false,
};
