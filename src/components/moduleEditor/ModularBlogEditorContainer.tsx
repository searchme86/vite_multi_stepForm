import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiStepForm } from '../useMultiStepForm';
import { useEditorState } from './hooks/useEditorState';
import { renderMarkdown } from './utils/markdown';
import ProgressSteps from './parts/ProgressSteps';
import StructureInputForm from './parts/StructureInput/StructureInputForm';
import WritingStep from './parts/WritingStep/WritingStep';

function ModularBlogEditorContainer(): React.ReactNode {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(
    '🔄 [CONTAINER] ModularBlogEditorContainer 렌더링 횟수:',
    renderCount.current
  );

  const context = useMultiStepForm();

  if (!context) {
    console.log('❌ [CONTAINER] Context 없음');
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">
          에디터를 사용하려면 MultiStepForm Context가 필요합니다.
        </p>
      </div>
    );
  }

  console.log('✅ [CONTAINER] Context 확인 완료');

  const editorState = useEditorState({ context });

  console.log('🎛️ [CONTAINER] useEditorState 훅 사용 완료:', {
    currentSubStep: editorState.internalState.currentSubStep,
    isTransitioning: editorState.internalState.isTransitioning,
    localParagraphs: editorState.localParagraphs.length,
    localContainers: editorState.localContainers.length,
    isMobile: editorState.isMobile,
    availableFunctions: {
      addLocalParagraph: typeof editorState.addLocalParagraph,
      deleteLocalParagraph: typeof editorState.deleteLocalParagraph,
      updateLocalParagraphContent:
        typeof editorState.updateLocalParagraphContent,
      toggleParagraphSelection: typeof editorState.toggleParagraphSelection,
      addToLocalContainer: typeof editorState.addToLocalContainer,
      moveLocalParagraphInContainer:
        typeof editorState.moveLocalParagraphInContainer,
      getLocalUnassignedParagraphs:
        typeof editorState.getLocalUnassignedParagraphs,
      getLocalParagraphsByContainer:
        typeof editorState.getLocalParagraphsByContainer,
    },
  });

  return (
    <div className="space-y-6">
      <ProgressSteps
        currentSubStep={editorState.internalState.currentSubStep}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={editorState.internalState.currentSubStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={
            editorState.internalState.isTransitioning
              ? 'pointer-events-none'
              : ''
          }
        >
          {editorState.internalState.currentSubStep === 'structure' ? (
            <StructureInputForm
              onStructureComplete={editorState.handleStructureComplete}
            />
          ) : (
            <WritingStep
              localContainers={editorState.localContainers}
              localParagraphs={editorState.localParagraphs}
              internalState={editorState.internalState}
              renderMarkdown={renderMarkdown}
              goToStructureStep={editorState.goToStructureStep}
              saveAllToContext={editorState.saveAllToContext}
              completeEditor={editorState.completeEditor}
              addLocalParagraph={editorState.addLocalParagraph}
              deleteLocalParagraph={editorState.deleteLocalParagraph}
              updateLocalParagraphContent={
                editorState.updateLocalParagraphContent
              }
              toggleParagraphSelection={editorState.toggleParagraphSelection}
              addToLocalContainer={editorState.addToLocalContainer}
              moveLocalParagraphInContainer={
                editorState.moveLocalParagraphInContainer
              }
              activateEditor={editorState.activateEditor}
              togglePreview={editorState.togglePreview}
              setInternalState={editorState.setInternalState}
              getLocalUnassignedParagraphs={
                editorState.getLocalUnassignedParagraphs
              }
              getLocalParagraphsByContainer={
                editorState.getLocalParagraphsByContainer
              }
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ModularBlogEditorContainer);
