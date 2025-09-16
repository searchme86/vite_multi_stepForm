// bridges/common/errorHandlers.ts

type AllowedErrorType = string | number | boolean | object | null | undefined;

interface ErrorExecutionContext {
  readonly operationName: string;
  readonly startTime: number;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
}

interface ErrorExecutionResult<T> {
  readonly success: boolean;
  readonly result: T;
  readonly error: string | null;
  readonly duration: number;
  readonly attempts: number;
}

interface RetryConfiguration {
  readonly maxRetries: number;
  readonly delayMs: number;
  readonly backoffMultiplier: number;
  readonly maxDelayMs: number;
}

const createDefaultRetryConfiguration = (): RetryConfiguration => ({
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 1.5,
  maxDelayMs: 10000,
});

const createErrorExecutionContext = (
  operationName: string,
  options: Partial<
    Omit<ErrorExecutionContext, 'operationName' | 'startTime'>
  > = {}
): ErrorExecutionContext => {
  const { timeoutMs, maxRetries, retryDelayMs } = options;

  return {
    operationName,
    startTime: performance.now(),
    timeoutMs,
    maxRetries,
    retryDelayMs,
  };
};

const createErrorExecutionResult = <T>(
  success: boolean,
  result: T,
  error: string | null,
  startTime: number,
  attempts: number = 1
): ErrorExecutionResult<T> => {
  const duration = performance.now() - startTime;

  return {
    success,
    result,
    error,
    duration,
    attempts,
  };
};

export const isValidString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value);
};

export const isValidBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isValidObject = (
  value: unknown
): value is Record<string, unknown> => {
  const isNullValue = value === null;
  const isUndefinedValue = value === undefined;
  const isArrayValue = Array.isArray(value);

  return (
    !isNullValue &&
    !isUndefinedValue &&
    !isArrayValue &&
    typeof value === 'object'
  );
};

export const extractErrorMessage = (errorSource: unknown): string => {
  console.log('🔍 [ERROR_HANDLERS] 에러 메시지 추출 시작:', typeof errorSource);

  const isErrorInstance = errorSource instanceof Error;
  if (isErrorInstance) {
    const { message: errorMessage } = errorSource;
    console.log('✅ [ERROR_HANDLERS] Error 인스턴스에서 메시지 추출');
    return errorMessage;
  }

  const isStringError = isValidString(errorSource);
  if (isStringError) {
    console.log('✅ [ERROR_HANDLERS] 문자열 에러 메시지 사용');
    return errorSource;
  }

  const isObjectError = isValidObject(errorSource);
  if (isObjectError) {
    const hasMessageProperty = 'message' in errorSource;
    if (hasMessageProperty) {
      const messageValue = Reflect.get(errorSource, 'message');
      const isValidMessageString = isValidString(messageValue);

      if (isValidMessageString) {
        console.log('✅ [ERROR_HANDLERS] 객체 message 속성에서 추출');
        return messageValue;
      }
    }
  }

  try {
    const convertedMessage = String(errorSource);
    console.log('✅ [ERROR_HANDLERS] String() 변환으로 메시지 생성');
    return convertedMessage;
  } catch (conversionError) {
    console.error(
      '❌ [ERROR_HANDLERS] 에러 메시지 변환 실패:',
      conversionError
    );
    return 'Unknown error occurred';
  }
};

const convertStringToAllowedType = (value: string): string => {
  console.log('✅ [ERROR_HANDLERS] 문자열 타입 반환');
  return value;
};

const convertNumberToAllowedType = (value: number): number => {
  console.log('✅ [ERROR_HANDLERS] 숫자 타입 반환');
  return value;
};

const convertBooleanToAllowedType = (value: boolean): boolean => {
  console.log('✅ [ERROR_HANDLERS] 불린 타입 반환');
  return value;
};

const convertObjectToAllowedType = (value: object): object => {
  console.log('✅ [ERROR_HANDLERS] 객체 타입 반환');
  return value;
};

export const convertErrorToAllowedType = (
  errorSource: unknown
): AllowedErrorType => {
  console.log('🔄 [ERROR_HANDLERS] 에러 타입 변환 시작:', typeof errorSource);

  const isNullValue = errorSource === null;
  if (isNullValue) {
    return null;
  }

  const isUndefinedValue = errorSource === undefined;
  if (isUndefinedValue) {
    return undefined;
  }

  const isStringValue = isValidString(errorSource);
  if (isStringValue) {
    return convertStringToAllowedType(errorSource);
  }

  const isNumberValue = isValidNumber(errorSource);
  if (isNumberValue) {
    return convertNumberToAllowedType(errorSource);
  }

  const isBooleanValue = isValidBoolean(errorSource);
  if (isBooleanValue) {
    return convertBooleanToAllowedType(errorSource);
  }

  const isObjectValue = isValidObject(errorSource);
  if (isObjectValue) {
    return convertObjectToAllowedType(errorSource);
  }

  try {
    const convertedValue = String(errorSource);
    console.log('✅ [ERROR_HANDLERS] 기타 타입을 문자열로 변환');
    return convertedValue;
  } catch (conversionError) {
    console.error('❌ [ERROR_HANDLERS] 타입 변환 실패:', conversionError);
    return 'Type conversion failed';
  }
};

