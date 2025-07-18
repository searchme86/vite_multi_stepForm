// bridges/core/BridgeEngine.ts

import type {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  EditorStateSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
} from '../editorMultiStepBridge/modernBridgeTypes';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorStateCapture';
import { createDataStructureTransformer } from '../editorMultiStepBridge/dataTransformProcessor';
import { createMultiStepStateUpdater } from '../editorMultiStepBridge/multiStepUpdater';
import { createBridgeDataValidationHandler } from '../editorMultiStepBridge/systemValidator';
import { createBridgeErrorHandler } from '../editorMultiStepBridge/errorSystemManager';

// 🔧 엔진 상태 인터페이스
interface BridgeEngineState {
  readonly isInitialized: boolean;
  readonly lastOperationTime: number;
  readonly operationCount: number;
  readonly currentOperationId: string | null;
}

// 🔧 엔진 컴포넌트 인터페이스
interface BridgeEngineComponents {
  readonly extractor: ReturnType<typeof createEditorStateExtractor>;
  readonly transformer: ReturnType<typeof createDataStructureTransformer>;
  readonly updater: ReturnType<typeof createMultiStepStateUpdater>;
  readonly validator: ReturnType<typeof createBridgeDataValidationHandler>;
  readonly errorHandler: ReturnType<typeof createBridgeErrorHandler>;
}

// 🔧 엔진 메트릭스 인터페이스
interface BridgeEngineMetrics {
  readonly operationDuration: number;
  readonly validationStatus: boolean;
  readonly componentStatus: Map<string, boolean>;
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
}

// 🔧 엔진 상태 정보 인터페이스
interface BridgeEngineStatus {
  readonly state: BridgeEngineState;
  readonly configuration: {
    readonly enableValidation: boolean;
    readonly debugMode: boolean;
    readonly maxRetryAttempts: number;
    readonly timeoutMs: number;
    readonly enableErrorRecovery: boolean;
  };
  readonly metrics: BridgeEngineMetrics;
  readonly isReady: boolean;
}

// 🔧 안전한 타입 변환 유틸리티
function createSafeTypeConverters() {
  const convertToSafeNumber = (
    value: unknown,
    defaultValue: number
  ): number => {
    const isValidNumber = typeof value === 'number' && !Number.isNaN(value);
    return isValidNumber ? value : defaultValue;
  };

  const convertToSafeString = (
    value: unknown,
    defaultValue: string
  ): string => {
    const isValidString = typeof value === 'string';
    return isValidString ? value : defaultValue;
  };

  const convertToSafeBoolean = (
    value: unknown,
    defaultValue: boolean
  ): boolean => {
    const isValidBoolean = typeof value === 'boolean';
    return isValidBoolean ? value : defaultValue;
  };

  const convertToAllowedErrorType = (
    errorSource: unknown
  ): string | number | boolean | object | null | undefined => {
    // Early Return: null 체크
    if (errorSource === null) {
      return null;
    }

    // Early Return: undefined 체크
    if (errorSource === undefined) {
      return undefined;
    }

    // Early Return: string 타입
    if (typeof errorSource === 'string') {
      return errorSource;
    }

    // Early Return: number 타입
    if (typeof errorSource === 'number') {
      return errorSource;
    }

    // Early Return: boolean 타입
    if (typeof errorSource === 'boolean') {
      return errorSource;
    }

    // Early Return: object 타입
    if (typeof errorSource === 'object') {
      return errorSource;
    }

    // 기타 타입을 안전하게 문자열로 변환
    try {
      return String(errorSource);
    } catch (conversionError) {
      console.warn('⚠️ [BRIDGE_ENGINE] 에러 타입 변환 실패:', conversionError);
      return 'Unknown error type';
    }
  };

  return {
    convertToSafeNumber,
    convertToSafeString,
    convertToSafeBoolean,
    convertToAllowedErrorType,
  };
}

