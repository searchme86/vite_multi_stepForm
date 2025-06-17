// bridges/hooks/useBridgeUI.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useEditorMultiStepBridge } from '../editorMultiStepBridge/useEditorMultiStepBridge';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
} from '../editorMultiStepBridge/bridgeTypes';

import { createEditorStateExtractor } from '../editorMultiStepBridge/editorStateExtractor';

interface BridgeUIState {
  readonly canTransfer: boolean;
  readonly isTransferring: boolean;
  readonly lastTransferResult: BridgeOperationExecutionResult | null;
  readonly transferErrors: BridgeOperationErrorDetails[];
  readonly transferWarnings: string[];
  readonly transferAttemptCount: number;
}

interface EditorValidationStatus {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly isReadyForTransfer: boolean;
}

interface BridgeUIActions {
  executeManualTransfer: () => Promise<void>;
  checkCurrentTransferStatus: () => boolean;
  resetAllBridgeState: () => void;
  refreshValidationStatus: () => void;
}

interface BridgeUIHookReturn extends BridgeUIState, BridgeUIActions {
  readonly bridgeConfiguration: BridgeSystemConfiguration;
  readonly validationStatus: EditorValidationStatus;
}

export const useBridgeUI = (
  customBridgeConfig?: Partial<BridgeSystemConfiguration>
): BridgeUIHookReturn => {
  const isInitializedRef = useRef(false);
  const lastValidationTimeRef = useRef<number>(0);
  const validationCacheRef = useRef<EditorValidationStatus | null>(null);
  const canTransferCacheRef = useRef<boolean>(false);
  const lastCanTransferCheckRef = useRef<number>(0);

  const [validationRefreshTrigger, setValidationRefreshTrigger] =
    useState<number>(0);

  const bridgeHook = useEditorMultiStepBridge(customBridgeConfig);

  const getEditorExtractor = useCallback(() => {
    return createEditorStateExtractor();
  }, []);

  const executeTransferWithUIFeedback = useCallback(async (): Promise<void> => {
    if (bridgeHook.isTransferInProgress) {
      return;
    }

    const transferStartTime = performance.now();

    try {
      await bridgeHook.executeManualTransfer();

      const transferEndTime = performance.now();
      const transferDuration = transferEndTime - transferStartTime;

      setValidationRefreshTrigger((prev) => {
        if (prev > 50) {
          return 0;
        }
        return prev + 1;
      });
    } catch (transferExecutionError) {
      console.error(
        '❌ [BRIDGE_UI] 전송 실행 중 오류:',
        transferExecutionError
      );
    }
  }, [bridgeHook.isTransferInProgress, bridgeHook.executeManualTransfer]);

  const checkCurrentTransferCapability = useCallback((): boolean => {
    const currentTime = Date.now();
    const timeSinceLastCheck = currentTime - lastCanTransferCheckRef.current;

    if (timeSinceLastCheck < 500) {
      return canTransferCacheRef.current;
    }

    if (bridgeHook.isTransferInProgress) {
      canTransferCacheRef.current = false;
      lastCanTransferCheckRef.current = currentTime;
      return false;
    }

    try {
      const basicTransferCapability = bridgeHook.checkCanTransfer();
      canTransferCacheRef.current = basicTransferCapability;
      lastCanTransferCheckRef.current = currentTime;
      return basicTransferCapability;
    } catch (error) {
      canTransferCacheRef.current = false;
      lastCanTransferCheckRef.current = currentTime;
      return false;
    }
  }, [bridgeHook.isTransferInProgress, bridgeHook.checkCanTransfer]);

  const resetAllBridgeAndUIState = useCallback((): void => {
    try {
      bridgeHook.resetBridgeState();
      setValidationRefreshTrigger(0);
      lastValidationTimeRef.current = 0;
      isInitializedRef.current = false;
      validationCacheRef.current = null;
      canTransferCacheRef.current = false;
      lastCanTransferCheckRef.current = 0;
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 상태 초기화 중 오류:', error);
    }
  }, [bridgeHook.resetBridgeState]);

  const refreshCurrentValidationStatus = useCallback((): void => {
    const currentTime = Date.now();
    const timeSinceLastValidation = currentTime - lastValidationTimeRef.current;

    if (timeSinceLastValidation < 300) {
      return;
    }

    lastValidationTimeRef.current = currentTime;
    setValidationRefreshTrigger((prev) => {
      if (prev > 50) {
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const calculatedValidationStatus = useMemo<EditorValidationStatus>(() => {
    const calculationStartTime = performance.now();

    try {
      const callCount = validationRefreshTrigger;

      if (callCount > 20 && validationCacheRef.current) {
        return validationCacheRef.current;
      }

      let currentSnapshot = null;
      try {
        const extractor = getEditorExtractor();
        currentSnapshot = extractor.getEditorStateWithValidation();
      } catch (extractorError) {
        console.error('❌ [BRIDGE_UI] 추출기 생성 실패:', extractorError);
        return {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          validationErrors: ['추출기 생성 실패'],
          validationWarnings: [],
          isReadyForTransfer: false,
        };
      }

      if (!currentSnapshot) {
        const fallbackStatus = {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          validationErrors: [],
          validationWarnings: [],
          isReadyForTransfer: false,
        };
        validationCacheRef.current = fallbackStatus;
        return fallbackStatus;
      }

      const {
        editorContainers: currentContainers = [],
        editorParagraphs: currentParagraphs = [],
        editorCompletedContent: currentContent = '',
      } = currentSnapshot;

      let isCurrentlyTransferable = false;
      if (callCount < 10) {
        try {
          isCurrentlyTransferable = checkCurrentTransferCapability();
        } catch (transferCheckError) {
          isCurrentlyTransferable = false;
        }
      }

      const containerCount = currentContainers.length;
      const paragraphCount = currentParagraphs.length;

      const assignedParagraphs = currentParagraphs.filter(
        (paragraph) =>
          paragraph.containerId !== null && paragraph.containerId !== undefined
      );
      const assignedParagraphCount = assignedParagraphs.length;

      const unassignedParagraphs = currentParagraphs.filter(
        (paragraph) =>
          paragraph.containerId === null || paragraph.containerId === undefined
      );
      const unassignedParagraphCount = unassignedParagraphs.length;

      const totalContentLength = currentParagraphs.reduce(
        (totalLength, paragraph) => {
          const contentLength = paragraph?.content?.length || 0;
          return totalLength + contentLength;
        },
        0
      );

      const validationErrors: string[] = [];

      if (containerCount === 0) {
        validationErrors.push('컨테이너가 없습니다');
      }

      if (paragraphCount === 0) {
        validationErrors.push('문단이 없습니다');
      }

      if (totalContentLength < 10) {
        validationErrors.push('콘텐츠가 너무 짧습니다 (최소 10자 필요)');
      }

      const validationWarnings: string[] = [];

      if (containerCount < 2) {
        validationWarnings.push('컨테이너가 2개 미만입니다 (권장: 2개 이상)');
      }

      if (paragraphCount < 3) {
        validationWarnings.push('문단이 3개 미만입니다 (권장: 3개 이상)');
      }

      if (unassignedParagraphCount > 0) {
        validationWarnings.push(
          `미할당 문단이 ${unassignedParagraphCount}개 있습니다`
        );
      }

      if (totalContentLength < 100) {
        validationWarnings.push('콘텐츠가 100자 미만입니다 (권장: 100자 이상)');
      }

      const emptyContainers = currentContainers.filter((container) => {
        const containerParagraphs = currentParagraphs.filter(
          (paragraph) => paragraph.containerId === container.id
        );
        return containerParagraphs.length === 0;
      });

      if (emptyContainers.length > 0) {
        validationWarnings.push(
          `빈 컨테이너가 ${emptyContainers.length}개 있습니다`
        );
      }

      const isReadyForTransfer =
        isCurrentlyTransferable && validationErrors.length === 0;

      const calculatedValidationData: EditorValidationStatus = {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        unassignedParagraphCount,
        totalContentLength,
        validationErrors,
        validationWarnings,
        isReadyForTransfer,
      };

      validationCacheRef.current = calculatedValidationData;
      return calculatedValidationData;
    } catch (validationCalculationError) {
      console.error(
        '❌ [BRIDGE_UI] 검증 상태 계산 중 오류:',
        validationCalculationError
      );

      const errorStatus = {
        containerCount: 0,
        paragraphCount: 0,
        assignedParagraphCount: 0,
        unassignedParagraphCount: 0,
        totalContentLength: 0,
        validationErrors: ['검증 상태 계산 중 오류가 발생했습니다'],
        validationWarnings: [],
        isReadyForTransfer: false,
      };
      validationCacheRef.current = errorStatus;
      return errorStatus;
    }
  }, [
    validationRefreshTrigger,
    getEditorExtractor,
    checkCurrentTransferCapability,
  ]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      setValidationRefreshTrigger(0);
      lastValidationTimeRef.current = 0;
      validationCacheRef.current = null;
      canTransferCacheRef.current = false;
      lastCanTransferCheckRef.current = 0;

      try {
        if (bridgeHook.resetBridgeState) {
          bridgeHook.resetBridgeState();
        }
      } catch (error) {
        console.error('❌ [BRIDGE_UI] 기본 브릿지 초기화 중 오류:', error);
      }

      isInitializedRef.current = true;
    }
  }, [bridgeHook.resetBridgeState]);

  const bridgeUIReturn: BridgeUIHookReturn = {
    canTransfer: checkCurrentTransferCapability(),
    isTransferring: bridgeHook.isTransferInProgress,
    lastTransferResult: bridgeHook.lastTransferResult,
    transferErrors: bridgeHook.transferErrorDetails,
    transferWarnings: bridgeHook.transferWarningMessages,
    transferAttemptCount: bridgeHook.transferCount,
    bridgeConfiguration: bridgeHook.bridgeConfiguration,
    validationStatus: calculatedValidationStatus,
    executeManualTransfer: executeTransferWithUIFeedback,
    checkCurrentTransferStatus: checkCurrentTransferCapability,
    resetAllBridgeState: resetAllBridgeAndUIState,
    refreshValidationStatus: refreshCurrentValidationStatus,
  };

  return bridgeUIReturn;
};
