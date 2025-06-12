// 이벤트 핸들러 유틸리티 함수들
import { EVENT_NAMES } from './constants';

export function dispatchClosePreviewPanel(): void {
  console.log('🔄 closePreviewPanel 이벤트 디스패치');
  const closeEvent = new CustomEvent(EVENT_NAMES.CLOSE_PREVIEW_PANEL);
  window.dispatchEvent(closeEvent);
}

export function addClosePreviewPanelListener(handler: () => void): () => void {
  console.log('👂 closePreviewPanel 이벤트 리스너 추가');
  window.addEventListener(EVENT_NAMES.CLOSE_PREVIEW_PANEL, handler);

  return () => {
    console.log('🗑️ closePreviewPanel 이벤트 리스너 제거');
    window.removeEventListener(EVENT_NAMES.CLOSE_PREVIEW_PANEL, handler);
  };
}

export function addEscapeKeyListener(
  isMobile: boolean,
  isPreviewPanelOpen: boolean,
  handler: () => void
): () => void {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isMobile && isPreviewPanelOpen) {
      console.log('⌨️ ESC 키 눌림 - 패널 닫기');
      handler();
    }
  };

  document.addEventListener('keydown', handleEsc);

  return () => {
    document.removeEventListener('keydown', handleEsc);
  };
}

export function toggleBodyScrollClass(
  isMobile: boolean,
  isPreviewPanelOpen: boolean
): () => void {
  const className = 'preview-panel-open';

  if (isMobile && isPreviewPanelOpen) {
    console.log('🔒 body 스크롤 비활성화');
    document.body.classList.add(className);
  } else {
    console.log('🔓 body 스크롤 활성화');
    document.body.classList.remove(className);
  }

  return () => {
    document.body.classList.remove(className);
  };
}
