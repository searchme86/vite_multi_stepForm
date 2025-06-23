// bridges/editorMultiStepBridge/bridgeConfig.ts

import { BridgeSystemConfiguration } from './bridgeTypes';

// 검증 기준 설정값 - 하드코딩 제거
export const VALIDATION_CRITERIA = {
  minContainers: 1,
  minParagraphs: 1,
  minContentLength: 20,
  minAssignmentRatio: 0.5, // 50%
  completionScoreThreshold: 70, // 70점
  cacheDuration: 1000, // 1초
  throttleDelay: 300, // 300ms
} as const;

// 환경별 설정
export const ENVIRONMENT_CONFIGS = {
  development: {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'lenient' as const,
    debugMode: true,
  },
  production: {
    enableAutoTransfer: true,
    enableValidation: true,
    enableErrorRecovery: false,
    validationMode: 'strict' as const,
    debugMode: false,
  },
  test: {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict' as const,
    debugMode: true,
  },
} as const;

const createConfig = (
  preset: keyof typeof ENVIRONMENT_CONFIGS
): BridgeSystemConfiguration => {
  console.log(`⚙️ [BRIDGE_CONFIG] ${preset} 설정 생성`);
  return ENVIRONMENT_CONFIGS[preset];
};

// 브라우저 환경에서 안전한 환경 감지 함수
const getEnvironment = (): keyof typeof ENVIRONMENT_CONFIGS => {
  // 브라우저 환경에서는 기본적으로 development로 설정
  // 실제 배포 시에는 빌드 과정에서 환경 변수를 주입하거나
  // window 객체의 커스텀 속성을 사용할 수 있음
  const browserEnvironment =
    typeof window !== 'undefined' && (window as any).__APP_ENV__
      ? (window as any).__APP_ENV__
      : 'development';

  // 유효한 환경 값인지 확인
  if (browserEnvironment === 'production' || browserEnvironment === 'test') {
    console.log(`🌍 [BRIDGE_CONFIG] 환경 감지: ${browserEnvironment}`);
    return browserEnvironment;
  }

  console.log('🌍 [BRIDGE_CONFIG] 환경 감지: development (기본값)');
  return 'development';
};

const validateConfig = (
  config: unknown
): config is BridgeSystemConfiguration => {
  if (!config || typeof config !== 'object') return false;

  const configObject = config as Record<string, unknown>;
  return (
    typeof configObject.enableValidation === 'boolean' &&
    typeof configObject.enableErrorRecovery === 'boolean' &&
    (configObject.validationMode === 'strict' ||
      configObject.validationMode === 'lenient') &&
    typeof configObject.debugMode === 'boolean'
  );
};

const mergeConfigs = (
  base: BridgeSystemConfiguration,
  override: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration => {
  return { ...base, ...override };
};

export const bridgeConfigManager = {
  createDevelopment: () => createConfig('development'),
  createProduction: () => createConfig('production'),
  createTest: () => createConfig('test'),
  createAuto: () => createConfig(getEnvironment()),
  createCustom: (overrides: Partial<BridgeSystemConfiguration>) => {
    const base = createConfig(getEnvironment());
    const custom = mergeConfigs(base, overrides);
    return validateConfig(custom) ? custom : base;
  },
  getValidationCriteria: () => VALIDATION_CRITERIA,
};
