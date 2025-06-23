// bridges/editorMultiStepBridge/bridgeErrorHandler.ts

import { BridgeOperationErrorDetails } from './bridgeTypes';

export const createBridgeErrorManagementHandler = () => {
  const generateErrorCode = (errorType: string, timestamp: number): string => {
    const timeString = timestamp.toString(36);
    const randomString = Math.random().toString(36).substring(2, 8);
    return `BRIDGE_${errorType}_${timeString}_${randomString}`.toUpperCase();
  };

  const extractErrorContext = (error: unknown): Record<string, unknown> => {
    const context: Record<string, unknown> = {};

    if (error instanceof Error) {
      context.errorName = error.name;
      context.errorMessage = error.message;
      context.errorStack = error.stack;
      context.errorType = 'Error';
    } else if (typeof error === 'string') {
      context.errorMessage = error;
      context.errorType = 'string';
    } else if (typeof error === 'object' && error !== null) {
      context.errorObject = error;
      context.errorType = 'object';
    } else {
      context.errorValue = error;
      context.errorType = typeof error;
    }

    context.userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    context.timestamp = Date.now();
    context.url =
      typeof window !== 'undefined' ? window.location.href : 'unknown';

    return context;
  };

  const isRecoverable = (error: unknown): boolean => {
    if (error instanceof TypeError) return false;
    if (error instanceof ReferenceError) return false;
    if (error instanceof SyntaxError) return false;

    if (typeof error === 'string') {
      const errorMsg = error.toLowerCase();
      const criticalKeywords = [
        'fatal',
        'critical',
        'system',
        'memory',
        'security',
      ];

      if (criticalKeywords.some((keyword) => errorMsg.includes(keyword))) {
        return false;
      }
    }

    return true;
  };

  const createBridgeErrorDetails = (
    error: unknown,
    errorType: string = 'UNKNOWN'
  ): BridgeOperationErrorDetails => {
    console.log('🔧 [ERROR_HANDLER] 오류 상세 정보 생성');

    const timestamp = Date.now();
    const errorCode = generateErrorCode(errorType, timestamp);
    const context = extractErrorContext(error);
    const recoverable = isRecoverable(error);

    let message = '알 수 없는 오류가 발생했습니다';

    if (error instanceof Error) {
      message = error.message || message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (typeof error === 'object' && error !== null) {
      message = `객체 오류: ${JSON.stringify(error)}`;
    }

    const errorDetails: BridgeOperationErrorDetails = {
      errorCode,
      errorMessage: message,
      errorTimestamp: new Date(timestamp),
      errorContext: context,
      isRecoverable: recoverable,
    };

    console.log('✅ [ERROR_HANDLER] 오류 상세 정보 생성 완료:', {
      errorCode,
      isRecoverable: recoverable,
    });

    return errorDetails;
  };

  const handleExtractionError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 추출 오류 처리');
    return createBridgeErrorDetails(error, 'EXTRACTION');
  };

  const handleTransformationError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 변환 오류 처리');
    return createBridgeErrorDetails(error, 'TRANSFORMATION');
  };

  const handleValidationError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 검증 오류 처리');
    return createBridgeErrorDetails(error, 'VALIDATION');
  };

  const handleUpdateError = (error: unknown): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 업데이트 오류 처리');
    return createBridgeErrorDetails(error, 'UPDATE');
  };

  const handleGeneralError = (error: unknown): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 일반 오류 처리');
    return createBridgeErrorDetails(error, 'GENERAL');
  };

  const logErrorDetails = (errorDetails: BridgeOperationErrorDetails): void => {
    const {
      errorCode,
      errorMessage,
      errorTimestamp,
      isRecoverable,
      errorContext,
    } = errorDetails;

    console.group(`❌ [ERROR_HANDLER] 오류 상세 - ${errorCode}`);
    console.error('메시지:', errorMessage);
    console.error('발생 시각:', errorTimestamp.toISOString());
    console.error('복구 가능:', isRecoverable);
    console.error('컨텍스트:', errorContext);
    console.groupEnd();
  };

  const createRecoveryStrategy = (
    errorDetails: BridgeOperationErrorDetails
  ): string[] => {
    console.log('🔧 [ERROR_HANDLER] 복구 전략 생성');

    const { isRecoverable, errorContext } = errorDetails;
    const recoverySteps: string[] = [];

    if (!isRecoverable) {
      recoverySteps.push('페이지 새로고침');
      recoverySteps.push('브라우저 재시작');
      recoverySteps.push('기술 지원팀 문의');
      return recoverySteps;
    }

    const { errorType } = errorContext;

    if (errorType === 'Error') {
      recoverySteps.push('에디터 상태 다시 로드');
      recoverySteps.push('작업 내용 수동 저장');
      recoverySteps.push('다시 시도');
    } else if (errorType === 'object') {
      recoverySteps.push('입력 데이터 검증');
      recoverySteps.push('기본값으로 초기화');
      recoverySteps.push('단계별 재시도');
    } else {
      recoverySteps.push('잠시 대기 후 재시도');
      recoverySteps.push('다른 브라우저에서 시도');
    }

    console.log('📊 [ERROR_HANDLER] 복구 전략:', recoverySteps);
    return recoverySteps;
  };

  return {
    generateErrorCode,
    extractErrorContext,
    determineErrorRecoverability: isRecoverable,
    createBridgeErrorDetails,
    handleExtractionError,
    handleTransformationError,
    handleValidationError,
    handleUpdateError,
    handleGeneralBridgeError: handleGeneralError,
    logErrorDetails,
    createRecoveryStrategy,
  };
};
