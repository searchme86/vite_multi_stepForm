// bridges/core/SyncEngine.ts

import type {
  BidirectionalSyncResult,
  EditorStateSnapshotForBridge,
  MultiStepFormSnapshotForBridge,
  EditorToMultiStepDataTransformationResult,
  MultiStepToEditorDataTransformationResult,
} from '../editorMultiStepBridge/bridgeDataTypes';

// 🔧 동기화 전략 인터페이스 - 플러그인 방식으로 교체 가능
interface SyncStrategy {
  readonly name: string;
  readonly priority: number;
  canExecute: (context: SyncExecutionContext) => boolean;
  execute: (context: SyncExecutionContext) => Promise<SyncExecutionResult>;
}

// 🔧 동기화 실행 컨텍스트
interface SyncExecutionContext {
  readonly direction: SyncDirection;
  readonly editorData?: EditorStateSnapshotForBridge;
  readonly multiStepData?: MultiStepFormSnapshotForBridge;
  readonly options: SyncExecutionOptions;
  readonly metadata: Map<string, unknown>;
}

// 🔧 동기화 실행 결과
interface SyncExecutionResult {
  readonly success: boolean;
  readonly data?:
    | EditorToMultiStepDataTransformationResult
    | MultiStepToEditorDataTransformationResult;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly metadata: Map<string, unknown>;
}

// 🔧 동기화 방향 타입
type SyncDirection =
  | 'EDITOR_TO_MULTISTEP'
  | 'MULTISTEP_TO_EDITOR'
  | 'BIDIRECTIONAL';

// 🔧 동기화 실행 옵션
interface SyncExecutionOptions {
  readonly timeoutMs: number;
  readonly retryCount: number;
  readonly validateInput: boolean;
  readonly validateOutput: boolean;
  readonly enableLogging: boolean;
}

// 🔧 동기화 상태 인터페이스
interface SyncEngineState {
  readonly isActive: boolean;
  readonly currentOperation: SyncDirection | null;
  readonly lastOperationTimestamp: number;
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly activeStrategies: readonly string[];
}

// 🔧 동기화 엔진 설정
interface SyncEngineConfiguration {
  readonly enableRetry: boolean;
  readonly maxRetryAttempts: number;
  readonly defaultTimeoutMs: number;
  readonly enableValidation: boolean;
  readonly enableStateTracking: boolean;
  readonly logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
}

// 🔧 타입 가드 함수들
function createSyncEngineTypeGuards() {
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

  const isValidSyncDirection = (value: unknown): value is SyncDirection => {
    const validDirections = new Set<string>([
      'EDITOR_TO_MULTISTEP',
      'MULTISTEP_TO_EDITOR',
      'BIDIRECTIONAL',
    ]);
    return isValidString(value) && validDirections.has(value);
  };

  const isValidEditorSnapshot = (
    value: unknown
  ): value is EditorStateSnapshotForBridge => {
    if (!isValidObject(value)) {
      return false;
    }

    const requiredProperties = [
      'editorContainers',
      'editorParagraphs',
      'editorCompletedContent',
      'extractedTimestamp',
    ];
    return requiredProperties.every((prop) => prop in value);
  };

  const isValidMultiStepSnapshot = (
    value: unknown
  ): value is MultiStepFormSnapshotForBridge => {
    if (!isValidObject(value)) {
      return false;
    }

    const requiredProperties = [
      'formValues',
      'formCurrentStep',
      'snapshotTimestamp',
    ];
    return requiredProperties.every((prop) => prop in value);
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidSyncDirection,
    isValidEditorSnapshot,
    isValidMultiStepSnapshot,
  };
}

