// bridges/editorMultiStepBridge/BridgeSystemManager.ts

// 🔧 시스템 상태 인터페이스
interface BridgeSystemState {
  readonly isInitialized: boolean;
  readonly isOperational: boolean;
  readonly currentOperation: BridgeOperationType | null;
  readonly lastOperationTimestamp: number;
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly activeConnections: ReadonlySet<string>;
}

// 🔧 브릿지 작업 타입
type BridgeOperationType =
  | 'FORWARD_TRANSFER'
  | 'REVERSE_TRANSFER'
  | 'BIDIRECTIONAL_SYNC'
  | 'HEALTH_CHECK'
  | 'SYSTEM_RESET'
  | 'SYSTEM_SHUTDOWN';

// 🔧 통합 작업 결과 인터페이스
interface IntegratedOperationResult {
  readonly operationType: BridgeOperationType;
  readonly success: boolean;
  readonly duration: number;
  readonly errorMessages: readonly string[];
  readonly warningMessages: readonly string[];
  readonly resultData: unknown;
  readonly metadata: Map<string, unknown>;
}

// 🔧 시스템 메트릭스 인터페이스
interface BridgeSystemMetrics {
  readonly operationCount: number;
  readonly successRate: number;
  readonly averageOperationTime: number;
  readonly lastOperationTime: number;
  readonly systemUptime: number;
  readonly memoryUsage: number;
  readonly activeConnectionsCount: number;
}

// 🔧 간소화된 작업 결과 인터페이스
interface SimpleBridgeResult {
  readonly success: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly data: unknown;
  readonly duration: number;
}

// 🔧 간소화된 동기화 결과 인터페이스
interface SimpleSyncResult {
  readonly editorToMultiStepSuccess: boolean;
  readonly multiStepToEditorSuccess: boolean;
  readonly overallSuccess: boolean;
  readonly errors: readonly string[];
  readonly duration: number;
}

// 🔧 간소화된 역변환 결과 인터페이스
interface SimpleReverseResult {
  readonly content: string;
  readonly isCompleted: boolean;
  readonly success: boolean;
  readonly errors: readonly string[];
}

// 🔧 타입 가드 함수들
function createBridgeSystemTypeGuards() {
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

  const isValidArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  return {
    isValidString,
    isValidNumber,
    isValidBoolean,
    isValidObject,
    isValidArray,
  };
}

// 🔧 안전한 타입 변환 함수들
function createSafeTypeConverters() {
  const { isValidString, isValidNumber, isValidBoolean } =
    createBridgeSystemTypeGuards();

  const convertToSafeString = (
    value: unknown,
    fallback: string = ''
  ): string => {
    const isStringValue = isValidString(value);
    if (isStringValue) {
      return value;
    }

    const isNullOrUndefined = value === null || value === undefined;
    if (isNullOrUndefined) {
      return fallback;
    }

    try {
      return String(value);
    } catch (conversionError) {
      console.warn('⚠️ [BRIDGE_SYSTEM] 문자열 변환 실패:', conversionError);
      return fallback;
    }
  };

  const convertToSafeNumber = (
    value: unknown,
    fallback: number = 0
  ): number => {
    const isNumberValue = isValidNumber(value);
    if (isNumberValue) {
      return value;
    }

    const isStringValue = isValidString(value);
    if (isStringValue) {
      const parsedValue = parseInt(value, 10);
      const isValidParsed = !Number.isNaN(parsedValue);
      return isValidParsed ? parsedValue : fallback;
    }

    return fallback;
  };

  const convertToSafeBoolean = (
    value: unknown,
    fallback: boolean = false
  ): boolean => {
    const isBooleanValue = isValidBoolean(value);
    if (isBooleanValue) {
      return value;
    }

    const isStringValue = isValidString(value);
    if (isStringValue) {
      const lowerValue = value.toLowerCase();
      const isTrueString = lowerValue === 'true';
      const isFalseString = lowerValue === 'false';

      return isTrueString ? true : isFalseString ? false : fallback;
    }

    return fallback;
  };

  return {
    convertToSafeString,
    convertToSafeNumber,
    convertToSafeBoolean,
  };
}

