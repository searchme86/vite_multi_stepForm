// bridges/hooks/useBridgeUI.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useEditorMultiStepBridge } from '../editorMultiStepBridge/useEditorMultiStepBridge';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
} from '../editorMultiStepBridge/bridgeTypes';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorStateExtractor';
import { createBridgeDataValidationHandler } from '../editorMultiStepBridge/bridgeValidator';
import { VALIDATION_CRITERIA } from '../editorMultiStepBridge/bridgeConfig';
import { ParagraphBlock } from '../../store/shared/commonTypes';

// 검증 상태 인터페이스 - 컴포넌트와 일치하도록 수정
interface ValidationStatus {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly totalContentLength: number;
  readonly validationErrors: string[];
  readonly validationWarnings: string[];
  readonly isReadyForTransfer: boolean;
}

// 브릿지 UI 상태 인터페이스
interface BridgeUIState {
  readonly canTransfer: boolean;
  readonly isTransferring: boolean;
  readonly lastTransferResult: BridgeOperationExecutionResult | null;
  readonly transferErrors: BridgeOperationErrorDetails[];
  readonly transferWarnings: string[];
  readonly transferAttemptCount: number;
}

// 브릿지 UI 액션 인터페이스 - 컴포넌트가 기대하는 메소드명으로 수정
interface BridgeUIActions {
  executeManualTransfer: () => Promise<void>; // executeTransfer → executeManualTransfer
  checkCanTransfer: () => boolean;
  resetBridgeState: () => void; // resetState → resetBridgeState
  refreshValidationStatus: () => void; // refreshValidation → refreshValidationStatus
}

// 최종 반환 인터페이스 - 컴포넌트가 기대하는 속성명으로 수정
interface BridgeUIHookReturn extends BridgeUIState, BridgeUIActions {
  readonly bridgeConfiguration: BridgeSystemConfiguration; // config → bridgeConfiguration
  readonly validationStatus: ValidationStatus; // validation → validationStatus
}

