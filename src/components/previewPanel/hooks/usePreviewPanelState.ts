// 미리보기 패널 상태 관리 훅
import { useState, useEffect } from 'react';
import { MODAL_SIZES } from '../utils/constants';
import {
  addClosePreviewPanelListener,
  addEscapeKeyListener,
  toggleBodyScrollClass,
} from '../utils/eventHandlers';

interface UsePreviewPanelStateProps {
  isMobile: boolean;
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (open: boolean) => void;
}

export function usePreviewPanelState({
  isMobile,
  isPreviewPanelOpen,
  setIsPreviewPanelOpen,
}: UsePreviewPanelStateProps) {
  console.log('🎛️ 패널 상태 관리 초기화');

  const [selectedMobileSize, setSelectedMobileSize] = useState<string>(
    MODAL_SIZES.MOBILE_360
  );

  useEffect(() => {
    console.log('👂 패널 닫기 이벤트 리스너 설정');
    const handleCloseEvent = () => {
      if (
        setIsPreviewPanelOpen &&
        typeof setIsPreviewPanelOpen === 'function'
      ) {
        console.log('🔄 패널 닫기 이벤트 처리');
        setIsPreviewPanelOpen(false);
      }
    };

    return addClosePreviewPanelListener(handleCloseEvent);
  }, [setIsPreviewPanelOpen]);

  useEffect(() => {
    console.log('⌨️ ESC 키 리스너 설정');
    const dispatchClose = () => {
      const closeEvent = new CustomEvent('closePreviewPanel');
      window.dispatchEvent(closeEvent);
    };

    return addEscapeKeyListener(isMobile, isPreviewPanelOpen, dispatchClose);
  }, [isMobile, isPreviewPanelOpen]);

  useEffect(() => {
    console.log('🔒 body 스크롤 제어 설정');
    return toggleBodyScrollClass(isMobile, isPreviewPanelOpen);
  }, [isMobile, isPreviewPanelOpen]);

  return {
    selectedMobileSize,
    setSelectedMobileSize,
  };
}
