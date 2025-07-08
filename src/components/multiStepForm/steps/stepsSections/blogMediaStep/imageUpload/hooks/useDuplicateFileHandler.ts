// blogMediaStep/imageUpload/hooks/useDuplicateFileHandler.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { type DuplicateMessageState } from '../types/imageUploadTypes';

export const useDuplicateFileHandler = () => {
  const [duplicateMessageState, setDuplicateMessageState] =
    useState<DuplicateMessageState>({
      isVisible: false,
      message: '',
      fileNames: [],
      animationKey: 0,
    });

  const duplicateMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const animationKeyRef = useRef<number>(0);

  console.log('🔧 [DUPLICATE_HANDLER] useDuplicateFileHandler 초기화:', {
    isVisible: duplicateMessageState.isVisible,
    animationKey: duplicateMessageState.animationKey,
    timestamp: new Date().toLocaleTimeString(),
  });

  const showDuplicateMessage = useCallback((duplicateFiles: File[]) => {
    const fileNamesText = duplicateFiles.map((file) => file.name).join(', ');
    const message =
      duplicateFiles.length === 1
        ? `"${duplicateFiles[0].name}" 파일이 이미 추가되어 있어요`
        : `${duplicateFiles.length}개 파일이 이미 추가되어 있어요`;

    const newAnimationKey = Date.now() + Math.random();
    animationKeyRef.current = newAnimationKey;

    console.log('🎨 [DUPLICATE_MESSAGE] 중복 알림 메시지 표시:', {
      duplicateFilesCount: duplicateFiles.length,
      message,
      fileNamesText,
      newAnimationKey,
      timestamp: new Date().toLocaleTimeString(),
    });

    const hasExistingTimer = duplicateMessageTimerRef.current !== null;
    if (hasExistingTimer) {
      clearTimeout(duplicateMessageTimerRef.current!);
      console.log('🎨 [DUPLICATE_MESSAGE] 기존 타이머 제거 및 즉시 리셋');

      setDuplicateMessageState((prev) => ({
        ...prev,
        isVisible: false,
      }));
    }

    const delayTime = hasExistingTimer ? 300 : 50;

    setTimeout(() => {
      console.log('🎨 [DUPLICATE_MESSAGE] 새로운 애니메이션 시작:', {
        newAnimationKey,
        message,
        forceNewAnimation: true,
      });

      setDuplicateMessageState({
        isVisible: true,
        message,
        fileNames: duplicateFiles.map((file) => file.name),
        animationKey: newAnimationKey,
      });

      duplicateMessageTimerRef.current = setTimeout(() => {
        console.log(
          '⏰ [DUPLICATE_MESSAGE] 자동 사라짐 타이머 실행:',
          newAnimationKey
        );

        setDuplicateMessageState((prev) => ({
          ...prev,
          isVisible: false,
        }));

        setTimeout(() => {
          console.log(
            '🎨 [DUPLICATE_MESSAGE] 상태 초기화 완료:',
            newAnimationKey
          );

          setDuplicateMessageState({
            isVisible: false,
            message: '',
            fileNames: [],
            animationKey: newAnimationKey,
          });
        }, 800);
      }, 5000);
    }, delayTime);
  }, []);

  useEffect(() => {
    return () => {
      const currentTimer = duplicateMessageTimerRef.current;
      if (currentTimer !== null) {
        clearTimeout(currentTimer);
      }
    };
  }, []);

  return {
    duplicateMessageState,
    showDuplicateMessage,
  };
};
