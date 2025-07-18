// adapters/BaseAdapter.ts

import type {
  ValidationResult,
  ErrorDetails,
  BridgeErrorContext,
} from '../editorMultiStepBridge/bridgeDataTypes';

import {
  extractErrorMessage,
  safelyExecuteAsyncOperation,
  withTimeout,
  withRetry,
  getErrorSeverity,
  isRecoverableError,
} from '../common/errorHandlers';

interface AdapterConnectionConfig {
  readonly timeoutMs: number;
  readonly maxRetryAttempts: number;
  readonly retryDelayMs: number;
  readonly enableHealthCheck: boolean;
  readonly healthCheckIntervalMs: number;
}

interface AdapterConnectionState {
  readonly isConnected: boolean;
  readonly lastConnectionTime: number;
  readonly connectionAttempts: number;
  readonly lastHealthCheckTime: number;
  readonly healthCheckStatus: boolean;
}

interface AdapterPerformanceMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly averageResponseTimeMs: number;
  readonly lastOperationDuration: number;
}

interface SimpleCacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
  readonly expirationMs: number;
}

interface SimpleValidationCacheEntry {
  readonly result: ValidationResult;
  readonly timestamp: number;
  readonly expirationMs: number;
}

const createDefaultAdapterConfig = (): AdapterConnectionConfig => {
  console.log('🔧 [BASE_ADAPTER] 기본 어댑터 설정 생성');

  return {
    timeoutMs: 5000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    enableHealthCheck: true,
    healthCheckIntervalMs: 30000,
  };
};

const createInitialConnectionState = (): AdapterConnectionState => {
  console.log('🔧 [BASE_ADAPTER] 초기 연결 상태 생성');

  return {
    isConnected: false,
    lastConnectionTime: 0,
    connectionAttempts: 0,
    lastHealthCheckTime: 0,
    healthCheckStatus: false,
  };
};

const createInitialPerformanceMetrics = (): AdapterPerformanceMetrics => {
  console.log('🔧 [BASE_ADAPTER] 초기 성능 메트릭 생성');

  return {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageResponseTimeMs: 0,
    lastOperationDuration: 0,
  };
};

function createSimpleCacheManager<T>() {
  const createCacheEntry = (
    data: T,
    expirationMs: number = 300000
  ): SimpleCacheEntry<T> => {
    console.log('💾 [BASE_ADAPTER] 캐시 엔트리 생성');

    return {
      data,
      timestamp: Date.now(),
      expirationMs,
    };
  };

  const isCacheEntryExpired = (entry: SimpleCacheEntry<T>): boolean => {
    const currentTime = Date.now();
    const entryAge = currentTime - entry.timestamp;
    const isExpired = entryAge > entry.expirationMs;

    console.log('🔍 [BASE_ADAPTER] 캐시 만료 검사:', {
      entryAge,
      expirationMs: entry.expirationMs,
      isExpired,
    });

    return isExpired;
  };

  const getCachedData = (
    cache: Record<string, SimpleCacheEntry<T>>,
    cacheKey: string
  ): T | null => {
    console.log('🔍 [BASE_ADAPTER] 캐시 데이터 조회:', cacheKey);

    const hasEntryInCache = cacheKey in cache;
    if (!hasEntryInCache) {
      console.log('🔍 [BASE_ADAPTER] 캐시에 엔트리 없음');
      return null;
    }

    const cacheEntry = cache[cacheKey];
    const isEntryExpired = isCacheEntryExpired(cacheEntry);

    if (isEntryExpired) {
      console.log('🔍 [BASE_ADAPTER] 캐시 엔트리 만료됨');
      return null;
    }

    console.log('✅ [BASE_ADAPTER] 유효한 캐시 데이터 반환');
    return cacheEntry.data;
  };

  const setCachedData = (
    cache: Record<string, SimpleCacheEntry<T>>,
    cacheKey: string,
    data: T,
    expirationMs: number = 300000
  ): Record<string, SimpleCacheEntry<T>> => {
    console.log('💾 [BASE_ADAPTER] 캐시 데이터 저장:', cacheKey);

    const newCacheEntry = createCacheEntry(data, expirationMs);
    const updatedCache = { ...cache };
    updatedCache[cacheKey] = newCacheEntry;

    return updatedCache;
  };

  const clearExpiredEntries = (
    cache: Record<string, SimpleCacheEntry<T>>
  ): Record<string, SimpleCacheEntry<T>> => {
    console.log('🧹 [BASE_ADAPTER] 만료된 캐시 엔트리 정리');

    const cleanedCache: Record<string, SimpleCacheEntry<T>> = {};
    let originalCount = 0;
    let cleanedCount = 0;

    for (const [entryKey, cacheEntry] of Object.entries(cache)) {
      originalCount++;
      const isEntryExpired = isCacheEntryExpired(cacheEntry);

      if (!isEntryExpired) {
        cleanedCache[entryKey] = cacheEntry;
        cleanedCount++;
      }
    }

    console.log('🧹 [BASE_ADAPTER] 캐시 정리 완료:', {
      originalCount,
      cleanedCount,
      removedCount: originalCount - cleanedCount,
    });

    return cleanedCache;
  };

  return {
    getCachedData,
    setCachedData,
    clearExpiredEntries,
  };
}

