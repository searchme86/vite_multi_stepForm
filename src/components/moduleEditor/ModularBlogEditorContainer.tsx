import React, { useRef, useEffect, useCallback } from 'react';
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
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(
    '🔄 [CONTAINER] ModularBlogEditorContainer 렌더링 횟수:',
    renderCount.current
  );

  console.log('✅ [CONTAINER] Zustand Store 확인 완료');

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🔥 [CONTAINER] 에디터 컨테이너 초기화 시작');

      resetEditorStoreCompletely();
      resetEditorUIStoreCompletely();

      isInitializedRef.current = true;
      console.log('✅ [CONTAINER] 에디터 컨테이너 완전 초기화 완료');
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
    debugMode: true,
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

  console.group('🌉 [BRIDGE_DEBUG] 에디터 브릿지 초기화 상태');
  console.log('📋 [BRIDGE_DEBUG] 브릿지 설정:', bridgeConfiguration);
  console.log('🔧 [BRIDGE_DEBUG] 커스텀 설정:', bridgeConfig);
  console.log('⚡ [BRIDGE_DEBUG] 브릿지 훅 연결 상태:', {
    hookConnected: true,
    functionsAvailable: {
      executeManualTransfer: typeof executeManualTransfer,
      checkCanTransfer: typeof checkCanTransfer,
      resetBridgeState: typeof resetBridgeState,
      toggleAutoTransfer: typeof toggleAutoTransfer,
    },
  });
  console.groupEnd();

  console.group('🎨 [BRIDGE_UI_DEBUG] 에디터 브릿지 UI 상태');
  console.log('📊 [BRIDGE_UI_DEBUG] UI 전송 상태:', {
    uiCanTransfer,
    uiIsTransferring,
    uiCheckTransferStatus: uiCheckTransferStatus(),
    basicCanTransfer: checkCanTransfer(),
  });
  console.log('🔍 [BRIDGE_UI_DEBUG] 에디터 검증 상태:', editorValidationStatus);
  console.log('⚙️ [BRIDGE_UI_DEBUG] UI 브릿지 설정:', uiBridgeConfiguration);
  console.groupEnd();

  console.group('📊 [BRIDGE_DEBUG] 에디터 브릿지 실시간 상태');
  console.log('🚦 [BRIDGE_DEBUG] 전송 상태:', {
    isTransferInProgress,
    isAutoTransferActive,
    transferCount,
    canTransfer: checkCanTransfer(),
  });
  console.log('📈 [BRIDGE_DEBUG] 전송 결과 상태:', {
    hasLastResult: !!lastTransferResult,
    lastResultSuccess: lastTransferResult?.operationSuccess || false,
    errorCount: transferErrorDetails.length,
    warningCount: transferWarningMessages.length,
  });
  console.log('🔍 [BRIDGE_DEBUG] 상세 오류 정보:', transferErrorDetails);
  console.log('⚠️ [BRIDGE_DEBUG] 상세 경고 정보:', transferWarningMessages);
  console.groupEnd();

  const handleEditorComplete = useCallback(async () => {
    console.log('🎯 [CONTAINER] 에디터 완료 처리 시작');

    console.group('📋 [BRIDGE_DEBUG] 에디터 완료 처리 상세 과정');
    console.log('📊 [BRIDGE_DEBUG] 에디터 완료 전 데이터 상태:', {
      containers: currentContainers.length,
      paragraphs: currentParagraphs.length,
      currentStep: currentEditorStep,
      hasContent: currentContainers.length > 0 && currentParagraphs.length > 0,
      editorValidation: editorValidationStatus,
    });

    console.log('✍️ [BRIDGE_DEBUG] 에디터 완료 상태 설정 실행');
    finishEditing();

    const canTransfer = checkCanTransfer();
    const uiCanTransferStatus = uiCheckTransferStatus();
    console.log('🔍 [BRIDGE_DEBUG] 브릿지 전송 가능 여부 확인:', {
      canTransfer,
      uiCanTransferStatus,
      isTransferInProgress,
      autoTransferActive: isAutoTransferActive,
      validationReady: editorValidationStatus.isReadyForTransfer,
    });

    if (uiCanTransfer && !uiIsTransferring) {
      console.log('🚀 [CONTAINER] UI 브릿지 전송 시작 (우선 사용)');
      console.log('🔄 [BRIDGE_UI_DEBUG] UI 브릿지 전송 실행 시작 - 상태:', {
        timestamp: new Date().toISOString(),
        transferCount: transferCount,
        validationStatus: editorValidationStatus,
        bridgeConfig: uiBridgeConfiguration,
      });

      try {
        await uiExecuteTransfer();
        console.log('✅ [BRIDGE_UI_DEBUG] UI 브릿지 전송 실행 완료');
      } catch (transferError) {
        console.error(
          '❌ [BRIDGE_UI_DEBUG] UI 브릿지 전송 실행 중 오류:',
          transferError
        );

        console.log('🔄 [BRIDGE_DEBUG] 기본 브릿지로 fallback 시도');
        if (canTransfer && !isTransferInProgress) {
          try {
            await executeManualTransfer();
            console.log('✅ [BRIDGE_DEBUG] 기본 브릿지 전송 완료');
          } catch (fallbackError) {
            console.error(
              '❌ [BRIDGE_DEBUG] 기본 브릿지 전송도 실패:',
              fallbackError
            );
          }
        }
      }
    } else if (canTransfer && !isTransferInProgress) {
      console.log('🔄 [CONTAINER] 기본 브릿지 전송 시작 (fallback)');
      console.log('🔄 [BRIDGE_DEBUG] 기본 브릿지 전송 실행 시작 - 상태:', {
        timestamp: new Date().toISOString(),
        transferCount: transferCount,
        bridgeConfig: bridgeConfiguration,
      });

      try {
        await executeManualTransfer();
        console.log('✅ [BRIDGE_DEBUG] 기본 브릿지 전송 실행 완료');
      } catch (transferError) {
        console.error(
          '❌ [BRIDGE_DEBUG] 기본 브릿지 전송 실행 중 오류:',
          transferError
        );
      }
    } else {
      console.warn('⚠️ [BRIDGE_DEBUG] 브릿지 전송 조건 미충족:', {
        canTransfer,
        uiCanTransfer,
        isTransferInProgress,
        uiIsTransferring,
        reason: !canTransfer
          ? '기본 전송 불가능 상태'
          : !uiCanTransfer
          ? 'UI 전송 불가능 상태'
          : '이미 전송 진행 중',
        validationErrors: editorValidationStatus.validationErrors,
        validationWarnings: editorValidationStatus.validationWarnings,
      });
    }
    console.groupEnd();
  }, [
    finishEditing,
    checkCanTransfer,
    uiCheckTransferStatus,
    uiCanTransfer,
    uiIsTransferring,
    isTransferInProgress,
    executeManualTransfer,
    uiExecuteTransfer,
    currentContainers.length,
    currentParagraphs.length,
    currentEditorStep,
    isAutoTransferActive,
    transferCount,
    bridgeConfiguration,
    uiBridgeConfiguration,
    editorValidationStatus,
  ]);

  // 🔧 무한 루프 해결: 에디터 상태 변화 감지 (검증 상태 업데이트 제거)
  useEffect(() => {
    console.log('🎛️ [CONTAINER] 에디터 상태 변화 감지:', {
      currentStep: currentEditorStep,
      containers: currentContainers.length,
      paragraphs: currentParagraphs.length,
    });

    console.group('📈 [BRIDGE_DEBUG] 에디터 상태 변화 상세 분석');
    console.log('📊 [BRIDGE_DEBUG] 컨테이너 상세 정보:', {
      containerCount: currentContainers.length,
      containerNames: currentContainers.map((c) => c.name),
      containerIds: currentContainers.map((c) => c.id),
    });
    console.log('📝 [BRIDGE_DEBUG] 문단 상세 정보:', {
      paragraphCount: currentParagraphs.length,
      assignedParagraphs: currentParagraphs.filter(
        (p) => p.containerId !== null
      ).length,
      unassignedParagraphs: currentParagraphs.filter(
        (p) => p.containerId === null
      ).length,
      totalContentLength: currentParagraphs.reduce(
        (total, p) => total + p.content.length,
        0
      ),
    });
    console.log('🎯 [BRIDGE_DEBUG] 에디터 진행 상태:', {
      currentStep: currentEditorStep,
      isStructureStep: currentEditorStep === 'structure',
      isWritingStep: currentEditorStep === 'writing',
      isTransitioning: isStepTransitioning,
    });
    console.log('🌉 [BRIDGE_DEBUG] 브릿지 연동 준비 상태:', {
      canTransferNow: checkCanTransfer(),
      uiCanTransferNow: uiCheckTransferStatus(),
      hasMinimalContent:
        currentContainers.length > 0 && currentParagraphs.length > 0,
      bridgeReadiness: !isTransferInProgress && isAutoTransferActive,
    });
    console.groupEnd();

    // 🔥 uiRefreshValidation() 호출 제거 - 무한 루프 방지
  }, [
    currentEditorStep,
    currentContainers,
    currentParagraphs,
    isStepTransitioning,
    checkCanTransfer,
    uiCheckTransferStatus,
    isTransferInProgress,
    isAutoTransferActive,
    // 🔥 문제가 되는 의존성들 제거
    // editorValidationStatus,  // 제거됨 - 무한 루프 방지
    // uiRefreshValidation,     // 제거됨 - 무한 루프 방지
  ]);

  // 🆕 별도의 useEffect: 검증 상태 업데이트 (디바운스 적용)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔄 [BRIDGE_UI] 검증 상태 새로고침 실행 (300ms 지연)');
      uiRefreshValidation();
    }, 300); // 300ms 지연으로 과도한 호출 방지

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    // 핵심 데이터 변화에만 반응
    currentContainers.length,
    currentParagraphs.length,
    currentEditorStep,
    uiRefreshValidation,
  ]);

  useEffect(() => {
    console.log('🌉 [CONTAINER] 브릿지 결과 변화 감지');

    console.group('📋 [BRIDGE_DEBUG] 브릿지 전송 결과 상세 분석');

    if (lastTransferResult) {
      console.log('📊 [BRIDGE_DEBUG] 전송 결과 기본 정보:', {
        operationSuccess: lastTransferResult.operationSuccess,
        operationDuration: lastTransferResult.operationDuration,
        timestamp: new Date().toISOString(),
      });

      console.log('📈 [BRIDGE_DEBUG] 전송 데이터 상세:', {
        hasTransferredData: !!lastTransferResult.transferredData,
        transferredContent:
          lastTransferResult.transferredData?.transformedContent?.length || 0,
        isCompleted:
          lastTransferResult.transferredData?.transformedIsCompleted || false,
        transformationSuccess:
          lastTransferResult.transferredData?.transformationSuccess || false,
      });

      console.log('📋 [BRIDGE_DEBUG] 오류 및 경고 분석:', {
        errorCount: lastTransferResult.operationErrors.length,
        warningCount: lastTransferResult.operationWarnings.length,
        errors: lastTransferResult.operationErrors.map((err) => ({
          code: err.errorCode,
          message: err.errorMessage,
          isRecoverable: err.isRecoverable,
        })),
        warnings: lastTransferResult.operationWarnings,
      });

      if (lastTransferResult.operationSuccess) {
        console.log('✅ [CONTAINER] 브릿지 전송 성공');
        console.log(
          '🎉 [BRIDGE_DEBUG] 전송 성공 - 멀티스텝 폼에서 데이터 수신 예상'
        );
      } else {
        console.error(
          '❌ [CONTAINER] 브릿지 전송 실패:',
          lastTransferResult.operationErrors
        );
        console.error('💥 [BRIDGE_DEBUG] 전송 실패 상세 분석:', {
          failureReason:
            lastTransferResult.operationErrors[0]?.errorMessage ||
            '알 수 없는 오류',
          isRecoverable: lastTransferResult.operationErrors.some(
            (err) => err.isRecoverable
          ),
          suggestedActions: lastTransferResult.operationErrors.map(
            (err) => err.errorCode
          ),
        });
      }
    } else {
      console.log('🔍 [BRIDGE_DEBUG] 아직 전송 결과 없음 - 대기 중');
    }
    console.groupEnd();
  }, [lastTransferResult]);

  console.log('🎛️ [CONTAINER] useEditorState 훅 사용 완료:', {
    currentSubStep: currentEditorStep,
    isTransitioning: isStepTransitioning,
    localParagraphs: currentParagraphs.length,
    localContainers: currentContainers.length,
    isMobile: isOnMobileDevice,
    availableFunctions: {
      addLocalParagraph: typeof createNewParagraph,
      deleteLocalParagraph: typeof removeParagraph,
      updateLocalParagraphContent: typeof updateParagraphContent,
      toggleParagraphSelection: typeof toggleParagraphSelect,
      addToLocalContainer: typeof addParagraphsToContainer,
      moveLocalParagraphInContainer: typeof changeParagraphOrder,
      getLocalUnassignedParagraphs: typeof getUnassignedParagraphs,
      getLocalParagraphsByContainer: typeof getParagraphsByContainer,
    },
  });

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
