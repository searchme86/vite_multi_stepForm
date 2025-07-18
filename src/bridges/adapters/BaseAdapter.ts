// adapters/BaseAdapter.ts

import type {
  ValidationResult,
  ErrorDetails,
  BridgeErrorContext,
} from '../editorMultiStepBridge/modernBridgeTypes';

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
    entryData: T,
    cacheExpirationMs: number = 300000
  ): SimpleCacheEntry<T> => {
    console.log('💾 [BASE_ADAPTER] 캐시 엔트리 생성');

    return {
      data: entryData,
      timestamp: Date.now(),
      expirationMs: cacheExpirationMs,
    };
  };

  const isCacheEntryExpired = (cacheEntry: SimpleCacheEntry<T>): boolean => {
    const currentTimestamp = Date.now();
    const { timestamp: entryTimestamp, expirationMs } = cacheEntry;
    const cacheAge = currentTimestamp - entryTimestamp;
    const isExpired = cacheAge > expirationMs;

    console.log('🔍 [BASE_ADAPTER] 캐시 만료 검사:', {
      cacheAge,
      expirationMs,
      isExpired,
    });

    return isExpired;
  };

  const getCachedData = (
    cacheStorage: Record<string, SimpleCacheEntry<T>>,
    cacheKey: string
  ): T | null => {
    console.log('🔍 [BASE_ADAPTER] 캐시 데이터 조회:', cacheKey);

    const hasEntryInStorage = cacheKey in cacheStorage;
    if (!hasEntryInStorage) {
      console.log('🔍 [BASE_ADAPTER] 캐시에 엔트리 없음');
      return null;
    }

    const cachedEntry = cacheStorage[cacheKey];
    const isEntryExpired = isCacheEntryExpired(cachedEntry);

    if (isEntryExpired) {
      console.log('🔍 [BASE_ADAPTER] 캐시 엔트리 만료됨');
      return null;
    }

    console.log('✅ [BASE_ADAPTER] 유효한 캐시 데이터 반환');
    const { data: cachedData } = cachedEntry;
    return cachedData;
  };

  const setCachedData = (
    cacheStorage: Record<string, SimpleCacheEntry<T>>,
    cacheKey: string,
    dataToCache: T,
    cacheExpirationMs: number = 300000
  ): Record<string, SimpleCacheEntry<T>> => {
    console.log('💾 [BASE_ADAPTER] 캐시 데이터 저장:', cacheKey);

    const newCacheEntry = createCacheEntry(dataToCache, cacheExpirationMs);
    const updatedCacheStorage = { ...cacheStorage };
    updatedCacheStorage[cacheKey] = newCacheEntry;

    return updatedCacheStorage;
  };

  const clearExpiredEntries = (
    cacheStorage: Record<string, SimpleCacheEntry<T>>
  ): Record<string, SimpleCacheEntry<T>> => {
    console.log('🧹 [BASE_ADAPTER] 만료된 캐시 엔트리 정리');

    const cleanedCacheStorage: Record<string, SimpleCacheEntry<T>> = {};
    let originalEntryCount = 0;
    let validEntryCount = 0;

    for (const [storageKey, cacheEntry] of Object.entries(cacheStorage)) {
      originalEntryCount++;
      const isEntryExpired = isCacheEntryExpired(cacheEntry);

      if (!isEntryExpired) {
        cleanedCacheStorage[storageKey] = cacheEntry;
        validEntryCount++;
      }
    }

    console.log('🧹 [BASE_ADAPTER] 캐시 정리 완료:', {
      originalEntryCount,
      validEntryCount,
      removedEntryCount: originalEntryCount - validEntryCount,
    });

    return cleanedCacheStorage;
  };

  return {
    getCachedData,
    setCachedData,
    clearExpiredEntries,
  };
}

