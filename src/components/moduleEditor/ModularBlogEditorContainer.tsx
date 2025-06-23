// src/components/moduleEditor/ModularBlogEditorContainer.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useEditorState } from './hooks/editorStateHooks/useEditorStateMain';
import { renderMarkdown } from './utils/markdown';
import ProgressSteps from './parts/ProgressSteps';
import StructureInputForm from './parts/StructureInput/StructureInputForm';
import WritingStep from './parts/WritingStep/WritingStep';

import { useBidirectionalBridge } from '../../bridges/hooks/useBidirectionalBridge';
import { useBridgeUIComponents } from '../../bridges/hooks/useBridgeUIComponents';

import { resetEditorStoreCompletely } from '../../store/editorCore/editorCoreStore';
import { resetEditorUIStoreCompletely } from '../../store/editorUI/editorUIStore';

function ModularBlogEditorContainer(): React.ReactNode {
  const isInitializedRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔄 [CONTAINER] 에디터 스토어 초기화');
      resetEditorStoreCompletely();
      resetEditorUIStoreCompletely();
      isInitializedRef.current = true;
    }
  }, []);

  const editorState = useEditorState();

  console.log('🏗️ [CONTAINER] useEditorState 훅 결과:', {
    hasContainers: editorState.localContainers?.length > 0,
    hasParagraphs: editorState.localParagraphs?.length > 0,
    hasInternalState: !!editorState.internalState,
    hasMoveToContainer: typeof editorState.moveToContainer === 'function',
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
    handleStructureComplete: handleStructureCompleteInternal,
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
    hasMoveFunction: typeof moveToContainerFunction === 'function',
    timestamp: new Date().toLocaleTimeString(),
  });

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

  const bridgeConfig = {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict' as const,
    debugMode: false,
  };

  const { isTransferInProgress, executeManualTransfer, checkCanTransfer } =
    useBidirectionalBridge(bridgeConfig);

  const {
    canTransfer: uiCanTransfer,
    isTransferring: uiIsTransferring,
    executeManualTransfer: uiExecuteTransfer,
    refreshValidationStatus: uiRefreshValidation,
  } = useBridgeUIComponents(bridgeConfig);

  const createPromiseDelay = useCallback((ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

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
        if (updateEditorState && typeof updateEditorState === 'function') {
          updateEditorState((prev) => ({
            ...prev,
            currentSubStep: targetStep,
            isTransitioning: false,
          }));
        }

        await createPromiseDelay(100);

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

        console.log('📞 [CONTAINER] 구조 완료 핸들러 실행');
        if (typeof handleStructureCompleteInternal === 'function') {
          handleStructureCompleteInternal(validInputs);
        } else {
          console.error(
            '❌ [CONTAINER] handleStructureComplete 함수가 없습니다'
          );
        }

        console.log('✅ [CONTAINER] 구조 설정 완료 프로세스 성공');
      } catch (error) {
        console.error('❌ [CONTAINER] 구조 설정 완료 프로세스 에러:', error);
      }
    },
    [isTransitioning, handleStructureCompleteInternal]
  );

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

  useEffect(() => {
    console.log('📊 [CONTAINER] 상태 변화 감지:', {
      currentStep: currentEditorStep,
      isInStructureStep: currentEditorStep === 'structure',
      isInWritingStep: currentEditorStep === 'writing',
      isTransitioning,
      containerCount: safeContainers.length,
      paragraphCount: safeParagraphs.length,
      containerNames: safeContainers.map((c) => c.name),
      hasMoveFunction: typeof handleMoveToContainer === 'function',
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
              moveToContainer={handleMoveToContainer}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditorContainer);