function createValidationCacheManager() {
  const createValidationEntry = (
    result: ValidationResult,
    expirationMs: number = 60000
  ): SimpleValidationCacheEntry => {
    console.log('📋 [BASE_ADAPTER] 검증 캐시 엔트리 생성');

    return {
      result,
      timestamp: Date.now(),
      expirationMs,
    };
  };

  const isValidationEntryExpired = (
    entry: SimpleValidationCacheEntry
  ): boolean => {
    const currentTime = Date.now();
    const entryAge = currentTime - entry.timestamp;
    const isExpired = entryAge > entry.expirationMs;

    console.log('🔍 [BASE_ADAPTER] 검증 캐시 만료 검사:', {
      entryAge,
      expirationMs: entry.expirationMs,
      isExpired,
    });

    return isExpired;
  };

  const getCachedValidation = (
    cache: Record<string, SimpleValidationCacheEntry>,
    cacheKey: string
  ): ValidationResult | null => {
    console.log('🔍 [BASE_ADAPTER] 검증 캐시 조회:', cacheKey);

    const hasEntryInCache = cacheKey in cache;
    if (!hasEntryInCache) {
      console.log('🔍 [BASE_ADAPTER] 검증 캐시에 엔트리 없음');
      return null;
    }

    const validationEntry = cache[cacheKey];
    const isEntryExpired = isValidationEntryExpired(validationEntry);

    if (isEntryExpired) {
      console.log('🔍 [BASE_ADAPTER] 검증 캐시 엔트리 만료됨');
      return null;
    }

    console.log('✅ [BASE_ADAPTER] 유효한 검증 캐시 반환');
    return validationEntry.result;
  };

  const setCachedValidation = (
    cache: Record<string, SimpleValidationCacheEntry>,
    cacheKey: string,
    result: ValidationResult,
    expirationMs: number = 60000
  ): Record<string, SimpleValidationCacheEntry> => {
    console.log('📋 [BASE_ADAPTER] 검증 캐시 저장:', cacheKey);

    const newValidationEntry = createValidationEntry(result, expirationMs);
    const updatedCache = { ...cache };
    updatedCache[cacheKey] = newValidationEntry;

    return updatedCache;
  };

  return {
    getCachedValidation,
    setCachedValidation,
  };
}

function createAdapterMetricsUpdater() {
  const updateOperationMetrics = (
    currentMetrics: AdapterPerformanceMetrics,
    operationSuccess: boolean,
    operationDurationMs: number
  ): AdapterPerformanceMetrics => {
    console.log('📊 [BASE_ADAPTER] 성능 메트릭 업데이트:', {
      operationSuccess,
      operationDurationMs,
    });

    const incrementedTotalOperations = currentMetrics.totalOperations + 1;
    const incrementedSuccessfulOperations = operationSuccess
      ? currentMetrics.successfulOperations + 1
      : currentMetrics.successfulOperations;
    const incrementedFailedOperations = operationSuccess
      ? currentMetrics.failedOperations
      : currentMetrics.failedOperations + 1;

    const {
      totalOperations: previousTotalOperations,
      averageResponseTimeMs: previousAverageResponseTime,
    } = currentMetrics;
    const calculatedNewAverage =
      previousTotalOperations > 0
        ? (previousAverageResponseTime * previousTotalOperations +
            operationDurationMs) /
          incrementedTotalOperations
        : operationDurationMs;

    return {
      totalOperations: incrementedTotalOperations,
      successfulOperations: incrementedSuccessfulOperations,
      failedOperations: incrementedFailedOperations,
      averageResponseTimeMs: calculatedNewAverage,
      lastOperationDuration: operationDurationMs,
    };
  };

  const getMetricsSummary = (
    metrics: AdapterPerformanceMetrics
  ): Record<string, number> => {
    const {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTimeMs,
    } = metrics;

    const successRate =
      totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0;
    const failureRate =
      totalOperations > 0 ? (failedOperations / totalOperations) * 100 : 0;

    console.log('📊 [BASE_ADAPTER] 메트릭 요약 생성:', {
      successRate: successRate.toFixed(2),
      failureRate: failureRate.toFixed(2),
    });

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      successRate,
      failureRate,
      averageResponseTimeMs,
    };
  };

  return {
    updateOperationMetrics,
    getMetricsSummary,
  };
}