// 🔧 에러 처리 모듈
function createSyncEngineErrorHandler() {
  const { isValidString } = createSyncEngineTypeGuards();

  const extractSafeErrorMessage = (error: unknown): string => {
    // Early Return: Error 인스턴스인 경우
    if (error instanceof Error) {
      return error.message;
    }

    // Early Return: 문자열인 경우
    if (isValidString(error)) {
      return error;
    }

    // 안전한 문자열 변환
    try {
      return String(error);
    } catch (conversionError) {
      console.warn('⚠️ [SYNC_ENGINE] 에러 메시지 변환 실패:', conversionError);
      return 'Unknown sync engine error';
    }
  };

  const safelyExecuteAsync = async <T>(
    operation: () => Promise<T>,
    fallbackValue: T,
    operationName: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (operationError) {
      console.error(
        `❌ [SYNC_ENGINE] ${operationName} 실행 실패:`,
        operationError
      );
      return fallbackValue;
    }
  };

  const withTimeout = async <T>(
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
    maxRetries: number,
    delayMs: number
  ): Promise<T> => {
    let lastError: Error;

    for (let attemptIndex = 1; attemptIndex <= maxRetries; attemptIndex++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Early Return: 마지막 시도인 경우
        if (attemptIndex === maxRetries) {
          break;
        }

        console.warn(
          `⚠️ [SYNC_ENGINE] 시도 ${attemptIndex} 실패, ${delayMs}ms 후 재시도:`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError!;
  };

  return {
    extractSafeErrorMessage,
    safelyExecuteAsync,
    withTimeout,
    withRetry,
  };
}

// 🔧 동기화 전략 팩토리
function createSyncStrategyFactory() {
  const { isValidEditorSnapshot, isValidMultiStepSnapshot } =
    createSyncEngineTypeGuards();
  const { safelyExecuteAsync } = createSyncEngineErrorHandler();

  // 🔧 기본 Editor → MultiStep 전략
  const createEditorToMultiStepStrategy = (): SyncStrategy => ({
    name: 'EDITOR_TO_MULTISTEP_DEFAULT',
    priority: 100,

    canExecute: (context: SyncExecutionContext): boolean => {
      const { direction, editorData } = context;
      const isCorrectDirection =
        direction === 'EDITOR_TO_MULTISTEP' || direction === 'BIDIRECTIONAL';
      const hasValidEditorData = editorData
        ? isValidEditorSnapshot(editorData)
        : false;

      console.log(
        '🔍 [SYNC_STRATEGY] Editor → MultiStep 전략 실행 가능 여부:',
        {
          isCorrectDirection,
          hasValidEditorData,
        }
      );

      return isCorrectDirection && hasValidEditorData;
    },

    execute: async (
      context: SyncExecutionContext
    ): Promise<SyncExecutionResult> => {
      console.log('🚀 [SYNC_STRATEGY] Editor → MultiStep 전략 실행 시작');

      const createFailureResult = (): SyncExecutionResult => ({
        success: false,
        errors: ['Editor → MultiStep 전략 실행 실패'] as readonly string[],
        warnings: [] as readonly string[],
        metadata: new Map<string, unknown>(),
      });

      return safelyExecuteAsync(
        async (): Promise<SyncExecutionResult> => {
          const { editorData } = context;

          // Early Return: 에디터 데이터가 없는 경우
          if (!editorData || !isValidEditorSnapshot(editorData)) {
            throw new Error('유효하지 않은 에디터 데이터');
          }

          // 🔧 구조분해할당으로 안전한 데이터 추출
          const {
            editorContainers = [],
            editorParagraphs = [],
            editorCompletedContent = '',
            editorIsCompleted = false,
          } = editorData;

          console.log('🔍 [DEBUG] Editor Data 구조분해할당:', {
            containerCount: editorContainers.length,
            paragraphCount: editorParagraphs.length,
            contentLength: editorCompletedContent.length,
            isCompleted: editorIsCompleted,
          });

          // 간단한 변환 로직 (실제로는 transformer 사용)
          const transformedContent = editorCompletedContent;
          const transformedIsCompleted = editorIsCompleted;

          // 메타데이터 생성
          const resultMetadata = new Map<string, unknown>();
          resultMetadata.set(
            'transformationStrategy',
            'EDITOR_TO_MULTISTEP_DEFAULT'
          );
          resultMetadata.set('containerCount', editorContainers.length);
          resultMetadata.set('paragraphCount', editorParagraphs.length);
          resultMetadata.set('contentLength', transformedContent.length);
          resultMetadata.set('timestamp', Date.now());

          // 변환 결과 생성
          const transformationResult: EditorToMultiStepDataTransformationResult =
            {
              transformedContent,
              transformedIsCompleted,
              transformedMetadata: {
                containerCount: editorContainers.length,
                paragraphCount: editorParagraphs.length,
                assignedParagraphCount: editorParagraphs.filter(
                  (p) => p.containerId !== null
                ).length,
                unassignedParagraphCount: editorParagraphs.filter(
                  (p) => p.containerId === null
                ).length,
                totalContentLength: transformedContent.length,
                lastModified: new Date(),
                processingTimeMs: 0,
                validationWarnings: new Set<string>(),
              },
              transformationSuccess: true,
              transformationErrors: [],
              transformationStrategy: 'EXISTING_CONTENT',
            };

          console.log('✅ [SYNC_STRATEGY] Editor → MultiStep 전략 실행 완료');

          const successResult: SyncExecutionResult = {
            success: true,
            data: transformationResult,
            errors: [] as readonly string[],
            warnings: [] as readonly string[],
            metadata: resultMetadata,
          };

          return successResult;
        },
        createFailureResult(),
        'EDITOR_TO_MULTISTEP_STRATEGY'
      );
    },
  });

  // 🔧 기본 MultiStep → Editor 전략
  const createMultiStepToEditorStrategy = (): SyncStrategy => ({
    name: 'MULTISTEP_TO_EDITOR_DEFAULT',
    priority: 100,

    canExecute: (context: SyncExecutionContext): boolean => {
      const { direction, multiStepData } = context;
      const isCorrectDirection =
        direction === 'MULTISTEP_TO_EDITOR' || direction === 'BIDIRECTIONAL';
      const hasValidMultiStepData = multiStepData
        ? isValidMultiStepSnapshot(multiStepData)
        : false;

      console.log(
        '🔍 [SYNC_STRATEGY] MultiStep → Editor 전략 실행 가능 여부:',
        {
          isCorrectDirection,
          hasValidMultiStepData,
        }
      );

      return isCorrectDirection && hasValidMultiStepData;
    },

    execute: async (
      context: SyncExecutionContext
    ): Promise<SyncExecutionResult> => {
      console.log('🚀 [SYNC_STRATEGY] MultiStep → Editor 전략 실행 시작');

      const createFailureResult = (): SyncExecutionResult => ({
        success: false,
        errors: ['MultiStep → Editor 전략 실행 실패'] as readonly string[],
        warnings: [] as readonly string[],
        metadata: new Map<string, unknown>(),
      });

      return safelyExecuteAsync(
        async (): Promise<SyncExecutionResult> => {
          const { multiStepData } = context;

          // Early Return: 멀티스텝 데이터가 없는 경우
          if (!multiStepData || !isValidMultiStepSnapshot(multiStepData)) {
            throw new Error('유효하지 않은 멀티스텝 데이터');
          }

          // 🔧 구조분해할당으로 안전한 데이터 추출
          const { formValues } = multiStepData;
          const { editorCompletedContent = '', isEditorCompleted = false } =
            formValues;

          console.log('🔍 [DEBUG] MultiStep Data 구조분해할당:', {
            hasFormValues: !!formValues,
            contentLength: editorCompletedContent.length,
            isCompleted: isEditorCompleted,
          });

          // 메타데이터 생성
          const resultMetadata = new Map<string, unknown>();
          resultMetadata.set(
            'transformationStrategy',
            'MULTISTEP_TO_EDITOR_DEFAULT'
          );
          resultMetadata.set('contentLength', editorCompletedContent.length);
          resultMetadata.set('isCompleted', isEditorCompleted);
          resultMetadata.set('timestamp', Date.now());

          // 변환 결과 생성
          const transformationResult: MultiStepToEditorDataTransformationResult =
            {
              editorContent: editorCompletedContent,
              editorIsCompleted: isEditorCompleted,
              transformationSuccess: true,
              transformationErrors: [],
              transformedTimestamp: Date.now(),
              contentMetadata: resultMetadata,
            };

          console.log('✅ [SYNC_STRATEGY] MultiStep → Editor 전략 실행 완료');

          const successResult: SyncExecutionResult = {
            success: true,
            data: transformationResult,
            errors: [] as readonly string[],
            warnings: [] as readonly string[],
            metadata: resultMetadata,
          };

          return successResult;
        },
        createFailureResult(),
        'MULTISTEP_TO_EDITOR_STRATEGY'
      );
    },
  });

  return {
    createEditorToMultiStepStrategy,
    createMultiStepToEditorStrategy,
  };
}

// 🔧 동기화 엔진 상태 관리
function createSyncEngineStateManager() {
  let currentState: SyncEngineState = {
    isActive: false,
    currentOperation: null,
    lastOperationTimestamp: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    activeStrategies: [],
  };

  const getCurrentState = (): SyncEngineState => {
    console.log('🔍 [SYNC_STATE] 현재 상태 조회:', currentState);
    return { ...currentState };
  };

  const updateOperationStart = (direction: SyncDirection): void => {
    console.log('🚀 [SYNC_STATE] 동기화 작업 시작:', direction);

    const incrementedTotalOperations = currentState.totalOperations + 1;

    currentState = {
      ...currentState,
      isActive: true,
      currentOperation: direction,
      lastOperationTimestamp: Date.now(),
      totalOperations: incrementedTotalOperations,
    };
  };

  const updateOperationComplete = (success: boolean): void => {
    console.log('✅ [SYNC_STATE] 동기화 작업 완료:', { success });

    const successCount = success
      ? currentState.successfulOperations + 1
      : currentState.successfulOperations;
    const failureCount = success
      ? currentState.failedOperations
      : currentState.failedOperations + 1;

    currentState = {
      ...currentState,
      isActive: false,
      currentOperation: null,
      successfulOperations: successCount,
      failedOperations: failureCount,
    };
  };

  const updateActiveStrategies = (strategyNames: readonly string[]): void => {
    console.log('🔧 [SYNC_STATE] 활성 전략 업데이트:', strategyNames);

    currentState = {
      ...currentState,
      activeStrategies: [...strategyNames],
    };
  };

  const resetState = (): void => {
    console.log('🔄 [SYNC_STATE] 상태 초기화');

    currentState = {
      isActive: false,
      currentOperation: null,
      lastOperationTimestamp: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      activeStrategies: [],
    };
  };

  return {
    getCurrentState,
    updateOperationStart,
    updateOperationComplete,
    updateActiveStrategies,
    resetState,
  };
}

// 🔧 메인 동기화 엔진 클래스
export function createSyncEngine(
  configuration: Partial<SyncEngineConfiguration> = {}
) {
  console.log('🏭 [SYNC_ENGINE] 동기화 엔진 생성 시작');

  // 🔧 기본 설정과 사용자 설정 병합
  const defaultConfig: SyncEngineConfiguration = {
    enableRetry: true,
    maxRetryAttempts: 3,
    defaultTimeoutMs: 10000,
    enableValidation: true,
    enableStateTracking: true,
    logLevel: 'INFO',
  };

  const finalConfig: SyncEngineConfiguration = {
    ...defaultConfig,
    ...configuration,
  };

  // 모듈 생성
  const { withTimeout, withRetry, safelyExecuteAsync } =
    createSyncEngineErrorHandler();
  const { createEditorToMultiStepStrategy, createMultiStepToEditorStrategy } =
    createSyncStrategyFactory();
  const stateManager = createSyncEngineStateManager();
  const { isValidSyncDirection } = createSyncEngineTypeGuards();

  // 전략 저장소
  const registeredStrategies = new Map<string, SyncStrategy>();

  // 🔧 기본 전략 등록
  const initializeDefaultStrategies = (): void => {
    console.log('🔧 [SYNC_ENGINE] 기본 전략 등록');

    const editorToMultiStepStrategy = createEditorToMultiStepStrategy();
    const multiStepToEditorStrategy = createMultiStepToEditorStrategy();

    registeredStrategies.set(
      editorToMultiStepStrategy.name,
      editorToMultiStepStrategy
    );
    registeredStrategies.set(
      multiStepToEditorStrategy.name,
      multiStepToEditorStrategy
    );

    const strategyNames = Array.from(registeredStrategies.keys());
    stateManager.updateActiveStrategies(strategyNames);

    console.log('✅ [SYNC_ENGINE] 기본 전략 등록 완료:', strategyNames);
  };

  // 🔧 전략 등록
  const registerStrategy = (strategy: SyncStrategy): boolean => {
    console.log('🔧 [SYNC_ENGINE] 전략 등록:', strategy.name);

    const isValidStrategy =
      strategy &&
      typeof strategy.name === 'string' &&
      typeof strategy.priority === 'number' &&
      typeof strategy.canExecute === 'function' &&
      typeof strategy.execute === 'function';

    // Early Return: 유효하지 않은 전략인 경우
    if (!isValidStrategy) {
      console.error('❌ [SYNC_ENGINE] 유효하지 않은 전략:', strategy);
      return false;
    }

    registeredStrategies.set(strategy.name, strategy);

    const strategyNames = Array.from(registeredStrategies.keys());
    stateManager.updateActiveStrategies(strategyNames);

    console.log('✅ [SYNC_ENGINE] 전략 등록 완료:', strategy.name);
    return true;
  };

  // 🔧 전략 해제
  const unregisterStrategy = (strategyName: string): boolean => {
    console.log('🔧 [SYNC_ENGINE] 전략 해제:', strategyName);

    const hasStrategy = registeredStrategies.has(strategyName);

    // Early Return: 전략이 없는 경우
    if (!hasStrategy) {
      console.warn('⚠️ [SYNC_ENGINE] 존재하지 않는 전략:', strategyName);
      return false;
    }

    registeredStrategies.delete(strategyName);

    const strategyNames = Array.from(registeredStrategies.keys());
    stateManager.updateActiveStrategies(strategyNames);

    console.log('✅ [SYNC_ENGINE] 전략 해제 완료:', strategyName);
    return true;
  };

  // 🔧 적용 가능한 전략 선택
  const selectApplicableStrategy = (
    context: SyncExecutionContext
  ): SyncStrategy | null => {
    console.log('🔍 [SYNC_ENGINE] 적용 가능한 전략 선택:', context.direction);

    const availableStrategies = Array.from(registeredStrategies.values())
      .filter((strategy) => strategy.canExecute(context))
      .sort(
        (firstStrategy, secondStrategy) =>
          secondStrategy.priority - firstStrategy.priority
      );

    // Early Return: 적용 가능한 전략이 없는 경우
    if (availableStrategies.length === 0) {
      console.warn('⚠️ [SYNC_ENGINE] 적용 가능한 전략이 없음');
      return null;
    }

    const selectedStrategy = availableStrategies[0];
    console.log('✅ [SYNC_ENGINE] 전략 선택 완료:', selectedStrategy.name);

    return selectedStrategy;
  };

  // 🔧 동기화 실행
  const executeSync = async (
    direction: SyncDirection,
    editorData?: EditorStateSnapshotForBridge,
    multiStepData?: MultiStepFormSnapshotForBridge,
    customOptions?: Partial<SyncExecutionOptions>
  ): Promise<SyncExecutionResult> => {
    console.log('🚀 [SYNC_ENGINE] 동기화 실행 시작:', direction);

    // Early Return: 유효하지 않은 방향인 경우
    if (!isValidSyncDirection(direction)) {
      console.error('❌ [SYNC_ENGINE] 유효하지 않은 동기화 방향:', direction);
      return {
        success: false,
        errors: ['유효하지 않은 동기화 방향'] as readonly string[],
        warnings: [] as readonly string[],
        metadata: new Map<string, unknown>(),
      };
    }

    const { enableStateTracking } = finalConfig;

    // 상태 추적 시작
    enableStateTracking ? stateManager.updateOperationStart(direction) : null;

    try {
      // 실행 옵션 생성
      const defaultOptions: SyncExecutionOptions = {
        timeoutMs: finalConfig.defaultTimeoutMs,
        retryCount: finalConfig.maxRetryAttempts,
        validateInput: finalConfig.enableValidation,
        validateOutput: finalConfig.enableValidation,
        enableLogging: finalConfig.logLevel !== 'ERROR',
      };

      const executionOptions: SyncExecutionOptions = {
        ...defaultOptions,
        ...customOptions,
      };

      // 실행 컨텍스트 생성
      const executionContext: SyncExecutionContext = {
        direction,
        editorData,
        multiStepData,
        options: executionOptions,
        metadata: new Map<string, unknown>([
          ['engineVersion', '1.0.0'],
          ['startTime', Date.now()],
          ['retryEnabled', finalConfig.enableRetry],
        ]),
      };

      // 전략 선택
      const selectedStrategy = selectApplicableStrategy(executionContext);

      // Early Return: 적용 가능한 전략이 없는 경우
      if (!selectedStrategy) {
        const noStrategyResult: SyncExecutionResult = {
          success: false,
          errors: ['적용 가능한 동기화 전략이 없습니다'] as readonly string[],
          warnings: [] as readonly string[],
          metadata: new Map<string, unknown>(),
        };

        enableStateTracking
          ? stateManager.updateOperationComplete(false)
          : null;
        return noStrategyResult;
      }

      // 전략 실행 (재시도 및 타임아웃 적용)
      const executeStrategyWithSafety =
        async (): Promise<SyncExecutionResult> => {
          const operation = (): Promise<SyncExecutionResult> =>
            selectedStrategy.execute(executionContext);

          const operationWithTimeout = withTimeout(
            operation(),
            executionOptions.timeoutMs,
            '동기화 작업 타임아웃'
          );

          return finalConfig.enableRetry
            ? withRetry(
                () => operationWithTimeout,
                executionOptions.retryCount,
                1000
              )
            : operationWithTimeout;
        };

      const createSyncFailureResult = (): SyncExecutionResult => ({
        success: false,
        errors: ['동기화 실행 중 예외 발생'] as readonly string[],
        warnings: [] as readonly string[],
        metadata: new Map<string, unknown>(),
      });

      const executionResult = await safelyExecuteAsync(
        executeStrategyWithSafety,
        createSyncFailureResult(),
        'SYNC_STRATEGY_EXECUTION'
      );

      // 상태 추적 완료
      enableStateTracking
        ? stateManager.updateOperationComplete(executionResult.success)
        : null;

      console.log('✅ [SYNC_ENGINE] 동기화 실행 완료:', {
        direction,
        strategy: selectedStrategy.name,
        success: executionResult.success,
      });

      return executionResult;
    } catch (syncError) {
      console.error('❌ [SYNC_ENGINE] 동기화 실행 실패:', syncError);

      enableStateTracking ? stateManager.updateOperationComplete(false) : null;

      return {
        success: false,
        errors: [
          syncError instanceof Error ? syncError.message : String(syncError),
        ] as readonly string[],
        warnings: [] as readonly string[],
        metadata: new Map<string, unknown>(),
      };
    }
  };

  // 🔧 양방향 동기화
  const executeBidirectionalSync = async (
    editorData: EditorStateSnapshotForBridge,
    multiStepData: MultiStepFormSnapshotForBridge,
    customOptions?: Partial<SyncExecutionOptions>
  ): Promise<BidirectionalSyncResult> => {
    console.log('🚀 [SYNC_ENGINE] 양방향 동기화 시작');

    const syncStartTime = Date.now();
    const syncErrors: string[] = [];

    try {
      // Editor → MultiStep 동기화
      const editorToMultiStepResult = await executeSync(
        'EDITOR_TO_MULTISTEP',
        editorData,
        undefined,
        customOptions
      );

      const editorToMultiStepSuccess = editorToMultiStepResult.success;
      editorToMultiStepResult.success
        ? null
        : syncErrors.push(...editorToMultiStepResult.errors);

      // MultiStep → Editor 동기화
      const multiStepToEditorResult = await executeSync(
        'MULTISTEP_TO_EDITOR',
        undefined,
        multiStepData,
        customOptions
      );

      const multiStepToEditorSuccess = multiStepToEditorResult.success;
      multiStepToEditorResult.success
        ? null
        : syncErrors.push(...multiStepToEditorResult.errors);

      const overallSuccess =
        editorToMultiStepSuccess && multiStepToEditorSuccess;
      const syncEndTime = Date.now();
      const syncDuration = syncEndTime - syncStartTime;

      // 메타데이터 생성
      const syncMetadata = new Map<string, unknown>();
      syncMetadata.set('syncStartTime', syncStartTime);
      syncMetadata.set('syncEndTime', syncEndTime);
      syncMetadata.set('syncDuration', syncDuration);
      syncMetadata.set('editorToMultiStepSuccess', editorToMultiStepSuccess);
      syncMetadata.set('multiStepToEditorSuccess', multiStepToEditorSuccess);
      syncMetadata.set('overallSuccess', overallSuccess);

      const bidirectionalResult: BidirectionalSyncResult = {
        editorToMultiStepSuccess,
        multiStepToEditorSuccess,
        overallSuccess,
        syncErrors,
        syncDuration,
        syncMetadata,
      };

      console.log('✅ [SYNC_ENGINE] 양방향 동기화 완료:', {
        overallSuccess,
        duration: syncDuration,
        errorCount: syncErrors.length,
      });

      return bidirectionalResult;
    } catch (bidirectionalError) {
      console.error('❌ [SYNC_ENGINE] 양방향 동기화 실패:', bidirectionalError);

      const errorMessage =
        bidirectionalError instanceof Error
          ? bidirectionalError.message
          : String(bidirectionalError);
      syncErrors.push(errorMessage);

      const failureMetadata = new Map<string, unknown>();
      failureMetadata.set('syncStartTime', syncStartTime);
      failureMetadata.set('syncEndTime', Date.now());
      failureMetadata.set('error', errorMessage);

      return {
        editorToMultiStepSuccess: false,
        multiStepToEditorSuccess: false,
        overallSuccess: false,
        syncErrors,
        syncDuration: Date.now() - syncStartTime,
        syncMetadata: failureMetadata,
      };
    }
  };

  // 초기화
  initializeDefaultStrategies();

  console.log('✅ [SYNC_ENGINE] 동기화 엔진 생성 완료');

  return {
    // 전략 관리
    registerStrategy,
    unregisterStrategy,
    getRegisteredStrategies: () => Array.from(registeredStrategies.keys()),

    // 동기화 실행
    executeSync,
    executeBidirectionalSync,

    // 상태 관리
    getState: stateManager.getCurrentState,
    resetState: stateManager.resetState,

    // 설정 조회
    getConfiguration: () => ({ ...finalConfig }),
  };
}

export type {
  SyncStrategy,
  SyncExecutionContext,
  SyncExecutionResult,
  SyncDirection,
  SyncExecutionOptions,
  SyncEngineState,
  SyncEngineConfiguration,
};
