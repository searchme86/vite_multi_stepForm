// bridges/editorMultiStepBridge/hooks/useBidirectionalBridge.ts

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
  MultiStepToEditorDataTransformationResult,
  BidirectionalSyncResult,
} from '../editorMultiStepBridge/bridgeDataTypes.ts';
import { createEditorMultiStepBridgeOrchestrator } from '../editorMultiStepBridge/bidirectionalBridgeOrchestrator';
import { createBidirectionalSyncManager } from '../editorMultiStepBridge/bidirectionalSyncManager';

// 🔧 Bridge Hook 상태 인터페이스 - 원본 타입 직접 사용
interface BridgeHookState {
  isTransferInProgress: boolean;
  lastTransferResult: BridgeOperationExecutionResult | null;
  transferErrors: BridgeOperationErrorDetails[];
  transferWarnings: string[];
  transferCount: number;
  isReverseTransferInProgress: boolean;
  lastReverseTransferResult: MultiStepToEditorDataTransformationResult | null; // 원본 타입 사용
  isBidirectionalSyncInProgress: boolean;
  lastBidirectionalSyncResult: BidirectionalSyncResult | null; // 원본 타입 사용
}

// 🔧 Bridge Hook 액션 인터페이스
interface BridgeHookActions {
  executeManualTransfer: () => Promise<void>;
  checkCanTransfer: () => boolean;
  resetBridgeState: () => void;
  executeReverseTransfer: () => Promise<void>;
  executeBidirectionalSync: () => Promise<void>;
  checkCanReverseTransfer: () => boolean;
}

// 🔧 Bridge Hook 반환 인터페이스
interface BridgeHookReturn extends BridgeHookState, BridgeHookActions {
  bridgeConfiguration: BridgeSystemConfiguration;
  isAutoTransferActive: boolean;
  toggleAutoTransfer: () => void;
}

// 🛡️ 유틸리티 함수들 - 간소화

/**
 * readonly 배열을 mutable 배열로 변환하는 유틸리티 함수
 * @param readonlyArray - readonly 배열
 * @returns 새로운 mutable 배열
 */
const convertToMutableArray = <T>(
  readonlyArray: readonly T[] | T[] | undefined
): T[] => {
  console.log('🔄 [ARRAY_CONVERTER] 배열 변환 시작');

  if (!readonlyArray) {
    console.log('🔄 [ARRAY_CONVERTER] 빈 배열 반환');
    return [];
  }

  const mutableArray = [...readonlyArray];
  console.log('✅ [ARRAY_CONVERTER] 변환 완료:', {
    length: mutableArray.length,
  });

  return mutableArray;
};

/**
 * Map 타입 메타데이터를 생성하는 함수
 * @param content - 컨텐츠 문자열
 * @returns Map 형태의 메타데이터
 */
const createContentMetadataMap = (content: string): Map<string, unknown> => {
  const metadata = new Map<string, unknown>();
  const lines = content.split('\n');

  metadata.set('totalLines', lines.length);
  metadata.set('contentLength', content.length);
  metadata.set('hasValidationErrors', false);
  metadata.set('lastModified', Date.now());

  console.log('📊 [CONTENT_METADATA] Map 메타데이터 생성:', {
    size: metadata.size,
    keys: Array.from(metadata.keys()),
  });

  return metadata;
};

/**
 * Map 타입 동기화 메타데이터를 생성하는 함수
 * @param startTime - 시작 시간
 * @param totalOps - 총 작업 수
 * @param failedOps - 실패한 작업 수
 * @returns Map 형태의 동기화 메타데이터
 */
const createSyncMetadataMap = (
  startTime: number,
  totalOps = 2,
  failedOps = 0
): Map<string, unknown> => {
  const metadata = new Map<string, unknown>();

  metadata.set('startTime', startTime);
  metadata.set('endTime', Date.now());
  metadata.set('totalOperations', totalOps);
  metadata.set('failedOperations', failedOps);

  console.log('📊 [SYNC_METADATA] Map 메타데이터 생성:', {
    size: metadata.size,
    keys: Array.from(metadata.keys()),
  });

  return metadata;
};

