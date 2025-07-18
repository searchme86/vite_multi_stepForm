// src/components/multiStepForm/config/bridgeConfig.ts

import type { StepNumber } from '../types/stepTypes';

// 🔧 Bridge 트리거 조건 타입
type BridgeTriggerCondition =
  | 'step_enter' // 스텝 진입 시
  | 'step_exit' // 스텝 종료 시
  | 'editor_complete' // 에디터 완료 시
  | 'form_submit' // 폼 제출 시
  | 'manual_trigger' // 수동 트리거
  | 'auto_transfer'; // 자동 전송

// 🔧 Bridge 전송 모드 타입
type BridgeTransferMode =
  | 'forward' // Form → Bridge 단방향
  | 'reverse' // Bridge → Form 단방향
  | 'bidirectional'; // 양방향 동기화

// 🔧 Bridge 검증 모드 타입
type BridgeValidationMode =
  | 'strict' // 엄격한 검증
  | 'lenient' // 관대한 검증
  | 'permissive' // 허용적 검증
  | 'disabled'; // 검증 비활성화

// 🔧 Bridge 재시도 전략 타입
type BridgeRetryStrategy =
  | 'none' // 재시도 없음
  | 'exponential' // 지수 백오프
  | 'linear' // 선형 증가
  | 'fixed'; // 고정 간격

// 🔧 Bridge 로깅 레벨 타입
type BridgeLogLevel =
  | 'silent' // 로그 없음
  | 'error' // 에러만
  | 'warn' // 경고 이상
  | 'info' // 정보 이상
  | 'debug' // 모든 로그
  | 'verbose'; // 상세 로그

// 🔧 개별 스텝별 Bridge 설정
interface StepBridgeConfig {
  readonly enabled: boolean;
  readonly triggerConditions: readonly BridgeTriggerCondition[];
  readonly transferMode: BridgeTransferMode;
  readonly validationMode: BridgeValidationMode;
  readonly autoTransferEnabled: boolean;
  readonly autoTransferDelay: number;
  readonly requireUserConfirmation: boolean;
  readonly validationFields: readonly string[];
  readonly customValidators: readonly string[];
}

// 🔧 Bridge 재시도 설정
interface BridgeRetryConfig {
  readonly enabled: boolean;
  readonly strategy: BridgeRetryStrategy;
  readonly maxAttempts: number;
  readonly baseDelay: number;
  readonly maxDelay: number;
  readonly backoffMultiplier: number;
  readonly retryableErrors: readonly string[];
}

// 🔧 Bridge 로깅 설정
interface BridgeLoggingConfig {
  readonly enabled: boolean;
  readonly level: BridgeLogLevel;
  readonly includeTimestamp: boolean;
  readonly includeStackTrace: boolean;
  readonly includeFormData: boolean;
  readonly includeSystemInfo: boolean;
  readonly maxLogEntries: number;
  readonly logToConsole: boolean;
  readonly logToStorage: boolean;
}

// 🔧 Bridge 성능 설정
interface BridgePerformanceConfig {
  readonly enabled: boolean;
  readonly measureTransferTime: boolean;
  readonly measureValidationTime: boolean;
  readonly measureRenderTime: boolean;
  readonly performanceThresholds: {
    readonly transferWarningMs: number;
    readonly transferErrorMs: number;
    readonly validationWarningMs: number;
    readonly validationErrorMs: number;
  };
  readonly enablePerformanceMetrics: boolean;
  readonly metricsCollectionInterval: number;
}

// 🔧 Bridge 보안 설정
interface BridgeSecurityConfig {
  readonly enabled: boolean;
  readonly validateDataIntegrity: boolean;
  readonly sanitizeInputData: boolean;
  readonly sanitizeOutputData: boolean;
  readonly allowedDataTypes: readonly string[];
  readonly blockedDataTypes: readonly string[];
  readonly maxDataSize: number;
  readonly enableRateLimiting: boolean;
  readonly rateLimitRequests: number;
  readonly rateLimitWindowMs: number;
}

// 🔧 Bridge 캐시 설정
interface BridgeCacheConfig {
  readonly enabled: boolean;
  readonly cacheTransferResults: boolean;
  readonly cacheValidationResults: boolean;
  readonly cacheTtlMs: number;
  readonly maxCacheEntries: number;
  readonly enableCachePersistence: boolean;
  readonly cacheKeyStrategy: 'hash' | 'timestamp' | 'custom';
  readonly invalidateOnStepChange: boolean;
  readonly invalidateOnFormChange: boolean;
}

