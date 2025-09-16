// src/components/multiStepForm/types/bridgeTypes.ts

import type { StepNumber } from './stepTypes';
import type { FormValues } from './formTypes';

// 🔧 Bridge 작업 상태 열거형
export const BridgeOperationStatus = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  TRANSFERRING: 'transferring',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

export type BridgeOperationStatusType =
  (typeof BridgeOperationStatus)[keyof typeof BridgeOperationStatus];

// 🔧 Bridge 전송 방향 열거형
export const BridgeTransferDirection = {
  FORWARD: 'forward',
  REVERSE: 'reverse',
  BIDIRECTIONAL: 'bidirectional',
} as const;

export type BridgeTransferDirectionType =
  (typeof BridgeTransferDirection)[keyof typeof BridgeTransferDirection];

// 🔧 Bridge 에러 카테고리 열거형
export const BridgeErrorCategory = {
  CONNECTION_ERROR: 'connection_error',
  TRANSFER_ERROR: 'transfer_error',
  VALIDATION_ERROR: 'validation_error',
  TIMEOUT_ERROR: 'timeout_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  NETWORK_ERROR: 'network_error',
  SYSTEM_ERROR: 'system_error',
  USER_ERROR: 'user_error',
} as const;

export type BridgeErrorCategoryType =
  (typeof BridgeErrorCategory)[keyof typeof BridgeErrorCategory];

// 🔧 Bridge 우선순위 레벨 열거형
export const BridgePriorityLevel = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
  URGENT: 'urgent',
} as const;

export type BridgePriorityLevelType =
  (typeof BridgePriorityLevel)[keyof typeof BridgePriorityLevel];

// 🔧 Bridge 설정 인터페이스
export interface BridgeConfiguration {
  readonly operationTimeoutMs: number;
  readonly maxRetryAttempts: number;
  readonly retryDelayMs: number;
  readonly enableAutoReconnect: boolean;
  readonly enableCompression: boolean;
  readonly enableEncryption: boolean;
  readonly enableValidation: boolean;
  readonly enableLogging: boolean;
  readonly debugMode: boolean;
  readonly batchSize: number;
  readonly connectionPoolSize: number;
}

// 🔧 Bridge 연결 정보 인터페이스
export interface BridgeConnectionInfo {
  readonly connectionId: string;
  readonly sessionId: string;
  readonly establishedAt: number;
  readonly lastActivityAt: number;
  readonly remoteAddress: string;
  readonly protocolVersion: string;
  readonly encryptionEnabled: boolean;
  readonly compressionEnabled: boolean;
}

// 🔧 Bridge 작업 메타데이터 인터페이스
export interface BridgeOperationMetadata {
  readonly operationId: string;
  readonly operationType: BridgeTransferDirectionType;
  readonly priority: BridgePriorityLevelType;
  readonly initiatedAt: number;
  readonly completedAt: number | null;
  readonly duration: number | null;
  readonly retryCount: number;
  readonly sourceStep: StepNumber | null;
  readonly targetStep: StepNumber | null;
  readonly tags: readonly string[];
  readonly userAgent: string;
  readonly ipAddress: string;
}

// 🔧 Bridge 검증 결과 인터페이스
export interface BridgeValidationResult {
  readonly isValid: boolean;
  readonly validationScore: number;
  readonly validatedFields: readonly string[];
  readonly invalidFields: readonly string[];
  readonly missingFields: readonly string[];
  readonly warnings: readonly {
    readonly field: string;
    readonly message: string;
    readonly severity: 'low' | 'medium' | 'high';
  }[];
  readonly errors: readonly {
    readonly field: string;
    readonly message: string;
    readonly code: string;
  }[];
}

// 🔧 Bridge 전송 데이터 인터페이스
export interface BridgeTransferData {
  readonly formValues: FormValues | null;
  readonly stepNumber: StepNumber;
  readonly timestamp: number;
  readonly sessionId: string;
  readonly userId: string | null;
  readonly metadata: Record<string, unknown>;
  readonly checksum: string;
  readonly compressionType: 'none' | 'gzip' | 'deflate' | 'brotli';
  readonly encryptionType: 'none' | 'aes256' | 'rsa2048';
}

