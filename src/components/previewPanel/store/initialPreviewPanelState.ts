// src/components/previewPanel/store/initialPreviewPanelState.ts

export interface PreviewPanelState {
  // 미리보기 패널 기본 상태
  isPreviewPanelOpen: boolean;

  // 디바이스 관련 상태
  deviceType: 'mobile' | 'desktop';
  selectedMobileSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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
  // 미리보기 패널 기본 상태
  isPreviewPanelOpen: false,

  // 디바이스 관련 상태
  deviceType: 'desktop',
  selectedMobileSize: 'md',

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