// 🔧 Bridge 에러 처리 설정
interface BridgeErrorHandlingConfig {
  readonly enabled: boolean;
  readonly enableAutoRecovery: boolean;
  readonly enableUserNotification: boolean;
  readonly enableErrorReporting: boolean;
  readonly errorNotificationDuration: number;
  readonly criticalErrorNotificationDuration: number;
  readonly enableFallbackMode: boolean;
  readonly fallbackData: Record<string, unknown>;
  readonly errorCategories: readonly string[];
}

// 🔧 메인 Bridge 설정 인터페이스
interface BridgeSystemConfig {
  readonly version: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly enabledFeatures: readonly string[];
  readonly globalSettings: {
    readonly enableAutoTransfer: boolean;
    readonly enableStepTransition: boolean;
    readonly enableErrorHandling: boolean;
    readonly enableProgressSync: boolean;
    readonly enableValidationSync: boolean;
    readonly debugMode: boolean;
    readonly autoTransferStep: StepNumber;
    readonly targetStepAfterTransfer: StepNumber;
  };
  readonly stepConfigs: Record<StepNumber, StepBridgeConfig>;
  readonly retryConfig: BridgeRetryConfig;
  readonly loggingConfig: BridgeLoggingConfig;
  readonly performanceConfig: BridgePerformanceConfig;
  readonly securityConfig: BridgeSecurityConfig;
  readonly cacheConfig: BridgeCacheConfig;
  readonly errorHandlingConfig: BridgeErrorHandlingConfig;
}

// 🔧 환경별 설정 생성 함수
const createEnvironmentConfig = (
  environment: 'development' | 'staging' | 'production'
) => {
  // 안전한 로그 레벨 생성 (타입단언 제거)
  const createSafeLogLevel = (level: string): BridgeLogLevel => {
    const validLogLevels: readonly BridgeLogLevel[] = [
      'silent',
      'error',
      'warn',
      'info',
      'debug',
      'verbose',
    ];

    const foundLevel = validLogLevels.find(
      (validLevel) => validLevel === level
    );
    return foundLevel !== undefined ? foundLevel : 'info';
  };

  const baseConfig = {
    development: {
      debugMode: true,
      logLevel: createSafeLogLevel('debug'),
      performanceEnabled: true,
      cacheEnabled: false,
      securityEnabled: false,
      maxRetryAttempts: 3,
    },
    staging: {
      debugMode: false,
      logLevel: createSafeLogLevel('info'),
      performanceEnabled: true,
      cacheEnabled: true,
      securityEnabled: true,
      maxRetryAttempts: 2,
    },
    production: {
      debugMode: false,
      logLevel: createSafeLogLevel('error'),
      performanceEnabled: false,
      cacheEnabled: true,
      securityEnabled: true,
      maxRetryAttempts: 1,
    },
  };

  const { [environment]: envConfig } = baseConfig;
  return envConfig;
};

// 🔧 안전한 StepNumber 생성 함수
const createSafeStepNumber = (value: number): StepNumber => {
  const validStepNumbers: StepNumber[] = [1, 2, 3, 4, 5];
  const foundStep = validStepNumbers.find((step) => step === value);

  if (foundStep !== undefined) {
    return foundStep;
  }

  console.warn(
    `⚠️ [BRIDGE_CONFIG] 유효하지 않은 스텝 번호: ${value}, 기본값 1 사용`
  );
  return 1;
};