// 🔧 에러 처리 모듈
function createBridgeSystemErrorHandler() {
  const { isValidString } = createBridgeSystemTypeGuards();

  const extractErrorMessage = (error: unknown): string => {
    // Early Return: Error 인스턴스
    if (error instanceof Error) {
      const hasMessage = error.message.length > 0;
      return hasMessage ? error.message : '알 수 없는 에러';
    }

    // Early Return: 문자열
    if (isValidString(error)) {
      const hasContent = error.length > 0;
      return hasContent ? error : '빈 에러 메시지';
    }

    try {
      return String(error);
    } catch (conversionError) {
      console.warn(
        '⚠️ [BRIDGE_SYSTEM] 에러 메시지 변환 실패:',
        conversionError
      );
      return '브릿지 시스템 에러';
    }
  };

  const safelyExecuteAsync = async <T>(
    operation: () => Promise<T>,
    fallback: T,
    operationName: string
  ): Promise<T> => {
    try {
      console.log(`🚀 [BRIDGE_SYSTEM] ${operationName} 실행 시작`);
      const result = await operation();
      console.log(`✅ [BRIDGE_SYSTEM] ${operationName} 실행 성공`);
      return result;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error(
        `❌ [BRIDGE_SYSTEM] ${operationName} 실행 실패:`,
        errorMessage
      );
      return fallback;
    }
  };

  const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    );

    return Promise.race([promise, timeoutPromise]);
  };

  return {
    extractErrorMessage,
    safelyExecuteAsync,
    withTimeout,
  };
}

// 🔧 메인 브릿지 시스템 매니저 클래스
export class BridgeSystemManager {
  private static singletonInstance: BridgeSystemManager | null = null;

  private readonly typeGuards: ReturnType<typeof createBridgeSystemTypeGuards>;
  private readonly safeConverters: ReturnType<typeof createSafeTypeConverters>;
  private readonly errorHandler: ReturnType<
    typeof createBridgeSystemErrorHandler
  >;

  private systemState: BridgeSystemState;
  private readonly systemStartTime: number;
  private operationMetrics: BridgeSystemMetrics;

  // 🔧 Private 생성자 - 싱글톤 패턴
  private constructor() {
    console.log('🏗️ [BRIDGE_SYSTEM] 브릿지 시스템 매니저 생성 시작');

    // 타입 가드 및 유틸리티 초기화
    this.typeGuards = createBridgeSystemTypeGuards();
    this.safeConverters = createSafeTypeConverters();
    this.errorHandler = createBridgeSystemErrorHandler();

    // 시스템 상태 초기화
    this.systemStartTime = Date.now();
    this.systemState = {
      isInitialized: false,
      isOperational: false,
      currentOperation: null,
      lastOperationTimestamp: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      activeConnections: new Set<string>(),
    };

    // 메트릭스 초기화
    this.operationMetrics = {
      operationCount: 0,
      successRate: 0,
      averageOperationTime: 0,
      lastOperationTime: 0,
      systemUptime: 0,
      memoryUsage: 0,
      activeConnectionsCount: 0,
    };

    console.log('✅ [BRIDGE_SYSTEM] 브릿지 시스템 매니저 생성 완료');
  }

  // 🔧 싱글톤 인스턴스 획득
  public static getInstance(): BridgeSystemManager {
    const hasInstance = BridgeSystemManager.singletonInstance !== null;
    if (hasInstance) {
      console.log('🔍 [BRIDGE_SYSTEM] 기존 싱글톤 인스턴스 반환');
      const existingInstance = BridgeSystemManager.singletonInstance;
      if (existingInstance) {
        return existingInstance;
      }
    }

    console.log('🆕 [BRIDGE_SYSTEM] 새 싱글톤 인스턴스 생성');
    BridgeSystemManager.singletonInstance = new BridgeSystemManager();

    const newInstance = BridgeSystemManager.singletonInstance;
    if (newInstance) {
      return newInstance;
    }

    // Fallback: 이론적으로 도달할 수 없는 경우를 위한 새 인스턴스 생성
    return new BridgeSystemManager();
  }

