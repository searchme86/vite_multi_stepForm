// bridges/editorMultiStepBridge/hooks/useBridgeUIComponents.ts

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useBidirectionalBridge } from './useBidirectionalBridge';
import {
  BridgeSystemConfiguration,
  BridgeOperationExecutionResult,
  BridgeOperationErrorDetails,
  MultiStepToEditorDataTransformationResult,
  BidirectionalSyncResult,
} from '../editorMultiStepBridge/bridgeDataTypes.ts';
import { createEditorStateExtractor } from '../editorMultiStepBridge/editorDataExtractor';
import { createBridgeDataValidationHandler } from '../editorMultiStepBridge/bridgeDataValidator';

// 🔧 ParagraphBlock 타입 - commonTypes import 대신 로컬 정의
interface ParagraphBlock {
  readonly id: string;
  readonly content: string;
  readonly containerId: string | null;
  readonly order: number;
}

// 🔧 검증 상태 인터페이스 - UI에서 사용할 상태 정보
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

// 🔧 Bridge UI 상태 인터페이스 - 양방향 기능 포함
interface BridgeUIState {
  readonly canTransfer: boolean;
  readonly isTransferring: boolean;
  readonly lastTransferResult: BridgeOperationExecutionResult | null;
  readonly transferErrors: BridgeOperationErrorDetails[];
  readonly transferWarnings: string[];
  readonly transferAttemptCount: number;
  readonly isReverseTransferring: boolean;
  readonly lastReverseTransferResult: MultiStepToEditorDataTransformationResult | null;
  readonly isBidirectionalSyncing: boolean;
  readonly lastBidirectionalSyncResult: BidirectionalSyncResult | null;
}

// 🔧 Bridge UI 액션 인터페이스 - 양방향 기능 포함
interface BridgeUIActions {
  executeManualTransfer: () => Promise<void>;
  checkCanTransfer: () => boolean;
  resetBridgeState: () => void;
  refreshValidationStatus: () => void;
  executeReverseTransfer: () => Promise<void>;
  executeBidirectionalSync: () => Promise<void>;
  checkCanReverseTransfer: () => boolean;
}

// 🔧 Bridge UI Hook 반환 인터페이스 - 완전한 UI 지원
interface BridgeUIHookReturn extends BridgeUIState, BridgeUIActions {
  readonly bridgeConfiguration: BridgeSystemConfiguration;
  readonly validationStatus: ValidationStatus;
}

