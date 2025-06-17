// bridges/parts/QuickStatusBar.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeTypes';

// 빠른 상태바의 위치를 정의하는 타입
// 다양한 화면 크기와 사용자 선호도에 맞춰 유연한 배치 제공
type QuickStatusBarPosition = 'top' | 'bottom';

// 빠른 상태바의 시각적 변형을 정의하는 타입
// 사용 맥락에 따라 적절한 스타일 선택 가능
type QuickStatusBarVariant = 'minimal' | 'standard' | 'tab-bar' | 'floating';

// 빠른 상태바 컴포넌트의 프로퍼티 인터페이스
interface QuickStatusBarProps {
  // 상태바가 표시될 화면 위치
  readonly position?: QuickStatusBarPosition;

  // 상태바의 시각적 스타일 변형
  readonly variant?: QuickStatusBarVariant;

  // 진행률 바 표시 여부
  readonly showProgressBar?: boolean;

  // 빠른 액션 버튼들 표시 여부
  readonly showQuickActions?: boolean;

  // 통계 정보 표시 여부 (컨테이너/문단 수)
  readonly showStatistics?: boolean;

  // 상태바 자동 숨김 여부 (일정 시간 후)
  readonly autoHide?: boolean;

  // 자동 숨김 지연 시간 (밀리초)
  readonly autoHideDelay?: number;

  // 상태바 접기/펼치기 가능 여부
  readonly collapsible?: boolean;

  // 사용자 정의 브릿지 설정
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;

  // 빠른 전송 버튼 클릭 시 호출될 콜백
  readonly onQuickTransfer?: () => void;

  // 상세 정보 보기 버튼 클릭 시 호출될 콜백
  readonly onShowDetails?: () => void;

  // 상태바 클릭 시 호출될 콜백
  readonly onClick?: () => void;

  // 커스텀 CSS 클래스
  readonly className?: string;
}

/**
 * 빠른 상태 확인 바 컴포넌트
 * 브릿지 전송 상태를 간결하게 표시하고 빠른 액션을 제공하는 고정 UI
 *
 * 주요 기능:
 * 1. 전송 가능 여부 빠른 확인
 * 2. 진행률 시각화
 * 3. 원클릭 전송 및 상세 보기
 * 4. 모바일/데스크톱 반응형 디자인
 * 5. 최소한의 공간 사용으로 방해받지 않는 UX
 * 6. 웹접근성 완벽 지원
 *
 * @param props - 상태바 설정 옵션들
 * @returns JSX 엘리먼트
 */