  // 🔧 싱글톤 인스턴스 초기화
  public static resetInstance(): void {
    const hasInstance = BridgeSystemManager.singletonInstance !== null;
    if (hasInstance) {
      console.log('🔄 [BRIDGE_SYSTEM] 싱글톤 인스턴스 초기화');

      // 안전한 종료 시도
      try {
        const instanceToShutdown = BridgeSystemManager.singletonInstance;
        if (instanceToShutdown) {
          instanceToShutdown.shutdown();
        }
      } catch (shutdownError) {
        console.warn('⚠️ [BRIDGE_SYSTEM] 종료 중 오류:', shutdownError);
      }

      BridgeSystemManager.singletonInstance = null;
    }
  }

  // 🔧 시스템 초기화
  public async initialize(): Promise<boolean> {
    console.log('🚀 [BRIDGE_SYSTEM] 시스템 초기화 시작');

    const isAlreadyInitialized = this.systemState.isInitialized;
    if (isAlreadyInitialized) {
      console.log('ℹ️ [BRIDGE_SYSTEM] 이미 초기화됨');
      return true;
    }

    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<boolean> => {
        // 활성 연결 등록
        const activeConnectionsSet = new Set<string>();
        activeConnectionsSet.add('BRIDGE_SYSTEM_MANAGER');

        // 시스템 상태 업데이트
        this.systemState = {
          ...this.systemState,
          isInitialized: true,
          isOperational: true,
          activeConnections: activeConnectionsSet,
        };

        // 메트릭스 업데이트
        this.operationMetrics = {
          ...this.operationMetrics,
          activeConnectionsCount: activeConnectionsSet.size,
        };

        console.log('✅ [BRIDGE_SYSTEM] 시스템 초기화 완료');
        return true;
      },
      false,
      'SYSTEM_INITIALIZATION'
    );
  }

  // 🔧 시스템 종료
  public async shutdown(): Promise<void> {
    console.log('🔌 [BRIDGE_SYSTEM] 시스템 종료 시작');

    await this.errorHandler.safelyExecuteAsync(
      async (): Promise<void> => {
        // 진행 중인 작업 중단
        const hasCurrentOperation = this.systemState.currentOperation !== null;
        if (hasCurrentOperation) {
          console.log('⏹️ [BRIDGE_SYSTEM] 진행 중인 작업 중단');
          this.updateOperationComplete(false, 'SYSTEM_SHUTDOWN');
        }

        // 시스템 상태 초기화
        this.systemState = {
          isInitialized: false,
          isOperational: false,
          currentOperation: null,
          lastOperationTimestamp: 0,
          totalOperations: 0,
          successfulOperations: 0,
          failedOperations: 0,
          activeConnections: new Set<string>(),
        };

        console.log('✅ [BRIDGE_SYSTEM] 시스템 종료 완료');
      },
      undefined,
      'SYSTEM_SHUTDOWN'
    );
  }

  // 🔧 상태 업데이트 헬퍼 함수들
  private updateOperationStart(operationType: BridgeOperationType): void {
    console.log(`🚀 [BRIDGE_SYSTEM] 작업 시작: ${operationType}`);

    const incrementedTotalOperations = this.systemState.totalOperations + 1;

    this.systemState = {
      ...this.systemState,
      currentOperation: operationType,
      lastOperationTimestamp: Date.now(),
      totalOperations: incrementedTotalOperations,
    };

    this.operationMetrics = {
      ...this.operationMetrics,
      operationCount: incrementedTotalOperations,
    };
  }

  private updateOperationComplete(
    success: boolean,
    operationType: BridgeOperationType
  ): void {
    console.log(
      `✅ [BRIDGE_SYSTEM] 작업 완료: ${operationType}, 성공: ${success}`
    );

    const successCount = success
      ? this.systemState.successfulOperations + 1
      : this.systemState.successfulOperations;

    const failureCount = success
      ? this.systemState.failedOperations
      : this.systemState.failedOperations + 1;

    const operationDuration =
      Date.now() - this.systemState.lastOperationTimestamp;
    const totalOperations = this.systemState.totalOperations;
    const newSuccessRate =
      totalOperations > 0 ? (successCount / totalOperations) * 100 : 0;

    // 평균 작업 시간 계산
    const prevAverage = this.operationMetrics.averageOperationTime;
    const prevCount = this.operationMetrics.operationCount - 1;
    const newAverage =
      prevCount > 0
        ? (prevAverage * prevCount + operationDuration) / totalOperations
        : operationDuration;

    this.systemState = {
      ...this.systemState,
      currentOperation: null,
      successfulOperations: successCount,
      failedOperations: failureCount,
    };

    this.operationMetrics = {
      ...this.operationMetrics,
      successRate: newSuccessRate,
      averageOperationTime: newAverage,
      lastOperationTime: operationDuration,
      systemUptime: Date.now() - this.systemStartTime,
    };
  }

  // 🔧 Forward Transfer 실행 (Editor → MultiStep)
  public async executeForwardTransfer(): Promise<SimpleBridgeResult> {
    console.log('🚀 [BRIDGE_SYSTEM] Forward Transfer 실행 시작');

    // Early Return: 시스템이 작동 중이 아닌 경우
    if (!this.systemState.isOperational) {
      console.error('❌ [BRIDGE_SYSTEM] 시스템이 작동 중이 아님');
      return this.createSimpleFailureResult('System not operational');
    }

    // Early Return: 이미 작업 진행 중인 경우
    if (this.systemState.currentOperation !== null) {
      console.error('❌ [BRIDGE_SYSTEM] 다른 작업이 진행 중');
      return this.createSimpleFailureResult('Another operation in progress');
    }

    this.updateOperationStart('FORWARD_TRANSFER');

    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<SimpleBridgeResult> => {
        // 실제 구현은 외부 의존성 없이 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 100));

        const operationSuccess = true; // 시뮬레이션된 성공
        this.updateOperationComplete(operationSuccess, 'FORWARD_TRANSFER');

        console.log('✅ [BRIDGE_SYSTEM] Forward Transfer 성공');

        return {
          success: true,
          errors: [],
          warnings: [],
          data: { operation: 'FORWARD_TRANSFER', timestamp: Date.now() },
          duration: 100,
        };
      },
      this.createSimpleFailureResult('Forward Transfer 실행 중 예외'),
      'FORWARD_TRANSFER_EXECUTION'
    );
  }

  // 🔧 Reverse Transfer 실행 (MultiStep → Editor)
  public async executeReverseTransfer(): Promise<SimpleReverseResult> {
    console.log('🚀 [BRIDGE_SYSTEM] Reverse Transfer 실행 시작');

    // Early Return: 시스템이 작동 중이 아닌 경우
    if (!this.systemState.isOperational) {
      console.error('❌ [BRIDGE_SYSTEM] 시스템이 작동 중이 아님');
      return this.createSimpleReverseFailureResult('System not operational');
    }

    // Early Return: 이미 작업 진행 중인 경우
    if (this.systemState.currentOperation !== null) {
      console.error('❌ [BRIDGE_SYSTEM] 다른 작업이 진행 중');
      return this.createSimpleReverseFailureResult(
        'Another operation in progress'
      );
    }

    this.updateOperationStart('REVERSE_TRANSFER');

    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<SimpleReverseResult> => {
        // 실제 구현은 외부 의존성 없이 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 100));

        const operationSuccess = true; // 시뮬레이션된 성공
        this.updateOperationComplete(operationSuccess, 'REVERSE_TRANSFER');

        console.log('✅ [BRIDGE_SYSTEM] Reverse Transfer 성공');

        return {
          content: 'Simulated content from MultiStep',
          isCompleted: false,
          success: true,
          errors: [],
        };
      },
      this.createSimpleReverseFailureResult('Reverse Transfer 실행 중 예외'),
      'REVERSE_TRANSFER_EXECUTION'
    );
  }

  // 🔧 Bidirectional Sync 실행
  public async executeBidirectionalSync(): Promise<SimpleSyncResult> {
    console.log('🚀 [BRIDGE_SYSTEM] Bidirectional Sync 실행 시작');

    // Early Return: 시스템이 작동 중이 아닌 경우
    if (!this.systemState.isOperational) {
      console.error('❌ [BRIDGE_SYSTEM] 시스템이 작동 중이 아님');
      return this.createSimpleSyncFailureResult('System not operational');
    }

    // Early Return: 이미 작업 진행 중인 경우
    if (this.systemState.currentOperation !== null) {
      console.error('❌ [BRIDGE_SYSTEM] 다른 작업이 진행 중');
      return this.createSimpleSyncFailureResult(
        'Another operation in progress'
      );
    }

    this.updateOperationStart('BIDIRECTIONAL_SYNC');

    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<SimpleSyncResult> => {
        const syncStartTime = Date.now();

        // Forward Transfer 시뮬레이션
        const forwardResult = await this.executeForwardTransferInternal();
        const forwardSuccess = forwardResult.success;

        // Reverse Transfer 시뮬레이션
        const reverseResult = await this.executeReverseTransferInternal();
        const reverseSuccess = reverseResult.success;

        const overallSuccess = forwardSuccess && reverseSuccess;
        const syncEndTime = Date.now();
        const syncDuration = syncEndTime - syncStartTime;

        this.updateOperationComplete(overallSuccess, 'BIDIRECTIONAL_SYNC');

        const syncErrors: string[] = [];
        if (!forwardSuccess) {
          syncErrors.push(...forwardResult.errors);
        }
        if (!reverseSuccess) {
          syncErrors.push(...reverseResult.errors);
        }

        console.log('✅ [BRIDGE_SYSTEM] Bidirectional Sync 완료:', {
          overallSuccess,
          duration: syncDuration,
          errorCount: syncErrors.length,
        });

        return {
          editorToMultiStepSuccess: forwardSuccess,
          multiStepToEditorSuccess: reverseSuccess,
          overallSuccess,
          errors: syncErrors,
          duration: syncDuration,
        };
      },
      this.createSimpleSyncFailureResult('Bidirectional Sync 실행 중 예외'),
      'BIDIRECTIONAL_SYNC_EXECUTION'
    );
  }

  // 🔧 내부 전송 함수들 (상태 업데이트 없이)
  private async executeForwardTransferInternal(): Promise<SimpleBridgeResult> {
    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<SimpleBridgeResult> => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          success: true,
          errors: [],
          warnings: [],
          data: { operation: 'INTERNAL_FORWARD_TRANSFER' },
          duration: 50,
        };
      },
      this.createSimpleFailureResult('Internal forward transfer failed'),
      'INTERNAL_FORWARD_TRANSFER'
    );
  }

  private async executeReverseTransferInternal(): Promise<SimpleReverseResult> {
    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<SimpleReverseResult> => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          content: 'Internal reverse content',
          isCompleted: false,
          success: true,
          errors: [],
        };
      },
      this.createSimpleReverseFailureResult('Internal reverse transfer failed'),
      'INTERNAL_REVERSE_TRANSFER'
    );
  }

  // 🔧 실패 결과 생성 헬퍼 함수들
  private createSimpleFailureResult(errorMessage: string): SimpleBridgeResult {
    console.error(`❌ [BRIDGE_SYSTEM] 작업 실패: ${errorMessage}`);

    return {
      success: false,
      errors: [errorMessage],
      warnings: [],
      data: null,
      duration: 0,
    };
  }

  private createSimpleReverseFailureResult(
    errorMessage: string
  ): SimpleReverseResult {
    console.error(`❌ [BRIDGE_SYSTEM] Reverse Transfer 실패: ${errorMessage}`);

    return {
      content: '',
      isCompleted: false,
      success: false,
      errors: [errorMessage],
    };
  }

  private createSimpleSyncFailureResult(
    errorMessage: string
  ): SimpleSyncResult {
    console.error(
      `❌ [BRIDGE_SYSTEM] Bidirectional Sync 실패: ${errorMessage}`
    );

    return {
      editorToMultiStepSuccess: false,
      multiStepToEditorSuccess: false,
      overallSuccess: false,
      errors: [errorMessage],
      duration: 0,
    };
  }

  // 🔧 시스템 상태 및 정보 조회 메서드들
  public getSystemState(): BridgeSystemState {
    console.log('🔍 [BRIDGE_SYSTEM] 시스템 상태 조회');
    return { ...this.systemState };
  }

  public getSystemMetrics(): BridgeSystemMetrics {
    console.log('📊 [BRIDGE_SYSTEM] 시스템 메트릭스 조회');

    const currentUptime = Date.now() - this.systemStartTime;

    return {
      ...this.operationMetrics,
      systemUptime: currentUptime,
    };
  }

  public isSystemReady(): boolean {
    console.log('🔍 [BRIDGE_SYSTEM] 시스템 준비 상태 확인');

    const isInitialized = this.systemState.isInitialized;
    const isOperational = this.systemState.isOperational;
    const hasNoCurrentOperation = this.systemState.currentOperation === null;

    return isInitialized && isOperational && hasNoCurrentOperation;
  }

  // 🔧 헬스 체크
  public async performHealthCheck(): Promise<IntegratedOperationResult> {
    console.log('💓 [BRIDGE_SYSTEM] 헬스 체크 시작');

    const healthCheckStartTime = Date.now();
    this.updateOperationStart('HEALTH_CHECK');

    return this.errorHandler.safelyExecuteAsync(
      async (): Promise<IntegratedOperationResult> => {
        const healthResults: Map<string, boolean> = new Map();
        const healthErrors: string[] = [];

        // 기본 시스템 헬스 체크
        const systemHealth =
          this.systemState.isInitialized && this.systemState.isOperational;
        healthResults.set('bridgeSystemManager', systemHealth);

        if (!systemHealth) {
          healthErrors.push('Bridge system manager not operational');
        }

        const overallHealth = Array.from(healthResults.values()).every(
          (status) => status
        );
        const healthCheckEndTime = Date.now();
        const healthCheckDuration = healthCheckEndTime - healthCheckStartTime;

        this.updateOperationComplete(overallHealth, 'HEALTH_CHECK');

        const healthMetadata = new Map<string, unknown>();
        healthMetadata.set('healthResults', Object.fromEntries(healthResults));
        healthMetadata.set('checkDuration', healthCheckDuration);
        healthMetadata.set('timestamp', Date.now());

        const healthCheckResult: IntegratedOperationResult = {
          operationType: 'HEALTH_CHECK',
          success: overallHealth,
          duration: healthCheckDuration,
          errorMessages: healthErrors,
          warningMessages: [],
          resultData: Object.fromEntries(healthResults),
          metadata: healthMetadata,
        };

        console.log('✅ [BRIDGE_SYSTEM] 헬스 체크 완료:', {
          overallHealth,
          duration: healthCheckDuration,
          errorCount: healthErrors.length,
        });

        return healthCheckResult;
      },
      {
        operationType: 'HEALTH_CHECK',
        success: false,
        duration: 0,
        errorMessages: ['Health check execution failed'],
        warningMessages: [],
        resultData: null,
        metadata: new Map<string, unknown>(),
      },
      'HEALTH_CHECK_EXECUTION'
    );
  }
}

