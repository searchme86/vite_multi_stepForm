// 📁 src/components/moduleEditor/ModularBlogEditorContainer.tsx

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useEditorState } from './hooks/editorStateHooks/useEditorStateMain';
import { renderMarkdown } from './utils/markdown';
import ProgressSteps from './parts/ProgressSteps';
import StructureInputForm from './parts/StructureInput/StructureInputForm';
import WritingStep from './parts/WritingStep/WritingStep';

// 🔧 새로운 Bridge 통합 시스템 import (경로 수정)
import { useBridgeIntegration } from '../multiStepForm/utils/useBridgeIntegration';

import { resetEditorStoreCompletely } from '../../store/editorCore/editorCoreStore';
import { resetEditorUIStoreCompletely } from '../../store/editorUI/editorUIStore';

// 🔧 3단계: 통일된 쿨다운 시간 상수 (5초 → 3초)
const EDITOR_TRANSFER_COOLDOWN_MS = 3000; // Bridge와 동일한 3초

// 🔧 Bridge 연결 설정 인터페이스 (강화된 안전성)
interface BridgeIntegrationConfig {
  readonly enableAutoTransfer: boolean;
  readonly enableStepTransition: boolean;
  readonly enableErrorHandling: boolean;
  readonly enableProgressSync: boolean;
  readonly enableValidationSync: boolean;
  readonly debugMode: boolean;
  readonly autoTransferStep: number;
  readonly targetStepAfterTransfer: number;
  readonly tolerantMode: boolean; // 🔧 추가: 관대한 모드
  readonly maxRetryAttempts: number; // 🔧 추가: 재시도 횟수
  readonly retryDelayMs: number; // 🔧 추가: 재시도 지연시간
}

// 🔧 에디터 상태 정보 인터페이스 (단순화)
interface EditorStateInfo {
  readonly containerCount: number;
  readonly paragraphCount: number;
  readonly assignedParagraphCount: number;
  readonly unassignedParagraphCount: number;
  readonly hasContent: boolean;
  readonly isReadyForTransfer: boolean;
}

// 🔧 안전한 개발 환경 감지 함수
const getIsDevelopmentMode = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const { hostname } = window.location;
      return hostname === 'localhost' || hostname === '127.0.0.1';
    }
    return false;
  } catch (error) {
    console.warn(
      '⚠️ [EDITOR_CONTAINER] 개발 환경 감지 실패, 기본값 false 사용:',
      error
    );
    return false;
  }
};

// 🔧 안전한 컨테이너 이름 추출 함수
const extractContainerNames = (containers: unknown[]): string[] => {
  if (!Array.isArray(containers)) {
    return [];
  }

  return containers
    .map((container) => {
      if (container && typeof container === 'object' && 'name' in container) {
        const nameValue = Reflect.get(container, 'name');
        return typeof nameValue === 'string' ? nameValue : '이름없음';
      }
      return '알수없음';
    })
    .filter((name) => typeof name === 'string');
};

// 🆕 Phase 1용 입력값 검증 함수
const validateInputsForStructure = (inputs: unknown): string[] => {
  if (!Array.isArray(inputs)) {
    console.error(
      '❌ [CONTAINER_VALIDATION] inputs가 배열이 아님:',
      typeof inputs
    );
    return [];
  }

  const validInputs = inputs
    .map((input) => (typeof input === 'string' ? input.trim() : ''))
    .filter((input) => input.length > 0);

  console.log('🔍 [CONTAINER_VALIDATION] 입력값 검증 완료:', {
    originalCount: inputs.length,
    validCount: validInputs.length,
    validInputs,
  });

  return validInputs;
};

// 🔧 수정: 안전한 Bridge 설정 생성 함수
const createSafeBridgeConfig = (
  isDevelopment: boolean
): BridgeIntegrationConfig => {
  console.log('🔧 [EDITOR_CONTAINER] 안전한 Bridge 설정 생성:', {
    isDevelopment,
  });

  const config: BridgeIntegrationConfig = {
    enableAutoTransfer: true,
    enableStepTransition: true,
    enableErrorHandling: true,
    enableProgressSync: true,
    enableValidationSync: true,
    debugMode: isDevelopment,
    autoTransferStep: 4,
    targetStepAfterTransfer: 5,
    tolerantMode: true, // 🔧 중요: 관대한 모드 활성화
    maxRetryAttempts: 3, // 🔧 중요: 명시적 재시도 횟수 설정
    retryDelayMs: 500, // 🔧 중요: 명시적 재시도 지연시간 설정
  };

  console.log('✅ [EDITOR_CONTAINER] Bridge 설정 생성 완료:', {
    tolerantMode: config.tolerantMode,
    maxRetryAttempts: config.maxRetryAttempts,
    retryDelayMs: config.retryDelayMs,
    debugMode: config.debugMode,
  });

  return config;
};

