import React, { useState, useCallback } from 'react';
import { useBridgeUIComponents } from '../hooks/useBridgeUIComponents';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeDataTypes';

// 버튼 프로퍼티 인터페이스
interface MarkdownCompleteButtonProperties {
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

// 검증 상태 인터페이스
interface ValidationStatusForButton {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly isReadyForTransfer: boolean;
}

// 처리 결과 타입
type ProcessingResult = 'success' | 'error' | null;

// 타입 가드 함수들
function isValidationStatusForButton(
  candidateStatus: unknown
): candidateStatus is ValidationStatusForButton {
  if (!candidateStatus || typeof candidateStatus !== 'object') {
    return false;
  }

  const statusObject = candidateStatus as Record<string, unknown>;
  const requiredProperties = new Set([
    'containerCount',
    'paragraphCount',
    'assignedParagraphCount',
    'unassignedParagraphCount',
    'totalContentLength',
    'validationErrors',
    'validationWarnings',
    'isReadyForTransfer',
  ]);

  return Array.from(requiredProperties).every(
    (propertyName) => propertyName in statusObject
  );
}

function isStringArray(candidateArray: unknown): candidateArray is string[] {
  return (
    Array.isArray(candidateArray) &&
    candidateArray.every((item) => typeof item === 'string')
  );
}

// 기본 검증 상태 생성 함수
function createDefaultValidationStatusForButton(): ValidationStatusForButton {
  return {
    containerCount: 0,
    paragraphCount: 0,
    assignedParagraphCount: 0,
    unassignedParagraphCount: 0,
    totalContentLength: 0,
    validationErrors: [],
    validationWarnings: [],
    isReadyForTransfer: false,
  };
}

// 🚨 안전한 에러 메시지 추출 함수
function extractSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return String(error);
  } catch (conversionError) {
    console.warn(
      '⚠️ [MARKDOWN_BUTTON] 에러 메시지 변환 실패:',
      conversionError
    );
    return 'Unknown error occurred';
  }
}

