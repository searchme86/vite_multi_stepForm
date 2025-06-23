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

// 🔧 Bridge Hook 상태 인터페이스 - 양방향 기능 포함
interface BridgeHookState {
  isTransferInProgress: boolean;
  lastTransferResult: BridgeOperationExecutionResult | null;
  transferErrors: BridgeOperationErrorDetails[];
  transferWarnings: string[];
  transferCount: number;
  isReverseTransferInProgress: boolean;
  lastReverseTransferResult: MultiStepToEditorDataTransformationResult | null;
  isBidirectionalSyncInProgress: boolean;
  lastBidirectionalSyncResult: BidirectionalSyncResult | null;
}

// 🔧 Bridge Hook 액션 인터페이스 - 양방향 기능 포함
interface BridgeHookActions {
  executeManualTransfer: () => Promise<void>;
  checkCanTransfer: () => boolean;
  resetBridgeState: () => void;
  executeReverseTransfer: () => Promise<void>;
  executeBidirectionalSync: () => Promise<void>;
  checkCanReverseTransfer: () => boolean;
}

// 🔧 Bridge Hook 반환 인터페이스 - 완전한 양방향 지원
interface BridgeHookReturn extends BridgeHookState, BridgeHookActions {
  bridgeConfiguration: BridgeSystemConfiguration;
  isAutoTransferActive: boolean;
  toggleAutoTransfer: () => void;
}

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
        return { isValid: false, reason: 'TRANSFER_IN_PROGRESS' };
      }

      const isValid = checkTransferPreconditions();
      return {
        isValid,
        reason: isValid ? 'VALID' : 'INVALID_CONDITIONS',
      };
    } catch (error) {
      return { isValid: false, reason: 'VALIDATION_ERROR', error };
    }
  }, [state.isTransferInProgress, checkTransferPreconditions]);

  // 🔧 스로틀링된 로그 함수
  const logWithThrottle = useCallback((message: string, data?: any) => {
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
    setState((prev) => ({
      ...prev,
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

      setState((prev) => ({
        ...prev,
        isTransferInProgress: false,
        lastTransferResult: result,
        transferErrors: operationErrors,
        transferWarnings: operationWarnings,
        transferCount: prev.transferCount + 1,
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

      const errorDetail: BridgeOperationErrorDetails = {
        errorCode: `BIDIRECTIONAL_HOOK_ERROR_${Date.now()}`,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
        errorTimestamp: new Date(),
        errorContext: { hookError: true, direction: 'editor_to_multistep' },
        isRecoverable: false,
      };

      setState((prev) => ({
        ...prev,
        isTransferInProgress: false,
        transferErrors: [errorDetail],
        transferCount: prev.transferCount + 1,
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
    setState((prev) => ({
      ...prev,
      isReverseTransferInProgress: true,
    }));

    try {
      const success = await syncManager.current.syncMultiStepToEditor();

      if (success) {
        const tempResult: MultiStepToEditorDataTransformationResult = {
          editorContent: '역방향 전송 완료',
          editorIsCompleted: true,
          transformationSuccess: true,
          transformationErrors: [],
          transformedTimestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          isReverseTransferInProgress: false,
          lastReverseTransferResult: tempResult,
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

      setState((prev) => ({
        ...prev,
        isReverseTransferInProgress: false,
        lastReverseTransferResult: {
          editorContent: '',
          editorIsCompleted: false,
          transformationSuccess: false,
          transformationErrors: [
            error instanceof Error ? error.message : '역방향 전송 오류',
          ],
          transformedTimestamp: Date.now(),
        },
      }));
    }
  }, [state.isReverseTransferInProgress]);

  // 🆕 양방향 동기화 (새로운 기능)
  const executeBidirectionalSync = useCallback(async (): Promise<void> => {
    if (state.isBidirectionalSyncInProgress) {
      console.log('🔄 [BIDIRECTIONAL_BRIDGE] 이미 양방향 동기화 중');
      return;
    }

    console.log('🚀 [BIDIRECTIONAL_BRIDGE] 양방향 동기화 시작');
    setState((prev) => ({
      ...prev,
      isBidirectionalSyncInProgress: true,
    }));

    try {
      const syncResult = await syncManager.current.syncBidirectional();

      setState((prev) => ({
        ...prev,
        isBidirectionalSyncInProgress: false,
        lastBidirectionalSyncResult: syncResult,
      }));

      if (syncResult.overallSuccess) {
        console.log('✅ [BIDIRECTIONAL_BRIDGE] 양방향 동기화 성공');
      } else {
        console.warn(
          '⚠️ [BIDIRECTIONAL_BRIDGE] 양방향 동기화 부분 실패:',
          syncResult.syncErrors
        );
      }
    } catch (error) {
      console.error('❌ [BIDIRECTIONAL_BRIDGE] 양방향 동기화 실패:', error);

      setState((prev) => ({
        ...prev,
        isBidirectionalSyncInProgress: false,
        lastBidirectionalSyncResult: {
          editorToMultiStepSuccess: false,
          multiStepToEditorSuccess: false,
          overallSuccess: false,
          syncErrors: [
            error instanceof Error ? error.message : '양방향 동기화 오류',
          ],
          syncDuration: 0,
        },
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
    setIsAutoTransferActive((prev) => !prev);
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