function createValidationCacheManager() {
  const createValidationEntry = (
    validationResult: ValidationResult,
    cacheExpirationMs: number = 60000
  ): SimpleValidationCacheEntry => {
    console.log('📋 [BASE_ADAPTER] 검증 캐시 엔트리 생성');

    return {
      result: validationResult,
      timestamp: Date.now(),
      expirationMs: cacheExpirationMs,
    };
  };

  const isValidationEntryExpired = (
    validationEntry: SimpleValidationCacheEntry
  ): boolean => {
    const currentTimestamp = Date.now();
    const { timestamp: entryTimestamp, expirationMs } = validationEntry;
    const entryAge = currentTimestamp - entryTimestamp;
    const isExpired = entryAge > expirationMs;

    console.log('🔍 [BASE_ADAPTER] 검증 캐시 만료 검사:', {
      entryAge,
      expirationMs,
      isExpired,
    });

    return isExpired;
  };

  const getCachedValidation = (
    validationCacheStorage: Record<string, SimpleValidationCacheEntry>,
    validationCacheKey: string
  ): ValidationResult | null => {
    console.log('🔍 [BASE_ADAPTER] 검증 캐시 조회:', validationCacheKey);

    const hasValidationInStorage = validationCacheKey in validationCacheStorage;
    if (!hasValidationInStorage) {
      console.log('🔍 [BASE_ADAPTER] 검증 캐시에 엔트리 없음');
      return null;
    }

    const validationEntry = validationCacheStorage[validationCacheKey];
    const isEntryExpired = isValidationEntryExpired(validationEntry);

    if (isEntryExpired) {
      console.log('🔍 [BASE_ADAPTER] 검증 캐시 엔트리 만료됨');
      return null;
    }

    console.log('✅ [BASE_ADAPTER] 유효한 검증 캐시 반환');
    const { result: validationResult } = validationEntry;
    return validationResult;
  };

  const setCachedValidation = (
    validationCacheStorage: Record<string, SimpleValidationCacheEntry>,
    validationCacheKey: string,
    validationResult: ValidationResult,
    cacheExpirationMs: number = 60000
  ): Record<string, SimpleValidationCacheEntry> => {
    console.log('📋 [BASE_ADAPTER] 검증 캐시 저장:', validationCacheKey);

    const newValidationEntry = createValidationEntry(
      validationResult,
      cacheExpirationMs
    );
    const updatedValidationStorage = { ...validationCacheStorage };
    updatedValidationStorage[validationCacheKey] = newValidationEntry;

    return updatedValidationStorage;
  };

  return {
    getCachedValidation,
    setCachedValidation,
  };
}

