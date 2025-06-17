// bridges/editorMultiStepBridge/bridgeConfig.ts

import { BridgeSystemConfiguration } from './bridgeTypes';

const createStandardBridgeConfiguration = (): BridgeSystemConfiguration => {
  console.log('⚙️ [BRIDGE_CONFIG] 표준 브릿지 설정 생성');

  return {
    enableAutoTransfer: true,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict',
    debugMode: false,
  };
};

const createDevelopmentBridgeConfiguration = (): BridgeSystemConfiguration => {
  console.log('🔧 [BRIDGE_CONFIG] 개발용 브릿지 설정 생성');

  return {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'lenient',
    debugMode: true,
  };
};

const createProductionBridgeConfiguration = (): BridgeSystemConfiguration => {
  console.log('🚀 [BRIDGE_CONFIG] 프로덕션용 브릿지 설정 생성');

  return {
    enableAutoTransfer: true,
    enableValidation: true,
    enableErrorRecovery: false,
    validationMode: 'strict',
    debugMode: false,
  };
};

const createTestingBridgeConfiguration = (): BridgeSystemConfiguration => {
  console.log('🧪 [BRIDGE_CONFIG] 테스트용 브릿지 설정 생성');

  return {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict',
    debugMode: true,
  };
};

const createMinimalBridgeConfiguration = (): BridgeSystemConfiguration => {
  console.log('📦 [BRIDGE_CONFIG] 최소 브릿지 설정 생성');

  return {
    enableAutoTransfer: false,
    enableValidation: false,
    enableErrorRecovery: false,
    validationMode: 'lenient',
    debugMode: false,
  };
};

const createMaximalBridgeConfiguration = (): BridgeSystemConfiguration => {
  console.log('🔥 [BRIDGE_CONFIG] 최대 브릿지 설정 생성');

  return {
    enableAutoTransfer: true,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict',
    debugMode: true,
  };
};

const validateBridgeConfigurationStructure = (
  configurationToValidate: unknown
): configurationToValidate is BridgeSystemConfiguration => {
  console.log('🔍 [BRIDGE_CONFIG] 브릿지 설정 구조 검증 시작');

  if (!configurationToValidate || typeof configurationToValidate !== 'object') {
    console.error('❌ [BRIDGE_CONFIG] 설정이 객체가 아님');
    return false;
  }

  const configObject = configurationToValidate as Record<string, unknown>;

  const {
    enableAutoTransfer,
    enableValidation,
    enableErrorRecovery,
    validationMode,
    debugMode,
  } = configObject;

  if (typeof enableAutoTransfer !== 'boolean') {
    console.error('❌ [BRIDGE_CONFIG] enableAutoTransfer가 불린이 아님');
    return false;
  }

  if (typeof enableValidation !== 'boolean') {
    console.error('❌ [BRIDGE_CONFIG] enableValidation이 불린이 아님');
    return false;
  }

  if (typeof enableErrorRecovery !== 'boolean') {
    console.error('❌ [BRIDGE_CONFIG] enableErrorRecovery가 불린이 아님');
    return false;
  }

  if (validationMode !== 'strict' && validationMode !== 'lenient') {
    console.error('❌ [BRIDGE_CONFIG] validationMode가 유효하지 않음');
    return false;
  }

  if (typeof debugMode !== 'boolean') {
    console.error('❌ [BRIDGE_CONFIG] debugMode가 불린이 아님');
    return false;
  }

  console.log('✅ [BRIDGE_CONFIG] 브릿지 설정 구조 검증 통과');
  return true;
};

