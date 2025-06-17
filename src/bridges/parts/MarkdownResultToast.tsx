// bridges/parts/MarkdownResultToast.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeTypes';

// 토스트 알림의 타입을 정의하는 인터페이스
// 다양한 상황에 맞는 메시지와 스타일을 제공
interface ToastMessage {
  // 고유 식별자 - 중복 토스트 방지 및 추적용
  readonly id: string;

  // 토스트 타입 - 시각적 스타일과 아이콘 결정
  readonly type: 'success' | 'error' | 'warning' | 'info';

  // 사용자에게 보여질 주요 메시지
  readonly title: string;

  // 추가 설명이나 세부 정보 (선택사항)
  readonly description?: string;

  // 자동 닫힘 시간 (밀리초, 0이면 수동 닫기만 가능)
  readonly duration?: number;

  // 토스트 생성 시각 - 순서 정렬 및 만료 계산용
  readonly timestamp: number;
}

// 토스트 컴포넌트의 프로퍼티 인터페이스
interface MarkdownResultToastProps {
  // 토스트가 표시될 화면 위치
  readonly position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';

  // 기본 자동 닫힘 시간 (밀리초)
  readonly defaultDuration?: number;

  // 최대 동시 표시 가능한 토스트 개수
  readonly maxToasts?: number;

  // 토스트 간의 수직 간격 (px)
  readonly spacing?: number;

  // 사용자 정의 브릿지 설정
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;

  // 토스트 클릭 시 호출될 콜백 함수
  readonly onToastClick?: (toast: ToastMessage) => void;

  // 토스트 닫힘 시 호출될 콜백 함수
  readonly onToastClose?: (toast: ToastMessage) => void;

  // 커스텀 CSS 클래스
  readonly className?: string;

  // 애니메이션 비활성화 여부
  readonly disableAnimation?: boolean;
}

