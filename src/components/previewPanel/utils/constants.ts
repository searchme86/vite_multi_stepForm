// 미리보기 패널 상수 정의
export const DEFAULT_AVATAR_SRC =
  'https://img.heroui.chat/image/avatar?w=200&h=200&u=1';
export const DEFAULT_NICKNAME = 'User';
export const DEFAULT_HERO_IMAGE =
  'https://img.heroui.chat/image/places?w=800&h=600&u=1';
export const DEFAULT_DESKTOP_HERO_IMAGE =
  'https://img.heroui.chat/image/places?w=1200&h=600&u=1';

export const MOBILE_BREAKPOINT = 768;
export const TOUCH_THRESHOLD = 5;
export const SWIPE_THRESHOLD = 100;
export const DRAGGING_TIMEOUT = 100;

export const MODAL_SIZES = {
  MOBILE_360: '360',
  MOBILE_768: '768',
} as const;

export const CSS_CLASSES = {
  PREVIEW_PANEL_OPEN: 'preview-panel-open',
  PREVIEW_PANEL_DESKTOP: 'preview-panel-desktop',
  PREVIEW_PANEL_BOTTOM_SHEET: 'preview-panel-bottom-sheet',
} as const;

export const EVENT_NAMES = {
  CLOSE_PREVIEW_PANEL: 'closePreviewPanel',
} as const;
