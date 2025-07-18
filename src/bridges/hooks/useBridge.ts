// bridges/hooks/useBridge.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BidirectionalSyncResult,
} from '../editorMultiStepBridge/bridgeDataTypes';
import { createBridgeEngine } from '../core/BridgeEngine';
import { createSyncEngine } from '../core/SyncEngine';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorDataExtractor';

// 🔧 통합 브릿지 상태 인터페이스 - 단순화된 3개 핵심 상태
interface SimplifiedBridgeState {
  readonly isExecuting: boolean;
  readonly lastResult: BridgeOperationExecutionResult | null;
  readonly errorMessage: string | null;
}

// 🔧 브릿지 실행 메트릭스 인터페이스
interface BridgeMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly lastDuration: number;
  readonly averageDuration: number;
}

// 🔧 브릿지 훅 반환 인터페이스
interface UseBridgeReturn {
  // 핵심 상태
  readonly isExecuting: boolean;
  readonly lastResult: BridgeOperationExecutionResult | null;
  readonly errorMessage: string | null;
  readonly metrics: BridgeMetrics;

  // 전송 기능
  readonly executeForwardTransfer: () => Promise<void>;
  readonly executeReverseTransfer: () => Promise<void>;
  readonly executeBidirectionalSync: () => Promise<void>;

  // 검증 기능
  readonly canExecuteForward: boolean;
  readonly canExecuteReverse: boolean;
  readonly canExecuteBidirectional: boolean;

  // 유틸리티 기능
  readonly resetState: () => void;
  readonly getConfiguration: () => BridgeSystemConfiguration;
}

// 🔧 타입 가드 함수들
function isValidStringType(value: unknown): value is string {
  return typeof value === 'string';
}

