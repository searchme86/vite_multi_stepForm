// 📁 editor/ModularBlogEditorContainer.tsx

import React, { useRef, useEffect } from 'react';
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
    isMobile: isOnMobileDevice,
    addLocalParagraph: createNewParagraph,
    deleteLocalParagraph: removeParagraph,
    updateLocalParagraphContent: updateParagraphContent,
    toggleParagraphSelection: toggleParagraphSelect,
    addToLocalContainer: addParagraphsToContainer,
    moveLocalParagraphInContainer: changeParagraphOrder,
    handleStructureComplete: completeStructureSetup,
    goToStructureStep: navigateToStructureStep,
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

  const {
    isTransferInProgress,
    lastTransferResult,
    transferErrorDetails,
    transferWarningMessages,
    isAutoTransferActive,
    transferCount,
    executeManualTransfer,
    checkCanTransfer,
    resetBridgeState,
    toggleAutoTransfer,
    bridgeConfiguration,
  } = useEditorMultiStepBridge(bridgeConfig);

  const {
    canTransfer: uiCanTransfer,
    isTransferring: uiIsTransferring,
    validationStatus: editorValidationStatus,
    executeManualTransfer: uiExecuteTransfer,
    checkCurrentTransferStatus: uiCheckTransferStatus,
    refreshValidationStatus: uiRefreshValidation,
    bridgeConfiguration: uiBridgeConfiguration,
  } = useBridgeUI(bridgeConfig);

  const handleEditorComplete = React.useCallback(async () => {
    finishEditing();

    const canTransfer = checkCanTransfer();
    const uiCanTransferStatus = uiCheckTransferStatus();

    if (uiCanTransfer && !uiIsTransferring) {
      try {
        await uiExecuteTransfer();
      } catch (transferError) {
        if (canTransfer && !isTransferInProgress) {
          try {
            await executeManualTransfer();
          } catch (fallbackError) {
            console.error(
              '❌ [BRIDGE_DEBUG] 기본 브릿지 전송도 실패:',
              fallbackError
            );
          }
        }
      }
    } else if (canTransfer && !isTransferInProgress) {
      try {
        await executeManualTransfer();
      } catch (transferError) {
        console.error(
          '❌ [BRIDGE_DEBUG] 기본 브릿지 전송 실행 중 오류:',
          transferError
        );
      }
    }
  }, [
    finishEditing,
    checkCanTransfer,
    uiCheckTransferStatus,
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
          className={isStepTransitioning ? 'pointer-events-none' : ''}
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
