// bridges/editorMultiStepBridge/errorSystemManager.ts

import type { ErrorDetails, BridgeErrorContext } from './modernBridgeTypes';
import {
  extractErrorMessage,
  convertErrorToAllowedType,
  isValidString,
  getErrorSeverity,
  isRecoverableError as checkErrorRecoverability,
  createErrorContext as createBaseErrorContext,
} from '../common/errorHandlers';
import { logError, logWarn, logInfo, logDebug } from '../common/logger';

interface ErrorCategoryMapping {
  readonly category: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly isRecoverable: boolean;
  readonly keywords: readonly string[];
}

interface ErrorProcessingResult {
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly errorCategory: string;
  readonly errorSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly isRecoverable: boolean;
  readonly processingTimestamp: number;
}

interface BridgeErrorHandlerMethods {
  readonly handleTransferError: (errorSource: unknown) => ErrorDetails;
  readonly handleValidationError: (errorSource: unknown) => ErrorDetails;
  readonly handleExtractionError: (errorSource: unknown) => ErrorDetails;
  readonly handleTransformationError: (errorSource: unknown) => ErrorDetails;
  readonly handleUpdateError: (errorSource: unknown) => ErrorDetails;
  readonly handleReverseTransferError: (errorSource: unknown) => ErrorDetails;
  readonly handleBidirectionalSyncError: (errorSource: unknown) => ErrorDetails;
  readonly categorizeError: (errorSource: unknown) => string;
  readonly createErrorContext: (operationName: string) => BridgeErrorContext;
  readonly isRecoverableError: (errorSource: unknown) => boolean;
  readonly getErrorSeverity: (
    errorSource: unknown
  ) => 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

function createErrorCategoryMappings(): Map<string, ErrorCategoryMapping> {
  const errorCategoryArray: readonly ErrorCategoryMapping[] = [
    {
      category: 'CRITICAL_SYSTEM',
      severity: 'CRITICAL',
      isRecoverable: false,
      keywords: ['critical', 'fatal', 'system', 'crash', 'corruption'],
    },
    {
      category: 'HIGH_OPERATION',
      severity: 'HIGH',
      isRecoverable: true,
      keywords: ['error', 'failed', 'exception', 'abort', 'rejected'],
    },
    {
      category: 'MEDIUM_VALIDATION',
      severity: 'MEDIUM',
      isRecoverable: true,
      keywords: ['warning', 'deprecated', 'invalid', 'missing', 'incomplete'],
    },
    {
      category: 'NETWORK_RELATED',
      severity: 'MEDIUM',
      isRecoverable: true,
      keywords: ['network', 'timeout', 'connection', 'fetch', 'request'],
    },
    {
      category: 'PERMISSION_DENIED',
      severity: 'HIGH',
      isRecoverable: false,
      keywords: ['permission', 'unauthorized', 'forbidden', 'access', 'denied'],
    },
    {
      category: 'DATA_PROCESSING',
      severity: 'MEDIUM',
      isRecoverable: true,
      keywords: ['parse', 'serialize', 'transform', 'convert', 'format'],
    },
    {
      category: 'BRIDGE_SPECIFIC',
      severity: 'HIGH',
      isRecoverable: true,
      keywords: ['bridge', 'transfer', 'sync', 'extraction', 'transformation'],
    },
  ];

  const errorCategoryMappingMap = new Map<string, ErrorCategoryMapping>();

  errorCategoryArray.forEach((categoryMapping) => {
    const { category } = categoryMapping;
    errorCategoryMappingMap.set(category, categoryMapping);

    logDebug(`에러 카테고리 매핑 등록: ${category}`, 'ERROR_CATEGORY_SETUP', {
      severity: categoryMapping.severity,
      keywordCount: categoryMapping.keywords.length,
    });
  });

  logInfo(`에러 카테고리 매핑 초기화 완료`, 'ERROR_CATEGORY_SETUP', {
    totalCategories: errorCategoryMappingMap.size,
  });

  return errorCategoryMappingMap;
}

function createKeywordSearchIndex(): Map<string, string> {
  const categoryMappings = createErrorCategoryMappings();
  const keywordToCategoryMap = new Map<string, string>();

  for (const [categoryName, categoryMapping] of categoryMappings) {
    const { keywords } = categoryMapping;

    keywords.forEach((keyword) => {
      const existingCategory = keywordToCategoryMap.get(keyword);

      if (existingCategory) {
        logWarn(`키워드 중복 발견: ${keyword}`, 'KEYWORD_INDEX_SETUP', {
          existingCategory,
          newCategory: categoryName,
        });
        return;
      }

      keywordToCategoryMap.set(keyword, categoryName);
    });
  }

  logInfo(`키워드 검색 인덱스 초기화 완료`, 'KEYWORD_INDEX_SETUP', {
    totalKeywords: keywordToCategoryMap.size,
  });

  return keywordToCategoryMap;
}

function extractSafeErrorMessageFromSource(errorSource: unknown): string {
  try {
    const convertedError = convertErrorToAllowedType(errorSource);
    const extractedMessage = extractErrorMessage(convertedError);

    const isValidMessage = isValidString(extractedMessage);
    if (!isValidMessage) {
      logWarn(
        '에러 메시지 추출 실패 - 기본값 사용',
        'ERROR_MESSAGE_EXTRACTION',
        { errorType: typeof errorSource }
      );
      return 'Unknown error occurred';
    }

    const trimmedMessage = extractedMessage.trim();
    const hasContent = trimmedMessage.length > 0;

    return hasContent ? trimmedMessage : 'Empty error message';
  } catch (extractionError) {
    logError('에러 메시지 추출 중 예외 발생', 'ERROR_MESSAGE_EXTRACTION', {
      extractionError,
    });
    return 'Error message extraction failed';
  }
}

function categorizeErrorByKeywordMatching(errorMessage: string): string {
  const keywordSearchIndex = createKeywordSearchIndex();
  const lowercaseMessage = errorMessage.toLowerCase();

  logDebug('키워드 매칭 에러 분류 시작', 'ERROR_CATEGORIZATION', {
    messageLength: errorMessage.length,
  });

  for (const [keyword, categoryName] of keywordSearchIndex) {
    const hasKeywordMatch = lowercaseMessage.includes(keyword.toLowerCase());

    if (hasKeywordMatch) {
      logInfo(
        `키워드 매칭 성공: ${keyword} → ${categoryName}`,
        'ERROR_CATEGORIZATION',
        { keyword, category: categoryName }
      );
      return categoryName;
    }
  }

  logInfo('키워드 매칭 실패 - 기본 카테고리 사용', 'ERROR_CATEGORIZATION', {
    defaultCategory: 'UNKNOWN_ERROR',
  });

  return 'UNKNOWN_ERROR';
}

function processErrorInformation(errorSource: unknown): ErrorProcessingResult {
  const processingStartTime = Date.now();

  logDebug('에러 정보 처리 시작', 'ERROR_PROCESSING', {
    errorType: typeof errorSource,
  });

  const errorMessage = extractSafeErrorMessageFromSource(errorSource);
  const errorCategory = categorizeErrorByKeywordMatching(errorMessage);
  const errorSeverity = getErrorSeverity(errorSource);
  const isRecoverable = checkErrorRecoverability(errorSource);

  const errorCodePrefix = errorCategory.replace('_', '-');
  const timestampSuffix = processingStartTime.toString().slice(-6);
  const errorCode = `${errorCodePrefix}-${timestampSuffix}`;

  const processingResult: ErrorProcessingResult = {
    errorCode,
    errorMessage,
    errorCategory,
    errorSeverity,
    isRecoverable,
    processingTimestamp: processingStartTime,
  };

  logInfo('에러 정보 처리 완료', 'ERROR_PROCESSING', {
    errorCode,
    category: errorCategory,
    severity: errorSeverity,
    isRecoverable,
  });

  return processingResult;
}

function createBridgeErrorContextFromOperation(
  operationName: string
): BridgeErrorContext {
  const contextTimestamp = Date.now();
  const baseErrorContext = createBaseErrorContext(operationName);

  const contextualDataMap = new Map<string, string | number | boolean | null>();
  contextualDataMap.set('operationType', 'BRIDGE_OPERATION');
  contextualDataMap.set('contextCreatedAt', contextTimestamp);
  contextualDataMap.set('operationName', operationName);

  const errorMetadataMap = new Map<string, unknown>();
  errorMetadataMap.set('contextVersion', '2.0');
  errorMetadataMap.set('createdBy', 'createBridgeErrorContextFromOperation');

  baseErrorContext.forEach((value, key) => {
    errorMetadataMap.set(key, value);
  });

  const bridgeErrorContext: BridgeErrorContext = {
    contextIdentifier: operationName,
    originalErrorSource: null,
    errorTimestamp: contextTimestamp,
    contextualData: contextualDataMap,
    errorMetadata: errorMetadataMap,
    errorSeverityLevel: 'LOW',
    isRecoverableError: true,
  };

  logDebug('브릿지 에러 컨텍스트 생성 완료', 'ERROR_CONTEXT_CREATION', {
    operationName,
    contextId: operationName,
  });

  return bridgeErrorContext;
}

function createDetailedErrorFromProcessingResult(
  processingResult: ErrorProcessingResult,
  operationName: string,
  originalErrorSource: unknown
): ErrorDetails {
  const {
    errorCode,
    errorMessage,
    errorCategory,
    errorSeverity,
    isRecoverable,
    processingTimestamp,
  } = processingResult;

  const errorContext = createBridgeErrorContextFromOperation(operationName);
  const enhancedErrorContext: BridgeErrorContext = {
    ...errorContext,
    originalErrorSource: convertErrorToAllowedType(originalErrorSource),
    errorSeverityLevel: errorSeverity,
    isRecoverableError: isRecoverable,
  };

  const recoveryStrategiesSet = new Set<string>();

  if (isRecoverable) {
    recoveryStrategiesSet.add('RETRY_OPERATION');
    recoveryStrategiesSet.add('FALLBACK_EXECUTION');
    recoveryStrategiesSet.add('USER_INTERVENTION');
  }

  const maxRetryAttempts = isRecoverable ? 3 : 0;

  const errorDetails: ErrorDetails = {
    errorCode,
    errorMessage,
    errorTimestamp: new Date(processingTimestamp),
    errorContext: enhancedErrorContext,
    isRecoverable,
    errorSeverity,
    recoveryAttempts: 0,
    maxRecoveryAttempts: maxRetryAttempts,
    recoveryStrategies: recoveryStrategiesSet,
  };

  logInfo('상세 에러 정보 생성 완료', 'ERROR_DETAILS_CREATION', {
    errorCode,
    category: errorCategory,
    severity: errorSeverity,
    isRecoverable,
    operation: operationName,
  });

  return errorDetails;
}

function createSpecificOperationErrorHandler(operationName: string) {
  return function handleSpecificOperationError(
    errorSource: unknown
  ): ErrorDetails {
    logDebug(`${operationName} 에러 처리 시작`, 'SPECIFIC_ERROR_HANDLER', {
      operation: operationName,
    });

    const processingResult = processErrorInformation(errorSource);
    const errorDetails = createDetailedErrorFromProcessingResult(
      processingResult,
      operationName,
      errorSource
    );

    logInfo(`${operationName} 에러 처리 완료`, 'SPECIFIC_ERROR_HANDLER', {
      operation: operationName,
      errorCode: errorDetails.errorCode,
      severity: errorDetails.errorSeverity,
    });

    return errorDetails;
  };
}

export function createBridgeErrorHandler(): BridgeErrorHandlerMethods {
  logInfo('브릿지 에러 핸들러 생성 시작', 'ERROR_HANDLER_FACTORY');

  const handleTransferError = createSpecificOperationErrorHandler('TRANSFER');
  const handleValidationError =
    createSpecificOperationErrorHandler('VALIDATION');
  const handleExtractionError =
    createSpecificOperationErrorHandler('EXTRACTION');
  const handleTransformationError =
    createSpecificOperationErrorHandler('TRANSFORMATION');
  const handleUpdateError = createSpecificOperationErrorHandler('UPDATE');
  const handleReverseTransferError =
    createSpecificOperationErrorHandler('REVERSE_TRANSFER');
  const handleBidirectionalSyncError =
    createSpecificOperationErrorHandler('BIDIRECTIONAL_SYNC');

  function categorizeError(errorSource: unknown): string {
    logDebug('에러 분류 요청', 'ERROR_CATEGORIZATION');

    const errorMessage = extractSafeErrorMessageFromSource(errorSource);
    const category = categorizeErrorByKeywordMatching(errorMessage);

    logInfo('에러 분류 완료', 'ERROR_CATEGORIZATION', {
      category,
      messagePreview: errorMessage.substring(0, 50),
    });

    return category;
  }

  function createErrorContext(operationName: string): BridgeErrorContext {
    logDebug('에러 컨텍스트 생성 요청', 'ERROR_CONTEXT_CREATION', {
      operation: operationName,
    });

    const errorContext = createBridgeErrorContextFromOperation(operationName);

    logInfo('에러 컨텍스트 생성 완료', 'ERROR_CONTEXT_CREATION', {
      operation: operationName,
      contextId: errorContext.contextIdentifier,
    });

    return errorContext;
  }

  function isRecoverableError(errorSource: unknown): boolean {
    logDebug('에러 복구 가능성 검사 요청', 'ERROR_RECOVERY_CHECK');

    const isRecoverable = checkErrorRecoverability(errorSource);

    logInfo('에러 복구 가능성 검사 완료', 'ERROR_RECOVERY_CHECK', {
      isRecoverable,
    });

    return isRecoverable;
  }

  function getErrorSeverityLevel(
    errorSource: unknown
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    logDebug('에러 심각도 평가 요청', 'ERROR_SEVERITY_EVALUATION');

    const severity = getErrorSeverity(errorSource);

    logInfo('에러 심각도 평가 완료', 'ERROR_SEVERITY_EVALUATION', { severity });

    return severity;
  }

  const bridgeErrorHandlerMethods: BridgeErrorHandlerMethods = {
    handleTransferError,
    handleValidationError,
    handleExtractionError,
    handleTransformationError,
    handleUpdateError,
    handleReverseTransferError,
    handleBidirectionalSyncError,
    categorizeError,
    createErrorContext,
    isRecoverableError,
    getErrorSeverity: getErrorSeverityLevel,
  };

  logInfo('브릿지 에러 핸들러 생성 완료', 'ERROR_HANDLER_FACTORY', {
    totalMethods: Object.keys(bridgeErrorHandlerMethods).length,
    availableMethods: Object.keys(bridgeErrorHandlerMethods),
  });

  return bridgeErrorHandlerMethods;
}