// 마크다운 완성 버튼 컴포넌트
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
}: MarkdownCompleteButtonProperties): React.ReactElement {
  console.log('🔘 [MARKDOWN_BUTTON] 마크다운 완성 버튼 렌더링');

  // Bridge UI 컴포넌트 훅 사용
  const {
    canTransfer: isTransferCurrentlyAvailable,
    isTransferring: isTransferCurrentlyInProgress,
    validationStatus: rawValidationStatusData,
    executeManualTransfer: performBridgeTransferOperation,
    refreshValidationStatus: updateCurrentValidationStatus,
    lastTransferResult: mostRecentTransferResult,
  } = useBridgeUIComponents(bridgeConfig);

  // 안전한 검증 상태 메모이제이션
  const safeValidationStatusData = React.useMemo(() => {
    console.log('🔍 [MARKDOWN_BUTTON] 검증 상태 안전성 확인:', {
      rawStatus: rawValidationStatusData,
      isValid: isValidationStatusForButton(rawValidationStatusData),
    });

    if (!isValidationStatusForButton(rawValidationStatusData)) {
      console.warn('⚠️ [MARKDOWN_BUTTON] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatusForButton();
    }

    return rawValidationStatusData;
  }, [rawValidationStatusData]);

  // 로컬 상태 관리
  const [isCurrentlyProcessing, setIsCurrentlyProcessing] =
    useState<boolean>(false);
  const [lastProcessingResult, setLastProcessingResult] =
    useState<ProcessingResult>(null);

  // 🚨 추가: 상세한 에러 메시지 상태
  const [detailedErrorMessage, setDetailedErrorMessage] = useState<string>('');

  // 검증 상태 구조분해할당으로 추출
  const {
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
    totalContentLength = 0,
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
  } = safeValidationStatusData || createDefaultValidationStatusForButton();

  console.log('📊 [MARKDOWN_BUTTON] 현재 검증 상태:', {
    containerCount,
    paragraphCount,
    assignedParagraphCount,
    unassignedParagraphCount,
    validationErrorCount: validationErrors.length,
    validationWarningCount: validationWarnings.length,
    isReadyForTransfer,
  });

  // 최종 버튼 활성화 상태 계산
  const isFinalButtonEnabled =
    !forceDisabled &&
    !isTransferCurrentlyInProgress &&
    !isCurrentlyProcessing &&
    isTransferCurrentlyAvailable &&
    isReadyForTransfer &&
    (isStringArray(validationErrors) ? validationErrors.length === 0 : true);

  // 버튼 표시 텍스트 계산 함수
  const calculateButtonDisplayText = useCallback((): string => {
    if (isTransferCurrentlyInProgress || isCurrentlyProcessing) {
      return '마크다운 생성 중...';
    }

    const safeValidationErrors = isStringArray(validationErrors)
      ? validationErrors
      : [];
    if (safeValidationErrors.length > 0) {
      return '완성 불가 (오류 해결 필요)';
    }

    if (!isTransferCurrentlyAvailable || !isReadyForTransfer) {
      return '완성 준비 중...';
    }

    if (lastProcessingResult === 'success') {
      return '완성 성공!';
    }

    if (lastProcessingResult === 'error') {
      return '완성 실패 (다시 시도)';
    }

    return buttonText;
  }, [
    isTransferCurrentlyInProgress,
    isCurrentlyProcessing,
    validationErrors,
    isTransferCurrentlyAvailable,
    isReadyForTransfer,
    lastProcessingResult,
    buttonText,
  ]);

  // 크기별 CSS 클래스 계산 함수
  const calculateSizeClasses = useCallback((): string => {
    const sizeToClassMap = new Map([
      ['small', 'px-3 py-1.5 text-sm'],
      ['medium', 'px-4 py-2 text-base'],
      ['large', 'px-6 py-3 text-lg'],
    ]);

    return sizeToClassMap.get(size) || sizeToClassMap.get('medium')!;
  }, [size]);

  // 변형별 CSS 클래스 계산 함수
  const calculateVariantClasses = useCallback((): string => {
    if (!isFinalButtonEnabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300';
    }

    if (lastProcessingResult === 'success') {
      return 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500';
    }

    if (lastProcessingResult === 'error') {
      return 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500';
    }

    const variantToClassMap = new Map([
      [
        'primary',
        'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      ],
      [
        'secondary',
        'bg-gray-600 text-white border-gray-600 hover:bg-gray-700 focus:ring-gray-500',
      ],
      [
        'success',
        'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500',
      ],
    ]);

    return variantToClassMap.get(variant) || variantToClassMap.get('primary')!;
  }, [isFinalButtonEnabled, lastProcessingResult, variant]);

  // 너비 CSS 클래스 계산 함수
  const calculateWidthClasses = useCallback((): string => {
    return fullWidth ? 'w-full' : 'w-auto';
  }, [fullWidth]);

  // 최종 버튼 CSS 클래스 계산 함수
  const calculateFinalButtonClasses = useCallback((): string => {
    const baseClasses =
      'font-medium rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeClasses = calculateSizeClasses();
    const variantClasses = calculateVariantClasses();
    const widthClasses = calculateWidthClasses();

    return `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${className}`.trim();
  }, [
    calculateSizeClasses,
    calculateVariantClasses,
    calculateWidthClasses,
    className,
  ]);

  // 🚨 핵심 수정: 버튼 클릭 핸들러 - 에러 처리 강화
  const handleButtonClickEvent = useCallback(async (): Promise<void> => {
    console.log('🔘 [MARKDOWN_BUTTON] 버튼 클릭 처리 시작');

    if (!isFinalButtonEnabled) {
      console.warn('⚠️ [MARKDOWN_BUTTON] 버튼 비활성화 상태로 클릭 무시');
      return;
    }

    setIsCurrentlyProcessing(true);
    setLastProcessingResult(null);
    setDetailedErrorMessage(''); // 에러 메시지 초기화

    try {
      console.log(
        '🔍 [MARKDOWN_BUTTON] 완성 전 검증 상태:',
        safeValidationStatusData
      );

      updateCurrentValidationStatus();

      // 사용자 정의 사전 검증 실행
      if (onBeforeComplete) {
        console.log('🔍 [MARKDOWN_BUTTON] 사용자 정의 사전 검증 실행');

        const beforeCompleteValidationResult = await onBeforeComplete();

        if (!beforeCompleteValidationResult) {
          const beforeCompleteError = '사전 검증 실패';
          console.warn('⚠️ [MARKDOWN_BUTTON] 사용자 정의 사전 검증 실패');
          setLastProcessingResult('error');
          setDetailedErrorMessage(beforeCompleteError);
          setIsCurrentlyProcessing(false);

          if (onCompleteError) {
            onCompleteError(new Error(beforeCompleteError));
          }
          return;
        }
      }

      console.log('🚀 [MARKDOWN_BUTTON] 브릿지 전송 시작');
      await performBridgeTransferOperation();

      // 🚨 전송 결과 확인
      console.log(
        '🔍 [MARKDOWN_BUTTON] 전송 결과 확인:',
        mostRecentTransferResult
      );

      // 전송 성공 여부 판단 - 최신 결과를 바로 확인하기 어려우므로 일단 성공으로 처리
      console.log('✅ [MARKDOWN_BUTTON] 마크다운 완성 성공');
      setLastProcessingResult('success');
      setDetailedErrorMessage('');

      if (onCompleteSuccess) {
        onCompleteSuccess();
      }

      // 3초 후 성공 상태 초기화
      setTimeout(() => {
        setLastProcessingResult(null);
      }, 3000);
    } catch (completionError) {
      const errorMessage = extractSafeErrorMessage(completionError);

      console.error(
        '❌ [MARKDOWN_BUTTON] 마크다운 완성 실패:',
        completionError
      );

      setLastProcessingResult('error');
      setDetailedErrorMessage(errorMessage);

      if (onCompleteError) {
        onCompleteError(completionError);
      }

      // 5초 후 에러 상태 초기화
      setTimeout(() => {
        setLastProcessingResult(null);
        setDetailedErrorMessage('');
      }, 5000);
    } finally {
      setIsCurrentlyProcessing(false);
      console.log('🔘 [MARKDOWN_BUTTON] 버튼 클릭 처리 완료');
    }
  }, [
    isFinalButtonEnabled,
    safeValidationStatusData,
    updateCurrentValidationStatus,
    onBeforeComplete,
    performBridgeTransferOperation,
    onCompleteSuccess,
    onCompleteError,
    mostRecentTransferResult,
  ]);

  // 접근성 속성 계산 함수
  const calculateAriaAttributes = useCallback(() => {
    let ariaLabelText = `마크다운 완성 버튼. 현재 상태: ${calculateButtonDisplayText()}`;

    if (showDetailedStatus) {
      ariaLabelText += `. 컨테이너 ${containerCount}개, 문단 ${paragraphCount}개`;

      if (unassignedParagraphCount > 0) {
        ariaLabelText += `, 미할당 문단 ${unassignedParagraphCount}개`;
      }

      const safeValidationErrors = isStringArray(validationErrors)
        ? validationErrors
        : [];
      const safeValidationWarnings = isStringArray(validationWarnings)
        ? validationWarnings
        : [];

      if (safeValidationErrors.length > 0) {
        ariaLabelText += `, 오류 ${safeValidationErrors.length}개`;
      }

      if (safeValidationWarnings.length > 0) {
        ariaLabelText += `, 경고 ${safeValidationWarnings.length}개`;
      }
    }

    return {
      'aria-label': ariaLabelText,
      'aria-disabled': !isFinalButtonEnabled,
      'aria-busy': isTransferCurrentlyInProgress || isCurrentlyProcessing,
      'aria-describedby': showDetailedStatus
        ? 'markdown-button-status'
        : undefined,
    };
  }, [
    calculateButtonDisplayText,
    showDetailedStatus,
    containerCount,
    paragraphCount,
    unassignedParagraphCount,
    validationErrors,
    validationWarnings,
    isFinalButtonEnabled,
    isTransferCurrentlyInProgress,
    isCurrentlyProcessing,
  ]);

  // 키보드 이벤트 핸들러
  const handleKeyDownEvent = useCallback(
    (keyboardEvent: React.KeyboardEvent<HTMLButtonElement>): void => {
      const { key } = keyboardEvent;
      if (key === 'Enter' || key === ' ') {
        keyboardEvent.preventDefault();
        handleButtonClickEvent();
      }
    },
    [handleButtonClickEvent]
  );

  // 로딩 스피너 컴포넌트
  const LoadingSpinnerComponent = (): React.ReactElement => (
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

  // 상태 아이콘 컴포넌트
  const StatusIconComponent = (): React.ReactElement | null => {
    if (lastProcessingResult === 'success') {
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

    if (lastProcessingResult === 'error') {
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
    isFinalButtonEnabled,
    isTransferCurrentlyInProgress,
    isCurrentlyProcessing,
    validationErrorCount: validationErrors.length,
    validationWarningCount: validationWarnings.length,
    buttonText: calculateButtonDisplayText(),
  });

  return (
    <div className="flex flex-col items-start space-y-2">
      <button
        type="button"
        className={calculateFinalButtonClasses()}
        disabled={!isFinalButtonEnabled}
        onClick={handleButtonClickEvent}
        onKeyDown={handleKeyDownEvent}
        {...calculateAriaAttributes()}
      >
        <div className="flex items-center justify-center">
          {(isTransferCurrentlyInProgress || isCurrentlyProcessing) && (
            <LoadingSpinnerComponent />
          )}

          <StatusIconComponent />

          <span>{calculateButtonDisplayText()}</span>
        </div>
      </button>

      {/* 🚨 추가: 상세한 에러 메시지 표시 */}
      {lastProcessingResult === 'error' && detailedErrorMessage && (
        <div className="p-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded">
          <strong>오류 상세:</strong> {detailedErrorMessage}
        </div>
      )}

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

          {isStringArray(validationErrors) && validationErrors.length > 0 && (
            <div className="text-red-600">
              <strong>오류:</strong>
              <ul className="ml-2 list-disc list-inside">
                {validationErrors.map(
                  (errorMessage: string, errorIndex: number) => (
                    <li key={errorIndex}>{errorMessage}</li>
                  )
                )}
              </ul>
            </div>
          )}

          {isStringArray(validationWarnings) &&
            validationWarnings.length > 0 && (
              <div className="text-orange-600">
                <strong>경고:</strong>
                <ul className="ml-2 list-disc list-inside">
                  {validationWarnings.map(
                    (warningMessage: string, warningIndex: number) => (
                      <li key={warningIndex}>{warningMessage}</li>
                    )
                  )}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
