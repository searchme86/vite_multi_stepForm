// bridges/editorMultiStepBridge/useEditorMultiStepBridge.ts

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
} from './bridgeTypes';
import { createEditorMultiStepBridgeOrchestrator } from './bridgeOrchestrator';
import { VALIDATION_CRITERIA } from './bridgeConfig';

interface BridgeHookState {
  isTransferInProgress: boolean;
  lastTransferResult: BridgeOperationExecutionResult | null;
  transferErrors: BridgeOperationErrorDetails[];
  transferWarnings: string[];
  transferCount: number;
}

interface BridgeHookActions {
  executeManualTransfer: () => Promise<void>;
  checkCanTransfer: () => boolean;
  resetBridgeState: () => void;
}

interface BridgeHookReturn extends BridgeHookState, BridgeHookActions {
  bridgeConfiguration: BridgeSystemConfiguration;
  isAutoTransferActive: boolean;
  toggleAutoTransfer: () => void;
}

export const useEditorMultiStepBridge = (
  customConfig?: Partial<BridgeSystemConfiguration>
): BridgeHookReturn => {
  const orchestrator = useRef(
    createEditorMultiStepBridgeOrchestrator(customConfig)
  );
  const isInitialized = useRef(false);
  const lastTransferCheck = useRef<number>(0);
  const transferCheckCache = useRef<boolean>(false);
  const lastLogTime = useRef<number>(0);

  const [state, setState] = useState<BridgeHookState>({
    isTransferInProgress: false,
    lastTransferResult: null,
    transferErrors: [],
    transferWarnings: [],
    transferCount: 0,
  });

  const [isAutoTransferActive, setIsAutoTransferActive] =
    useState<boolean>(false);

  useEffect(() => {
    if (!isInitialized.current) {
      setState({
        isTransferInProgress: false,
        lastTransferResult: null,
        transferErrors: [],
        transferWarnings: [],
        transferCount: 0,
      });

      setIsAutoTransferActive(false);

      try {
        orchestrator.current =
          createEditorMultiStepBridgeOrchestrator(customConfig);
      } catch (error) {
        console.error('❌ [BRIDGE_HOOK] 오케스트레이터 생성 실패:', error);
      }

      isInitialized.current = true;
    }
  }, [customConfig]);

  const {
    executeBridgeTransfer,
    checkTransferPreconditions,
    getConfiguration,
  } = orchestrator.current;

  const currentConfig = getConfiguration();

  // 사전 조건 체크 - 복잡한 로직 단순화
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

  const logWithThrottle = useCallback((message: string, data?: any) => {
    const now = Date.now();
    if (now - lastLogTime.current > 5000) {
      console.warn(message, data);
      lastLogTime.current = now;
    }
  }, []);

  const executeTransfer = useCallback(async (): Promise<void> => {
    if (state.isTransferInProgress) {
      console.log('🔄 [BRIDGE_HOOK] 이미 전송 중');
      return;
    }

    console.log('🚀 [BRIDGE_HOOK] 전송 시작');
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

      transferCheckCache.current = operationSuccess;
      lastTransferCheck.current = Date.now();

      console.log(
        operationSuccess
          ? '✅ [BRIDGE_HOOK] 전송 성공'
          : '❌ [BRIDGE_HOOK] 전송 실패'
      );
    } catch (error) {
      console.error('❌ [BRIDGE_HOOK] 전송 중 예외:', error);

      const errorDetail: BridgeOperationErrorDetails = {
        errorCode: `HOOK_ERROR_${Date.now()}`,
        errorMessage:
          error instanceof Error ? error.message : '알 수 없는 오류',
        errorTimestamp: new Date(),
        errorContext: { hookError: true },
        isRecoverable: false,
      };

      setState((prev) => ({
        ...prev,
        isTransferInProgress: false,
        transferErrors: [errorDetail],
        transferCount: prev.transferCount + 1,
      }));

      transferCheckCache.current = false;
      lastTransferCheck.current = Date.now();
    }
  }, [state.isTransferInProgress, executeBridgeTransfer]);

  const checkCanTransfer = useCallback((): boolean => {
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastTransferCheck.current;

    // 캐시 사용 (성능 최적화)
    if (timeSinceLastCheck < VALIDATION_CRITERIA.cacheDuration) {
      return transferCheckCache.current;
    }

    if (
      !preconditionsCheck.isValid &&
      preconditionsCheck.reason !== 'TRANSFER_IN_PROGRESS'
    ) {
      logWithThrottle(
        `⚠️ [BRIDGE_HOOK] 사전 조건 실패: ${preconditionsCheck.reason}`
      );
    }

    transferCheckCache.current = preconditionsCheck.isValid;
    lastTransferCheck.current = currentTime;
    return preconditionsCheck.isValid;
  }, [preconditionsCheck, logWithThrottle]);

  const resetState = useCallback((): void => {
    console.log('🔄 [BRIDGE_HOOK] 상태 초기화');
    setState({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrors: [],
      transferWarnings: [],
      transferCount: 0,
    });

    setIsAutoTransferActive(false);
    transferCheckCache.current = false;
    lastTransferCheck.current = 0;
    lastLogTime.current = 0;
  }, []);

  const toggleAutoTransfer = useCallback((): void => {
    setIsAutoTransferActive((prev) => !prev);
    console.log('🔄 [BRIDGE_HOOK] 자동 전송 토글:', !isAutoTransferActive);
  }, [isAutoTransferActive]);

  return {
    isTransferInProgress: state.isTransferInProgress,
    lastTransferResult: state.lastTransferResult,
    transferErrors: state.transferErrors,
    transferWarnings: state.transferWarnings,
    transferCount: state.transferCount,
    executeManualTransfer: executeTransfer,
    checkCanTransfer,
    resetBridgeState: resetState,
    bridgeConfiguration: currentConfig,
    isAutoTransferActive,
    toggleAutoTransfer,
  };
};