function createConnectionStateManager() {
  const updateConnectionState = (
    currentState: AdapterConnectionState,
    connectionSuccess: boolean
  ): AdapterConnectionState => {
    console.log('🔗 [BASE_ADAPTER] 연결 상태 업데이트:', connectionSuccess);

    const incrementedConnectionAttempts = currentState.connectionAttempts + 1;
    const updatedLastConnectionTime = connectionSuccess
      ? Date.now()
      : currentState.lastConnectionTime;

    return {
      isConnected: connectionSuccess,
      lastConnectionTime: updatedLastConnectionTime,
      connectionAttempts: incrementedConnectionAttempts,
      lastHealthCheckTime: currentState.lastHealthCheckTime,
      healthCheckStatus: connectionSuccess
        ? true
        : currentState.healthCheckStatus,
    };
  };

  const updateHealthCheckState = (
    currentState: AdapterConnectionState,
    healthCheckSuccess: boolean
  ): AdapterConnectionState => {
    console.log(
      '💓 [BASE_ADAPTER] 헬스체크 상태 업데이트:',
      healthCheckSuccess
    );

    return {
      isConnected: currentState.isConnected,
      lastConnectionTime: currentState.lastConnectionTime,
      connectionAttempts: currentState.connectionAttempts,
      lastHealthCheckTime: Date.now(),
      healthCheckStatus: healthCheckSuccess,
    };
  };

  const shouldPerformHealthCheck = (
    currentState: AdapterConnectionState,
    healthCheckIntervalMs: number
  ): boolean => {
    const { lastHealthCheckTime } = currentState;
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastHealthCheckTime;
    const shouldCheck = timeSinceLastCheck >= healthCheckIntervalMs;

    console.log('💓 [BASE_ADAPTER] 헬스체크 필요 여부:', {
      timeSinceLastCheck,
      healthCheckIntervalMs,
      shouldCheck,
    });

    return shouldCheck;
  };

  return {
    updateConnectionState,
    updateHealthCheckState,
    shouldPerformHealthCheck,
  };
}

function createSafeErrorContextConverter() {
  const convertToSafeErrorValue = (
    value: unknown
  ): string | number | boolean | null => {
    console.log('🔄 [BASE_ADAPTER] 안전한 에러 값 변환:', typeof value);

    // Early Return: null 처리
    if (value === null) {
      return null;
    }

    // Early Return: undefined 처리
    if (value === undefined) {
      return null;
    }

    // Early Return: string 처리
    if (typeof value === 'string') {
      return value;
    }

    // Early Return: number 처리
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }

    // Early Return: boolean 처리
    if (typeof value === 'boolean') {
      return value;
    }

    // 기타 모든 타입을 문자열로 변환
    try {
      const convertedString = String(value);
      console.log('✅ [BASE_ADAPTER] 문자열로 변환 완료');
      return convertedString;
    } catch (conversionError) {
      console.error('❌ [BASE_ADAPTER] 변환 실패:', conversionError);
      return 'Conversion failed';
    }
  };

  const createSafeErrorContext = (
    operationName: string,
    additionalData?: Record<string, unknown>
  ): Record<string, string | number | boolean | null> => {
    console.log('📊 [BASE_ADAPTER] 안전한 에러 컨텍스트 생성:', operationName);

    const baseContext: Record<string, string | number | boolean | null> = {
      operationName,
      timestamp: Date.now(),
      userAgent: 'Unknown',
      url: 'Unknown',
    };

    // 브라우저 환경에서만 실행
    if (typeof globalThis !== 'undefined') {
      const navigatorUserAgent = globalThis?.navigator?.userAgent;
      baseContext.userAgent = navigatorUserAgent
        ? String(navigatorUserAgent)
        : 'Unknown';

      const locationHref = globalThis?.location?.href;
      baseContext.url = locationHref ? String(locationHref) : 'Unknown';
    }

    // 추가 데이터가 있는 경우 안전하게 변환
    const hasAdditionalData =
      additionalData && typeof additionalData === 'object';
    if (hasAdditionalData) {
      for (const [dataKey, dataValue] of Object.entries(additionalData)) {
        const safeValue = convertToSafeErrorValue(dataValue);
        baseContext[dataKey] = safeValue;
      }
    }

    console.log('✅ [BASE_ADAPTER] 안전한 에러 컨텍스트 생성 완료');
    return baseContext;
  };

  return {
    convertToSafeErrorValue,
    createSafeErrorContext,
  };
}

