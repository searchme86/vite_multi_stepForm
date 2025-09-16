// 📁 imageUpload/parts/MobileTip.tsx

import React, { memo, useMemo, useCallback } from 'react';
import { useImageUploadContext } from '../context/ImageUploadContext';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('MOBILE_TIP');

interface SafeNavigator {
  userAgent: string;
  maxTouchPoints: number;
}

interface SafeScreen {
  width: number;
}

const getSafeNavigator = (
  windowNavigator: Navigator | undefined
): SafeNavigator => {
  const fallbackNavigator: SafeNavigator = {
    userAgent: '',
    maxTouchPoints: 0,
  };

  // 🔧 early return으로 중첩 방지
  if (!windowNavigator) {
    return fallbackNavigator;
  }

  const userAgent = Reflect.get(windowNavigator, 'userAgent');
  const maxTouchPoints = Reflect.get(windowNavigator, 'maxTouchPoints');

  return {
    userAgent:
      typeof userAgent === 'string' ? userAgent : fallbackNavigator.userAgent,
    maxTouchPoints:
      typeof maxTouchPoints === 'number'
        ? maxTouchPoints
        : fallbackNavigator.maxTouchPoints,
  };
};

const getSafeScreen = (windowScreen: Screen | undefined): SafeScreen => {
  const fallbackScreen: SafeScreen = {
    width: 0,
  };

  // 🔧 early return으로 중첩 방지
  if (!windowScreen) {
    return fallbackScreen;
  }

  const width = Reflect.get(windowScreen, 'width');

  return {
    width: typeof width === 'number' ? width : fallbackScreen.width,
  };
};

const detectMobileDevice = (): boolean => {
  const isServerSide = typeof window === 'undefined';

  // 🔧 early return으로 중첩 방지
  if (isServerSide) {
    return false;
  }

  const safeNavigator = getSafeNavigator(window.navigator);
  const safeScreen = getSafeScreen(window.screen);

  const { userAgent, maxTouchPoints } = safeNavigator;
  const { width } = safeScreen;

  const hasTouchSupport = maxTouchPoints > 0;
  const hasSmallScreen = width <= 768;
  const hasMobileUserAgent =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return hasTouchSupport || hasSmallScreen || hasMobileUserAgent;
};

const createMobileTipContent = (): {
  title: string;
  description: string;
  tips: string[];
} => {
  return {
    title: '📱 모바일 사용 팁',
    description: '터치로 이미지를 선택하고 관리할 수 있어요',
    tips: [
      '이미지를 터치하면 편집 버튼이 나타납니다',
      '메인 이미지 설정은 별표 버튼을 터치하세요',
      '삭제는 휴지통 버튼을 터치하세요',
      '여러 이미지를 동시에 터치할 수 있어요',
    ],
  };
};

const MobileTipIcon = memo(
  (): React.ReactNode => (
    <div className="flex-shrink-0 w-6 h-6 text-blue-500" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
        <path d="M16 2H8C7.45 2 7 2.45 7 3V4H5C4.45 4 4 4.45 4 5S4.45 6 5 6H6V20C6 21.1 6.9 22 8 22H16C17.1 22 18 21.1 18 20V6H19C19.55 6 20 5.55 20 5S19.55 4 19 4H17V3C17 2.45 16.55 2 16 2ZM15 4V3H9V4H15ZM16 6H8V20H16V6Z" />
      </svg>
    </div>
  )
);

MobileTipIcon.displayName = 'MobileTipIcon';

const MobileTipContent = memo((): React.ReactNode => {
  const tipContent = useMemo(() => createMobileTipContent(), []);
  const { title, description, tips } = tipContent;

  logger.debug('MobileTipContent 렌더링', {
    tipsCount: tips.length,
    title,
  });

  const handleTipItemClick = useCallback(
    (tipIndex: number) => {
      const targetTip =
        tips[tipIndex] !== undefined ? tips[tipIndex] : 'unknown';

      logger.debug('팁 아이템 클릭', {
        tipIndex,
        tip: targetTip,
      });
    },
    [tips]
  );

  const handleTipItemKeyDown = useCallback(
    (event: React.KeyboardEvent, tipIndex: number) => {
      const { key } = event;
      const isEnterKey = key === 'Enter';
      const isSpaceKey = key === ' ';

      // 🔧 삼항연산자 사용
      const shouldTriggerClick = isEnterKey || isSpaceKey ? true : false;

      if (shouldTriggerClick) {
        event.preventDefault();
        handleTipItemClick(tipIndex);
      }
    },
    [handleTipItemClick]
  );

  return (
    <div
      className="p-4 border border-blue-200 rounded-lg bg-blue-50"
      role="region"
      aria-labelledby="mobile-tip-title"
    >
      <header className="flex items-start gap-3 mb-3">
        <MobileTipIcon />
        <div className="flex-1">
          <h3
            id="mobile-tip-title"
            className="text-sm font-semibold text-blue-900"
          >
            {title}
          </h3>
          <p className="mt-1 text-xs text-blue-700">{description}</p>
        </div>
      </header>

      <main>
        <ul className="space-y-2" role="list">
          {tips.map((tipText, tipIndex) => {
            const tipKey = `mobile-tip-${tipIndex}`;

            return (
              <li
                key={tipKey}
                className="flex items-start gap-2 p-2 transition-colors duration-200 rounded cursor-pointer hover:bg-blue-100"
                onClick={() => handleTipItemClick(tipIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => handleTipItemKeyDown(event, tipIndex)}
                aria-label={`모바일 팁 ${tipIndex + 1}: ${tipText}`}
              >
                <span
                  className="flex-shrink-0 w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"
                  aria-hidden="true"
                />
                <span className="text-xs leading-relaxed text-blue-800">
                  {tipText}
                </span>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
});

MobileTipContent.displayName = 'MobileTipContent';

function MobileTip(): React.ReactNode {
  // ✅ Context에서 모든 데이터 가져오기 (Props 0개)
  const { isMobileDevice } = useImageUploadContext();

  const shouldShowMobileTip = useMemo(() => {
    const contextMobileDetection = isMobileDevice;
    const runtimeMobileDetection = detectMobileDevice();

    // 🔧 삼항연산자 사용
    const finalDecision =
      contextMobileDetection || runtimeMobileDetection ? true : false;

    return finalDecision;
  }, [isMobileDevice]);

  logger.debug('MobileTip 렌더링', {
    isMobileDevice,
    shouldShowMobileTip,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 삼항연산자 사용 (&&연산자 대신)
  return shouldShowMobileTip ? <MobileTipContent /> : null;
}

export default memo(MobileTip);