function createAdapterMetricsUpdater() {
  const updateOperationMetrics = (
    currentMetricsState: AdapterPerformanceMetrics,
    wasOperationSuccessful: boolean,
    operationDurationMs: number
  ): AdapterPerformanceMetrics => {
    console.log('📊 [BASE_ADAPTER] 성능 메트릭 업데이트:', {
      wasOperationSuccessful,
      operationDurationMs,
    });

    const {
      totalOperations: previousTotalOperations,
      successfulOperations: previousSuccessfulOperations,
      failedOperations: previousFailedOperations,
      averageResponseTimeMs: previousAverageResponseTime,
    } = currentMetricsState;

    const updatedTotalOperations = previousTotalOperations + 1;
    const updatedSuccessfulOperations = wasOperationSuccessful
      ? previousSuccessfulOperations + 1
      : previousSuccessfulOperations;
    const updatedFailedOperations = wasOperationSuccessful
      ? previousFailedOperations
      : previousFailedOperations + 1;

    const calculatedNewAverage =
      previousTotalOperations > 0
        ? (previousAverageResponseTime * previousTotalOperations +
            operationDurationMs) /
          updatedTotalOperations
        : operationDurationMs;

    return {
      totalOperations: updatedTotalOperations,
      successfulOperations: updatedSuccessfulOperations,
      failedOperations: updatedFailedOperations,
      averageResponseTimeMs: calculatedNewAverage,
      lastOperationDuration: operationDurationMs,
    };
  };

  const getMetricsSummary = (
    performanceMetrics: AdapterPerformanceMetrics
  ): Record<string, number> => {
    const {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTimeMs,
    } = performanceMetrics;

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
    currentConnectionState: AdapterConnectionState,
    wasConnectionSuccessful: boolean
  ): AdapterConnectionState => {
    console.log(
      '🔗 [BASE_ADAPTER] 연결 상태 업데이트:',
      wasConnectionSuccessful
    );

    const {
      connectionAttempts: previousConnectionAttempts,
      lastConnectionTime: previousLastConnectionTime,
      lastHealthCheckTime: currentLastHealthCheckTime,
      healthCheckStatus: currentHealthCheckStatus,
    } = currentConnectionState;

    const updatedConnectionAttempts = previousConnectionAttempts + 1;
    const updatedLastConnectionTime = wasConnectionSuccessful
      ? Date.now()
      : previousLastConnectionTime;

    return {
      isConnected: wasConnectionSuccessful,
      lastConnectionTime: updatedLastConnectionTime,
      connectionAttempts: updatedConnectionAttempts,
      lastHealthCheckTime: currentLastHealthCheckTime,
      healthCheckStatus: wasConnectionSuccessful
        ? true
        : currentHealthCheckStatus,
    };
  };

  const updateHealthCheckState = (
    currentConnectionState: AdapterConnectionState,
    wasHealthCheckSuccessful: boolean
  ): AdapterConnectionState => {
    console.log(
      '💓 [BASE_ADAPTER] 헬스체크 상태 업데이트:',
      wasHealthCheckSuccessful
    );

    const {
      isConnected: currentIsConnected,
      lastConnectionTime: currentLastConnectionTime,
      connectionAttempts: currentConnectionAttempts,
    } = currentConnectionState;

    return {
      isConnected: currentIsConnected,
      lastConnectionTime: currentLastConnectionTime,
      connectionAttempts: currentConnectionAttempts,
      lastHealthCheckTime: Date.now(),
      healthCheckStatus: wasHealthCheckSuccessful,
    };
  };

  const shouldPerformHealthCheck = (
    currentConnectionState: AdapterConnectionState,
    healthCheckIntervalMs: number
  ): boolean => {
    const { lastHealthCheckTime } = currentConnectionState;
    const currentTimestamp = Date.now();
    const timeSinceLastHealthCheck = currentTimestamp - lastHealthCheckTime;
    const shouldPerformCheck =
      timeSinceLastHealthCheck >= healthCheckIntervalMs;

    console.log('💓 [BASE_ADAPTER] 헬스체크 필요 여부:', {
      timeSinceLastHealthCheck,
      healthCheckIntervalMs,
      shouldPerformCheck,
    });

    return shouldPerformCheck;
  };

  return {
    updateConnectionState,
    updateHealthCheckState,
    shouldPerformHealthCheck,
  };
}

function createSafeErrorContextConverter() {
  const convertToSafeErrorValue = (
    sourceValue: unknown
  ): string | number | boolean | null => {
    console.log('🔄 [BASE_ADAPTER] 안전한 에러 값 변환:', typeof sourceValue);

    // Early Return: null 처리
    if (sourceValue === null) {
      return null;
    }

    // Early Return: undefined 처리
    if (sourceValue === undefined) {
      return null;
    }

    // Early Return: string 처리
    if (typeof sourceValue === 'string') {
      return sourceValue;
    }

    // Early Return: number 처리
    if (typeof sourceValue === 'number' && !Number.isNaN(sourceValue)) {
      return sourceValue;
    }

    // Early Return: boolean 처리
    if (typeof sourceValue === 'boolean') {
      return sourceValue;
    }

    // 기타 모든 타입을 문자열로 변환
    try {
      const convertedStringValue = String(sourceValue);
      console.log('✅ [BASE_ADAPTER] 문자열로 변환 완료');
      return convertedStringValue;
    } catch (conversionError) {
      console.error('❌ [BASE_ADAPTER] 변환 실패:', conversionError);
      return 'Conversion failed';
    }
  };

  const createSafeErrorContext = (
    operationName: string,
    additionalContextData?: Record<string, unknown>
  ): Record<string, string | number | boolean | null> => {
    console.log('📊 [BASE_ADAPTER] 안전한 에러 컨텍스트 생성:', operationName);

    const baseErrorContext: Record<string, string | number | boolean | null> = {
      operationName,
      timestamp: Date.now(),
      userAgent: 'Unknown',
      url: 'Unknown',
    };

    // 브라우저 환경에서만 실행
    if (typeof globalThis !== 'undefined') {
      const { navigator = null, location = null } = globalThis;

      const navigatorUserAgent = navigator?.userAgent;
      baseErrorContext.userAgent = navigatorUserAgent
        ? String(navigatorUserAgent)
        : 'Unknown';

      const locationHref = location?.href;
      baseErrorContext.url = locationHref ? String(locationHref) : 'Unknown';
    }

    // 추가 데이터가 있는 경우 안전하게 변환
    const hasAdditionalContextData =
      additionalContextData && typeof additionalContextData === 'object';
    if (hasAdditionalContextData) {
      for (const [contextKey, contextValue] of Object.entries(
        additionalContextData
      )) {
        const safeContextValue = convertToSafeErrorValue(contextValue);
        baseErrorContext[contextKey] = safeContextValue;
      }
    }

    console.log('✅ [BASE_ADAPTER] 안전한 에러 컨텍스트 생성 완료');
    return baseErrorContext;
  };

  return {
    convertToSafeErrorValue,
    createSafeErrorContext,
  };
}