// 🔧 Bridge 전송 결과 인터페이스
export interface BridgeTransferResult {
  readonly success: boolean;
  readonly operationId: string;
  readonly resultData: {
    readonly content: string;
    readonly isCompleted: boolean;
    readonly processedAt: number;
    readonly transformations: readonly string[];
    readonly validationResult: BridgeValidationResult | null;
    readonly metadata: Record<string, unknown>;
  } | null;
  readonly errorInfo: {
    readonly category: BridgeErrorCategoryType;
    readonly message: string;
    readonly code: string;
    readonly details: Record<string, unknown>;
    readonly stack: string | null;
    readonly retryable: boolean;
  } | null;
  readonly performanceMetrics: {
    readonly totalDuration: number;
    readonly networkDuration: number;
    readonly processingDuration: number;
    readonly validationDuration: number;
    readonly compressionRatio: number | null;
    readonly bytesTransferred: number;
  };
  readonly timestamp: number;
}

// 🔧 Bridge 상태 정보 인터페이스
export interface BridgeStateInfo {
  readonly status: BridgeOperationStatusType;
  readonly connectionInfo: BridgeConnectionInfo | null;
  readonly currentOperation: BridgeOperationMetadata | null;
  readonly queuedOperations: readonly BridgeOperationMetadata[];
  readonly recentOperations: readonly BridgeOperationMetadata[];
  readonly statistics: {
    readonly totalOperations: number;
    readonly successfulOperations: number;
    readonly failedOperations: number;
    readonly averageOperationTime: number;
    readonly averageNetworkLatency: number;
    readonly throughputBytesPerSecond: number;
    readonly errorRate: number;
    readonly uptime: number;
  };
  readonly healthCheck: {
    readonly isHealthy: boolean;
    readonly lastCheckAt: number;
    readonly nextCheckAt: number;
    readonly issues: readonly string[];
  };
}

// 🔧 Bridge 이벤트 인터페이스
export interface BridgeEvent {
  readonly eventId: string;
  readonly eventType: 'connection' | 'transfer' | 'error' | 'status' | 'metric';
  readonly timestamp: number;
  readonly source: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  readonly message: string;
  readonly data: Record<string, unknown>;
  readonly correlationId: string | null;
}

// 🔧 Bridge 에러 정보 인터페이스
export interface BridgeErrorInfo {
  readonly errorId: string;
  readonly category: BridgeErrorCategoryType;
  readonly message: string;
  readonly code: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly isRetryable: boolean;
  readonly retryAfterMs: number | null;
  readonly occurredAt: number;
  readonly resolvedAt: number | null;
  readonly affectedOperations: readonly string[];
  readonly suggestedActions: readonly string[];
  readonly technicalDetails: Record<string, unknown>;
  readonly userFriendlyMessage: string;
}

// 🔧 Bridge 설정 옵션 인터페이스
export interface BridgeConfigurationOptions {
  readonly connectionSettings: {
    readonly maxConnections: number;
    readonly connectionTimeoutMs: number;
    readonly keepAliveIntervalMs: number;
    readonly heartbeatIntervalMs: number;
    readonly idleTimeoutMs: number;
  };
  readonly transferSettings: {
    readonly maxConcurrentTransfers: number;
    readonly transferTimeoutMs: number;
    readonly chunkSizeBytes: number;
    readonly enableStreaming: boolean;
    readonly enableResume: boolean;
  };
  readonly securitySettings: {
    readonly enableAuthentication: boolean;
    readonly enableAuthorization: boolean;
    readonly enableAuditLogging: boolean;
    readonly allowedOrigins: readonly string[];
    readonly rateLimitPerMinute: number;
  };
  readonly performanceSettings: {
    readonly enableCaching: boolean;
    readonly cacheExpirationMs: number;
    readonly enablePrefetching: boolean;
    readonly maxMemoryUsageMb: number;
    readonly enableMetrics: boolean;
  };
}

// 🔧 Bridge 훅 반환 타입 인터페이스
export interface BridgeHookResult {
  readonly state: BridgeStateInfo;
  readonly isConnected: boolean;
  readonly isTransferring: boolean;
  readonly canTransfer: boolean;
  readonly lastResult: BridgeTransferResult | null;
  readonly currentError: BridgeErrorInfo | null;
  readonly statistics: BridgeStateInfo['statistics'];
  readonly executeTransfer: (
    data: BridgeTransferData
  ) => Promise<BridgeTransferResult>;
  readonly cancelTransfer: (operationId: string) => Promise<boolean>;
  readonly retryTransfer: (
    operationId: string
  ) => Promise<BridgeTransferResult>;
  readonly connect: () => Promise<boolean>;
  readonly disconnect: () => Promise<boolean>;
  readonly reconnect: () => Promise<boolean>;
  readonly getOperationHistory: () => readonly BridgeOperationMetadata[];
  readonly clearHistory: () => void;
  readonly exportMetrics: () => Record<string, unknown>;
}