export const useBridgeUIComponents = (
  customConfig?: Partial<BridgeSystemConfiguration>
): BridgeUIHookReturn => {
  console.log('🎨 [BRIDGE_UI_COMPONENTS] UI Hook 초기화 시작');

  const isInitialized = useRef(false);
  const lastValidationTime = useRef<number>(0);
  const validationCache = useRef<ValidationStatus | null>(null);
  const validator = useRef(createBridgeDataValidationHandler());

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const bridgeHook = useBidirectionalBridge(customConfig);

  // 🔧 Extractor 생성 함수
  const getExtractor = useCallback(() => createEditorStateExtractor(), []);

  // 🔧 Editor → MultiStep 수동 전송 (기존 기능)
  const executeManualTransfer = useCallback(async (): Promise<void> => {
    if (bridgeHook.isTransferInProgress) {
      console.log('🔄 [BRIDGE_UI_COMPONENTS] 전송 진행 중, 요청 무시');
      return;
    }

    console.log('🚀 [BRIDGE_UI_COMPONENTS] Editor → MultiStep 전송 시작');
    try {
      await bridgeHook.executeManualTransfer();
      setRefreshTrigger((previousValue) => (previousValue + 1) % 100);
      console.log('✅ [BRIDGE_UI_COMPONENTS] Editor → MultiStep 전송 완료');
    } catch (error) {
      console.error(
        '❌ [BRIDGE_UI_COMPONENTS] Editor → MultiStep 전송 실패:',
        error
      );
    }
  }, [bridgeHook.isTransferInProgress, bridgeHook.executeManualTransfer]);

  // 🆕 MultiStep → Editor 역방향 전송 (새로운 기능)
  const executeReverseTransfer = useCallback(async (): Promise<void> => {
    if (bridgeHook.isReverseTransferInProgress) {
      console.log('🔄 [BRIDGE_UI_COMPONENTS] 역방향 전송 진행 중, 요청 무시');
      return;
    }

    console.log('🚀 [BRIDGE_UI_COMPONENTS] MultiStep → Editor 전송 시작');
    try {
      await bridgeHook.executeReverseTransfer();
      setRefreshTrigger((previousValue) => (previousValue + 1) % 100);
      console.log('✅ [BRIDGE_UI_COMPONENTS] MultiStep → Editor 전송 완료');
    } catch (error) {
      console.error(
        '❌ [BRIDGE_UI_COMPONENTS] MultiStep → Editor 전송 실패:',
        error
      );
    }
  }, [
    bridgeHook.isReverseTransferInProgress,
    bridgeHook.executeReverseTransfer,
  ]);

  // 🆕 양방향 동기화 (새로운 기능)
  const executeBidirectionalSync = useCallback(async (): Promise<void> => {
    if (bridgeHook.isBidirectionalSyncInProgress) {
      console.log('🔄 [BRIDGE_UI_COMPONENTS] 양방향 동기화 진행 중, 요청 무시');
      return;
    }

    console.log('🚀 [BRIDGE_UI_COMPONENTS] 양방향 동기화 시작');
    try {
      await bridgeHook.executeBidirectionalSync();
      setRefreshTrigger((previousValue) => (previousValue + 1) % 100);
      console.log('✅ [BRIDGE_UI_COMPONENTS] 양방향 동기화 완료');
    } catch (error) {
      console.error('❌ [BRIDGE_UI_COMPONENTS] 양방향 동기화 실패:', error);
    }
  }, [
    bridgeHook.isBidirectionalSyncInProgress,
    bridgeHook.executeBidirectionalSync,
  ]);

  // 🔧 Bridge 상태 초기화
  const resetBridgeState = useCallback((): void => {
    console.log('🔄 [BRIDGE_UI_COMPONENTS] 상태 초기화');
    try {
      bridgeHook.resetBridgeState();
      setRefreshTrigger(0);
      lastValidationTime.current = 0;
      isInitialized.current = false;
      validationCache.current = null;
      validator.current = createBridgeDataValidationHandler();
    } catch (error) {
      console.error('❌ [BRIDGE_UI_COMPONENTS] 초기화 실패:', error);
    }
  }, [bridgeHook.resetBridgeState]);

  // 🔧 검증 상태 새로고침
  const refreshValidationStatus = useCallback((): void => {
    const currentTime = Date.now();
    const timeSinceLastValidation = currentTime - lastValidationTime.current;

    if (timeSinceLastValidation < 300) {
      return;
    }

    console.log('🔄 [BRIDGE_UI_COMPONENTS] 검증 새로고침');
    lastValidationTime.current = currentTime;
    setRefreshTrigger((previousValue) => (previousValue + 1) % 100);
  }, []);

  // 🔧 검증 상태 계산 (메모이제이션)
  const validationStatus = useMemo<ValidationStatus>(() => {
    console.log('🔍 [BRIDGE_UI_COMPONENTS] 검증 상태 계산');

    try {
      let snapshot = null;
      try {
        const extractor = getExtractor();
        snapshot = extractor.getEditorStateWithValidation();
      } catch (error) {
        console.error('❌ [BRIDGE_UI_COMPONENTS] 상태 추출 실패:', error);
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

      const containerCount = editorContainers.length;
      const paragraphCount = editorParagraphs.length;

      // 🔧 ParagraphBlock 타입 캐스팅으로 해결
      const typedParagraphs = editorParagraphs as unknown as ParagraphBlock[];

      const assignedParagraphs = typedParagraphs.filter(
        (paragraph: ParagraphBlock) => paragraph.containerId !== null
      );
      const assignedParagraphCount = assignedParagraphs.length;
      const unassignedParagraphCount = paragraphCount - assignedParagraphCount;

      const totalContentLength = typedParagraphs.reduce(
        (totalLength: number, paragraph: ParagraphBlock) =>
          totalLength + (paragraph?.content?.length || 0),
        0
      );

      // 🔧 Bridge 검증 수행
      const bridgeValidation = validator.current.validateForTransfer(snapshot);
      const { validationErrors, validationWarnings, isValidForTransfer } =
        bridgeValidation;

      let canTransfer = false;
      try {
        canTransfer = bridgeHook.checkCanTransfer();
      } catch (error) {
        console.warn('⚠️ [BRIDGE_UI_COMPONENTS] 전송 체크 실패:', error);
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

      console.log('✅ [BRIDGE_UI_COMPONENTS] 검증 완료:', {
        isReadyForTransfer,
        errors: validationErrors.length,
        warnings: validationWarnings.length,
        containerCount,
        paragraphCount,
      });

      validationCache.current = result;
      return result;
    } catch (error) {
      console.error('❌ [BRIDGE_UI_COMPONENTS] 검증 계산 실패:', error);

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

  // 🔧 초기화 Effect
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🔧 [BRIDGE_UI_COMPONENTS] 초기화');
      setRefreshTrigger(0);
      lastValidationTime.current = 0;
      validationCache.current = null;
      validator.current = createBridgeDataValidationHandler();

      try {
        bridgeHook.resetBridgeState?.();
      } catch (error) {
        console.error('❌ [BRIDGE_UI_COMPONENTS] 초기화 중 오류:', error);
      }

      isInitialized.current = true;
      console.log('✅ [BRIDGE_UI_COMPONENTS] 초기화 완료');
    }
  }, [bridgeHook.resetBridgeState]);

  // 🔧 Hook 반환값 - 완전한 양방향 지원
  return {
    // 기존 상태들
    canTransfer: validationStatus.isReadyForTransfer,
    isTransferring: bridgeHook.isTransferInProgress,
    lastTransferResult: bridgeHook.lastTransferResult,
    transferErrors: bridgeHook.transferErrors,
    transferWarnings: bridgeHook.transferWarnings,
    transferAttemptCount: bridgeHook.transferCount,

    // 새로운 양방향 상태들
    isReverseTransferring: bridgeHook.isReverseTransferInProgress,
    lastReverseTransferResult: bridgeHook.lastReverseTransferResult,
    isBidirectionalSyncing: bridgeHook.isBidirectionalSyncInProgress,
    lastBidirectionalSyncResult: bridgeHook.lastBidirectionalSyncResult,

    // 설정 및 검증 상태
    bridgeConfiguration: bridgeHook.bridgeConfiguration,
    validationStatus,

    // 기존 액션들
    executeManualTransfer,
    checkCanTransfer: () => validationStatus.isReadyForTransfer,
    resetBridgeState,
    refreshValidationStatus,

    // 새로운 양방향 액션들
    executeReverseTransfer,
    executeBidirectionalSync,
    checkCanReverseTransfer: bridgeHook.checkCanReverseTransfer,
  };
};