// 🔧 엔진 검증 유틸리티
function createBridgeEngineValidators() {
  const isValidConfiguration = (
    config: unknown
  ): config is BridgeSystemConfiguration => {
    const isObjectType = config !== null && typeof config === 'object';
    if (!isObjectType) {
      return false;
    }

    const configObject = config;
    const requiredProperties = [
      'enableValidation',
      'enableErrorRecovery',
      'debugMode',
      'maxRetryAttempts',
      'timeoutMs',
    ] as const;

    const hasRequiredProperties = requiredProperties.every(
      (prop) => prop in configObject
    );

    return hasRequiredProperties;
  };

  const isValidSnapshot = (
    snapshot: unknown
  ): snapshot is EditorStateSnapshotForBridge => {
    const isObjectType = snapshot !== null && typeof snapshot === 'object';
    if (!isObjectType) {
      return false;
    }

    const snapshotObject = snapshot;
    const requiredProperties = [
      'editorContainers',
      'editorParagraphs',
      'editorCompletedContent',
      'editorIsCompleted',
      'extractedTimestamp',
    ] as const;

    const hasRequiredProperties = requiredProperties.every(
      (prop) => prop in snapshotObject
    );

    return hasRequiredProperties;
  };

  const isValidTransformationResult = (
    result: unknown
  ): result is EditorToMultiStepDataTransformationResult => {
    const isObjectType = result !== null && typeof result === 'object';
    if (!isObjectType) {
      return false;
    }

    const resultObject = result;
    const requiredProperties = [
      'transformedContent',
      'transformedIsCompleted',
      'transformationSuccess',
    ] as const;

    const hasRequiredProperties = requiredProperties.every(
      (prop) => prop in resultObject
    );

    if (!hasRequiredProperties) {
      return false;
    }

    const transformationSuccess = Reflect.get(
      resultObject,
      'transformationSuccess'
    );
    return (
      typeof transformationSuccess === 'boolean' &&
      transformationSuccess === true
    );
  };

  return {
    isValidConfiguration,
    isValidSnapshot,
    isValidTransformationResult,
  };
}