// 🔧 기본 스텝별 Bridge 설정 생성
const createDefaultStepConfig = (stepNumber: StepNumber): StepBridgeConfig => {
  const stepConfigMap: Record<StepNumber, Partial<StepBridgeConfig>> = {
    1: {
      enabled: false,
      triggerConditions: ['step_exit'],
      transferMode: 'forward',
      validationMode: 'lenient',
      autoTransferEnabled: false,
      validationFields: ['nickname', 'emailPrefix', 'emailDomain'],
    },
    2: {
      enabled: false,
      triggerConditions: ['step_exit'],
      transferMode: 'forward',
      validationMode: 'lenient',
      autoTransferEnabled: false,
      validationFields: ['title', 'description'],
    },
    3: {
      enabled: false,
      triggerConditions: ['step_exit'],
      transferMode: 'forward',
      validationMode: 'strict',
      autoTransferEnabled: false,
      validationFields: ['content'],
    },
    4: {
      enabled: true,
      triggerConditions: ['editor_complete', 'manual_trigger'],
      transferMode: 'bidirectional',
      validationMode: 'strict',
      autoTransferEnabled: true,
      validationFields: ['editorCompletedContent', 'isEditorCompleted'],
    },
    5: {
      enabled: false,
      triggerConditions: ['form_submit'],
      transferMode: 'forward',
      validationMode: 'permissive',
      autoTransferEnabled: false,
      validationFields: [],
    },
  };

  const { [stepNumber]: specificConfig } = stepConfigMap;

  // 기본값과 병합
  const defaultConfig: StepBridgeConfig = {
    enabled: false,
    triggerConditions: ['manual_trigger'],
    transferMode: 'forward',
    validationMode: 'lenient',
    autoTransferEnabled: false,
    autoTransferDelay: 1000,
    requireUserConfirmation: false,
    validationFields: [],
    customValidators: [],
    ...specificConfig,
  };

  console.log(`🔧 [BRIDGE_CONFIG] 스텝 ${stepNumber} 설정 생성:`, {
    enabled: defaultConfig.enabled,
    transferMode: defaultConfig.transferMode,
    autoTransferEnabled: defaultConfig.autoTransferEnabled,
    validationFields: defaultConfig.validationFields,
  });

  return defaultConfig;
};

// 🔧 기본 재시도 설정 생성
const createDefaultRetryConfig = (
  environment: 'development' | 'staging' | 'production'
): BridgeRetryConfig => {
  const envConfig = createEnvironmentConfig(environment);

  return {
    enabled: true,
    strategy: 'exponential',
    maxAttempts: envConfig.maxRetryAttempts,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      'NetworkError',
      'TimeoutError',
      'ConnectionError',
      'TemporaryError',
      'RateLimitError',
    ],
  };
};

// 🔧 기본 로깅 설정 생성
const createDefaultLoggingConfig = (
  environment: 'development' | 'staging' | 'production'
): BridgeLoggingConfig => {
  const envConfig = createEnvironmentConfig(environment);

  return {
    enabled: true,
    level: envConfig.logLevel,
    includeTimestamp: true,
    includeStackTrace: environment === 'development',
    includeFormData: environment === 'development',
    includeSystemInfo: environment !== 'production',
    maxLogEntries: environment === 'production' ? 100 : 1000,
    logToConsole: true,
    logToStorage: environment === 'production',
  };
};

// 🔧 기본 성능 설정 생성
const createDefaultPerformanceConfig = (
  environment: 'development' | 'staging' | 'production'
): BridgePerformanceConfig => {
  const envConfig = createEnvironmentConfig(environment);

  return {
    enabled: envConfig.performanceEnabled,
    measureTransferTime: true,
    measureValidationTime: true,
    measureRenderTime: environment === 'development',
    performanceThresholds: {
      transferWarningMs: 2000,
      transferErrorMs: 5000,
      validationWarningMs: 500,
      validationErrorMs: 1000,
    },
    enablePerformanceMetrics: envConfig.performanceEnabled,
    metricsCollectionInterval: 60000, // 1분
  };
};

// 🔧 기본 보안 설정 생성
const createDefaultSecurityConfig = (
  environment: 'development' | 'staging' | 'production'
): BridgeSecurityConfig => {
  const envConfig = createEnvironmentConfig(environment);

  return {
    enabled: envConfig.securityEnabled,
    validateDataIntegrity: envConfig.securityEnabled,
    sanitizeInputData: envConfig.securityEnabled,
    sanitizeOutputData: envConfig.securityEnabled,
    allowedDataTypes: ['string', 'number', 'boolean', 'object', 'array'],
    blockedDataTypes: ['function', 'symbol', 'undefined'],
    maxDataSize: 10 * 1024 * 1024, // 10MB
    enableRateLimiting: envConfig.securityEnabled,
    rateLimitRequests: 10,
    rateLimitWindowMs: 60000, // 1분
  };
};

