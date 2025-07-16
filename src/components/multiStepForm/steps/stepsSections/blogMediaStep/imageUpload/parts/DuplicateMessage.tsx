// 📁 imageUpload/parts/DuplicateMessage.tsx

import React, { memo, useCallback, useMemo } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('DUPLICATE_MESSAGE');

// 🔑 내부적으로 사용할 안전한 타입 정의
interface SafeDuplicateMessageData {
  readonly isVisible: boolean;
  readonly message: string;
  readonly fileNames: readonly string[];
  readonly animationKey: number;
}

// 🔑 Context 데이터를 안전한 타입으로 변환하는 함수
const createSafeDuplicateMessageData = (
  contextState: unknown
): SafeDuplicateMessageData => {
  // 기본값으로 안전한 상태 생성
  const defaultData: SafeDuplicateMessageData = {
    isVisible: false,
    message: '',
    fileNames: [],
    animationKey: Date.now(),
  };

  // Context 상태가 객체가 아니면 기본값 반환
  if (!contextState || typeof contextState !== 'object') {
    return defaultData;
  }

  const state = contextState as Record<string, unknown>;

  // 각 속성을 안전하게 추출
  const isVisible =
    typeof state.isVisible === 'boolean' ? state.isVisible : false;
  const message = typeof state.message === 'string' ? state.message : '';

  const fileNames = Array.isArray(state.fileNames)
    ? state.fileNames.filter((name): name is string => typeof name === 'string')
    : [];

  const animationKey =
    typeof state.animationKey === 'number' && state.animationKey > 0
      ? state.animationKey
      : Date.now();

  return {
    isVisible,
    message,
    fileNames,
    animationKey,
  };
};

// 🔑 메시지 유효성 검증 함수
const validateMessageData = (data: SafeDuplicateMessageData): boolean => {
  const { isVisible, message, fileNames, animationKey } = data;

  const hasValidMessage = message.length > 0;
  const hasValidFileNames = fileNames.length > 0;
  const hasValidAnimationKey = animationKey > 0;

  return isVisible
    ? hasValidMessage && hasValidFileNames && hasValidAnimationKey
    : true;
};

// 🔑 중복 파일 메시지 포맷팅 함수
const formatDuplicateFileMessage = (fileNames: readonly string[]): string => {
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

// 🔑 애니메이션 클래스 생성 함수
const createAnimationClasses = (isVisible: boolean): string => {
  const baseClasses =
    'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg border transition-all duration-500 ease-out';
  const visibleClasses = 'opacity-100 translate-y-0 scale-100';
  const hiddenClasses =
    'opacity-0 translate-y-[-20px] scale-95 pointer-events-none';

  return `${baseClasses} ${isVisible ? visibleClasses : hiddenClasses}`;
};

// 🔑 아이콘 컴포넌트
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

// 🔑 메시지 콘텐츠 컴포넌트
const DuplicateMessageContent = memo((): React.ReactNode => {
  const { duplicateMessageState } = useImageUploadContext();

  // ✅ Context 상태를 안전한 타입으로 변환
  const safeMessageData = useMemo(() => {
    return createSafeDuplicateMessageData(duplicateMessageState);
  }, [duplicateMessageState]);

  const { isVisible, message, fileNames, animationKey } = safeMessageData;

  logger.debug('DuplicateMessageContent 렌더링', {
    isVisible,
    messageLength: message.length,
    fileNamesCount: fileNames.length,
    animationKey,
  });

  // 🚀 메시지 콘텐츠 데이터 계산
  const messageContentData = useMemo(() => {
    const formattedMessage = formatDuplicateFileMessage(fileNames);
    const displayMessage = message.length > 0 ? message : formattedMessage;
    const animationClasses = createAnimationClasses(isVisible);
    const hasMultipleFiles = fileNames.length > 1;

    return {
      displayMessage,
      animationClasses,
      hasMultipleFiles,
    };
  }, [message, fileNames, isVisible]);

  // 🔑 이벤트 핸들러들
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
      const fileName = fileNames[tipIndex];
      logger.debug('팁 아이템 클릭', { tipIndex, fileName });
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

        {hasMultipleFiles && (
          <details className="mt-2">
            <summary className="text-xs text-orange-600 cursor-pointer hover:text-orange-800">
              파일 목록 보기 ({fileNames.length}개)
            </summary>
            <ul className="mt-1 ml-4 space-y-1">
              {fileNames.map((fileName, fileIndex) => {
                const fileKey = `file-${animationKey}-${fileIndex}`;

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
        )}
      </main>
    </div>
  );
});

DuplicateMessageContent.displayName = 'DuplicateMessageContent';

// 🔑 메인 컴포넌트
function DuplicateMessage(): React.ReactNode {
  const { duplicateMessageState } = useImageUploadContext();

  // ✅ 안전한 메시지 데이터 생성
  const safeMessageData = useMemo(() => {
    return createSafeDuplicateMessageData(duplicateMessageState);
  }, [duplicateMessageState]);

  logger.debug('DuplicateMessage 렌더링', {
    hasValidState: validateMessageData(safeMessageData),
    isVisible: safeMessageData.isVisible,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 유효성 검증
  const isValidState = validateMessageData(safeMessageData);

  if (!isValidState) {
    logger.warn('유효하지 않은 duplicateMessageState', { safeMessageData });
    return null;
  }

  const { isVisible } = safeMessageData;

  return isVisible ? <DuplicateMessageContent /> : null;
}

export default memo(DuplicateMessage);
