// bridges/editorMultiStepBridge/useEditorMultiStepBridge.ts

//====여기부터 수정됨====
import { useState, useCallback, useRef, useEffect } from 'react';
//====여기까지 수정됨====
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
  //====여기부터 수정됨====
  // 자동 전송 관련 기능 추가
  isAutoTransferActive: boolean;
  toggleAutoTransfer: () => void;
  //====여기까지 수정됨====
}

export const useEditorMultiStepBridge = (
  customBridgeConfiguration?: Partial<BridgeSystemConfiguration>
): BridgeHookReturn => {
  console.log('🎣 [BRIDGE_HOOK] 에디터-멀티스텝 브릿지 훅 시작');

  //====여기부터 수정됨====
  // 브릿지 오케스트레이터 인스턴스를 ref로 관리하여 재생성 방지
  const bridgeOrchestratorInstanceRef = useRef(
    createEditorMultiStepBridgeOrchestrator(customBridgeConfiguration)
  );

  // 초기화 완료 여부를 추적하는 ref
  // 1. 한 번만 초기화 실행되도록 보장 2. 중복 초기화 방지
  const isInitializedRef = useRef(false);

  // 브릿지 훅 내부 상태 - 깨끗한 초기 상태로 시작
  const [bridgeHookInternalState, setBridgeHookInternalState] =
    useState<BridgeHookState>({
      isTransferInProgress: false, // 1. 전송 진행 중 아님 2. 새로운 세션 시작
      lastTransferResult: null, // 1. 이전 전송 결과 없음 2. 깨끗한 시작
      transferErrorDetails: [], // 1. 오류 없음 2. 초기 상태
      transferWarningMessages: [], // 1. 경고 없음 2. 초기 상태
      transferCount: 0, // 1. 전송 시도 횟수 0 2. 새로운 세션
    });

  // 자동 전송 활성화 상태 - 기본적으로 비활성화
  const [isAutoTransferActive, setIsAutoTransferActive] =
    useState<boolean>(false);

  // 컴포넌트 마운트 시 브릿지 상태 완전 초기화
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔄 [BRIDGE_HOOK] 브릿지 훅 완전 초기화 시작');

      // 1. 브릿지 내부 상태 초기화
      setBridgeHookInternalState({
        isTransferInProgress: false,
        lastTransferResult: null,
        transferErrorDetails: [],
        transferWarningMessages: [],
        transferCount: 0,
      });

      // 2. 자동 전송 비활성화
      setIsAutoTransferActive(false);

      // 3. 브릿지 오케스트레이터 재생성 (필요시)
      try {
        bridgeOrchestratorInstanceRef.current =
          createEditorMultiStepBridgeOrchestrator(customBridgeConfiguration);
        console.log('🔄 [BRIDGE_HOOK] 브릿지 오케스트레이터 재생성 완료');
      } catch (error) {
        console.error(
          '❌ [BRIDGE_HOOK] 브릿지 오케스트레이터 재생성 중 오류:',
          error
        );
      }

      isInitializedRef.current = true;
      console.log('✅ [BRIDGE_HOOK] 브릿지 훅 완전 초기화 완료');
    }
  }, []); // 1. 빈 의존성 배열 2. 마운트 시 한 번만 실행
  //====여기까지 수정됨====

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

    //====여기부터 수정됨====
    // 완전한 초기화 - 자동 전송 상태도 포함
    setBridgeHookInternalState({
      isTransferInProgress: false,
      lastTransferResult: null,
      transferErrorDetails: [],
      transferWarningMessages: [],
      transferCount: 0,
    });

    // 자동 전송도 비활성화
    setIsAutoTransferActive(false);

    console.log('✅ [BRIDGE_HOOK] 브릿지 훅 완전 초기화 완료');
    //====여기까지 수정됨====
  }, []);

  //====여기부터 수정됨====
  // 자동 전송 토글 함수 추가
  const toggleAutoTransferState = useCallback((): void => {
    console.log('🎚️ [BRIDGE_HOOK] 자동 전송 토글');

    setIsAutoTransferActive((previous) => {
      const newState = !previous;
      console.log(`📊 [BRIDGE_HOOK] 자동 전송 상태: ${previous} → ${newState}`);
      return newState;
    });
  }, []);
  //====여기까지 수정됨====

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
    //====여기부터 수정됨====
    isAutoTransferActive,
    toggleAutoTransfer: toggleAutoTransferState,
    //====여기까지 수정됨====
  };
};
