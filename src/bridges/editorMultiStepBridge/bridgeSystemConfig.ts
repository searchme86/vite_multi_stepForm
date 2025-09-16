// bridges/editorMultiStepBridge/bridgeSystemConfig.ts

import type { BridgeSystemConfiguration } from './modernBridgeTypes';

// 🔧 검증 기준 상수 정의 - 타입 단언 없이 구체적 타입 명시
const VALIDATION_CRITERIA: {
  readonly minContainers: 1;
  readonly minParagraphs: 1;
  readonly minContentLength: 10;
  readonly maxRetryAttempts: 3;
  readonly timeoutMs: 5000;
  readonly maxMemoryUsageMB: 512;
  readonly maxTransformationTimeMs: 3000;
  readonly cacheExpirationMs: 300000;
} = {
  minContainers: 1,
  minParagraphs: 1,
  minContentLength: 10,
  maxRetryAttempts: 3,
  timeoutMs: 5000,
  maxMemoryUsageMB: 512,
  maxTransformationTimeMs: 3000,
  cacheExpirationMs: 300000,
};

// 🔧 성능 임계값 상수 - 타입 단언 없이 정의
const PERFORMANCE_THRESHOLDS: {
  readonly extractionTimeMs: 100;
  readonly transformationTimeMs: 200;
  readonly validationTimeMs: 50;
  readonly updateTimeMs: 150;
  readonly totalOperationTimeMs: 1000;
} = {
  extractionTimeMs: 100,
  transformationTimeMs: 200,
  validationTimeMs: 50,
  updateTimeMs: 150,
  totalOperationTimeMs: 1000,
};

// 🔧 기본 브릿지 설정 생성 함수 - 구체적 타입 반환
function createDefaultBridgeConfigurationInternal(): BridgeSystemConfiguration {
  console.log('🏗️ [CONFIG] 기본 브릿지 설정 생성 시작');

  const defaultValidationRules = new Map<string, (data: unknown) => boolean>();
  defaultValidationRules.set('minContent', (data: unknown): boolean => {
    const isStringData = typeof data === 'string';
    return isStringData
      ? data.length >= VALIDATION_CRITERIA.minContentLength
      : false;
  });

  const defaultFeatureFlags = new Set<string>();
  defaultFeatureFlags.add('STRICT_VALIDATION');
  defaultFeatureFlags.add('PERFORMANCE_MONITORING');

  const defaultConfiguration: BridgeSystemConfiguration = {
    enableValidation: true,
    enableErrorRecovery: false,
    debugMode: false,
    maxRetryAttempts: VALIDATION_CRITERIA.maxRetryAttempts,
    timeoutMs: VALIDATION_CRITERIA.timeoutMs,
    performanceLogging: false,
    strictTypeChecking: true,
    customValidationRules: defaultValidationRules,
    featureFlags: defaultFeatureFlags,
  };

  console.log('✅ [CONFIG] 기본 설정 생성 완료:', {
    validationEnabled: defaultConfiguration.enableValidation,
    retryAttempts: defaultConfiguration.maxRetryAttempts,
    timeout: defaultConfiguration.timeoutMs,
    featureFlagsCount: defaultConfiguration.featureFlags.size,
  });

  return defaultConfiguration;
}

// 🔧 단순 설정 생성 함수 - 개발용 최적화
function createSimpleConfiguration(): BridgeSystemConfiguration {
  console.log('🔧 [CONFIG] 단순 설정 생성 시작');

  const baseConfiguration = createDefaultBridgeConfigurationInternal();

  const simpleValidationRules = new Map<string, (data: unknown) => boolean>();
  simpleValidationRules.set('basicCheck', (data: unknown): boolean => {
    return data !== null && data !== undefined;
  });

  const simpleFeatureFlags = new Set<string>();
  simpleFeatureFlags.add('BASIC_VALIDATION');
  simpleFeatureFlags.add('DEBUG_LOGGING');

  // 🔧 구조분해할당 + Fallback으로 기본 설정 추출
  const {
    enableValidation: baseValidation = true,
    maxRetryAttempts: baseRetryAttempts = 3,
    timeoutMs: baseTimeout = 5000,
  } = baseConfiguration;

  const simpleConfiguration: BridgeSystemConfiguration = {
    enableValidation: baseValidation,
    enableErrorRecovery: true,
    debugMode: true,
    maxRetryAttempts: baseRetryAttempts,
    timeoutMs: baseTimeout,
    performanceLogging: true,
    strictTypeChecking: false,
    customValidationRules: simpleValidationRules,
    featureFlags: simpleFeatureFlags,
  };

  console.log('✅ [CONFIG] 단순 설정 생성 완료');

  return simpleConfiguration;
}

