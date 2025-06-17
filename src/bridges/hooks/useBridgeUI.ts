// 📁 bridges/hooks/useBridgeUI.ts

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
  console.log('🎨 [BRIDGE_UI] 브릿지 UI 훅 초기화 시작');

  //====여기부터 수정됨====
  // ✅ 모든 훅을 최상단에 고정 순서로 배치 - 조건부 호출 절대 금지

  // 1. 모든 useRef 훅들
  const isInitializedRef = useRef(false);
  const lastValidationTimeRef = useRef<number>(0);

  // 2. 모든 useState 훅들
  const [validationRefreshTrigger, setValidationRefreshTrigger] =
    useState<number>(0);

  // 3. 브릿지 훅 (이것도 항상 호출)
  const bridgeHook = useEditorMultiStepBridge(customBridgeConfig);

  // 4. 모든 useCallback 훅들 (순서 고정)
  const getEditorExtractor = useCallback(() => {
    return createEditorStateExtractor();
  }, []);

  const executeTransferWithUIFeedback = useCallback(async (): Promise<void> => {
    console.log('🚀 [BRIDGE_UI] UI 피드백 포함 전송 실행 시작');

    if (bridgeHook.isTransferInProgress) {
      console.warn('⚠️ [BRIDGE_UI] 이미 전송 진행 중, 중복 실행 차단');
      return;
    }

    const transferStartTime = performance.now();

    try {
      await bridgeHook.executeManualTransfer();

      const transferEndTime = performance.now();
      const transferDuration = transferEndTime - transferStartTime;

      console.log('✅ [BRIDGE_UI] 전송 완료:', {
        duration: `${transferDuration.toFixed(2)}ms`,
        hasErrors: bridgeHook.transferErrorDetails.length > 0,
        hasWarnings: bridgeHook.transferWarningMessages.length > 0,
      });

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
  }, [
    bridgeHook.isTransferInProgress,
    bridgeHook.executeManualTransfer,
    bridgeHook.transferErrorDetails.length,
    bridgeHook.transferWarningMessages.length,
  ]);

  const checkCurrentTransferCapability = useCallback((): boolean => {
    console.log('🔍 [BRIDGE_UI] 현재 전송 가능성 확인');

    if (bridgeHook.isTransferInProgress) {
      console.log('📊 [BRIDGE_UI] 전송 진행 중으로 불가능');
      return false;
    }

    try {
      const basicTransferCapability = bridgeHook.checkCanTransfer();
      console.log(
        '📊 [BRIDGE_UI] 전송 가능성 최종 결과:',
        basicTransferCapability
      );
      return basicTransferCapability;
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 전송 가능성 확인 중 오류:', error);
      return false;
    }
  }, [bridgeHook.isTransferInProgress, bridgeHook.checkCanTransfer]);

  const resetAllBridgeAndUIState = useCallback((): void => {
    console.log('🔄 [BRIDGE_UI] 전체 브릿지 및 UI 상태 초기화');

    try {
      bridgeHook.resetBridgeState();
      setValidationRefreshTrigger(0);
      lastValidationTimeRef.current = 0;
      isInitializedRef.current = false;

      console.log('✅ [BRIDGE_UI] 전체 상태 초기화 완료');
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 상태 초기화 중 오류:', error);
    }
  }, [bridgeHook.resetBridgeState]);

  const refreshCurrentValidationStatus = useCallback((): void => {
    console.log('🔄 [BRIDGE_UI] 검증 상태 수동 새로고침');

    const currentTime = Date.now();
    const timeSinceLastValidation = currentTime - lastValidationTimeRef.current;

    if (timeSinceLastValidation < 100) {
      console.warn('⚠️ [BRIDGE_UI] 새로고침 요청이 너무 빈번함, 무시');
      return;
    }

    lastValidationTimeRef.current = currentTime;
    setValidationRefreshTrigger((prev) => {
      if (prev > 50) {
        console.warn('⚠️ [BRIDGE_UI] 새로고침 횟수 제한, 리셋');
        return 0;
      }
      return prev + 1;
    });

    console.log('✅ [BRIDGE_UI] 검증 상태 새로고침 트리거 완료');
  }, []);

  // 5. 모든 useMemo 훅들
  const calculatedValidationStatus = useMemo<EditorValidationStatus>(() => {
    console.log('🔍 [BRIDGE_UI] 검증 상태 계산 시작 (안정화된 버전)');

    const calculationStartTime = performance.now();

    try {
      // 무한 루프 방지
      const callCount = validationRefreshTrigger;
      if (callCount > 50) {
        console.warn('⚠️ [BRIDGE_UI] 검증 호출 횟수 제한 (50회 초과)');
        return {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          validationErrors: ['검증 호출 횟수 제한됨'],
          validationWarnings: [],
          isReadyForTransfer: false,
        };
      }

      // 브릿지 추출기를 안전하게 사용
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

      console.log('🔍 [BRIDGE_UI_DEBUG] 브릿지 스냅샷:', currentSnapshot);

      if (!currentSnapshot) {
        console.warn('⚠️ [BRIDGE_UI] 브릿지 스냅샷을 가져올 수 없음');
        return {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          validationErrors: ['브릿지 데이터를 가져올 수 없습니다'],
          validationWarnings: [],
          isReadyForTransfer: false,
        };
      }

      const {
        editorContainers: currentContainers = [],
        editorParagraphs: currentParagraphs = [],
        editorCompletedContent: currentContent = '',
      } = currentSnapshot;

      console.log('🔍 [BRIDGE_UI_DEBUG] 추출된 실제 데이터:', {
        containerCount: currentContainers.length,
        paragraphCount: currentParagraphs.length,
        contentLength: currentContent.length,
        containers: currentContainers,
        paragraphs: currentParagraphs,
      });

      // 전송 가능성 체크를 try-catch로 보호
      let isCurrentlyTransferable = false;
      try {
        isCurrentlyTransferable = bridgeHook.checkCanTransfer();
      } catch (transferCheckError) {
        console.error(
          '❌ [BRIDGE_UI] 전송 가능성 체크 실패:',
          transferCheckError
        );
        isCurrentlyTransferable = false;
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

      const calculationEndTime = performance.now();
      const calculationDuration = calculationEndTime - calculationStartTime;

      console.log('✅ [BRIDGE_UI] 검증 상태 계산 완료 (안정화된 버전):', {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        unassignedParagraphCount,
        totalContentLength,
        errorCount: validationErrors.length,
        warningCount: validationWarnings.length,
        isReadyForTransfer,
        calculationDuration: `${calculationDuration.toFixed(2)}ms`,
        callCount,
      });

      return calculatedValidationData;
    } catch (validationCalculationError) {
      console.error(
        '❌ [BRIDGE_UI] 검증 상태 계산 중 오류:',
        validationCalculationError
      );

      return {
        containerCount: 0,
        paragraphCount: 0,
        assignedParagraphCount: 0,
        unassignedParagraphCount: 0,
        totalContentLength: 0,
        validationErrors: ['검증 상태 계산 중 오류가 발생했습니다'],
        validationWarnings: [],
        isReadyForTransfer: false,
      };
    }
  }, [
    validationRefreshTrigger,
    getEditorExtractor,
    bridgeHook.checkCanTransfer,
  ]);

  // 6. 모든 useEffect 훅들
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔄 [BRIDGE_UI] UI 브릿지 훅 완전 초기화 시작');

      setValidationRefreshTrigger(0);
      lastValidationTimeRef.current = 0;

      try {
        if (bridgeHook.resetBridgeState) {
          bridgeHook.resetBridgeState();
          console.log('🔄 [BRIDGE_UI] 기본 브릿지 상태도 초기화 완료');
        }
      } catch (error) {
        console.error('❌ [BRIDGE_UI] 기본 브릿지 초기화 중 오류:', error);
      }

      isInitializedRef.current = true;
      console.log('✅ [BRIDGE_UI] UI 브릿지 훅 완전 초기화 완료');
    }
  }, [bridgeHook.resetBridgeState]);
  //====여기까지 수정됨====

  // 7. 최종 반환 객체 (훅 호출 후)
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

  console.log('✅ [BRIDGE_UI] 브릿지 UI 훅 초기화 완료:', {
    canTransfer: bridgeUIReturn.canTransfer,
    isTransferring: bridgeUIReturn.isTransferring,
    errorCount: bridgeUIReturn.transferErrors.length,
    warningCount: bridgeUIReturn.transferWarnings.length,
  });

  return bridgeUIReturn;
};
