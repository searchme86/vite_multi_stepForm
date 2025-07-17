// bridges/editorMultiStepBridge/bidirectionalBridgeOrchestrator.ts

import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
} from './bridgeDataTypes';
import { bridgeConfigManager } from './bridgeConfiguration';
import { createEditorStateExtractor } from './editorDataExtractor';
import { createDataStructureTransformer } from './editorToMultiStepTransformer';
import { createMultiStepStateUpdater } from './multiStepDataUpdater';
import { createBridgeDataValidationHandler } from './bridgeDataValidator';
import { createBridgeErrorHandler } from './bridgeErrorManager';

interface BridgeExecutionContext {
  readonly startTime: number;
  readonly operationId: string;
}

interface TransferPreconditionResult {
  readonly isValid: boolean;
  readonly reason: string;
  readonly details?: Map<string, string | number | boolean>;
}

type AllowedErrorType = string | number | boolean | object | null | undefined;

type ExecutionMetadataValue = string | number | boolean;

// 🔧 P1-4: 타입 가드 함수 강화
function createTypeGuardModule() {
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidNumber = (value: unknown): value is number => {
    return typeof value === 'number' && !Number.isNaN(value);
  };

  const isValidBoolean = (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const isValidMap = (
    candidate: unknown
  ): candidate is Map<string, unknown> => {
    return candidate instanceof Map;
  };

  const isValidSet = (candidate: unknown): candidate is Set<unknown> => {
    return candidate instanceof Set;
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidMap,
    isValidSet,
  };
}

// 🔧 P1-5: 에러 처리 강화
function createAdvancedErrorHandlerModule() {
  // 🔧 수정: isValidString, isValidObject 재사용 대신 직접 정의
  const isValidString = (value: unknown): value is string => {
    return typeof value === 'string';
  };

  const isValidObject = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  };

  const safelyExecuteOperation = <T>(
    operation: () => T,
    fallbackValue: T,
    operationName: string
  ): T => {
    try {
      return operation();
    } catch (operationError) {
      console.error(`❌ [${operationName}] 실행 실패:`, operationError);
      return fallbackValue;
    }
  };

  const withTimeout = <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      ),
    ]);
  };

  const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Early Return: 마지막 시도인 경우
        if (attempt === maxRetries) {
          break;
        }

        console.warn(`⚠️ 시도 ${attempt} 실패, ${delayMs}ms 후 재시도:`, error);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError!;
  };

  return {
    safelyExecuteOperation,
    withTimeout,
    withRetry,
    isValidString,
    isValidObject,
  };
}

function createErrorConverterModule() {
  const { isValidString, isValidNumber, isValidBoolean, isValidObject } =
    createTypeGuardModule();

  const convertErrorToValidType = (errorSource: unknown): AllowedErrorType => {
    // Early Return: null 체크
    if (errorSource === null) {
      return null;
    }

    // Early Return: undefined 체크
    if (errorSource === undefined) {
      return undefined;
    }

    // Early Return: string 타입
    if (isValidString(errorSource)) {
      return errorSource;
    }

    // Early Return: number 타입
    if (isValidNumber(errorSource)) {
      return errorSource;
    }

    // Early Return: boolean 타입
    if (isValidBoolean(errorSource)) {
      return errorSource;
    }

    // Early Return: object 타입
    if (isValidObject(errorSource)) {
      return errorSource;
    }

    // 🔧 P1-5: 안전한 변환 with 에러 처리
    return safelyConvertToString(errorSource);
  };

  const safelyConvertToString = (value: unknown): string => {
    try {
      return String(value);
    } catch (conversionError) {
      console.warn('⚠️ [ORCHESTRATOR] 에러 변환 실패:', conversionError);
      return 'Unknown error occurred';
    }
  };

  return { convertErrorToValidType };
}

