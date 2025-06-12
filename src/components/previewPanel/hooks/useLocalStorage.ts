//====여기부터 수정됨====
// localStorage 관리 훅 - localStorageCleanup 유틸리티 활용으로 더 안전하게
import { useEffect, useRef, useCallback } from 'react';
import {
  safeGetLocalStorage,
  safeSetLocalStorage,
  cleanupPreviewPanelStorage,
} from '../utils/localStorageCleanup';

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
  // 컴포넌트가 처음 마운트될 때만 localStorage에서 값을 읽어오기 위함
  const isInitializedRef = useRef(false);

  // 이전 값을 추적하여 불필요한 업데이트 방지
  // 실제로 값이 변경되었을 때만 localStorage에 저장하기 위함
  const prevStateRef = useRef<boolean | null>(null);

  // 정리 작업이 완료되었는지 추적
  // 앱 시작 시 한 번만 localStorage 정리 작업을 수행하기 위함
  const isCleanupDoneRef = useRef(false);

  // localStorage 키를 디바이스 타입에 따라 동적으로 생성
  // 모바일과 데스크톱의 패널 상태를 별도로 관리하기 위함
  const storageKey = isMobile
    ? 'preview-panel-mobile'
    : 'preview-panel-desktop';

  // 안전한 localStorage 읽기 함수 - 유틸리티 활용
  // localStorageCleanup의 safeGetLocalStorage를 사용하여 타입 안정성과 에러 처리를 보장
  const getStoredValue = useCallback((): boolean => {
    // safeGetLocalStorage: 타입 체크, 에러 처리, 자동 정리 기능이 포함된 안전한 읽기 함수
    // 두 번째 매개변수(false)는 기본값으로, 읽기 실패 시 반환될 값
    return safeGetLocalStorage(storageKey, false);
  }, [storageKey]);

  // 안전한 localStorage 저장 함수 - 유틸리티 활용
  // localStorageCleanup의 safeSetLocalStorage를 사용하여 안전한 저장을 보장
  const setStoredValue = useCallback(
    (value: boolean): void => {
      // safeSetLocalStorage: undefined/null 체크, JSON.stringify 에러 처리가 포함된 안전한 저장 함수
      // boolean 값만 저장하도록 보장하여 "undefined" 문자열 저장 문제를 방지
      const success = safeSetLocalStorage(storageKey, value);

      if (!success) {
        console.warn(`localStorage 저장 실패: ${storageKey} = ${value}`);
      }
    },
    [storageKey]
  );

  // 앱 시작 시 localStorage 정리 작업
  // 잘못된 값들("undefined", 파싱 불가능한 값 등)을 정리하여 에러 방지
  useEffect(() => {
    if (!isCleanupDoneRef.current) {
      console.log('🧹 localStorage 정리 작업 시작');
      // cleanupPreviewPanelStorage: 미리보기 패널 관련 잘못된 localStorage 값들을 정리
      // 이 함수가 "undefined" 문자열이나 파싱 불가능한 값들을 자동으로 제거
      cleanupPreviewPanelStorage();
      isCleanupDoneRef.current = true;
      console.log('✅ localStorage 정리 작업 완료');
    }
  }, []); // 빈 의존성 배열로 앱 시작 시 한 번만 실행

  // 초기 마운트 시 localStorage에서 값을 복원
  // 정리 작업이 완료된 후에 안전하게 값을 읽어옴
  useEffect(() => {
    // 초기화가 아직 안 되었고, 정리 작업이 완료된 경우에만 실행
    if (!isInitializedRef.current && isCleanupDoneRef.current) {
      console.log(`📖 localStorage에서 ${storageKey} 값 읽기 시작`);

      // 안전한 읽기 함수를 사용하여 저장된 값 가져오기
      // 이미 정리된 localStorage에서 값을 읽으므로 에러 발생 가능성이 매우 낮음
      const storedValue = getStoredValue();
      console.log(`📖 읽어온 값: ${storedValue}`);

      // 저장된 값과 현재 상태가 다를 때만 업데이트
      // 불필요한 상태 변경과 리렌더링을 방지
      if (storedValue !== isPreviewPanelOpen) {
        console.log(`🔄 상태 업데이트: ${isPreviewPanelOpen} → ${storedValue}`);
        setIsPreviewPanelOpen(storedValue);
      }

      // 초기화 완료 표시 및 이전 값 저장
      isInitializedRef.current = true;
      prevStateRef.current = storedValue;
    }
  }, [getStoredValue, isPreviewPanelOpen, setIsPreviewPanelOpen]); // 정리 작업 완료 여부도 의존성에 포함

  // 상태가 변경될 때 localStorage에 저장
  // 초기화가 완료된 후에만 저장 로직을 실행하여 초기 마운트 시 불필요한 저장 방지
  useEffect(() => {
    // 초기화 완료 && 이전 값과 현재 값이 다름 && 정리 작업 완료
    if (
      isInitializedRef.current &&
      isCleanupDoneRef.current &&
      prevStateRef.current !== isPreviewPanelOpen
    ) {
      console.log(
        `💾 localStorage에 저장: ${storageKey} = ${isPreviewPanelOpen}`
      );

      // 안전한 저장 함수를 사용하여 localStorage에 저장
      // safeSetLocalStorage가 모든 에러 처리와 타입 체크를 담당
      setStoredValue(isPreviewPanelOpen);

      // 이전 값 업데이트
      prevStateRef.current = isPreviewPanelOpen;

      console.log(
        `📱 ${isMobile ? '모바일' : '데스크톱'} 패널 상태 저장 완료:`,
        isPreviewPanelOpen
      );
    }
  }, [isPreviewPanelOpen, setStoredValue, isMobile]);

  // 디바이스 타입이 변경될 때 키 변경에 따른 초기화
  // 모바일↔데스크톱 전환 시 해당 디바이스의 저장된 값을 불러오기
  useEffect(() => {
    // 초기화가 완료되고 정리 작업도 완료된 경우에만 실행
    if (isInitializedRef.current && isCleanupDoneRef.current) {
      console.log(
        `🔄 디바이스 타입 변경 감지, 새로운 키로 값 읽기: ${storageKey}`
      );

      // 새로운 키로 저장된 값을 안전하게 읽어오기
      const storedValue = getStoredValue();

      // 읽어온 값이 현재 상태와 다르면 업데이트
      if (storedValue !== isPreviewPanelOpen) {
        console.log(
          `🔄 디바이스 전환으로 상태 업데이트: ${isPreviewPanelOpen} → ${storedValue}`
        );
        setIsPreviewPanelOpen(storedValue);
        prevStateRef.current = storedValue;
      }
    }
  }, [storageKey, getStoredValue, isPreviewPanelOpen, setIsPreviewPanelOpen]);
}

// 📋 이 훅의 작동 순서:
// 1. 컴포넌트 마운트 시 localStorage 정리 (cleanupPreviewPanelStorage)
// 2. 정리 완료 후 안전하게 저장된 값 읽기 (safeGetLocalStorage)
// 3. 상태 변경 시 안전하게 값 저장 (safeSetLocalStorage)
// 4. 디바이스 타입 변경 시 해당 키의 값으로 상태 업데이트

// 🛡️ 안전성 보장:
// - localStorageCleanup 유틸리티가 모든 에러 상황을 처리
// - "undefined" 문자열, 파싱 불가능한 값, 타입 불일치 등 자동 해결
// - 에러 발생 시 자동으로 문제가 있는 키를 정리하여 다음 실행 시 정상 작동
//====여기까지 수정됨====
