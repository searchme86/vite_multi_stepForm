// bridges/parts/MarkdownCompleteButton.tsx

import React, { useState, useCallback } from 'react';
import { useBridgeUIComponents } from '../hooks/useBridgeUIComponents';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeDataTypes';

interface MarkdownCompleteButtonProps {
  readonly buttonText?: string;
  readonly size?: 'small' | 'medium' | 'large';
  readonly variant?: 'primary' | 'secondary' | 'success';
  readonly fullWidth?: boolean;
  readonly className?: string;
  readonly onBeforeComplete?: () => boolean | Promise<boolean>;
  readonly onCompleteSuccess?: () => void;
  readonly onCompleteError?: (error: unknown) => void;
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;
  readonly forceDisabled?: boolean;
  readonly showDetailedStatus?: boolean;
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

export function MarkdownCompleteButton({
  buttonText = '마크다운 완성',
  size = 'medium',
  variant = 'primary',
  fullWidth = false,
  className = '',
  onBeforeComplete,
  onCompleteSuccess,
  onCompleteError,
  bridgeConfig,
  forceDisabled = false,
  showDetailedStatus = true,
}: MarkdownCompleteButtonProps): React.ReactElement {
  console.log('🔘 [MARKDOWN_BUTTON] 마크다운 완성 버튼 렌더링');

  const {
    canTransfer: isTransferAvailable,
    isTransferring: isTransferInProgress,
    validationStatus: rawValidationStatus,
    executeManualTransfer: performBridgeTransfer,
    refreshValidationStatus: updateValidationStatus,
  } = useBridgeUIComponents(bridgeConfig);

  const safeValidationStatus = React.useMemo(() => {
    console.log('🔍 [MARKDOWN_BUTTON] 검증 상태 안전성 확인:', {
      rawStatus: rawValidationStatus,
      isValid: isValidValidationStatus(rawValidationStatus),
    });

    if (!isValidValidationStatus(rawValidationStatus)) {
      console.warn('⚠️ [MARKDOWN_BUTTON] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatus();
    }

    return rawValidationStatus;
  }, [rawValidationStatus]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [lastProcessResult, setLastProcessResult] = useState<
    'success' | 'error' | null
  >(null);

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

  console.log('📊 [MARKDOWN_BUTTON] 현재 검증 상태:', {
    containerCount,
    paragraphCount,
    assignedParagraphCount,
    unassignedParagraphCount,
    validationErrorCount: validationErrors.length,
    validationWarningCount: validationWarnings.length,
    isReadyForTransfer,
  });

  const isFinallyEnabled =
    !forceDisabled &&
    !isTransferInProgress &&
    !isProcessing &&
    isTransferAvailable &&
    isReadyForTransfer &&
    validationErrors.length === 0;

  const getButtonDisplayText = useCallback((): string => {
    if (isTransferInProgress || isProcessing) {
      return '마크다운 생성 중...';
    }

    if (validationErrors.length > 0) {
      return '완성 불가 (오류 해결 필요)';
    }

    if (!isTransferAvailable || !isReadyForTransfer) {
      return '완성 준비 중...';
    }

    if (lastProcessResult === 'success') {
      return '완성 성공!';
    }

    if (lastProcessResult === 'error') {
      return '완성 실패 (다시 시도)';
    }

    return buttonText;
  }, [
    isTransferInProgress,
    isProcessing,
    validationErrors.length,
    isTransferAvailable,
    isReadyForTransfer,
    lastProcessResult,
    buttonText,
  ]);

  const getSizeClasses = useCallback((): string => {
    const sizeClassMap = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg',
    };
    return sizeClassMap[size] || sizeClassMap.medium;
  }, [size]);

  const getVariantClasses = useCallback((): string => {
    if (!isFinallyEnabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300';
    }

    if (lastProcessResult === 'success') {
      return 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500';
    }

    if (lastProcessResult === 'error') {
      return 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500';
    }

    const variantClassMap = {
      primary:
        'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      secondary:
        'bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500',
      success:
        'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500',
    };

    return variantClassMap[variant] || variantClassMap.primary;
  }, [isFinallyEnabled, lastProcessResult, variant]);

  const getWidthClasses = useCallback((): string => {
    return fullWidth ? 'w-full' : 'w-auto';
  }, [fullWidth]);

  const getFinalButtonClasses = useCallback((): string => {
    const baseClasses =
      'font-medium rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeClasses = getSizeClasses();
    const variantClasses = getVariantClasses();
    const widthClasses = getWidthClasses();

    return `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${className}`.trim();
  }, [getSizeClasses, getVariantClasses, getWidthClasses, className]);

  const handleButtonClick = useCallback(async (): Promise<void> => {
    console.log('🔘 [MARKDOWN_BUTTON] 버튼 클릭 처리 시작');

    if (!isFinallyEnabled) {
      console.warn('⚠️ [MARKDOWN_BUTTON] 버튼 비활성화 상태로 클릭 무시');
      return;
    }

    setIsProcessing(true);
    setLastProcessResult(null);

    try {
      console.log(
        '🔍 [MARKDOWN_BUTTON] 완성 전 검증 상태:',
        safeValidationStatus
      );

      updateValidationStatus();

      if (onBeforeComplete) {
        console.log('🔍 [MARKDOWN_BUTTON] 사용자 정의 사전 검증 실행');
        const beforeCompleteResult = await onBeforeComplete();

        if (!beforeCompleteResult) {
          console.warn('⚠️ [MARKDOWN_BUTTON] 사용자 정의 사전 검증 실패');
          setLastProcessResult('error');
          setIsProcessing(false);

          if (onCompleteError) {
            onCompleteError(new Error('사전 검증 실패'));
          }
          return;
        }
      }

      console.log('🚀 [MARKDOWN_BUTTON] 브릿지 전송 시작');
      await performBridgeTransfer();

      console.log('✅ [MARKDOWN_BUTTON] 마크다운 완성 성공');
      setLastProcessResult('success');

      if (onCompleteSuccess) {
        onCompleteSuccess();
      }

      setTimeout(() => {
        setLastProcessResult(null);
      }, 3000);
    } catch (completionError) {
      console.error(
        '❌ [MARKDOWN_BUTTON] 마크다운 완성 실패:',
        completionError
      );

      setLastProcessResult('error');

      if (onCompleteError) {
        onCompleteError(completionError);
      }

      setTimeout(() => {
        setLastProcessResult(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
      console.log('🔘 [MARKDOWN_BUTTON] 버튼 클릭 처리 완료');
    }
  }, [
    isFinallyEnabled,
    safeValidationStatus,
    updateValidationStatus,
    onBeforeComplete,
    performBridgeTransfer,
    onCompleteSuccess,
    onCompleteError,
  ]);

  const getAriaAttributes = useCallback(() => {
    let ariaLabel = `마크다운 완성 버튼. 현재 상태: ${getButtonDisplayText()}`;

    if (showDetailedStatus) {
      ariaLabel += `. 컨테이너 ${containerCount}개, 문단 ${paragraphCount}개`;

      if (unassignedParagraphCount > 0) {
        ariaLabel += `, 미할당 문단 ${unassignedParagraphCount}개`;
      }

      if (validationErrors.length > 0) {
        ariaLabel += `, 오류 ${validationErrors.length}개`;
      }

      if (validationWarnings.length > 0) {
        ariaLabel += `, 경고 ${validationWarnings.length}개`;
      }
    }

    return {
      'aria-label': ariaLabel,
      'aria-disabled': !isFinallyEnabled,
      'aria-busy': isTransferInProgress || isProcessing,
      'aria-describedby': showDetailedStatus
        ? 'markdown-button-status'
        : undefined,
    };
  }, [
    getButtonDisplayText,
    showDetailedStatus,
    containerCount,
    paragraphCount,
    unassignedParagraphCount,
    validationErrors.length,
    validationWarnings.length,
    isFinallyEnabled,
    isTransferInProgress,
    isProcessing,
  ]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleButtonClick();
      }
    },
    [handleButtonClick]
  );

  const LoadingSpinner = (): React.ReactElement => (
    <svg
      className="w-4 h-4 mr-2 -ml-1 text-current animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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

  const StatusIcon = (): React.ReactElement | null => {
    if (lastProcessResult === 'success') {
      return (
        <svg
          className="w-4 h-4 mr-2 text-current"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }

    if (lastProcessResult === 'error') {
      return (
        <svg
          className="w-4 h-4 mr-2 text-current"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    }

    return null;
  };

  console.log('🔘 [MARKDOWN_BUTTON] 버튼 렌더링 완료:', {
    isFinallyEnabled,
    isTransferInProgress,
    isProcessing,
    validationErrorCount: validationErrors.length,
    validationWarningCount: validationWarnings.length,
    buttonText: getButtonDisplayText(),
  });

  return (
    <div className="flex flex-col items-start space-y-2">
      <button
        type="button"
        className={getFinalButtonClasses()}
        disabled={!isFinallyEnabled}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        {...getAriaAttributes()}
      >
        <div className="flex items-center justify-center">
          {(isTransferInProgress || isProcessing) && <LoadingSpinner />}

          <StatusIcon />

          <span>{getButtonDisplayText()}</span>
        </div>
      </button>

      {showDetailedStatus && (
        <div
          id="markdown-button-status"
          className="space-y-1 text-xs text-gray-600"
          aria-live="polite"
        >
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-blue-800 bg-blue-100 rounded">
              컨테이너 {containerCount}개
            </span>
            <span className="px-2 py-1 text-green-800 bg-green-100 rounded">
              문단 {paragraphCount}개
            </span>
            {assignedParagraphCount > 0 && (
              <span className="px-2 py-1 text-purple-800 bg-purple-100 rounded">
                할당됨 {assignedParagraphCount}개
              </span>
            )}
            {unassignedParagraphCount > 0 && (
              <span className="px-2 py-1 text-yellow-800 bg-yellow-100 rounded">
                미할당 {unassignedParagraphCount}개
              </span>
            )}
            <span className="px-2 py-1 text-gray-800 bg-gray-100 rounded">
              {totalContentLength}자
            </span>
          </div>

          {validationErrors.length > 0 && (
            <div className="text-red-600">
              <strong>오류:</strong>
              <ul className="ml-2 list-disc list-inside">
                {validationErrors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationWarnings.length > 0 && (
            <div className="text-orange-600">
              <strong>경고:</strong>
              <ul className="ml-2 list-disc list-inside">
                {validationWarnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