function createErrorHandlerModule() {
  const { convertErrorToValidType } = createErrorConverterModule();
  const { safelyExecuteOperation, isValidObject } =
    createAdvancedErrorHandlerModule();

  const handleBridgeTransferError = (
    errorSource: unknown,
    bridgeErrorHandler: ReturnType<typeof createBridgeErrorHandler>
  ) => {
    console.log('🔍 [ORCHESTRATOR] 에러 타입 분석:', {
      errorType: typeof errorSource,
      isError: errorSource instanceof Error,
      hasMessage: isValidErrorMessage(errorSource),
    });

    const convertedError = convertErrorToValidType(errorSource);

    // 🔧 P1-5: 안전한 에러 핸들러 실행
    return safelyExecuteOperation(
      () => bridgeErrorHandler.handleTransferError(convertedError),
      bridgeErrorHandler.handleTransferError('Error handler execution failed'),
      'ERROR_HANDLER'
    );
  };

  const isValidErrorMessage = (errorSource: unknown): boolean => {
    // 🔧 수정: isValidObject 사용 시 타입 안전성 확보
    if (!errorSource || typeof errorSource !== 'object') {
      return false;
    }
    return isValidObject(errorSource) && 'message' in errorSource;
  };

  return { handleBridgeTransferError };
}

// 🔧 수정: 함수 시그니처 및 매개변수 타입 정의 수정
function createPreconditionCheckerModule(
  editorStateExtractor: ReturnType<typeof createEditorStateExtractor>,
  bridgeDataValidationHandler: ReturnType<
    typeof createBridgeDataValidationHandler
  >
) {
  const { safelyExecuteOperation } = createAdvancedErrorHandlerModule();

  const checkTransferPreconditions = (): boolean => {
    return safelyExecuteOperation(
      () => {
        const editorStateSnapshot =
          editorStateExtractor.getEditorStateWithValidation();

        // Early Return: 스냅샷이 없는 경우
        if (!editorStateSnapshot) {
          return false;
        }

        const { isValidForTransfer } =
          bridgeDataValidationHandler.validateForTransfer(editorStateSnapshot);
        return isValidForTransfer;
      },
      false,
      'PRECONDITION_CHECK'
    );
  };

  const checkDetailedTransferPreconditions = (): TransferPreconditionResult => {
    return safelyExecuteOperation(
      () => {
        const editorStateSnapshot =
          editorStateExtractor.getEditorStateWithValidation();

        // Early Return: 스냅샷이 없는 경우
        if (!editorStateSnapshot) {
          const detailsMap = new Map<string, string | number | boolean>();
          detailsMap.set('message', '에디터 상태를 추출할 수 없습니다');

          return {
            isValid: false,
            reason: 'EDITOR_STATE_NOT_AVAILABLE',
            details: detailsMap,
          };
        }

        const validationResult =
          bridgeDataValidationHandler.validateForTransfer(editorStateSnapshot);

        // 🔧 P1-3: 구조분해할당 + Fallback 적용
        const {
          isValidForTransfer = false,
          validationErrors = [],
          validationWarnings = [],
        } = validationResult;

        const {
          editorContainers: containerList = [],
          editorParagraphs: paragraphList = [],
          editorCompletedContent: completedContent = '',
        } = editorStateSnapshot;

        // Early Return: 검증 실패인 경우
        if (!isValidForTransfer) {
          const failureDetailsMap = new Map<
            string,
            string | number | boolean
          >();
          failureDetailsMap.set('errors', validationErrors.join(', '));
          failureDetailsMap.set('warnings', validationWarnings.join(', '));
          failureDetailsMap.set('containerCount', containerList.length);
          failureDetailsMap.set('paragraphCount', paragraphList.length);

          return {
            isValid: false,
            reason: 'VALIDATION_FAILED',
            details: failureDetailsMap,
          };
        }

        const successDetailsMap = new Map<string, string | number | boolean>();
        successDetailsMap.set('containerCount', containerList.length);
        successDetailsMap.set('paragraphCount', paragraphList.length);
        successDetailsMap.set('contentLength', completedContent.length);

        return {
          isValid: true,
          reason: 'VALIDATION_PASSED',
          details: successDetailsMap,
        };
      },
      {
        isValid: false,
        reason: 'PRECONDITION_CHECK_ERROR',
        details: new Map([['error', 'Failed to check preconditions']]),
      },
      'DETAILED_PRECONDITION_CHECK'
    );
  };

  return {
    checkTransferPreconditions,
    checkDetailedTransferPreconditions,
  };
}