const mergeBridgeConfigurations = (
  baseBridgeConfiguration: BridgeSystemConfiguration,
  overrideBridgeConfiguration: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration => {
  console.log('🔗 [BRIDGE_CONFIG] 브릿지 설정 병합 시작');

  const {
    enableAutoTransfer: baseAutoTransfer = true,
    enableValidation: baseValidation = true,
    enableErrorRecovery: baseErrorRecovery = true,
    validationMode: baseValidationMode = 'strict',
    debugMode: baseDebugMode = false,
  } = baseBridgeConfiguration || {};

  const {
    enableAutoTransfer: overrideAutoTransfer,
    enableValidation: overrideValidation,
    enableErrorRecovery: overrideErrorRecovery,
    validationMode: overrideValidationMode,
    debugMode: overrideDebugMode,
  } = overrideBridgeConfiguration || {};

  const mergedBridgeConfiguration: BridgeSystemConfiguration = {
    enableAutoTransfer:
      overrideAutoTransfer !== undefined
        ? overrideAutoTransfer
        : baseAutoTransfer,
    enableValidation:
      overrideValidation !== undefined ? overrideValidation : baseValidation,
    enableErrorRecovery:
      overrideErrorRecovery !== undefined
        ? overrideErrorRecovery
        : baseErrorRecovery,
    validationMode:
      overrideValidationMode !== undefined
        ? overrideValidationMode
        : baseValidationMode,
    debugMode:
      overrideDebugMode !== undefined ? overrideDebugMode : baseDebugMode,
  };

  console.log(
    '✅ [BRIDGE_CONFIG] 브릿지 설정 병합 완료:',
    mergedBridgeConfiguration
  );
  return mergedBridgeConfiguration;
};

const detectEnvironmentBasedBridgeConfiguration =
  (): BridgeSystemConfiguration => {
    console.log('🌍 [BRIDGE_CONFIG] 환경 기반 브릿지 설정 감지');

    const environmentMode =
      typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

    const isDevelopmentEnvironment = environmentMode === 'development';
    const isProductionEnvironment = environmentMode === 'production';
    const isTestingEnvironment = environmentMode === 'test';

    console.log('📊 [BRIDGE_CONFIG] 감지된 환경:', {
      mode: environmentMode,
      isDevelopment: isDevelopmentEnvironment,
      isProduction: isProductionEnvironment,
      isTesting: isTestingEnvironment,
    });

    if (isProductionEnvironment) {
      console.log('🚀 [BRIDGE_CONFIG] 프로덕션 환경 감지, 프로덕션 설정 적용');
      return createProductionBridgeConfiguration();
    }

    if (isTestingEnvironment) {
      console.log('🧪 [BRIDGE_CONFIG] 테스트 환경 감지, 테스트 설정 적용');
      return createTestingBridgeConfiguration();
    }

    console.log('🔧 [BRIDGE_CONFIG] 개발 환경 감지, 개발 설정 적용');
    return createDevelopmentBridgeConfiguration();
  };

const createCustomBridgeConfiguration = (
  customConfigurationOptions: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration => {
  console.log('🎨 [BRIDGE_CONFIG] 커스텀 브릿지 설정 생성');

  const baseBridgeConfiguration = createStandardBridgeConfiguration();
  const customBridgeConfiguration = mergeBridgeConfigurations(
    baseBridgeConfiguration,
    customConfigurationOptions
  );

  const isConfigurationValid = validateBridgeConfigurationStructure(
    customBridgeConfiguration
  );

  if (!isConfigurationValid) {
    console.warn('⚠️ [BRIDGE_CONFIG] 커스텀 설정 검증 실패, 표준 설정 사용');
    return baseBridgeConfiguration;
  }

  console.log('✅ [BRIDGE_CONFIG] 커스텀 브릿지 설정 생성 완료');
  return customBridgeConfiguration;
};

const getBridgeConfigurationPresetByName = (
  presetName: string
): BridgeSystemConfiguration => {
  console.log(`🎯 [BRIDGE_CONFIG] 프리셋 설정 조회: ${presetName}`);

  const normalizedPresetName =
    typeof presetName === 'string' ? presetName.toLowerCase().trim() : '';

  const presetConfigurationMap = new Map<
    string,
    () => BridgeSystemConfiguration
  >([
    ['standard', createStandardBridgeConfiguration],
    ['default', createStandardBridgeConfiguration],
    ['development', createDevelopmentBridgeConfiguration],
    ['dev', createDevelopmentBridgeConfiguration],
    ['production', createProductionBridgeConfiguration],
    ['prod', createProductionBridgeConfiguration],
    ['testing', createTestingBridgeConfiguration],
    ['test', createTestingBridgeConfiguration],
    ['minimal', createMinimalBridgeConfiguration],
    ['min', createMinimalBridgeConfiguration],
    ['maximal', createMaximalBridgeConfiguration],
    ['max', createMaximalBridgeConfiguration],
    ['auto', detectEnvironmentBasedBridgeConfiguration],
    ['env', detectEnvironmentBasedBridgeConfiguration],
  ]);

  const presetConfigurationFactory =
    presetConfigurationMap.get(normalizedPresetName);

  if (!presetConfigurationFactory) {
    console.warn(
      `⚠️ [BRIDGE_CONFIG] 알 수 없는 프리셋: ${presetName}, 표준 설정 사용`
    );
    return createStandardBridgeConfiguration();
  }

  const selectedPresetConfiguration = presetConfigurationFactory();
  console.log(`✅ [BRIDGE_CONFIG] 프리셋 설정 반환 완료: ${presetName}`);

  return selectedPresetConfiguration;
};

const logBridgeConfigurationDetails = (
  configurationToLog: BridgeSystemConfiguration
): void => {
  const {
    enableAutoTransfer = false,
    enableValidation = false,
    enableErrorRecovery = false,
    validationMode = 'strict',
    debugMode = false,
  } = configurationToLog || {};

  console.group('📋 [BRIDGE_CONFIG] 브릿지 설정 상세 정보');
  console.log('🔄 자동 전송:', enableAutoTransfer ? '활성화' : '비활성화');
  console.log('🔍 데이터 검증:', enableValidation ? '활성화' : '비활성화');
  console.log('🔧 오류 복구:', enableErrorRecovery ? '활성화' : '비활성화');
  console.log('⚙️ 검증 모드:', validationMode);
  console.log('🐛 디버그 모드:', debugMode ? '활성화' : '비활성화');
  console.groupEnd();
};

export const bridgeConfigurationManager = {
  createStandard: createStandardBridgeConfiguration,
  createDevelopment: createDevelopmentBridgeConfiguration,
  createProduction: createProductionBridgeConfiguration,
  createTesting: createTestingBridgeConfiguration,
  createMinimal: createMinimalBridgeConfiguration,
  createMaximal: createMaximalBridgeConfiguration,
  validateStructure: validateBridgeConfigurationStructure,
  mergeConfigurations: mergeBridgeConfigurations,
  detectEnvironmentBased: detectEnvironmentBasedBridgeConfiguration,
  createCustom: createCustomBridgeConfiguration,
  getPresetByName: getBridgeConfigurationPresetByName,
  logDetails: logBridgeConfigurationDetails,
};