// 🔧 Bridge 프로바이더 Context 타입
export interface BridgeProviderContextValue {
  readonly bridgeHook: BridgeHookResult;
  readonly configuration: BridgeConfiguration;
  readonly configurationOptions: BridgeConfigurationOptions;
  readonly updateConfiguration: (updates: Partial<BridgeConfiguration>) => void;
  readonly resetConfiguration: () => void;
  readonly addEventListener: (
    eventType: string,
    handler: (event: BridgeEvent) => void
  ) => void;
  readonly removeEventListener: (
    eventType: string,
    handler: (event: BridgeEvent) => void
  ) => void;
  readonly getEventHistory: () => readonly BridgeEvent[];
  readonly clearEventHistory: () => void;
}

// 🔧 MultiStep Form과 Bridge 통합 타입
export interface MultiStepFormBridgeIntegration {
  readonly formValues: FormValues | null;
  readonly currentStep: StepNumber;
  readonly bridgeState: BridgeStateInfo;
  readonly lastTransferResult: BridgeTransferResult | null;
  readonly pendingOperations: readonly BridgeOperationMetadata[];
  readonly isFormValid: boolean;
  readonly canSubmitToBridge: boolean;
  readonly estimatedTransferTime: number | null;
}

// 🔧 Bridge 작업 큐 아이템 인터페이스
export interface BridgeQueueItem {
  readonly queueId: string;
  readonly operationMetadata: BridgeOperationMetadata;
  readonly transferData: BridgeTransferData;
  readonly queuedAt: number;
  readonly scheduledFor: number;
  readonly attempts: number;
  readonly lastAttemptAt: number | null;
  readonly nextAttemptAt: number | null;
  readonly status:
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'cancelled';
}

// 🔧 Bridge 캐시 엔트리 인터페이스
export interface BridgeCacheEntry {
  readonly cacheKey: string;
  readonly data: Record<string, unknown>;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly accessCount: number;
  readonly lastAccessedAt: number;
  readonly size: number;
  readonly tags: readonly string[];
}

// 🔧 Bridge 메트릭 수집 인터페이스
export interface BridgeMetricsCollection {
  readonly collectionId: string;
  readonly collectedAt: number;
  readonly timeRange: {
    readonly startTime: number;
    readonly endTime: number;
    readonly duration: number;
  };
  readonly operationMetrics: {
    readonly totalCount: number;
    readonly successCount: number;
    readonly failureCount: number;
    readonly averageDuration: number;
    readonly medianDuration: number;
    readonly p95Duration: number;
    readonly p99Duration: number;
  };
  readonly transferMetrics: {
    readonly totalBytesTransferred: number;
    readonly averageThroughput: number;
    readonly peakThroughput: number;
    readonly compressionRatio: number;
    readonly networkLatency: number;
  };
  readonly errorMetrics: {
    readonly errorsByCategory: Record<BridgeErrorCategoryType, number>;
    readonly retryRate: number;
    readonly recoveryRate: number;
    readonly meanTimeToRecovery: number;
  };
  readonly resourceMetrics: {
    readonly memoryUsage: number;
    readonly cpuUsage: number;
    readonly networkUsage: number;
    readonly cacheHitRate: number;
    readonly connectionPoolUtilization: number;
  };
}

