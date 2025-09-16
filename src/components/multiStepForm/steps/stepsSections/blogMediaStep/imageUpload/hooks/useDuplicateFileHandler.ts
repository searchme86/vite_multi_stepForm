// 📁 imageUpload/hooks/useDuplicateFileHandler.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { createLogger } from '../utils/loggerUtils';
import type { DuplicateMessageState } from '../types/imageUploadTypes';

const logger = createLogger('DUPLICATE_HANDLER');

// 🔑 타이머 참조 타입 (타입 안전성 강화)
interface TimerRef {
  current: ReturnType<typeof setTimeout> | null;
}

// 🔑 타이머 관리 상태 인터페이스
interface TimerManagerState {
  readonly showTimer: TimerRef;
  readonly hideTimer: TimerRef;
  readonly cleanupTimer: TimerRef;
}

// 🔑 메시지 생성 매개변수 인터페이스
interface MessageCreationParams {
  readonly duplicateFiles: readonly File[];
  readonly animationKey: number;
}

// 🔑 타이밍 설정 상수 (조정 가능)
const TIMING_CONFIG = {
  SHOW_DELAY: 150, // 메시지 표시 지연 (Race Condition 방지)
  HIDE_DELAY: 4000, // 자동 숨김 지연
  CLEANUP_DELAY: 600, // 정리 지연
} as const;

// 🔑 안전한 파일 검증 함수
const validateDuplicateFiles = (files: unknown): files is File[] => {
  if (!Array.isArray(files)) {
    return false;
  }

  return files.every((file) => {
    return (
      file instanceof File &&
      typeof file.name === 'string' &&
      file.name.length > 0
    );
  });
};

// 🔑 안전한 메시지 생성 함수
const createSafeDuplicateMessage = (
  duplicateFiles: readonly File[]
): string => {
  const fileCount = duplicateFiles.length;

  if (fileCount === 0) {
    return '중복 파일이 발견되었습니다.';
  }

  if (fileCount === 1) {
    const firstFile = duplicateFiles[0];
    const fileName = firstFile?.name || '알 수 없는 파일';
    return `"${fileName}" 파일이 이미 추가되어 있어요`;
  }

  return `${fileCount}개 파일이 이미 추가되어 있어요`;
};

// 🔑 안전한 파일명 추출 함수
const extractSafeFileNames = (
  duplicateFiles: readonly File[]
): readonly string[] => {
  return duplicateFiles
    .filter((file) => file && typeof file.name === 'string')
    .map((file) => file.name);
};

