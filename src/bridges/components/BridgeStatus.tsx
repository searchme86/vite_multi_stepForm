// bridges/components/BridgeStatus.tsx

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import {
  createStandardizationUtils,
  type StandardCardProps,
} from '../common/componentStandardization';

// 🔧 브릿지 상태 카드 전용 Props 인터페이스
interface BridgeStatusProps extends StandardCardProps {
  readonly hideTransferStatus?: boolean;
  readonly hideValidationDetails?: boolean;
  readonly hideStatistics?: boolean;
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

function BridgeStatus({
  size = 'md',
  variant = 'default',
  className = '',
  elevation = 'sm',
  border = true,
  clickable = true,
  hideTransferStatus = false,
  hideValidationDetails = false,
  hideStatistics = false,
  hideLastResult = false,
  showProgressBar = true,
  bridgeConfig,
  onClick,
}: BridgeStatusProps): ReactElement {
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
  const safeShowProgressBar = validateBoolean(showProgressBar, true);

  // 🔧 Bridge UI 훅 사용
  const {
    isLoading,
    hasError,
    hasWarning,
    statusMessage,
    canExecuteAction,
    editorStatistics,
    bridgeConfiguration,
    executionMetrics,
  } = useBridgeUI(bridgeConfig);

  // 🔧 에디터 통계 구조분해할당
  const {
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
    totalContentLength = 0,
  } = editorStatistics;

  // 🔧 브릿지 설정 구조분해할당
  const {
    enableValidation = false,
    enableErrorRecovery = false,
    debugMode = false,
  } = bridgeConfiguration;

  // 🔧 실행 메트릭스 구조분해할당
  const {
    totalOperations = 0,
    successfulOperations = 0,
    lastDuration = 0,
  } = executionMetrics;

  // 🔧 전반적인 전송 상태 계산
  const overallTransferStatus = useMemo((): StatusInfo => {
    // Early Return: 로딩 중인 경우
    if (isLoading) {
      return {
        status: 'loading',
        label: '처리 중',
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: 'loading',
      };
    }

    // Early Return: 에러가 있는 경우
    if (hasError) {
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

    // Early Return: 실행 불가능한 경우
    if (!canExecuteAction) {
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

    // Early Return: 경고가 있는 경우
    if (hasWarning) {
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

    // 성공적인 상태
    return {
      status: 'ready',
      label: '준비 완료',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: 'ready',
    };
  }, [isLoading, hasError, canExecuteAction, hasWarning]);

  // 🔧 CSS 클래스 계산
  const cardSizeClasses = getCardSizeClasses(safeSize);
  const cardVariantClasses = getCardVariantClasses(safeVariant);
  const elevationClasses = (() => {
    const elevationMap = new Map([
      ['none', ''],
      ['sm', 'shadow-sm'],
      ['md', 'shadow-md'],
      ['lg', 'shadow-lg'],
      ['xl', 'shadow-xl'],
    ]);
    const selectedElevation = elevationMap.get(elevation);
    return selectedElevation !== undefined ? selectedElevation : 'shadow-sm';
  })();

  const borderClasses = safeBorder ? 'border' : '';
  const clickableClasses =
    safeClickable && onClick ? 'cursor-pointer hover:shadow-md' : '';
  const baseClasses = 'rounded-lg transition-all duration-200';

  const finalCardClasses =
    `${baseClasses} ${cardSizeClasses} ${cardVariantClasses} ${elevationClasses} ${borderClasses} ${clickableClasses} ${safeClassName}`.trim();

  // 🔧 이벤트 핸들러
  const handleCardClick = (): void => {
    const shouldExecuteClick = onClick !== undefined && safeClickable;
    if (shouldExecuteClick) {
      logComponentAction('BRIDGE_STATUS', '카드 클릭됨');
      const mockEvent: React.MouseEvent<HTMLElement> = Object.create(
        MouseEvent.prototype,
        {
          button: { value: 0, writable: false },
          buttons: { value: 1, writable: false },
          clientX: { value: 0, writable: false },
          clientY: { value: 0, writable: false },
          currentTarget: { value: null, writable: false },
          target: { value: null, writable: false },
          type: { value: 'click', writable: false },
          preventDefault: { value: () => {}, writable: false },
          stopPropagation: { value: () => {}, writable: false },
        }
      );
      onClick(mockEvent);
    }
  };

  // 🔧 키보드 이벤트 핸들러
  const keyboardHandler = generateKeyboardHandler(
    safeClickable ? handleCardClick : undefined
  );

  // 🔧 접근성 속성 생성
  const cardAriaAttributes = generateStandardAriaAttributes('card', {
    label: '마크다운 브릿지 상태 정보',
    description: `현재 상태: ${overallTransferStatus.label}. ${statusMessage}`,
    disabled: false,
    loading: isLoading,
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
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>

        {safeSize === 'xl' && totalOperations > 0 ? (
          <div className={`text-right ${overallTransferStatus.textColor}`}>
            <div className="text-sm font-medium">실행 횟수</div>
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
            label="할당"
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

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">검증 상태</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  canExecuteAction ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium">실행 준비</span>
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

  // 🔧 실행 메트릭스 섹션
  const ExecutionMetricsSection = (): ReactElement | null => {
    const shouldShowMetrics =
      !hideLastResult && safeSize === 'xl' && totalOperations > 0;

    // Early Return: 메트릭스를 숨기는 경우
    if (!shouldShowMetrics) {
      return null;
    }

    return (
      <div className="pt-3 space-y-2 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">실행 통계</h4>
        <div className="p-3 space-y-2 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">총 실행 횟수</span>
            <span className="text-sm font-medium text-gray-900">
              {totalOperations}회
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">성공률</span>
            <span className="text-sm font-medium text-green-600">
              {totalOperations > 0
                ? Math.round((successfulOperations / totalOperations) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">마지막 소요 시간</span>
            <span className="text-sm font-medium text-gray-900">
              {lastDuration.toFixed(1)}ms
            </span>
          </div>
        </div>
      </div>
    );
  };

  logComponentRender('BRIDGE_STATUS', {
    size: safeSize,
    variant: safeVariant,
    containerCount,
    paragraphCount,
    canExecuteAction,
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

      <ExecutionMetricsSection />
    </div>
  );
}

// 🔧 BridgeStatus 컴포넌트 (기본 export)
export default BridgeStatus;

// 🔧 MarkdownStatusCard 별칭 export (BridgeModal 호환성을 위해)
export const MarkdownStatusCard = BridgeStatus;
