// bridges/parts/MarkdownStatusCard.tsx

import React, { useMemo } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeTypes';

// 카드 프로퍼티 인터페이스
interface MarkdownStatusCardProps {
  // 카드의 크기 설정 (compact: 간소화, standard: 표준, detailed: 상세)
  readonly size?: 'compact' | 'standard' | 'detailed';

  // 카드의 스타일 변형 (default: 기본, bordered: 테두리, elevated: 그림자)
  readonly variant?: 'default' | 'bordered' | 'elevated';

  // 추가적인 CSS 클래스명
  readonly className?: string;

  // 특정 섹션을 숨길지 여부
  readonly hideTransferStatus?: boolean;
  readonly hideValidationDetails?: boolean;
  readonly hideStatistics?: boolean;
  readonly hideErrorsWarnings?: boolean;

  // 실시간 업데이트 간격 (밀리초, 0이면 비활성화)
  readonly refreshInterval?: number;

  // 사용자 정의 브릿지 설정
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;

  // 클릭 이벤트 핸들러 (카드 클릭 시 상세 정보 표시 등)
  readonly onClick?: () => void;
}

// 기본 검증 상태 객체 - 안전한 fallback 제공
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

// 기본 브릿지 설정 객체 - 안전한 fallback 제공
const createDefaultBridgeConfiguration = () => ({
  enableValidation: false,
  enableErrorRecovery: false,
  debugMode: false,
});

// 검증 상태 타입 가드 함수 - 런타임 안전성 보장
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

// 브릿지 설정 타입 가드 함수
const isValidBridgeConfiguration = (config: unknown): boolean => {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const optionalProperties = [
    'enableValidation',
    'enableErrorRecovery',
    'debugMode',
  ];

  return optionalProperties.some((prop) => prop in config);
};

/**
 * 마크다운 상태 카드 컴포넌트
 * 브릿지 전송 상태, 에디터 검증 결과, 통계 정보를 시각적으로 표시
 *
 * 주요 기능:
 * 1. 전송 상태 실시간 표시 (가능/진행중/불가)
 * 2. 에디터 데이터 통계 (컨테이너/문단 수)
 * 3. 검증 오류/경고 목록 표시
 * 4. 마지막 전송 결과 표시
 * 5. 반응형 디자인 및 접근성 지원
 *
 * @param props - 카드 설정 옵션들
 * @returns JSX 엘리먼트
 */