export const useDuplicateFileHandler = () => {
  // 🔑 메인 상태 (DuplicateMessageState)
  const [duplicateMessageState, setDuplicateMessageState] =
    useState<DuplicateMessageState>({
      isVisible: false,
      message: '',
      fileNames: [],
      animationKey: 0,
    });

  // 🔑 타이머 관리 참조들
  const timerManagerRef = useRef<TimerManagerState>({
    showTimer: { current: null },
    hideTimer: { current: null },
    cleanupTimer: { current: null },
  });

  // 🔑 애니메이션 키 참조 (증가 전용)
  const animationKeyRef = useRef<number>(0);

  // 🔑 마운트 상태 참조
  const isMountedRef = useRef<boolean>(true);

  // 🔑 현재 처리 중인 메시지 ID 추적
  const currentMessageIdRef = useRef<string | null>(null);

  logger.debug('useDuplicateFileHandler 초기화 - 타이밍 최적화 버전', {
    isVisible: duplicateMessageState.isVisible,
    animationKey: duplicateMessageState.animationKey,
    timingOptimized: true,
    raceConditionFixed: true,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔑 모든 타이머 안전 정리 함수
  const clearAllActiveTimers = useCallback((): void => {
    const { current: timerManager } = timerManagerRef;

    // showTimer 정리
    if (timerManager.showTimer.current !== null) {
      clearTimeout(timerManager.showTimer.current);
      timerManager.showTimer.current = null;
      logger.debug('show 타이머 정리 완료');
    }

    // hideTimer 정리
    if (timerManager.hideTimer.current !== null) {
      clearTimeout(timerManager.hideTimer.current);
      timerManager.hideTimer.current = null;
      logger.debug('hide 타이머 정리 완료');
    }

    // cleanupTimer 정리
    if (timerManager.cleanupTimer.current !== null) {
      clearTimeout(timerManager.cleanupTimer.current);
      timerManager.cleanupTimer.current = null;
      logger.debug('cleanup 타이머 정리 완료');
    }

    console.log('🗑️ [TIMER_CLEANUP] 모든 타이머 정리 완료:', {
      timestamp: new Date().toLocaleTimeString(),
    });
  }, []);

  // 🔑 마운트 상태 확인 함수
  const checkIsMounted = useCallback((): boolean => {
    const { current: isMounted } = isMountedRef;

    if (!isMounted) {
      logger.warn('컴포넌트가 언마운트되어 작업 중단');
      return false;
    }

    return true;
  }, []);

  // 🔑 안전한 상태 업데이트 함수
  const safeUpdateDuplicateState = useCallback(
    (
      stateUpdater: (prev: DuplicateMessageState) => DuplicateMessageState
    ): void => {
      if (!checkIsMounted()) {
        return;
      }

      try {
        setDuplicateMessageState(stateUpdater);
      } catch (updateError) {
        logger.error('상태 업데이트 중 오류 발생', {
          error: updateError,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    },
    [checkIsMounted]
  );

  // 🔑 새로운 애니메이션 키 생성 함수
  const generateNewAnimationKey = useCallback((): number => {
    const currentTime = Date.now();
    const randomValue = Math.floor(Math.random() * 1000);
    const newKey = currentTime + randomValue;

    // 중복 방지를 위한 증가 보장
    if (newKey <= animationKeyRef.current) {
      animationKeyRef.current = animationKeyRef.current + 1;
    } else {
      animationKeyRef.current = newKey;
    }

    logger.debug('새로운 애니메이션 키 생성', {
      newKey: animationKeyRef.current,
      timestamp: new Date().toLocaleTimeString(),
    });

    return animationKeyRef.current;
  }, []);

  // 🔑 메시지 데이터 생성 함수
  const createMessageData = useCallback(
    (
      params: MessageCreationParams
    ): {
      message: string;
      fileNames: readonly string[];
      messageId: string;
    } => {
      const { duplicateFiles, animationKey } = params;

      const message = createSafeDuplicateMessage(duplicateFiles);
      const fileNames = extractSafeFileNames(duplicateFiles);
      const messageId = `msg-${animationKey}-${Date.now()}`;

      console.log('📝 [MESSAGE_CREATE] 메시지 데이터 생성:', {
        duplicateFilesCount: duplicateFiles.length,
        message,
        fileNamesCount: fileNames.length,
        messageId,
        animationKey,
      });

      return { message, fileNames, messageId };
    },
    []
  );

  // 🔑 즉시 메시지 숨김 함수
  const hideMessageImmediately = useCallback((): void => {
    safeUpdateDuplicateState((previousState) => ({
      ...previousState,
      isVisible: false,
    }));

    console.log('⚡ [IMMEDIATE_HIDE] 즉시 메시지 숨김 처리 완료');
  }, [safeUpdateDuplicateState]);

  // 🔑 메시지 표시 타이머 설정 함수
  const setupShowTimer = useCallback(
    (
      messageData: {
        message: string;
        fileNames: readonly string[];
        messageId: string;
      },
      animationKey: number
    ): void => {
      const { current: timerManager } = timerManagerRef;
      const { message, fileNames, messageId } = messageData;

      timerManager.showTimer.current = setTimeout(() => {
        if (!checkIsMounted()) {
          return;
        }

        // 메시지 ID 업데이트
        currentMessageIdRef.current = messageId;

        console.log('📤 [SHOW_TIMER] 메시지 표시 타이머 실행:', {
          messageId,
          animationKey,
          message: message.slice(0, 30) + '...',
          fileNamesCount: fileNames.length,
        });

        safeUpdateDuplicateState(() => ({
          isVisible: true,
          message,
          fileNames: [...fileNames],
          animationKey,
        }));

        // 자동 숨김 타이머 설정
        setupHideTimer(messageId);
      }, TIMING_CONFIG.SHOW_DELAY);

      console.log('⏰ [SHOW_TIMER] 메시지 표시 타이머 설정 완료:', {
        delay: TIMING_CONFIG.SHOW_DELAY,
        messageId,
      });
    },
    [checkIsMounted, safeUpdateDuplicateState]
  );

  // 🔑 메시지 숨김 타이머 설정 함수
  const setupHideTimer = useCallback(
    (messageId: string): void => {
      const { current: timerManager } = timerManagerRef;

      timerManager.hideTimer.current = setTimeout(() => {
        if (!checkIsMounted()) {
          return;
        }

        // 현재 메시지 ID와 일치하는지 확인 (Race Condition 방지)
        const { current: currentMessageId } = currentMessageIdRef;
        if (currentMessageId !== messageId) {
          console.log('🚫 [HIDE_TIMER] 메시지 ID 불일치로 숨김 스킵:', {
            expectedMessageId: messageId,
            currentMessageId,
          });
          return;
        }

        console.log('📥 [HIDE_TIMER] 메시지 숨김 타이머 실행:', {
          messageId,
        });

        safeUpdateDuplicateState((previousState) => ({
          ...previousState,
          isVisible: false,
        }));

        // 정리 타이머 설정
        setupCleanupTimer(messageId);
      }, TIMING_CONFIG.HIDE_DELAY);

      console.log('⏰ [HIDE_TIMER] 메시지 숨김 타이머 설정 완료:', {
        delay: TIMING_CONFIG.HIDE_DELAY,
        messageId,
      });
    },
    [checkIsMounted, safeUpdateDuplicateState]
  );

  // 🔑 정리 타이머 설정 함수
  const setupCleanupTimer = useCallback(
    (messageId: string): void => {
      const { current: timerManager } = timerManagerRef;

      timerManager.cleanupTimer.current = setTimeout(() => {
        if (!checkIsMounted()) {
          return;
        }

        // 현재 메시지 ID와 일치하는지 확인
        const { current: currentMessageId } = currentMessageIdRef;
        if (currentMessageId !== messageId) {
          console.log('🚫 [CLEANUP_TIMER] 메시지 ID 불일치로 정리 스킵:', {
            expectedMessageId: messageId,
            currentMessageId,
          });
          return;
        }

        console.log('🗑️ [CLEANUP_TIMER] 상태 정리 타이머 실행:', {
          messageId,
        });

        safeUpdateDuplicateState(() => ({
          isVisible: false,
          message: '',
          fileNames: [],
          animationKey: animationKeyRef.current,
        }));

        // 메시지 ID 초기화
        currentMessageIdRef.current = null;

        console.log('✅ [CLEANUP_TIMER] 상태 정리 완료');
      }, TIMING_CONFIG.CLEANUP_DELAY);

      console.log('⏰ [CLEANUP_TIMER] 정리 타이머 설정 완료:', {
        delay: TIMING_CONFIG.CLEANUP_DELAY,
        messageId,
      });
    },
    [checkIsMounted, safeUpdateDuplicateState]
  );

  // 🔑 메인 중복 메시지 표시 함수 (타이밍 최적화)
  const showDuplicateMessage = useCallback(
    (duplicateFilesList: unknown): void => {
      if (!checkIsMounted()) {
        return;
      }

      // 입력값 검증
      if (!validateDuplicateFiles(duplicateFilesList)) {
        logger.error('유효하지 않은 중복 파일 목록', {
          input: duplicateFilesList,
          isArray: Array.isArray(duplicateFilesList),
        });
        return;
      }

      const safeFiles: readonly File[] = duplicateFilesList;

      if (safeFiles.length === 0) {
        logger.warn('빈 중복 파일 목록으로 메시지 표시 스킵');
        return;
      }

      const newAnimationKey = generateNewAnimationKey();
      const fileNamesText = safeFiles.map((file) => file.name).join(', ');

      logger.info('중복 알림 메시지 표시 시작 - 타이밍 최적화', {
        duplicateFilesCount: safeFiles.length,
        fileNamesText: fileNamesText.slice(0, 100) + '...',
        newAnimationKey,
        timingOptimized: true,
        timestamp: new Date().toLocaleTimeString(),
      });

      // 🚨 핵심: 기존 타이머들 완전 정리 (Race Condition 방지)
      clearAllActiveTimers();

      // 🚨 핵심: 즉시 기존 메시지 숨김 (동기적 처리)
      hideMessageImmediately();

      // 🚨 핵심: 메시지 데이터 생성
      const messageData = createMessageData({
        duplicateFiles: safeFiles,
        animationKey: newAnimationKey,
      });

      // 🚨 핵심: 새 메시지 표시 타이머 설정
      setupShowTimer(messageData, newAnimationKey);

      console.log('🚀 [DUPLICATE_MESSAGE] 타이밍 최적화된 메시지 처리 완료:', {
        messageId: messageData.messageId,
        animationKey: newAnimationKey,
        filesCount: safeFiles.length,
        timingOptimized: true,
      });
    },
    [
      checkIsMounted,
      generateNewAnimationKey,
      clearAllActiveTimers,
      hideMessageImmediately,
      createMessageData,
      setupShowTimer,
    ]
  );

  // 🔑 수동 메시지 숨김 함수 (외부 호출용)
  const hideDuplicateMessage = useCallback((): void => {
    if (!checkIsMounted()) {
      return;
    }

    logger.debug('수동 메시지 숨김 요청');

    // 모든 타이머 정리
    clearAllActiveTimers();

    // 즉시 메시지 숨김
    hideMessageImmediately();

    // 메시지 ID 초기화
    currentMessageIdRef.current = null;

    console.log('✅ [MANUAL_HIDE] 수동 메시지 숨김 완료');
  }, [checkIsMounted, clearAllActiveTimers, hideMessageImmediately]);

  // 🔑 현재 메시지 상태 확인 함수
  const getCurrentMessageInfo = useCallback(() => {
    const { current: currentMessageId } = currentMessageIdRef;
    const { isVisible, message, fileNames, animationKey } =
      duplicateMessageState;

    return {
      isVisible,
      message,
      fileNamesCount: fileNames.length,
      animationKey,
      currentMessageId,
      hasActiveMessage: currentMessageId !== null,
    };
  }, [duplicateMessageState]);

  // 🔑 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    isMountedRef.current = true;

    logger.debug('useDuplicateFileHandler 마운트 완료 - 타이밍 최적화 버전', {
      timingOptimized: true,
      raceConditionFixed: true,
    });

    return () => {
      isMountedRef.current = false;

      // 언마운트 시 모든 타이머 정리
      clearAllActiveTimers();

      // 메시지 ID 초기화
      currentMessageIdRef.current = null;

      logger.debug('useDuplicateFileHandler 정리 완료 - 타이밍 최적화', {
        timingOptimized: true,
      });
    };
  }, [clearAllActiveTimers]);

  return {
    duplicateMessageState,
    showDuplicateMessage,
    hideDuplicateMessage,
    getCurrentMessageInfo,
  };
};
