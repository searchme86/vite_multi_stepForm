// bridges/parts/MarkdownCompleteButton.tsx

import React, { useState, useCallback } from 'react';
import { useBridgeUI } from '../hooks/useBridgeUI';
import { BridgeSystemConfiguration } from '../editorMultiStepBridge/bridgeTypes';

// 버튼 프로퍼티 인터페이스
// 외부에서 버튼 동작을 커스터마이징할 수 있는 옵션들 정의
interface MarkdownCompleteButtonProps {
  // 버튼에 표시될 텍스트 (기본값: "마크다운 완성")
  readonly buttonText?: string;

  // 버튼의 크기 설정 (small, medium, large)
  readonly size?: 'small' | 'medium' | 'large';

  // 버튼의 스타일 변형 (primary, secondary, success)
  readonly variant?: 'primary' | 'secondary' | 'success';

  // 버튼이 전체 너비를 차지할지 여부
  readonly fullWidth?: boolean;

  // 추가적인 CSS 클래스명
  readonly className?: string;

  // 버튼 클릭 전에 실행될 콜백 함수 (검증, 확인 등)
  readonly onBeforeComplete?: () => boolean | Promise<boolean>;

  // 완성 성공 후 실행될 콜백 함수
  readonly onCompleteSuccess?: () => void;

  // 완성 실패 후 실행될 콜백 함수
  readonly onCompleteError?: (error: unknown) => void;

  // 사용자 정의 브릿지 설정 (기본 설정 재정의 시 사용)
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;

  // 버튼을 강제로 비활성화할지 여부 (외부 조건에 따른 제어용)
  readonly forceDisabled?: boolean;

  // 상세한 상태 정보를 버튼에 표시할지 여부
  readonly showDetailedStatus?: boolean;
}

