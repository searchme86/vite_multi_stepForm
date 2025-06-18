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

  useEffect(() => {
    if (!isInitializedRef.current) {
      resetEditorStoreCompletely();
      resetEditorUIStoreCompletely();
      isInitializedRef.current = true;
    }
  }, []);

  const editorState = useEditorState();

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
  } = editorState;

  const {
    currentSubStep: currentEditorStep,
    isTransitioning: isStepTransitioning,
  } = editorInternalState;

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

  const createPromiseDelay = useCallback((ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

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
        if (updateEditorState) {
          updateEditorState((prev) => ({
            ...prev,
            currentSubStep: targetStep,
            isTransitioning: false,
          }));
        }

        await createPromiseDelay(200);

        const finalStep = editorInternalState?.currentSubStep;
        if (finalStep === targetStep) {
          console.log(`✅ [CONTAINER] ${actionName} 성공:`, { finalStep });
          setIsTransitioning(false);
          return true;
        } else {
          console.warn(
            `⚠️ [CONTAINER] ${actionName} 상태 불일치 - 강제 수정:`,
            {
              expected: targetStep,
              actual: finalStep,
            }
          );

          if (updateEditorState) {
            updateEditorState({
              currentSubStep: targetStep,
              isTransitioning: false,
              activeParagraphId: editorInternalState?.activeParagraphId || null,
              isPreviewOpen: editorInternalState?.isPreviewOpen ?? true,
              selectedParagraphIds:
                editorInternalState?.selectedParagraphIds || [],
              targetContainerId: editorInternalState?.targetContainerId || '',
            });
          }

          console.log(`🔧 [CONTAINER] ${actionName} 강제 수정 완료`);
          setIsTransitioning(false);
          return true;
        }
      } catch (error) {
        console.error(`❌ [CONTAINER] ${actionName} 실패:`, error);
        setIsTransitioning(false);
        return false;
      }
    },
    [
      currentEditorStep,
      isTransitioning,
      updateEditorState,
      editorInternalState,
      createPromiseDelay,
    ]
  );

  const completeStructureSetup = useCallback(
    async (inputs: string[]) => {
      console.log('🏗️ [CONTAINER] 구조 설정 완료 프로세스 시작:', {
        inputs,
        inputCount: inputs.length,
      });

      if (isTransitioning) {
        console.warn('⚠️ [CONTAINER] 구조 설정 - 전환 중이므로 중단');
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

        console.log('📞 [CONTAINER] 내부 구조 완료 핸들러 실행');
        handleStructureCompleteInternal(validInputs);

        await createPromiseDelay(100);

        const success = await updateStepWithValidation(
          'writing',
          '구조→글쓰기 전환'
        );

        if (success) {
          console.log('✅ [CONTAINER] 구조 설정 완료 프로세스 성공');
        } else {
          console.error('❌ [CONTAINER] 구조 설정 완료 프로세스 실패');
        }
      } catch (error) {
        console.error('❌ [CONTAINER] 구조 설정 완료 프로세스 에러:', error);
      }
    },
    [
      isTransitioning,
      handleStructureCompleteInternal,
      createPromiseDelay,
      updateStepWithValidation,
    ]
  );

  const navigateToStructureStep = useCallback(async () => {
    console.log('⬅️ [CONTAINER] 구조 설정으로 이동 프로세스 시작');

    if (isTransitioning) {
      console.warn('⚠️ [CONTAINER] 구조 이동 - 전환 중이므로 중단');
      return;
    }

    try {
      console.log('📞 [CONTAINER] 내부 구조 이동 핸들러 실행');
      navigateToStructureStepInternal();

      await createPromiseDelay(100);

      const success = await updateStepWithValidation(
        'structure',
        '글쓰기→구조 전환'
      );

      if (success) {
        console.log('✅ [CONTAINER] 구조 설정으로 이동 프로세스 성공');
      } else {
        console.error('❌ [CONTAINER] 구조 설정으로 이동 프로세스 실패');
      }
    } catch (error) {
      console.error('❌ [CONTAINER] 구조 설정으로 이동 프로세스 에러:', error);
    }
  }, [
    isTransitioning,
    navigateToStructureStepInternal,
    createPromiseDelay,
    updateStepWithValidation,
  ]);

  const handleEditorComplete = useCallback(async () => {
    console.log('🎉 [CONTAINER] 에디터 완료 프로세스 시작');

    try {
      finishEditing();

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
      uiRefreshValidation();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    currentContainers.length,
    currentParagraphs.length,
    currentEditorStep,
    uiRefreshValidation,
  ]);

  useEffect(() => {
    console.log('📊 [CONTAINER] 상태 변화 감지:', {
      currentStep: currentEditorStep,
      isInStructureStep: currentEditorStep === 'structure',
      isInWritingStep: currentEditorStep === 'writing',
      isTransitioning,
      containerCount: currentContainers.length,
      paragraphCount: currentParagraphs.length,
    });
  }, [
    currentEditorStep,
    isTransitioning,
    currentContainers.length,
    currentParagraphs.length,
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
              localContainers={currentContainers}
              localParagraphs={currentParagraphs}
              internalState={editorInternalState}
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
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditorContainer);