export const useBridgeUI = (
  customConfig?: Partial<BridgeSystemConfiguration>
): BridgeUIHookReturn => {
  const isInitialized = useRef(false);
  const lastValidationTime = useRef<number>(0);
  const validationCache = useRef<ValidationStatus | null>(null);
  const validator = useRef(createBridgeDataValidationHandler());

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const bridgeHook = useEditorMultiStepBridge(customConfig);

  const getExtractor = useCallback(() => createEditorStateExtractor(), []);

  // 🔧 컴포넌트가 기대하는 메소드명으로 변경
  const executeManualTransfer = useCallback(async (): Promise<void> => {
    if (bridgeHook.isTransferInProgress) {
      console.log('🔄 [BRIDGE_UI] 전송 진행 중, 요청 무시');
      return;
    }

    console.log('🚀 [BRIDGE_UI] 전송 시작');
    try {
      await bridgeHook.executeManualTransfer();
      setRefreshTrigger((previousValue) => (previousValue + 1) % 100);
      console.log('✅ [BRIDGE_UI] 전송 완료');
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 전송 실패:', error);
    }
  }, [bridgeHook.isTransferInProgress, bridgeHook.executeManualTransfer]);

  // 🔧 컴포넌트가 기대하는 메소드명으로 변경
  const resetBridgeState = useCallback((): void => {
    console.log('🔄 [BRIDGE_UI] 상태 초기화');
    try {
      bridgeHook.resetBridgeState();
      setRefreshTrigger(0);
      lastValidationTime.current = 0;
      isInitialized.current = false;
      validationCache.current = null;
      validator.current = createBridgeDataValidationHandler();
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 초기화 실패:', error);
    }
  }, [bridgeHook.resetBridgeState]);

  // 🔧 컴포넌트가 기대하는 메소드명으로 변경
  const refreshValidationStatus = useCallback((): void => {
    const currentTime = Date.now();
    const timeSinceLastValidation = currentTime - lastValidationTime.current;

    if (timeSinceLastValidation < VALIDATION_CRITERIA.throttleDelay) {
      return;
    }

    console.log('🔄 [BRIDGE_UI] 검증 새로고침');
    lastValidationTime.current = currentTime;
    setRefreshTrigger((previousValue) => (previousValue + 1) % 100);
  }, []);

  // 🔧 컴포넌트가 기대하는 인터페이스로 검증 상태 계산
  const validationStatus = useMemo<ValidationStatus>(() => {
    console.log('🔍 [BRIDGE_UI] 검증 상태 계산');

    try {
      // 에디터 상태 추출
      let snapshot = null;
      try {
        const extractor = getExtractor();
        snapshot = extractor.getEditorStateWithValidation();
      } catch (error) {
        console.error('❌ [BRIDGE_UI] 상태 추출 실패:', error);
        return {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          validationErrors: ['상태 추출 실패'],
          validationWarnings: [],
          isReadyForTransfer: false,
        };
      }

      if (!snapshot) {
        const fallback = {
          containerCount: 0,
          paragraphCount: 0,
          assignedParagraphCount: 0,
          unassignedParagraphCount: 0,
          totalContentLength: 0,
          validationErrors: ['데이터 없음'],
          validationWarnings: [],
          isReadyForTransfer: false,
        };
        validationCache.current = fallback;
        return fallback;
      }

      const { editorContainers = [], editorParagraphs = [] } = snapshot;

      // 기본 메트릭 계산
      const containerCount = editorContainers.length;
      const paragraphCount = editorParagraphs.length;

      // 할당된 문단 필터링 - 타입 명시적 지정
      const assignedParagraphs = editorParagraphs.filter(
        (paragraph: ParagraphBlock) => paragraph.containerId !== null
      );
      const assignedParagraphCount = assignedParagraphs.length;
      const unassignedParagraphCount = paragraphCount - assignedParagraphCount;

      // 콘텐츠 길이 계산 - 타입 명시적 지정
      const totalContentLength = editorParagraphs.reduce(
        (totalLength: number, paragraph: ParagraphBlock) =>
          totalLength + (paragraph?.content?.length || 0),
        0
      );

      // 브릿지 검증기 사용 (중복 로직 제거)
      const bridgeValidation = validator.current.validateForTransfer(snapshot);
      const { validationErrors, validationWarnings, isValidForTransfer } =
        bridgeValidation;

      // 브릿지 전송 가능 여부 체크
      let canTransfer = false;
      try {
        canTransfer = bridgeHook.checkCanTransfer();
      } catch (error) {
        console.warn('⚠️ [BRIDGE_UI] 전송 체크 실패:', error);
      }

      const isReadyForTransfer = isValidForTransfer && canTransfer;

      const result: ValidationStatus = {
        containerCount,
        paragraphCount,
        assignedParagraphCount,
        unassignedParagraphCount,
        totalContentLength,
        validationErrors,
        validationWarnings,
        isReadyForTransfer,
      };

      console.log('✅ [BRIDGE_UI] 검증 완료:', {
        isReadyForTransfer,
        errors: validationErrors.length,
        warnings: validationWarnings.length,
      });

      validationCache.current = result;
      return result;
    } catch (error) {
      console.error('❌ [BRIDGE_UI] 검증 계산 실패:', error);

      const errorResult = {
        containerCount: 0,
        paragraphCount: 0,
        assignedParagraphCount: 0,
        unassignedParagraphCount: 0,
        totalContentLength: 0,
        validationErrors: ['검증 계산 실패'],
        validationWarnings: [],
        isReadyForTransfer: false,
      };
      validationCache.current = errorResult;
      return errorResult;
    }
  }, [refreshTrigger, getExtractor, bridgeHook.checkCanTransfer]);

  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🔧 [BRIDGE_UI] 초기화');
      setRefreshTrigger(0);
      lastValidationTime.current = 0;
      validationCache.current = null;
      validator.current = createBridgeDataValidationHandler();

      try {
        bridgeHook.resetBridgeState?.();
      } catch (error) {
        console.error('❌ [BRIDGE_UI] 초기화 중 오류:', error);
      }

      isInitialized.current = true;
      console.log('✅ [BRIDGE_UI] 초기화 완료');
    }
  }, [bridgeHook.resetBridgeState]);

  // 🔧 컴포넌트가 기대하는 속성명으로 반환
  return {
    // 상태
    canTransfer: validationStatus.isReadyForTransfer,
    isTransferring: bridgeHook.isTransferInProgress,
    lastTransferResult: bridgeHook.lastTransferResult,
    transferErrors: bridgeHook.transferErrors,
    transferWarnings: bridgeHook.transferWarnings,
    transferAttemptCount: bridgeHook.transferCount,
    bridgeConfiguration: bridgeHook.bridgeConfiguration, // config → bridgeConfiguration
    validationStatus, // validation → validationStatus

    // 액션 - 컴포넌트가 기대하는 메소드명으로 제공
    executeManualTransfer, // executeTransfer → executeManualTransfer
    checkCanTransfer: () => validationStatus.isReadyForTransfer,
    resetBridgeState, // resetState → resetBridgeState
    refreshValidationStatus, // refreshValidation → refreshValidationStatus
  };
};
