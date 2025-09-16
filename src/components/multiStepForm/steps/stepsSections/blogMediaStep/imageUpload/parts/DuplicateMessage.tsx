// 📁 imageUpload/parts/DuplicateMessage.tsx

import React, { memo, useCallback, useMemo } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';
import type { DuplicateMessageState } from '../types/imageUploadTypes';

const logger = createLogger('DUPLICATE_MESSAGE');

const validateDuplicateMessageState = (
  state: DuplicateMessageState
): boolean => {
  const {
    isVisible = false,
    message = '',
    fileNames = [],
    animationKey = 0,
  } = state;

  const hasValidMessage = typeof message === 'string' && message.length > 0;
  const hasValidFileNames = Array.isArray(fileNames) && fileNames.length > 0;
  const hasValidAnimationKey =
    typeof animationKey === 'number' && animationKey > 0;

  return isVisible
    ? hasValidMessage && hasValidFileNames && hasValidAnimationKey
    : true;
};

const formatDuplicateFileMessage = (fileNames: string[]): string => {
  const fileCount = fileNames.length;

  if (fileCount === 0) {
    return '';
  }

  if (fileCount === 1) {
    const [firstFileName = ''] = fileNames;
    return `"${firstFileName}" 파일이 이미 추가되어 있어요`;
  }

  return `${fileCount}개 파일이 이미 추가되어 있어요`;
};

const createAnimationClasses = (isVisible: boolean): string => {
  const baseClasses =
    'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-500 ease-out';
  const visibleClasses = 'opacity-100 translate-y-0 scale-100';
  const hiddenClasses =
    'opacity-0 translate-y-[-20px] scale-95 pointer-events-none';

  return `${baseClasses} ${isVisible ? visibleClasses : hiddenClasses}`;
};

const DuplicateMessageIcon = memo((): React.ReactNode => {
  return (
    <div className="flex-shrink-0 w-5 h-5 text-orange-500" aria-hidden="true">
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
});

DuplicateMessageIcon.displayName = 'DuplicateMessageIcon';

const DuplicateMessageContent = memo((): React.ReactNode => {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const { duplicateMessageState } = useImageUploadContext();

  const {
    isVisible = false,
    message = '',
    fileNames = [],
    animationKey = 0,
  } = duplicateMessageState;

  logger.debug('DuplicateMessageContent 렌더링', {
    isVisible,
    messageLength: message.length,
    fileNamesCount: fileNames.length,
    animationKey,
  });

  // 🚀 성능 최적화: 메시지 내용 메모이제이션
  const messageContentData = useMemo(() => {
    const formattedMessage = formatDuplicateFileMessage(fileNames);
    const displayMessage = message.length > 0 ? message : formattedMessage;
    const animationClasses = createAnimationClasses(isVisible);

    return {
      displayMessage,
      animationClasses,
      hasMultipleFiles: fileNames.length > 1,
    };
  }, [message, fileNames, isVisible]);

  const handleContentClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      logger.debug('중복 메시지 클릭 이벤트 방지', { animationKey });
    },
    [animationKey]
  );

  const handleTipItemClick = useCallback(
    (tipIndex: number) => {
      logger.debug('팁 아이템 클릭', { tipIndex, tip: fileNames[tipIndex] });
    },
    [fileNames]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, tipIndex: number) => {
      const { key } = event;
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        handleTipItemClick(tipIndex);
      }
    },
    [handleTipItemClick]
  );

  // 🔧 구조분해할당으로 데이터 접근
  const { displayMessage, animationClasses, hasMultipleFiles } =
    messageContentData;

  return (
    <div
      key={animationKey}
      className={animationClasses}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onClick={handleContentClick}
    >
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <DuplicateMessageIcon />
          <span className="text-sm font-medium text-orange-800">
            중복 파일 알림
          </span>
        </div>
      </header>

      <main className="mt-2">
        <p className="text-sm text-orange-700">{displayMessage}</p>

        {hasMultipleFiles ? (
          <details className="mt-2">
            <summary className="text-xs text-orange-600 cursor-pointer hover:text-orange-800">
              파일 목록 보기 ({fileNames.length}개)
            </summary>
            <ul className="mt-1 ml-4 space-y-1">
              {fileNames.map((fileName, fileIndex) => {
                const fileKey = `${animationKey}-${fileIndex}`;

                return (
                  <li
                    key={fileKey}
                    className="p-1 text-xs text-orange-600 transition-colors duration-200 rounded cursor-pointer hover:bg-orange-100"
                    onClick={() => handleTipItemClick(fileIndex)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => handleKeyDown(event, fileIndex)}
                  >
                    • {fileName}
                  </li>
                );
              })}
            </ul>
          </details>
        ) : null}
      </main>
    </div>
  );
});

DuplicateMessageContent.displayName = 'DuplicateMessageContent';

function DuplicateMessage(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const { duplicateMessageState } = useImageUploadContext();

  logger.debug('DuplicateMessage 렌더링', {
    hasValidState: validateDuplicateMessageState(duplicateMessageState),
    isVisible: duplicateMessageState.isVisible,
    timestamp: new Date().toLocaleTimeString(),
  });

  const isValidState = validateDuplicateMessageState(duplicateMessageState);

  // 🔧 early return으로 중첩 방지
  if (!isValidState) {
    logger.warn('유효하지 않은 duplicateMessageState', {
      duplicateMessageState,
    });
    return null;
  }

  const { isVisible = false } = duplicateMessageState;

  return isVisible ? <DuplicateMessageContent /> : null;
}

export default memo(DuplicateMessage);