// 🔧 고급 설정 생성 함수 - 사용자 정의 옵션 지원
function createAdvancedConfiguration(
  customOptionsData?: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration {
  console.log('🚀 [CONFIG] 고급 설정 생성 시작');

  const baseConfiguration = createDefaultBridgeConfigurationInternal();

  // Early Return: 사용자 정의 옵션이 없는 경우
  const hasCustomOptions =
    customOptionsData !== null && customOptionsData !== undefined;
  if (!hasCustomOptions) {
    console.log('📋 [CONFIG] 사용자 정의 옵션 없음, 기본 설정 반환');
    return baseConfiguration;
  }

  // 🔧 구조분해할당 + Fallback으로 안전한 옵션 추출
  const {
    enableValidation = baseConfiguration.enableValidation,
    enableErrorRecovery = baseConfiguration.enableErrorRecovery,
    debugMode = baseConfiguration.debugMode,
    maxRetryAttempts = baseConfiguration.maxRetryAttempts,
    timeoutMs = baseConfiguration.timeoutMs,
    performanceLogging = baseConfiguration.performanceLogging,
    strictTypeChecking = baseConfiguration.strictTypeChecking,
    customValidationRules = baseConfiguration.customValidationRules,
    featureFlags = baseConfiguration.featureFlags,
  } = customOptionsData;

  // 🔧 타입 안전한 Map과 Set 생성
  const safeValidationRules =
    customValidationRules instanceof Map
      ? new Map(customValidationRules)
      : new Map();

  const safeFeatureFlags =
    featureFlags instanceof Set
      ? new Set<string>(
          Array.from(featureFlags).filter(
            (flag): flag is string => typeof flag === 'string'
          )
        )
      : new Set<string>();

  const mergedConfiguration: BridgeSystemConfiguration = {
    enableValidation,
    enableErrorRecovery,
    debugMode,
    maxRetryAttempts,
    timeoutMs,
    performanceLogging,
    strictTypeChecking,
    customValidationRules: safeValidationRules,
    featureFlags: safeFeatureFlags,
  };

  // 🔧 안전한 키 개수 계산 - Object.keys 대신 Reflect 사용
  const customOptionsKeys = customOptionsData
    ? Reflect.ownKeys(customOptionsData)
    : [];
  const customOptionsCount = customOptionsKeys.length;

  console.log('✅ [CONFIG] 고급 설정 생성 완료:', {
    customOptionsApplied: customOptionsCount,
    finalValidation: mergedConfiguration.enableValidation,
    finalTimeout: mergedConfiguration.timeoutMs,
  });

  return mergedConfiguration;
}

// 🔧 설정 검증 함수 - 구체적 타입 검사
function validateBridgeConfigurationInternal(
  configurationToValidate: BridgeSystemConfiguration
): boolean {
  console.log('🔍 [CONFIG] 브릿지 설정 검증 시작');

  // Early Return: null/undefined 체크
  const isNullOrUndefined =
    configurationToValidate === null || configurationToValidate === undefined;
  if (isNullOrUndefined) {
    console.error('❌ [CONFIG] 설정이 null 또는 undefined입니다');
    return false;
  }

  const isObjectType = typeof configurationToValidate === 'object';

  // Early Return: 객체 타입이 아닌 경우
  if (!isObjectType) {
    console.error('❌ [CONFIG] 설정이 객체 타입이 아닙니다');
    return false;
  }

  const requiredProperties: readonly string[] = [
    'enableValidation',
    'enableErrorRecovery',
    'debugMode',
    'maxRetryAttempts',
    'timeoutMs',
    'performanceLogging',
    'strictTypeChecking',
    'customValidationRules',
    'featureFlags',
  ];

  // 필수 속성 존재 여부 확인
  for (const requiredProperty of requiredProperties) {
    const hasProperty = requiredProperty in configurationToValidate;

    if (!hasProperty) {
      console.error(`❌ [CONFIG] 필수 속성 누락: ${requiredProperty}`);
      return false;
    }
  }

  // 🔧 구조분해할당 + Fallback으로 타입 안전한 값 추출
  const {
    maxRetryAttempts = 0,
    timeoutMs = 0,
    customValidationRules = null,
    featureFlags = null,
  } = configurationToValidate;

  // 숫자 타입 검증 - 삼항연산자 사용
  const isValidRetryAttempts =
    typeof maxRetryAttempts === 'number'
      ? maxRetryAttempts > 0 && maxRetryAttempts <= 10
      : false;

  const isValidTimeout =
    typeof timeoutMs === 'number' ? timeoutMs > 0 && timeoutMs <= 30000 : false;

  // Early Return: 숫자 값이 유효하지 않은 경우
  if (!isValidRetryAttempts) {
    console.error(
      '❌ [CONFIG] maxRetryAttempts 값이 유효하지 않습니다:',
      maxRetryAttempts
    );
    return false;
  }

  if (!isValidTimeout) {
    console.error('❌ [CONFIG] timeoutMs 값이 유효하지 않습니다:', timeoutMs);
    return false;
  }

  // Map 타입 검증
  const isValidValidationRules = customValidationRules instanceof Map;

  // Early Return: Map이 아닌 경우
  if (!isValidValidationRules) {
    console.error('❌ [CONFIG] customValidationRules가 Map 타입이 아닙니다');
    return false;
  }

  // Set 타입 검증
  const isValidFeatureFlags = featureFlags instanceof Set;

  // Early Return: Set이 아닌 경우
  if (!isValidFeatureFlags) {
    console.error('❌ [CONFIG] featureFlags가 Set 타입이 아닙니다');
    return false;
  }

  console.log('✅ [CONFIG] 브릿지 설정 검증 완료');

  return true;
}

// 🔧 설정 병합 함수 - 안전한 타입 변환
function mergeBridgeConfigurationsInternal(
  baseConfigurationData: BridgeSystemConfiguration,
  overrideConfigurationData: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration {
  console.log('🔄 [CONFIG] 브릿지 설정 병합 시작');

  // Early Return: 기본 설정이 유효하지 않은 경우
  const isBaseConfigValid = validateBridgeConfigurationInternal(
    baseConfigurationData
  );
  if (!isBaseConfigValid) {
    console.error('❌ [CONFIG] 기본 설정이 유효하지 않습니다');
    throw new Error('기본 설정이 유효하지 않습니다');
  }

  // Early Return: 오버라이드 설정이 없는 경우
  const hasOverrideConfig =
    overrideConfigurationData !== null &&
    overrideConfigurationData !== undefined;
  if (!hasOverrideConfig) {
    console.log('📋 [CONFIG] 오버라이드 설정 없음, 기본 설정 반환');
    return baseConfigurationData;
  }

  // 🔧 구조분해할당 + Fallback으로 안전한 병합
  const {
    enableValidation = baseConfigurationData.enableValidation,
    enableErrorRecovery = baseConfigurationData.enableErrorRecovery,
    debugMode = baseConfigurationData.debugMode,
    maxRetryAttempts = baseConfigurationData.maxRetryAttempts,
    timeoutMs = baseConfigurationData.timeoutMs,
    performanceLogging = baseConfigurationData.performanceLogging,
    strictTypeChecking = baseConfigurationData.strictTypeChecking,
    customValidationRules = baseConfigurationData.customValidationRules,
    featureFlags = baseConfigurationData.featureFlags,
  } = overrideConfigurationData;

  // Map과 Set의 안전한 복사 - 타입 검증 추가
  const mergedValidationRules =
    customValidationRules instanceof Map
      ? new Map(customValidationRules)
      : new Map();

  const mergedFeatureFlags =
    featureFlags instanceof Set
      ? new Set<string>(
          Array.from(featureFlags).filter(
            (flag): flag is string => typeof flag === 'string'
          )
        )
      : new Set<string>();

  const mergedConfiguration: BridgeSystemConfiguration = {
    enableValidation,
    enableErrorRecovery,
    debugMode,
    maxRetryAttempts,
    timeoutMs,
    performanceLogging,
    strictTypeChecking,
    customValidationRules: mergedValidationRules,
    featureFlags: mergedFeatureFlags,
  };

  // 병합된 설정 검증
  const isMergedConfigValid =
    validateBridgeConfigurationInternal(mergedConfiguration);

  // Early Return: 병합된 설정이 유효하지 않은 경우
  if (!isMergedConfigValid) {
    console.error('❌ [CONFIG] 병합된 설정이 유효하지 않습니다');
    throw new Error('병합된 설정이 유효하지 않습니다');
  }

  console.log('✅ [CONFIG] 브릿지 설정 병합 완료');

  return mergedConfiguration;
}

// 🔧 환경별 설정 생성 함수들
function createDevelopmentConfiguration(): BridgeSystemConfiguration {
  console.log('🛠️ [CONFIG] 개발 환경 설정 생성');

  const developmentValidationRules = new Map<
    string,
    (data: unknown) => boolean
  >();
  developmentValidationRules.set('devCheck', (data: unknown): boolean => {
    return data !== null && data !== undefined;
  });
  developmentValidationRules.set('typeCheck', (data: unknown): boolean => {
    const supportedTypes = ['string', 'number', 'boolean', 'object'];
    return supportedTypes.includes(typeof data);
  });

  const developmentFeatureFlags = new Set<string>();
  developmentFeatureFlags.add('DEBUG_MODE');
  developmentFeatureFlags.add('VERBOSE_LOGGING');
  developmentFeatureFlags.add('PERFORMANCE_PROFILING');
  developmentFeatureFlags.add('ERROR_STACK_TRACES');

  return createAdvancedConfiguration({
    debugMode: true,
    enableErrorRecovery: true,
    maxRetryAttempts: 5,
    timeoutMs: 10000,
    performanceLogging: true,
    strictTypeChecking: false,
    customValidationRules: developmentValidationRules,
    featureFlags: developmentFeatureFlags,
  });
}

function createProductionConfiguration(): BridgeSystemConfiguration {
  console.log('🏭 [CONFIG] 프로덕션 환경 설정 생성');

  const productionValidationRules = new Map<
    string,
    (data: unknown) => boolean
  >();
  productionValidationRules.set(
    'strictValidation',
    (data: unknown): boolean => {
      const isValidData = data !== null && data !== undefined;
      const hasMinimumLength =
        typeof data === 'string'
          ? data.length >= VALIDATION_CRITERIA.minContentLength
          : true;
      return isValidData && hasMinimumLength;
    }
  );

  const productionFeatureFlags = new Set<string>();
  productionFeatureFlags.add('PRODUCTION_MODE');
  productionFeatureFlags.add('OPTIMIZED_PERFORMANCE');
  productionFeatureFlags.add('ERROR_REPORTING');

  return createAdvancedConfiguration({
    debugMode: false,
    enableErrorRecovery: true,
    maxRetryAttempts: 3,
    timeoutMs: 5000,
    performanceLogging: false,
    strictTypeChecking: true,
    customValidationRules: productionValidationRules,
    featureFlags: productionFeatureFlags,
  });
}

function createTestingConfiguration(): BridgeSystemConfiguration {
  console.log('🧪 [CONFIG] 테스트 환경 설정 생성');

  const testingValidationRules = new Map<string, (data: unknown) => boolean>();
  testingValidationRules.set('testMode', (): boolean => {
    return true; // 테스트 환경에서는 모든 데이터 허용
  });

  const testingFeatureFlags = new Set<string>();
  testingFeatureFlags.add('TEST_MODE');
  testingFeatureFlags.add('MOCK_DATA_SUPPORT');
  testingFeatureFlags.add('FAST_EXECUTION');

  return createAdvancedConfiguration({
    debugMode: true,
    enableErrorRecovery: false,
    maxRetryAttempts: 1,
    timeoutMs: 1000,
    performanceLogging: true,
    strictTypeChecking: false,
    customValidationRules: testingValidationRules,
    featureFlags: testingFeatureFlags,
  });
}

// 🔧 성능 최적화 설정 생성 함수
function createPerformanceOptimizedConfiguration(): BridgeSystemConfiguration {
  console.log('⚡ [CONFIG] 성능 최적화 설정 생성');

  const performanceValidationRules = new Map<
    string,
    (data: unknown) => boolean
  >();
  performanceValidationRules.set('quickCheck', (data: unknown): boolean => {
    // 빠른 검증을 위한 최소한의 체크
    return data !== null;
  });

  const performanceFeatureFlags = new Set<string>();
  performanceFeatureFlags.add('PERFORMANCE_MODE');
  performanceFeatureFlags.add('MINIMAL_VALIDATION');
  performanceFeatureFlags.add('CACHE_OPTIMIZATION');

  return createAdvancedConfiguration({
    enableValidation: false, // 성능을 위해 검증 비활성화
    enableErrorRecovery: false,
    debugMode: false,
    maxRetryAttempts: 1,
    timeoutMs: 2000,
    performanceLogging: false,
    strictTypeChecking: false,
    customValidationRules: performanceValidationRules,
    featureFlags: performanceFeatureFlags,
  });
}

// 🔧 설정 유틸리티 함수들
function getConfigurationSummary(
  configurationData: BridgeSystemConfiguration
): Map<string, unknown> {
  console.log('📊 [CONFIG] 설정 요약 생성');

  // 🔧 구조분해할당 + Fallback으로 안전한 데이터 추출
  const {
    enableValidation = false,
    enableErrorRecovery = false,
    debugMode = false,
    maxRetryAttempts = 0,
    timeoutMs = 0,
    performanceLogging = false,
    strictTypeChecking = false,
    customValidationRules = new Map(),
    featureFlags = new Set(),
  } = configurationData;

  const summaryMap = new Map<string, unknown>();
  summaryMap.set('validationEnabled', enableValidation);
  summaryMap.set('errorRecoveryEnabled', enableErrorRecovery);
  summaryMap.set('debugMode', debugMode);
  summaryMap.set('maxRetryAttempts', maxRetryAttempts);
  summaryMap.set('timeoutMs', timeoutMs);
  summaryMap.set('performanceLogging', performanceLogging);
  summaryMap.set('strictTypeChecking', strictTypeChecking);
  summaryMap.set('validationRulesCount', customValidationRules.size);
  summaryMap.set('featureFlagsCount', featureFlags.size);

  const featureFlagsArray = Array.from(featureFlags);
  summaryMap.set('activeFeatures', featureFlagsArray);

  console.log('✅ [CONFIG] 설정 요약 생성 완료');

  return summaryMap;
}

function isFeatureEnabled(
  configurationData: BridgeSystemConfiguration,
  featureName: string
): boolean {
  // 🔧 구조분해할당 + Fallback으로 안전한 featureFlags 추출
  const { featureFlags = new Set() } = configurationData;

  const hasFeature = featureFlags.has(featureName);

  console.log(`🔍 [CONFIG] 기능 확인: ${featureName} = ${hasFeature}`);

  return hasFeature;
}

function addValidationRule(
  configurationData: BridgeSystemConfiguration,
  ruleName: string,
  ruleFunction: (data: unknown) => boolean
): BridgeSystemConfiguration {
  console.log(`➕ [CONFIG] 검증 규칙 추가: ${ruleName}`);

  // 🔧 구조분해할당 + Fallback으로 안전한 규칙 추출
  const { customValidationRules = new Map() } = configurationData;

  const updatedValidationRules = new Map(customValidationRules);
  updatedValidationRules.set(ruleName, ruleFunction);

  const updatedConfiguration: BridgeSystemConfiguration = {
    ...configurationData,
    customValidationRules: updatedValidationRules,
  };

  console.log(`✅ [CONFIG] 검증 규칙 추가 완료: ${ruleName}`);

  return updatedConfiguration;
}

// 🔧 브릿지 설정 관리자 객체 - 모든 설정 기능 통합
export const bridgeConfigManager: {
  readonly createDefaultConfiguration: () => BridgeSystemConfiguration;
  readonly createSimpleConfiguration: () => BridgeSystemConfiguration;
  readonly createAdvancedConfiguration: (
    customOptions?: Partial<BridgeSystemConfiguration>
  ) => BridgeSystemConfiguration;
  readonly createDevelopmentConfiguration: () => BridgeSystemConfiguration;
  readonly createProductionConfiguration: () => BridgeSystemConfiguration;
  readonly createTestingConfiguration: () => BridgeSystemConfiguration;
  readonly createPerformanceOptimizedConfiguration: () => BridgeSystemConfiguration;
  readonly validateConfiguration: (
    config: BridgeSystemConfiguration
  ) => boolean;
  readonly mergeBridgeConfigurations: (
    base: BridgeSystemConfiguration,
    override: Partial<BridgeSystemConfiguration>
  ) => BridgeSystemConfiguration;
  readonly getConfigurationSummary: (
    config: BridgeSystemConfiguration
  ) => Map<string, unknown>;
  readonly isFeatureEnabled: (
    config: BridgeSystemConfiguration,
    featureName: string
  ) => boolean;
  readonly addValidationRule: (
    config: BridgeSystemConfiguration,
    ruleName: string,
    ruleFunction: (data: unknown) => boolean
  ) => BridgeSystemConfiguration;
  readonly getValidationCriteria: () => typeof VALIDATION_CRITERIA;
  readonly getPerformanceThresholds: () => typeof PERFORMANCE_THRESHOLDS;
} = {
  // 기본 설정 생성 함수들
  createDefaultConfiguration: createDefaultBridgeConfigurationInternal,
  createSimpleConfiguration,
  createAdvancedConfiguration,

  // 환경별 설정 생성 함수들
  createDevelopmentConfiguration,
  createProductionConfiguration,
  createTestingConfiguration,
  createPerformanceOptimizedConfiguration,

  // 설정 검증 및 병합 함수들
  validateConfiguration: validateBridgeConfigurationInternal,
  mergeBridgeConfigurations: mergeBridgeConfigurationsInternal,

  // 설정 유틸리티 함수들
  getConfigurationSummary,
  isFeatureEnabled,
  addValidationRule,

  // 상수 접근자들
  getValidationCriteria: (): typeof VALIDATION_CRITERIA => ({
    ...VALIDATION_CRITERIA,
  }),
  getPerformanceThresholds: (): typeof PERFORMANCE_THRESHOLDS => ({
    ...PERFORMANCE_THRESHOLDS,
  }),
};

// 🔧 편의 함수들 - 외부에서 쉽게 사용할 수 있도록
export function createDefaultBridgeConfiguration(): BridgeSystemConfiguration {
  return bridgeConfigManager.createDefaultConfiguration();
}

export function mergeBridgeConfigurations(
  baseConfig: BridgeSystemConfiguration,
  overrideConfig: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration {
  return bridgeConfigManager.mergeBridgeConfigurations(
    baseConfig,
    overrideConfig
  );
}

export function validateBridgeConfiguration(
  config: BridgeSystemConfiguration
): boolean {
  return bridgeConfigManager.validateConfiguration(config);
}

console.log('🏗️ [BRIDGE_SYSTEM_CONFIG] 브릿지 설정 관리 시스템 초기화 완료');
console.log('📊 [BRIDGE_SYSTEM_CONFIG] 사용 가능한 설정 프로필:', {
  default: '기본 설정',
  simple: '단순 설정',
  advanced: '고급 설정',
  development: '개발 환경',
  production: '프로덕션 환경',
  testing: '테스트 환경',
  performance: '성능 최적화',
});
console.log('✅ [BRIDGE_SYSTEM_CONFIG] 모든 설정 관리 기능 준비 완료');