// 🔧 메인 브릿지 엔진 생성 함수
function createBridgeEngineCore(configuration: BridgeSystemConfiguration) {
  console.log('🔧 [BRIDGE_ENGINE] 핵심 엔진 생성 시작');

  const {
    convertToSafeNumber,
    convertToSafeBoolean,
    convertToAllowedErrorType,
  } = createSafeTypeConverters();
  const { isValidSnapshot, isValidTransformationResult } =
    createBridgeEngineValidators();

  let engineState: BridgeEngineState = {
    isInitialized: false,
    lastOperationTime: 0,
    operationCount: 0,
    currentOperationId: null,
  };

  let operationMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
  };

  const components: BridgeEngineComponents = {
    extractor: createEditorStateExtractor(),
    transformer: createDataStructureTransformer(),
    updater: createMultiStepStateUpdater(),
    validator: createBridgeDataValidationHandler(),
    errorHandler: createBridgeErrorHandler(),
  };

  const updateEngineState = (updates: Partial<BridgeEngineState>): void => {
    engineState = {
      ...engineState,
      ...updates,
      lastOperationTime: Date.now(),
    };
    console.log('📊 [BRIDGE_ENGINE] 엔진 상태 업데이트:', engineState);
  };

  const updateOperationMetrics = (success: boolean): void => {
    operationMetrics = {
      ...operationMetrics,
      totalOperations: operationMetrics.totalOperations + 1,
      successfulOperations: success
        ? operationMetrics.successfulOperations + 1
        : operationMetrics.successfulOperations,
      failedOperations: success
        ? operationMetrics.failedOperations
        : operationMetrics.failedOperations + 1,
    };
  };

  const validatePreconditions = (): boolean => {
    console.log('🔍 [BRIDGE_ENGINE] 사전 조건 검증 시작');

    try {
      const snapshot = components.extractor.getEditorStateWithValidation();

      // Early Return: 스냅샷이 없는 경우
      if (!snapshot) {
        console.warn('⚠️ [BRIDGE_ENGINE] 에디터 스냅샷이 없음');
        return false;
      }

      // Early Return: 유효하지 않은 스냅샷인 경우
      if (!isValidSnapshot(snapshot)) {
        console.warn('⚠️ [BRIDGE_ENGINE] 유효하지 않은 스냅샷 구조');
        return false;
      }

      const validationResult =
        components.validator.validateForTransfer(snapshot);
      const { isValidForTransfer = false } = validationResult;

      console.log('✅ [BRIDGE_ENGINE] 사전 조건 검증 완료:', {
        isValidForTransfer,
      });
      return isValidForTransfer;
    } catch (validationError) {
      console.error('❌ [BRIDGE_ENGINE] 사전 조건 검증 실패:', validationError);
      return false;
    }
  };

  const executeTransferOperation =
    async (): Promise<BridgeOperationExecutionResult> => {
      console.log('🚀 [BRIDGE_ENGINE] 전송 작업 실행 시작');
      const operationStartTime = performance.now();
      const operationId = `bridge_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      updateEngineState({
        currentOperationId: operationId,
        operationCount: engineState.operationCount + 1,
      });

      try {
        // 1단계: 사전 조건 확인
        const canProceed = validatePreconditions();
        if (!canProceed) {
          throw new Error('사전 조건 검증 실패');
        }

        // 2단계: 데이터 추출
        const snapshot = components.extractor.getEditorStateWithValidation();
        if (!snapshot) {
          throw new Error('에디터 데이터 추출 실패');
        }

        // 3단계: 데이터 변환
        const transformationResult =
          components.transformer.transformEditorStateToMultiStep(snapshot);

        // Early Return: 변환 결과 검증
        if (!isValidTransformationResult(transformationResult)) {
          const { transformationErrors = [] } = transformationResult;
          throw new Error(`변환 실패: ${transformationErrors.join(', ')}`);
        }

        // 4단계: 상태 업데이트
        const updateSuccess =
          await components.updater.performCompleteStateUpdate(
            transformationResult
          );

        // Early Return: 업데이트 실패인 경우
        if (!updateSuccess) {
          throw new Error('MultiStep 상태 업데이트 실패');
        }

        const operationEndTime = performance.now();
        const operationDuration = operationEndTime - operationStartTime;

        updateOperationMetrics(true);
        updateEngineState({
          currentOperationId: null,
        });

        const successMetadata = new Map<string, unknown>();
        successMetadata.set('operationId', operationId);
        successMetadata.set('processingTimeMs', operationDuration);
        successMetadata.set('transformationSuccess', true);
        successMetadata.set('componentStatus', 'all_operational');

        const performanceProfile = new Map<string, number>();
        performanceProfile.set('totalDuration', operationDuration);
        performanceProfile.set('extractionPhase', 0); // 실제 측정 시 업데이트 필요
        performanceProfile.set('transformationPhase', 0);
        performanceProfile.set('updatePhase', 0);

        const resourceUsage = new Map<string, number>();
        resourceUsage.set('memoryUsed', 0); // 실제 측정 시 업데이트 필요
        resourceUsage.set('cpuTime', operationDuration);

        console.log('✅ [BRIDGE_ENGINE] 전송 작업 성공:', {
          operationId,
          duration: `${operationDuration.toFixed(2)}ms`,
          operationCount: engineState.operationCount,
        });

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: [],
          transferredData: transformationResult,
          operationDuration,
          executionMetadata: successMetadata,
          performanceProfile,
          resourceUsage,
        };
      } catch (operationError) {
        const operationEndTime = performance.now();
        const operationDuration = operationEndTime - operationStartTime;

        updateOperationMetrics(false);
        updateEngineState({
          currentOperationId: null,
        });

        const errorMessage =
          operationError instanceof Error
            ? operationError.message
            : 'Unknown operation error';

        console.error('❌ [BRIDGE_ENGINE] 전송 작업 실패:', {
          operationId,
          error: errorMessage,
          duration: `${operationDuration.toFixed(2)}ms`,
        });

        const safeErrorForHandler = convertToAllowedErrorType(operationError);
        const errorDetails =
          components.errorHandler.handleTransferError(safeErrorForHandler);

        const failureMetadata = new Map<string, unknown>();
        failureMetadata.set('operationId', operationId);
        failureMetadata.set('processingTimeMs', operationDuration);
        failureMetadata.set('transformationSuccess', false);
        failureMetadata.set('errorOccurred', true);

        const performanceProfile = new Map<string, number>();
        performanceProfile.set('totalDuration', operationDuration);
        performanceProfile.set('errorOccurredAt', operationDuration);

        const resourceUsage = new Map<string, number>();
        resourceUsage.set('cpuTime', operationDuration);

        return {
          operationSuccess: false,
          operationErrors: [errorDetails],
          operationWarnings: [],
          transferredData: null,
          operationDuration,
          executionMetadata: failureMetadata,
          performanceProfile,
          resourceUsage,
        };
      }
    };

  const generateEngineMetrics = (): BridgeEngineMetrics => {
    console.log('📊 [BRIDGE_ENGINE] 엔진 메트릭 생성');

    const componentStatusMap = new Map<string, boolean>();
    componentStatusMap.set('extractor', Boolean(components.extractor));
    componentStatusMap.set('transformer', Boolean(components.transformer));
    componentStatusMap.set('updater', Boolean(components.updater));
    componentStatusMap.set('validator', Boolean(components.validator));
    componentStatusMap.set('errorHandler', Boolean(components.errorHandler));

    const allComponentsOperational = Array.from(
      componentStatusMap.values()
    ).every((status) => status);

    return {
      operationDuration: engineState.lastOperationTime,
      validationStatus: allComponentsOperational,
      componentStatus: componentStatusMap,
      totalOperations: operationMetrics.totalOperations,
      successfulOperations: operationMetrics.successfulOperations,
      failedOperations: operationMetrics.failedOperations,
    };
  };

  const initializeEngine = (): boolean => {
    console.log('🔧 [BRIDGE_ENGINE] 엔진 초기화');

    try {
      const allComponentsReady = Object.values(components).every(
        (component) => component !== null
      );

      // Early Return: 컴포넌트가 준비되지 않은 경우
      if (!allComponentsReady) {
        console.error('❌ [BRIDGE_ENGINE] 일부 컴포넌트가 초기화되지 않음');
        return false;
      }

      updateEngineState({
        isInitialized: true,
        operationCount: 0,
      });

      console.log('✅ [BRIDGE_ENGINE] 엔진 초기화 완료');
      return true;
    } catch (initError) {
      console.error('❌ [BRIDGE_ENGINE] 엔진 초기화 실패:', initError);
      return false;
    }
  };

  const getEngineStatus = (): BridgeEngineStatus => {
    // 🔧 구조분해할당 + Fallback으로 안전한 설정 추출
    const {
      enableValidation = false,
      debugMode = false,
      maxRetryAttempts: configMaxRetry = 3,
      timeoutMs: configTimeout = 5000,
      enableErrorRecovery = false,
    } = configuration;

    return {
      state: engineState,
      configuration: {
        enableValidation,
        debugMode,
        maxRetryAttempts: convertToSafeNumber(configMaxRetry, 3),
        timeoutMs: convertToSafeNumber(configTimeout, 5000),
        enableErrorRecovery: convertToSafeBoolean(enableErrorRecovery, false),
      },
      metrics: generateEngineMetrics(),
      isReady: engineState.isInitialized && validatePreconditions(),
    };
  };

  const getEngineComponents = (): BridgeEngineComponents => {
    return { ...components };
  };

  // 엔진 초기화 실행
  const initSuccess = initializeEngine();
  if (!initSuccess) {
    throw new Error('Bridge Engine 초기화 실패');
  }

  return {
    executeTransfer: executeTransferOperation,
    checkPreconditions: validatePreconditions,
    getStatus: getEngineStatus,
    getConfiguration: () => ({ ...configuration }),
    getComponents: getEngineComponents,
    isInitialized: () => engineState.isInitialized,
    getCurrentOperationId: () => engineState.currentOperationId,
    getMetrics: generateEngineMetrics,
  };
}

// 🔧 메인 팩토리 함수
export function createBridgeEngine(
  customConfiguration?: Partial<BridgeSystemConfiguration>
) {
  console.log('🏭 [BRIDGE_ENGINE] Bridge 엔진 팩토리 시작');

  const { isValidConfiguration } = createBridgeEngineValidators();

  const defaultConfiguration: BridgeSystemConfiguration = {
    enableValidation: true,
    enableErrorRecovery: true,
    debugMode: false,
    maxRetryAttempts: 3,
    timeoutMs: 5000,
    performanceLogging: false,
    strictTypeChecking: true,
    customValidationRules: new Map(),
    featureFlags: new Set(),
  };

  const mergedConfiguration = customConfiguration
    ? { ...defaultConfiguration, ...customConfiguration }
    : defaultConfiguration;

  // Early Return: 유효하지 않은 설정인 경우
  if (!isValidConfiguration(mergedConfiguration)) {
    console.error('❌ [BRIDGE_ENGINE] 유효하지 않은 설정으로 기본값 사용');
    return createBridgeEngineCore(defaultConfiguration);
  }

  console.log('✅ [BRIDGE_ENGINE] Bridge 엔진 생성 완료:', {
    enableValidation: mergedConfiguration.enableValidation,
    debugMode: mergedConfiguration.debugMode,
    maxRetryAttempts: mergedConfiguration.maxRetryAttempts,
  });

  return createBridgeEngineCore(mergedConfiguration);
}

console.log('🏗️ [BRIDGE_ENGINE] 브릿지 엔진 모듈 초기화 완료');
console.log('📊 [BRIDGE_ENGINE] 제공 기능:', {
  transferExecution: '에디터 → 멀티스텝 전송',
  preconditionValidation: '사전 조건 검증',
  componentManagement: '컴포넌트 생명주기 관리',
  errorHandling: '통합 에러 처리',
  performanceMonitoring: '성능 메트릭스 추적',
});
console.log('✅ [BRIDGE_ENGINE] 모든 엔진 기능 준비 완료');