abstract class BaseAdapter<TAdapterData, TAdapterSnapshot> {
  protected readonly adapterIdentifier: string;
  protected readonly adapterVersionString: string;
  protected readonly adapterConfigurationSettings: AdapterConnectionConfig;
  protected adapterCurrentConnectionState: AdapterConnectionState;
  protected adapterCurrentPerformanceMetrics: AdapterPerformanceMetrics;
  protected adapterDataCacheStorage: Record<
    string,
    SimpleCacheEntry<TAdapterData>
  >;
  protected adapterValidationCacheStorage: Record<
    string,
    SimpleValidationCacheEntry
  >;

  private readonly cacheManagementModule =
    createSimpleCacheManager<TAdapterData>();
  private readonly validationCacheManagementModule =
    createValidationCacheManager();
  private readonly metricsUpdaterModule = createAdapterMetricsUpdater();
  private readonly connectionStateManagementModule =
    createConnectionStateManager();
  private readonly errorContextConverterModule =
    createSafeErrorContextConverter();

  constructor(
    adapterIdentifier: string,
    adapterVersionString: string = '1.0.0',
    customConfigurationSettings: Partial<AdapterConnectionConfig> = {}
  ) {
    console.log('🏗️ [BASE_ADAPTER] 어댑터 초기화:', adapterIdentifier);

    this.adapterIdentifier = adapterIdentifier;
    this.adapterVersionString = adapterVersionString;
    this.adapterConfigurationSettings = {
      ...createDefaultAdapterConfig(),
      ...customConfigurationSettings,
    };
    this.adapterCurrentConnectionState = createInitialConnectionState();
    this.adapterCurrentPerformanceMetrics = createInitialPerformanceMetrics();
    this.adapterDataCacheStorage = {};
    this.adapterValidationCacheStorage = {};

    console.log('✅ [BASE_ADAPTER] 어댑터 초기화 완료:', {
      adapterIdentifier,
      adapterVersionString,
    });
  }

  // 🔧 추상 메서드들 - 각 구체적 어댑터에서 구현해야 함
  protected abstract performConnection(): Promise<boolean>;
  protected abstract performDisconnection(): Promise<void>;
  protected abstract performHealthCheck(): Promise<boolean>;
  protected abstract extractDataFromSystem(): Promise<TAdapterData>;
  protected abstract updateDataToSystem(
    dataPayload: TAdapterData
  ): Promise<boolean>;
  protected abstract validateExtractedData(
    dataPayload: TAdapterData
  ): ValidationResult;
  protected abstract createDataSnapshot(
    dataPayload: TAdapterData
  ): TAdapterSnapshot;