function createExecutionContextModule() {
  const createExecutionContext = (): BridgeExecutionContext => {
    const executionStartTime = performance.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const operationIdentifier = `bridge_${Date.now()}_${randomSuffix}`;

    return {
      startTime: executionStartTime,
      operationId: operationIdentifier,
    };
  };

  return { createExecutionContext };
}

// 🔧 수정: 함수 시그니처 및 매개변수 타입 정의 수정
function createBridgeTransferModule(
  editorStateExtractor: ReturnType<typeof createEditorStateExtractor>,
  bridgeDataValidationHandler: ReturnType<
    typeof createBridgeDataValidationHandler
  >,
  dataStructureTransformer: ReturnType<typeof createDataStructureTransformer>,
  multiStepStateUpdater: ReturnType<typeof createMultiStepStateUpdater>
) {
  const { createExecutionContext } = createExecutionContextModule();
  const { handleBridgeTransferError } = createErrorHandlerModule();
  const { withTimeout, withRetry } = createAdvancedErrorHandlerModule();

  // 🔧 P1-3: 구조분해할당을 위한 메타데이터 생성 함수 개선
  const createSuccessMetadata = (
    operationId: string,
    operationDuration: number,
    validationWarningsCount: number
  ): Map<string, ExecutionMetadataValue> => {
    return new Map<string, ExecutionMetadataValue>([
      ['operationId', operationId],
      ['processingTimeMs', operationDuration],
      ['validationWarningsCount', validationWarningsCount],
      ['transformationSuccess', true],
    ]);
  };

  const createFailureMetadata = (
    operationId: string,
    operationDuration: number
  ): Map<string, ExecutionMetadataValue> => {
    return new Map<string, ExecutionMetadataValue>([
      ['operationId', operationId],
      ['processingTimeMs', operationDuration],
      ['errorOccurred', true],
      ['transformationSuccess', false],
    ]);
  };

  const executeBridgeTransfer =
    async (): Promise<BridgeOperationExecutionResult> => {
      // 🔧 P1-3: 구조분해할당으로 컨텍스트 추출
      const { startTime: operationStartTime, operationId } =
        createExecutionContext();

      console.log('🚀 [ORCHESTRATOR] Bridge 전송 시작:', { operationId });

      try {
        // 🔧 P1-5: 타임아웃과 함께 실행
        const transferResult = await withTimeout(
          executeTransferWithRetry(operationStartTime, operationId),
          5000,
          'Bridge 전송 타임아웃'
        );

        return transferResult;
      } catch (bridgeTransferError) {
        return handleTransferError(
          bridgeTransferError,
          operationStartTime,
          operationId
        );
      }
    };

  const executeTransferWithRetry = async (
    operationStartTime: number,
    operationId: string
  ): Promise<BridgeOperationExecutionResult> => {
    return withRetry(
      async () => {
        const editorStateSnapshot =
          editorStateExtractor.getEditorStateWithValidation();

        // Early Return: 상태 추출 실패
        if (!editorStateSnapshot) {
          throw new Error('Editor 상태 추출 실패');
        }

        const validationResult =
          bridgeDataValidationHandler.validateForTransfer(editorStateSnapshot);

        // 🔧 P1-3: 구조분해할당 + Fallback
        const {
          isValidForTransfer = false,
          validationErrors = [],
          validationWarnings = [],
        } = validationResult;

        // Early Return: 검증 실패
        if (!isValidForTransfer) {
          throw new Error(`검증 실패: ${validationErrors.join(', ')}`);
        }

        const transformationResult =
          dataStructureTransformer.transformEditorStateToMultiStep(
            editorStateSnapshot
          );

        // 🔧 P1-3: 구조분해할당 + Fallback
        const { transformationSuccess = false, transformationErrors = [] } =
          transformationResult;

        // Early Return: 변환 실패
        if (!transformationSuccess) {
          throw new Error(`변환 실패: ${transformationErrors.join(', ')}`);
        }

        // 🚨 핵심 수정: MultiStep 상태 업데이트 에러 처리 강화
        console.log('🔄 [ORCHESTRATOR] MultiStep 상태 업데이트 시작');

        let updateOperationSuccess = false;
        let updateErrorDetails = '';

        try {
          updateOperationSuccess =
            await multiStepStateUpdater.performCompleteStateUpdate(
              transformationResult
            );
        } catch (updateError) {
          const errorMessage =
            updateError instanceof Error
              ? updateError.message
              : String(updateError);
          updateErrorDetails = `MultiStep 업데이트 실행 중 예외: ${errorMessage}`;
          console.error(
            '❌ [ORCHESTRATOR] MultiStep 업데이트 예외:',
            updateError
          );
          throw new Error(updateErrorDetails);
        }

        // Early Return: 업데이트 실패
        if (!updateOperationSuccess) {
          updateErrorDetails =
            'MultiStep 상태 업데이트가 false를 반환했습니다. 스토어 상태, formValues 검증, 또는 업데이트 함수에 문제가 있을 수 있습니다.';
          console.error(
            '❌ [ORCHESTRATOR] MultiStep 업데이트 실패:',
            updateErrorDetails
          );
          throw new Error(updateErrorDetails);
        }

        console.log('✅ [ORCHESTRATOR] MultiStep 상태 업데이트 성공');

        const operationEndTime = performance.now();
        const operationDuration = operationEndTime - operationStartTime;

        console.log('✅ [ORCHESTRATOR] Bridge 전송 완료:', {
          operationId,
          duration: `${operationDuration.toFixed(2)}ms`,
        });

        const executionMetadata = createSuccessMetadata(
          operationId,
          operationDuration,
          validationWarnings.length
        );

        return {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: [...validationWarnings],
          transferredData: transformationResult,
          operationDuration,
          executionMetadata,
        } satisfies BridgeOperationExecutionResult;
      },
      2, // 최대 2회 재시도
      1000 // 1초 대기
    );
  };

  const handleTransferError = (
    bridgeTransferError: unknown,
    operationStartTime: number,
    operationId: string
  ): BridgeOperationExecutionResult => {
    const operationEndTime = performance.now();
    const operationDuration = operationEndTime - operationStartTime;

    // 🚨 핵심 수정: 더 구체적인 에러 메시지 제공
    let detailedErrorMessage = 'Bridge 전송 실패';
    if (bridgeTransferError instanceof Error) {
      detailedErrorMessage = `Bridge 전송 실패: ${bridgeTransferError.message}`;
    } else if (typeof bridgeTransferError === 'string') {
      detailedErrorMessage = `Bridge 전송 실패: ${bridgeTransferError}`;
    }

    console.error('❌ [ORCHESTRATOR] Bridge 전송 실패:', {
      operationId,
      error: bridgeTransferError,
      duration: `${operationDuration.toFixed(2)}ms`,
      detailedMessage: detailedErrorMessage,
    });

    const bridgeErrorHandler = createBridgeErrorHandler();
    const errorDetails = handleBridgeTransferError(
      bridgeTransferError,
      bridgeErrorHandler
    );

    const failureExecutionMetadata = createFailureMetadata(
      operationId,
      operationDuration
    );

    return {
      operationSuccess: false,
      operationErrors: [errorDetails],
      operationWarnings: [],
      transferredData: null,
      operationDuration,
      executionMetadata: failureExecutionMetadata,
    } satisfies BridgeOperationExecutionResult;
  };

  return { executeBridgeTransfer };
}

