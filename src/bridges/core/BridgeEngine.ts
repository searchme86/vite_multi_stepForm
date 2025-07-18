// bridges/core/BridgeEngine.ts

import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  EditorStateSnapshotForBridge,
} from '../editorMultiStepBridge/bridgeDataTypes';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorDataExtractor';
import { createDataStructureTransformer } from '../editorMultiStepBridge/editorToMultiStepTransformer';
import { createMultiStepStateUpdater } from '../editorMultiStepBridge/multiStepDataUpdater';
import { createBridgeDataValidationHandler } from '../editorMultiStepBridge/bridgeDataValidator';
import { createBridgeErrorHandler } from '../editorMultiStepBridge/bridgeErrorManager';

interface BridgeEngineState {
  readonly isInitialized: boolean;
  readonly lastOperationTime: number;
  readonly operationCount: number;
}

interface BridgeEngineComponents {
  readonly extractor: ReturnType<typeof createEditorStateExtractor>;
  readonly transformer: ReturnType<typeof createDataStructureTransformer>;
  readonly updater: ReturnType<typeof createMultiStepStateUpdater>;
  readonly validator: ReturnType<typeof createBridgeDataValidationHandler>;
  readonly errorHandler: ReturnType<typeof createBridgeErrorHandler>;
}

interface BridgeEngineMetrics {
  readonly operationDuration: number;
  readonly validationStatus: boolean;
  readonly componentStatus: Map<string, boolean>;
}

function createSafeTypeConverters() {
  type AllowedErrorType = string | number | boolean | object | null | undefined;

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
  ): AllowedErrorType => {
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

function createBridgeEngineValidators() {
  const isValidConfiguration = (
    config: unknown
  ): config is BridgeSystemConfiguration => {
    const isObjectType = config !== null && typeof config === 'object';
    if (!isObjectType) {
      return false;
    }

    const configObject = config;
    const hasRequiredProperties = [
      'enableValidation',
      'enableErrorRecovery',
      'debugMode',
      'maxRetryAttempts',
      'timeoutMs',
    ].every((prop) => prop in configObject);

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
    const hasRequiredProperties = [
      'editorContainers',
      'editorParagraphs',
      'editorCompletedContent',
      'editorIsCompleted',
      'extractedTimestamp',
    ].every((prop) => prop in snapshotObject);

    return hasRequiredProperties;
  };

  return {
    isValidConfiguration,
    isValidSnapshot,
  };
}

function createBridgeEngineCore(configuration: BridgeSystemConfiguration) {
  console.log('🔧 [BRIDGE_ENGINE] 핵심 엔진 생성 시작');

  const {
    convertToSafeNumber,
    convertToSafeBoolean,
    convertToAllowedErrorType,
  } = createSafeTypeConverters();
  const { isValidSnapshot } = createBridgeEngineValidators();

  let engineState: BridgeEngineState = {
    isInitialized: false,
    lastOperationTime: 0,
    operationCount: 0,
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
        const { transformationSuccess = false, transformationErrors = [] } =
          transformationResult;

        // Early Return: 변환 실패인 경우
        if (!transformationSuccess) {
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

        updateEngineState({
          operationCount: engineState.operationCount + 1,
        });

        const successMetadata = new Map<string, unknown>([
          ['operationId', `bridge_${Date.now()}`],
          ['processingTimeMs', operationDuration],
          ['transformationSuccess', true],
          ['componentStatus', 'all_operational'],
        ]);

        console.log('✅ [BRIDGE_ENGINE] 전송 작업 성공:', {
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
        };
      } catch (operationError) {
        const operationEndTime = performance.now();
        const operationDuration = operationEndTime - operationStartTime;

        const errorMessage =
          operationError instanceof Error
            ? operationError.message
            : 'Unknown operation error';

        console.error('❌ [BRIDGE_ENGINE] 전송 작업 실패:', {
          error: errorMessage,
          duration: `${operationDuration.toFixed(2)}ms`,
        });

        const safeErrorForHandler = convertToAllowedErrorType(operationError);
        const errorDetails =
          components.errorHandler.handleTransferError(safeErrorForHandler);

        const failureMetadata = new Map<string, unknown>([
          ['operationId', `bridge_error_${Date.now()}`],
          ['processingTimeMs', operationDuration],
          ['transformationSuccess', false],
          ['errorOccurred', true],
        ]);

        return {
          operationSuccess: false,
          operationErrors: [errorDetails],
          operationWarnings: [],
          transferredData: null,
          operationDuration,
          executionMetadata: failureMetadata,
        };
      }
    };

  const generateEngineMetrics = (): BridgeEngineMetrics => {
    console.log('📊 [BRIDGE_ENGINE] 엔진 메트릭 생성');

    const componentStatusMap = new Map<string, boolean>([
      ['extractor', Boolean(components.extractor)],
      ['transformer', Boolean(components.transformer)],
      ['updater', Boolean(components.updater)],
      ['validator', Boolean(components.validator)],
      ['errorHandler', Boolean(components.errorHandler)],
    ]);

    const allComponentsOperational = Array.from(
      componentStatusMap.values()
    ).every((status) => status);

    return {
      operationDuration: engineState.lastOperationTime,
      validationStatus: allComponentsOperational,
      componentStatus: componentStatusMap,
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

  const getEngineStatus = () => {
    const { enableValidation = false, debugMode = false } = configuration;

    return {
      state: engineState,
      configuration: {
        enableValidation,
        debugMode,
        maxRetryAttempts: convertToSafeNumber(
          configuration.maxRetryAttempts,
          3
        ),
        timeoutMs: convertToSafeNumber(configuration.timeoutMs, 5000),
        enableErrorRecovery: convertToSafeBoolean(
          configuration.enableErrorRecovery,
          false
        ),
      },
      metrics: generateEngineMetrics(),
      isReady: engineState.isInitialized && validatePreconditions(),
    };
  };

  // 엔진 초기화 실행
  initializeEngine();

  return {
    executeTransfer: executeTransferOperation,
    checkPreconditions: validatePreconditions,
    getStatus: getEngineStatus,
    getConfiguration: () => configuration,
    isInitialized: () => engineState.isInitialized,
  };
}

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
  };

  const finalConfiguration = customConfiguration
    ? { ...defaultConfiguration, ...customConfiguration }
    : defaultConfiguration;

  // Early Return: 유효하지 않은 설정인 경우
  if (!isValidConfiguration(finalConfiguration)) {
    console.error('❌ [BRIDGE_ENGINE] 유효하지 않은 설정으로 기본값 사용');
    return createBridgeEngineCore(defaultConfiguration);
  }

  console.log('✅ [BRIDGE_ENGINE] Bridge 엔진 생성 완료:', finalConfiguration);
  return createBridgeEngineCore(finalConfiguration);
}
