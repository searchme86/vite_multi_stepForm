// bridges/hooks/useBridge.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BidirectionalSyncResult,
  ExternalEditorData,
} from '../editorMultiStepBridge/modernBridgeTypes';
import { createBridgeEngine } from '../core/BridgeEngine';
import { createSyncEngine } from '../core/SyncEngine';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorStateCapture';
import type { Container, ParagraphBlock } from '../../store/shared/commonTypes';

// 🔧 통합 브릿지 상태 인터페이스 - 단순화된 3개 핵심 상태
interface SimplifiedBridgeState {
  readonly isExecuting: boolean;
  readonly lastResult: BridgeOperationExecutionResult | null;
  readonly errorMessage: string | null;
  readonly hasExternalData: boolean;
  readonly externalDataTimestamp: number;
}

// 🔧 브릿지 실행 메트릭스 인터페이스
interface BridgeMetrics {
  readonly totalOperations: number;
  readonly successfulOperations: number;
  readonly failedOperations: number;
  readonly lastDuration: number;
  readonly averageDuration: number;
  readonly externalDataUsageCount: number;
}

// 🔧 브릿지 훅 반환 인터페이스
interface UseBridgeReturn {
  // 핵심 상태
  readonly isExecuting: boolean;
  readonly lastResult: BridgeOperationExecutionResult | null;
  readonly errorMessage: string | null;
  readonly metrics: BridgeMetrics;
  readonly hasExternalData: boolean;

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
  readonly refreshExternalData: (newExternalData: ExternalEditorData) => void;
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

function isValidContainer(candidate: unknown): candidate is Container {
  const isValidObject = candidate !== null && typeof candidate === 'object';
  if (!isValidObject) {
    return false;
  }

  const containerObj = candidate;
  const hasRequiredProperties =
    'id' in containerObj && 'name' in containerObj && 'order' in containerObj;

  if (!hasRequiredProperties) {
    return false;
  }

  const idValue = Reflect.get(containerObj, 'id');
  const nameValue = Reflect.get(containerObj, 'name');
  const orderValue = Reflect.get(containerObj, 'order');

  const hasValidTypes =
    typeof idValue === 'string' &&
    typeof nameValue === 'string' &&
    typeof orderValue === 'number';

  return hasValidTypes && idValue.length > 0 && nameValue.length > 0;
}

function isValidParagraph(candidate: unknown): candidate is ParagraphBlock {
  const isValidObject = candidate !== null && typeof candidate === 'object';
  if (!isValidObject) {
    return false;
  }

  const paragraphObj = candidate;
  const hasRequiredProperties =
    'id' in paragraphObj &&
    'content' in paragraphObj &&
    'order' in paragraphObj &&
    'containerId' in paragraphObj;

  if (!hasRequiredProperties) {
    return false;
  }

  const idValue = Reflect.get(paragraphObj, 'id');
  const contentValue = Reflect.get(paragraphObj, 'content');
  const orderValue = Reflect.get(paragraphObj, 'order');
  const containerIdValue = Reflect.get(paragraphObj, 'containerId');

  const hasValidTypes =
    typeof idValue === 'string' &&
    typeof contentValue === 'string' &&
    typeof orderValue === 'number' &&
    (containerIdValue === null || typeof containerIdValue === 'string');

  return hasValidTypes && idValue.length > 0;
}

function isValidExternalData(
  candidate: unknown
): candidate is ExternalEditorData {
  const isValidObject = candidate !== null && typeof candidate === 'object';
  if (!isValidObject) {
    return false;
  }

  const dataObj = candidate;
  const hasRequiredProperties =
    'localContainers' in dataObj && 'localParagraphs' in dataObj;

  if (!hasRequiredProperties) {
    return false;
  }

  const containersValue = Reflect.get(dataObj, 'localContainers');
  const paragraphsValue = Reflect.get(dataObj, 'localParagraphs');

  const isValidContainersArray = Array.isArray(containersValue);
  const isValidParagraphsArray = Array.isArray(paragraphsValue);

  if (!isValidContainersArray || !isValidParagraphsArray) {
    return false;
  }

  // 배열 내 요소들의 유효성도 검증
  const validContainers = containersValue.every(isValidContainer);
  const validParagraphs = paragraphsValue.every(isValidParagraph);

  return validContainers && validParagraphs;
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

// 🔧 외부 데이터 검증 및 처리 함수들
function validateExternalDataQuality(externalData: ExternalEditorData): {
  isValid: boolean;
  containerCount: number;
  paragraphCount: number;
  qualityScore: number;
  issues: string[];
} {
  console.debug('🔍 [BRIDGE_HOOK] 외부 데이터 품질 검증 시작');

  const { localContainers = [], localParagraphs = [] } = externalData;
  const issues: string[] = [];

  // 컨테이너 검증
  const validContainers = localContainers.filter(isValidContainer);
  const containerCount = validContainers.length;
  const invalidContainerCount = localContainers.length - containerCount;

  invalidContainerCount > 0
    ? issues.push(`${invalidContainerCount}개의 유효하지 않은 컨테이너`)
    : null;

  // 문단 검증
  const validParagraphs = localParagraphs.filter(isValidParagraph);
  const paragraphCount = validParagraphs.length;
  const invalidParagraphCount = localParagraphs.length - paragraphCount;

  invalidParagraphCount > 0
    ? issues.push(`${invalidParagraphCount}개의 유효하지 않은 문단`)
    : null;

  // 품질 점수 계산
  const totalItems = localContainers.length + localParagraphs.length;
  const validItems = containerCount + paragraphCount;
  const qualityScore =
    totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 100;

  // 최소 데이터 요구사항 검증
  const hasMinimumData = containerCount > 0 || paragraphCount > 0;
  hasMinimumData ? null : issues.push('최소 데이터 요구사항 미충족');

  const isValid = issues.length === 0 && qualityScore >= 80;

  console.debug('📊 [BRIDGE_HOOK] 외부 데이터 품질 검증 결과:', {
    isValid,
    containerCount,
    paragraphCount,
    qualityScore,
    issueCount: issues.length,
  });

  return {
    isValid,
    containerCount,
    paragraphCount,
    qualityScore,
    issues,
  };
}

// 🔧 메인 useBridge Hook (외부 데이터 지원 추가)
export function useBridge(
  customConfig?: Partial<BridgeSystemConfiguration>,
  externalData?: ExternalEditorData | null // 🔧 null도 허용하도록 수정
): UseBridgeReturn {
  console.log('🔧 [BRIDGE_HOOK] 통합 브릿지 훅 초기화 시작 (외부 데이터 지원)');

  // 🔧 외부 데이터 검증 (null 처리 추가)
  const validatedExternalData = useMemo(() => {
    // null이나 undefined인 경우 undefined로 통일
    if (externalData === null || externalData === undefined) {
      return undefined;
    }

    return isValidExternalData(externalData) ? externalData : undefined;
  }, [externalData]);

  const externalDataQuality = useMemo(() => {
    return validatedExternalData
      ? validateExternalDataQuality(validatedExternalData)
      : {
          isValid: false,
          containerCount: 0,
          paragraphCount: 0,
          qualityScore: 0,
          issues: ['외부 데이터가 제공되지 않음'],
        };
  }, [validatedExternalData]);

  // 🔧 상태 관리 (외부 데이터 정보 추가)
  const [bridgeState, setBridgeState] = useState<SimplifiedBridgeState>({
    isExecuting: false,
    lastResult: null,
    errorMessage: null,
    hasExternalData: !!validatedExternalData,
    externalDataTimestamp: validatedExternalData ? Date.now() : 0,
  });

  // 🔧 메트릭스 관리 (외부 데이터 사용 횟수 추가)
  const metricsRef = useRef<BridgeMetrics>({
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    lastDuration: 0,
    averageDuration: 0,
    externalDataUsageCount: 0,
  });

  // 🔧 시간 추적
  const startTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  // 🔧 엔진 인스턴스 생성 (외부 데이터 전달)
  const bridgeEngine = useMemo(() => {
    console.log('🏭 [BRIDGE_HOOK] Bridge 엔진 생성 (외부 데이터 포함)');
    console.debug('📊 [BRIDGE_HOOK] 외부 데이터 상태:', {
      hasExternalData: !!validatedExternalData,
      qualityScore: externalDataQuality.qualityScore,
      containerCount: externalDataQuality.containerCount,
      paragraphCount: externalDataQuality.paragraphCount,
    });

    return createBridgeEngine(customConfig, validatedExternalData);
  }, [customConfig, validatedExternalData]);

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

  // 🔧 초기화 Effect (외부 데이터 상태 포함)
  useEffect(() => {
    // Early Return: 이미 초기화된 경우
    if (isInitializedRef.current) {
      return;
    }

    console.log('🔧 [BRIDGE_HOOK] 초기화 (외부 데이터 지원)');

    setBridgeState({
      isExecuting: false,
      lastResult: null,
      errorMessage: null,
      hasExternalData: !!validatedExternalData,
      externalDataTimestamp: validatedExternalData ? Date.now() : 0,
    });

    metricsRef.current = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastDuration: 0,
      averageDuration: 0,
      externalDataUsageCount: 0,
    };

    startTimeRef.current = 0;
    isInitializedRef.current = true;

    console.log('✅ [BRIDGE_HOOK] 초기화 완료');
  }, [validatedExternalData]);

  // 🔧 외부 데이터 변경 감지 Effect
  useEffect(() => {
    const hasExternalDataChanged =
      !!validatedExternalData !== bridgeState.hasExternalData;

    if (hasExternalDataChanged) {
      console.log('🔄 [BRIDGE_HOOK] 외부 데이터 상태 변경 감지');

      setBridgeState((prev) => ({
        ...prev,
        hasExternalData: !!validatedExternalData,
        externalDataTimestamp: validatedExternalData ? Date.now() : 0,
      }));
    }
  }, [validatedExternalData, bridgeState.hasExternalData]);

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
      error: string | null,
      usedExternalData: boolean = false
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
      const newExternalDataUsage = usedExternalData
        ? prevMetrics.externalDataUsageCount + 1
        : prevMetrics.externalDataUsageCount;

      const totalTime =
        prevMetrics.averageDuration * prevMetrics.totalOperations + duration;
      const newAverage = newTotal > 0 ? totalTime / newTotal : 0;

      metricsRef.current = {
        totalOperations: newTotal,
        successfulOperations: newSuccessful,
        failedOperations: newFailed,
        lastDuration: convertToSafeNumber(duration, 0),
        averageDuration: convertToSafeNumber(newAverage, 0),
        externalDataUsageCount: newExternalDataUsage,
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

  // 🔧 Editor → MultiStep 전송 (외부 데이터 지원)
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
          const hasExternalData = !!validatedExternalData;
          const errorMsg = hasExternalData
            ? '외부 데이터가 있지만 전송 사전 조건 미충족'
            : '전송 사전 조건 미충족 (외부 데이터 없음)';
          throw new Error(errorMsg);
        }

        // 외부 데이터 사용 여부 로깅
        const usingExternalData = !!validatedExternalData;
        console.log('📤 [BRIDGE_HOOK] 전송 데이터 소스:', {
          source: usingExternalData ? 'external' : 'store',
          hasExternalData: !!validatedExternalData,
          qualityScore: externalDataQuality.qualityScore,
        });

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

    const usedExternalData = !!validatedExternalData;
    updateExecutionComplete(result, errorMessage, usedExternalData);
  }, [
    bridgeState.isExecuting,
    bridgeEngine,
    updateExecutionStart,
    updateExecutionComplete,
    validatedExternalData,
    externalDataQuality.qualityScore,
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
          performanceProfile: new Map<string, number>([
            ['executionTime', performance.now() - startTimeRef.current],
            ['memoryUsage', 0],
          ]),
          resourceUsage: new Map<string, number>([
            ['cpuUsage', 0],
            ['memoryAllocated', 0],
          ]),
        }
      : null;

