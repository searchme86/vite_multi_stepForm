import { BridgeOperationErrorDetails } from './bridgeTypes';

//====여기부터 수정됨====
// 브릿지 시스템의 오류를 체계적으로 처리하는 핸들러 생성 함수
// 모든 종류의 오류를 표준화된 형식으로 변환하여 일관된 오류 처리 제공
export const createBridgeErrorManagementHandler = () => {
  // 고유한 오류 식별 코드를 생성하는 함수
  // 오류 추적과 디버깅을 위한 유니크한 ID 제공
  const generateUniqueErrorIdentificationCode = (
    errorType: string,
    timestamp: number
  ): string => {
    // 타임스탬프를 36진수로 변환하여 압축된 시간 정보 생성
    const compressedTimeString = timestamp.toString(36);
    // 랜덤 문자열 생성으로 충돌 방지
    const randomIdentifierString = Math.random().toString(36).substring(2, 8);
    // 표준화된 형식으로 오류 코드 구성
    return `BRIDGE_${errorType}_${compressedTimeString}_${randomIdentifierString}`.toUpperCase();
  };

  // 오류 발생 당시의 환경 정보를 추출하는 함수
  // 디버깅과 문제 재현을 위한 컨텍스트 정보 수집
  const extractComprehensiveErrorContext = (
    error: unknown
  ): Record<string, unknown> => {
    console.log('🔍 [ERROR_HANDLER] 오류 컨텍스트 추출 시작');

    const errorContextInformation: Record<string, unknown> = {};

    // 표준 Error 객체인 경우 상세 정보 추출
    if (error instanceof Error) {
      const { name, message, stack } = error;
      errorContextInformation.errorName = name; // 오류 타입명
      errorContextInformation.errorMessage = message; // 오류 메시지
      errorContextInformation.errorStack = stack; // 스택 트레이스
      errorContextInformation.errorType = 'Error'; // 오류 분류
    }
    // 문자열 오류인 경우 처리
    else if (typeof error === 'string') {
      errorContextInformation.errorMessage = error;
      errorContextInformation.errorType = 'string';
    }
    // 객체 형태 오류인 경우 처리
    else if (typeof error === 'object' && error !== null) {
      errorContextInformation.errorObject = error;
      errorContextInformation.errorType = 'object';
    }
    // 기타 타입 오류인 경우 처리
    else {
      errorContextInformation.errorValue = error;
      errorContextInformation.errorType = typeof error;
    }

    // 브라우저 환경 정보 수집
    errorContextInformation.userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    errorContextInformation.timestamp = Date.now(); // 정확한 발생 시각
    errorContextInformation.url =
      typeof window !== 'undefined' ? window.location.href : 'unknown';

    console.log('📊 [ERROR_HANDLER] 추출된 컨텍스트:', errorContextInformation);
    return errorContextInformation;
  };

  // 오류의 복구 가능성을 판단하는 함수
  // 자동 재시도나 대체 방안 적용 여부를 결정
  const analyzeErrorRecoverabilityPotential = (error: unknown): boolean => {
    console.log('🔍 [ERROR_HANDLER] 오류 복구 가능성 판단 시작');

    // 타입 오류는 일반적으로 복구 불가능
    if (error instanceof TypeError) {
      console.log('📊 [ERROR_HANDLER] TypeError 감지 - 복구 어려움');
      return false;
    }

    // 참조 오류는 일반적으로 복구 불가능
    if (error instanceof ReferenceError) {
      console.log('📊 [ERROR_HANDLER] ReferenceError 감지 - 복구 어려움');
      return false;
    }

    // 구문 오류는 일반적으로 복구 불가능
    if (error instanceof SyntaxError) {
      console.log('📊 [ERROR_HANDLER] SyntaxError 감지 - 복구 어려움');
      return false;
    }

    // 문자열 오류 메시지에서 치명적 키워드 검사
    if (typeof error === 'string') {
      const normalizedErrorMessage = error.toLowerCase();
      const criticalErrorIndicatorKeywords = [
        'fatal', // 치명적 오류
        'critical', // 심각한 오류
        'system', // 시스템 오류
        'memory', // 메모리 오류
        'security', // 보안 오류
      ];

      const containsCriticalKeyword = criticalErrorIndicatorKeywords.some(
        (keyword) => normalizedErrorMessage.includes(keyword)
      );

      if (containsCriticalKeyword) {
        console.log('📊 [ERROR_HANDLER] 치명적 키워드 감지 - 복구 어려움');
        return false;
      }
    }

    console.log('📊 [ERROR_HANDLER] 복구 가능한 오류로 판단');
    return true;
  };

  // 브릿지 오류 상세 정보를 생성하는 핵심 함수
  // 모든 오류를 표준화된 BridgeOperationErrorDetails 형식으로 변환
  const createStandardizedBridgeErrorDetails = (
    error: unknown,
    errorClassification: string = 'UNKNOWN'
  ): BridgeOperationErrorDetails => {
    console.log('🔧 [ERROR_HANDLER] 브릿지 오류 상세 정보 생성 시작');

    const currentTimestamp = Date.now();
    const uniqueErrorCode = generateUniqueErrorIdentificationCode(
      errorClassification,
      currentTimestamp
    );
    const comprehensiveErrorContext = extractComprehensiveErrorContext(error);
    const isRecoverableError = analyzeErrorRecoverabilityPotential(error);

    // 오류 메시지 추출 및 표준화
    let userFriendlyErrorMessage = '알 수 없는 오류가 발생했습니다';

    if (error instanceof Error) {
      const { message } = error;
      userFriendlyErrorMessage = message || userFriendlyErrorMessage;
    } else if (typeof error === 'string') {
      userFriendlyErrorMessage = error;
    } else if (typeof error === 'object' && error !== null) {
      const errorObject = error;
      const serializedObjectString = JSON.stringify(errorObject);
      userFriendlyErrorMessage = `객체 오류: ${serializedObjectString}`;
    }

    // 표준화된 오류 상세 정보 구성
    const standardizedErrorDetails: BridgeOperationErrorDetails = {
      errorCode: uniqueErrorCode,
      errorMessage: userFriendlyErrorMessage,
      errorTimestamp: new Date(currentTimestamp),
      errorContext: comprehensiveErrorContext,
      isRecoverable: isRecoverableError,
    };

    console.log('✅ [ERROR_HANDLER] 오류 상세 정보 생성 완료:', {
      errorCode: uniqueErrorCode,
      errorMessage: userFriendlyErrorMessage.substring(0, 100), // 로그용 메시지 축약
      isRecoverable: isRecoverableError,
      contextKeys: Object.keys(comprehensiveErrorContext),
    });

    return standardizedErrorDetails;
  };

  // 에디터 상태 추출 과정에서 발생한 오류를 처리하는 함수
  const handleEditorDataExtractionError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 추출 오류 처리 시작');
    return createStandardizedBridgeErrorDetails(error, 'EXTRACTION');
  };

  // 데이터 변환 과정에서 발생한 오류를 처리하는 함수
  const handleDataTransformationProcessError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 변환 오류 처리 시작');
    return createStandardizedBridgeErrorDetails(error, 'TRANSFORMATION');
  };

  // 데이터 검증 과정에서 발생한 오류를 처리하는 함수
  const handleDataValidationProcessError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 검증 오류 처리 시작');
    return createStandardizedBridgeErrorDetails(error, 'VALIDATION');
  };

  // 상태 업데이트 과정에서 발생한 오류를 처리하는 함수
  const handleStateUpdateProcessError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 업데이트 오류 처리 시작');
    return createStandardizedBridgeErrorDetails(error, 'UPDATE');
  };

  // 일반적인 브릿지 오류를 처리하는 함수
  const handleGeneralBridgeSystemError = (
    error: unknown
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 일반 브릿지 오류 처리 시작');
    return createStandardizedBridgeErrorDetails(error, 'GENERAL');
  };

  // 오류 상세 정보를 콘솔에 구조화된 형태로 출력하는 함수
  const logStructuredErrorDetails = (
    errorDetails: BridgeOperationErrorDetails
  ): void => {
    const {
      errorCode,
      errorMessage,
      errorTimestamp,
      isRecoverable,
      errorContext,
    } = errorDetails;

    // 구조화된 로그 출력으로 가독성 향상
    console.group(`❌ [ERROR_HANDLER] 오류 상세 로그 - ${errorCode}`);
    console.error('오류 메시지:', errorMessage);
    console.error('발생 시각:', errorTimestamp.toISOString());
    console.error('복구 가능:', isRecoverable);
    console.error('오류 컨텍스트:', errorContext);
    console.groupEnd();
  };

  // 오류 복구 전략을 수립하는 함수
  // 사용자에게 구체적인 해결 방법 제시
  const formulateErrorRecoveryStrategy = (
    errorDetails: BridgeOperationErrorDetails
  ): string[] => {
    console.log('🔧 [ERROR_HANDLER] 복구 전략 생성 시작');

    const { isRecoverable, errorContext } = errorDetails;
    const recoveryActionSteps: string[] = [];

    // 복구 불가능한 오류의 경우 근본적인 해결책 제시
    if (!isRecoverable) {
      recoveryActionSteps.push('페이지 새로고침');
      recoveryActionSteps.push('브라우저 재시작');
      recoveryActionSteps.push('기술 지원팀 문의');
      return recoveryActionSteps;
    }

    // 오류 타입에 따른 맞춤형 복구 전략
    const { errorType } = errorContext;

    if (errorType === 'Error') {
      recoveryActionSteps.push('에디터 상태 다시 로드');
      recoveryActionSteps.push('작업 내용 수동 저장');
      recoveryActionSteps.push('다시 시도');
    } else if (errorType === 'object') {
      recoveryActionSteps.push('입력 데이터 검증');
      recoveryActionSteps.push('기본값으로 초기화');
      recoveryActionSteps.push('단계별 재시도');
    } else {
      recoveryActionSteps.push('잠시 대기 후 재시도');
      recoveryActionSteps.push('다른 브라우저에서 시도');
    }

    console.log('📊 [ERROR_HANDLER] 생성된 복구 전략:', recoveryActionSteps);
    return recoveryActionSteps;
  };

  return {
    generateErrorCode: generateUniqueErrorIdentificationCode,
    extractErrorContext: extractComprehensiveErrorContext,
    determineErrorRecoverability: analyzeErrorRecoverabilityPotential,
    createBridgeErrorDetails: createStandardizedBridgeErrorDetails,
    handleExtractionError: handleEditorDataExtractionError,
    handleTransformationError: handleDataTransformationProcessError,
    handleValidationError: handleDataValidationProcessError,
    handleUpdateError: handleStateUpdateProcessError,
    handleGeneralBridgeError: handleGeneralBridgeSystemError,
    logErrorDetails: logStructuredErrorDetails,
    createRecoveryStrategy: formulateErrorRecoveryStrategy,
  };
};
//====여기까지 수정됨====
