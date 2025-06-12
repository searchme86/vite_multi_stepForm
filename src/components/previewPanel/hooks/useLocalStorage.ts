//====여기부터 수정됨====
// 원본 코드에서 누락된 localStorage 관리 훅
import { useEffect } from 'react';

interface UseLocalStorageProps {
  isMobile: boolean;
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: ((open: boolean) => void) | undefined;
}

export function useLocalStorage({
  isMobile,
  isPreviewPanelOpen,
  setIsPreviewPanelOpen,
}: UseLocalStorageProps) {
  console.log('💾 localStorage 훅 초기화');

  // 상태 저장
  useEffect(() => {
    if (isMobile && typeof isPreviewPanelOpen === 'boolean') {
      try {
        console.log('💾 localStorage에 상태 저장:', isPreviewPanelOpen);
        localStorage.setItem('previewPanelOpen', String(isPreviewPanelOpen));
      } catch (error) {
        console.warn('localStorage 저장 실패:', error);
      }
    }
  }, [isPreviewPanelOpen, isMobile]);

  // 상태 복원
  useEffect(() => {
    if (isMobile && setIsPreviewPanelOpen) {
      try {
        const savedState = localStorage.getItem('previewPanelOpen');
        if (savedState !== null) {
          console.log('💾 localStorage에서 상태 복원:', savedState);
          setIsPreviewPanelOpen(savedState === 'true');
        }
      } catch (error) {
        console.warn('localStorage 읽기 실패:', error);
      }
    }
  }, [isMobile, setIsPreviewPanelOpen]);
}
//====여기까지 수정됨====