// 🔧 수정: 함수 시그니처 및 매개변수 타입 정의 수정
function createDiagnosticModule(
  preconditionChecker: ReturnType<typeof createPreconditionCheckerModule>,
  bridgeConfiguration: BridgeSystemConfiguration,
  editorStateExtractor: ReturnType<typeof createEditorStateExtractor>,
  dataStructureTransformer: ReturnType<typeof createDataStructureTransformer>,
  multiStepStateUpdater: ReturnType<typeof createMultiStepStateUpdater>,
  bridgeDataValidationHandler: ReturnType<
    typeof createBridgeDataValidationHandler
  >,
  bridgeErrorHandler: ReturnType<typeof createBridgeErrorHandler>
) {
  const { safelyExecuteOperation } = createAdvancedErrorHandlerModule();

  const diagnoseBridgeStatus = () => {
    console.log('🔍 [ORCHESTRATOR] 브릿지 상태 진단 시작');

    return safelyExecuteOperation(
      () => {
        const preconditionResult =
          preconditionChecker.checkDetailedTransferPreconditions();
        const currentConfig = bridgeConfiguration;

        // 🔧 P1-3: 구조분해할당으로 컴포넌트 상태 맵 생성
        const componentStatusMap = new Map([
          ['extractor', Boolean(editorStateExtractor)],
          ['transformer', Boolean(dataStructureTransformer)],
          ['updater', Boolean(multiStepStateUpdater)],
          ['validator', Boolean(bridgeDataValidationHandler)],
          ['errorHandler', Boolean(bridgeErrorHandler)],
        ]);

        const diagnosticResult = {
          preconditions: preconditionResult,
          configuration: currentConfig,
          components: Object.fromEntries(componentStatusMap),
          timestamp: new Date().toISOString(),
        };

        console.log('📊 [ORCHESTRATOR] 브릿지 진단 완료:', diagnosticResult);
        return diagnosticResult;
      },
      null,
      'BRIDGE_DIAGNOSIS'
    );
  };

  const verifyComponentsInitialization = (): boolean => {
    return safelyExecuteOperation(
      () => {
        // 🔧 P1-3: 구조분해할당으로 컴포넌트 체크
        const componentChecks = new Map([
          ['extractor', Boolean(editorStateExtractor)],
          ['transformer', Boolean(dataStructureTransformer)],
          ['updater', Boolean(multiStepStateUpdater)],
          ['validator', Boolean(bridgeDataValidationHandler)],
          ['errorHandler', Boolean(bridgeErrorHandler)],
        ]);

        const allComponentsInitialized = Array.from(
          componentChecks.values()
        ).every(Boolean);

        console.log('🔍 [ORCHESTRATOR] 컴포넌트 초기화 상태:', {
          components: Object.fromEntries(componentChecks),
          allInitialized: allComponentsInitialized,
        });

        return allComponentsInitialized;
      },
      false,
      'COMPONENT_VERIFICATION'
    );
  };

  return {
    diagnoseBridgeStatus,
    verifyComponentsInitialization,
  };
}