export const safelyExecuteOperation = <T>(
  operation: () => T,
  fallbackValue: T,
  operationName: string
): T => {
  console.log(`🔄 [ERROR_HANDLERS] 안전 실행 시작: ${operationName}`);
  const context = createErrorExecutionContext(operationName);
  const { startTime } = context;

  try {
    const result = operation();
    const duration = performance.now() - startTime;

    console.log(
      `✅ [ERROR_HANDLERS] ${operationName} 성공 (${duration.toFixed(2)}ms)`
    );
    return result;
  } catch (operationError) {
    const errorMessage = extractErrorMessage(operationError);
    const duration = performance.now() - startTime;

    console.error(
      `❌ [ERROR_HANDLERS] ${operationName} 실패 (${duration.toFixed(2)}ms):`,
      errorMessage
    );
    return fallbackValue;
  }
};

export const safelyExecuteAsyncOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string
): Promise<T> => {
  console.log(`🔄 [ERROR_HANDLERS] 비동기 안전 실행 시작: ${operationName}`);
  const context = createErrorExecutionContext(operationName);
  const { startTime } = context;

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    console.log(
      `✅ [ERROR_HANDLERS] ${operationName} 비동기 성공 (${duration.toFixed(
        2
      )}ms)`
    );
    return result;
  } catch (asyncOperationError) {
    const errorMessage = extractErrorMessage(asyncOperationError);
    const duration = performance.now() - startTime;

    console.error(
      `❌ [ERROR_HANDLERS] ${operationName} 비동기 실패 (${duration.toFixed(
        2
      )}ms):`,
      errorMessage
    );
    return fallbackValue;
  }
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  console.log(`⏱️ [ERROR_HANDLERS] 타임아웃 설정: ${timeoutMs}ms`);

  const timeoutPromise = new Promise<never>((_, rejectTimeout) => {
    setTimeout(() => {
      console.error(`⏱️ [ERROR_HANDLERS] 타임아웃 발생: ${timeoutMessage}`);
      rejectTimeout(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  retryConfig: Partial<RetryConfiguration> = {}
): Promise<T> => {
  const config = { ...createDefaultRetryConfiguration(), ...retryConfig };
  const { maxRetries, delayMs, backoffMultiplier, maxDelayMs } = config;

  console.log(`🔄 [ERROR_HANDLERS] 재시도 시작 (최대 ${maxRetries}회)`);

  let lastError: Error = new Error('No attempts made');
  let currentDelay = delayMs;

  for (let attemptNumber = 1; attemptNumber <= maxRetries; attemptNumber++) {
    try {
      console.log(`🔄 [ERROR_HANDLERS] 시도 ${attemptNumber}/${maxRetries}`);
      const result = await operation();

      const isFirstAttempt = attemptNumber === 1;
      if (!isFirstAttempt) {
        console.log(`✅ [ERROR_HANDLERS] ${attemptNumber}번째 시도에서 성공`);
      }

      return result;
    } catch (attemptError) {
      const errorMessage = extractErrorMessage(attemptError);
      lastError =
        attemptError instanceof Error ? attemptError : new Error(errorMessage);

      const isLastAttempt = attemptNumber === maxRetries;
      if (isLastAttempt) {
        console.error(`❌ [ERROR_HANDLERS] 모든 재시도 실패 (${maxRetries}회)`);
        break;
      }

      console.warn(
        `⚠️ [ERROR_HANDLERS] 시도 ${attemptNumber} 실패, ${currentDelay}ms 후 재시도:`,
        errorMessage
      );

      await new Promise((resolveDelay) =>
        setTimeout(resolveDelay, currentDelay)
      );
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
};

export const executeWithFullErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  context: Partial<ErrorExecutionContext>,
  retryConfig?: Partial<RetryConfiguration>
): Promise<ErrorExecutionResult<T>> => {
  const { operationName = 'UNKNOWN_OPERATION', timeoutMs = 5000 } = context;
  const fullContext = createErrorExecutionContext(operationName, context);
  const { startTime } = fullContext;

  console.log(`🚀 [ERROR_HANDLERS] 완전 에러 처리 실행: ${operationName}`);

  try {
    const operationWithTimeout =
      timeoutMs > 0
        ? withTimeout(operation(), timeoutMs, `${operationName} 타임아웃`)
        : operation();

    const finalOperation = retryConfig
      ? withRetry(() => operationWithTimeout, retryConfig)
      : operationWithTimeout;

    const result = await finalOperation;

    return createErrorExecutionResult(true, result, null, startTime, 1);
  } catch (fullHandlingError) {
    const errorMessage = extractErrorMessage(fullHandlingError);

    console.error(
      `❌ [ERROR_HANDLERS] ${operationName} 완전 실패:`,
      errorMessage
    );

    return createErrorExecutionResult(
      false,
      fallbackValue,
      errorMessage,
      startTime,
      1
    );
  }
};

export const createErrorContext = (
  operationName: string,
  additionalData?: Record<string, unknown>
): Map<string, unknown> => {
  const errorContextMap = new Map<string, unknown>();

  errorContextMap.set('operationName', operationName);
  errorContextMap.set('timestamp', Date.now());
  errorContextMap.set(
    'userAgent',
    globalThis?.navigator?.userAgent ?? 'Unknown'
  );
  errorContextMap.set('url', globalThis?.location?.href ?? 'Unknown');

  const hasAdditionalData = additionalData && isValidObject(additionalData);
  if (hasAdditionalData) {
    Object.entries(additionalData).forEach(([dataKey, dataValue]) => {
      errorContextMap.set(dataKey, dataValue);
    });
  }

  console.log(`📊 [ERROR_HANDLERS] 에러 컨텍스트 생성: ${operationName}`);
  return errorContextMap;
};

export const logErrorWithContext = (
  errorSource: unknown,
  context: Map<string, unknown>
): void => {
  const errorMessage = extractErrorMessage(errorSource);
  const operationName = context.get('operationName') ?? 'UNKNOWN';
  const timestampValue = context.get('timestamp') ?? Date.now();

  const isValidTimestamp = isValidNumber(timestampValue);
  const safeTimestamp = isValidTimestamp ? timestampValue : Date.now();

  console.group(
    `❌ [ERROR_HANDLERS] ${operationName} - ${new Date(
      safeTimestamp
    ).toISOString()}`
  );
  console.error('에러 메시지:', errorMessage);
  console.error('에러 원본:', errorSource);
  console.table(Object.fromEntries(context));
  console.groupEnd();
};

export const handleErrorGracefully = <T>(
  errorSource: unknown,
  fallbackValue: T,
  operationName: string,
  additionalContext?: Record<string, unknown>
): T => {
  const errorContext = createErrorContext(operationName, additionalContext);
  logErrorWithContext(errorSource, errorContext);

  const errorMessage = extractErrorMessage(errorSource);
  console.warn(
    `⚠️ [ERROR_HANDLERS] ${operationName} - Fallback 값 사용:`,
    fallbackValue
  );

  return fallbackValue;
};

export const isRecoverableError = (errorSource: unknown): boolean => {
  const errorMessage = extractErrorMessage(errorSource);
  const lowerCaseMessage = errorMessage.toLowerCase();

  const networkErrorKeywords = [
    'network',
    'timeout',
    'connection',
    'fetch',
    'abort',
  ];
  const temporaryErrorKeywords = ['temporary', 'retry', 'busy', 'unavailable'];
  const recoverableErrorKeywords = [
    ...networkErrorKeywords,
    ...temporaryErrorKeywords,
  ];

  const hasRecoverableKeyword = recoverableErrorKeywords.some((keyword) =>
    lowerCaseMessage.includes(keyword)
  );

  const permanentErrorKeywords = [
    'permission',
    'unauthorized',
    'forbidden',
    'not found',
  ];
  const hasPermanentKeyword = permanentErrorKeywords.some((keyword) =>
    lowerCaseMessage.includes(keyword)
  );

  const isRecoverable = hasRecoverableKeyword && !hasPermanentKeyword;

  console.log(`🔍 [ERROR_HANDLERS] 복구 가능성 분석:`, {
    errorMessage: errorMessage.substring(0, 100),
    isRecoverable,
    hasRecoverableKeyword,
    hasPermanentKeyword,
  });

  return isRecoverable;
};

export const getErrorSeverity = (
  errorSource: unknown
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  const errorMessage = extractErrorMessage(errorSource);
  const lowerCaseMessage = errorMessage.toLowerCase();

  const criticalKeywords = ['critical', 'fatal', 'crash', 'corruption'];
  const highKeywords = ['error', 'failed', 'exception', 'abort'];
  const mediumKeywords = ['warning', 'deprecated', 'invalid'];

  const hasCriticalKeyword = criticalKeywords.some((keyword) =>
    lowerCaseMessage.includes(keyword)
  );

  if (hasCriticalKeyword) {
    return 'CRITICAL';
  }

  const hasHighKeyword = highKeywords.some((keyword) =>
    lowerCaseMessage.includes(keyword)
  );

  if (hasHighKeyword) {
    return 'HIGH';
  }

  const hasMediumKeyword = mediumKeywords.some((keyword) =>
    lowerCaseMessage.includes(keyword)
  );

  const severity = hasMediumKeyword ? 'MEDIUM' : 'LOW';

  console.log(`📊 [ERROR_HANDLERS] 에러 심각도 분석: ${severity}`);
  return severity;
};