abstract class BaseAdapter<TData, TSnapshot> {
  protected readonly adapterName: string;
  protected readonly adapterVersion: string;
  protected readonly adapterConfig: AdapterConnectionConfig;
  protected adapterConnectionState: AdapterConnectionState;
  protected adapterPerformanceMetrics: AdapterPerformanceMetrics;
  protected dataCache: Record<string, SimpleCacheEntry<TData>>;
  protected validationCache: Record<string, SimpleValidationCacheEntry>;

  private readonly cacheManager = createSimpleCacheManager<TData>();
  private readonly validationCacheManager = createValidationCacheManager();
  private readonly metricsUpdater = createAdapterMetricsUpdater();
  private readonly connectionStateManager = createConnectionStateManager();
  private readonly errorContextConverter = createSafeErrorContextConverter();

  constructor(
    adapterName: string,
    adapterVersion: string = '1.0.0',
    customConfig: Partial<AdapterConnectionConfig> = {}
  ) {
    console.log('🏗️ [BASE_ADAPTER] 어댑터 초기화:', adapterName);

    this.adapterName = adapterName;
    this.adapterVersion = adapterVersion;
    this.adapterConfig = { ...createDefaultAdapterConfig(), ...customConfig };
    this.adapterConnectionState = createInitialConnectionState();
    this.adapterPerformanceMetrics = createInitialPerformanceMetrics();
    this.dataCache = {};
    this.validationCache = {};

    console.log('✅ [BASE_ADAPTER] 어댑터 초기화 완료:', {
      adapterName,
      adapterVersion,
    });
  }

  // 🔧 추상 메서드들 - 각 구체적 어댑터에서 구현해야 함
  protected abstract performConnection(): Promise<boolean>;
  protected abstract performDisconnection(): Promise<void>;
  protected abstract performHealthCheck(): Promise<boolean>;
  protected abstract extractDataFromSystem(): Promise<TData>;
  protected abstract updateDataToSystem(dataPayload: TData): Promise<boolean>;
  protected abstract validateExtractedData(
    dataPayload: TData
  ): ValidationResult;
  protected abstract createDataSnapshot(dataPayload: TData): TSnapshot;

  // 🔧 공개 인터페이스 메서드들
  public async connect(): Promise<boolean> {
    console.log('🔗 [BASE_ADAPTER] 연결 시작:', this.adapterName);

    const connectionOperation = async (): Promise<boolean> => {
      const connectionSuccess = await this.performConnection();

      this.adapterConnectionState =
        this.connectionStateManager.updateConnectionState(
          this.adapterConnectionState,
          connectionSuccess
        );

      return connectionSuccess;
    };

    const { timeoutMs, maxRetryAttempts, retryDelayMs } = this.adapterConfig;

    const connectionResult = await safelyExecuteAsyncOperation(
      async () => {
        const connectionWithTimeout = withTimeout(
          connectionOperation(),
          timeoutMs,
          `${this.adapterName} 연결 타임아웃`
        );

        return await withRetry(() => connectionWithTimeout, {
          maxRetries: maxRetryAttempts,
          delayMs: retryDelayMs,
          backoffMultiplier: 1.5,
          maxDelayMs: 10000,
        });
      },
      false,
      `${this.adapterName}_CONNECTION`
    );

    console.log('🔗 [BASE_ADAPTER] 연결 완료:', {
      adapterName: this.adapterName,
      connectionResult,
    });

    return connectionResult;
  }

  public async disconnect(): Promise<void> {
    console.log('🔌 [BASE_ADAPTER] 연결 해제 시작:', this.adapterName);

    const disconnectionOperation = async (): Promise<void> => {
      await this.performDisconnection();

      this.adapterConnectionState = {
        ...this.adapterConnectionState,
        isConnected: false,
        healthCheckStatus: false,
      };
    };

    await safelyExecuteAsyncOperation(
      disconnectionOperation,
      undefined,
      `${this.adapterName}_DISCONNECTION`
    );

    console.log('🔌 [BASE_ADAPTER] 연결 해제 완료:', this.adapterName);
  }