  // 🔧 공개 인터페이스 메서드들
  public async connect(): Promise<boolean> {
    console.log('🔗 [BASE_ADAPTER] 연결 시작:', this.adapterIdentifier);

    const connectionOperation = async (): Promise<boolean> => {
      const wasConnectionSuccessful = await this.performConnection();

      this.adapterCurrentConnectionState =
        this.connectionStateManagementModule.updateConnectionState(
          this.adapterCurrentConnectionState,
          wasConnectionSuccessful
        );

      return wasConnectionSuccessful;
    };

    const { timeoutMs, maxRetryAttempts, retryDelayMs } =
      this.adapterConfigurationSettings;

    const connectionResult = await safelyExecuteAsyncOperation(
      async () => {
        const connectionWithTimeoutLimit = withTimeout(
          connectionOperation(),
          timeoutMs,
          `${this.adapterIdentifier} 연결 타임아웃`
        );

        return await withRetry(() => connectionWithTimeoutLimit, {
          maxRetries: maxRetryAttempts,
          delayMs: retryDelayMs,
          backoffMultiplier: 1.5,
          maxDelayMs: 10000,
        });
      },
      false,
      `${this.adapterIdentifier}_CONNECTION`
    );

    console.log('🔗 [BASE_ADAPTER] 연결 완료:', {
      adapterIdentifier: this.adapterIdentifier,
      connectionResult,
    });

    return connectionResult;
  }

  public async disconnect(): Promise<void> {
    console.log('🔌 [BASE_ADAPTER] 연결 해제 시작:', this.adapterIdentifier);

    const disconnectionOperation = async (): Promise<void> => {
      await this.performDisconnection();

      this.adapterCurrentConnectionState = {
        ...this.adapterCurrentConnectionState,
        isConnected: false,
        healthCheckStatus: false,
      };
    };

    await safelyExecuteAsyncOperation(
      disconnectionOperation,
      undefined,
      `${this.adapterIdentifier}_DISCONNECTION`
    );

    console.log('🔌 [BASE_ADAPTER] 연결 해제 완료:', this.adapterIdentifier);
  }

  public async healthCheck(): Promise<boolean> {
    console.log('💓 [BASE_ADAPTER] 헬스체크 시작:', this.adapterIdentifier);

    const { isConnected: currentIsConnected } =
      this.adapterCurrentConnectionState;
    if (!currentIsConnected) {
      console.log('💓 [BASE_ADAPTER] 연결되지 않은 상태, 헬스체크 건너뜀');
      return false;
    }

    const healthCheckOperation = async (): Promise<boolean> => {
      const wasHealthCheckSuccessful = await this.performHealthCheck();

      this.adapterCurrentConnectionState =
        this.connectionStateManagementModule.updateHealthCheckState(
          this.adapterCurrentConnectionState,
          wasHealthCheckSuccessful
        );

      return wasHealthCheckSuccessful;
    };

    const { timeoutMs } = this.adapterConfigurationSettings;

    const healthCheckResult = await safelyExecuteAsyncOperation(
      async () => {
        return await withTimeout(
          healthCheckOperation(),
          timeoutMs,
          `${this.adapterIdentifier} 헬스체크 타임아웃`
        );
      },
      false,
      `${this.adapterIdentifier}_HEALTH_CHECK`
    );

    console.log('💓 [BASE_ADAPTER] 헬스체크 완료:', {
      adapterIdentifier: this.adapterIdentifier,
      healthCheckResult,
    });

    return healthCheckResult;
  }

  public async extractData(): Promise<TAdapterData | null> {
    console.log('📤 [BASE_ADAPTER] 데이터 추출 시작:', this.adapterIdentifier);

    const operationStartTime = performance.now();

    const extractionOperation = async (): Promise<TAdapterData | null> => {
      const { isConnected: currentIsConnected } =
        this.adapterCurrentConnectionState;
      if (!currentIsConnected) {
        throw new Error(`${this.adapterIdentifier} 어댑터가 연결되지 않음`);
      }

      const extractedDataResult = await this.extractDataFromSystem();
      return extractedDataResult;
    };

    const extractionResult = await safelyExecuteAsyncOperation(
      extractionOperation,
      null,
      `${this.adapterIdentifier}_DATA_EXTRACTION`
    );

    const operationEndTime = performance.now();
    const operationDurationMs = operationEndTime - operationStartTime;
    const wasOperationSuccessful = extractionResult !== null;

    this.adapterCurrentPerformanceMetrics =
      this.metricsUpdaterModule.updateOperationMetrics(
        this.adapterCurrentPerformanceMetrics,
        wasOperationSuccessful,
        operationDurationMs
      );

    console.log('📤 [BASE_ADAPTER] 데이터 추출 완료:', {
      adapterIdentifier: this.adapterIdentifier,
      wasOperationSuccessful,
      operationDurationMs: `${operationDurationMs.toFixed(2)}ms`,
    });

    return extractionResult;
  }