export function createEditorMultiStepBridgeOrchestrator(
  customConfigurationOptions?: Partial<BridgeSystemConfiguration>
) {
  // 🔧 P1-2: 삼항연산자 적용
  const hasCustomConfig = customConfigurationOptions ? true : false;
  const baseConfiguration = bridgeConfigManager.createSimpleConfiguration();

  // 🔧 P1-3: 구조분해할당 + Fallback으로 설정 병합
  const bridgeConfiguration = hasCustomConfig
    ? { ...baseConfiguration, ...customConfigurationOptions }
    : baseConfiguration;

  // 🔧 P1-3: 구조분해할당으로 모듈 인스턴스 생성
  const editorStateExtractor = createEditorStateExtractor();
  const dataStructureTransformer = createDataStructureTransformer();
  const multiStepStateUpdater = createMultiStepStateUpdater();
  const bridgeDataValidationHandler = createBridgeDataValidationHandler();
  const bridgeErrorHandler = createBridgeErrorHandler();

  const preconditionChecker = createPreconditionCheckerModule(
    editorStateExtractor,
    bridgeDataValidationHandler
  );

  const bridgeTransferExecutor = createBridgeTransferModule(
    editorStateExtractor,
    bridgeDataValidationHandler,
    dataStructureTransformer,
    multiStepStateUpdater
  );

  const diagnosticModule = createDiagnosticModule(
    preconditionChecker,
    bridgeConfiguration,
    editorStateExtractor,
    dataStructureTransformer,
    multiStepStateUpdater,
    bridgeDataValidationHandler,
    bridgeErrorHandler
  );

  const getCurrentConfiguration = (): BridgeSystemConfiguration =>
    bridgeConfiguration;

  return {
    executeBridgeTransfer: bridgeTransferExecutor.executeBridgeTransfer,
    checkTransferPreconditions: preconditionChecker.checkTransferPreconditions,
    checkDetailedTransferPreconditions:
      preconditionChecker.checkDetailedTransferPreconditions,
    getConfiguration: getCurrentConfiguration,
    diagnoseBridgeStatus: diagnosticModule.diagnoseBridgeStatus,
    verifyComponentsInitialization:
      diagnosticModule.verifyComponentsInitialization,
  };
}