/**
 * 마크다운 전송 결과를 사용자에게 알리는 토스트 컴포넌트
 * 브릿지 시스템의 전송 결과를 실시간으로 감지하여 적절한 알림 표시
 *
 * 주요 기능:
 * 1. 전송 성공/실패 자동 감지
 * 2. 타입별 차별화된 시각적 피드백
 * 3. 자동 닫힘 및 수동 닫기 지원
 * 4. 다중 토스트 관리 (순서, 제한)
 * 5. 웹접근성 완벽 지원
 * 6. 애니메이션 및 반응형 디자인
 *
 * @param props - 토스트 설정 옵션들
 * @returns JSX 엘리먼트
 */
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

  // 브릿지 UI 훅 연결 - 전송 결과 실시간 감지
  const {
    lastTransferResult: mostRecentTransferResult,
    transferErrors: accumulatedTransferErrors,
    transferWarnings: accumulatedTransferWarnings,
    isTransferring: isCurrentlyTransferring,
    transferAttemptCount: totalTransferAttempts,
  } = useBridgeUI(bridgeConfig);

  // 현재 활성화된 토스트들의 상태 관리
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);

  // 마지막으로 처리한 전송 시도 횟수 추적 (중복 알림 방지)
  const lastProcessedTransferCount = useRef<number>(0);

  // 토스트 자동 닫기 타이머들 관리
  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 고유한 토스트 ID 생성 함수
  // 타임스탬프와 랜덤 문자열을 조합하여 충돌 방지
  const generateUniqueToastId = useCallback((): string => {
    const timestamp = Date.now().toString(36); // 36진수로 압축된 타임스탬프
    const randomString = Math.random().toString(36).substring(2, 8); // 6자리 랜덤 문자열
    return `toast_${timestamp}_${randomString}`;
  }, []);

  // 새로운 토스트를 추가하는 함수
  // 최대 개수 제한과 중복 방지 로직 포함
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
        // 동일한 타입과 제목의 토스트가 이미 있는지 확인 (중복 방지)
        const isDuplicateToast = previousToasts.some(
          (existingToast) =>
            existingToast.type === completeToast.type &&
            existingToast.title === completeToast.title
        );

        if (isDuplicateToast) {
          console.log('🍞 [RESULT_TOAST] 중복 토스트 감지, 추가 생략');
          return previousToasts;
        }

        // 최대 개수 초과 시 가장 오래된 토스트 제거
        let updatedToasts = [...previousToasts, completeToast];
        if (updatedToasts.length > maxToasts) {
          const removedToast = updatedToasts.shift(); // 첫 번째(가장 오래된) 토스트 제거
          if (removedToast) {
            console.log(
              '🍞 [RESULT_TOAST] 최대 개수 초과로 오래된 토스트 제거:',
              removedToast.id
            );
            // 제거된 토스트의 타이머도 정리
            const existingTimer = toastTimers.current.get(removedToast.id);
            if (existingTimer) {
              clearTimeout(existingTimer);
              toastTimers.current.delete(removedToast.id);
            }
          }
        }

        return updatedToasts;
      });

      // 자동 닫기 타이머 설정 (duration이 0보다 클 때만)
      const toastDuration = newToast.duration || defaultDuration;
      if (toastDuration > 0) {
        const timerId = setTimeout(() => {
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

  // 특정 ID의 토스트를 제거하는 함수
  const removeToastById = useCallback(
    (toastIdToRemove: string): void => {
      console.log('🍞 [RESULT_TOAST] 토스트 제거:', toastIdToRemove);

      setActiveToasts((previousToasts) => {
        const toastToRemove = previousToasts.find(
          (toast) => toast.id === toastIdToRemove
        );

        // onToastClose 콜백 호출
        if (toastToRemove && onToastClose) {
          onToastClose(toastToRemove);
        }

        return previousToasts.filter((toast) => toast.id !== toastIdToRemove);
      });

      // 해당 토스트의 타이머 정리
      const existingTimer = toastTimers.current.get(toastIdToRemove);
      if (existingTimer) {
        clearTimeout(existingTimer);
        toastTimers.current.delete(toastIdToRemove);
      }
    },
    [onToastClose]
  );

  // 모든 토스트를 제거하는 함수
  const clearAllToasts = useCallback((): void => {
    console.log('🍞 [RESULT_TOAST] 모든 토스트 제거');

    // 모든 타이머 정리
    toastTimers.current.forEach((timer) => clearTimeout(timer));
    toastTimers.current.clear();

    setActiveToasts([]);
  }, []);

  // 브릿지 전송 결과 변화 감지 및 토스트 생성
  useEffect(() => {
    // 전송 시도 횟수가 변경되었고, 전송이 완료된 상태일 때만 처리
    if (
      totalTransferAttempts > lastProcessedTransferCount.current &&
      !isCurrentlyTransferring &&
      mostRecentTransferResult
    ) {
      console.log('🍞 [RESULT_TOAST] 전송 결과 감지:', {
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
        // 성공 토스트 생성
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
        // 실패 토스트 생성
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
          duration: defaultDuration * 1.5, // 오류는 더 오래 표시
        });
      }

      // 경고가 있는 경우 별도 토스트 표시
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

      // 처리 완료된 전송 횟수 업데이트
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

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      console.log('🍞 [RESULT_TOAST] 컴포넌트 정리 - 모든 타이머 취소');
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  // 토스트 위치에 따른 CSS 클래스 계산
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

  // 토스트 타입에 따른 스타일 클래스 계산
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

  // 토스트 클릭 핸들러
  const handleToastClick = useCallback(
    (toast: ToastMessage): void => {
      console.log('🍞 [RESULT_TOAST] 토스트 클릭:', toast.id);
      if (onToastClick) {
        onToastClick(toast);
      }
    },
    [onToastClick]
  );

  // 토스트가 없으면 렌더링하지 않음
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
          const translateY = index * (spacing + 4); // 토스트 간 수직 간격

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
                {/* 아이콘 */}
                <div className={`flex-shrink-0 ${iconClass}`}>{icon}</div>

                {/* 콘텐츠 */}
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

                {/* 닫기 버튼 */}
                <button
                  type="button"
                  className="flex-shrink-0 p-1 transition-colors rounded-md hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
                  onClick={(e) => {
                    e.stopPropagation(); // 토스트 클릭 이벤트와 분리
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

      {/* 다중 토스트가 있을 때 전체 닫기 버튼 (3개 이상일 때만 표시) */}
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

// 토스트 컴포넌트의 편의 기능들을 제공하는 유틸리티 훅
export const useMarkdownToast = (
  defaultConfig?: Partial<MarkdownResultToastProps>
) => {
  console.log('🍞 [TOAST_HOOK] 마크다운 토스트 훅 초기화');

  // 토스트 컴포넌트 렌더링 함수
  const renderToast = useCallback(
    (customConfig?: Partial<MarkdownResultToastProps>) => {
      const finalConfig = { ...defaultConfig, ...customConfig };
      return <MarkdownResultToast {...finalConfig} />;
    },
    [defaultConfig]
  );

  return {
    // 토스트 컴포넌트 렌더링
    ToastComponent: renderToast,

    // 직접 사용할 수 있는 토스트 컴포넌트
    MarkdownToast: MarkdownResultToast,
  };
};