function isValidNumberType(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isValidObjectType(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidBridgeResult(
  result: unknown
): result is BridgeOperationExecutionResult {
  // Early Return: null 체크
  if (result === null || result === undefined) {
    return false;
  }

  // Early Return: 객체 체크
  if (!isValidObjectType(result)) {
    return false;
  }

  const resultObject = result;
  const requiredProps = [
    'operationSuccess',
    'operationErrors',
    'operationDuration',
  ];

  return requiredProps.every((prop) => prop in resultObject);
}

// 🔧 안전한 타입 변환 함수들
function convertToSafeString(value: unknown, fallback: string): string {
  // Early Return: 이미 문자열인 경우
  if (isValidStringType(value)) {
    return value;
  }

  // Early Return: null/undefined인 경우
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    return String(value);
  } catch (conversionError) {
    console.warn('⚠️ [BRIDGE_HOOK] 문자열 변환 실패:', conversionError);
    return fallback;
  }
}

function convertToSafeNumber(value: unknown, fallback: number): number {
  // Early Return: 이미 숫자인 경우
  if (isValidNumberType(value)) {
    return value;
  }

  // Early Return: 문자열을 숫자로 변환
  if (isValidStringType(value)) {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
}

// 🔧 에러 처리 함수들
function extractErrorMessage(error: unknown): string {
  // Early Return: Error 인스턴스
  if (error instanceof Error) {
    return error.message.length > 0 ? error.message : '알 수 없는 에러';
  }

  // Early Return: 문자열
  if (isValidStringType(error)) {
    return error.length > 0 ? error : '빈 에러 메시지';
  }

  return convertToSafeString(error, '브릿지 에러');
}

async function safeExecuteAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string
): Promise<T> {
  try {
    console.log(`🚀 [BRIDGE_HOOK] ${operationName} 실행 시작`);
    const result = await operation();
    console.log(`✅ [BRIDGE_HOOK] ${operationName} 실행 성공`);
    return result;
  } catch (error) {
    const errorMsg = extractErrorMessage(error);
    console.error(`❌ [BRIDGE_HOOK] ${operationName} 실행 실패:`, errorMsg);
    return fallback;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
}

// 🔧 메인 useBridge Hook
export function useBridge(
  customConfig?: Partial<BridgeSystemConfiguration>
): UseBridgeReturn {
  console.log('🔧 [BRIDGE_HOOK] 통합 브릿지 훅 초기화 시작');

  // 🔧 상태 관리 (3개로 단순화)
  const [bridgeState, setBridgeState] = useState<SimplifiedBridgeState>({
    isExecuting: false,
    lastResult: null,
    errorMessage: null,
  });

  // 🔧 메트릭스 관리
  const metricsRef = useRef<BridgeMetrics>({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    lastDuration: 0,
    averageDuration: 0,
  });

  // 🔧 시간 추적
  const startTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // 🔧 엔진 인스턴스 생성
  const bridgeEngine = useMemo(() => {
    console.log('🏭 [BRIDGE_HOOK] Bridge 엔진 생성');
    return createBridgeEngine(customConfig);
  }, [customConfig]);

  const syncEngine = useMemo(() => {
    console.log('🏭 [BRIDGE_HOOK] Sync 엔진 생성');
    return createSyncEngine({
      enableRetry: true,
      maxRetryAttempts: 3,
      defaultTimeoutMs: 10000,
      enableValidation: true,
      enableStateTracking: true,
      logLevel: 'INFO',
    });
  }, []);

  // 🔧 초기화 Effect
  useEffect(() => {
    // Early Return: 이미 초기화된 경우
    if (isInitializedRef.current) {
      return;
    }

    console.log('🔧 [BRIDGE_HOOK] 초기화');

    setBridgeState({
      isExecuting: false,
      lastResult: null,
      errorMessage: null,
    });

    metricsRef.current = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastDuration: 0,
      averageDuration: 0,
    };

    startTimeRef.current = 0;
    isInitializedRef.current = true;

    console.log('✅ [BRIDGE_HOOK] 초기화 완료');
  }, []);

  // 🔧 실행 시작 상태 업데이트
  const updateExecutionStart = useCallback((): void => {
    console.log('🚀 [BRIDGE_HOOK] 실행 시작');
    startTimeRef.current = performance.now();

    setBridgeState((prev: SimplifiedBridgeState) => ({
      ...prev,
      isExecuting: true,
      errorMessage: null,
    }));
  }, []);

  // 🔧 실행 완료 상태 업데이트
  const updateExecutionComplete = useCallback(
    (
      result: BridgeOperationExecutionResult | null,
      error: string | null
    ): void => {
      console.log('✅ [BRIDGE_HOOK] 실행 완료');

      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      const wasSuccessful = !!result?.operationSuccess && !error;

      // 메트릭스 업데이트
      const prevMetrics = metricsRef.current;
      const newTotal = prevMetrics.totalOperations + 1;
      const newSuccessful = wasSuccessful
        ? prevMetrics.successfulOperations + 1
        : prevMetrics.successfulOperations;
      const newFailed = wasSuccessful
        ? prevMetrics.failedOperations
        : prevMetrics.failedOperations + 1;

      const totalTime =
        prevMetrics.averageDuration * prevMetrics.totalOperations + duration;
      const newAverage = newTotal > 0 ? totalTime / newTotal : 0;

      metricsRef.current = {
        totalOperations: newTotal,
        successfulOperations: newSuccessful,
        failedOperations: newFailed,
        lastDuration: convertToSafeNumber(duration, 0),
        averageDuration: convertToSafeNumber(newAverage, 0),
      };

      setBridgeState((prev: SimplifiedBridgeState) => ({
        ...prev,
        isExecuting: false,
        lastResult: result,
        errorMessage: error,
      }));
    },
    []
  );

  // 🔧 Editor → MultiStep 전송
  const executeForwardTransfer = useCallback(async (): Promise<void> => {
    // Early Return: 이미 실행 중
    if (bridgeState.isExecuting) {
      console.log('🔄 [BRIDGE_HOOK] 이미 실행 중');
      return;
    }

    updateExecutionStart();

    const executeTransfer =
      async (): Promise<BridgeOperationExecutionResult> => {
        // Early Return: 엔진 초기화 확인
        if (!bridgeEngine.isInitialized()) {
          throw new Error('Bridge 엔진이 초기화되지 않음');
        }

        // Early Return: 사전 조건 확인
        if (!bridgeEngine.checkPreconditions()) {
          throw new Error('전송 사전 조건 미충족');
        }

        return bridgeEngine.executeTransfer();
      };

    const result = await safeExecuteAsync(
      () => withTimeout(executeTransfer(), 10000, '전송 타임아웃'),
      null,
      'FORWARD_TRANSFER'
    );

    const errorMessage =
      result && isValidBridgeResult(result) && result.operationSuccess
        ? null
        : 'Editor → MultiStep 전송 실패';

    updateExecutionComplete(result, errorMessage);
  }, [
    bridgeState.isExecuting,
    bridgeEngine,
    updateExecutionStart,
    updateExecutionComplete,
  ]);

  // 🔧 MultiStep → Editor 전송
  const executeReverseTransfer = useCallback(async (): Promise<void> => {
    // Early Return: 이미 실행 중
    if (bridgeState.isExecuting) {
      console.log('🔄 [BRIDGE_HOOK] 이미 실행 중');
      return;
    }

    updateExecutionStart();

    const executeReverse = async (): Promise<boolean> => {
      const syncResult = await syncEngine.executeSync(
        'MULTISTEP_TO_EDITOR',
        undefined,
        undefined,
        {
          timeoutMs: 8000,
          retryCount: 2,
          validateInput: true,
          validateOutput: true,
          enableLogging: true,
        }
      );

      // Early Return: 동기화 실패
      if (!syncResult.success) {
        const errors = Array.isArray(syncResult.errors)
          ? syncResult.errors
          : [];
        throw new Error(`역방향 전송 실패: ${errors.join(', ')}`);
      }

      return true;
    };

    const success = await safeExecuteAsync(
      () => withTimeout(executeReverse(), 10000, '역방향 전송 타임아웃'),
      false,
      'REVERSE_TRANSFER'
    );

    const mockResult: BridgeOperationExecutionResult | null = success
      ? {
          operationSuccess: true,
          operationErrors: [],
          operationWarnings: [],
          transferredData: null,
          operationDuration: performance.now() - startTimeRef.current,
          executionMetadata: new Map<string, unknown>([
            ['operation', 'REVERSE_TRANSFER'],
            ['timestamp', Date.now()],
          ]),
        }
      : null;

    const errorMessage = success ? null : 'MultiStep → Editor 전송 실패';
    updateExecutionComplete(mockResult, errorMessage);
  }, [
    bridgeState.isExecuting,
    syncEngine,
    updateExecutionStart,
    updateExecutionComplete,
  ]);

  // 🔧 양방향 동기화
  const executeBidirectionalSync = useCallback(async (): Promise<void> => {
    // Early Return: 이미 실행 중
    if (bridgeState.isExecuting) {
      console.log('🔄 [BRIDGE_HOOK] 이미 실행 중');
      return;
    }

    updateExecutionStart();

    const executeBidirectional = async (): Promise<BidirectionalSyncResult> => {
      // 실제 에디터 데이터 추출
      const editorExtractor = createEditorStateExtractor();
      const editorData = editorExtractor.getEditorStateWithValidation();

      // Early Return: 에디터 데이터 없음
      if (!editorData) {
        throw new Error('에디터 데이터 추출 실패');
      }

      // MultiStep 추출기가 없으므로 현재는 양방향 동기화 지원 불가
      throw new Error(
        'MultiStep 데이터 추출기가 구현되지 않음 - 양방향 동기화 현재 지원 불가'
      );
    };

    const bidirectionalResult = await safeExecuteAsync(
      () =>
        withTimeout(executeBidirectional(), 15000, '양방향 동기화 타임아웃'),
      null,
      'BIDIRECTIONAL_SYNC'
    );

    const mockResult: BridgeOperationExecutionResult | null =
      bidirectionalResult?.overallSuccess
        ? {
            operationSuccess: true,
            operationErrors: [],
            operationWarnings: [],
            transferredData: null,
            operationDuration: performance.now() - startTimeRef.current,
            executionMetadata: new Map<string, unknown>([
              ['operation', 'BIDIRECTIONAL_SYNC'],
              ['timestamp', Date.now()],
              ['overallSuccess', bidirectionalResult.overallSuccess],
            ]),
          }
        : null;

    const errorMessage = bidirectionalResult?.overallSuccess
      ? null
      : '양방향 동기화 현재 지원 불가 (MultiStep 추출기 미구현)';

    updateExecutionComplete(mockResult, errorMessage);
  }, [bridgeState.isExecuting, updateExecutionStart, updateExecutionComplete]);

  // 🔧 검증 상태 계산
  const canExecuteForward = useMemo((): boolean => {
    // Early Return: 실행 중
    if (bridgeState.isExecuting) {
      return false;
    }

    try {
      return bridgeEngine.checkPreconditions();
    } catch (error) {
      console.warn('⚠️ [BRIDGE_HOOK] 전방향 검증 실패:', error);
      return false;
    }
  }, [bridgeState.isExecuting, bridgeEngine]);

  const canExecuteReverse = useMemo((): boolean => {
    // Early Return: 실행 중
    if (bridgeState.isExecuting) {
      return false;
    }

    try {
      const engineState = syncEngine.getState();
      return !engineState.isActive;
    } catch (error) {
      console.warn('⚠️ [BRIDGE_HOOK] 역방향 검증 실패:', error);
      return false;
    }
  }, [bridgeState.isExecuting, syncEngine]);

  const canExecuteBidirectional = useMemo((): boolean => {
    return canExecuteForward && canExecuteReverse && !bridgeState.isExecuting;
  }, [canExecuteForward, canExecuteReverse, bridgeState.isExecuting]);

  // 🔧 상태 초기화
  const resetState = useCallback((): void => {
    console.log('🔄 [BRIDGE_HOOK] 상태 초기화');

    setBridgeState({
      isExecuting: false,
      lastResult: null,
      errorMessage: null,
    });

    metricsRef.current = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastDuration: 0,
      averageDuration: 0,
    };

    startTimeRef.current = 0;

    try {
      syncEngine.resetState();
    } catch (error) {
      console.warn('⚠️ [BRIDGE_HOOK] Sync 엔진 초기화 실패:', error);
    }
  }, [syncEngine]);

  // 🔧 설정 조회
  const getConfiguration = useCallback((): BridgeSystemConfiguration => {
    try {
      return bridgeEngine.getConfiguration();
    } catch (error) {
      console.warn('⚠️ [BRIDGE_HOOK] 설정 조회 실패:', error);
      return {
        enableValidation: true,
        enableErrorRecovery: true,
        debugMode: false,
        maxRetryAttempts: 3,
        timeoutMs: 5000,
      };
    }
  }, [bridgeEngine]);

  // 🔧 Hook 반환값
  return {
    // 핵심 상태
    isExecuting: bridgeState.isExecuting,
    lastResult: bridgeState.lastResult,
    errorMessage: bridgeState.errorMessage,
    metrics: { ...metricsRef.current },

    // 전송 기능
    executeForwardTransfer,
    executeReverseTransfer,
    executeBidirectionalSync,

    // 검증 기능
    canExecuteForward,
    canExecuteReverse,
    canExecuteBidirectional,

    // 유틸리티 기능
    resetState,
    getConfiguration,
  };
}