  public async healthCheck(): Promise<boolean> {
    console.log('💓 [BASE_ADAPTER] 헬스체크 시작:', this.adapterName);

    const { isConnected } = this.adapterConnectionState;
    if (!isConnected) {
      console.log('💓 [BASE_ADAPTER] 연결되지 않은 상태, 헬스체크 건너뜀');
      return false;
    }

    const healthCheckOperation = async (): Promise<boolean> => {
      const healthCheckSuccess = await this.performHealthCheck();

      this.adapterConnectionState =
        this.connectionStateManager.updateHealthCheckState(
          this.adapterConnectionState,
          healthCheckSuccess
        );

      return healthCheckSuccess;
    };

    const { timeoutMs } = this.adapterConfig;

    const healthCheckResult = await safelyExecuteAsyncOperation(
      async () => {
        return await withTimeout(
          healthCheckOperation(),
          timeoutMs,
          `${this.adapterName} 헬스체크 타임아웃`
        );
      },
      false,
      `${this.adapterName}_HEALTH_CHECK`
    );

    console.log('💓 [BASE_ADAPTER] 헬스체크 완료:', {
      adapterName: this.adapterName,
      healthCheckResult,
    });

    return healthCheckResult;
  }

  public async extractData(): Promise<TData | null> {
    console.log('📤 [BASE_ADAPTER] 데이터 추출 시작:', this.adapterName);

    const operationStartTime = performance.now();

    const extractionOperation = async (): Promise<TData | null> => {
      const { isConnected } = this.adapterConnectionState;
      if (!isConnected) {
        throw new Error(`${this.adapterName} 어댑터가 연결되지 않음`);
      }

      const extractedData = await this.extractDataFromSystem();
      return extractedData;
    };

    const extractionResult = await safelyExecuteAsyncOperation(
      extractionOperation,
      null,
      `${this.adapterName}_DATA_EXTRACTION`
    );

    const operationDuration = performance.now() - operationStartTime;
    const operationSuccess = extractionResult !== null;

    this.adapterPerformanceMetrics = this.metricsUpdater.updateOperationMetrics(
      this.adapterPerformanceMetrics,
      operationSuccess,
      operationDuration
    );

    console.log('📤 [BASE_ADAPTER] 데이터 추출 완료:', {
      adapterName: this.adapterName,
      operationSuccess,
      operationDuration: `${operationDuration.toFixed(2)}ms`,
    });

    return extractionResult;
  }

  public async updateData(dataPayload: TData): Promise<boolean> {
    console.log('📥 [BASE_ADAPTER] 데이터 업데이트 시작:', this.adapterName);

    const operationStartTime = performance.now();

    const updateOperation = async (): Promise<boolean> => {
      const { isConnected } = this.adapterConnectionState;
      if (!isConnected) {
        throw new Error(`${this.adapterName} 어댑터가 연결되지 않음`);
      }

      const updateSuccess = await this.updateDataToSystem(dataPayload);
      return updateSuccess;
    };

    const updateResult = await safelyExecuteAsyncOperation(
      updateOperation,
      false,
      `${this.adapterName}_DATA_UPDATE`
    );

    const operationDuration = performance.now() - operationStartTime;

    this.adapterPerformanceMetrics = this.metricsUpdater.updateOperationMetrics(
      this.adapterPerformanceMetrics,
      updateResult,
      operationDuration
    );

    console.log('📥 [BASE_ADAPTER] 데이터 업데이트 완료:', {
      adapterName: this.adapterName,
      updateResult,
      operationDuration: `${operationDuration.toFixed(2)}ms`,
    });

    return updateResult;
  }

  public validateData(dataPayload: TData): ValidationResult {
    console.log('🔍 [BASE_ADAPTER] 데이터 검증 시작:', this.adapterName);

    const dataString = JSON.stringify(dataPayload);
    const validationCacheKey = `${this.adapterName}_${dataString.substring(
      0,
      100
    )}`;

    const cachedValidationResult =
      this.validationCacheManager.getCachedValidation(
        this.validationCache,
        validationCacheKey
      );

    if (cachedValidationResult !== null) {
      console.log('🔍 [BASE_ADAPTER] 캐시된 검증 결과 사용');
      return cachedValidationResult;
    }

    const validationResult = this.validateExtractedData(dataPayload);

    this.validationCache = this.validationCacheManager.setCachedValidation(
      this.validationCache,
      validationCacheKey,
      validationResult
    );

    console.log('🔍 [BASE_ADAPTER] 데이터 검증 완료:', {
      adapterName: this.adapterName,
      isValidForTransfer: validationResult.isValidForTransfer,
      errorCount: validationResult.validationErrors.length,
    });

    return validationResult;
  }

