// bridges/components/BridgeButton.tsx

import { useState, useCallback } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import {
  createStandardizationUtils,
  type StandardButtonProps,
  type StandardVariant,
} from '../common/componentStandardization';

// 🔧 브릿지 버튼 전용 Props 인터페이스
interface BridgeButtonProps extends StandardButtonProps {
  readonly buttonText?: string;
  readonly loadingText?: string;
  readonly successText?: string;
  readonly errorText?: string;
  readonly onBeforeExecute?: () => boolean | Promise<boolean>;
  readonly onExecuteSuccess?: () => void;
  readonly onExecuteError?: (error: unknown) => void;
  readonly showDetailedStatus?: boolean;
  readonly autoResetAfterSuccess?: boolean;
  readonly autoResetDelay?: number;
  readonly executionType?: 'forward' | 'reverse' | 'bidirectional';
}

// 🔧 처리 결과 타입
type ProcessingResult = 'success' | 'error' | null;

export function BridgeButton({
  buttonText = '마크다운 완성',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled = false,
  loading = false,
  loadingText = '처리 중...',
  successText = '완성 성공!',
  errorText = '완성 실패',
  bridgeConfig,
  onBeforeExecute,
  onExecuteSuccess,
  onExecuteError,
  onClick,
  showDetailedStatus = true,
  autoResetAfterSuccess = true,
  autoResetDelay = 3000,
  executionType = 'forward',
  type = 'button',
  startIcon,
  endIcon,
}: BridgeButtonProps): ReactElement {
  // 🔧 표준화 유틸리티 사용
  const {
    getSizeClasses,
    getButtonVariantClasses,
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
  const safeDisabled = validateBoolean(disabled, false);
  const safeLoading = validateBoolean(loading, false);
  const safeFullWidth = validateBoolean(fullWidth, false);
  const safeShowDetailedStatus = validateBoolean(showDetailedStatus, true);
  const safeAutoReset = validateBoolean(autoResetAfterSuccess, true);

  // 🔧 Bridge UI 훅 사용
  const {
    isLoading: isBridgeLoading,
    hasError: hasBridgeError,
    canExecuteAction: canExecuteBridge,
    editorStatistics,
    handleForwardTransfer,
    handleReverseTransfer,
    handleBidirectionalSync,
  } = useBridgeUI(bridgeConfig);

  // 🔧 로컬 상태 관리
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult>(null);
  const [detailedErrorMessage, setDetailedErrorMessage] = useState<string>('');

  // 🔧 에디터 통계 구조분해할당
  const {
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
    totalContentLength = 0,
  } = editorStatistics;

  // 🔧 최종 버튼 활성화 상태 계산
  const isFinalButtonEnabled =
    !safeDisabled &&
    !safeLoading &&
    !isBridgeLoading &&
    !isProcessing &&
    canExecuteBridge &&
    !hasBridgeError;

  // 🔧 최종 로딩 상태 계산
  const isFinalLoadingState = safeLoading || isBridgeLoading || isProcessing;

  // 🔧 버튼 표시 텍스트 계산
  const calculateButtonDisplayText = useCallback((): string => {
    // Early Return: 로딩 상태인 경우
    if (isFinalLoadingState) {
      return loadingText;
    }

    // Early Return: 에러 상태인 경우
    if (hasBridgeError || processingResult === 'error') {
      return `${errorText} (다시 시도)`;
    }

    // Early Return: 성공 상태인 경우
    if (processingResult === 'success') {
      return successText;
    }

    // Early Return: 실행 불가능한 경우
    if (!canExecuteBridge) {
      return '완성 준비 중...';
    }

    return buttonText;
  }, [
    isFinalLoadingState,
    loadingText,
    hasBridgeError,
    processingResult,
    errorText,
    successText,
    canExecuteBridge,
    buttonText,
  ]);

  // 🔧 현재 버튼 상태에 따른 variant 계산
  const calculateCurrentVariant = useCallback((): StandardVariant => {
    // Early Return: 에러 상태인 경우
    if (hasBridgeError || processingResult === 'error') {
      return 'error';
    }

    // Early Return: 성공 상태인 경우
    if (processingResult === 'success') {
      return 'success';
    }

    // Early Return: 실행 불가능한 경우
    if (!canExecuteBridge) {
      return 'warning';
    }

    return safeVariant;
  }, [hasBridgeError, processingResult, canExecuteBridge, safeVariant]);

  // 🔧 CSS 클래스 계산
  const sizeClasses = getSizeClasses(safeSize);
  const variantClasses = getButtonVariantClasses(
    calculateCurrentVariant(),
    !isFinalButtonEnabled
  );
  const widthClasses = safeFullWidth ? 'w-full' : 'w-auto';
  const baseClasses =
    'font-medium rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const finalButtonClasses =
    `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${safeClassName}`.trim();

  // 🔧 에러 메시지 추출 함수
  const extractSafeErrorMessage = (error: unknown): string => {
    // Early Return: 이미 문자열인 경우
    if (typeof error === 'string') {
      return error.length > 0 ? error : '알 수 없는 오류';
    }

    // Early Return: Error 객체인 경우
    if (error instanceof Error) {
      return error.message.length > 0 ? error.message : '알 수 없는 오류';
    }

    // Early Return: 객체이고 message 속성이 있는 경우
    if (error && typeof error === 'object' && 'message' in error) {
      const errorObject = error as { message: unknown };
      return typeof errorObject.message === 'string'
        ? errorObject.message
        : '알 수 없는 오류';
    }

    return '알 수 없는 오류가 발생했습니다';
  };

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

  // 🔧 메인 클릭 핸들러
  const handleButtonClick = useCallback(async (): Promise<void> => {
    logComponentAction('BRIDGE_BUTTON', '버튼 클릭 처리 시작', {
      executionType,
    });

    // Early Return: 버튼이 비활성화된 경우
    if (!isFinalButtonEnabled) {
      logComponentAction('BRIDGE_BUTTON', '버튼 비활성화 상태로 클릭 무시');
      return;
    }

    // Early Return: 사용자 정의 클릭 핸들러가 있는 경우
    if (onClick) {
      logComponentAction('BRIDGE_BUTTON', '사용자 정의 클릭 핸들러 실행');
      const mockEvent = new MouseEvent('click') as any;
      onClick(mockEvent);
      return;
    }

    setIsProcessing(true);
    setProcessingResult(null);
    setDetailedErrorMessage('');

    try {
      // 사용자 정의 사전 검증 실행
      const shouldExecuteBeforeCheck = onBeforeExecute !== undefined;
      if (shouldExecuteBeforeCheck) {
        logComponentAction('BRIDGE_BUTTON', '사용자 정의 사전 검증 실행');

        const beforeResult = await onBeforeExecute!();
        const isBeforeCheckSuccessful = beforeResult === true;

        // Early Return: 사전 검증 실패
        if (!isBeforeCheckSuccessful) {
          const beforeError = '사전 검증 실패';
          logComponentAction('BRIDGE_BUTTON', '사용자 정의 사전 검증 실패');
          setProcessingResult('error');
          setDetailedErrorMessage(beforeError);

          const shouldExecuteErrorCallback = onExecuteError !== undefined;
          shouldExecuteErrorCallback
            ? onExecuteError(new Error(beforeError))
            : null;
          return;
        }
      }

      // 브릿지 실행
      logComponentAction('BRIDGE_BUTTON', '브릿지 실행 시작', {
        executionType,
      });
      const executionFunction = getExecutionFunction();
      await executionFunction();

      // 성공 처리
      logComponentAction('BRIDGE_BUTTON', '브릿지 실행 성공');
      setProcessingResult('success');
      setDetailedErrorMessage('');

      const shouldExecuteSuccessCallback = onExecuteSuccess !== undefined;
      shouldExecuteSuccessCallback ? onExecuteSuccess() : null;

      // 자동 상태 초기화
      const shouldAutoReset = safeAutoReset && autoResetDelay > 0;
      if (shouldAutoReset) {
        setTimeout(() => {
          setProcessingResult(null);
        }, autoResetDelay);
      }
    } catch (executionError) {
      const errorMessage = extractSafeErrorMessage(executionError);

      logComponentAction('BRIDGE_BUTTON', '브릿지 실행 실패', {
        error: errorMessage,
        executionType,
      });

      setProcessingResult('error');
      setDetailedErrorMessage(errorMessage);

      const shouldExecuteErrorCallback = onExecuteError !== undefined;
      shouldExecuteErrorCallback ? onExecuteError(executionError) : null;

      // 5초 후 에러 상태 초기화
      setTimeout(() => {
        setProcessingResult(null);
        setDetailedErrorMessage('');
      }, 5000);
    } finally {
      setIsProcessing(false);
      logComponentAction('BRIDGE_BUTTON', '버튼 클릭 처리 완료');
    }
  }, [
    isFinalButtonEnabled,
    onClick,
    onBeforeExecute,
    getExecutionFunction,
    onExecuteSuccess,
    onExecuteError,
    safeAutoReset,
    autoResetDelay,
    executionType,
  ]);

  // 🔧 접근성 속성 생성
  const buttonAriaAttributes = generateStandardAriaAttributes('button', {
    label: `${calculateButtonDisplayText()}. 컨테이너 ${containerCount}개, 문단 ${paragraphCount}개`,
    description: safeShowDetailedStatus
      ? `할당됨: ${assignedParagraphCount}, 미할당: ${unassignedParagraphCount}`
      : '',
    disabled: !isFinalButtonEnabled,
    loading: isFinalLoadingState,
  });

  // 🔧 키보드 이벤트 핸들러
  const keyboardHandler = generateKeyboardHandler(handleButtonClick as any);

  // 🔧 아이콘 컴포넌트들
  const LoadingSpinnerIcon = (): ReactElement => (
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

  const StatusIcon = (): ReactElement | null => {
    const isSuccessState = processingResult === 'success';
    if (isSuccessState) {
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

    const isErrorState = processingResult === 'error' || hasBridgeError;
    if (isErrorState) {
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

  const ButtonContent = (): ReactNode => (
    <div className="flex items-center justify-center">
      {startIcon ? <span className="mr-2">{startIcon}</span> : null}

      {isFinalLoadingState ? <LoadingSpinnerIcon /> : null}

      <StatusIcon />

      <span>{calculateButtonDisplayText()}</span>

      {endIcon ? <span className="ml-2">{endIcon}</span> : null}
    </div>
  );

  const DetailedStatusInfo = (): ReactElement | null => {
    const shouldShowDetails = safeShowDetailedStatus;

    // Early Return: 상세 정보를 보여주지 않는 경우
    if (!shouldShowDetails) {
      return null;
    }

    return (
      <div
        id="bridge-button-status"
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
          {assignedParagraphCount > 0 ? (
            <span className="px-2 py-1 text-purple-800 bg-purple-100 rounded">
              할당됨 {assignedParagraphCount}개
            </span>
          ) : null}
          {unassignedParagraphCount > 0 ? (
            <span className="px-2 py-1 text-yellow-800 bg-yellow-100 rounded">
              미할당 {unassignedParagraphCount}개
            </span>
          ) : null}
          <span className="px-2 py-1 text-gray-800 bg-gray-100 rounded">
            {totalContentLength.toLocaleString()}자
          </span>
        </div>
      </div>
    );
  };

  const ErrorDetailMessage = (): ReactElement | null => {
    const shouldShowErrorDetail =
      processingResult === 'error' && detailedErrorMessage.length > 0;

    // Early Return: 에러 상세 메시지가 없는 경우
    if (!shouldShowErrorDetail) {
      return null;
    }

    return (
      <div className="p-2 text-sm text-red-700 bg-red-100 border border-red-200 rounded">
        <strong>오류 상세:</strong> {detailedErrorMessage}
      </div>
    );
  };

  logComponentRender('BRIDGE_BUTTON', {
    size: safeSize,
    variant: safeVariant,
    disabled: safeDisabled,
    loading: safeLoading,
    buttonText: calculateButtonDisplayText(),
  });

  return (
    <div className="flex flex-col items-start space-y-2">
      <button
        type={type}
        className={finalButtonClasses}
        disabled={!isFinalButtonEnabled}
        onClick={handleButtonClick}
        onKeyDown={keyboardHandler}
        {...buttonAriaAttributes}
      >
        <ButtonContent />
      </button>

      <ErrorDetailMessage />

      <DetailedStatusInfo />
    </div>
  );
}