export function MarkdownStatusCard({
  size = 'standard',
  variant = 'default',
  className = '',
  hideTransferStatus = false,
  hideValidationDetails = false,
  hideStatistics = false,
  hideErrorsWarnings = false,
  refreshInterval = 0,
  bridgeConfig,
  onClick,
}: MarkdownStatusCardProps): React.ReactElement {
  console.log('📊 [STATUS_CARD] 마크다운 상태 카드 렌더링');

  // 브릿지 UI 훅 연결 - 모든 상태 정보 가져오기
  const {
    canTransfer: isTransferPossible,
    isTransferring: isCurrentlyTransferring,
    validationStatus: rawValidationStatus,
    lastTransferResult: mostRecentTransferResult,
    transferAttemptCount: totalTransferAttempts,
    bridgeConfiguration: rawBridgeConfiguration,
  } = useBridgeUI(bridgeConfig);

  // 🚨 안전한 검증 상태 처리 - fallback과 타입 가드 적용
  const safeValidationStatus = useMemo(() => {
    console.log('🔍 [STATUS_CARD] 검증 상태 안전성 확인:', {
      rawStatus: rawValidationStatus,
      isValid: isValidValidationStatus(rawValidationStatus),
    });

    if (!isValidValidationStatus(rawValidationStatus)) {
      console.warn('⚠️ [STATUS_CARD] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatus();
    }

    return rawValidationStatus;
  }, [rawValidationStatus]);

  // 🚨 안전한 브릿지 설정 처리 - fallback과 타입 가드 적용
  const safeBridgeConfiguration = useMemo(() => {
    console.log('🔍 [STATUS_CARD] 브릿지 설정 안전성 확인:', {
      rawConfig: rawBridgeConfiguration,
      isValid: isValidBridgeConfiguration(rawBridgeConfiguration),
    });

    if (!isValidBridgeConfiguration(rawBridgeConfiguration)) {
      console.warn('⚠️ [STATUS_CARD] 유효하지 않은 브릿지 설정, 기본값 사용');
      return createDefaultBridgeConfiguration();
    }

    return rawBridgeConfiguration;
  }, [rawBridgeConfiguration]);

  // 🔍 안전한 구조분해할당 - fallback 객체와 함께 사용
  const {
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
    totalContentLength = 0,
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
  } = safeValidationStatus || createDefaultValidationStatus();

  // 브릿지 설정 안전한 구조분해할당
  const {
    enableValidation = false,
    enableErrorRecovery = false,
    debugMode = false,
  } = safeBridgeConfiguration || createDefaultBridgeConfiguration();

  // 🔍 디버깅을 위한 상태 로깅
  console.log('📊 [STATUS_CARD] 현재 검증 상태:', {
    containerCount,
    paragraphCount,
    assignedParagraphCount,
    unassignedParagraphCount,
    validationErrorCount: validationErrors.length,
    validationWarningCount: validationWarnings.length,
    isReadyForTransfer,
    bridgeConfig: { enableValidation, enableErrorRecovery, debugMode },
  });

  // 전체 전송 상태 계산 (UI 표시용)
  const overallTransferStatus = useMemo(() => {
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

    if (validationErrors.length > 0) {
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

    if (!isTransferPossible || !isReadyForTransfer) {
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

    if (mostRecentTransferResult?.operationSuccess) {
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
    validationErrors.length,
    isTransferPossible,
    isReadyForTransfer,
    mostRecentTransferResult?.operationSuccess,
  ]);

  // 카드 크기에 따른 CSS 클래스 계산
  const getSizeClasses = useMemo(() => {
    const sizeClassMap = {
      compact: 'p-3 space-y-2',
      standard: 'p-4 space-y-3',
      detailed: 'p-6 space-y-4',
    };
    return sizeClassMap[size] || sizeClassMap.standard;
  }, [size]);

  // 카드 변형에 따른 CSS 클래스 계산
  const getVariantClasses = useMemo(() => {
    const variantClassMap = {
      default: 'bg-white',
      bordered: 'bg-white border border-gray-200',
      elevated: 'bg-white shadow-lg border border-gray-100',
    };
    return variantClassMap[variant] || variantClassMap.default;
  }, [variant]);

  // 최종 카드 CSS 클래스 조합
  const getFinalCardClasses = useMemo(() => {
    const baseClasses = 'rounded-lg transition-all duration-200';
    const sizeClasses = getSizeClasses;
    const variantClasses = getVariantClasses;
    const clickableClasses = onClick ? 'cursor-pointer hover:shadow-md' : '';

    return `${baseClasses} ${sizeClasses} ${variantClasses} ${clickableClasses} ${className}`.trim();
  }, [getSizeClasses, getVariantClasses, onClick, className]);

  // 상태 아이콘 컴포넌트
  const StatusIcon = ({
    iconType,
    className: iconClassName,
  }: {
    iconType: string;
    className?: string;
  }) => {
    const iconClasses = `w-5 h-5 ${iconClassName || ''}`;

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
      case 'success':
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // 통계 배지 컴포넌트
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
  }) => {
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
    };

    return (
      <div
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}
        title={description}
      >
        <span className="mr-1 font-semibold">{label}</span>
        <span>{value}</span>
      </div>
    );
  };

  // 진행률 바 컴포넌트
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
  }) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };

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
            className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // 카드 클릭 핸들러
  const handleCardClick = () => {
    if (onClick) {
      console.log('📊 [STATUS_CARD] 카드 클릭됨');
      onClick();
    }
  };

  console.log('📊 [STATUS_CARD] 상태 카드 렌더링 완료:', {
    overallStatus: overallTransferStatus.status,
    containerCount,
    paragraphCount,
    errorCount: validationErrors.length,
    warningCount: validationWarnings.length,
  });

  return (
    <div
      className={getFinalCardClasses}
      onClick={handleCardClick}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      aria-label="마크다운 브릿지 상태 정보"
    >
      {/* 전송 상태 헤더 */}
      {!hideTransferStatus && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg ${overallTransferStatus.bgColor} ${overallTransferStatus.borderColor} border`}
        >
          <div className="flex items-center space-x-3">
            <StatusIcon
              iconType={overallTransferStatus.icon}
              className={overallTransferStatus.textColor}
            />
            <div>
              <h3
                className={`font-semibold ${overallTransferStatus.textColor}`}
              >
                {overallTransferStatus.label}
              </h3>
              {size !== 'compact' && (
                <p
                  className={`text-sm ${overallTransferStatus.textColor} opacity-75`}
                >
                  {isCurrentlyTransferring
                    ? '데이터를 멀티스텝 폼으로 전송 중입니다'
                    : validationErrors.length > 0
                    ? '오류를 해결한 후 다시 시도하세요'
                    : isTransferPossible && isReadyForTransfer
                    ? '마크다운 생성 준비가 완료되었습니다'
                    : '조건을 충족하면 전송이 가능합니다'}
                </p>
              )}
            </div>
          </div>

          {/* 전송 시도 횟수 (상세 모드일 때만) */}
          {size === 'detailed' && totalTransferAttempts > 0 && (
            <div className={`text-right ${overallTransferStatus.textColor}`}>
              <div className="text-sm font-medium">시도 횟수</div>
              <div className="text-lg font-bold">{totalTransferAttempts}</div>
            </div>
          )}
        </div>
      )}

      {/* 통계 정보 */}
      {!hideStatistics && size !== 'compact' && (
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

          {/* 콘텐츠 길이 정보 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>총 콘텐츠 길이</span>
            <span className="font-medium">
              {totalContentLength.toLocaleString()}자
            </span>
          </div>

          {/* 할당 진행률 (상세 모드일 때만) */}
          {size === 'detailed' && paragraphCount > 0 && (
            <ProgressBar
              current={assignedParagraphCount}
              total={paragraphCount}
              label="문단 할당 진행률"
              color={
                assignedParagraphCount === paragraphCount ? 'green' : 'blue'
              }
            />
          )}
        </div>
      )}

      {/* 검증 세부 정보 */}
      {!hideValidationDetails && size !== 'compact' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">검증 상태</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isReadyForTransfer ? 'bg-green-500' : 'bg-red-500'
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
      )}

      {/* 오류 및 경고 */}
      {!hideErrorsWarnings &&
        (validationErrors.length > 0 || validationWarnings.length > 0) && (
          <div className="space-y-3">
            {/* 검증 오류 */}
            {validationErrors.length > 0 && (
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
                    검증 오류 ({validationErrors.length}개)
                  </h4>
                </div>
                <ul className="space-y-1">
                  {validationErrors.map((error: string, index: number) => (
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
            )}

            {/* 검증 경고 */}
            {validationWarnings.length > 0 && (
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
                    검증 경고 ({validationWarnings.length}개)
                  </h4>
                </div>
                <ul className="space-y-1">
                  {validationWarnings
                    .slice(0, size === 'detailed' ? 10 : 3)
                    .map((warning: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start space-x-2 text-sm text-yellow-600"
                      >
                        <span className="text-yellow-400">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  {validationWarnings.length >
                    (size === 'detailed' ? 10 : 3) && (
                    <li className="text-sm italic text-yellow-500">
                      ... 외{' '}
                      {validationWarnings.length -
                        (size === 'detailed' ? 10 : 3)}
                      개 더
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

      {/* 마지막 전송 결과 (상세 모드일 때만) */}
      {size === 'detailed' && mostRecentTransferResult && (
        <div className="pt-3 space-y-2 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">
            마지막 전송 결과
          </h4>
          <div className="p-3 space-y-2 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">상태</span>
              <span
                className={`text-sm font-medium ${
                  mostRecentTransferResult.operationSuccess
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {mostRecentTransferResult.operationSuccess ? '성공' : '실패'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">소요 시간</span>
              <span className="text-sm font-medium text-gray-900">
                {mostRecentTransferResult.operationDuration.toFixed(1)}ms
              </span>
            </div>
            {mostRecentTransferResult.transferredData && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">전송된 콘텐츠</span>
                <span className="text-sm font-medium text-gray-900">
                  {
                    mostRecentTransferResult.transferredData.transformedContent
                      .length
                  }
                  자
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
