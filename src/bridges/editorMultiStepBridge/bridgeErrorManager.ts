// bridges/editorMultiStepBridge/bridgeErrorManager.ts

import {
  BridgeOperationErrorDetails,
  BridgeErrorContext,
} from './bridgeDataTypes';

type AllowedErrorType = string | number | boolean | object | null | undefined;

interface ErrorMessageObject {
  readonly message: string;
  readonly [key: string]: string | number | boolean | null | undefined;
}

interface ObjectWithStringProperties {
  readonly [key: string]: string | number | boolean | null | undefined;
}

type ErrorSeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const CRITICAL_ERROR_KEYWORD_SET = new Set([
  'critical',
  'fatal',
  'system',
  'crash',
]);

const HIGH_ERROR_KEYWORD_SET = new Set([
  'error',
  'failed',
  'exception',
  'abort',
]);

const MEDIUM_ERROR_KEYWORD_SET = new Set(['warning', 'deprecated', 'invalid']);

const NETWORK_ERROR_KEYWORD_SET = new Set([
  'network',
  'timeout',
  'connection',
  'fetch',
  'request',
]);

const PERMISSION_ERROR_KEYWORD_SET = new Set([
  'permission',
  'unauthorized',
  'forbidden',
  'access',
]);

function createPropertyValidationModule() {
  const hasValidMessageProperty = (
    targetObject: ObjectWithStringProperties,
    propertyName: string
  ): boolean => {
    const hasProperty = propertyName in targetObject;
    if (!hasProperty) {
      return false;
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty.call(
      targetObject,
      propertyName
    );
    if (!hasOwnProperty) {
      return false;
    }

    const propertyValue = targetObject[propertyName];
    const isNullOrUndefined =
      propertyValue === null || propertyValue === undefined;
    if (isNullOrUndefined) {
      return false;
    }

    const isStringType = typeof propertyValue === 'string';
    if (!isStringType) {
      return false;
    }

    const stringPropertyValue = propertyValue;
    const isEmptyString = stringPropertyValue.trim().length === 0;
    if (isEmptyString) {
      return false;
    }

    return true;
  };

  return { hasValidMessageProperty };
}

function createErrorTypeGuardModule() {
  const { hasValidMessageProperty } = createPropertyValidationModule();

  const isValidObjectWithStringProperties = (
    candidateObject: AllowedErrorType
  ): candidateObject is ObjectWithStringProperties => {
    const isNullValue = candidateObject === null;
    if (isNullValue) {
      return false;
    }

    const isUndefinedValue = candidateObject === undefined;
    if (isUndefinedValue) {
      return false;
    }

    const isObjectType = typeof candidateObject === 'object';
    if (!isObjectType) {
      return false;
    }

    const isArrayType = Array.isArray(candidateObject);
    if (isArrayType) {
      return false;
    }

    return true;
  };

  const isErrorObjectWithMessage = (
    candidateErrorObject: AllowedErrorType
  ): candidateErrorObject is ErrorMessageObject => {
    const isValidObject =
      isValidObjectWithStringProperties(candidateErrorObject);
    if (!isValidObject) {
      return false;
    }

    const validErrorObject = candidateErrorObject;
    const hasValidMessage = hasValidMessageProperty(
      validErrorObject,
      'message'
    );

    return hasValidMessage;
  };

  return {
    isValidObjectWithStringProperties,
    isErrorObjectWithMessage,
  };
}

function createErrorConversionModule() {
  const { isErrorObjectWithMessage } = createErrorTypeGuardModule();

  const convertToAllowedErrorType = (
    originalErrorSource: unknown
  ): AllowedErrorType => {
    const isNullValue = originalErrorSource === null;
    if (isNullValue) {
      return null;
    }

    const isUndefinedValue = originalErrorSource === undefined;
    if (isUndefinedValue) {
      return undefined;
    }

    const errorSourceType = typeof originalErrorSource;
    const isStringType = errorSourceType === 'string';
    if (isStringType) {
      return originalErrorSource;
    }

    const isNumberType = errorSourceType === 'number';
    if (isNumberType) {
      return originalErrorSource;
    }

    const isBooleanType = errorSourceType === 'boolean';
    if (isBooleanType) {
      return originalErrorSource;
    }

    const isObjectType = errorSourceType === 'object';
    if (isObjectType) {
      return originalErrorSource;
    }

    try {
      const convertedStringValue = String(originalErrorSource);
      return convertedStringValue;
    } catch (conversionError) {
      console.error('❌ [ERROR_MANAGER] 변환 실패:', conversionError);
      return 'Unknown error type';
    }
  };

  const extractSafeErrorMessage = (errorSource: AllowedErrorType): string => {
    console.log('🔍 [ERROR_MANAGER] 안전한 에러 메시지 추출 시작');

    const isErrorMessageObject = isErrorObjectWithMessage(errorSource);
    if (isErrorMessageObject) {
      console.log('✅ [ERROR_MANAGER] 에러 메시지 객체에서 추출');
      return errorSource.message;
    }

    const isNativeErrorInstance = errorSource instanceof Error;
    const convertedMessage = isNativeErrorInstance
      ? errorSource.message
      : String(errorSource);

    console.log('✅ [ERROR_MANAGER] 문자열 변환하여 추출');
    return convertedMessage;
  };

  return {
    convertToAllowedErrorType,
    extractSafeErrorMessage,
  };
}

function createKeywordMatchingModule() {
  const hasKeywordMatch = (
    messageText: string,
    keywordSet: Set<string>
  ): boolean => {
    const lowercaseMessage = messageText.toLowerCase();
    const keywordArray = Array.from(keywordSet);

    return keywordArray.some((keyword) => lowercaseMessage.includes(keyword));
  };

  return { hasKeywordMatch };
}

function createErrorClassificationModule() {
  const { isErrorObjectWithMessage } = createErrorTypeGuardModule();
  const { hasKeywordMatch } = createKeywordMatchingModule();

  const evaluateErrorSeverity = (
    errorSource: AllowedErrorType
  ): ErrorSeverityLevel => {
    console.log('🔍 [ERROR_CLASSIFIER] 에러 심각도 평가 시작');

    const isErrorMessageObject = isErrorObjectWithMessage(errorSource);
    if (!isErrorMessageObject) {
      console.log('✅ [ERROR_CLASSIFIER] 메시지 객체 아님 - LOW 심각도');
      return 'LOW';
    }

    const { message: errorMessage = '' } = errorSource;

    const hasCriticalKeyword = hasKeywordMatch(
      errorMessage,
      CRITICAL_ERROR_KEYWORD_SET
    );
    if (hasCriticalKeyword) {
      console.log('🚨 [ERROR_CLASSIFIER] 치명적 에러 - CRITICAL 심각도');
      return 'CRITICAL';
    }

    const hasHighKeyword = hasKeywordMatch(
      errorMessage,
      HIGH_ERROR_KEYWORD_SET
    );
    if (hasHighKeyword) {
      console.log('⚠️ [ERROR_CLASSIFIER] 높은 수준 에러 - HIGH 심각도');
      return 'HIGH';
    }

    const hasMediumKeyword = hasKeywordMatch(
      errorMessage,
      MEDIUM_ERROR_KEYWORD_SET
    );
    const severityLevel = hasMediumKeyword ? 'MEDIUM' : 'LOW';

    console.log(`ℹ️ [ERROR_CLASSIFIER] ${severityLevel} 심각도`);
    return severityLevel;
  };

  const classifyErrorRecoverability = (
    errorSource: AllowedErrorType
  ): boolean => {
    console.log('🔍 [ERROR_CLASSIFIER] 에러 복구 가능성 분류 시작');

    const isErrorMessageObject = isErrorObjectWithMessage(errorSource);
    if (!isErrorMessageObject) {
      console.log(
        '✅ [ERROR_CLASSIFIER] 메시지 객체 아님 - 기본적으로 복구 가능'
      );
      return true;
    }

    const { message: errorMessage = '' } = errorSource;

    const hasNetworkKeyword = hasKeywordMatch(
      errorMessage,
      NETWORK_ERROR_KEYWORD_SET
    );
    if (hasNetworkKeyword) {
      console.log('✅ [ERROR_CLASSIFIER] 네트워크 에러 - 복구 가능');
      return true;
    }

    const hasPermissionKeyword = hasKeywordMatch(
      errorMessage,
      PERMISSION_ERROR_KEYWORD_SET
    );
    if (hasPermissionKeyword) {
      console.log('❌ [ERROR_CLASSIFIER] 권한 에러 - 복구 불가능');
      return false;
    }

    console.log('✅ [ERROR_CLASSIFIER] 기본값 - 복구 가능');
    return true;
  };

  return {
    evaluateErrorSeverity,
    classifyErrorRecoverability,
  };
}

function createErrorContextModule() {
  const createSafeBridgeErrorContext = (
    originalErrorSource: AllowedErrorType,
    contextIdentifier: string,
    timestampValue: number
  ): BridgeErrorContext => {
    console.log('🔍 [CONTEXT_BUILDER] 안전한 에러 컨텍스트 생성 시작');

    const additionalDataMap = new Map<
      string,
      string | number | boolean | null
    >();
    additionalDataMap.set('contextType', 'BRIDGE_ERROR');
    additionalDataMap.set('severity', 'UNKNOWN');
    additionalDataMap.set('timestamp', timestampValue);

    const errorMetadataMap = new Map<string, string | number | boolean>();
    errorMetadataMap.set('errorProcessedAt', new Date().toISOString());
    errorMetadataMap.set('errorProcessor', 'createSafeBridgeErrorContext');

    const safeErrorContext: BridgeErrorContext = {
      context: contextIdentifier,
      originalError: originalErrorSource,
      timestamp: timestampValue,
      additionalData: additionalDataMap,
      errorMetadata: errorMetadataMap,
    };

    console.log('✅ [CONTEXT_BUILDER] 에러 컨텍스트 생성 완료');
    return safeErrorContext;
  };

  return { createSafeBridgeErrorContext };
}

function createErrorDetailsModule() {
  const { extractSafeErrorMessage } = createErrorConversionModule();
  const { evaluateErrorSeverity, classifyErrorRecoverability } =
    createErrorClassificationModule();
  const { createSafeBridgeErrorContext } = createErrorContextModule();

  const createBridgeErrorDetails = (
    errorSource: AllowedErrorType,
    errorContextIdentifier = 'UNKNOWN'
  ): BridgeOperationErrorDetails => {
    console.log('🔍 [ERROR_BUILDER] 브릿지 에러 세부 정보 생성 시작');

    const extractedErrorMessage = extractSafeErrorMessage(errorSource);
    const currentTimestamp = Date.now();
    const generatedErrorCode = `BRIDGE_${errorContextIdentifier}_${currentTimestamp}`;

    const errorSeverityLevel = evaluateErrorSeverity(errorSource);
    const isRecoverableError = classifyErrorRecoverability(errorSource);

    const createdErrorContext = createSafeBridgeErrorContext(
      errorSource,
      errorContextIdentifier,
      currentTimestamp
    );

    const bridgeErrorDetails: BridgeOperationErrorDetails = {
      errorCode: generatedErrorCode,
      errorMessage: extractedErrorMessage,
      errorTimestamp: new Date(),
      errorContext: createdErrorContext,
      isRecoverable: isRecoverableError,
      errorSeverity: errorSeverityLevel,
    };

    console.log('✅ [ERROR_BUILDER] 브릿지 에러 세부 정보 생성 완료:', {
      errorCode: generatedErrorCode,
      severity: errorSeverityLevel,
      isRecoverable: isRecoverableError,
      messageLength: extractedErrorMessage.length,
    });

    return bridgeErrorDetails;
  };

  return { createBridgeErrorDetails };
}

function createSpecificErrorHandlerModule() {
  const { createBridgeErrorDetails } = createErrorDetailsModule();

  const handleTransferError = (
    transferErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 전송 오류 처리 시작');
    const transferErrorDetails = createBridgeErrorDetails(
      transferErrorSource,
      'TRANSFER'
    );
    console.log('✅ [ERROR_HANDLER] 전송 오류 처리 완료');
    return transferErrorDetails;
  };

  const handleValidationError = (
    validationErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 검증 오류 처리 시작');
    const validationErrorDetails = createBridgeErrorDetails(
      validationErrorSource,
      'VALIDATION'
    );
    console.log('✅ [ERROR_HANDLER] 검증 오류 처리 완료');
    return validationErrorDetails;
  };

  const handleExtractionError = (
    extractionErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 추출 오류 처리 시작');
    const extractionErrorDetails = createBridgeErrorDetails(
      extractionErrorSource,
      'EXTRACTION'
    );
    console.log('✅ [ERROR_HANDLER] 추출 오류 처리 완료');
    return extractionErrorDetails;
  };

  const handleTransformationError = (
    transformationErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 변환 오류 처리 시작');
    const transformationErrorDetails = createBridgeErrorDetails(
      transformationErrorSource,
      'TRANSFORMATION'
    );
    console.log('✅ [ERROR_HANDLER] 변환 오류 처리 완료');
    return transformationErrorDetails;
  };

  const handleUpdateError = (
    updateErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 업데이트 오류 처리 시작');
    const updateErrorDetails = createBridgeErrorDetails(
      updateErrorSource,
      'UPDATE'
    );
    console.log('✅ [ERROR_HANDLER] 업데이트 오류 처리 완료');
    return updateErrorDetails;
  };

  const handleReverseTransferError = (
    reverseTransferErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 역방향 전송 오류 처리 시작');
    const reverseTransferErrorDetails = createBridgeErrorDetails(
      reverseTransferErrorSource,
      'REVERSE_TRANSFER'
    );
    console.log('✅ [ERROR_HANDLER] 역방향 전송 오류 처리 완료');
    return reverseTransferErrorDetails;
  };

  const handleBidirectionalSyncError = (
    bidirectionalSyncErrorSource: AllowedErrorType
  ): BridgeOperationErrorDetails => {
    console.log('❌ [ERROR_HANDLER] 양방향 동기화 오류 처리 시작');
    const bidirectionalSyncErrorDetails = createBridgeErrorDetails(
      bidirectionalSyncErrorSource,
      'BIDIRECTIONAL_SYNC'
    );
    console.log('✅ [ERROR_HANDLER] 양방향 동기화 오류 처리 완료');
    return bidirectionalSyncErrorDetails;
  };

  return {
    handleTransferError,
    handleValidationError,
    handleExtractionError,
    handleTransformationError,
    handleUpdateError,
    handleReverseTransferError,
    handleBidirectionalSyncError,
  };
}

export function createBridgeErrorHandler() {
  console.log('🔍 [MAIN_FACTORY] 브릿지 에러 핸들러 생성 시작');

  const { createBridgeErrorDetails } = createErrorDetailsModule();
  const { evaluateErrorSeverity, classifyErrorRecoverability } =
    createErrorClassificationModule();
  const specificErrorHandlerModule = createSpecificErrorHandlerModule();

  const {
    handleTransferError,
    handleValidationError,
    handleExtractionError,
    handleTransformationError,
    handleUpdateError,
    handleReverseTransferError,
    handleBidirectionalSyncError,
  } = specificErrorHandlerModule;

  const bridgeErrorHandlerInstance = {
    createBridgeErrorDetails,
    handleTransferError,
    handleValidationError,
    handleExtractionError,
    handleTransformationError,
    handleUpdateError,
    handleReverseTransferError,
    handleBidirectionalSyncError,
    classifyErrorRecoverability,
    evaluateErrorSeverity,
  };

  console.log('✅ [MAIN_FACTORY] 브릿지 에러 핸들러 생성 완료');
  return bridgeErrorHandlerInstance;
}