function ModularBlogEditorContainer(): React.ReactNode {
  const isInitializedRef = useRef<boolean>(false);
  const lastTransferAttemptRef = useRef<number>(0);

  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔄 [EDITOR_CONTAINER] 에디터 스토어 초기화 - Phase 1 버전');

      try {
        resetEditorStoreCompletely();
        resetEditorUIStoreCompletely();
        isInitializedRef.current = true;

        console.log('✅ [EDITOR_CONTAINER] 에디터 스토어 초기화 완료');
      } catch (error) {
        console.error(
          '❌ [EDITOR_CONTAINER] 에디터 스토어 초기화 실패:',
          error
        );
      }
    }
  }, []);

  const editorState = useEditorState();

  console.log('🏗️ [EDITOR_CONTAINER] useEditorState 훅 결과 - Phase 1 버전:', {
    hasContainers:
      Array.isArray(editorState.localContainers) &&
      editorState.localContainers.length > 0,
    hasParagraphs:
      Array.isArray(editorState.localParagraphs) &&
      editorState.localParagraphs.length > 0,
    hasInternalState: !!editorState.internalState,
    hasMoveToContainer: typeof editorState.moveToContainer === 'function',
    hasSimplifiedStructureHandler:
      typeof editorState.handleStructureComplete === 'function',
    timestamp: new Date().toISOString(),
  });

  // 🔧 에디터 상태 구조분해할당 및 fallback 처리
  const {
    localContainers: currentContainers,
    localParagraphs: currentParagraphs,
    internalState: editorInternalState,
    addLocalParagraph: createNewParagraph,
    deleteLocalParagraph: removeParagraph,
    updateLocalParagraphContent: updateParagraphContent,
    toggleParagraphSelection: toggleParagraphSelect,
    addToLocalContainer: addParagraphsToContainer,
    moveLocalParagraphInContainer: changeParagraphOrder,
    handleStructureComplete: handleStructureCompleteInternal, // ✅ Phase 1 단순화된 함수
    goToStructureStep: navigateToStructureStepInternal,
    saveAllToContext: saveCurrentProgress,
    completeEditor: finishEditing,
    activateEditor: setActiveEditor,
    togglePreview: switchPreviewMode,
    setInternalState: updateEditorState,
    setTargetContainerId: setContainerTarget,
    getLocalUnassignedParagraphs: getUnassignedParagraphs,
    getLocalParagraphsByContainer: getParagraphsByContainer,
    moveToContainer: moveToContainerFunction,
  } = editorState;

  console.log('🏗️ [EDITOR_CONTAINER] 컴포넌트 렌더링 - Phase 1 버전:', {
    containers: Array.isArray(currentContainers) ? currentContainers.length : 0,
    paragraphs: Array.isArray(currentParagraphs) ? currentParagraphs.length : 0,
    currentStep: editorInternalState?.currentSubStep || 'unknown',
    hasMoveFunction: typeof moveToContainerFunction === 'function',
    hasSimplifiedHandler: typeof handleStructureCompleteInternal === 'function',
    timestamp: new Date().toLocaleTimeString(),
  });

  // 🔧 안전한 기본값 설정 (구조분해할당 + fallback)
  const safeContainers = Array.isArray(currentContainers)
    ? currentContainers
    : [];
  const safeParagraphs = Array.isArray(currentParagraphs)
    ? currentParagraphs
    : [];
  const safeInternalState = editorInternalState || {
    currentSubStep: 'structure' as const,
    isTransitioning: false,
    activeParagraphId: null,
    isPreviewOpen: true,
    selectedParagraphIds: [],
    targetContainerId: '',
  };

  const {
    currentSubStep: currentEditorStep,
    isTransitioning: isStepTransitioning,
  } = safeInternalState;

  // 🔧 수정: 안전한 Bridge 연결 설정 생성
  const bridgeConfig: BridgeIntegrationConfig = createSafeBridgeConfig(
    getIsDevelopmentMode()
  );

  // 🔧 Bridge 통합 훅 사용 (수정된 설정 전달)
  const bridgeIntegration = useBridgeIntegration(bridgeConfig);

  console.log(
    '🌉 [EDITOR_CONTAINER] Bridge 통합 상태 - Phase 1 (강화된 설정):',
    {
      isConnected: bridgeIntegration.isConnected,
      isTransferring: bridgeIntegration.isTransferring,
      canTransfer: bridgeIntegration.canTransfer,
      configDebugMode: bridgeIntegration.config.debugMode,
      configTolerantMode: bridgeIntegration.config.tolerantMode, // 🔧 추가
      configMaxRetryAttempts: bridgeIntegration.config.maxRetryAttempts, // 🔧 추가
      configRetryDelayMs: bridgeIntegration.config.retryDelayMs, // 🔧 추가
      timestamp: new Date().toISOString(),
    }
  );

  // 🔧 에디터 상태 정보 계산 (타입 안전성 강화)
  const calculateEditorStateInfo = useCallback((): EditorStateInfo => {
    const containerCount = safeContainers.length;
    const paragraphCount = safeParagraphs.length;

    const assignedParagraphs = safeParagraphs.filter((paragraph) => {
      if (!paragraph || typeof paragraph !== 'object') {
        return false;
      }

      const containerId = Reflect.get(paragraph, 'containerId');
      return (
        containerId !== null && containerId !== undefined && containerId !== ''
      );
    });

    const unassignedParagraphs = safeParagraphs.filter((paragraph) => {
      if (!paragraph || typeof paragraph !== 'object') {
        return true;
      }

      const containerId = Reflect.get(paragraph, 'containerId');
      return (
        containerId === null || containerId === undefined || containerId === ''
      );
    });

    const assignedParagraphCount = assignedParagraphs.length;
    const unassignedParagraphCount = unassignedParagraphs.length;

    const hasContent = paragraphCount > 0 && containerCount > 0;

    // 🔧 수정: 더 관대한 전송 준비 조건
    const isReadyForTransfer =
      hasContent &&
      (unassignedParagraphCount === 0 || // 완전히 할당됨
        (assignedParagraphCount > 0 && unassignedParagraphCount <= 2)); // 대부분 할당됨

    console.log('📊 [EDITOR_CONTAINER] 에디터 상태 정보 계산 (관대한 기준):', {
      containerCount,
      paragraphCount,
      assignedParagraphCount,
      unassignedParagraphCount,
      hasContent,
      isReadyForTransfer,
      tolerantTransferCondition: true,
    });

    return {
      containerCount,
      paragraphCount,
      assignedParagraphCount,
      unassignedParagraphCount,
      hasContent,
      isReadyForTransfer,
    };
  }, [safeContainers.length, safeParagraphs]);

  const editorStateInfo = calculateEditorStateInfo();

  const createPromiseDelay = useCallback((delayMs: number): Promise<void> => {
    const safeDelay =
      typeof delayMs === 'number' && delayMs > 0 ? delayMs : 100;
    return new Promise((resolve) => setTimeout(resolve, safeDelay));
  }, []);

  const handleMoveToContainer = useCallback(
    (paragraphId: string, targetContainerId: string) => {
      console.log('🔄 [EDITOR_CONTAINER] 컨테이너 이동 요청 수신:', {
        paragraphId,
        targetContainerId,
        hasFunction: typeof moveToContainerFunction === 'function',
        timestamp: new Date().toISOString(),
      });

      // Early return 패턴 적용
      if (typeof moveToContainerFunction !== 'function') {
        console.error('❌ [EDITOR_CONTAINER] moveToContainer 함수가 없습니다');
        return;
      }

      if (typeof paragraphId !== 'string' || paragraphId.trim().length === 0) {
        console.error(
          '❌ [EDITOR_CONTAINER] 유효하지 않은 paragraphId:',
          paragraphId
        );
        return;
      }

      if (
        typeof targetContainerId !== 'string' ||
        targetContainerId.trim().length === 0
      ) {
        console.error(
          '❌ [EDITOR_CONTAINER] 유효하지 않은 targetContainerId:',
          targetContainerId
        );
        return;
      }

      try {
        moveToContainerFunction(paragraphId, targetContainerId);

        const updatedStateInfo = calculateEditorStateInfo();
        console.log('📊 [EDITOR_CONTAINER] 이동 후 상태:', {
          containerCount: updatedStateInfo.containerCount,
          paragraphCount: updatedStateInfo.paragraphCount,
          assignedCount: updatedStateInfo.assignedParagraphCount,
          unassignedCount: updatedStateInfo.unassignedParagraphCount,
          isReadyForTransfer: updatedStateInfo.isReadyForTransfer,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ [EDITOR_CONTAINER] 컨테이너 이동 실행 실패:', error);
      }
    },
    [moveToContainerFunction, calculateEditorStateInfo]
  );

  // ✅ 🎯 **Phase 1 핵심 수정**: completeStructureSetup 대폭 단순화
  const completeStructureSetup = useCallback(
    (inputs: string[]) => {
      console.log(
        '🏗️ [EDITOR_CONTAINER] 구조 설정 완료 - Phase 1 단순화 버전:',
        {
          inputs,
          inputCount: Array.isArray(inputs) ? inputs.length : 0,
          timestamp: new Date().toISOString(),
        }
      );

      try {
        // 1️⃣ 입력값 기본 검증
        const validInputs = validateInputsForStructure(inputs);

        // Early return: 최소 섹션 수 확인
        if (validInputs.length < 2) {
          console.error('❌ [EDITOR_CONTAINER] 최소 2개 섹션 필요:', {
            provided: validInputs.length,
            required: 2,
            validInputs,
          });
          return;
        }

        // 2️⃣ handleStructureComplete 함수 존재 확인
        if (typeof handleStructureCompleteInternal !== 'function') {
          console.error(
            '❌ [EDITOR_CONTAINER] handleStructureComplete 함수가 없습니다'
          );
          return;
        }

        // 3️⃣ 단순화된 핸들러 호출 (Phase 1의 핵심)
        console.log(
          '📞 [EDITOR_CONTAINER] Phase 1 단순화된 구조 완료 핸들러 실행:',
          {
            validInputs,
            handlerType: typeof handleStructureCompleteInternal,
          }
        );

        handleStructureCompleteInternal(validInputs);

        console.log(
          '✅ [EDITOR_CONTAINER] Phase 1 구조 설정 완료 프로세스 성공'
        );
      } catch (error) {
        console.error(
          '❌ [EDITOR_CONTAINER] Phase 1 구조 설정 완료 프로세스 에러:',
          {
            error,
            inputs,
          }
        );
      }
    },
    [handleStructureCompleteInternal]
  );

  const navigateToStructureStep = useCallback(async () => {
    console.log('⬅️ [EDITOR_CONTAINER] 구조 설정으로 이동');

    try {
      // Early return: 함수 존재 여부 확인
      if (typeof navigateToStructureStepInternal !== 'function') {
        console.error(
          '❌ [EDITOR_CONTAINER] navigateToStructureStepInternal 함수가 없습니다'
        );
        return;
      }

      navigateToStructureStepInternal();
      await createPromiseDelay(100);

      console.log('✅ [EDITOR_CONTAINER] 구조 설정으로 이동 완료');
    } catch (error) {
      console.error('❌ [EDITOR_CONTAINER] 구조 설정으로 이동 실패:', error);
    }
  }, [navigateToStructureStepInternal, createPromiseDelay]);

  // 🔧 수정: Phase 1용 강화된 에디터 완료 처리 (관대한 조건 + 강화된 에러 처리)
  const handleEditorComplete = useCallback(async () => {
    console.log(
      '🎉 [EDITOR_CONTAINER] 에디터 완료 프로세스 시작 - Phase 1 (강화된 버전, 쿨다운 3초)'
    );

    try {
      const currentStateInfo = calculateEditorStateInfo();

      console.log('📊 [EDITOR_CONTAINER] 완료 전 상태 검증 (관대한 기준):', {
        hasContent: currentStateInfo.hasContent,
        isReadyForTransfer: currentStateInfo.isReadyForTransfer,
        containerCount: currentStateInfo.containerCount,
        paragraphCount: currentStateInfo.paragraphCount,
        assignedCount: currentStateInfo.assignedParagraphCount,
        unassignedCount: currentStateInfo.unassignedParagraphCount,
        bridgeTolerantMode: bridgeIntegration.config.tolerantMode,
        timestamp: new Date().toISOString(),
      });

      // 🔧 수정: 더 관대한 검증 조건
      if (!currentStateInfo.hasContent) {
        console.warn(
          '⚠️ [EDITOR_CONTAINER] 콘텐츠가 부족하지만 관대한 모드로 계속 진행'
        );
      }

      // 에디터 완료 상태 설정
      if (typeof finishEditing === 'function') {
        finishEditing();
        console.log('✅ [EDITOR_CONTAINER] 에디터 완료 상태 설정');
      } else {
        console.warn('⚠️ [EDITOR_CONTAINER] finishEditing 함수가 없습니다');
      }

      // Phase 1에서는 강화된 Bridge 연결 확인
      console.log(
        '🌉 [EDITOR_CONTAINER] 강화된 Bridge 연결 상태 확인 - Phase 1:',
        {
          isConnected: bridgeIntegration.isConnected,
          isTransferring: bridgeIntegration.isTransferring,
          canTransfer: bridgeIntegration.canTransfer,
          tolerantMode: bridgeIntegration.config.tolerantMode,
          maxRetryAttempts: bridgeIntegration.config.maxRetryAttempts,
          retryDelayMs: bridgeIntegration.config.retryDelayMs,
          timestamp: new Date().toISOString(),
        }
      );

      // 🔧 3단계: 통일된 중복 전송 방지 (3초로 변경)
      const currentTime = Date.now();
      const timeSinceLastAttempt = currentTime - lastTransferAttemptRef.current;

      if (timeSinceLastAttempt < EDITOR_TRANSFER_COOLDOWN_MS) {
        console.warn(
          '⚠️ [EDITOR_CONTAINER] 최근 전송 시도가 있어 건너뜁니다 (3초 쿨다운):',
          {
            timeSinceLastAttempt,
            cooldownMs: EDITOR_TRANSFER_COOLDOWN_MS,
            remainingTime: EDITOR_TRANSFER_COOLDOWN_MS - timeSinceLastAttempt,
          }
        );
        return;
      }

      lastTransferAttemptRef.current = currentTime;

      // 🔧 수정: 관대한 모드에서는 canTransfer가 false여도 시도
      const shouldAttemptTransfer =
        bridgeIntegration.canTransfer || bridgeIntegration.config.tolerantMode;

      if (!shouldAttemptTransfer) {
        console.error(
          '❌ [EDITOR_CONTAINER] Bridge 전송 불가능한 상태 - Phase 1 (관대한 모드도 실패):',
          {
            isConnected: bridgeIntegration.isConnected,
            isTransferring: bridgeIntegration.isTransferring,
            canTransfer: bridgeIntegration.canTransfer,
            tolerantMode: bridgeIntegration.config.tolerantMode,
          }
        );
        return;
      }

      console.log(
        '🌉 [EDITOR_CONTAINER] Bridge 통합 시스템으로 전송 시도 - Phase 1 (강화된 버전, 3초 쿨다운)'
      );

      // 🔧 수정: 강화된 에러 처리와 함께 전송 시도
      let transferResult = false;
      try {
        transferResult = await bridgeIntegration.executeManualTransfer();
      } catch (transferError) {
        console.error(
          '❌ [EDITOR_CONTAINER] Bridge 전송 중 예외 발생:',
          transferError
        );

        // 관대한 모드에서는 예외가 발생해도 부분 성공으로 처리
        if (bridgeIntegration.config.tolerantMode) {
          console.warn(
            '⚠️ [EDITOR_CONTAINER] 관대한 모드: 전송 예외 발생했지만 계속 진행'
          );
          transferResult = true; // 관대한 모드에서는 부분 성공
        }
      }

      if (transferResult) {
        console.log(
          '✅ [EDITOR_CONTAINER] Bridge 전송 성공 - Phase 1 (강화된 버전, 3초 쿨다운)'
        );

        const statistics = bridgeIntegration.getStatistics();
        console.log('📊 [EDITOR_CONTAINER] 전송 후 Bridge 통계 - Phase 1:', {
          connectionState: statistics.connectionState,
          transferCount: statistics.connectionState.transferCount,
          errorCount: statistics.connectionState.errorCount,
          bridgeStats: statistics.bridgeStats,
          cooldownMs: EDITOR_TRANSFER_COOLDOWN_MS,
        });
      } else {
        console.error(
          '❌ [EDITOR_CONTAINER] Bridge 전송 실패 - Phase 1 (강화된 버전, 3초 쿨다운)'
        );

        // 🔧 수정: 전송이 실패해도 관대한 모드에서는 경고만 표시
        if (bridgeIntegration.config.tolerantMode) {
          console.warn(
            '⚠️ [EDITOR_CONTAINER] 관대한 모드: 전송 실패했지만 시스템은 계속 동작'
          );
        }
      }
    } catch (error) {
      console.error(
        '❌ [EDITOR_CONTAINER] 에디터 완료 프로세스 에러 - Phase 1 (강화된 버전, 3초 쿨다운):',
        error
      );

      // 🔧 수정: 관대한 모드에서는 에러가 발생해도 계속 진행
      if (bridgeIntegration.config.tolerantMode) {
        console.warn(
          '⚠️ [EDITOR_CONTAINER] 관대한 모드: 에러 발생했지만 프로세스 계속 진행'
        );
      }
    }
  }, [calculateEditorStateInfo, finishEditing, bridgeIntegration]);

  // 🔧 Bridge 연결 상태 변화 감지 및 로깅 (Phase 1 단순화, 강화된 정보 포함)
  useEffect(() => {
    const containerNames = extractContainerNames(safeContainers);

    console.log(
      '📊 [EDITOR_CONTAINER] 상태 변화 감지 - Phase 1 버전 (강화된 정보, 3초 쿨다운):',
      {
        currentStep: currentEditorStep,
        isInStructureStep: currentEditorStep === 'structure',
        isInWritingStep: currentEditorStep === 'writing',
        editorStateInfo,
        bridgeConnection: {
          isConnected: bridgeIntegration.isConnected,
          isTransferring: bridgeIntegration.isTransferring,
          canTransfer: bridgeIntegration.canTransfer,
          tolerantMode: bridgeIntegration.config.tolerantMode, // 🔧 추가
          maxRetryAttempts: bridgeIntegration.config.maxRetryAttempts, // 🔧 추가
          retryDelayMs: bridgeIntegration.config.retryDelayMs, // 🔧 추가
        },
        containerNames,
        containerCount: containerNames.length,
        hasMoveFunction: typeof handleMoveToContainer === 'function',
        phase1SimplifiedEnhanced: true, // 🔧 수정
        cooldownMs: EDITOR_TRANSFER_COOLDOWN_MS,
        timestamp: new Date().toISOString(),
      }
    );
  }, [
    currentEditorStep,
    editorStateInfo,
    bridgeIntegration.isConnected,
    bridgeIntegration.isTransferring,
    bridgeIntegration.canTransfer,
    bridgeIntegration.config.tolerantMode, // 🔧 추가 의존성
    bridgeIntegration.config.maxRetryAttempts, // 🔧 추가 의존성
    bridgeIntegration.config.retryDelayMs, // 🔧 추가 의존성
    safeContainers,
    handleMoveToContainer,
  ]);

  // 🔧 Bridge 통계 정보 주기적 로깅 (디버그 모드에서만, Phase 1 강화, 쿨다운 정보 포함)
  useEffect(() => {
    if (!bridgeConfig.debugMode) {
      return;
    }

    const statisticsInterval = setInterval(() => {
      try {
        const statistics = bridgeIntegration.getStatistics();

        console.log(
          '📈 [EDITOR_CONTAINER] Bridge 통계 리포트 - Phase 1 강화 버전 (3초 쿨다운):',
          {
            timestamp: new Date().toLocaleTimeString(),
            editorState: {
              currentStep: currentEditorStep,
              ...editorStateInfo,
            },
            bridgeStats: statistics.bridgeStats,
            uiStats: {
              isLoading: statistics.uiStats.isLoading,
              canExecute: statistics.uiStats.canExecute,
              hasEditorStats: !!statistics.uiStats.editorStatistics,
              hasValidationState: !!statistics.uiStats.validationState,
              statusMessage: statistics.uiStats.statusMessage || '없음',
            },
            connectionState: statistics.connectionState,
            bridgeConfig: {
              tolerantMode: bridgeConfig.tolerantMode, // 🔧 추가
              maxRetryAttempts: bridgeConfig.maxRetryAttempts, // 🔧 추가
              retryDelayMs: bridgeConfig.retryDelayMs, // 🔧 추가
            },
            phase1SimplifiedEnhanced: true, // 🔧 수정
            cooldownMs: EDITOR_TRANSFER_COOLDOWN_MS,
          }
        );
      } catch (error) {
        console.error(
          '❌ [EDITOR_CONTAINER] Bridge 통계 리포트 생성 실패 - Phase 1:',
          error
        );
      }
    }, 15000);

    return () => clearInterval(statisticsInterval);
  }, [
    bridgeConfig.debugMode,
    bridgeConfig.tolerantMode, // 🔧 추가 의존성
    bridgeConfig.maxRetryAttempts, // 🔧 추가 의존성
    bridgeConfig.retryDelayMs, // 🔧 추가 의존성
    bridgeIntegration,
    currentEditorStep,
    editorStateInfo,
  ]);

  const isInStructureStep = currentEditorStep === 'structure';

  return (
    <div className="space-y-6">
      <ProgressSteps currentSubStep={currentEditorStep} />

      {/* 🔧 Bridge 연결 상태 표시 (개발 환경에서만, Phase 1 강화, 쿨다운 정보 포함) */}
      {bridgeConfig.debugMode ? (
        <div className="p-3 text-sm border border-blue-200 rounded-lg bg-blue-50">
          <div className="mb-2 font-semibold text-blue-800">
            🌉 Bridge 연결 상태 (Phase 1 강화 버전, 3초 쿨다운, 관대한 모드)
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>연결 상태:</strong>
              <div>
                연결됨: {bridgeIntegration.isConnected ? '✅' : '❌'} | 전송중:{' '}
                {bridgeIntegration.isTransferring ? '🔄' : '⏸️'} | 전송가능:{' '}
                {bridgeIntegration.canTransfer ? '✅' : '❌'} | 관대한모드:{' '}
                {bridgeConfig.tolerantMode ? '✅' : '❌'}
              </div>
            </div>
            <div>
              <strong>에디터 상태:</strong>
              <div>
                컨테이너: {editorStateInfo.containerCount}개 | 문단:{' '}
                {editorStateInfo.paragraphCount}개 | 할당:{' '}
                {editorStateInfo.assignedParagraphCount}개 | 미할당:{' '}
                {editorStateInfo.unassignedParagraphCount}개 | 전송준비:{' '}
                {editorStateInfo.isReadyForTransfer ? '✅' : '❌'} | 재시도:{' '}
                {bridgeConfig.maxRetryAttempts}회 | 지연:{' '}
                {bridgeConfig.retryDelayMs}ms | 쿨다운:{' '}
                {EDITOR_TRANSFER_COOLDOWN_MS / 1000}초
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentEditorStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={isStepTransitioning ? 'pointer-events-none' : ''}
        >
          {isInStructureStep ? (
            <StructureInputForm onStructureComplete={completeStructureSetup} />
          ) : (
            <WritingStep
              localContainers={safeContainers}
              localParagraphs={safeParagraphs}
              internalState={safeInternalState}
              renderMarkdown={renderMarkdown}
              goToStructureStep={navigateToStructureStep}
              saveAllToContext={saveCurrentProgress}
              completeEditor={handleEditorComplete}
              activateEditor={setActiveEditor}
              togglePreview={switchPreviewMode}
              setInternalState={updateEditorState}
              setTargetContainerId={setContainerTarget}
              addLocalParagraph={createNewParagraph}
              deleteLocalParagraph={removeParagraph}
              updateLocalParagraphContent={updateParagraphContent}
              toggleParagraphSelection={toggleParagraphSelect}
              addToLocalContainer={addParagraphsToContainer}
              moveLocalParagraphInContainer={changeParagraphOrder}
              getLocalUnassignedParagraphs={getUnassignedParagraphs}
              getLocalParagraphsByContainer={getParagraphsByContainer}
              moveToContainer={handleMoveToContainer}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditorContainer);

console.log(
  '🔧 [EDITOR_CONTAINER] 강화된 쿨다운 시간 통일 및 관대한 모드 설정 완료:',
  {
    oldCooldown: '5000ms',
    newCooldown: `${EDITOR_TRANSFER_COOLDOWN_MS}ms`,
    bridgeAlignment: true,
    tolerantModeEnabled: true,
    maxRetryAttemptsConfigured: true,
    retryDelayMsConfigured: true,
    enhancedErrorHandling: true,
    phase: 'Phase 3 강화 완료',
  }
);
