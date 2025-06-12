//====여기부터 수정됨====
// localStorage 관리 훅 - 무한 렌더링 방지
import { useEffect, useRef, useCallback } from 'react';

interface UseLocalStorageProps {
  isMobile: boolean;
  isPreviewPanelOpen: boolean;
  setIsPreviewPanelOpen: (value: boolean) => void;
}

export function useLocalStorage({
  isMobile,
  isPreviewPanelOpen,
  setIsPreviewPanelOpen,
}: UseLocalStorageProps) {
  // 초기화 여부를 추적하는 ref
  // 이를 통해 첫 마운트 시에만 localStorage에서 값을 읽어옵니다
  const isInitializedRef = useRef(false);

  // 이전 값을 추적하여 불필요한 업데이트 방지
  // 값이 실제로 변경되었을 때만 localStorage에 저장합니다
  const prevStateRef = useRef<boolean | null>(null);

  // localStorage 키를 안정적으로 관리
  // 모바일/데스크톱에 따라 다른 키를 사용합니다
  const storageKey = isMobile
    ? 'preview-panel-mobile'
    : 'preview-panel-desktop';

  // localStorage에서 값을 안전하게 읽는 함수
  // try-catch로 에러를 방지하고 fallback 값을 제공합니다
  const getStoredValue = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      console.warn('localStorage 읽기 실패:', error);
      return false; // fallback 값
    }
  }, [storageKey]);

  // localStorage에 값을 안전하게 저장하는 함수
  // try-catch로 에러를 방지합니다
  const setStoredValue = useCallback(
    (value: boolean): void => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        console.warn('localStorage 저장 실패:', error);
      }
    },
    [storageKey]
  );

  // 초기 마운트 시에만 localStorage에서 값을 복원
  // 이 effect는 한 번만 실행되어 무한 루프를 방지합니다
  useEffect(() => {
    if (!isInitializedRef.current) {
      const storedValue = getStoredValue();

      // 저장된 값과 현재 상태가 다를 때만 업데이트
      // 이를 통해 불필요한 상태 변경을 방지합니다
      if (storedValue !== isPreviewPanelOpen) {
        setIsPreviewPanelOpen(storedValue);
      }

      isInitializedRef.current = true;
      prevStateRef.current = storedValue;
    }
  }, [getStoredValue, isPreviewPanelOpen, setIsPreviewPanelOpen]);

  // 상태가 변경될 때 localStorage에 저장
  // 이전 값과 비교하여 실제로 변경되었을 때만 저장합니다
  useEffect(() => {
    // 초기화가 완료된 후에만 저장 로직 실행
    // 이를 통해 초기 마운트 시 불필요한 저장을 방지합니다
    if (
      isInitializedRef.current &&
      prevStateRef.current !== isPreviewPanelOpen
    ) {
      setStoredValue(isPreviewPanelOpen);
      prevStateRef.current = isPreviewPanelOpen;

      console.log(
        `📱 ${isMobile ? '모바일' : '데스크톱'} 패널 상태 저장:`,
        isPreviewPanelOpen
      );
    }
  }, [isPreviewPanelOpen, setStoredValue, isMobile]);

  // 디바이스 타입이 변경될 때 키 변경에 따른 초기화
  // 모바일↔데스크톱 전환 시 해당 디바이스의 저장된 값을 불러옵니다
  useEffect(() => {
    if (isInitializedRef.current) {
      const storedValue = getStoredValue();

      if (storedValue !== isPreviewPanelOpen) {
        setIsPreviewPanelOpen(storedValue);
        prevStateRef.current = storedValue;
      }
    }
  }, [storageKey, getStoredValue, isPreviewPanelOpen, setIsPreviewPanelOpen]);
}
//====여기까지 수정됨====