// 🔧 기본 캐시 설정 생성
const createDefaultCacheConfig = (
  environment: 'development' | 'staging' | 'production'
): BridgeCacheConfig => {
  const envConfig = createEnvironmentConfig(environment);

  return {
    enabled: envConfig.cacheEnabled,
    cacheTransferResults: envConfig.cacheEnabled,
    cacheValidationResults: envConfig.cacheEnabled,
    cacheTtlMs: 5 * 60 * 1000, // 5분
    maxCacheEntries: 100,
    enableCachePersistence: environment === 'production',
    cacheKeyStrategy: 'hash',
    invalidateOnStepChange: true,
    invalidateOnFormChange: false,
  };
};

// 🔧 기본 에러 처리 설정 생성
const createDefaultErrorHandlingConfig = (
  environment: 'development' | 'staging' | 'production'
): BridgeErrorHandlingConfig => {
  return {
    enabled: true,
    enableAutoRecovery: true,
    enableUserNotification: true,
    enableErrorReporting: environment === 'production',
    errorNotificationDuration: 5000,
    criticalErrorNotificationDuration: 10000,
    enableFallbackMode: true,
    fallbackData: {
      content: '',
      isCompleted: false,
    },
    errorCategories: [
      'CONNECTION_ERROR',
      'TRANSFER_ERROR',
      'VALIDATION_ERROR',
      'SYSTEM_ERROR',
      'USER_ERROR',
    ],
  };
};

// 🔧 환경 감지 함수 (타입단언 제거)
const detectEnvironment = (): 'development' | 'staging' | 'production' => {
  // process 객체 안전 접근
  const processEnv =
    typeof process !== 'undefined' && process.env ? process.env : {};
  const { NODE_ENV = 'development' } = processEnv;

  // 안전한 타입 검증 (타입단언 대신)
  const validEnvironments: readonly (
    | 'development'
    | 'staging'
    | 'production'
  )[] = ['development', 'staging', 'production'];

  const foundEnvironment = validEnvironments.find((env) => env === NODE_ENV);

  if (foundEnvironment !== undefined) {
    console.log(`🔧 [BRIDGE_CONFIG] 환경 감지: ${foundEnvironment}`);
    return foundEnvironment;
  }

  console.warn(
    `⚠️ [BRIDGE_CONFIG] 유효하지 않은 NODE_ENV: ${NODE_ENV}, development로 설정`
  );
  return 'development';
};

// 🔧 메인 Bridge 설정 생성 함수
const createBridgeSystemConfig = (
  customConfig?: Partial<BridgeSystemConfig>
): BridgeSystemConfig => {
  const environment = detectEnvironment();
  const envConfig = createEnvironmentConfig(environment);

  console.log('🔧 [BRIDGE_CONFIG] Bridge 시스템 설정 생성 시작:', {
    environment,
    debugMode: envConfig.debugMode,
    timestamp: new Date().toISOString(),
  });

  // 안전한 StepNumber 생성 (타입단언 제거)
  const autoTransferStep = createSafeStepNumber(4);
  const targetStepAfterTransfer = createSafeStepNumber(5);

  // 기본 설정 생성
  const defaultConfig: BridgeSystemConfig = {
    version: '1.0.0',
    environment,
    enabledFeatures: [
      'auto_transfer',
      'step_transition',
      'error_handling',
      'progress_sync',
      'validation_sync',
    ],
    globalSettings: {
      enableAutoTransfer: true,
      enableStepTransition: true,
      enableErrorHandling: true,
      enableProgressSync: true,
      enableValidationSync: true,
      debugMode: envConfig.debugMode,
      autoTransferStep,
      targetStepAfterTransfer,
    },
    stepConfigs: {
      1: createDefaultStepConfig(1),
      2: createDefaultStepConfig(2),
      3: createDefaultStepConfig(3),
      4: createDefaultStepConfig(4),
      5: createDefaultStepConfig(5),
    },
    retryConfig: createDefaultRetryConfig(environment),
    loggingConfig: createDefaultLoggingConfig(environment),
    performanceConfig: createDefaultPerformanceConfig(environment),
    securityConfig: createDefaultSecurityConfig(environment),
    cacheConfig: createDefaultCacheConfig(environment),
    errorHandlingConfig: createDefaultErrorHandlingConfig(environment),
  };

  // 커스텀 설정 병합
  const finalConfig: BridgeSystemConfig = customConfig
    ? {
        ...defaultConfig,
        ...customConfig,
        globalSettings: {
          ...defaultConfig.globalSettings,
          ...(customConfig.globalSettings || {}),
        },
        stepConfigs: {
          ...defaultConfig.stepConfigs,
          ...(customConfig.stepConfigs || {}),
        },
        retryConfig: {
          ...defaultConfig.retryConfig,
          ...(customConfig.retryConfig || {}),
        },
        loggingConfig: {
          ...defaultConfig.loggingConfig,
          ...(customConfig.loggingConfig || {}),
        },
        performanceConfig: {
          ...defaultConfig.performanceConfig,
          ...(customConfig.performanceConfig || {}),
        },
        securityConfig: {
          ...defaultConfig.securityConfig,
          ...(customConfig.securityConfig || {}),
        },
        cacheConfig: {
          ...defaultConfig.cacheConfig,
          ...(customConfig.cacheConfig || {}),
        },
        errorHandlingConfig: {
          ...defaultConfig.errorHandlingConfig,
          ...(customConfig.errorHandlingConfig || {}),
        },
      }
    : defaultConfig;

  console.log('✅ [BRIDGE_CONFIG] Bridge 시스템 설정 생성 완료:', {
    version: finalConfig.version,
    environment: finalConfig.environment,
    enabledFeaturesCount: finalConfig.enabledFeatures.length,
    stepConfigsCount: Object.keys(finalConfig.stepConfigs).length,
    debugMode: finalConfig.globalSettings.debugMode,
  });

  return finalConfig;
};