/**
 * 완전한 역방향 변환 결과를 생성하는 함수
 * @param content - 에디터 컨텐츠
 * @param isCompleted - 완료 여부
 * @param isSuccess - 성공 여부
 * @param errors - 에러 배열
 * @returns 완전한 역방향 변환 결과
 */
const createReverseTransformationResult = (
  content: string,
  isCompleted: boolean,
  isSuccess: boolean,
  errors: string[] = []
): MultiStepToEditorDataTransformationResult => {
  const result: MultiStepToEditorDataTransformationResult = {
    editorContent: content,
    editorIsCompleted: isCompleted,
    transformationSuccess: isSuccess,
    transformationErrors: errors,
    transformedTimestamp: Date.now(),
    contentMetadata: createContentMetadataMap(content), // Map 타입 사용
  };

  console.log('🏗️ [REVERSE_RESULT] 역방향 결과 생성:', {
    success: isSuccess,
    contentLength: content.length,
    errorsCount: errors.length,
  });

  return result;
};

/**
 * 완전한 양방향 동기화 결과를 생성하는 함수
 * @param editorSuccess - 에디터 방향 성공 여부
 * @param multiStepSuccess - 멀티스텝 방향 성공 여부
 * @param errors - 에러 배열
 * @param startTime - 시작 시간
 * @returns 완전한 양방향 동기화 결과
 */
const createBidirectionalSyncResult = (
  editorSuccess: boolean,
  multiStepSuccess: boolean,
  errors: string[] = [],
  startTime: number
): BidirectionalSyncResult => {
  const result: BidirectionalSyncResult = {
    editorToMultiStepSuccess: editorSuccess,
    multiStepToEditorSuccess: multiStepSuccess,
    overallSuccess: editorSuccess && multiStepSuccess,
    syncErrors: errors,
    syncDuration: Date.now() - startTime,
    syncMetadata: createSyncMetadataMap(startTime, 2, errors.length), // Map 타입 사용
  };

  console.log('🏗️ [BIDIRECTIONAL_RESULT] 양방향 결과 생성:', {
    overallSuccess: result.overallSuccess,
    duration: result.syncDuration,
    errorsCount: errors.length,
  });

  return result;
};

