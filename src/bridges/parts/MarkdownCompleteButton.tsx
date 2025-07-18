// bridges/parts/MarkdownCompleteButton.tsx

import React, { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import {
  createStandardizationUtils,
  type StandardButtonProps,
  type StandardVariant,
} from '../common/componentStandardization';

// 🔧 마크다운 완성 버튼 전용 Props 인터페이스 (표준화됨)
interface MarkdownCompleteButtonProps extends StandardButtonProps {
  readonly buttonText?: string;
  readonly onBeforeComplete?: () => boolean | Promise<boolean>;
  readonly onCompleteSuccess?: () => void;
  readonly onCompleteError?: (error: unknown) => void;
  readonly forceDisabled?: boolean;
  readonly showDetailedStatus?: boolean;
  readonly autoResetAfterSuccess?: boolean;
  readonly autoResetDelay?: number;
}

// 🔧 처리 결과 타입
type ProcessingResult = 'success' | 'error' | null;

export function MarkdownCompleteButton({
  buttonText = '마크다운 완성',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled = false,
  loading = false,
  onBeforeComplete,
  onCompleteSuccess,
  onCompleteError,
  bridgeConfig,
  onClick,
  forceDisabled = false,
  showDetailedStatus = true,
  autoResetAfterSuccess = true,
  autoResetDelay = 3000,
  type = 'button',
  startIcon,
  endIcon,
}: MarkdownCompleteButtonProps): ReactElement {
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
  const safeForceDisabled = validateBoolean(forceDisabled, false);
  const safeShowDetailedStatus = validateBoolean(showDetailedStatus, true);
  const safeAutoResetAfterSuccess = validateBoolean(
    autoResetAfterSuccess,
    true
  );

  // 🔧 최신 Bridge UI 훅 사용
  const bridgeUIHook = useBridgeUI(bridgeConfig);

  console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 컴포넌트 렌더링', {
    size: safeSize,
    variant: safeVariant,
    disabled: safeDisabled,
    loading: safeLoading,
  });

  logComponentRender('MARKDOWN_COMPLETE_BUTTON', {
    size: safeSize,
    variant: safeVariant,
    disabled: safeDisabled,
    loading: safeLoading,
  });

  // 🔧 로컬 상태 관리
  const [isCurrentlyProcessing, setIsCurrentlyProcessing] =
    useState<boolean>(false);
  const [lastProcessingResult, setLastProcessingResult] =
    useState<ProcessingResult>(null);
  const [detailedErrorMessage, setDetailedErrorMessage] = useState<string>('');

  // 🔧 Bridge UI 상태 정보 추출
  const {
    editorStatistics,
    isLoading: bridgeIsLoading,
    canExecuteAction: bridgeCanExecuteAction,
    handleForwardTransfer,
  } = bridgeUIHook;

  // 🔧 검증 통계 계산
  const validationStatistics = React.useMemo(() => {
    const { hasUnassignedContent = false } = editorStatistics || {};
    const hasValidationErrors = !bridgeCanExecuteAction;

    console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 검증 통계 계산', {
      hasUnassignedContent,
      hasValidationErrors,
      bridgeCanExecuteAction,
    });

    return {
      hasErrors: hasValidationErrors,
      hasWarnings: hasUnassignedContent,
    };
  }, [editorStatistics, bridgeCanExecuteAction]);

  const { hasErrors } = validationStatistics;

  // 🔧 최종 버튼 활성화 상태 계산
  const isFinalButtonEnabled = React.useMemo(() => {
    const buttonState =
      !safeForceDisabled &&
      !safeDisabled &&
      !safeLoading &&
      !bridgeIsLoading &&
      !isCurrentlyProcessing &&
      bridgeCanExecuteAction &&
      !hasErrors;

    console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 버튼 활성화 상태', {
      safeForceDisabled,
      safeDisabled,
      safeLoading,
      bridgeIsLoading,
      isCurrentlyProcessing,
      bridgeCanExecuteAction,
      hasErrors,
      finalResult: buttonState,
    });

    return buttonState;
  }, [
    safeForceDisabled,
    safeDisabled,
    safeLoading,
    bridgeIsLoading,
    isCurrentlyProcessing,
    bridgeCanExecuteAction,
    hasErrors,
  ]);

  // 🔧 최종 로딩 상태 계산
  const isFinalLoadingState = React.useMemo(() => {
    const loadingState =
      safeLoading || bridgeIsLoading || isCurrentlyProcessing;

    console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 로딩 상태', {
      safeLoading,
      bridgeIsLoading,
      isCurrentlyProcessing,
      finalResult: loadingState,
    });

    return loadingState;
  }, [safeLoading, bridgeIsLoading, isCurrentlyProcessing]);

  // 🔧 버튼 표시 텍스트 계산
  const calculateButtonDisplayText = useCallback((): string => {
    // Early Return: 로딩 상태인 경우
    if (isFinalLoadingState) {
      return '마크다운 생성 중...';
    }

    // Early Return: 에러가 있는 경우
    if (hasErrors) {
      return '완성 불가 (오류 해결 필요)';
    }

    // Early Return: 에러 상태인 경우
    if (lastProcessingResult === 'error') {
      return '완성 실패 (다시 시도)';
    }

    // Early Return: 성공 상태인 경우
    if (lastProcessingResult === 'success') {
      return '완성 성공!';
    }

    // Early Return: 준비되지 않은 경우
    if (!bridgeCanExecuteAction) {
      return '완성 준비 중...';
    }

    return buttonText;
  }, [
    isFinalLoadingState,
    hasErrors,
    lastProcessingResult,
    bridgeCanExecuteAction,
    buttonText,
  ]);

  // 🔧 현재 버튼 상태에 따른 variant 계산
  const calculateCurrentVariant = useCallback((): StandardVariant => {
    // Early Return: 에러가 있는 경우
    if (hasErrors || lastProcessingResult === 'error') {
      return 'error';
    }

    // Early Return: 성공 상태인 경우
    if (lastProcessingResult === 'success') {
      return 'success';
    }

    // Early Return: 준비되지 않은 경우
    if (!bridgeCanExecuteAction) {
      return 'warning';
    }

    return safeVariant;
  }, [hasErrors, lastProcessingResult, bridgeCanExecuteAction, safeVariant]);

  // 🔧 CSS 클래스 계산 (표준화됨)
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
  const extractSafeErrorMessage = useCallback((error: unknown): string => {
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
      const errorObject = error;
      const messageValue = Reflect.get(errorObject, 'message');
      return typeof messageValue === 'string'
        ? messageValue
        : '알 수 없는 오류';
    }

    return '알 수 없는 오류가 발생했습니다';
  }, []);

  // 🔧 메인 클릭 핸들러
  const handleButtonClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
      console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 버튼 클릭 처리 시작');
      logComponentAction('MARKDOWN_COMPLETE_BUTTON', '버튼 클릭 처리 시작');

      // Early Return: 버튼이 비활성화된 경우
      if (!isFinalButtonEnabled) {
        console.log(
          '🔧 [MARKDOWN_COMPLETE_BUTTON] 버튼 비활성화 상태로 클릭 무시'
        );
        logComponentAction(
          'MARKDOWN_COMPLETE_BUTTON',
          '버튼 비활성화 상태로 클릭 무시'
        );
        return;
      }

      // Early Return: 사용자 정의 클릭 핸들러가 있는 경우
      if (onClick) {
        console.log(
          '🔧 [MARKDOWN_COMPLETE_BUTTON] 사용자 정의 클릭 핸들러 실행'
        );
        logComponentAction(
          'MARKDOWN_COMPLETE_BUTTON',
          '사용자 정의 클릭 핸들러 실행'
        );
        onClick(event);
        return;
      }

      setIsCurrentlyProcessing(true);
      setLastProcessingResult(null);
      setDetailedErrorMessage('');

      try {
        // 사용자 정의 사전 검증 실행
        const shouldExecuteBeforeComplete = onBeforeComplete !== undefined;
        if (shouldExecuteBeforeComplete) {
          console.log(
            '🔧 [MARKDOWN_COMPLETE_BUTTON] 사용자 정의 사전 검증 실행'
          );
          logComponentAction(
            'MARKDOWN_COMPLETE_BUTTON',
            '사용자 정의 사전 검증 실행'
          );

          const beforeCompleteFunction = onBeforeComplete!;
          const beforeResult = await beforeCompleteFunction();
          const isBeforeCheckSuccessful = beforeResult === true;

          // Early Return: 사전 검증 실패
          if (!isBeforeCheckSuccessful) {
            const beforeError = '사전 검증 실패';
            console.log(
              '🔧 [MARKDOWN_COMPLETE_BUTTON] 사용자 정의 사전 검증 실패'
            );
            logComponentAction(
              'MARKDOWN_COMPLETE_BUTTON',
              '사용자 정의 사전 검증 실패'
            );
            setLastProcessingResult('error');
            setDetailedErrorMessage(beforeError);

            const shouldExecuteErrorCallback = onCompleteError !== undefined;
            if (shouldExecuteErrorCallback) {
              onCompleteError(new Error(beforeError));
            }
            return;
          }
        }

        // 브릿지 전송 실행
        console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 브릿지 전송 시작');
        logComponentAction('MARKDOWN_COMPLETE_BUTTON', '브릿지 전송 시작');
        await handleForwardTransfer();

        // 성공 처리
        console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 브릿지 전송 성공');
        logComponentAction('MARKDOWN_COMPLETE_BUTTON', '브릿지 전송 성공');
        setLastProcessingResult('success');
        setDetailedErrorMessage('');

        const shouldExecuteSuccessCallback = onCompleteSuccess !== undefined;
        if (shouldExecuteSuccessCallback) {
          onCompleteSuccess();
        }

        // 자동 상태 초기화
        const shouldAutoReset = safeAutoResetAfterSuccess && autoResetDelay > 0;
        if (shouldAutoReset) {
          setTimeout(() => {
            setLastProcessingResult(null);
          }, autoResetDelay);
        }
      } catch (completionError) {
        const errorMessage = extractSafeErrorMessage(completionError);

        console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 브릿지 전송 실패', {
          error: errorMessage,
        });
        logComponentAction('MARKDOWN_COMPLETE_BUTTON', '브릿지 전송 실패', {
          error: errorMessage,
        });

        setLastProcessingResult('error');
        setDetailedErrorMessage(errorMessage);

        const shouldExecuteErrorCallback = onCompleteError !== undefined;
        if (shouldExecuteErrorCallback) {
          onCompleteError(completionError);
        }

        // 5초 후 에러 상태 초기화
        setTimeout(() => {
          setLastProcessingResult(null);
          setDetailedErrorMessage('');
        }, 5000);
      } finally {
        setIsCurrentlyProcessing(false);
        console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 버튼 클릭 처리 완료');
        logComponentAction('MARKDOWN_COMPLETE_BUTTON', '버튼 클릭 처리 완료');
      }
    },
    [
      isFinalButtonEnabled,
      onClick,
      onBeforeComplete,
      handleForwardTransfer,
      onCompleteSuccess,
      onCompleteError,
      safeAutoResetAfterSuccess,
      autoResetDelay,
      extractSafeErrorMessage,
    ]
  );

  // 🔧 접근성 속성 생성 (표준화됨)
  const buttonAriaAttributes = generateStandardAriaAttributes('button', {
    label: `${calculateButtonDisplayText()}. 컨테이너 ${
      editorStatistics?.containerCount || 0
    }개, 문단 ${editorStatistics?.paragraphCount || 0}개`,
    description: safeShowDetailedStatus
      ? `할당됨: ${editorStatistics?.assignedParagraphCount || 0}, 미할당: ${
          editorStatistics?.unassignedParagraphCount || 0
        }`
      : '',
    disabled: !isFinalButtonEnabled,
    loading: isFinalLoadingState,
  });

  // 🔧 키보드 이벤트 핸들러 (표준화됨)
  const keyboardHandler = generateKeyboardHandler((): void => {
    const activeElement = document.activeElement;
    const isButtonElement = activeElement instanceof HTMLButtonElement;

    if (isButtonElement) {
      const buttonElement = activeElement;

      // 실제 클릭 이벤트 발생시키기
      buttonElement.click();
    }
  });

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
    const isSuccessState = lastProcessingResult === 'success';
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

    const isErrorState = lastProcessingResult === 'error' || hasErrors;
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

  const ButtonContent = (): React.ReactNode => (
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

    const {
      containerCount = 0,
      paragraphCount = 0,
      assignedParagraphCount = 0,
      unassignedParagraphCount = 0,
      totalContentLength = 0,
    } = editorStatistics || {};

    return (
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
      lastProcessingResult === 'error' && detailedErrorMessage.length > 0;

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

  console.log('🔧 [MARKDOWN_COMPLETE_BUTTON] 최종 렌더링', {
    isFinalButtonEnabled,
    isFinalLoadingState,
    lastProcessingResult,
    buttonText: calculateButtonDisplayText(),
  });

  logComponentRender('MARKDOWN_COMPLETE_BUTTON', {
    isFinalButtonEnabled,
    isFinalLoadingState,
    lastProcessingResult,
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