// 🔧 타입 가드 함수들 - 타입단언 완전 제거
export const createBridgeTypeGuards = () => {
  const isValidBridgeOperationStatus = (
    value: unknown
  ): value is BridgeOperationStatusType => {
    if (typeof value !== 'string') {
      return false;
    }

    const validStatuses = Object.values(BridgeOperationStatus);
    return validStatuses.some((status) => status === value);
  };

  const isValidBridgeTransferDirection = (
    value: unknown
  ): value is BridgeTransferDirectionType => {
    if (typeof value !== 'string') {
      return false;
    }

    const validDirections = Object.values(BridgeTransferDirection);
    return validDirections.some((direction) => direction === value);
  };

  const isValidBridgeErrorCategory = (
    value: unknown
  ): value is BridgeErrorCategoryType => {
    if (typeof value !== 'string') {
      return false;
    }

    const validCategories = Object.values(BridgeErrorCategory);
    return validCategories.some((category) => category === value);
  };

  const isValidBridgePriorityLevel = (
    value: unknown
  ): value is BridgePriorityLevelType => {
    if (typeof value !== 'string') {
      return false;
    }

    const validPriorities = Object.values(BridgePriorityLevel);
    return validPriorities.some((priority) => priority === value);
  };

  const isBridgeTransferResult = (
    value: unknown
  ): value is BridgeTransferResult => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const result = value;
    const hasSuccess = 'success' in result;
    const hasOperationId = 'operationId' in result;
    const hasTimestamp = 'timestamp' in result;

    if (!hasSuccess || !hasOperationId || !hasTimestamp) {
      return false;
    }

    const successValue = Reflect.get(result, 'success');
    const operationIdValue = Reflect.get(result, 'operationId');
    const timestampValue = Reflect.get(result, 'timestamp');

    return (
      typeof successValue === 'boolean' &&
      typeof operationIdValue === 'string' &&
      typeof timestampValue === 'number'
    );
  };

  const isBridgeStateInfo = (value: unknown): value is BridgeStateInfo => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const state = value;
    const hasStatus = 'status' in state;
    const hasStatistics = 'statistics' in state;
    const hasHealthCheck = 'healthCheck' in state;

    if (!hasStatus || !hasStatistics || !hasHealthCheck) {
      return false;
    }

    const statusValue = Reflect.get(state, 'status');
    return isValidBridgeOperationStatus(statusValue);
  };

  const isBridgeErrorInfo = (value: unknown): value is BridgeErrorInfo => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const error = value;
    const hasErrorId = 'errorId' in error;
    const hasCategory = 'category' in error;
    const hasMessage = 'message' in error;

    if (!hasErrorId || !hasCategory || !hasMessage) {
      return false;
    }

    const categoryValue = Reflect.get(error, 'category');
    return isValidBridgeErrorCategory(categoryValue);
  };

  const isBridgeHookResult = (value: unknown): value is BridgeHookResult => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const hookResult = value;
    const hasState = 'state' in hookResult;
    const hasIsConnected = 'isConnected' in hookResult;
    const hasExecuteTransfer = 'executeTransfer' in hookResult;

    if (!hasState || !hasIsConnected || !hasExecuteTransfer) {
      return false;
    }

    const stateValue = Reflect.get(hookResult, 'state');
    const isConnectedValue = Reflect.get(hookResult, 'isConnected');
    const executeTransferValue = Reflect.get(hookResult, 'executeTransfer');

    return (
      isBridgeStateInfo(stateValue) &&
      typeof isConnectedValue === 'boolean' &&
      typeof executeTransferValue === 'function'
    );
  };

  return {
    isValidBridgeOperationStatus,
    isValidBridgeTransferDirection,
    isValidBridgeErrorCategory,
    isValidBridgePriorityLevel,
    isBridgeTransferResult,
    isBridgeStateInfo,
    isBridgeErrorInfo,
    isBridgeHookResult,
  };
};

// 🔧 Bridge 유틸리티 타입들
export type BridgeOperationIdGenerator = () => string;
export type BridgeTimestampGenerator = () => number;
export type BridgeChecksumGenerator = (data: unknown) => string;
export type BridgeDataSerializer = (data: unknown) => string;
export type BridgeDataDeserializer = (serializedData: string) => unknown;

// 🔧 Bridge 컨텍스트 관련 타입들
export type BridgeContextUpdateCallback = (state: BridgeStateInfo) => void;
export type BridgeEventCallback = (event: BridgeEvent) => void;
export type BridgeErrorCallback = (error: BridgeErrorInfo) => void;
export type BridgeMetricsCallback = (metrics: BridgeMetricsCollection) => void;