export function QuickStatusBar({
  position = 'top',
  variant = 'standard',
  showProgressBar = true,
  showQuickActions = true,
  showStatistics = true,
  autoHide = false,
  autoHideDelay = 5000,
  collapsible = false,
  bridgeConfig,
  onQuickTransfer,
  onShowDetails,
  onClick,
  className = '',
}: QuickStatusBarProps): React.ReactElement {
  console.log('⚡ [QUICK_STATUS] 빠른 상태바 렌더링:', {
    position,
    variant,
    showProgressBar,
    showQuickActions,
  });

  // 브릿지 UI 훅 연결 - 실시간 상태 정보 가져오기
  const {
    canTransfer: isTransferPossible,
    isTransferring: isCurrentlyTransferring,
    validationStatus: currentValidationStatus,
    transferErrors: accumulatedTransferErrors,
    transferWarnings: accumulatedTransferWarnings,
    executeManualTransfer: performManualTransfer,
  } = useBridgeUI(bridgeConfig);

  // 상태바 접기/펼치기 상태 관리
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // 자동 숨김 상태 관리
  const [isAutoHidden, setIsAutoHidden] = useState<boolean>(false);

  // 검증 상태에서 세부 정보 추출
  const {
    containerCount,
    paragraphCount,
    assignedParagraphCount,
    unassignedParagraphCount,
    totalContentLength,
    validationErrors,
    validationWarnings,
    isReadyForTransfer,
  } = currentValidationStatus;

  // 전체 상태 요약 계산
  const statusSummary = useMemo(() => {
    // 오류가 있는 경우
    if (validationErrors.length > 0) {
      return {
        status: 'error',
        color: 'red',
        label: '오류',
        icon: 'error',
        bgColor: 'bg-red-500',
        textColor: 'text-red-600',
        description: `${validationErrors.length}개 오류`,
      };
    }

    // 전송 중인 경우
    if (isCurrentlyTransferring) {
      return {
        status: 'transferring',
        color: 'blue',
        label: '전송중',
        icon: 'loading',
        bgColor: 'bg-blue-500',
        textColor: 'text-blue-600',
        description: '데이터 전송 진행중',
      };
    }

    // 전송 가능한 경우
    if (isTransferPossible && isReadyForTransfer) {
      return {
        status: 'ready',
        color: 'green',
        label: '준비완료',
        icon: 'ready',
        bgColor: 'bg-green-500',
        textColor: 'text-green-600',
        description: '전송 준비 완료',
      };
    }

    // 경고가 있는 경우
    if (validationWarnings.length > 0) {
      return {
        status: 'warning',
        color: 'yellow',
        label: '주의',
        icon: 'warning',
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        description: `${validationWarnings.length}개 경고`,
      };
    }

    // 기본 대기 상태
    return {
      status: 'waiting',
      color: 'gray',
      label: '대기중',
      icon: 'waiting',
      bgColor: 'bg-gray-500',
      textColor: 'text-gray-600',
      description: '작업 진행 필요',
    };
  }, [
    validationErrors.length,
    isCurrentlyTransferring,
    isTransferPossible,
    isReadyForTransfer,
    validationWarnings.length,
  ]);

  // 진행률 계산 (할당된 문단 비율)
  const progressPercentage = useMemo(() => {
    if (paragraphCount === 0) return 0;
    return Math.round((assignedParagraphCount / paragraphCount) * 100);
  }, [assignedParagraphCount, paragraphCount]);

  // 빠른 전송 실행 핸들러
  const handleQuickTransfer = useCallback(async (): Promise<void> => {
    console.log('⚡ [QUICK_STATUS] 빠른 전송 실행');

    if (!isTransferPossible || isCurrentlyTransferring) {
      console.warn('⚡ [QUICK_STATUS] 전송 불가능한 상태');
      return;
    }

    try {
      if (onQuickTransfer) {
        onQuickTransfer();
      } else {
        await performManualTransfer();
      }
    } catch (transferError) {
      console.error('⚡ [QUICK_STATUS] 빠른 전송 실행 중 오류:', transferError);
    }
  }, [
    isTransferPossible,
    isCurrentlyTransferring,
    onQuickTransfer,
    performManualTransfer,
  ]);

  // 상세 정보 보기 핸들러
  const handleShowDetails = useCallback((): void => {
    console.log('⚡ [QUICK_STATUS] 상세 정보 보기');
    if (onShowDetails) {
      onShowDetails();
    }
  }, [onShowDetails]);

  // 상태바 토글 핸들러
  const handleToggleCollapse = useCallback((): void => {
    console.log('⚡ [QUICK_STATUS] 상태바 토글');
    setIsCollapsed((prev) => !prev);
  }, []);

  // 상태바 클릭 핸들러
  const handleStatusBarClick = useCallback((): void => {
    console.log('⚡ [QUICK_STATUS] 상태바 클릭');
    if (onClick) {
      onClick();
    } else if (onShowDetails) {
      handleShowDetails();
    }
  }, [onClick, onShowDetails, handleShowDetails]);

  // 위치에 따른 CSS 클래스 계산
  const getPositionClasses = useCallback(
    (barPosition: QuickStatusBarPosition): string => {
      const positionClassMap: Record<QuickStatusBarPosition, string> = {
        top: 'top-0 left-0 right-0',
        bottom: 'bottom-0 left-0 right-0',
      };
      return positionClassMap[barPosition];
    },
    []
  );

  // 변형에 따른 CSS 클래스 계산
  const getVariantClasses = useCallback(
    (barVariant: QuickStatusBarVariant): string => {
      const variantClassMap: Record<QuickStatusBarVariant, string> = {
        minimal: 'h-8 bg-white border-b border-gray-200 shadow-sm',
        standard: 'h-12 bg-white border-b border-gray-200 shadow-md',
        'tab-bar': 'h-16 bg-white border-t border-gray-200 shadow-lg',
        floating:
          'h-10 mx-4 mt-2 mb-2 bg-white rounded-lg border border-gray-200 shadow-lg',
      };
      return variantClassMap[barVariant];
    },
    []
  );

  // 상태 아이콘 컴포넌트
  const StatusIcon = ({
    iconType,
    className: iconClassName,
  }: {
    iconType: string;
    className?: string;
  }) => {
    const iconClasses = `w-4 h-4 ${iconClassName || ''}`;

    switch (iconType) {
      case 'loading':
        return (
          <svg
            className={`animate-spin ${iconClasses}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className={iconClasses}
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
        );
      case 'warning':
        return (
          <svg
            className={iconClasses}
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
        );
      case 'ready':
        return (
          <svg
            className={iconClasses}
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
        );
      case 'waiting':
        return (
          <svg
            className={iconClasses}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // 자동 숨김 처리
  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsAutoHidden(true);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

  // 자동 숨김 상태거나 접힌 상태면 최소화된 UI 표시
  if (isAutoHidden || isCollapsed) {
    return (
      <div
        className={`
          fixed z-40
          ${getPositionClasses(position)}
          ${position === 'top' ? 'h-1' : 'h-1'}
          ${statusSummary.bgColor}
          cursor-pointer
          transition-all duration-300
          ${className}
        `}
        onClick={() => {
          setIsAutoHidden(false);
          setIsCollapsed(false);
        }}
        role="button"
        tabIndex={0}
        aria-label={`마크다운 상태: ${statusSummary.label} - 클릭하여 펼치기`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsAutoHidden(false);
            setIsCollapsed(false);
          }
        }}
      />
    );
  }

  const positionClasses = getPositionClasses(position);
  const variantClasses = getVariantClasses(variant);

  console.log('⚡ [QUICK_STATUS] 상태바 렌더링 완료:', {
    status: statusSummary.status,
    progressPercentage,
    isTransferPossible,
    canTransfer: isTransferPossible && isReadyForTransfer,
  });

  return (
    <div
      className={`
        fixed z-40
        ${positionClasses}
        ${variantClasses}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
      onClick={handleStatusBarClick}
      role="region"
      aria-label="마크다운 브릿지 빠른 상태"
      aria-live="polite"
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* 왼쪽: 상태 정보 */}
        <div className="flex items-center space-x-3">
          {/* 상태 아이콘 및 라벨 */}
          <div className="flex items-center space-x-2">
            <StatusIcon
              iconType={statusSummary.icon}
              className={statusSummary.textColor}
            />
            <span className={`text-sm font-medium ${statusSummary.textColor}`}>
              {statusSummary.label}
            </span>
          </div>

          {/* 통계 정보 (컴팩트 모드가 아닐 때만) */}
          {showStatistics && variant !== 'minimal' && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded">
                컨테이너 {containerCount}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                문단 {assignedParagraphCount}/{paragraphCount}
              </span>
            </div>
          )}

          {/* 진행률 바 (표준 모드 이상일 때만) */}
          {showProgressBar && variant !== 'minimal' && paragraphCount > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 overflow-hidden bg-gray-200 rounded-full">
                <div
                  className={`h-full ${statusSummary.bgColor} transition-all duration-300`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* 오른쪽: 액션 버튼들 */}
        {showQuickActions && (
          <div className="flex items-center space-x-2">
            {/* 상세 정보 버튼 */}
            {onShowDetails && (
              <button
                type="button"
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowDetails();
                }}
                aria-label="상세 정보 보기"
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            )}

            {/* 빠른 전송 버튼 */}
            <button
              type="button"
              disabled={
                !isTransferPossible ||
                !isReadyForTransfer ||
                isCurrentlyTransferring
              }
              className={`
                px-3 py-1 text-xs font-medium rounded
                transition-all duration-200
                ${
                  isTransferPossible &&
                  isReadyForTransfer &&
                  !isCurrentlyTransferring
                    ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickTransfer();
              }}
              aria-label={
                isCurrentlyTransferring ? '전송 진행 중' : '빠른 전송 실행'
              }
            >
              {isCurrentlyTransferring ? '전송중...' : '전송'}
            </button>

            {/* 접기 버튼 (접기 가능할 때만) */}
            {collapsible && (
              <button
                type="button"
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCollapse();
                }}
                aria-label="상태바 접기"
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
                    d={position === 'top' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 빠른 상태바 컴포넌트 사용을 위한 편의 훅
export const useQuickStatusBar = (
  defaultConfig?: Partial<QuickStatusBarProps>
) => {
  console.log('⚡ [QUICK_STATUS_HOOK] 빠른 상태바 훅 초기화');

  // 상태바 표시/숨김 상태 관리
  const [isVisible, setIsVisible] = React.useState<boolean>(true);

  // 상태바 설정 관리
  const [config, setConfig] = React.useState<Partial<QuickStatusBarProps>>(
    defaultConfig || {}
  );

  // 상태바 표시/숨김 토글
  const toggleVisibility = React.useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  // 상태바 설정 업데이트
  const updateConfig = React.useCallback(
    (newConfig: Partial<QuickStatusBarProps>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  // 상태바 컴포넌트 렌더링 함수
  const renderStatusBar = React.useCallback(
    (customConfig?: Partial<QuickStatusBarProps>) => {
      if (!isVisible) return null;

      const finalConfig = { ...config, ...customConfig };
      return <QuickStatusBar {...finalConfig} />;
    },
    [isVisible, config]
  );

  return {
    // 상태 정보
    isVisible,
    config,

    // 액션 함수들
    toggleVisibility,
    updateConfig,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),

    // 컴포넌트 렌더링
    StatusBarComponent: renderStatusBar,
    QuickStatusBar: QuickStatusBar,
  };
};