  public createSnapshot(dataPayload: TData): TSnapshot {
    console.log('📸 [BASE_ADAPTER] 스냅샷 생성 시작:', this.adapterName);

    const snapshotResult = this.createDataSnapshot(dataPayload);

    console.log('📸 [BASE_ADAPTER] 스냅샷 생성 완료:', this.adapterName);

    return snapshotResult;
  }

  public handleError(errorSource: unknown): ErrorDetails {
    console.log('❌ [BASE_ADAPTER] 에러 처리 시작:', this.adapterName);

    const errorMessage = extractErrorMessage(errorSource);
    const errorSeverity = getErrorSeverity(errorSource);
    const isErrorRecoverable = isRecoverableError(errorSource);

    const safeErrorContext = this.errorContextConverter.createSafeErrorContext(
      `${this.adapterName}_ERROR`,
      {
        adapterVersion: this.adapterVersion,
        connectionState: this.adapterConnectionState.isConnected,
      }
    );

    const convertedOriginalError =
      this.errorContextConverter.convertToSafeErrorValue(errorSource);

    const errorContextForBridge: BridgeErrorContext = {
      context: `${this.adapterName}_ADAPTER_ERROR`,
      originalError: convertedOriginalError,
      timestamp: Date.now(),
      additionalData: new Map(Object.entries(safeErrorContext)),
      errorMetadata: new Map<string, unknown>([
        ['adapterName', this.adapterName],
        ['adapterVersion', this.adapterVersion],
        ['isRecoverable', isErrorRecoverable],
      ]),
    };

    const errorDetails: ErrorDetails = {
      errorCode: `${this.adapterName.toUpperCase()}_ERROR`,
      errorMessage,
      errorTimestamp: new Date(),
      errorContext: errorContextForBridge,
      isRecoverable: isErrorRecoverable,
      errorSeverity,
    };

    console.log('❌ [BASE_ADAPTER] 에러 처리 완료:', {
      adapterName: this.adapterName,
      errorSeverity,
      isRecoverable: isErrorRecoverable,
    });

    return errorDetails;
  }

  public getAdapterInfo(): Record<string, unknown> {
    console.log('ℹ️ [BASE_ADAPTER] 어댑터 정보 조회:', this.adapterName);

    const { isConnected, lastConnectionTime, healthCheckStatus } =
      this.adapterConnectionState;
    const metricsSummary = this.metricsUpdater.getMetricsSummary(
      this.adapterPerformanceMetrics
    );

    return {
      adapterName: this.adapterName,
      adapterVersion: this.adapterVersion,
      connectionStatus: {
        isConnected,
        lastConnectionTime,
        healthCheckStatus,
      },
      performanceMetrics: metricsSummary,
      configuration: this.adapterConfig,
    };
  }

  public getConnectionState(): AdapterConnectionState {
    console.log('🔗 [BASE_ADAPTER] 연결 상태 조회:', this.adapterName);
    return { ...this.adapterConnectionState };
  }

  public getPerformanceMetrics(): AdapterPerformanceMetrics {
    console.log('📊 [BASE_ADAPTER] 성능 메트릭 조회:', this.adapterName);
    return { ...this.adapterPerformanceMetrics };
  }

  protected clearDataCache(): void {
    console.log('🧹 [BASE_ADAPTER] 데이터 캐시 정리:', this.adapterName);
    this.dataCache = this.cacheManager.clearExpiredEntries(this.dataCache);
  }

  protected getCachedData(cacheKey: string): TData | null {
    return this.cacheManager.getCachedData(this.dataCache, cacheKey);
  }

  protected setCachedData(cacheKey: string, dataValue: TData): void {
    this.dataCache = this.cacheManager.setCachedData(
      this.dataCache,
      cacheKey,
      dataValue
    );
  }
}

export default BaseAdapter;

export type {
  AdapterConnectionConfig,
  AdapterConnectionState,
  AdapterPerformanceMetrics,
  SimpleCacheEntry,
  SimpleValidationCacheEntry,
};
