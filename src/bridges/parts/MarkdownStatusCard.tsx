// bridges/parts/MarkdownStatusCard.tsx

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import {
  createStandardizationUtils,
  type StandardCardProps,
} from '../common/componentStandardization';

// 🔧 마크다운 상태 카드 전용 Props 인터페이스 (표준화됨)
interface MarkdownStatusCardProps extends StandardCardProps {
  readonly hideTransferStatus?: boolean;
  readonly hideValidationDetails?: boolean;
  readonly hideStatistics?: boolean;
  readonly hideErrorsWarnings?: boolean;
  readonly hideLastResult?: boolean;
  readonly showProgressBar?: boolean;
  readonly maxErrorDisplay?: number;
  readonly maxWarningDisplay?: number;
}

// 🔧 상태 정보 인터페이스
interface StatusInfo {
  readonly status: string;
  readonly label: string;
  readonly color: string;
  readonly bgColor: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly icon: string;
}

export function MarkdownStatusCard({
  size = 'md',
  variant = 'default',
  className = '',
  elevation = 'sm',
  border = true,
  clickable = true,
  hideTransferStatus = false,
  hideValidationDetails = false,
  hideStatistics = false,
  hideErrorsWarnings = false,
  hideLastResult = false,
  showProgressBar = true,
  maxErrorDisplay = 5,
  maxWarningDisplay = 3,
  bridgeConfig,
  onClick,
}: MarkdownStatusCardProps): ReactElement {
  // 🔧 표준화 유틸리티 사용
  const {
    getCardSizeClasses,
    getCardVariantClasses,
    validateSize,
    validateVariant,
    validateClassName,
    validateBoolean,
    generateStandardAriaAttributes,
    generateKeyboardHandler,
    logComponentRender,
    logComponentAction,
  } = createStandardizationUtils();

  // 🔧 Props 검증 및 표준화
  const safeSize = validateSize(size);
  const safeVariant = validateVariant(variant);
  const safeClassName = validateClassName(className);
  const safeBorder = validateBoolean(border, true);
  const safeClickable = validateBoolean(clickable, true);
  const safeHideTransferStatus = validateBoolean(hideTransferStatus, false);
  const safeHideValidationDetails = validateBoolean(
    hideValidationDetails,
    false
  );
  const safeHideStatistics = validateBoolean(hideStatistics, false);
  const safeHideErrorsWarnings = validateBoolean(hideErrorsWarnings, false);
  const safeHideLastResult = validateBoolean(hideLastResult, false);
  const safeShowProgressBar = validateBoolean(showProgressBar, true);

  // 🔧 최신 Bridge UI 훅 사용
  const bridgeUIHook = useBridgeUI(bridgeConfig);

  console.log('🔧 [MARKDOWN_STATUS_CARD] 컴포넌트 렌더링', {
    size: safeSize,
    variant: safeVariant,
    clickable: safeClickable,
    hideTransferStatus: safeHideTransferStatus,
  });

  logComponentRender('MARKDOWN_STATUS_CARD', {
    size: safeSize,
    variant: safeVariant,
    clickable: safeClickable,
    hideTransferStatus: safeHideTransferStatus,
  });

  // 🔧 Bridge UI 상태 정보 추출
  const {
    editorStatistics,
    bridgeConfiguration,
    executionMetrics,
    validationState,
    isLoading: isCurrentlyTransferring,
    canExecuteAction: isTransferPossible,
    statusMessage,
    hasError,
    hasWarning,
  } = bridgeUIHook;

  // 🔧 검증 통계 계산
  const validationStatistics = useMemo(() => {
    const { paragraphCount = 0, assignedParagraphCount = 0 } =
      editorStatistics || {};

    const progressPercentage =
      paragraphCount > 0
        ? Math.round((assignedParagraphCount / paragraphCount) * 100)
        : 0;

    console.log('🔧 [MARKDOWN_STATUS_CARD] 검증 통계 계산', {
      paragraphCount,
      assignedParagraphCount,
      progressPercentage,
      hasError,
      hasWarning,
    });

    return {
      hasErrors: hasError,
      hasWarnings: hasWarning,
      errorCount: validationState?.errorCount || 0,
      warningCount: validationState?.warningCount || 0,
      progressPercentage,
    };
  }, [editorStatistics, hasError, hasWarning, validationState]);

  const {
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    progressPercentage,
  } = validationStatistics;

  // 🔧 전반적인 전송 상태 계산
  const overallTransferStatus = useMemo((): StatusInfo => {
    // Early Return: 전송 중인 경우
    if (isCurrentlyTransferring) {
      return {
        status: 'transferring',
        label: '전송 중',
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: 'loading',
      };
    }

    // Early Return: 에러가 있는 경우
    if (hasErrors) {
      return {
        status: 'error',
        label: '오류 있음',
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        icon: 'error',
      };
    }

    // Early Return: 준비되지 않은 경우
    if (!isTransferPossible) {
      return {
        status: 'waiting',
        label: '대기 중',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: 'waiting',
      };
    }

    // Early Return: 성공한 전송이 있는 경우
    const { successfulOperations = 0 } = executionMetrics || {};
    if (successfulOperations > 0) {
      return {
        status: 'success',
        label: '전송 성공',
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        icon: 'success',
      };
    }

    // Early Return: 경고가 있는 경우
    if (hasWarnings) {
      return {
        status: 'warning',
        label: '주의 필요',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        icon: 'warning',
      };
    }

    return {
      status: 'ready',
      label: '전송 준비',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: 'ready',
    };
  }, [
    isCurrentlyTransferring,
    hasErrors,
    isTransferPossible,
    executionMetrics,
    hasWarnings,
  ]);

  // 🔧 CSS 클래스 계산 (표준화됨)
  const cardSizeClasses = getCardSizeClasses(safeSize);
  const cardVariantClasses = getCardVariantClasses(safeVariant);
  const elevationClasses = useMemo(() => {
    const elevationMap = new Map([
      ['none', ''],
      ['sm', 'shadow-sm'],
      ['md', 'shadow-md'],
      ['lg', 'shadow-lg'],
      ['xl', 'shadow-xl'],
    ]);
    const selectedElevation = elevationMap.get(elevation);
    return selectedElevation !== undefined ? selectedElevation : 'shadow-sm';
  }, [elevation]);

  const borderClasses = safeBorder ? 'border' : '';
  const clickableClasses =
    safeClickable && onClick ? 'cursor-pointer hover:shadow-md' : '';
  const baseClasses = 'rounded-lg transition-all duration-200';

  const finalCardClasses =
    `${baseClasses} ${cardSizeClasses} ${cardVariantClasses} ${elevationClasses} ${borderClasses} ${clickableClasses} ${safeClassName}`.trim();

  // 🔧 이벤트 핸들러
  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const shouldExecuteClick = onClick !== undefined && safeClickable;
    if (shouldExecuteClick) {
      console.log('🔧 [MARKDOWN_STATUS_CARD] 카드 클릭됨');
      logComponentAction('MARKDOWN_STATUS_CARD', '카드 클릭됨');
      onClick(event);
    }
  };

  // 🔧 키보드 이벤트 핸들러 (표준화됨)
  const keyboardHandler = generateKeyboardHandler(
    safeClickable
      ? (): void => {
          const activeElement = document.activeElement;
          const isDivElement = activeElement instanceof HTMLDivElement;

          if (isDivElement) {
            const divElement = activeElement;

            // 실제 클릭 이벤트 발생시키기
            divElement.click();
          }
        }
      : undefined
  );

  // 🔧 접근성 속성 생성 (표준화됨)
  const cardAriaAttributes = generateStandardAriaAttributes('card', {
    label: '마크다운 브릿지 상태 정보',
    description: `현재 상태: ${overallTransferStatus.label}. 컨테이너 ${
      editorStatistics?.containerCount || 0
    }개, 문단 ${editorStatistics?.paragraphCount || 0}개`,
    disabled: false,
    loading: isCurrentlyTransferring,
  });

  // 🔧 아이콘 컴포넌트
  const StatusIconComponent = ({
    iconType,
    className: iconClassName = '',
  }: {
    iconType: string;
    className?: string;
  }): ReactElement | null => {
    const iconClasses = `w-5 h-5 ${iconClassName}`;

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
        'success',
        <svg
          key="success"
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
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

  // 🔧 통계 배지 컴포넌트
  const StatisticsBadge = ({
    label,
    value,
    color = 'gray',
    description,
  }: {
    label: string;
    value: number | string;
    color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    description?: string;
  }): ReactElement => {
    const colorClassMap = new Map([
      ['gray', 'bg-gray-100 text-gray-800'],
      ['blue', 'bg-blue-100 text-blue-800'],
      ['green', 'bg-green-100 text-green-800'],
      ['yellow', 'bg-yellow-100 text-yellow-800'],
      ['red', 'bg-red-100 text-red-800'],
      ['purple', 'bg-purple-100 text-purple-800'],
    ]);

    const selectedColorClass = colorClassMap.get(color);
    const fallbackColorClass = colorClassMap.get('gray');
    const finalColorClass =
      selectedColorClass !== undefined
        ? selectedColorClass
        : fallbackColorClass!;

    return (
      <div
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${finalColorClass}`}
        title={description}
      >
        <span className="mr-1 font-semibold">{label}</span>
        <span>{value}</span>
      </div>
    );
  };

  // 🔧 진행률 바 컴포넌트
  const ProgressBar = ({
    current,
    total,
    label,
    color = 'blue',
  }: {
    current: number;
    total: number;
    label: string;
    color?: 'blue' | 'green' | 'yellow' | 'red';
  }): ReactElement => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const colorClassMap = new Map([
      ['blue', 'bg-blue-500'],
      ['green', 'bg-green-500'],
      ['yellow', 'bg-yellow-500'],
      ['red', 'bg-red-500'],
    ]);

    const selectedColorClass = colorClassMap.get(color);
    const fallbackColorClass = colorClassMap.get('blue');
    const finalColorClass =
      selectedColorClass !== undefined
        ? selectedColorClass
        : fallbackColorClass!;

    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>
            {current}/{total} ({percentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${finalColorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // 🔧 상태 표시 섹션
  const TransferStatusSection = (): ReactElement | null => {
    const shouldShowTransferStatus = !safeHideTransferStatus;

    // Early Return: 전송 상태를 숨기는 경우
    if (!shouldShowTransferStatus) {
      return null;
    }

    const { totalOperations = 0 } = executionMetrics || {};

    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg ${overallTransferStatus.bgColor} ${overallTransferStatus.borderColor} border`}
      >
        <div className="flex items-center space-x-3">
          <StatusIconComponent
            iconType={overallTransferStatus.icon}
            className={overallTransferStatus.textColor}
          />
          <div>
            <h3 className={`font-semibold ${overallTransferStatus.textColor}`}>
              {overallTransferStatus.label}
            </h3>
            {safeSize !== 'xs' ? (
              <p
                className={`text-sm ${overallTransferStatus.textColor} opacity-75`}
              >
                {statusMessage || '상태 정보 없음'}
              </p>
            ) : null}
          </div>
        </div>

        {safeSize === 'xl' && totalOperations > 0 ? (
          <div className={`text-right ${overallTransferStatus.textColor}`}>
            <div className="text-sm font-medium">시도 횟수</div>
            <div className="text-lg font-bold">{totalOperations}</div>
          </div>
        ) : null}
      </div>
    );
  };

  // 🔧 통계 정보 섹션
  const StatisticsSection = (): ReactElement | null => {
    const shouldShowStatistics = !safeHideStatistics && safeSize !== 'xs';

    // Early Return: 통계를 숨기는 경우
    if (!shouldShowStatistics) {
      return null;
    }

    const {
      containerCount = 0,
      paragraphCount = 0,
      assignedParagraphCount = 0,
      unassignedParagraphCount = 0,
      totalContentLength = 0,
    } = editorStatistics || {};

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">에디터 통계</h4>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatisticsBadge
            label="컨테이너"
            value={containerCount}
            color="blue"
            description="생성된 섹션 수"
          />
          <StatisticsBadge
            label="문단"
            value={paragraphCount}
            color="green"
            description="작성된 문단 수"
          />
          <StatisticsBadge
            label="할당됨"
            value={assignedParagraphCount}
            color="purple"
            description="컨테이너에 배정된 문단"
          />
          <StatisticsBadge
            label="미할당"
            value={unassignedParagraphCount}
            color={unassignedParagraphCount > 0 ? 'yellow' : 'gray'}
            description="아직 배정되지 않은 문단"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>총 콘텐츠 길이</span>
          <span className="font-medium">
            {totalContentLength.toLocaleString()}자
          </span>
        </div>

        {safeShowProgressBar && safeSize === 'xl' && paragraphCount > 0 ? (
          <ProgressBar
            current={assignedParagraphCount}
            total={paragraphCount}
            label="문단 할당 진행률"
            color={assignedParagraphCount === paragraphCount ? 'green' : 'blue'}
          />
        ) : null}
      </div>
    );
  };

  // 🔧 검증 상태 섹션
  const ValidationDetailsSection = (): ReactElement | null => {
    const shouldShowValidationDetails =
      !safeHideValidationDetails && safeSize !== 'xs';

    // Early Return: 검증 상세 정보를 숨기는 경우
    if (!shouldShowValidationDetails) {
      return null;
    }

    const {
      enableValidation = false,
      enableErrorRecovery = false,
      debugMode = false,
    } = bridgeConfiguration || {};

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">검증 상태</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isTransferPossible ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium">전송 준비</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  enableValidation ? 'bg-blue-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium">검증 활성화</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  enableErrorRecovery ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium">오류 복구</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  debugMode ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-medium">디버그 모드</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔧 에러 및 경고 섹션
  const ErrorsWarningsSection = (): ReactElement | null => {
    const shouldShowErrorsWarnings =
      !safeHideErrorsWarnings && (hasErrors || hasWarnings);

    // Early Return: 에러/경고를 숨기는 경우
    if (!shouldShowErrorsWarnings) {
      return null;
    }

    const { errors = [], warnings = [] } = validationState || {};

    return (
      <div className="space-y-3">
        {hasErrors ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-red-500"
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
              <h4 className="text-sm font-medium text-red-700">
                검증 오류 ({errorCount}개)
              </h4>
            </div>
            <ul className="space-y-1">
              {errors
                .slice(0, maxErrorDisplay)
                .map((error: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-sm text-red-600"
                  >
                    <span className="text-red-400">•</span>
                    <span>{error}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {hasWarnings ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-yellow-500"
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
              <h4 className="text-sm font-medium text-yellow-700">
                검증 경고 ({warningCount}개)
              </h4>
            </div>
            <ul className="space-y-1">
              {warnings
                .slice(0, maxWarningDisplay)
                .map((warning: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start space-x-2 text-sm text-yellow-600"
                  >
                    <span className="text-yellow-400">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  };

  // 🔧 마지막 전송 결과 섹션
  const LastTransferResultSection = (): ReactElement | null => {
    const {
      lastExecutionTime,
      lastDuration = 0,
      successRate = 0,
      successfulOperations = 0,
    } = executionMetrics || {};

    const shouldShowLastResult =
      !safeHideLastResult && safeSize === 'xl' && lastExecutionTime;

    // Early Return: 마지막 결과를 숨기는 경우
    if (!shouldShowLastResult) {
      return null;
    }

    return (
      <div className="pt-3 space-y-2 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">마지막 전송 결과</h4>
        <div className="p-3 space-y-2 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">상태</span>
            <span
              className={`text-sm font-medium ${
                successfulOperations > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {successfulOperations > 0 ? '성공' : '실패'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">소요 시간</span>
            <span className="text-sm font-medium text-gray-900">
              {lastDuration.toFixed(1)}ms
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">성공률</span>
            <span className="text-sm font-medium text-gray-900">
              {successRate}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  console.log('🔧 [MARKDOWN_STATUS_CARD] 최종 렌더링', {
    overallStatus: overallTransferStatus.status,
    containerCount: editorStatistics?.containerCount || 0,
    paragraphCount: editorStatistics?.paragraphCount || 0,
    progressPercentage,
    isTransferPossible,
    finalCardClasses,
  });

  logComponentRender('MARKDOWN_STATUS_CARD', {
    overallStatus: overallTransferStatus.status,
    containerCount: editorStatistics?.containerCount || 0,
    paragraphCount: editorStatistics?.paragraphCount || 0,
    progressPercentage,
    isTransferPossible,
    finalCardClasses,
  });

  return (
    <div
      className={finalCardClasses}
      onClick={handleCardClick}
      role={safeClickable && onClick ? 'button' : 'region'}
      tabIndex={safeClickable && onClick ? 0 : undefined}
      onKeyDown={keyboardHandler}
      {...cardAriaAttributes}
    >
      <TransferStatusSection />

      <StatisticsSection />

      <ValidationDetailsSection />

      <ErrorsWarningsSection />

      <LastTransferResultSection />
    </div>
  );
}
