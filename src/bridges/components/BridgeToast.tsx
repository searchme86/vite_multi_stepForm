// bridges/components/BridgeToast.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import {
  createStandardizationUtils,
  type StandardToastProps,
  type StandardPosition,
  type StandardVariant,
} from '../common/componentStandardization';

// 🔧 토스트 메시지 인터페이스
interface ToastMessage {
  readonly id: string;
  readonly type: StandardVariant;
  readonly title: string;
  readonly description?: string;
  readonly duration?: number;
  readonly timestamp: number;
}

// 🔧 브릿지 토스트 전용 Props 인터페이스
interface BridgeToastProps extends Omit<StandardToastProps, 'title'> {
  readonly maxToasts?: number;
  readonly spacing?: number;
  readonly disableAnimation?: boolean;
  readonly onToastClick?: (toast: ToastMessage) => void;
  readonly onToastClose?: (toast: ToastMessage) => void;
  readonly autoDetectResults?: boolean;
  readonly showClearAllButton?: boolean;
  readonly clearAllThreshold?: number;
}

export function BridgeToast({
  size = 'md',
  variant = 'default',
  position = 'top-right',
  duration = 5000,
  className = '',
  bridgeConfig,
  maxToasts = 5,
  spacing = 12,
  showCloseButton = true,
  disableAnimation = false,
  onToastClick,
  onToastClose,
  autoDetectResults = true,
  showClearAllButton = true,
  clearAllThreshold = 3,
}: BridgeToastProps): ReactElement {
  // 🔧 표준화 유틸리티 사용
  const {
    validateSize,
    validateVariant,
    validateClassName,
    validateBoolean,
    generateStandardAriaAttributes,
    logComponentRender,
    logComponentAction,
  } = createStandardizationUtils();

  // 🔧 Props 검증 및 표준화
  const safeSize = validateSize(size);
  const safeVariant = validateVariant(variant);
  const safeClassName = validateClassName(className);
  const safePosition = (() => {
    const validPositions: StandardPosition[] = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];
    return validPositions.includes(position as StandardPosition)
      ? (position as StandardPosition)
      : 'top-right';
  })();
  const safeShowCloseButton = validateBoolean(showCloseButton, true);
  const safeDisableAnimation = validateBoolean(disableAnimation, false);
  const safeAutoDetectResults = validateBoolean(autoDetectResults, true);
  const safeShowClearAllButton = validateBoolean(showClearAllButton, true);

  // 🔧 Bridge UI 훅 사용 (자동 감지를 위해)
  const { hasError, hasWarning, statusMessage, executionMetrics } =
    useBridgeUI(bridgeConfig);

  // 🔧 상태 관리
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);
  const toastTimers = useRef<Map<string, number>>(new Map());
  const lastProcessedMetrics = useRef<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
  }>({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
  });

  // 🔧 고유 토스트 ID 생성
  const generateUniqueToastId = useCallback((): string => {
    const currentTimestamp = Date.now();
    const timestampString = currentTimestamp.toString(36);
    const randomNumber = Math.random();
    const randomString = randomNumber.toString(36).substring(2, 8);
    return `toast_${timestampString}_${randomString}`;
  }, []);

  // 🔧 새 토스트 추가
  const addNewToast = useCallback(
    (newToast: Omit<ToastMessage, 'id' | 'timestamp'>): void => {
      logComponentAction('BRIDGE_TOAST', '새 토스트 추가', {
        type: newToast.type,
        title: newToast.title,
      });

      const completeToast: ToastMessage = {
        ...newToast,
        id: generateUniqueToastId(),
        timestamp: Date.now(),
      };

      setActiveToasts((previousToasts) => {
        const isDuplicateToast = previousToasts.some(
          (existingToast) =>
            existingToast.type === completeToast.type &&
            existingToast.title === completeToast.title
        );

        // Early Return: 중복 토스트인 경우
        if (isDuplicateToast) {
          logComponentAction('BRIDGE_TOAST', '중복 토스트 감지, 추가 생략');
          return previousToasts;
        }

        let updatedToasts = [...previousToasts, completeToast];
        const exceedsMaxToasts = updatedToasts.length > maxToasts;

        if (exceedsMaxToasts) {
          const removedToast = updatedToasts.shift();
          const shouldCleanupTimer = removedToast !== undefined;

          if (shouldCleanupTimer) {
            const toastToRemove = removedToast!;
            logComponentAction(
              'BRIDGE_TOAST',
              '최대 개수 초과로 오래된 토스트 제거',
              {
                toastId: toastToRemove.id,
              }
            );
            const existingTimer = toastTimers.current.get(toastToRemove.id);
            const hasExistingTimer = existingTimer !== undefined;

            if (hasExistingTimer) {
              const timerId = existingTimer!;
              window.clearTimeout(timerId);
              toastTimers.current.delete(toastToRemove.id);
            }
          }
        }

        return updatedToasts;
      });

      const toastDuration =
        newToast.duration !== undefined ? newToast.duration : duration;
      const shouldSetAutoCloseTimer = toastDuration > 0;

      if (shouldSetAutoCloseTimer) {
        const timerId = window.setTimeout(() => {
          logComponentAction('BRIDGE_TOAST', '자동 닫기 타이머 실행', {
            toastId: completeToast.id,
          });
          removeToastById(completeToast.id);
        }, toastDuration);

        toastTimers.current.set(completeToast.id, timerId);
      }
    },
    [generateUniqueToastId, maxToasts, duration]
  );

  // 🔧 토스트 제거
  const removeToastById = useCallback(
    (toastIdToRemove: string): void => {
      logComponentAction('BRIDGE_TOAST', '토스트 제거', {
        toastId: toastIdToRemove,
      });

      setActiveToasts((previousToasts) => {
        const toastToRemove = previousToasts.find(
          (toast) => toast.id === toastIdToRemove
        );

        const shouldNotifyClose =
          toastToRemove !== undefined && onToastClose !== undefined;
        if (shouldNotifyClose) {
          const foundToast = toastToRemove!;
          const closeCallback = onToastClose!;
          closeCallback(foundToast);
        }

        return previousToasts.filter((toast) => toast.id !== toastIdToRemove);
      });

      const existingTimer = toastTimers.current.get(toastIdToRemove);
      const hasExistingTimer = existingTimer !== undefined;

      if (hasExistingTimer) {
        const timerId = existingTimer!;
        window.clearTimeout(timerId);
        toastTimers.current.delete(toastIdToRemove);
      }
    },
    [onToastClose]
  );

  // 🔧 모든 토스트 제거
  const clearAllToasts = useCallback((): void => {
    logComponentAction('BRIDGE_TOAST', '모든 토스트 제거');

    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current.clear();
    setActiveToasts([]);
  }, []);

  // 🔧 실행 결과 자동 감지 Effect
  useEffect(() => {
    const shouldAutoDetect = safeAutoDetectResults;

    // Early Return: 자동 감지가 비활성화된 경우
    if (!shouldAutoDetect) {
      return;
    }

    const currentMetrics = executionMetrics;
    const previousMetrics = lastProcessedMetrics.current;

    const hasNewOperation =
      currentMetrics.totalOperations > previousMetrics.totalOperations;
    const hasNewSuccess =
      currentMetrics.successfulOperations >
      previousMetrics.successfulOperations;
    const hasNewFailure =
      currentMetrics.failedOperations > previousMetrics.failedOperations;

    // 성공 토스트 추가
    if (hasNewSuccess) {
      const successCount =
        currentMetrics.successfulOperations -
        previousMetrics.successfulOperations;
      logComponentAction('BRIDGE_TOAST', '새로운 성공 감지', { successCount });

      addNewToast({
        type: 'success',
        title: '브릿지 실행 성공',
        description: `${successCount}개의 작업이 성공적으로 완료되었습니다`,
        duration,
      });
    }

    // 실패 토스트 추가
    if (hasNewFailure) {
      const failureCount =
        currentMetrics.failedOperations - previousMetrics.failedOperations;
      logComponentAction('BRIDGE_TOAST', '새로운 실패 감지', { failureCount });

      addNewToast({
        type: 'error',
        title: '브릿지 실행 실패',
        description: `${failureCount}개의 작업이 실패했습니다. ${statusMessage}`,
        duration: duration * 1.5,
      });
    }

    // 경고 토스트 추가
    if (hasWarning && hasNewOperation) {
      logComponentAction('BRIDGE_TOAST', '경고 상태 감지');

      addNewToast({
        type: 'warning',
        title: '주의사항 확인',
        description: statusMessage,
        duration,
      });
    }

    // 메트릭스 업데이트
    lastProcessedMetrics.current = {
      totalOperations: currentMetrics.totalOperations,
      successfulOperations: currentMetrics.successfulOperations,
      failedOperations: currentMetrics.failedOperations,
    };
  }, [
    safeAutoDetectResults,
    executionMetrics,
    hasWarning,
    statusMessage,
    addNewToast,
    duration,
  ]);

  // 🔧 컴포넌트 정리 시 타이머 정리
  useEffect(() => {
    return () => {
      logComponentAction('BRIDGE_TOAST', '컴포넌트 정리 - 모든 타이머 취소');
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  // 🔧 위치 클래스 계산
  const getPositionClasses = useCallback(
    (toastPosition: StandardPosition): string => {
      const positionClassMap = new Map([
        ['top-left', 'top-4 left-4'],
        ['top-center', 'top-4 left-1/2 transform -translate-x-1/2'],
        ['top-right', 'top-4 right-4'],
        ['bottom-left', 'bottom-4 left-4'],
        ['bottom-center', 'bottom-4 left-1/2 transform -translate-x-1/2'],
        ['bottom-right', 'bottom-4 right-4'],
      ]);

      const selectedPositionClass = positionClassMap.get(toastPosition);
      const fallbackPositionClass = positionClassMap.get('top-right');

      return selectedPositionClass !== undefined
        ? selectedPositionClass
        : fallbackPositionClass!;
    },
    []
  );

  // 🔧 토스트 타입별 스타일 계산
  const getToastTypeClasses = useCallback(
    (
      toastType: StandardVariant
    ): {
      containerClass: string;
      iconClass: string;
      icon: ReactNode;
    } => {
      const typeStyleMap = new Map([
        [
          'success',
          {
            containerClass: 'bg-green-50 border-green-200 text-green-800',
            iconClass: 'text-green-500',
            icon: (
              <svg
                key="success"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
        ],
        [
          'error',
          {
            containerClass: 'bg-red-50 border-red-200 text-red-800',
            iconClass: 'text-red-500',
            icon: (
              <svg
                key="error"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
        ],
        [
          'warning',
          {
            containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            iconClass: 'text-yellow-500',
            icon: (
              <svg
                key="warning"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            ),
          },
        ],
        [
          'primary',
          {
            containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
            iconClass: 'text-blue-500',
            icon: (
              <svg
                key="primary"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
        ],
        [
          'secondary',
          {
            containerClass: 'bg-gray-50 border-gray-200 text-gray-800',
            iconClass: 'text-gray-500',
            icon: (
              <svg
                key="secondary"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
        ],
        [
          'default',
          {
            containerClass: 'bg-white border-gray-200 text-gray-800',
            iconClass: 'text-gray-500',
            icon: (
              <svg
                key="default"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
        ],
      ]);

      const selectedTypeStyle = typeStyleMap.get(toastType);
      const fallbackTypeStyle = typeStyleMap.get('default');

      return selectedTypeStyle !== undefined
        ? selectedTypeStyle
        : fallbackTypeStyle!;
    },
    []
  );

  // 🔧 토스트 클릭 핸들러
  const handleToastClick = useCallback(
    (toast: ToastMessage): void => {
      logComponentAction('BRIDGE_TOAST', '토스트 클릭', { toastId: toast.id });
      const shouldExecuteClickCallback = onToastClick !== undefined;
      shouldExecuteClickCallback ? onToastClick(toast) : null;
    },
    [onToastClick]
  );

  // 🔧 토스트 닫기 버튼 클릭 핸들러
  const handleCloseButtonClick = useCallback(
    (
      clickEvent: React.MouseEvent<HTMLButtonElement>,
      toastId: string
    ): void => {
      clickEvent.stopPropagation();
      removeToastById(toastId);
    },
    [removeToastById]
  );

  // Early Return: 토스트가 없으면 렌더링하지 않음
  const hasActiveToasts = activeToasts.length > 0;
  if (!hasActiveToasts) {
    return <></>;
  }

  const positionClasses = getPositionClasses(safePosition);
  const ariaAttributes = generateStandardAriaAttributes('toast', {
    label: '브릿지 실행 결과 알림',
    description: `현재 ${activeToasts.length}개의 알림이 있습니다`,
    disabled: false,
    loading: false,
  });

  logComponentRender('BRIDGE_TOAST', {
    size: safeSize,
    variant: safeVariant,
    toastCount: activeToasts.length,
    autoDetect: safeAutoDetectResults,
  });

  return (
    <div
      className={`fixed z-50 pointer-events-none ${positionClasses} ${safeClassName}`}
      {...ariaAttributes}
    >
      <div className="flex flex-col space-y-2">
        {activeToasts.map((toast, index) => {
          const { containerClass, iconClass, icon } = getToastTypeClasses(
            toast.type
          );
          const translateY = index * (spacing + 4);

          const shouldShowClickCursor = onToastClick !== undefined;
          const animationClasses = safeDisableAnimation
            ? ''
            : 'animate-in slide-in-from-right-5 duration-300';
          const clickableClasses = shouldShowClickCursor
            ? 'cursor-pointer hover:shadow-xl'
            : '';

          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                w-80 max-w-sm
                p-4
                border
                rounded-lg
                shadow-lg
                backdrop-blur-sm
                ${containerClass}
                ${animationClasses}
                ${clickableClasses}
                transition-all duration-200
              `}
              style={{
                transform: `translateY(${translateY}px)`,
              }}
              onClick={() => handleToastClick(toast)}
              role="alert"
              aria-atomic="true"
              tabIndex={shouldShowClickCursor ? 0 : -1}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${iconClass}`}>{icon}</div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-5">
                    {toast.title}
                  </h4>
                  {toast.description ? (
                    <p className="mt-1 text-xs leading-4 opacity-90">
                      {toast.description}
                    </p>
                  ) : null}
                </div>

                {safeShowCloseButton ? (
                  <button
                    type="button"
                    className="flex-shrink-0 p-1 transition-colors rounded-md hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
                    onClick={(clickEvent) =>
                      handleCloseButtonClick(clickEvent, toast.id)
                    }
                    aria-label={`${toast.title} 알림 닫기`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {safeShowClearAllButton && activeToasts.length >= clearAllThreshold ? (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium text-gray-600 transition-colors bg-white border border-gray-300 rounded-md pointer-events-auto bg-opacity-90 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={clearAllToasts}
            aria-label="모든 알림 닫기"
          >
            모두 닫기
          </button>
        </div>
      ) : null}
    </div>
  );
}

// 🔧 표준화된 토스트 훅
export const useBridgeToast = (defaultConfig?: Partial<BridgeToastProps>) => {
  const { logComponentAction } = createStandardizationUtils();
  logComponentAction('BRIDGE_TOAST_HOOK', '브릿지 토스트 훅 초기화');

  const renderToast = useCallback(
    (customConfig?: Partial<BridgeToastProps>) => {
      const finalConfig = { ...defaultConfig, ...customConfig };
      return <BridgeToast {...finalConfig} />;
    },
    [defaultConfig]
  );

  // 수동 토스트 추가 함수
  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
      logComponentAction('BRIDGE_TOAST_HOOK', '수동 토스트 추가', {
        type: toast.type,
        title: toast.title,
      });
      // 이 부분은 실제로는 글로벌 상태나 이벤트를 통해 구현해야 하지만
      // 데모를 위해 간단히 처리
      console.log('수동 토스트 추가:', toast);
    },
    []
  );

  return {
    ToastComponent: renderToast,
    BridgeToast: BridgeToast,
    addToast,
  };
};
