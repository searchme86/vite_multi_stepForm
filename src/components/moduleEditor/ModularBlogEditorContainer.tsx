// 📁 editor/ModularBlogEditorContainer.tsx
// 🎯 **근본적 개선**: import 경로 정리 및 단일 데이터 소스 확정

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

// ❌ **제거됨**: editorActionsZustand에서 handleStructureComplete import
// import { handleStructureComplete } from './actions/editorActions/editorActionsZustand';

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

  // ✅ **단일 데이터 소스**: useEditorState만 사용
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
  } = editorState;

  console.log('🏗️ [CONTAINER] 컴포넌트 렌더링:', {
    containers: currentContainers.length,
    paragraphs: currentParagraphs.length,
    currentStep: editorInternalState.currentSubStep,
    timestamp: new Date().toLocaleTimeString(),
  });

  const {
    currentSubStep: currentEditorStep,
    isTransitioning: isStepTransitioning,
  } = editorInternalState;

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
        if (updateEditorState) {
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
        handleStructureCompleteInternal(validInputs);

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
      navigateToStructureStepInternal();
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

  // ✅ **브릿지 검증 새로고침**: 기존 유지
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

  // ✅ **상태 변화 로깅**
  useEffect(() => {
    console.log('📊 [CONTAINER] 상태 변화 감지:', {
      currentStep: currentEditorStep,
      isInStructureStep: currentEditorStep === 'structure',
      isInWritingStep: currentEditorStep === 'writing',
      isTransitioning,
      containerCount: currentContainers.length,
      paragraphCount: currentParagraphs.length,
      containerNames: currentContainers.map((c) => c.name),
    });
  }, [
    currentEditorStep,
    isTransitioning,
    currentContainers.length,
    currentParagraphs.length,
    currentContainers,
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
