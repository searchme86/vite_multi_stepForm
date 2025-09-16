// src/components/previewPanel/utils/eventHandlers.ts

import { usePreviewPanelStore } from '../store/previewPanelStore';

// 전역 이벤트 디스패처 함수들
export const dispatchClosePreviewPanel = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 미리보기 패널 닫기 디스패치:', {
    action: 'CLOSE_PANEL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { closePreviewPanel, closeAllModals } = storeState;

    // 패널과 모든 모달 닫기
    closePreviewPanel();
    closeAllModals();

    console.log('✅ [EVENT_DISPATCH] 미리보기 패널 닫기 성공');
  } catch (dispatchError) {
    console.error(
      '❌ [EVENT_DISPATCH] 미리보기 패널 닫기 실패:',
      dispatchError
    );
  }
};

export const dispatchOpenPreviewPanel = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 미리보기 패널 열기 디스패치:', {
    action: 'OPEN_PANEL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { openPreviewPanel } = storeState;

    openPreviewPanel();

    console.log('✅ [EVENT_DISPATCH] 미리보기 패널 열기 성공');
  } catch (dispatchError) {
    console.error(
      '❌ [EVENT_DISPATCH] 미리보기 패널 열기 실패:',
      dispatchError
    );
  }
};

export const dispatchTogglePreviewPanel = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 미리보기 패널 토글 디스패치:', {
    action: 'TOGGLE_PANEL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { togglePreviewPanel } = storeState;

    togglePreviewPanel();

    console.log('✅ [EVENT_DISPATCH] 미리보기 패널 토글 성공');
  } catch (dispatchError) {
    console.error(
      '❌ [EVENT_DISPATCH] 미리보기 패널 토글 실패:',
      dispatchError
    );
  }
};

export const dispatchOpenMobileModal = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 모바일 모달 열기 디스패치:', {
    action: 'OPEN_MOBILE_MODAL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { openMobileModal } = storeState;

    openMobileModal();

    console.log('✅ [EVENT_DISPATCH] 모바일 모달 열기 성공');
  } catch (dispatchError) {
    console.error('❌ [EVENT_DISPATCH] 모바일 모달 열기 실패:', dispatchError);
  }
};

export const dispatchCloseMobileModal = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 모바일 모달 닫기 디스패치:', {
    action: 'CLOSE_MOBILE_MODAL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { closeMobileModal } = storeState;

    closeMobileModal();

    console.log('✅ [EVENT_DISPATCH] 모바일 모달 닫기 성공');
  } catch (dispatchError) {
    console.error('❌ [EVENT_DISPATCH] 모바일 모달 닫기 실패:', dispatchError);
  }
};

export const dispatchOpenDesktopModal = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 데스크탑 모달 열기 디스패치:', {
    action: 'OPEN_DESKTOP_MODAL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { openDesktopModal } = storeState;

    openDesktopModal();

    console.log('✅ [EVENT_DISPATCH] 데스크탑 모달 열기 성공');
  } catch (dispatchError) {
    console.error(
      '❌ [EVENT_DISPATCH] 데스크탑 모달 열기 실패:',
      dispatchError
    );
  }
};

export const dispatchCloseDesktopModal = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 데스크탑 모달 닫기 디스패치:', {
    action: 'CLOSE_DESKTOP_MODAL',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { closeDesktopModal } = storeState;

    closeDesktopModal();

    console.log('✅ [EVENT_DISPATCH] 데스크탑 모달 닫기 성공');
  } catch (dispatchError) {
    console.error(
      '❌ [EVENT_DISPATCH] 데스크탑 모달 닫기 실패:',
      dispatchError
    );
  }
};

export const dispatchCloseAllModals = (): void => {
  console.log('🚨 [EVENT_DISPATCH] 모든 모달 닫기 디스패치:', {
    action: 'CLOSE_ALL_MODALS',
    timestamp: new Date().toISOString(),
  });

  try {
    // Zustand 스토어에서 직접 액션 호출
    const storeState = usePreviewPanelStore.getState();
    const { closeAllModals } = storeState;

    closeAllModals();

    console.log('✅ [EVENT_DISPATCH] 모든 모달 닫기 성공');
  } catch (dispatchError) {
    console.error('❌ [EVENT_DISPATCH] 모든 모달 닫기 실패:', dispatchError);
  }
};

// 현재 상태 확인용 헬퍼 함수들
export const getCurrentPreviewPanelState = () => {
  console.log('🔍 [STATE_GETTER] 현재 미리보기 패널 상태 조회 요청');

  try {
    const storeState = usePreviewPanelStore.getState();

    const currentState = {
      isPreviewPanelOpen: storeState.isPreviewPanelOpen,
      isMobileModalOpen: storeState.isMobileModalOpen,
      isDesktopModalOpen: storeState.isDesktopModalOpen,
      deviceType: storeState.deviceType,
      selectedMobileSize: storeState.selectedMobileSize,
    };

    console.log('✅ [STATE_GETTER] 현재 상태 조회 성공:', currentState);

    return currentState;
  } catch (stateError) {
    console.error('❌ [STATE_GETTER] 현재 상태 조회 실패:', stateError);

    // fallback 상태 반환
    return {
      isPreviewPanelOpen: false,
      isMobileModalOpen: false,
      isDesktopModalOpen: false,
      deviceType: 'desktop' as const,
      selectedMobileSize: 'md' as const,
    };
  }
};

// 상태 로깅 헬퍼 함수
export const logCurrentPreviewPanelState = (): void => {
  console.log('📊 [STATE_LOGGER] 현재 미리보기 패널 상태 로깅 시작');

  try {
    const currentState = getCurrentPreviewPanelState();

    console.group('📊 [STATE_LOGGER] 현재 미리보기 패널 상태');
    console.log('패널 열림:', currentState.isPreviewPanelOpen);
    console.log('모바일 모달 열림:', currentState.isMobileModalOpen);
    console.log('데스크탑 모달 열림:', currentState.isDesktopModalOpen);
    console.log('디바이스 타입:', currentState.deviceType);
    console.log('모바일 사이즈:', currentState.selectedMobileSize);
    console.log('타임스탬프:', new Date().toISOString());
    console.groupEnd();

    console.log('✅ [STATE_LOGGER] 상태 로깅 완료');
  } catch (logError) {
    console.error('❌ [STATE_LOGGER] 상태 로깅 실패:', logError);
  }
};

// 디버깅용 전체 상태 덤프 함수
export const dumpPreviewPanelState = (): void => {
  console.log('🔧 [STATE_DUMP] 전체 미리보기 패널 상태 덤프 시작');

  try {
    const fullState = usePreviewPanelStore.getState();

    console.group('🔧 [STATE_DUMP] 전체 미리보기 패널 상태');
    console.log('전체 상태 객체:', fullState);
    console.log('JSON 형태:', JSON.stringify(fullState, null, 2));
    console.groupEnd();

    console.log('✅ [STATE_DUMP] 상태 덤프 완료');
  } catch (dumpError) {
    console.error('❌ [STATE_DUMP] 상태 덤프 실패:', dumpError);
  }
};