export const useBidirectionalBridge = (
  customConfig?: Partial<BridgeSystemConfiguration>
): BridgeHookReturn => {
  console.log('🔧 [BIDIRECTIONAL_BRIDGE] Hook 초기화 시작');

  // 🔧 Orchestrator와 Sync Manager 생성
  const orchestrator = useRef(
    createEditorMultiStepBridgeOrchestrator(customConfig)
  );
  const syncManager = useRef(createBidirectionalSyncManager());
  const isInitialized = useRef(false);
  const lastLogTime = useRef<number>(0);

  // 🔧 Hook 상태 관리
  const [state, setState] = useState<BridgeHookState>({
    isTransferInProgress: false,
    lastTransferResult: null,
    transferErrors: [],
    transferWarnings: [],
    transferCount: 0,
    isReverseTransferInProgress: false,
    lastReverseTransferResult: null,
    isBidirectionalSyncInProgress: false,
    lastBidirectionalSyncResult: null,
  });

  const [isAutoTransferActive, setIsAutoTransferActive] =
    useState<boolean>(false);

  // 🔧 초기화 Effect
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🔧 [BIDIRECTIONAL_BRIDGE] 초기 설정');

      setState({
        isTransferInProgress: false,
        lastTransferResult: null,
        transferErrors: [],
        transferWarnings: [],
        transferCount: 0,
        isReverseTransferInProgress: false,
        lastReverseTransferResult: null,
        isBidirectionalSyncInProgress: false,
        lastBidirectionalSyncResult: null,
      });

      setIsAutoTransferActive(false);

      try {
        orchestrator.current =
          createEditorMultiStepBridgeOrchestrator(customConfig);
        syncManager.current = createBidirectionalSyncManager();
        console.log('✅ [BIDIRECTIONAL_BRIDGE] 인스턴스 생성 완료');
      } catch (error) {
        console.error('❌ [BIDIRECTIONAL_BRIDGE] 인스턴스 생성 실패:', error);
      }

      isInitialized.current = true;
    }
  }, [customConfig]);

  // 🔧 Orchestrator 함수들 추출
  const {
    executeBridgeTransfer,
    checkTransferPreconditions,
    getConfiguration,
  } = orchestrator.current;

  const currentConfig = getConfiguration();

  // 🔧 전송 전 조건 체크
  const preconditionsCheck = useMemo(() => {
    try {
      if (state.isTransferInProgress) {
        return { isValid: false, reason: 'TRANSFER_IN_PROGRESS' as const };
      }

      const isValid = checkTransferPreconditions();
      return {
        isValid,
        reason: isValid ? ('VALID' as const) : ('INVALID_CONDITIONS' as const),
      };
    } catch (error) {
      return {
        isValid: false,
        reason: 'VALIDATION_ERROR' as const,
        error,
      };
    }
  }, [state.isTransferInProgress, checkTransferPreconditions]);

  // 🔧 스로틀링된 로그 함수
  const logWithThrottle = useCallback((message: string, data?: unknown) => {
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      console.warn(message, data);
      lastLogTime.current = now;
    }
  }, []);

  // 🔧 Editor → MultiStep 전송 (기존 기능)
  const executeTransfer = useCallback(async (): Promise<void> => {
    if (state.isTransferInProgress) {
      console.log('🔄 [BIDIRECTIONAL_BRIDGE] 이미 전송 중');
      return;
    }

    console.log('🚀 [BIDIRECTIONAL_BRIDGE] Editor → MultiStep 전송 시작');
    setState((prevState) => ({
      ...prevState,
      isTransferInProgress: true,
      transferErrors: [],
      transferWarnings: [],
    }));

    try {
      const result = await executeBridgeTransfer();
      const {
        operationSuccess,
        operationErrors = [],
        operationWarnings = [],
      } = result;

      // readonly 배열을 mutable 배열로 변환
      const mutableErrors = convertToMutableArray(operationErrors);
      const mutableWarnings = convertToMutableArray(operationWarnings);

      setState((prevState) => ({
        ...prevState,
        isTransferInProgress: false,
        lastTransferResult: result,
        transferErrors: mutableErrors,
        transferWarnings: mutableWarnings,
        transferCount: prevState.transferCount + 1,
      }));

      console.log(
        operationSuccess
          ? '✅ [BIDIRECTIONAL_BRIDGE] Editor → MultiStep 전송 성공'
          : '❌ [BIDIRECTIONAL_BRIDGE] Editor → MultiStep 전송 실패'
      );
    } catch (error) {
      console.error(
        '❌ [BIDIRECTIONAL_BRIDGE] Editor → MultiStep 전송 중 예외:',
        error
      );

      // 에러 상세 정보 생성 (필수 속성들 포함)
      const errorDetail: BridgeOperationErrorDetails = {
        errorCode: `BIDIRECTIONAL_HOOK_ERROR_${Date.now()}`,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
        errorTimestamp: new Date(),
        errorContext: {
          context: 'bidirectional_bridge_hook', // 필수 속성
          originalError:
            error instanceof Error
              ? error
              : typeof error === 'string'
              ? error
              : typeof error === 'number'
              ? error
              : typeof error === 'boolean'
              ? error
              : error === null
              ? error
              : error === undefined
              ? error
              : (error as object), // 337번 줄 수정 ✅
          timestamp: Date.now(),
          additionalData: new Map<string, string | number | boolean | null>([
            // 339번 줄 수정 ✅
            ['hookError', true],
            ['direction', 'editor_to_multistep'],
          ]),
          errorMetadata: new Map<string, string | number | boolean | null>(), // 이것도 수정 ✅
        },
        errorSeverity: 'HIGH', // 필수 속성 추가
        isRecoverable: false,
      };

      setState((prevState) => ({
        ...prevState,
        isTransferInProgress: false,
        transferErrors: [errorDetail],
        transferCount: prevState.transferCount + 1,
      }));
    }
  }, [state.isTransferInProgress, executeBridgeTransfer]);

  // 🆕 MultiStep → Editor 전송 (새로운 기능)
  const executeReverseTransfer = useCallback(async (): Promise<void> => {
    if (state.isReverseTransferInProgress) {
      console.log('🔄 [BIDIRECTIONAL_BRIDGE] 이미 역방향 전송 중');
      return;
    }

    console.log('🚀 [BIDIRECTIONAL_BRIDGE] MultiStep → Editor 전송 시작');
    setState((prevState) => ({
      ...prevState,
      isReverseTransferInProgress: true,
    }));

    try {
      const success = await syncManager.current.syncMultiStepToEditor();

      if (success) {
        const reverseResult = createReverseTransformationResult(
          '역방향 전송 완료',
          true,
          true,
          []
        );

        setState((prevState) => ({
          ...prevState,
          isReverseTransferInProgress: false,
          lastReverseTransferResult: reverseResult,
        }));

        console.log('✅ [BIDIRECTIONAL_BRIDGE] MultiStep → Editor 전송 완료');
      } else {
        throw new Error('SyncManager에서 역방향 전송 실패');
      }
    } catch (error) {
      console.error(
        '❌ [BIDIRECTIONAL_BRIDGE] MultiStep → Editor 전송 실패:',
        error
      );

      const failedResult = createReverseTransformationResult('', false, false, [
        error instanceof Error ? error.message : '역방향 전송 오류',
      ]);

      setState((prevState) => ({
        ...prevState,
        isReverseTransferInProgress: false,
        lastReverseTransferResult: failedResult,
      }));
    }
  }, [state.isReverseTransferInProgress]);

  // 🆕 양방향 동기화 (새로운 기능)
  const executeBidirectionalSync = useCallback(async (): Promise<void> => {
    if (state.isBidirectionalSyncInProgress) {
      console.log('🔄 [BIDIRECTIONAL_BRIDGE] 이미 양방향 동기화 중');
      return;
    }

    const syncStartTime = Date.now();
    console.log('🚀 [BIDIRECTIONAL_BRIDGE] 양방향 동기화 시작');
    setState((prevState) => ({
      ...prevState,
      isBidirectionalSyncInProgress: true,
    }));

    try {
      const syncResult = await syncManager.current.syncBidirectional();

      // readonly 배열을 mutable 배열로 변환
      const mutableSyncErrors = convertToMutableArray(syncResult.syncErrors);

      const completeSyncResult = createBidirectionalSyncResult(
        syncResult.editorToMultiStepSuccess,
        syncResult.multiStepToEditorSuccess,
        mutableSyncErrors, // 변환된 mutable 배열 사용
        syncStartTime
      );

      setState((prevState) => ({
        ...prevState,
        isBidirectionalSyncInProgress: false,
        lastBidirectionalSyncResult: completeSyncResult,
      }));

      if (completeSyncResult.overallSuccess) {
        console.log('✅ [BIDIRECTIONAL_BRIDGE] 양방향 동기화 성공');
      } else {
        console.warn(
          '⚠️ [BIDIRECTIONAL_BRIDGE] 양방향 동기화 부분 실패:',
          completeSyncResult.syncErrors
        );
      }
    } catch (error) {
      console.error('❌ [BIDIRECTIONAL_BRIDGE] 양방향 동기화 실패:', error);

      const failedSyncResult = createBidirectionalSyncResult(
        false,
        false,
        [error instanceof Error ? error.message : '양방향 동기화 오류'],
        syncStartTime
      );

      setState((prevState) => ({
        ...prevState,
        isBidirectionalSyncInProgress: false,
        lastBidirectionalSyncResult: failedSyncResult,
      }));
    }
  }, [state.isBidirectionalSyncInProgress]);

  // 🔧 전송 가능 여부 체크
  const checkCanTransfer = useCallback((): boolean => {
    if (
      !preconditionsCheck.isValid &&
      preconditionsCheck.reason !== 'TRANSFER_IN_PROGRESS'
    ) {
      logWithThrottle(
        `⚠️ [BIDIRECTIONAL_BRIDGE] 사전 조건 실패: ${preconditionsCheck.reason}`
      );
    }

    return preconditionsCheck.isValid;
  }, [preconditionsCheck, logWithThrottle]);

  // 🆕 역방향 전송 가능 여부 체크
  const checkCanReverseTransfer = useCallback((): boolean => {
    try {
      const syncConditions = syncManager.current.checkSyncPreconditions();
      const canReverse =
        !state.isReverseTransferInProgress &&
        !state.isBidirectionalSyncInProgress &&
        syncConditions.canSyncToEditor;

      console.log('🔍 [BIDIRECTIONAL_BRIDGE] 역방향 전송 조건 체크:', {
        canReverse,
        isReverseTransferInProgress: state.isReverseTransferInProgress,
        isBidirectionalSyncInProgress: state.isBidirectionalSyncInProgress,
        canSyncToEditor: syncConditions.canSyncToEditor,
      });

      return canReverse;
    } catch (error) {
      console.error(
        '❌ [BIDIRECTIONAL_BRIDGE] 역방향 전송 조건 체크 실패:',
        error
      );
      return false;
    }
  }, [state.isReverseTransferInProgress, state.isBidirectionalSyncInProgress]);

  // 🔧 상태 초기화
  const resetState = useCallback((): void => {
    console.log('🔄 [BIDIRECTIONAL_BRIDGE] 상태 초기화');
    setState({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrors: [],
      transferWarnings: [],
      transferCount: 0,
      isReverseTransferInProgress: false,
      lastReverseTransferResult: null,
      isBidirectionalSyncInProgress: false,
      lastBidirectionalSyncResult: null,
    });

    setIsAutoTransferActive(false);
    lastLogTime.current = 0;
  }, []);

  // 🔧 자동 전송 토글
  const toggleAutoTransfer = useCallback((): void => {
    setIsAutoTransferActive((previousValue) => !previousValue);
    console.log(
      '🔄 [BIDIRECTIONAL_BRIDGE] 자동 전송 토글:',
      !isAutoTransferActive
    );
  }, [isAutoTransferActive]);

  // 🔧 Hook 반환값
  return {
    // 기존 상태들
    isTransferInProgress: state.isTransferInProgress,
    lastTransferResult: state.lastTransferResult,
    transferErrors: state.transferErrors,
    transferWarnings: state.transferWarnings,
    transferCount: state.transferCount,

    // 새로운 양방향 상태들
    isReverseTransferInProgress: state.isReverseTransferInProgress,
    lastReverseTransferResult: state.lastReverseTransferResult,
    isBidirectionalSyncInProgress: state.isBidirectionalSyncInProgress,
    lastBidirectionalSyncResult: state.lastBidirectionalSyncResult,

    // 기존 액션들
    executeManualTransfer: executeTransfer,
    checkCanTransfer,
    resetBridgeState: resetState,

    // 새로운 양방향 액션들
    executeReverseTransfer,
    executeBidirectionalSync,
    checkCanReverseTransfer,

    // 설정 및 기타
    bridgeConfiguration: currentConfig,
    isAutoTransferActive,
    toggleAutoTransfer,
  };
};