  public async updateData(dataPayload: TAdapterData): Promise<boolean> {
    console.log(
      '📥 [BASE_ADAPTER] 데이터 업데이트 시작:',
      this.adapterIdentifier
    );

    const operationStartTime = performance.now();

    const updateOperation = async (): Promise<boolean> => {
      const { isConnected: currentIsConnected } =
        this.adapterCurrentConnectionState;
      if (!currentIsConnected) {
        throw new Error(`${this.adapterIdentifier} 어댑터가 연결되지 않음`);
      }

      const wasUpdateSuccessful = await this.updateDataToSystem(dataPayload);
      return wasUpdateSuccessful;
    };

    const updateResult = await safelyExecuteAsyncOperation(
      updateOperation,
      false,
      `${this.adapterIdentifier}_DATA_UPDATE`
    );

    const operationEndTime = performance.now();
    const operationDurationMs = operationEndTime - operationStartTime;

    this.adapterCurrentPerformanceMetrics =
      this.metricsUpdaterModule.updateOperationMetrics(
        this.adapterCurrentPerformanceMetrics,
        updateResult,
        operationDurationMs
      );

    console.log('📥 [BASE_ADAPTER] 데이터 업데이트 완료:', {
      adapterIdentifier: this.adapterIdentifier,
      updateResult,
      operationDurationMs: `${operationDurationMs.toFixed(2)}ms`,
    });

    return updateResult;
  }

  public validateData(dataPayload: TAdapterData): ValidationResult {
    console.log('🔍 [BASE_ADAPTER] 데이터 검증 시작:', this.adapterIdentifier);

    const dataStringRepresentation = JSON.stringify(dataPayload);
    const validationCacheKey = `${
      this.adapterIdentifier
    }_${dataStringRepresentation.substring(0, 100)}`;

    const cachedValidationResult =
      this.validationCacheManagementModule.getCachedValidation(
        this.adapterValidationCacheStorage,
        validationCacheKey
      );

    if (cachedValidationResult !== null) {
      console.log('🔍 [BASE_ADAPTER] 캐시된 검증 결과 사용');
      return cachedValidationResult;
    }

    const currentValidationResult = this.validateExtractedData(dataPayload);

    this.adapterValidationCacheStorage =
      this.validationCacheManagementModule.setCachedValidation(
        this.adapterValidationCacheStorage,
        validationCacheKey,
        currentValidationResult
      );

    console.log('🔍 [BASE_ADAPTER] 데이터 검증 완료:', {
      adapterIdentifier: this.adapterIdentifier,
      isValidForTransfer: currentValidationResult.isValidForTransfer,
      errorCount: currentValidationResult.validationErrors.length,
    });

    return currentValidationResult;
  }

  public createSnapshot(dataPayload: TAdapterData): TAdapterSnapshot {
    console.log('📸 [BASE_ADAPTER] 스냅샷 생성 시작:', this.adapterIdentifier);

    const snapshotCreationResult = this.createDataSnapshot(dataPayload);

    console.log('📸 [BASE_ADAPTER] 스냅샷 생성 완료:', this.adapterIdentifier);

    return snapshotCreationResult;
  }

