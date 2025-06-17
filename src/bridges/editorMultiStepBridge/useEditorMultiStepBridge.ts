// bridges/editorMultiStepBridge/useEditorMultiStepBridge.ts

import { useState, useCallback, useRef } from 'react';
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
}

export const useEditorMultiStepBridge = (
  customBridgeConfiguration?: Partial<BridgeSystemConfiguration>
): BridgeHookReturn => {
  console.log('🎣 [BRIDGE_HOOK] 에디터-멀티스텝 브릿지 훅 시작');

  const bridgeOrchestratorInstanceRef = useRef(
    createEditorMultiStepBridgeOrchestrator(customBridgeConfiguration)
  );

  const [bridgeHookInternalState, setBridgeHookInternalState] =
    useState<BridgeHookState>({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrorDetails: [],
      transferWarningMessages: [],
      transferCount: 0,
    });

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
      console.log('🔄 [BRIDGE_HOOK] 수동 브릿지 전송 작업 시작');

      if (currentTransferInProgress) {
        console.warn('⚠️ [BRIDGE_HOOK] 이미 전송 진행 중, 중복 실행 방지');
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

        console.log('📊 [BRIDGE_HOOK] 브릿지 전송 결과:', {
          success: wasTransferOperationSuccessful,
          errorCount: transferOperationErrors.length,
          warningCount: transferOperationWarnings.length,
          duration: `${totalTransferDuration.toFixed(2)}ms`,
          hasData: !!finalTransferredData,
        });

        setBridgeHookInternalState((previousHookState) => ({
          ...previousHookState,
          isTransferInProgress: false,
          lastTransferResult: bridgeTransferExecutionResult,
          transferErrorDetails: transferOperationErrors,
          transferWarningMessages: transferOperationWarnings,
          transferCount: previousHookState.transferCount + 1,
        }));

        if (wasTransferOperationSuccessful) {
          console.log('✅ [BRIDGE_HOOK] 브릿지 전송 성공');
        } else {
          console.error('❌ [BRIDGE_HOOK] 브릿지 전송 실패');
        }
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
      }
    }, [currentTransferInProgress, performBridgeDataTransfer]);

  const validateCurrentTransferPreconditions = useCallback((): boolean => {
    console.log('🔍 [BRIDGE_HOOK] 현재 전송 사전 조건 검증');

    if (currentTransferInProgress) {
      console.warn('⚠️ [BRIDGE_HOOK] 전송 진행 중으로 사전 조건 불충족');
      return false;
    }

    const preconditionsValid = validateTransferPreconditions();
    console.log(`📋 [BRIDGE_HOOK] 사전 조건 검증 결과: ${preconditionsValid}`);

    return preconditionsValid;
  }, [currentTransferInProgress, validateTransferPreconditions]);

  const resetAllBridgeHookState = useCallback((): void => {
    console.log('🔄 [BRIDGE_HOOK] 브릿지 훅 상태 초기화');

    setBridgeHookInternalState({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrorDetails: [],
      transferWarningMessages: [],
      transferCount: 0,
    });
  }, []);

  console.log('✅ [BRIDGE_HOOK] 브릿지 훅 반환 값 생성 완료');

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
  };
};