// 🔧 Bridge 설정 검증 함수들
export const createBridgeConfigurationValidators = () => {
  const validateBridgeConfiguration = (
    config: unknown
  ): config is BridgeConfiguration => {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const configObj = config;
    const requiredFields = [
      'operationTimeoutMs',
      'maxRetryAttempts',
      'retryDelayMs',
      'enableAutoReconnect',
      'enableCompression',
      'enableEncryption',
      'enableValidation',
      'enableLogging',
      'debugMode',
      'batchSize',
      'connectionPoolSize',
    ];

    return requiredFields.every((field) => field in configObj);
  };

  const validateBridgeConfigurationOptions = (
    options: unknown
  ): options is BridgeConfigurationOptions => {
    if (!options || typeof options !== 'object') {
      return false;
    }

    const optionsObj = options;
    const requiredSections = [
      'connectionSettings',
      'transferSettings',
      'securitySettings',
      'performanceSettings',
    ];

    return requiredSections.every((section) => section in optionsObj);
  };

  const createDefaultBridgeConfiguration = (): BridgeConfiguration => {
    return {
      operationTimeoutMs: 30000,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      enableAutoReconnect: true,
      enableCompression: true,
      enableEncryption: true,
      enableValidation: true,
      enableLogging: true,
      debugMode: false,
      batchSize: 10,
      connectionPoolSize: 5,
    };
  };

  const createDefaultBridgeConfigurationOptions =
    (): BridgeConfigurationOptions => {
      return {
        connectionSettings: {
          maxConnections: 10,
          connectionTimeoutMs: 10000,
          keepAliveIntervalMs: 30000,
          heartbeatIntervalMs: 15000,
          idleTimeoutMs: 300000,
        },
        transferSettings: {
          maxConcurrentTransfers: 3,
          transferTimeoutMs: 60000,
          chunkSizeBytes: 1048576, // 1MB
          enableStreaming: true,
          enableResume: true,
        },
        securitySettings: {
          enableAuthentication: true,
          enableAuthorization: true,
          enableAuditLogging: true,
          allowedOrigins: ['localhost', '127.0.0.1'],
          rateLimitPerMinute: 100,
        },
        performanceSettings: {
          enableCaching: true,
          cacheExpirationMs: 3600000, // 1 hour
          enablePrefetching: false,
          maxMemoryUsageMb: 256,
          enableMetrics: true,
        },
      };
    };

  return {
    validateBridgeConfiguration,
    validateBridgeConfigurationOptions,
    createDefaultBridgeConfiguration,
    createDefaultBridgeConfigurationOptions,
  };
};

// 🔧 Bridge 에러 생성 유틸리티
export const createBridgeErrorFactory = () => {
  const createBridgeError = (
    category: BridgeErrorCategoryType,
    message: string,
    code: string,
    technicalDetails: Record<string, unknown> = {}
  ): BridgeErrorInfo => {
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;
    const currentTimestamp = Date.now();

    return {
      errorId,
      category,
      message,
      code,
      severity: 'medium',
      isRetryable: category !== BridgeErrorCategory.AUTHENTICATION_ERROR,
      retryAfterMs:
        category === BridgeErrorCategory.TIMEOUT_ERROR ? 5000 : null,
      occurredAt: currentTimestamp,
      resolvedAt: null,
      affectedOperations: [],
      suggestedActions: [],
      technicalDetails,
      userFriendlyMessage: `Bridge ${category
        .replace('_', ' ')
        .toLowerCase()}: ${message}`,
    };
  };

  const createConnectionError = (
    message: string,
    details: Record<string, unknown> = {}
  ): BridgeErrorInfo => {
    return createBridgeError(
      BridgeErrorCategory.CONNECTION_ERROR,
      message,
      'BRIDGE_CONNECTION_FAILED',
      details
    );
  };

  const createTransferError = (
    message: string,
    details: Record<string, unknown> = {}
  ): BridgeErrorInfo => {
    return createBridgeError(
      BridgeErrorCategory.TRANSFER_ERROR,
      message,
      'BRIDGE_TRANSFER_FAILED',
      details
    );
  };

  const createValidationError = (
    message: string,
    details: Record<string, unknown> = {}
  ): BridgeErrorInfo => {
    return createBridgeError(
      BridgeErrorCategory.VALIDATION_ERROR,
      message,
      'BRIDGE_VALIDATION_FAILED',
      details
    );
  };

  const createTimeoutError = (
    message: string,
    details: Record<string, unknown> = {}
  ): BridgeErrorInfo => {
    return createBridgeError(
      BridgeErrorCategory.TIMEOUT_ERROR,
      message,
      'BRIDGE_TIMEOUT',
      details
    );
  };

  return {
    createBridgeError,
    createConnectionError,
    createTransferError,
    createValidationError,
    createTimeoutError,
  };
};

console.log(
  '🌉 [BRIDGE_TYPES] Bridge 타입 통합 모듈 로드 완료 - 타입단언 완전 제거됨'
);