// 🔧 편의 함수들 - 외부에서 쉽게 사용할 수 있도록
export function createBridgeSystemManager(): BridgeSystemManager {
  console.log('🏭 [BRIDGE_SYSTEM] 브릿지 시스템 매니저 팩토리 함수');
  return BridgeSystemManager.getInstance();
}

export function getBridgeSystemInstance(): BridgeSystemManager {
  console.log('🔍 [BRIDGE_SYSTEM] 기존 브릿지 시스템 인스턴스 조회');
  return BridgeSystemManager.getInstance();
}

export function resetBridgeSystem(): void {
  console.log('🔄 [BRIDGE_SYSTEM] 브릿지 시스템 초기화');
  BridgeSystemManager.resetInstance();
}

// 🔧 기존 메인 파일 호환성을 위한 export
export const editorMultiStepBridge = {
  getInstance: getBridgeSystemInstance,
  createInstance: createBridgeSystemManager,
  resetInstance: resetBridgeSystem,
};

console.log('🏗️ [BRIDGE_SYSTEM_MANAGER] 브릿지 시스템 매니저 모듈 초기화 완료');
console.log('📊 [BRIDGE_SYSTEM_MANAGER] 사용 가능한 기능:', {
  singletonPattern: '싱글톤 패턴 시스템 관리',
  systemManagement: '시스템 초기화 및 상태 관리',
  operationExecution: '브릿지 작업 실행',
  healthMonitoring: '헬스 체크 및 모니터링',
  errorHandling: '통합 에러 처리',
  metricsTracking: '메트릭스 추적',
});
console.log('✅ [BRIDGE_SYSTEM_MANAGER] 모든 시스템 통합 기능 준비 완료');
