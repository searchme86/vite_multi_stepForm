// bridges/parts/QuickStatusBar.tsx

import React, { useState, useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import {
  createStandardizationUtils,
  type StandardStatusBarProps,
  type StandardSize,
} from '../common/componentStandardization';

// 🔧 빠른 상태바 위치 타입 (표준화됨)
type QuickStatusBarPosition = 'top' | 'bottom';

// 🔧 빠른 상태바 전용 Props 인터페이스 (표준화됨)
interface QuickStatusBarProps extends StandardStatusBarProps {
  readonly heightSize?: StandardSize;
  readonly showProgressBar?: boolean;
  readonly showStatistics?: boolean;
  readonly showQuickActions?: boolean;
  readonly enableAutoHide?: boolean;
  readonly enableCollapse?: boolean;
  readonly onQuickTransfer?: () => void;
  readonly onShowDetails?: () => void;
  readonly executionType?: 'forward' | 'reverse' | 'bidirectional';
}

// 🔧 상태 요약 정보 인터페이스 (표준화됨)
interface StatusSummary {
  readonly status: string;
  readonly color: string;
  readonly label: string;
  readonly icon: string;
  readonly bgColor: string;
  readonly textColor: string;
  readonly description: string;
}

export function QuickStatusBar({
  size = 'md',
  variant = 'default',
  position = 'top',
  className = '',
  heightSize = 'md',
  fixed = true,
  showActions = true,
  showProgressBar = true,
  showStatistics = true,
  showQuickActions = true,
  enableAutoHide = false,
  enableCollapse = false,
  autoHideDelay = 5000,
  bridgeConfig,
  onClick,
  onQuickTransfer,
  onShowDetails,
  executionType = 'forward',
}: QuickStatusBarProps): ReactElement {
  // 🔧 표준화 유틸리티 사용
  const {
    validateSize,
    validateVariant,
    validateClassName,
    validateBoolean,
    getStatusVariantClasses,
    generateStandardAriaAttributes,
    generateKeyboardHandler,
    logComponentRender,
    logComponentAction,
  } = createStandardizationUtils();

  // 🔧 Props 검증 및 표준화
  const safeSize = validateSize(size);
  const safeVariant = validateVariant(variant);
  const safeHeightSize = validateSize(heightSize);
  const safeClassName = validateClassName(className);
  const safeFixed = validateBoolean(fixed, true);
  const safeShowActions = validateBoolean(showActions, true);
  const safeShowProgressBar = validateBoolean(showProgressBar, true);
  const safeShowStatistics = validateBoolean(showStatistics, true);
  const safeShowQuickActions = validateBoolean(showQuickActions, true);
  const safeEnableAutoHide = validateBoolean(enableAutoHide, false);
  const safeEnableCollapse = validateBoolean(enableCollapse, false);

  // 🔧 최신 Bridge UI 훅 사용
  const bridgeUIHook = useBridgeUI(bridgeConfig);

  console.log('🔧 [QUICK_STATUS_BAR] 컴포넌트 렌더링', {
    size: safeSize,
    variant: safeVariant,
    position,
    heightSize: safeHeightSize,
    executionType,
  });

  logComponentRender('QUICK_STATUS_BAR', {
    size: safeSize,
    variant: safeVariant,
    position,
    heightSize: safeHeightSize,
    executionType,
  });

  // 🔧 로컬 상태 관리
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isAutoHidden, setIsAutoHidden] = useState<boolean>(false);

  // 🔧 Bridge UI 상태 정보 추출
  const {
    editorStatistics,
    isLoading: isCurrentlyTransferring,
    canExecuteAction: isTransferPossible,
    hasError,
    hasWarning,
    validationState,
    handleForwardTransfer,
    handleReverseTransfer,
    handleBidirectionalSync,
  } = bridgeUIHook;

  // 🔧 검증 통계 계산
  const validationStatistics = useMemo(() => {
    const {
      containerCount = 0,
      paragraphCount = 0,
      assignedParagraphCount = 0,
    } = editorStatistics || {};

    const errorCount = validationState?.errorCount || 0;
    const warningCount = validationState?.warningCount || 0;
    const progressPercentage =
      paragraphCount > 0
        ? Math.round((assignedParagraphCount / paragraphCount) * 100)
        : 0;

    console.log('🔧 [QUICK_STATUS_BAR] 검증 통계 계산', {
      containerCount,
      paragraphCount,
      assignedParagraphCount,
      errorCount,
      warningCount,
      progressPercentage,
      hasError,
      hasWarning,
    });

    return {
      hasErrors: hasError,
      hasWarnings: hasWarning,
      errorCount,
      warningCount,
      progressPercentage,
      containerCount,
      paragraphCount,
      assignedParagraphCount,
    };
  }, [editorStatistics, hasError, hasWarning, validationState]);

  const {
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    progressPercentage,
    containerCount,
    paragraphCount,
    assignedParagraphCount,
  } = validationStatistics;

  // 🔧 상태 요약 정보 계산 (표준화됨)
  const statusSummary = useMemo((): StatusSummary => {
    // Early Return: 에러가 있는 경우
    if (hasErrors) {
      return {
        status: 'error',
        color: 'red',
        label: '오류',
        icon: 'error',
        bgColor: 'bg-red-500',
        textColor: 'text-red-600',
        description: `${errorCount}개 오류`,
      };
    }

    // Early Return: 전송 중인 경우
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

    // Early Return: 전송 준비 완료인 경우
    if (isTransferPossible) {
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

    // Early Return: 경고가 있는 경우
    if (hasWarnings) {
      return {
        status: 'warning',
        color: 'yellow',
        label: '주의',
        icon: 'warning',
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        description: `${warningCount}개 경고`,
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
    hasErrors,
    errorCount,
    isCurrentlyTransferring,
    isTransferPossible,
    hasWarnings,
    warningCount,
  ]);

  // 🔧 실행 함수 선택
  const getExecutionFunction = useCallback(() => {
    const executionMap = new Map([
      ['forward', handleForwardTransfer],
      ['reverse', handleReverseTransfer],
      ['bidirectional', handleBidirectionalSync],
    ]);

    const selectedFunction = executionMap.get(executionType);
    return selectedFunction !== undefined
      ? selectedFunction
      : handleForwardTransfer;
  }, [
    executionType,
    handleForwardTransfer,
    handleReverseTransfer,
    handleBidirectionalSync,
  ]);

  // 🔧 높이 클래스 계산 (표준화됨)
  const getHeightClasses = useCallback((heightType: StandardSize): string => {
    const heightClassMap = new Map([
      ['xs', 'h-6'],
      ['sm', 'h-8'],
      ['md', 'h-12'],
      ['lg', 'h-16'],
      ['xl', 'h-20'],
    ]);

    const selectedHeightClass = heightClassMap.get(heightType);
    const fallbackHeightClass = heightClassMap.get('md');

    return selectedHeightClass !== undefined
      ? selectedHeightClass
      : fallbackHeightClass!;
  }, []);

  // 🔧 위치 클래스 계산 (표준화됨)
  const getPositionClasses = useCallback(
    (barPosition: QuickStatusBarPosition): string => {
      const positionClassMap = new Map([
        ['top', 'top-0 left-0 right-0'],
        ['bottom', 'bottom-0 left-0 right-0'],
      ]);

      const selectedPositionClass = positionClassMap.get(barPosition);
      const fallbackPositionClass = positionClassMap.get('top');

      return selectedPositionClass !== undefined
        ? selectedPositionClass
        : fallbackPositionClass!;
    },
    []
  );

  // 🔧 빠른 전송 핸들러
  const handleQuickTransfer = useCallback(async (): Promise<void> => {
    console.log('🔧 [QUICK_STATUS_BAR] 빠른 전송 실행', {
      executionType,
    });
    logComponentAction('QUICK_STATUS_BAR', '빠른 전송 실행', {
      executionType,
    });

    const cannotTransfer = !isTransferPossible || isCurrentlyTransferring;

    // Early Return: 전송할 수 없는 상태
    if (cannotTransfer) {
      console.log('🔧 [QUICK_STATUS_BAR] 전송 불가능한 상태');
      logComponentAction('QUICK_STATUS_BAR', '전송 불가능한 상태');
      return;
    }

    try {
      const shouldExecuteCustomTransfer = onQuickTransfer !== undefined;
      if (shouldExecuteCustomTransfer) {
        onQuickTransfer();
      } else {
        const executionFunction = getExecutionFunction();
        await executionFunction();
      }
    } catch (transferError) {
      console.log('🔧 [QUICK_STATUS_BAR] 빠른 전송 실행 중 오류', {
        error: transferError,
        executionType,
      });
      logComponentAction('QUICK_STATUS_BAR', '빠른 전송 실행 중 오류', {
        error: transferError,
        executionType,
      });
    }
  }, [
    isTransferPossible,
    isCurrentlyTransferring,
    onQuickTransfer,
    getExecutionFunction,
    executionType,
  ]);

  // 🔧 상세 정보 보기 핸들러
  const handleShowDetails = useCallback((): void => {
    console.log('🔧 [QUICK_STATUS_BAR] 상세 정보 보기');
    logComponentAction('QUICK_STATUS_BAR', '상세 정보 보기');
    const shouldExecuteShowDetails = onShowDetails !== undefined;
    if (shouldExecuteShowDetails) {
      onShowDetails();
    }
  }, [onShowDetails]);

  // 🔧 토글 접기 핸들러
  const handleToggleCollapse = useCallback((): void => {
    console.log('🔧 [QUICK_STATUS_BAR] 상태바 토글');
    logComponentAction('QUICK_STATUS_BAR', '상태바 토글');
    setIsCollapsed((previousState) => !previousState);
  }, []);

  // 🔧 상태바 클릭 핸들러
  const handleStatusBarClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      console.log('🔧 [QUICK_STATUS_BAR] 상태바 클릭');
      logComponentAction('QUICK_STATUS_BAR', '상태바 클릭');
      const shouldExecuteOnClick = onClick !== undefined;
      const shouldExecuteShowDetails = onShowDetails !== undefined;

      if (shouldExecuteOnClick) {
        onClick(event);
      } else if (shouldExecuteShowDetails) {
        handleShowDetails();
      }
    },
    [onClick, onShowDetails, handleShowDetails]
  );

  // 🔧 확장 클릭 핸들러
  const handleExpandClick = useCallback((): void => {
    setIsAutoHidden(false);
    setIsCollapsed(false);
  }, []);

  // 🔧 키보드 이벤트 핸들러 (표준화됨)
  const keyboardHandler = generateKeyboardHandler((): void => {
    const activeElement = document.activeElement;
    const isDivElement = activeElement instanceof HTMLDivElement;

    if (isDivElement) {
      const divElement = activeElement;

      // 실제 클릭 이벤트 발생시키기
      divElement.click();
    }
  });

  const expandKeyHandler = generateKeyboardHandler(handleExpandClick);

  // 🔧 자동 숨김 Effect
  React.useEffect(() => {
    const shouldSetAutoHideTimer = safeEnableAutoHide && autoHideDelay > 0;

    if (shouldSetAutoHideTimer) {
      const timer = setTimeout(() => {
        setIsAutoHidden(true);
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [safeEnableAutoHide, autoHideDelay]);

  // 🔧 아이콘 컴포넌트 (표준화됨)
  const StatusIcon = ({
    iconType,
    className: iconClassName = '',
  }: {
    iconType: string;
    className?: string;
  }): ReactElement | null => {
    const iconClasses = `w-4 h-4 ${iconClassName}`;

    const iconMap = new Map([
      [
        'loading',
        <svg
          key="loading"
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
        </svg>,
      ],
      [
        'error',
        <svg
          key="error"
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
        </svg>,
      ],
      [
        'warning',
        <svg
          key="warning"
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
        </svg>,
      ],
      [
        'ready',
        <svg
          key="ready"
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
        </svg>,
      ],
      [
        'waiting',
        <svg
          key="waiting"
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
        </svg>,
      ],
    ]);

    const selectedIcon = iconMap.get(iconType);
    return selectedIcon !== undefined ? selectedIcon : null;
  };

  // 🔧 CSS 클래스 계산 (표준화됨)
  const fixedClasses = safeFixed ? 'fixed' : 'relative';
  const positionClasses = getPositionClasses(position);
  const heightClasses = getHeightClasses(safeHeightSize);
  const variantClasses = getStatusVariantClasses(safeVariant);
  const shouldShowClickCursor = onClick !== undefined;
  const clickableClasses = shouldShowClickCursor ? 'cursor-pointer' : '';

  const baseClasses =
    'z-40 transition-all duration-300 border-b border-gray-200 shadow-md';
  const finalClasses =
    `${baseClasses} ${fixedClasses} ${positionClasses} ${heightClasses} ${variantClasses} ${clickableClasses} ${safeClassName}`.trim();

  // 🔧 접근성 속성 생성 (표준화됨)
  const statusBarAriaAttributes = generateStandardAriaAttributes('statusbar', {
    label: '마크다운 브릿지 빠른 상태',
    description: `현재 상태: ${statusSummary.label}. ${statusSummary.description}`,
    disabled: false,
    loading: isCurrentlyTransferring,
    expanded: !isCollapsed,
  });

  const isHiddenState = isAutoHidden || isCollapsed;

  // Early Return: 숨겨진 상태 - 최소화된 상태바
  if (isHiddenState) {
    return (
      <div
        className={`
          ${fixedClasses} z-40
          ${positionClasses}
          ${position === 'top' ? 'h-1' : 'h-1'}
          ${statusSummary.bgColor}
          cursor-pointer
          transition-all duration-300
          ${safeClassName}
        `}
        onClick={handleExpandClick}
        role="button"
        tabIndex={0}
        aria-label={`마크다운 상태: ${statusSummary.label} - 클릭하여 펼치기`}
        onKeyDown={expandKeyHandler}
      />
    );
  }

  console.log('🔧 [QUICK_STATUS_BAR] 최종 렌더링', {
    status: statusSummary.status,
    progressPercentage,
    isTransferPossible,
    canTransfer: isTransferPossible,
    isCollapsed,
    isAutoHidden,
  });

  logComponentRender('QUICK_STATUS_BAR', {
    status: statusSummary.status,
    progressPercentage,
    isTransferPossible,
    canTransfer: isTransferPossible,
    isCollapsed,
    isAutoHidden,
  });

  return (
    <div
      className={finalClasses}
      onClick={handleStatusBarClick}
      onKeyDown={keyboardHandler}
      {...statusBarAriaAttributes}
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* 왼쪽 영역: 상태 정보 */}
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

          {safeShowStatistics && safeHeightSize !== 'xs' ? (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded">
                컨테이너 {containerCount}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                문단 {assignedParagraphCount}/{paragraphCount}
              </span>
            </div>
          ) : null}

          {safeShowProgressBar &&
          safeHeightSize !== 'xs' &&
          paragraphCount > 0 ? (
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
          ) : null}
        </div>

        {/* 오른쪽 영역: 액션 버튼들 */}
        {safeShowActions ? (
          <div className="flex items-center space-x-2">
            {onShowDetails ? (
              <button
                type="button"
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
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
            ) : null}

            {safeShowQuickActions ? (
              <button
                type="button"
                disabled={!isTransferPossible || isCurrentlyTransferring}
                className={`
                  px-3 py-1 text-xs font-medium rounded
                  transition-all duration-200
                  ${
                    isTransferPossible && !isCurrentlyTransferring
                      ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  handleQuickTransfer();
                }}
                aria-label={
                  isCurrentlyTransferring
                    ? '전송 진행 중'
                    : `빠른 ${executionType} 실행`
                }
              >
                {isCurrentlyTransferring ? '전송중...' : '실행'}
              </button>
            ) : null}

            {safeEnableCollapse ? (
              <button
                type="button"
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
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
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// 🔧 표준화된 상태바 훅
export const useQuickStatusBar = (
  defaultConfig?: Partial<QuickStatusBarProps>
) => {
  const { logComponentAction } = createStandardizationUtils();

  console.log('🔧 [QUICK_STATUS_BAR_HOOK] 빠른 상태바 훅 초기화');
  logComponentAction('QUICK_STATUS_BAR_HOOK', '빠른 상태바 훅 초기화');

  const [isVisible, setIsVisible] = React.useState<boolean>(true);
  const [config, setConfig] = React.useState<Partial<QuickStatusBarProps>>(
    defaultConfig !== undefined ? defaultConfig : {}
  );

  const toggleVisibility = React.useCallback(() => {
    setIsVisible((previousState) => !previousState);
  }, []);

  const updateConfig = React.useCallback(
    (newConfig: Partial<QuickStatusBarProps>) => {
      setConfig((previousConfig) => ({ ...previousConfig, ...newConfig }));
    },
    []
  );

  const renderStatusBar = React.useCallback(
    (customConfig?: Partial<QuickStatusBarProps>) => {
      const hasNoVisibility = !isVisible;

      // Early Return: 숨겨진 상태
      if (hasNoVisibility) {
        return null;
      }

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
