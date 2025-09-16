// src/components/multiStepForm/utils/consoleLoggingUtils.ts

// 🔍 환경 감지
const isDevelopment = (): boolean => {
  try {
    const nodeEnv = typeof process !== 'undefined' && process.env?.NODE_ENV;
    const hostname = typeof window !== 'undefined' && window.location?.hostname;

    const isDev = typeof nodeEnv === 'string' && nodeEnv === 'development';
    const isLocalhost =
      typeof hostname === 'string' &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.local'));

    return isDev || isLocalhost;
  } catch {
    return false;
  }
};

const shouldLog = isDevelopment();

// 🔍 로깅 함수들
export const logValidationStart = (stepNumber: number): void => {
  if (shouldLog) {
    console.log(`✅ [STEP ${stepNumber}] 유효성 검사 시작`);
  }
};

export const logValidationSuccess = (
  stepNumber: number,
  fieldCount: number
): void => {
  if (shouldLog) {
    console.log(
      `✅ [STEP ${stepNumber}] 유효성 검사 성공 - 필드 수: ${fieldCount}`
    );
  }
};

export const logValidationFailure = (
  stepNumber: number,
  errorMessages: readonly string[]
): void => {
  if (shouldLog) {
    console.log(
      `❌ [STEP ${stepNumber}] 유효성 검사 실패 - 에러 수: ${errorMessages.length}`
    );
    if (errorMessages.length > 0) {
      console.log(`❌ 첫 번째 에러: ${errorMessages[0]}`);
    }
  }
};

export const logFieldProcessing = (
  stepNumber: number,
  fieldName: string,
  isValid: boolean
): void => {
  if (shouldLog) {
    console.log(
      `🔍 [STEP ${stepNumber}] 필드 처리: ${fieldName} -> ${
        isValid ? '성공' : '실패'
      }`
    );
  }
};

export const logEditorValidation = (
  isCompleted: boolean,
  contentLength: number
): void => {
  if (shouldLog) {
    console.log(
      `📝 에디터 검증: 완료=${isCompleted}, 내용길이=${contentLength}`
    );
  }
};

export const logDebugInfo = (
  stepNumber: number,
  message: string,
  data: Record<string, unknown>
): void => {
  if (shouldLog) {
    console.log(`🔧 [STEP ${stepNumber}] ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('🔧 디버그 데이터:', data);
    }
  }
};

// 🔍 검증 로거 생성
export const createValidationLogger = (stepNumber: number) => {
  return {
    logStart: (): void => logValidationStart(stepNumber),
    logSuccess: (fieldCount: number): void =>
      logValidationSuccess(stepNumber, fieldCount),
    logFailure: (errorMessages: readonly string[]): void =>
      logValidationFailure(stepNumber, errorMessages),
    logField: (fieldName: string, isValid: boolean): void =>
      logFieldProcessing(stepNumber, fieldName, isValid),
    logDebug: (message: string, data: Record<string, unknown>): void =>
      logDebugInfo(stepNumber, message, data),
  };
};
