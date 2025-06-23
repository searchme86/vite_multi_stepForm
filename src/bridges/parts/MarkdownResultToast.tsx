// bridges/editorMultiStepBridge/parts/MarkdownResultToast.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBridgeUIComponents } from '../hooks/useBridgeUIComponents';

import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeDataTypes';

// 🔧 토스트 메시지 인터페이스
interface ToastMessage {
  readonly id: string;
  readonly type: 'success' | 'error' | 'warning' | 'info';
  readonly title: string;
  readonly description?: string;
  readonly duration?: number;
  readonly timestamp: number;
}

// 🔧 토스트 컴포넌트 Props 인터페이스
interface MarkdownResultToastProps {
  readonly position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  readonly defaultDuration?: number;
  readonly maxToasts?: number;
  readonly spacing?: number;
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;
  readonly onToastClick?: (toast: ToastMessage) => void;
  readonly onToastClose?: (toast: ToastMessage) => void;
  readonly className?: string;
  readonly disableAnimation?: boolean;
}

export function MarkdownResultToast({
  position = 'top-right',
  defaultDuration = 5000,
  maxToasts = 5,
  spacing = 12,
  bridgeConfig,
  onToastClick,
  onToastClose,
  className = '',
  disableAnimation = false,
}: MarkdownResultToastProps): React.ReactElement {
  console.log('🍞 [RESULT_TOAST] 토스트 컴포넌트 초기화');

  // 🔧 Bridge UI Hook 사용 - 양방향 기능 포함
  const {
    lastTransferResult: mostRecentTransferResult,
    transferErrors: accumulatedTransferErrors,
    transferWarnings: accumulatedTransferWarnings,
    isTransferring: isCurrentlyTransferring,
    transferAttemptCount: totalTransferAttempts,
    lastReverseTransferResult: mostRecentReverseResult,
    isReverseTransferring: isCurrentlyReverseTransferring,
    lastBidirectionalSyncResult: mostRecentSyncResult,
    isBidirectionalSyncing: isCurrentlyBidirectionalSyncing,
  } = useBridgeUIComponents(bridgeConfig);

  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);

  const lastProcessedTransferCount = useRef<number>(0);
  const lastProcessedReverseResult = useRef<any>(null);
  const lastProcessedSyncResult = useRef<any>(null);

  // 🔧 브라우저 환경용 타이머 타입 - NodeJS.Timeout 대신 number 사용
  const toastTimers = useRef<Map<string, number>>(new Map());

  // 🔧 고유 토스트 ID 생성
  const generateUniqueToastId = useCallback((): string => {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 8);
    return `toast_${timestamp}_${randomString}`;
  }, []);

  // 🔧 새 토스트 추가
  const addNewToast = useCallback(
    (newToast: Omit<ToastMessage, 'id' | 'timestamp'>): void => {
      console.log(
        '🍞 [RESULT_TOAST] 새 토스트 추가:',
        newToast.type,
        newToast.title
      );

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

        if (isDuplicateToast) {
          console.log('🍞 [RESULT_TOAST] 중복 토스트 감지, 추가 생략');
          return previousToasts;
        }

        let updatedToasts = [...previousToasts, completeToast];
        if (updatedToasts.length > maxToasts) {
          const removedToast = updatedToasts.shift();
          if (removedToast) {
            console.log(
              '🍞 [RESULT_TOAST] 최대 개수 초과로 오래된 토스트 제거:',
              removedToast.id
            );
            const existingTimer = toastTimers.current.get(removedToast.id);
            if (existingTimer) {
              window.clearTimeout(existingTimer);
              toastTimers.current.delete(removedToast.id);
            }
          }
        }

        return updatedToasts;
      });

      const toastDuration = newToast.duration || defaultDuration;
      if (toastDuration > 0) {
        // 🔧 window.setTimeout 사용으로 브라우저 환경 명시
        const timerId = window.setTimeout(() => {
          console.log(
            '🍞 [RESULT_TOAST] 자동 닫기 타이머 실행:',
            completeToast.id
          );
          removeToastById(completeToast.id);
        }, toastDuration);

        toastTimers.current.set(completeToast.id, timerId);
      }
    },
    [generateUniqueToastId, maxToasts, defaultDuration]
  );

  // 🔧 토스트 제거
  const removeToastById = useCallback(
    (toastIdToRemove: string): void => {
      console.log('🍞 [RESULT_TOAST] 토스트 제거:', toastIdToRemove);

      setActiveToasts((previousToasts) => {
        const toastToRemove = previousToasts.find(
          (toast) => toast.id === toastIdToRemove
        );

        if (toastToRemove && onToastClose) {
          onToastClose(toastToRemove);
        }

        return previousToasts.filter((toast) => toast.id !== toastIdToRemove);
      });

      const existingTimer = toastTimers.current.get(toastIdToRemove);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
        toastTimers.current.delete(toastIdToRemove);
      }
    },
    [onToastClose]
  );

  // 🔧 모든 토스트 제거
  const clearAllToasts = useCallback((): void => {
    console.log('🍞 [RESULT_TOAST] 모든 토스트 제거');

    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current.clear();

    setActiveToasts([]);
  }, []);

  // 🔧 Editor → MultiStep 전송 결과 감지 (기존 기능)
  useEffect(() => {
    if (
      totalTransferAttempts > lastProcessedTransferCount.current &&
      !isCurrentlyTransferring &&
      mostRecentTransferResult
    ) {
      console.log('🍞 [RESULT_TOAST] Editor → MultiStep 전송 결과 감지:', {
        success: mostRecentTransferResult.operationSuccess,
        attempts: totalTransferAttempts,
        errors: accumulatedTransferErrors.length,
        warnings: accumulatedTransferWarnings.length,
      });

      const {
        operationSuccess,
        operationDuration,
        transferredData,
        operationErrors,
      } = mostRecentTransferResult;

      if (operationSuccess) {
        const successMessage = transferredData
          ? `${transferredData.transformedContent.length.toLocaleString()}자의 마크다운이 생성되었습니다`
          : '마크다운 생성이 완료되었습니다';

        addNewToast({
          type: 'success',
          title: '마크다운 생성 성공',
          description: `${successMessage} (소요시간: ${operationDuration.toFixed(
            1
          )}ms)`,
          duration: defaultDuration,
        });
      } else {
        const primaryError =
          operationErrors.length > 0
            ? operationErrors[0].errorMessage
            : '알 수 없는 오류가 발생했습니다';

        const errorDescription =
          operationErrors.length > 1
            ? `${primaryError} 외 ${operationErrors.length - 1}개의 추가 오류`
            : primaryError;

        addNewToast({
          type: 'error',
          title: '마크다운 생성 실패',
          description: errorDescription,
          duration: defaultDuration * 1.5,
        });
      }

      if (accumulatedTransferWarnings.length > 0) {
        const warningCount = accumulatedTransferWarnings.length;
        const warningDescription =
          warningCount === 1
            ? accumulatedTransferWarnings[0]
            : `${accumulatedTransferWarnings[0]} 외 ${warningCount - 1}개`;

        addNewToast({
          type: 'warning',
          title: '주의사항 확인',
          description: warningDescription,
          duration: defaultDuration,
        });
      }

      lastProcessedTransferCount.current = totalTransferAttempts;
    }
  }, [
    totalTransferAttempts,
    isCurrentlyTransferring,
    mostRecentTransferResult,
    accumulatedTransferErrors,
    accumulatedTransferWarnings,
    addNewToast,
    defaultDuration,
  ]);

  // 🆕 MultiStep → Editor 역방향 전송 결과 감지 (새로운 기능)
  useEffect(() => {
    if (
      mostRecentReverseResult &&
      mostRecentReverseResult !== lastProcessedReverseResult.current &&
      !isCurrentlyReverseTransferring
    ) {
      console.log('🍞 [RESULT_TOAST] MultiStep → Editor 역방향 결과 감지:', {
        success: mostRecentReverseResult.transformationSuccess,
      });

      if (mostRecentReverseResult.transformationSuccess) {
        addNewToast({
          type: 'success',
          title: '역방향 동기화 성공',
          description: `Editor에 ${mostRecentReverseResult.editorContent.length}자의 콘텐츠가 동기화되었습니다`,
          duration: defaultDuration,
        });
      } else {
        const errorMessage =
          mostRecentReverseResult.transformationErrors.join(', ');
        addNewToast({
          type: 'error',
          title: '역방향 동기화 실패',
          description: errorMessage || '알 수 없는 오류가 발생했습니다',
          duration: defaultDuration * 1.5,
        });
      }

      lastProcessedReverseResult.current = mostRecentReverseResult;
    }
  }, [
    mostRecentReverseResult,
    isCurrentlyReverseTransferring,
    addNewToast,
    defaultDuration,
  ]);

  // 🆕 양방향 동기화 결과 감지 (새로운 기능)
  useEffect(() => {
    if (
      mostRecentSyncResult &&
      mostRecentSyncResult !== lastProcessedSyncResult.current &&
      !isCurrentlyBidirectionalSyncing
    ) {
      console.log('🍞 [RESULT_TOAST] 양방향 동기화 결과 감지:', {
        overallSuccess: mostRecentSyncResult.overallSuccess,
        editorToMultiStep: mostRecentSyncResult.editorToMultiStepSuccess,
        multiStepToEditor: mostRecentSyncResult.multiStepToEditorSuccess,
      });

      if (mostRecentSyncResult.overallSuccess) {
        addNewToast({
          type: 'success',
          title: '양방향 동기화 완료',
          description: `Editor ↔ MultiStep 양방향 동기화가 성공적으로 완료되었습니다 (${mostRecentSyncResult.syncDuration.toFixed(
            1
          )}ms)`,
          duration: defaultDuration,
        });
      } else {
        const {
          editorToMultiStepSuccess,
          multiStepToEditorSuccess,
          syncErrors,
        } = mostRecentSyncResult;

        let statusMessage = '';
        if (!editorToMultiStepSuccess && !multiStepToEditorSuccess) {
          statusMessage = '양방향 동기화 모두 실패';
        } else if (!editorToMultiStepSuccess) {
          statusMessage = 'Editor → MultiStep 동기화 실패';
        } else if (!multiStepToEditorSuccess) {
          statusMessage = 'MultiStep → Editor 동기화 실패';
        }

        const errorDescription =
          syncErrors.length > 0
            ? `${statusMessage}: ${syncErrors[0]}`
            : statusMessage;

        addNewToast({
          type: 'warning',
          title: '양방향 동기화 부분 실패',
          description: errorDescription,
          duration: defaultDuration * 1.5,
        });
      }

      lastProcessedSyncResult.current = mostRecentSyncResult;
    }
  }, [
    mostRecentSyncResult,
    isCurrentlyBidirectionalSyncing,
    addNewToast,
    defaultDuration,
  ]);

  // 🔧 컴포넌트 정리 시 타이머 정리
  useEffect(() => {
    return () => {
      console.log('🍞 [RESULT_TOAST] 컴포넌트 정리 - 모든 타이머 취소');
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  // 🔧 위치 클래스 계산
  const getPositionClasses = useCallback((toastPosition: string): string => {
    const positionClassMap: Record<string, string> = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    };
    return positionClassMap[toastPosition] || positionClassMap['top-right'];
  }, []);

  // 🔧 토스트 타입별 스타일 계산
  const getToastTypeClasses = useCallback(
    (
      toastType: ToastMessage['type']
    ): {
      containerClass: string;
      iconClass: string;
      icon: React.ReactNode;
    } => {
      const typeStyleMap = {
        success: {
          containerClass: 'bg-green-50 border-green-200 text-green-800',
          iconClass: 'text-green-500',
          icon: (
            <svg
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
        error: {
          containerClass: 'bg-red-50 border-red-200 text-red-800',
          iconClass: 'text-red-500',
          icon: (
            <svg
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
        warning: {
          containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconClass: 'text-yellow-500',
          icon: (
            <svg
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
        info: {
          containerClass: 'bg-blue-50 border-blue-200 text-blue-800',
          iconClass: 'text-blue-500',
          icon: (
            <svg
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
      };

      return typeStyleMap[toastType];
    },
    []
  );

  // 🔧 토스트 클릭 핸들러
  const handleToastClick = useCallback(
    (toast: ToastMessage): void => {
      console.log('🍞 [RESULT_TOAST] 토스트 클릭:', toast.id);
      if (onToastClick) {
        onToastClick(toast);
      }
    },
    [onToastClick]
  );

  // 🔧 토스트가 없으면 렌더링하지 않음
  if (activeToasts.length === 0) {
    return <></>;
  }

  const positionClasses = getPositionClasses(position);

  console.log('🍞 [RESULT_TOAST] 토스트 렌더링:', {
    count: activeToasts.length,
    position,
    disableAnimation,
  });

  return (
    <div
      className={`fixed z-50 pointer-events-none ${positionClasses} ${className}`}
      role="region"
      aria-live="polite"
      aria-label="마크다운 생성 결과 알림"
    >
      <div className="flex flex-col space-y-2">
        {activeToasts.map((toast, index) => {
          const { containerClass, iconClass, icon } = getToastTypeClasses(
            toast.type
          );
          const translateY = index * (spacing + 4);

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
                ${
                  disableAnimation
                    ? ''
                    : 'animate-in slide-in-from-right-5 duration-300'
                }
                ${onToastClick ? 'cursor-pointer hover:shadow-xl' : ''}
                transition-all duration-200
              `}
              style={{
                transform: `translateY(${translateY}px)`,
              }}
              onClick={() => handleToastClick(toast)}
              role="alert"
              aria-atomic="true"
              tabIndex={onToastClick ? 0 : -1}
              onKeyDown={(e) => {
                if (onToastClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleToastClick(toast);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${iconClass}`}>{icon}</div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-5">
                    {toast.title}
                  </h4>
                  {toast.description && (
                    <p className="mt-1 text-xs leading-4 opacity-90">
                      {toast.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="flex-shrink-0 p-1 transition-colors rounded-md hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToastById(toast.id);
                  }}
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
              </div>
            </div>
          );
        })}
      </div>

      {activeToasts.length >= 3 && (
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
      )}
    </div>
  );
}

// 🔧 마크다운 토스트 훅
export const useMarkdownToast = (
  defaultConfig?: Partial<MarkdownResultToastProps>
) => {
  console.log('🍞 [TOAST_HOOK] 마크다운 토스트 훅 초기화');

  const renderToast = useCallback(
    (customConfig?: Partial<MarkdownResultToastProps>) => {
      const finalConfig = { ...defaultConfig, ...customConfig };
      return <MarkdownResultToast {...finalConfig} />;
    },
    [defaultConfig]
  );

  return {
    ToastComponent: renderToast,
    MarkdownToast: MarkdownResultToast,
  };
};