/**
 * 마크다운 완성 버튼 컴포넌트
 * 에디터 작업을 완료하고 멀티스텝 폼으로 데이터를 전송하는 기능을 제공
 *
 * 주요 기능:
 * 1. 브릿지 상태에 따른 버튼 활성화/비활성화
 * 2. 전송 진행 중 로딩 상태 표시
 * 3. 실시간 검증 상태 반영
 * 4. 접근성 준수 (ARIA 레이블, 키보드 네비게이션)
 * 5. 사용자 정의 가능한 스타일링
 *
 * @param props - 버튼 설정 옵션들
 * @returns JSX 엘리먼트
 */
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

  // 브릿지 UI 훅 연결 - 실제 전송 기능과 상태 정보 제공
  const {
    canTransfer: isTransferAvailable, // 현재 전송 가능 여부
    isTransferring: isTransferInProgress, // 전송 진행 중 여부
    validationStatus: currentValidationStatus, // 에디터 데이터 검증 상태
    executeManualTransfer: performBridgeTransfer, // 실제 전송 실행 함수
    refreshValidationStatus: updateValidationStatus, // 검증 상태 새로고침
  } = useBridgeUI(bridgeConfig);

  // 버튼 클릭 처리 중 상태 (추가적인 UI 피드백용)
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 마지막 처리 결과 상태 (성공/실패 피드백 표시용)
  const [lastProcessResult, setLastProcessResult] = useState<
    'success' | 'error' | null
  >(null);

  // 검증 상태에서 주요 정보 추출
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

  // 최종 버튼 활성화 상태 계산
  // 모든 조건이 충족되어야 버튼이 활성화됨
  const isFinallyEnabled =
    !forceDisabled && // 외부에서 강제 비활성화하지 않았고
    !isTransferInProgress && // 현재 전송 진행 중이 아니고
    !isProcessing && // 버튼 처리 중이 아니고
    isTransferAvailable && // 브릿지에서 전송 가능하다고 판단하고
    isReadyForTransfer && // 검증 상태에서도 준비되었다고 판단할 때
    validationErrors.length === 0; // 치명적인 검증 오류가 없을 때

  // 버튼 상태에 따른 표시 텍스트 계산
  const getButtonDisplayText = useCallback((): string => {
    // 전송 진행 중일 때
    if (isTransferInProgress || isProcessing) {
      return '마크다운 생성 중...';
    }

    // 검증 오류가 있을 때
    if (validationErrors.length > 0) {
      return '완성 불가 (오류 해결 필요)';
    }

    // 전송 불가능 상태일 때
    if (!isTransferAvailable || !isReadyForTransfer) {
      return '완성 준비 중...';
    }

    // 마지막 처리 결과에 따른 텍스트
    if (lastProcessResult === 'success') {
      return '완성 성공!';
    }

    if (lastProcessResult === 'error') {
      return '완성 실패 (다시 시도)';
    }

    // 정상 상태일 때 기본 텍스트 또는 사용자 지정 텍스트
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

  // 버튼 크기에 따른 CSS 클래스 계산
  const getSizeClasses = useCallback((): string => {
    const sizeClassMap = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg',
    };
    return sizeClassMap[size] || sizeClassMap.medium;
  }, [size]);

  // 버튼 변형에 따른 CSS 클래스 계산
  const getVariantClasses = useCallback((): string => {
    // 비활성화 상태일 때는 공통 비활성화 스타일 적용
    if (!isFinallyEnabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300';
    }

    // 마지막 처리 결과에 따른 스타일
    if (lastProcessResult === 'success') {
      return 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500';
    }

    if (lastProcessResult === 'error') {
      return 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500';
    }

    // 정상 상태일 때 변형별 스타일
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

  // 전체 너비 여부에 따른 CSS 클래스
  const getWidthClasses = useCallback((): string => {
    return fullWidth ? 'w-full' : 'w-auto';
  }, [fullWidth]);

  // 최종 버튼 CSS 클래스 조합
  const getFinalButtonClasses = useCallback((): string => {
    const baseClasses =
      'font-medium rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeClasses = getSizeClasses();
    const variantClasses = getVariantClasses();
    const widthClasses = getWidthClasses();

    return `${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${className}`.trim();
  }, [getSizeClasses, getVariantClasses, getWidthClasses, className]);

  // 버튼 클릭 핸들러
  // 전체 완성 프로세스를 관리하고 각 단계별 피드백 제공
  const handleButtonClick = useCallback(async (): Promise<void> => {
    console.log('🔘 [MARKDOWN_BUTTON] 버튼 클릭 처리 시작');

    // 버튼 비활성화 상태에서는 클릭 무시
    if (!isFinallyEnabled) {
      console.warn('⚠️ [MARKDOWN_BUTTON] 버튼 비활성화 상태로 클릭 무시');
      return;
    }

    // 처리 시작 - UI 상태 업데이트
    setIsProcessing(true);
    setLastProcessResult(null);

    try {
      console.log(
        '🔍 [MARKDOWN_BUTTON] 완성 전 검증 상태:',
        currentValidationStatus
      );

      // 검증 상태 새로고침 (최신 에디터 상태 반영)
      updateValidationStatus();

      // 사용자 정의 사전 검증 실행 (있는 경우)
      if (onBeforeComplete) {
        console.log('🔍 [MARKDOWN_BUTTON] 사용자 정의 사전 검증 실행');
        const beforeCompleteResult = await onBeforeComplete();

        if (!beforeCompleteResult) {
          console.warn('⚠️ [MARKDOWN_BUTTON] 사용자 정의 사전 검증 실패');
          setLastProcessResult('error');
          setIsProcessing(false);

          // 사용자 정의 오류 콜백 실행
          if (onCompleteError) {
            onCompleteError(new Error('사전 검증 실패'));
          }
          return;
        }
      }

      // 실제 브릿지 전송 실행
      console.log('🚀 [MARKDOWN_BUTTON] 브릿지 전송 시작');
      await performBridgeTransfer();

      // 성공 처리
      console.log('✅ [MARKDOWN_BUTTON] 마크다운 완성 성공');
      setLastProcessResult('success');

      // 성공 콜백 실행
      if (onCompleteSuccess) {
        onCompleteSuccess();
      }

      // 성공 상태를 3초 후 자동으로 리셋 (사용자 경험 개선)
      setTimeout(() => {
        setLastProcessResult(null);
      }, 3000);
    } catch (completionError) {
      console.error(
        '❌ [MARKDOWN_BUTTON] 마크다운 완성 실패:',
        completionError
      );

      // 실패 처리
      setLastProcessResult('error');

      // 오류 콜백 실행
      if (onCompleteError) {
        onCompleteError(completionError);
      }

      // 실패 상태를 5초 후 자동으로 리셋 (재시도 유도)
      setTimeout(() => {
        setLastProcessResult(null);
      }, 5000);
    } finally {
      // 처리 완료 - UI 상태 정리
      setIsProcessing(false);
      console.log('🔘 [MARKDOWN_BUTTON] 버튼 클릭 처리 완료');
    }
  }, [
    isFinallyEnabled,
    currentValidationStatus,
    updateValidationStatus,
    onBeforeComplete,
    performBridgeTransfer,
    onCompleteSuccess,
    onCompleteError,
  ]);

  // 접근성을 위한 ARIA 속성 계산
  const getAriaAttributes = useCallback(() => {
    // 기본 ARIA 레이블
    let ariaLabel = `마크다운 완성 버튼. 현재 상태: ${getButtonDisplayText()}`;

    // 상세 상태 정보 추가 (스크린 리더용)
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

  // 키보드 이벤트 핸들러 (접근성 지원)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Enter 또는 Space 키로 버튼 활성화 (마우스 클릭과 동일한 동작)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleButtonClick();
      }
    },
    [handleButtonClick]
  );

  // 로딩 스피너 JSX (전송 진행 중일 때 표시)
  const LoadingSpinner = (): React.ReactElement => (
    <svg
      className="w-4 h-4 mr-2 -ml-1 text-current animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true" // 스크린 리더에서 숨김 (장식용 요소)
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

  // 상태 아이콘 JSX (성공/실패 상태 표시)
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
      {/* 메인 버튼 */}
      <button
        type="button" // submit이 아닌 일반 버튼으로 설정 (폼 제출 방지)
        className={getFinalButtonClasses()}
        disabled={!isFinallyEnabled}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        {...getAriaAttributes()}
      >
        {/* 버튼 내용 - 아이콘과 텍스트를 flex로 정렬 */}
        <div className="flex items-center justify-center">
          {/* 로딩 중일 때 스피너 표시 */}
          {(isTransferInProgress || isProcessing) && <LoadingSpinner />}

          {/* 상태 아이콘 표시 (성공/실패) */}
          <StatusIcon />

          {/* 버튼 텍스트 */}
          <span>{getButtonDisplayText()}</span>
        </div>
      </button>

      {/* 상세 상태 정보 표시 (선택적) */}
      {showDetailedStatus && (
        <div
          id="markdown-button-status"
          className="space-y-1 text-xs text-gray-600"
          aria-live="polite" // 상태 변화 시 스크린 리더에 알림
        >
          {/* 기본 통계 정보 */}
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

          {/* 검증 오류 표시 (있는 경우) */}
          {validationErrors.length > 0 && (
            <div className="text-red-600">
              <strong>오류:</strong>
              <ul className="ml-2 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 검증 경고 표시 (있는 경우) */}
          {validationWarnings.length > 0 && (
            <div className="text-orange-600">
              <strong>경고:</strong>
              <ul className="ml-2 list-disc list-inside">
                {validationWarnings.map((warning, index) => (
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
