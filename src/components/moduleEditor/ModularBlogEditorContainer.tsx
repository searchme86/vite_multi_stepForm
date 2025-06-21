// 📁 editor/ModularBlogEditorContainer.tsx
// 🎯 **근본적 개선**: import 경로 정리 및 단일 데이터 소스 확정 + 컨테이너 이동 기능 추가

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useEditorState } from './hooks/editorStateHooks/useEditorStateMain';
import { renderMarkdown } from './utils/markdown';
import ProgressSteps from './parts/ProgressSteps';
import StructureInputForm from './parts/StructureInput/StructureInputForm';
import WritingStep from './parts/WritingStep/WritingStep';

import { useEditorMultiStepBridge } from '../../bridges/editorMultiStepBridge/useEditorMultiStepBridge';
import { useBridgeUI } from '../../bridges/hooks/useBridgeUI';

import { resetEditorStoreCompletely } from '../../store/editorCore/editorCoreStore';
import { resetEditorUIStoreCompletely } from '../../store/editorUI/editorUIStore';

function ModularBlogEditorContainer(): React.ReactNode {
  const isInitializedRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ✅ **초기화**: 스토어 리셋
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔄 [CONTAINER] 에디터 스토어 초기화');
      resetEditorStoreCompletely();
      resetEditorUIStoreCompletely();
      isInitializedRef.current = true;
    }
  }, []);

  // ✅ **단일 데이터 소스**: useEditorState만 사용 (사용자 훅 구조 유지)
  const editorState = useEditorState();

  console.log('🏗️ [CONTAINER] useEditorState 훅 결과:', {
    hasContainers: editorState.localContainers?.length > 0,
    hasParagraphs: editorState.localParagraphs?.length > 0,
    hasInternalState: !!editorState.internalState,
    hasMoveToContainer: typeof editorState.moveToContainer === 'function', // 🔄 새로 추가된 함수 확인
  });

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
    handleStructureComplete: handleStructureCompleteInternal, // ✅ useEditorState에서만 가져옴
    goToStructureStep: navigateToStructureStepInternal,
    saveAllToContext: saveCurrentProgress,
    completeEditor: finishEditing,
    activateEditor: setActiveEditor,
    togglePreview: switchPreviewMode,
    setInternalState: updateEditorState,
    setTargetContainerId: setContainerTarget,
    getLocalUnassignedParagraphs: getUnassignedParagraphs,
    getLocalParagraphsByContainer: getParagraphsByContainer,

    // 🔄 **새로 추가**: 컨테이너 이동 관련 함수들
    moveToContainer: moveToContainerFunction,
    trackContainerMove: trackContainerMoveFunction,
    getContainerMoveHistory: getContainerMoveHistoryFunction,
    getContainerMovesByParagraph: getContainerMovesByParagraphFunction,
    getRecentContainerMoves: getRecentContainerMovesFunction,
    getContainerMoveStats: getContainerMoveStatsFunction,
    clearContainerMoveHistory: clearContainerMoveHistoryFunction,
    removeContainerMoveRecord: removeContainerMoveRecordFunction,
  } = editorState;

  console.log('🏗️ [CONTAINER] 컴포넌트 렌더링:', {
    containers: currentContainers?.length || 0,
    paragraphs: currentParagraphs?.length || 0,
    currentStep: editorInternalState?.currentSubStep || 'unknown',
    hasMoveFunction: typeof moveToContainerFunction === 'function', // 🔄 이동 함수 존재 확인
    timestamp: new Date().toLocaleTimeString(),
  });

  // ✅ 안전한 기본값 설정
  const safeContainers = currentContainers || [];
  const safeParagraphs = currentParagraphs || [];
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

  // ✅ **브릿지 설정**: 기존 로직 유지
  const bridgeConfig = {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict' as const,
    debugMode: false,
  };

  const { isTransferInProgress, executeManualTransfer, checkCanTransfer } =
    useEditorMultiStepBridge(bridgeConfig);

  const {
    canTransfer: uiCanTransfer,
    isTransferring: uiIsTransferring,
    executeManualTransfer: uiExecuteTransfer,
    refreshValidationStatus: uiRefreshValidation,
  } = useBridgeUI(bridgeConfig);

  // ✅ **Promise 기반 딜레이**: setTimeout 대신 사용
  const createPromiseDelay = useCallback((ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  // 🔄 **컨테이너 이동 함수 래핑**: 로깅 및 에러 처리 추가
  const handleMoveToContainer = useCallback(
    (paragraphId: string, targetContainerId: string) => {
      console.log('🔄 [CONTAINER] 컨테이너 이동 요청 수신:', {
        paragraphId,
        targetContainerId,
        hasFunction: typeof moveToContainerFunction === 'function',
      });

      if (typeof moveToContainerFunction !== 'function') {
        console.error('❌ [CONTAINER] moveToContainer 함수가 없습니다');
        return;
      }

      try {
        moveToContainerFunction(paragraphId, targetContainerId);
      } catch (error) {
        console.error('❌ [CONTAINER] 컨테이너 이동 실행 실패:', error);
      }
    },
    [moveToContainerFunction]
  );

  // ✅ **근본적 개선**: 상태 전환 로직 단순화
  const updateStepWithValidation = useCallback(
    async (targetStep: 'structure' | 'writing', actionName: string) => {
      console.log(`🔄 [CONTAINER] ${actionName} 시작:`, {
        currentStep: currentEditorStep,
        targetStep,
        isTransitioning,
      });

      if (isTransitioning) {
        console.warn(`⚠️ [CONTAINER] ${actionName} - 전환 중이므로 중단`);
        return false;
      }

      setIsTransitioning(true);

      try {
        // ✅ **직접 상태 업데이트**: 복잡한 로직 제거
        if (updateEditorState && typeof updateEditorState === 'function') {
          updateEditorState((prev) => ({
            ...prev,
            currentSubStep: targetStep,
            isTransitioning: false,
          }));
        }

        await createPromiseDelay(100); // 짧은 딜레이로 안정화

        console.log(`✅ [CONTAINER] ${actionName} 성공`);
        setIsTransitioning(false);
        return true;
      } catch (error) {
        console.error(`❌ [CONTAINER] ${actionName} 실패:`, error);
        setIsTransitioning(false);
        return false;
      }
    },
    [currentEditorStep, isTransitioning, updateEditorState, createPromiseDelay]
  );

  // ✅ **근본적 개선**: 구조 설정 완료 로직 단순화
  const completeStructureSetup = useCallback(
    async (inputs: string[]) => {
      console.log('🏗️ [CONTAINER] 구조 설정 완료 프로세스 시작:', {
        inputs,
        inputCount: inputs.length,
      });

      if (isTransitioning) {
        console.warn('⚠️ [CONTAINER] 전환 중이므로 중단');
        return;
      }

      try {
        const validInputs = inputs.filter(
          (input) => typeof input === 'string' && input.trim().length > 0
        );

        if (validInputs.length < 2) {
          console.error('❌ [CONTAINER] 최소 2개 섹션 필요:', {
            provided: validInputs.length,
            required: 2,
          });
          return;
        }

        // ✅ **단일 함수 호출**: handleStructureCompleteInternal만 사용
        console.log('📞 [CONTAINER] 구조 완료 핸들러 실행');
        if (typeof handleStructureCompleteInternal === 'function') {
          handleStructureCompleteInternal(validInputs);
        } else {
          console.error(
            '❌ [CONTAINER] handleStructureComplete 함수가 없습니다'
          );
        }

        // ✅ **자동 상태 전환**: useEditorState 내부에서 처리됨
        console.log('✅ [CONTAINER] 구조 설정 완료 프로세스 성공');
      } catch (error) {
        console.error('❌ [CONTAINER] 구조 설정 완료 프로세스 에러:', error);
      }
    },
    [isTransitioning, handleStructureCompleteInternal]
  );

  // ✅ **단순화된 네비게이션 함수들**
  const navigateToStructureStep = useCallback(async () => {
    console.log('⬅️ [CONTAINER] 구조 설정으로 이동');
    try {
      if (typeof navigateToStructureStepInternal === 'function') {
        navigateToStructureStepInternal();
      }
      await createPromiseDelay(100);
      console.log('✅ [CONTAINER] 구조 설정으로 이동 완료');
    } catch (error) {
      console.error('❌ [CONTAINER] 구조 설정으로 이동 실패:', error);
    }
  }, [navigateToStructureStepInternal, createPromiseDelay]);

  // ✅ **브릿지 완료 로직**: 기존 유지
  const handleEditorComplete = useCallback(async () => {
    console.log('🎉 [CONTAINER] 에디터 완료 프로세스 시작');

    try {
      if (typeof finishEditing === 'function') {
        finishEditing();
      }

      const canTransfer = checkCanTransfer();

      if (uiCanTransfer && !uiIsTransferring) {
        console.log('🌉 [CONTAINER] UI 브릿지를 통한 전송 시도');
        try {
          await uiExecuteTransfer();
          console.log('✅ [CONTAINER] UI 브릿지 전송 성공');
        } catch (uiError) {
          console.warn(
            '⚠️ [CONTAINER] UI 브릿지 전송 실패, 기본 브릿지 시도:',
            uiError
          );

          if (canTransfer && !isTransferInProgress) {
            try {
              await executeManualTransfer();
              console.log('✅ [CONTAINER] 기본 브릿지 전송 성공');
            } catch (basicError) {
              console.error(
                '❌ [CONTAINER] 기본 브릿지 전송도 실패:',
                basicError
              );
            }
          }
        }
      } else if (canTransfer && !isTransferInProgress) {
        console.log('🌉 [CONTAINER] 기본 브릿지를 통한 전송 시도');
        try {
          await executeManualTransfer();
          console.log('✅ [CONTAINER] 기본 브릿지 전송 성공');
        } catch (transferError) {
          console.error('❌ [CONTAINER] 기본 브릿지 전송 실패:', transferError);
        }
      } else {
        console.warn('⚠️ [CONTAINER] 전송 조건이 충족되지 않음:', {
          uiCanTransfer,
          uiIsTransferring,
          canTransfer,
          isTransferInProgress,
        });
      }
    } catch (error) {
      console.error('❌ [CONTAINER] 에디터 완료 프로세스 에러:', error);
    }
  }, [
    finishEditing,
    checkCanTransfer,
    uiCanTransfer,
    uiIsTransferring,
    isTransferInProgress,
    executeManualTransfer,
    uiExecuteTransfer,
  ]);

  // ✅ **브릿지 검증 새로고침**: 기존 유지
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof uiRefreshValidation === 'function') {
        uiRefreshValidation();
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    safeContainers.length,
    safeParagraphs.length,
    currentEditorStep,
    uiRefreshValidation,
  ]);

  // ✅ **상태 변화 로깅** (컨테이너 이동 관련 정보 추가)
  useEffect(() => {
    console.log('📊 [CONTAINER] 상태 변화 감지:', {
      currentStep: currentEditorStep,
      isInStructureStep: currentEditorStep === 'structure',
      isInWritingStep: currentEditorStep === 'writing',
      isTransitioning,
      containerCount: safeContainers.length,
      paragraphCount: safeParagraphs.length,
      containerNames: safeContainers.map((c) => c.name),
      hasMoveFunction: typeof handleMoveToContainer === 'function', // 🔄 이동 함수 상태 추가
    });
  }, [
    currentEditorStep,
    isTransitioning,
    safeContainers.length,
    safeParagraphs.length,
    safeContainers,
    handleMoveToContainer,
  ]);

  const isInStructureStep = currentEditorStep === 'structure';

  return (
    <div className="space-y-6">
      <ProgressSteps currentSubStep={currentEditorStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentEditorStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={
            isStepTransitioning || isTransitioning ? 'pointer-events-none' : ''
          }
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
              moveToContainer={handleMoveToContainer} // 🔄 새로 추가: 컨테이너 간 이동 함수
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditorContainer);

/**
 * 🔧 ModularBlogEditorContainer 주요 개선사항 (사용자 코드 기반):
 *
 * 1. ✅ 사용자 코드 구조 완전 유지
 *    - 기존 useEditorState 훅 구조 그대로 활용
 *    - 개별 메서드 추출 방식 유지
 *    - 로깅 패턴 및 에러 처리 방식 동일하게 적용
 *
 * 2. ✅ 컨테이너 간 이동 기능 통합
 *    - moveToContainer 함수를 WritingStep으로 안전하게 전달
 *    - handleMoveToContainer 래핑 함수로 추가 로깅 및 검증
 *    - 함수 존재 여부 확인으로 런타임 에러 방지
 *
 * 3. ✅ 안전한 기본값 처리
 *    - safeContainers, safeParagraphs로 null/undefined 방지
 *    - safeInternalState로 상태 안정성 확보
 *    - 함수 존재 여부 검증 후 호출
 *
 * 4. ✅ 향상된 디버깅 지원
 *    - 컨테이너 이동 함수 상태 추적
 *    - 상세한 함수 호출 로깅
 *    - 에러 발생 지점 명확히 식별
 *
 * 5. ✅ 기존 브릿지 시스템 완전 유지
 *    - UI 브릿지와 기본 브릿지 이중 보안 유지
 *    - 검증 새로고침 로직 그대로 적용
 *    - 전송 조건 검증 로직 유지
 *
 * 6. ✅ 성능 최적화 유지
 *    - React.memo로 불필요한 리렌더링 방지
 *    - useCallback으로 함수 참조 안정성 확보
 *    - 적절한 의존성 배열 관리
 */

/**
 * 🔄 컨테이너 이동 기능 데이터 플로우 (사용자 코드 기반):
 *
 * 1. useEditorState → moveToContainer 함수 생성 및 반환
 * 2. ModularBlogEditorContainer → handleMoveToContainer 래핑
 * 3. WritingStep → moveToContainer props 전달
 * 4. StructureManagementSlide → containerManagerProps로 전달
 * 5. ContainerCard → 각 단락의 ContainerSelector로 전달
 * 6. ContainerSelector → 사용자 선택 시 함수 실행
 * 7. Zustand 스토어 업데이트 → 토스트 알림 → UI 리렌더링
 *
 * 🎯 **사용자 코드 특징 반영**:
 * - 개별 메서드 추출로 안정성 확보
 * - 토스트 알림으로 사용자 피드백 제공
 * - 상세한 로깅으로 디버깅 지원
 * - 안전한 함수 호출 검증
 */
