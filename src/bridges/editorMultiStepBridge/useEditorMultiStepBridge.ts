// bridges/editorMultiStepBridge/useEditorMultiStepBridge.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
} from './bridgeTypes';
import { createEditorMultiStepBridgeOrchestrator } from './bridgeOrchestrator';

interface BridgeHookState {
  isTransferInProgress: boolean;
  lastTransferResult: BridgeOperationExecutionResult | null;
  transferErrorDetails: BridgeOperationErrorDetails[];
  transferWarningMessages: string[];
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
  customBridgeConfiguration?: Partial<BridgeSystemConfiguration>
): BridgeHookReturn => {
  const bridgeOrchestratorInstanceRef = useRef(
    createEditorMultiStepBridgeOrchestrator(customBridgeConfiguration)
  );

  const isInitializedRef = useRef(false);
  const lastTransferCheckRef = useRef<number>(0);
  const transferCheckCacheRef = useRef<boolean>(false);

  const [bridgeHookInternalState, setBridgeHookInternalState] =
    useState<BridgeHookState>({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrorDetails: [],
      transferWarningMessages: [],
      transferCount: 0,
    });

  const [isAutoTransferActive, setIsAutoTransferActive] =
    useState<boolean>(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      setBridgeHookInternalState({
        isTransferInProgress: false,
        lastTransferResult: null,
        transferErrorDetails: [],
        transferWarningMessages: [],
        transferCount: 0,
      });

      setIsAutoTransferActive(false);

      try {
        bridgeOrchestratorInstanceRef.current =
          createEditorMultiStepBridgeOrchestrator(customBridgeConfiguration);
      } catch (error) {
        console.error(
          '❌ [BRIDGE_HOOK] 브릿지 오케스트레이터 재생성 중 오류:',
          error
        );
      }

      isInitializedRef.current = true;
    }
  }, []);

  const {
    isTransferInProgress: currentTransferInProgress,
    lastTransferResult: mostRecentTransferResult,
    transferErrorDetails: accumulatedTransferErrors,
    transferWarningMessages: accumulatedTransferWarnings,
    transferCount: totalTransferAttempts,
  } = bridgeHookInternalState;

  const {
    executeBridgeTransfer: performBridgeDataTransfer,
    checkTransferPreconditions: validateTransferPreconditions,
    getConfiguration: retrieveBridgeConfiguration,
  } = bridgeOrchestratorInstanceRef.current;

  const currentBridgeConfiguration = retrieveBridgeConfiguration();

  const executeSingleBridgeTransferOperation =
    useCallback(async (): Promise<void> => {
      if (currentTransferInProgress) {
        return;
      }

      setBridgeHookInternalState((previousHookState) => ({
        ...previousHookState,
        isTransferInProgress: true,
        transferErrorDetails: [],
        transferWarningMessages: [],
      }));

      try {
        const bridgeTransferExecutionResult = await performBridgeDataTransfer();

        const {
          operationSuccess: wasTransferOperationSuccessful,
          operationErrors: transferOperationErrors = [],
          operationWarnings: transferOperationWarnings = [],
          transferredData: finalTransferredData,
          operationDuration: totalTransferDuration,
        } = bridgeTransferExecutionResult;

        setBridgeHookInternalState((previousHookState) => ({
          ...previousHookState,
          isTransferInProgress: false,
          lastTransferResult: bridgeTransferExecutionResult,
          transferErrorDetails: transferOperationErrors,
          transferWarningMessages: transferOperationWarnings,
          transferCount: previousHookState.transferCount + 1,
        }));

        transferCheckCacheRef.current = wasTransferOperationSuccessful;
        lastTransferCheckRef.current = Date.now();
      } catch (unexpectedTransferError) {
        console.error(
          '💥 [BRIDGE_HOOK] 예상치 못한 브릿지 전송 오류:',
          unexpectedTransferError
        );

        setBridgeHookInternalState((previousHookState) => ({
          ...previousHookState,
          isTransferInProgress: false,
          transferErrorDetails: [
            {
              errorCode: `HOOK_ERROR_${Date.now()}`,
              errorMessage:
                unexpectedTransferError instanceof Error
                  ? unexpectedTransferError.message
                  : '알 수 없는 브릿지 훅 오류',
              errorTimestamp: new Date(),
              errorContext: { hookError: true },
              isRecoverable: false,
            },
          ],
          transferCount: previousHookState.transferCount + 1,
        }));

        transferCheckCacheRef.current = false;
        lastTransferCheckRef.current = Date.now();
      }
    }, [currentTransferInProgress, performBridgeDataTransfer]);

  const validateCurrentTransferPreconditions = useCallback((): boolean => {
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastTransferCheckRef.current;

    if (timeSinceLastCheck < 500) {
      return transferCheckCacheRef.current;
    }

    if (currentTransferInProgress) {
      transferCheckCacheRef.current = false;
      lastTransferCheckRef.current = currentTime;
      return false;
    }

    try {
      const preconditionsValid = validateTransferPreconditions();
      transferCheckCacheRef.current = preconditionsValid;
      lastTransferCheckRef.current = currentTime;
      return preconditionsValid;
    } catch (error) {
      transferCheckCacheRef.current = false;
      lastTransferCheckRef.current = currentTime;
      return false;
    }
  }, [currentTransferInProgress, validateTransferPreconditions]);

  const resetAllBridgeHookState = useCallback((): void => {
    setBridgeHookInternalState({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrorDetails: [],
      transferWarningMessages: [],
      transferCount: 0,
    });

    setIsAutoTransferActive(false);
    transferCheckCacheRef.current = false;
    lastTransferCheckRef.current = 0;
  }, []);

  const toggleAutoTransferState = useCallback((): void => {
    setIsAutoTransferActive((previous) => {
      const newState = !previous;
      return newState;
    });
  }, []);

  return {
    isTransferInProgress: currentTransferInProgress,
    lastTransferResult: mostRecentTransferResult,
    transferErrorDetails: accumulatedTransferErrors,
    transferWarningMessages: accumulatedTransferWarnings,
    transferCount: totalTransferAttempts,
    executeManualTransfer: executeSingleBridgeTransferOperation,
    checkCanTransfer: validateCurrentTransferPreconditions,
    resetBridgeState: resetAllBridgeHookState,
    bridgeConfiguration: currentBridgeConfiguration,
    isAutoTransferActive,
    toggleAutoTransfer: toggleAutoTransferState,
  };
};
