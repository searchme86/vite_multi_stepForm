// 📁 imageUpload/hooks/useDuplicateFileHandler.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { createLogger } from '../utils/loggerUtils';
import type { DuplicateMessageState } from '../types/imageUploadTypes';

const logger = createLogger('DUPLICATE_HANDLER');

export const useDuplicateFileHandler = () => {
  const [duplicateMessageState, setDuplicateMessageState] =
    useState<DuplicateMessageState>({
      isVisible: false,
      message: '',
      fileNames: [],
      animationKey: 0,
    });

  // 🛡️ 메모리 누수 방지: 타이머 관리 개선
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationKeyRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  logger.debug('useDuplicateFileHandler 초기화', {
    isVisible: duplicateMessageState.isVisible,
    animationKey: duplicateMessageState.animationKey,
  });

  // 🛡️ 메모리 누수 방지: 안전한 타이머 정리 함수
  const clearAllActiveTimers = useCallback(() => {
    const timersToClean = [showTimerRef, hideTimerRef, cleanupTimerRef];

    timersToClean.forEach((timerRef) => {
      const { current: currentTimer } = timerRef;

      if (currentTimer !== null) {
        clearTimeout(currentTimer);
        timerRef.current = null;

        logger.debug('타이머 정리 완료', {
          timerType:
            timerRef === showTimerRef
              ? 'show'
              : timerRef === hideTimerRef
              ? 'hide'
              : 'cleanup',
        });
      }
    });
  }, []);

  // 🛡️ 메모리 누수 방지: 안전한 상태 업데이트 함수
  const safeUpdateDuplicateState = useCallback(
    (stateUpdater: (prev: DuplicateMessageState) => DuplicateMessageState) => {
      const { current: isMounted } = isMountedRef;

      if (!isMounted) {
        logger.warn('컴포넌트가 언마운트되어 상태 업데이트 무시');
        return;
      }

      try {
        setDuplicateMessageState(stateUpdater);
      } catch (updateError) {
        logger.error('상태 업데이트 중 오류 발생', { error: updateError });
      }
    },
    []
  );

  // 🚀 성능 최적화: 애니메이션 키 생성 함수
  const generateAnimationKey = useCallback((): number => {
    const currentTime = Date.now();
    const randomValue = Math.random();
    const newKey = currentTime + randomValue;

    animationKeyRef.current = newKey;

    logger.debug('새로운 애니메이션 키 생성', { newKey });

    return newKey;
  }, []);

  // 🔧 중복 파일 메시지 생성 함수
  const createDuplicateMessage = useCallback(
    (duplicateFilesList: File[]): string => {
      const { length: duplicateFileCount } = duplicateFilesList;

      return duplicateFileCount === 1
        ? `"${
            duplicateFilesList[0]?.name ?? '알 수 없는 파일'
          }" 파일이 이미 추가되어 있어요`
        : `${duplicateFileCount}개 파일이 이미 추가되어 있어요`;
    },
    []
  );

  // 🔧 파일 이름 목록 생성 함수
  const extractFileNamesList = useCallback(
    (duplicateFilesList: File[]): string[] => {
      return duplicateFilesList.map(({ name: fileName }) => fileName);
    },
    []
  );

  const showDuplicateMessage = useCallback(
    (duplicateFilesList: File[]) => {
      const { current: isMounted } = isMountedRef;

      if (!isMounted) {
        logger.warn('컴포넌트가 언마운트되어 중복 메시지 표시 중단');
        return;
      }

      const duplicateMessage = createDuplicateMessage(duplicateFilesList);
      const fileNamesList = extractFileNamesList(duplicateFilesList);
      const fileNamesText = fileNamesList.join(', ');
      const newAnimationKey = generateAnimationKey();

      logger.info('중복 알림 메시지 표시 시작', {
        duplicateFilesCount: duplicateFilesList.length,
        message: duplicateMessage,
        fileNamesText,
        newAnimationKey,
      });

      // 🛡️ 메모리 누수 방지: 기존 타이머들 정리
      clearAllActiveTimers();

      // 즉시 숨김 처리 (기존 메시지가 있는 경우)
      safeUpdateDuplicateState((previousState) => ({
        ...previousState,
        isVisible: false,
      }));

      // 🚀 성능 최적화: 애니메이션 시작 지연
      showTimerRef.current = setTimeout(() => {
        const { current: isMountedAfterDelay } = isMountedRef;

        if (!isMountedAfterDelay) {
          return;
        }

        logger.debug('새로운 애니메이션 시작', { newAnimationKey });

        safeUpdateDuplicateState(() => ({
          isVisible: true,
          message: duplicateMessage,
          fileNames: fileNamesList,
          animationKey: newAnimationKey,
        }));

        // 🛡️ 메모리 누수 방지: 자동 숨김 타이머 설정
        hideTimerRef.current = setTimeout(() => {
          const { current: isMountedAfterHide } = isMountedRef;

          if (!isMountedAfterHide) {
            return;
          }

          logger.debug('자동 사라짐 타이머 실행', { newAnimationKey });

          safeUpdateDuplicateState((previousState) => ({
            ...previousState,
            isVisible: false,
          }));

          // 최종 상태 초기화
          cleanupTimerRef.current = setTimeout(() => {
            const { current: isMountedAfterCleanup } = isMountedRef;

            if (!isMountedAfterCleanup) {
              return;
            }

            logger.debug('상태 초기화 완료', { newAnimationKey });

            safeUpdateDuplicateState(() => ({
              isVisible: false,
              message: '',
              fileNames: [],
              animationKey: newAnimationKey,
            }));
          }, 800);
        }, 5000);
      }, 300);
    },
    [
      clearAllActiveTimers,
      safeUpdateDuplicateState,
      createDuplicateMessage,
      extractFileNamesList,
      generateAnimationKey,
    ]
  );

  // 🛡️ 메모리 누수 방지: 언마운트 시 정리
  useEffect(() => {
    isMountedRef.current = true;

    logger.debug('useDuplicateFileHandler 마운트 완료');

    return () => {
      isMountedRef.current = false;
      clearAllActiveTimers();
      logger.debug('useDuplicateFileHandler 정리 완료');
    };
  }, [clearAllActiveTimers]);

  return {
    duplicateMessageState,
    showDuplicateMessage,
  };
};