  public handleError(errorSource: unknown): ErrorDetails {
    console.log('❌ [BASE_ADAPTER] 에러 처리 시작:', this.adapterIdentifier);

    const extractedErrorMessage = extractErrorMessage(errorSource);
    const determinedErrorSeverity = getErrorSeverity(errorSource);
    const isErrorRecoverable = isRecoverableError(errorSource);

    console.log('🔍 [BASE_ADAPTER] 에러 복구 가능성 확인:', {
      isErrorRecoverable,
      errorType: typeof errorSource,
    });

    const safeErrorContextData =
      this.errorContextConverterModule.createSafeErrorContext(
        `${this.adapterIdentifier}_ERROR`,
        {
          adapterVersionString: this.adapterVersionString,
          connectionState: this.adapterCurrentConnectionState.isConnected,
        }
      );

    const convertedOriginalErrorSource =
      this.errorContextConverterModule.convertToSafeErrorValue(errorSource);

    const errorContextForBridge: BridgeErrorContext = {
      contextIdentifier: `${this.adapterIdentifier}_ADAPTER_ERROR`,
      originalErrorSource: convertedOriginalErrorSource,
      errorTimestamp: Date.now(),
      contextualData: new Map(Object.entries(safeErrorContextData)),
      errorMetadata: new Map<string, unknown>([
        ['adapterIdentifier', this.adapterIdentifier],
        ['adapterVersionString', this.adapterVersionString],
        ['isRecoverableError', isErrorRecoverable],
      ]),
      errorSeverityLevel: determinedErrorSeverity,
      isRecoverableError: isErrorRecoverable,
    };

    const errorDetailsForBridge: ErrorDetails = {
      errorCode: `${this.adapterIdentifier.toUpperCase()}_ERROR`,
      errorMessage: extractedErrorMessage,
      errorTimestamp: new Date(),
      errorContext: errorContextForBridge,
      isRecoverable: isErrorRecoverable,
      errorSeverity: determinedErrorSeverity,
      recoveryAttempts: 0,
      maxRecoveryAttempts: 3,
      recoveryStrategies: new Set(['RETRY', 'FALLBACK', 'RESET']),
    };

    console.log('❌ [BASE_ADAPTER] 에러 처리 완료:', {
      adapterIdentifier: this.adapterIdentifier,
      errorSeverity: determinedErrorSeverity,
      isRecoverable: isErrorRecoverable,
    });

    return errorDetailsForBridge;
  }

  public getAdapterInfo(): Record<string, unknown> {
    console.log('ℹ️ [BASE_ADAPTER] 어댑터 정보 조회:', this.adapterIdentifier);

    const {
      isConnected: currentIsConnected,
      lastConnectionTime: currentLastConnectionTime,
      healthCheckStatus: currentHealthCheckStatus,
    } = this.adapterCurrentConnectionState;

    const currentMetricsSummary = this.metricsUpdaterModule.getMetricsSummary(
      this.adapterCurrentPerformanceMetrics
    );

    return {
      adapterIdentifier: this.adapterIdentifier,
      adapterVersionString: this.adapterVersionString,
      connectionStatus: {
        isConnected: currentIsConnected,
        lastConnectionTime: currentLastConnectionTime,
        healthCheckStatus: currentHealthCheckStatus,
      },
      performanceMetrics: currentMetricsSummary,
      configuration: this.adapterConfigurationSettings,
    };
  }

  public getConnectionState(): AdapterConnectionState {
    console.log('🔗 [BASE_ADAPTER] 연결 상태 조회:', this.adapterIdentifier);
    return { ...this.adapterCurrentConnectionState };
  }

  public getPerformanceMetrics(): AdapterPerformanceMetrics {
    console.log('📊 [BASE_ADAPTER] 성능 메트릭 조회:', this.adapterIdentifier);
    return { ...this.adapterCurrentPerformanceMetrics };
  }

  protected clearDataCache(): void {
    console.log('🧹 [BASE_ADAPTER] 데이터 캐시 정리:', this.adapterIdentifier);
    this.adapterDataCacheStorage =
      this.cacheManagementModule.clearExpiredEntries(
        this.adapterDataCacheStorage
      );
  }

  protected getCachedData(cacheKey: string): TAdapterData | null {
    return this.cacheManagementModule.getCachedData(
      this.adapterDataCacheStorage,
      cacheKey
    );
  }

  protected setCachedData(cacheKey: string, dataValue: TAdapterData): void {
    this.adapterDataCacheStorage = this.cacheManagementModule.setCachedData(
      this.adapterDataCacheStorage,
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
