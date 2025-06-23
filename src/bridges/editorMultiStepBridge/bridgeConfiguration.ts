// bridges/editorMultiStepBridge/bridgeConfiguration.ts

import { BridgeSystemConfiguration } from './bridgeDataTypes';

// 🔧 기본 검증 기준 - 이전 복잡한 점수 시스템 제거하고 단순화
export const VALIDATION_CRITERIA = {
  minContainers: 1,
  minParagraphs: 1,
  minContentLength: 20,
} as const;

// 🔧 단순화된 Bridge 설정 관리자
export const bridgeConfigManager = {
  // 🎯 기본 설정 생성 - 복잡한 환경별 설정 제거
  createSimple: (): BridgeSystemConfiguration => {
    console.log('⚙️ [CONFIG_MANAGER] 단순 설정 생성');

    return {
      enableValidation: true, // 검증 활성화
      enableErrorRecovery: true, // 에러 복구 활성화
      debugMode: false, // 디버그 모드 비활성화
    };
  },

  // 🎯 커스텀 설정과 기본 설정 병합
  createWithCustom: (
    customConfig: Partial<BridgeSystemConfiguration>
  ): BridgeSystemConfiguration => {
    console.log('⚙️ [CONFIG_MANAGER] 커스텀 설정 병합');

    const baseConfig = bridgeConfigManager.createSimple();
    const mergedConfig = { ...baseConfig, ...customConfig };

    console.log('📊 [CONFIG_MANAGER] 병합된 설정:', {
      enableValidation: mergedConfig.enableValidation,
      enableErrorRecovery: mergedConfig.enableErrorRecovery,
      debugMode: mergedConfig.debugMode,
    });

    return mergedConfig;
  },

  // 🎯 검증 기준 조회
  getValidationCriteria: () => {
    console.log('📋 [CONFIG_MANAGER] 검증 기준 조회');
    return VALIDATION_CRITERIA;
  },

  // 🎯 설정 유효성 검증
  validateConfiguration: (config: BridgeSystemConfiguration): boolean => {
    console.log('🔍 [CONFIG_MANAGER] 설정 검증');

    try {
      const hasValidValidation = typeof config.enableValidation === 'boolean';
      const hasValidErrorRecovery =
        typeof config.enableErrorRecovery === 'boolean';
      const hasValidDebugMode = typeof config.debugMode === 'boolean';

      const isValid =
        hasValidValidation && hasValidErrorRecovery && hasValidDebugMode;

      console.log('📊 [CONFIG_MANAGER] 설정 검증 결과:', {
        hasValidValidation,
        hasValidErrorRecovery,
        hasValidDebugMode,
        isValid,
      });

      return isValid;
    } catch (error) {
      console.error('❌ [CONFIG_MANAGER] 설정 검증 실패:', error);
      return false;
    }
  },

  // 🎯 디버그 모드 전용 설정 생성
  createDebugMode: (): BridgeSystemConfiguration => {
    console.log('🐛 [CONFIG_MANAGER] 디버그 모드 설정 생성');

    return {
      enableValidation: true,
      enableErrorRecovery: true,
      debugMode: true,
    };
  },

  // 🎯 프로덕션 모드 전용 설정 생성
  createProductionMode: (): BridgeSystemConfiguration => {
    console.log('🏭 [CONFIG_MANAGER] 프로덕션 모드 설정 생성');

    return {
      enableValidation: true,
      enableErrorRecovery: false, // 프로덕션에서는 엄격한 에러 처리
      debugMode: false,
    };
  },
};

// 🎯 기본 Bridge 설정 내보내기
export const DEFAULT_BRIDGE_CONFIG: BridgeSystemConfiguration =
  bridgeConfigManager.createSimple();

// 🎯 Bridge 설정 팩토리 함수
export const createBridgeConfiguration = (
  options?: Partial<BridgeSystemConfiguration>
): BridgeSystemConfiguration => {
  console.log('🏭 [CONFIG_FACTORY] Bridge 설정 생성');

  if (!options) {
    return bridgeConfigManager.createSimple();
  }

  return bridgeConfigManager.createWithCustom(options);
};

// 🎯 설정 타입 가드 함수
export const isBridgeConfiguration = (
  obj: any
): obj is BridgeSystemConfiguration => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.enableValidation === 'boolean' &&
    typeof obj.enableErrorRecovery === 'boolean' &&
    typeof obj.debugMode === 'boolean'
  );
};

// 🎯 설정 비교 함수
export const compareBridgeConfigurations = (
  config1: BridgeSystemConfiguration,
  config2: BridgeSystemConfiguration
): boolean => {
  return (
    config1.enableValidation === config2.enableValidation &&
    config1.enableErrorRecovery === config2.enableErrorRecovery &&
    config1.debugMode === config2.debugMode
  );
};