// 🔧 설정 검증 함수
const validateBridgeConfig = (
  config: BridgeSystemConfig
): {
  isValid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 [BRIDGE_CONFIG] Bridge 설정 검증 시작');

  // 기본 설정 검증
  if (!config.version || typeof config.version !== 'string') {
    errors.push('version이 유효하지 않습니다');
  }

  if (
    !config.environment ||
    !['development', 'staging', 'production'].includes(config.environment)
  ) {
    errors.push('environment가 유효하지 않습니다');
  }

  // 스텝 설정 검증
  const requiredSteps: StepNumber[] = [1, 2, 3, 4, 5];
  const { stepConfigs } = config;

  for (const stepNumber of requiredSteps) {
    const stepConfig = stepConfigs[stepNumber];
    if (!stepConfig) {
      errors.push(`스텝 ${stepNumber}의 설정이 없습니다`);
      continue;
    }

    if (stepConfig.autoTransferDelay < 0) {
      warnings.push(`스텝 ${stepNumber}의 autoTransferDelay가 음수입니다`);
    }

    if (
      stepConfig.validationFields.length === 0 &&
      stepConfig.validationMode === 'strict'
    ) {
      warnings.push(
        `스텝 ${stepNumber}에서 strict 검증 모드인데 검증 필드가 없습니다`
      );
    }
  }

  // 재시도 설정 검증
  const { retryConfig } = config;
  if (retryConfig.maxAttempts < 0) {
    errors.push('retryConfig.maxAttempts는 0 이상이어야 합니다');
  }

  if (retryConfig.baseDelay < 0) {
    errors.push('retryConfig.baseDelay는 0 이상이어야 합니다');
  }

  if (retryConfig.maxDelay < retryConfig.baseDelay) {
    warnings.push('retryConfig.maxDelay가 baseDelay보다 작습니다');
  }

  // 성능 설정 검증
  const { performanceConfig } = config;
  if (
    performanceConfig.performanceThresholds.transferErrorMs <
    performanceConfig.performanceThresholds.transferWarningMs
  ) {
    warnings.push('성능 임계값 설정이 일관성이 없습니다');
  }

  // 보안 설정 검증
  const { securityConfig } = config;
  if (securityConfig.maxDataSize <= 0) {
    errors.push('securityConfig.maxDataSize는 0보다 커야 합니다');
  }

  if (securityConfig.rateLimitRequests <= 0) {
    warnings.push('rateLimitRequests가 0 이하입니다');
  }

  const isValid = errors.length === 0;

  console.log('✅ [BRIDGE_CONFIG] Bridge 설정 검증 완료:', {
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
  });

  if (errors.length > 0) {
    console.error('❌ [BRIDGE_CONFIG] 설정 검증 에러:', errors);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ [BRIDGE_CONFIG] 설정 검증 경고:', warnings);
  }

  return {
    isValid,
    errors,
    warnings,
  };
};