    const errorMessage = success ? null : 'MultiStep → Editor 전송 실패';
    updateExecutionComplete(mockResult, errorMessage, false);
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
      bidirectionalResult?.overallSyncSuccess
        ? {
            operationSuccess: true,
            operationErrors: [],
            operationWarnings: [],
            transferredData: null,
            operationDuration: performance.now() - startTimeRef.current,
            executionMetadata: new Map<string, unknown>([
              ['operation', 'BIDIRECTIONAL_SYNC'],
              ['timestamp', Date.now()],
              ['overallSuccess', bidirectionalResult.overallSyncSuccess],
            ]),
            performanceProfile: new Map<string, number>([
              ['executionTime', performance.now() - startTimeRef.current],
              ['memoryUsage', 0],
              ['syncOperations', 2],
            ]),
            resourceUsage: new Map<string, number>([
              ['cpuUsage', 0],
              ['memoryAllocated', 0],
              ['networkCalls', 0],
            ]),
          }
        : null;

    const errorMessage = bidirectionalResult?.overallSyncSuccess
      ? null
      : '양방향 동기화 현재 지원 불가 (MultiStep 추출기 미구현)';

    updateExecutionComplete(mockResult, errorMessage, false);
  }, [bridgeState.isExecuting, updateExecutionStart, updateExecutionComplete]);

  // 🔧 검증 상태 계산 (외부 데이터 고려)
  const canExecuteForward = useMemo((): boolean => {
    // Early Return: 실행 중
    if (bridgeState.isExecuting) {
      return false;
    }

    try {
      // 외부 데이터가 있는 경우 더 관대한 검증
      const hasExternalData = !!validatedExternalData;
      const externalDataIsQuality = externalDataQuality.isValid;

      if (hasExternalData && externalDataIsQuality) {
        console.debug('✅ [BRIDGE_HOOK] 외부 데이터 기반 전방향 검증 통과');
        return true;
      }

      // 기존 브리지 엔진 검증
      const engineValidation = bridgeEngine.checkPreconditions();

      console.debug('📊 [BRIDGE_HOOK] 전방향 검증 결과:', {
        hasExternalData,
        externalDataIsQuality,
        engineValidation,
        finalResult: engineValidation,
      });

      return engineValidation;
    } catch (error) {
      console.warn('⚠️ [BRIDGE_HOOK] 전방향 검증 실패:', error);
      return false;
    }
  }, [
    bridgeState.isExecuting,
    bridgeEngine,
    validatedExternalData,
    externalDataQuality.isValid,
  ]);

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

    setBridgeState((prev) => ({
      ...prev,
      isExecuting: false,
      lastResult: null,
      errorMessage: null,
    }));

    metricsRef.current = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastDuration: 0,
      averageDuration: 0,
      externalDataUsageCount: 0,
    };

    startTimeRef.current = 0;

    try {
      syncEngine.resetState();
    } catch (error) {
      console.warn('⚠️ [BRIDGE_HOOK] Sync 엔진 초기화 실패:', error);
    }
  }, [syncEngine]);

  // 🔧 외부 데이터 새로고침
  const refreshExternalData = useCallback(
    (newExternalData: ExternalEditorData): void => {
      console.log('🔄 [BRIDGE_HOOK] 외부 데이터 새로고침');

      const isValidNewData = isValidExternalData(newExternalData);
      if (!isValidNewData) {
        console.warn('⚠️ [BRIDGE_HOOK] 유효하지 않은 새 외부 데이터');
        return;
      }

      setBridgeState((prev) => ({
        ...prev,
        hasExternalData: true,
        externalDataTimestamp: Date.now(),
      }));

      console.log('✅ [BRIDGE_HOOK] 외부 데이터 새로고침 완료');
    },
    []
  );

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
        performanceLogging: false,
        strictTypeChecking: true,
        customValidationRules: new Map<string, (data: unknown) => boolean>(),
        featureFlags: new Set<string>(),
      };
    }
  }, [bridgeEngine]);

  // 🔧 Hook 반환값 (외부 데이터 정보 포함)
  return {
    // 핵심 상태
    isExecuting: bridgeState.isExecuting,
    lastResult: bridgeState.lastResult,
    errorMessage: bridgeState.errorMessage,
    metrics: { ...metricsRef.current },
    hasExternalData: bridgeState.hasExternalData,

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
    refreshExternalData,
  };
}
