// bridges/parts/QuickStatusBar.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useBridgeUIComponents } from '../hooks/useBridgeUIComponents';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeDataTypes';

type QuickStatusBarPosition = 'top' | 'bottom';

type QuickStatusBarVariant = 'minimal' | 'standard' | 'tab-bar' | 'floating';

interface QuickStatusBarProps {
  readonly position?: QuickStatusBarPosition;
  readonly variant?: QuickStatusBarVariant;
  readonly showProgressBar?: boolean;
  readonly showQuickActions?: boolean;
  readonly showStatistics?: boolean;
  readonly autoHide?: boolean;
  readonly autoHideDelay?: number;
  readonly collapsible?: boolean;
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;
  readonly onQuickTransfer?: () => void;
  readonly onShowDetails?: () => void;
  readonly onClick?: () => void;
  readonly className?: string;
}

const createDefaultValidationStatus = () => ({
  containerCount: 0,
  paragraphCount: 0,
  assignedParagraphCount: 0,
  unassignedParagraphCount: 0,
  totalContentLength: 0,
  validationErrors: [],
  validationWarnings: [],
  isReadyForTransfer: false,
});

const isValidValidationStatus = (status: unknown): boolean => {
  if (!status || typeof status !== 'object') {
    return false;
  }

  const requiredProperties = [
    'containerCount',
    'paragraphCount',
    'assignedParagraphCount',
    'unassignedParagraphCount',
    'totalContentLength',
    'validationErrors',
    'validationWarnings',
    'isReadyForTransfer',
  ];

  return requiredProperties.every((prop) => prop in status);
};

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

  const {
    canTransfer: isTransferPossible,
    isTransferring: isCurrentlyTransferring,
    validationStatus: rawValidationStatus,
    executeManualTransfer: performManualTransfer,
  } = useBridgeUIComponents(bridgeConfig);

  const safeValidationStatus = useMemo(() => {
    console.log('🔍 [QUICK_STATUS] 검증 상태 안전성 확인:', {
      rawStatus: rawValidationStatus,
      isValid: isValidValidationStatus(rawValidationStatus),
    });

    if (!isValidValidationStatus(rawValidationStatus)) {
      console.warn('⚠️ [QUICK_STATUS] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatus();
    }

    return rawValidationStatus;
  }, [rawValidationStatus]);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const [isAutoHidden, setIsAutoHidden] = useState<boolean>(false);

  const {
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
  } = safeValidationStatus || createDefaultValidationStatus();

  console.log('📊 [QUICK_STATUS] 현재 검증 상태:', {
    containerCount,
    paragraphCount,
    assignedParagraphCount,
    unassignedParagraphCount,
    validationErrorCount: validationErrors.length,
    validationWarningCount: validationWarnings.length,
    isReadyForTransfer,
  });

  const statusSummary = useMemo(() => {
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

  const progressPercentage = useMemo(() => {
    if (paragraphCount === 0) {
      console.log('📊 [QUICK_STATUS] 문단 수가 0, 진행률 0%');
      return 0;
    }
    const percentage = Math.round(
      (assignedParagraphCount / paragraphCount) * 100
    );
    console.log('📊 [QUICK_STATUS] 진행률 계산:', {
      assigned: assignedParagraphCount,
      total: paragraphCount,
      percentage: `${percentage}%`,
    });
    return percentage;
  }, [assignedParagraphCount, paragraphCount]);

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

  const handleShowDetails = useCallback((): void => {
    console.log('⚡ [QUICK_STATUS] 상세 정보 보기');
    if (onShowDetails) {
      onShowDetails();
    }
  }, [onShowDetails]);

  const handleToggleCollapse = useCallback((): void => {
    console.log('⚡ [QUICK_STATUS] 상태바 토글');
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleStatusBarClick = useCallback((): void => {
    console.log('⚡ [QUICK_STATUS] 상태바 클릭');
    if (onClick) {
      onClick();
    } else if (onShowDetails) {
      handleShowDetails();
    }
  }, [onClick, onShowDetails, handleShowDetails]);

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

  React.useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsAutoHidden(true);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay]);

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
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <StatusIcon
              iconType={statusSummary.icon}
              className={statusSummary.textColor}
            />
            <span className={`text-sm font-medium ${statusSummary.textColor}`}>
              {statusSummary.label}
            </span>
          </div>

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

        {showQuickActions && (
          <div className="flex items-center space-x-2">
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

export const useQuickStatusBar = (
  defaultConfig?: Partial<QuickStatusBarProps>
) => {
  console.log('⚡ [QUICK_STATUS_HOOK] 빠른 상태바 훅 초기화');

  const [isVisible, setIsVisible] = React.useState<boolean>(true);

  const [config, setConfig] = React.useState<Partial<QuickStatusBarProps>>(
    defaultConfig || {}
  );

  const toggleVisibility = React.useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const updateConfig = React.useCallback(
    (newConfig: Partial<QuickStatusBarProps>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  const renderStatusBar = React.useCallback(
    (customConfig?: Partial<QuickStatusBarProps>) => {
      if (!isVisible) return null;

      const finalConfig = { ...config, ...customConfig };
      return <QuickStatusBar {...finalConfig} />;
    },
    [isVisible, config]
  );

  return {
    isVisible,
    config,
    toggleVisibility,
    updateConfig,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    StatusBarComponent: renderStatusBar,
    QuickStatusBar: QuickStatusBar,
  };
};