// 🔧 설정 최적화 함수
const optimizeBridgeConfig = (
  config: BridgeSystemConfig
): BridgeSystemConfig => {
  console.log('⚡ [BRIDGE_CONFIG] Bridge 설정 최적화 시작');

  const { environment } = config;

  // 개발 환경에서 성능 최적화
  if (environment === 'development') {
    const optimizedConfig: BridgeSystemConfig = {
      ...config,
      cacheConfig: {
        ...config.cacheConfig,
        enabled: false, // 개발 환경에서는 캐시 비활성화
      },
      performanceConfig: {
        ...config.performanceConfig,
        metricsCollectionInterval: 10000, // 더 빠른 메트릭 수집
      },
    };

    console.log('⚡ [BRIDGE_CONFIG] 개발 환경 최적화 적용');
    return optimizedConfig;
  }

  // 프로덕션 환경에서 성능 최적화
  if (environment === 'production') {
    const optimizedConfig: BridgeSystemConfig = {
      ...config,
      loggingConfig: {
        ...config.loggingConfig,
        level: 'error', // 프로덕션에서는 에러만 로깅
        includeStackTrace: false,
        includeFormData: false,
      },
      retryConfig: {
        ...config.retryConfig,
        maxAttempts: 1, // 프로덕션에서는 재시도 최소화
      },
    };

    console.log('⚡ [BRIDGE_CONFIG] 프로덕션 환경 최적화 적용');
    return optimizedConfig;
  }

  console.log('⚡ [BRIDGE_CONFIG] 기본 설정 사용 (최적화 없음)');
  return config;
};

// 🔧 기본 설정 내보내기
export const DEFAULT_BRIDGE_CONFIG = createBridgeSystemConfig();

// 🔧 개발 환경용 설정
export const DEVELOPMENT_BRIDGE_CONFIG = createBridgeSystemConfig({
  globalSettings: {
    enableAutoTransfer: false, // 개발 중에는 수동 제어
    enableStepTransition: true,
    enableErrorHandling: true,
    enableProgressSync: true,
    enableValidationSync: true,
    debugMode: true,
    autoTransferStep: createSafeStepNumber(4),
    targetStepAfterTransfer: createSafeStepNumber(5),
  },
  loggingConfig: {
    enabled: true,
    level: 'debug',
    includeTimestamp: true,
    includeStackTrace: true,
    includeFormData: true,
    includeSystemInfo: true,
    maxLogEntries: 1000,
    logToConsole: true,
    logToStorage: false,
  },
});

// 🔧 프로덕션 환경용 설정
export const PRODUCTION_BRIDGE_CONFIG = createBridgeSystemConfig({
  globalSettings: {
    enableAutoTransfer: true,
    enableStepTransition: true,
    enableErrorHandling: true,
    enableProgressSync: true,
    enableValidationSync: true,
    debugMode: false,
    autoTransferStep: createSafeStepNumber(4),
    targetStepAfterTransfer: createSafeStepNumber(5),
  },
  loggingConfig: {
    enabled: true,
    level: 'error',
    includeTimestamp: true,
    includeStackTrace: false,
    includeFormData: false,
    includeSystemInfo: false,
    maxLogEntries: 100,
    logToConsole: false,
    logToStorage: true,
  },
});

// 🔧 함수 내보내기
export {
  createBridgeSystemConfig,
  validateBridgeConfig,
  optimizeBridgeConfig,
  detectEnvironment,
  createDefaultStepConfig,
  createSafeStepNumber,
};

// 🔧 타입 내보내기
export type {
  BridgeSystemConfig,
  StepBridgeConfig,
  BridgeRetryConfig,
  BridgeLoggingConfig,
  BridgePerformanceConfig,
  BridgeSecurityConfig,
  BridgeCacheConfig,
  BridgeErrorHandlingConfig,
  BridgeTriggerCondition,
  BridgeTransferMode,
  BridgeValidationMode,
  BridgeRetryStrategy,
  BridgeLogLevel,
};

console.log('🔧 [BRIDGE_CONFIG] Bridge 설정 모듈 로드 완료');
