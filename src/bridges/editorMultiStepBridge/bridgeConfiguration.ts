// bridges/editorMultiStepBridge/bridgeConfiguration.ts

// 🔧 검증 기준 상수 정의 - 구체적인 타입으로 명시
export const VALIDATION_CRITERIA = {
  minContainers: 1,
  minParagraphs: 1,
  minContentLength: 10,
  maxRetryAttempts: 3,
  timeoutMs: 5000,
} as const;

// 🔧 브릿지 시스템 설정 인터페이스
export interface BridgeSystemConfiguration {
  readonly enableValidation: boolean;
  readonly enableErrorRecovery: boolean;
  readonly debugMode: boolean;
  readonly maxRetryAttempts: number;
  readonly timeoutMs: number;
}

// 🔧 기본 설정 생성 함수
function createDefaultBridgeConfiguration(): BridgeSystemConfiguration {
  return {
    enableValidation: true,
    enableErrorRecovery: false,
    debugMode: false,
    maxRetryAttempts: VALIDATION_CRITERIA.maxRetryAttempts,
    timeoutMs: VALIDATION_CRITERIA.timeoutMs,
  };
}

// 🔧 단순 설정 생성 함수
function createSimpleConfiguration(): BridgeSystemConfiguration {
  const defaultConfig = createDefaultBridgeConfiguration();

  return {
    ...defaultConfig,
    enableValidation: true,
    enableErrorRecovery: true,
    debugMode: true,
  };
}

// 🔧 고급 설정 생성 함수
function createAdvancedConfiguration(
  customOptions?: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration {
  const defaultConfig = createDefaultBridgeConfiguration();

  return {
    ...defaultConfig,
    ...customOptions,
  };
}

// 🔧 설정 유효성 검증 함수
function validateBridgeConfiguration(
  config: BridgeSystemConfiguration
): boolean {
  // Early Return: null 체크
  if (!config || typeof config !== 'object') {
    return false;
  }

  const requiredProperties = [
    'enableValidation',
    'enableErrorRecovery',
    'debugMode',
    'maxRetryAttempts',
    'timeoutMs',
  ] as const;

  // 필수 속성 존재 여부 확인
  for (const prop of requiredProperties) {
    if (!(prop in config)) {
      return false;
    }
  }

  // 타입 검증
  const { maxRetryAttempts, timeoutMs } = config;

  const isValidRetryAttempts =
    typeof maxRetryAttempts === 'number' &&
    maxRetryAttempts > 0 &&
    maxRetryAttempts <= 10;

  const isValidTimeout =
    typeof timeoutMs === 'number' && timeoutMs > 0 && timeoutMs <= 30000;

  return isValidRetryAttempts && isValidTimeout;
}

// 🔧 브릿지 설정 관리자 객체
export const bridgeConfigManager = {
  createDefaultConfiguration: createDefaultBridgeConfiguration,
  createSimpleConfiguration,
  createAdvancedConfiguration,
  validateConfiguration: validateBridgeConfiguration,

  // 🔧 환경별 설정 생성
  createDevelopmentConfiguration: (): BridgeSystemConfiguration => {
    return createAdvancedConfiguration({
      debugMode: true,
      enableErrorRecovery: true,
      maxRetryAttempts: 5,
      timeoutMs: 10000,
    });
  },

  createProductionConfiguration: (): BridgeSystemConfiguration => {
    return createAdvancedConfiguration({
      debugMode: false,
      enableErrorRecovery: true,
      maxRetryAttempts: 3,
      timeoutMs: 5000,
    });
  },

  createTestingConfiguration: (): BridgeSystemConfiguration => {
    return createAdvancedConfiguration({
      debugMode: true,
      enableErrorRecovery: false,
      maxRetryAttempts: 1,
      timeoutMs: 1000,
    });
  },
} as const;
