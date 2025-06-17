import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useEditorState } from './hooks/editorStateHooks/useEditorStateMain';
import { renderMarkdown } from './utils/markdown';
import ProgressSteps from './parts/ProgressSteps';
import StructureInputForm from './parts/StructureInput/StructureInputForm';
import WritingStep from './parts/WritingStep/WritingStep';

// 브릿지 패턴 구현: 에디터에서 멀티스텝 폼으로 데이터를 안전하게 전송하기 위한 훅
import { useEditorMultiStepBridge } from '../../bridges/editorMultiStepBridge/useEditorMultiStepBridge';

// 브릿지 UI 훅: 에디터 상태와 연동된 UI 전용 브릿지 기능 제공
import { useBridgeUI } from '../../bridges/hooks/useBridgeUI';

function ModularBlogEditorContainer(): React.ReactNode {
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(
    '🔄 [CONTAINER] ModularBlogEditorContainer 렌더링 횟수:',
    renderCount.current
  );

  console.log('✅ [CONTAINER] Zustand Store 확인 완료');

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

  // 브릿지 설정: 에디터에서 멀티스텝으로의 데이터 전송을 위한 구성
  // enableAutoTransfer: 자동으로 데이터를 전송할지 여부
  // enableValidation: 전송 전 데이터 유효성 검증 실행 여부
  // enableErrorRecovery: 오류 발생 시 복구 시도 여부
  // validationMode: 검증 모드 (strict: 엄격, lenient: 관대)
  // debugMode: 디버그 모드 활성화 여부
  const bridgeConfig = {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'strict' as const,
    debugMode: true,
  };

  // 브릿지 훅: 에디터와 멀티스텝 폼 간의 데이터 전송을 관리
  // 전송 상태, 결과, 오류 등을 추적하고 제어하는 인터페이스 제공
  const {
    isTransferInProgress, // 현재 전송 진행 중인지 여부
    lastTransferResult, // 마지막 전송 결과
    transferErrorDetails, // 전송 오류 상세 정보
    transferWarningMessages, // 전송 경고 메시지
    isAutoTransferActive, // 자동 전송 활성화 여부
    transferCount, // 총 전송 시도 횟수
    executeManualTransfer, // 수동 전송 실행 함수
    checkCanTransfer, // 전송 가능 여부 확인 함수
    resetBridgeState, // 브릿지 상태 초기화 함수
    toggleAutoTransfer, // 자동 전송 토글 함수
    bridgeConfiguration, // 현재 브릿지 설정
  } = useEditorMultiStepBridge(bridgeConfig);

  // 브릿지 UI 훅: 에디터 상태와 연동된 UI 기능 제공
  // 실제 에디터 데이터를 기반으로 전송 상태, 검증 결과 등을 계산
  const {
    canTransfer: uiCanTransfer, // UI 기준 전송 가능 여부
    isTransferring: uiIsTransferring, // UI 기준 전송 진행 상태
    validationStatus: editorValidationStatus, // 에디터 데이터 검증 상태
    executeManualTransfer: uiExecuteTransfer, // UI 피드백 포함 전송 함수
    checkCurrentTransferStatus: uiCheckTransferStatus, // UI 기준 전송 상태 확인
    resetAllBridgeState: uiResetBridgeState, // UI 상태 포함 전체 초기화
    refreshValidationStatus: uiRefreshValidation, // 검증 상태 수동 새로고침
    bridgeConfiguration: uiBridgeConfiguration, // UI 훅의 브릿지 설정
  } = useBridgeUI(bridgeConfig);

  // 🔍 [DEBUG] 브릿지 초기화 및 설정 확인
  console.group('🌉 [BRIDGE_DEBUG] 에디터 브릿지 초기화 상태');
  console.log('📋 [BRIDGE_DEBUG] 브릿지 설정:', bridgeConfiguration);
  console.log('🔧 [BRIDGE_DEBUG] 커스텀 설정:', bridgeConfig);
  console.log('⚡ [BRIDGE_DEBUG] 브릿지 훅 연결 상태:', {
    hookConnected: true, // 브릿지 훅이 정상적으로 연결됨
    functionsAvailable: {
      executeManualTransfer: typeof executeManualTransfer,
      checkCanTransfer: typeof checkCanTransfer,
      resetBridgeState: typeof resetBridgeState,
      toggleAutoTransfer: typeof toggleAutoTransfer,
    },
  });
  console.groupEnd();

  // 🔍 [DEBUG] 브릿지 UI 상태 모니터링
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

  // 🔍 [DEBUG] 브릿지 실시간 상태 모니터링
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

  // 에디터 완료 처리: 글 작성이 끝났을 때 실행되는 함수
  // 브릿지를 통해 멀티스텝 폼으로 데이터 전송을 시작
  const handleEditorComplete = useCallback(async () => {
    console.log('🎯 [CONTAINER] 에디터 완료 처리 시작');

    // 🔍 [DEBUG] 에디터 완료 전 상태 확인
    console.group('📋 [BRIDGE_DEBUG] 에디터 완료 처리 상세 과정');
    console.log('📊 [BRIDGE_DEBUG] 에디터 완료 전 데이터 상태:', {
      containers: currentContainers.length,
      paragraphs: currentParagraphs.length,
      currentStep: currentEditorStep,
      hasContent: currentContainers.length > 0 && currentParagraphs.length > 0,
      editorValidation: editorValidationStatus,
    });

    // 에디터 완료 상태로 설정
    console.log('✍️ [BRIDGE_DEBUG] 에디터 완료 상태 설정 실행');
    finishEditing();

    // 🔍 [DEBUG] 브릿지 전송 전 조건 확인
    const canTransfer = checkCanTransfer();
    const uiCanTransferStatus = uiCheckTransferStatus();
    console.log('🔍 [BRIDGE_DEBUG] 브릿지 전송 가능 여부 확인:', {
      canTransfer,
      uiCanTransferStatus,
      isTransferInProgress,
      autoTransferActive: isAutoTransferActive,
      validationReady: editorValidationStatus.isReadyForTransfer,
    });

    // UI 브릿지를 우선 사용하여 전송 (더 정확한 검증 포함)
    // uiCanTransfer: UI 기준 전송 가능 여부 (에디터 데이터 검증 포함)
    // uiIsTransferring: UI 기준 전송 진행 상태
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

        // UI 브릿지 실패 시 기본 브릿지로 fallback
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
      // UI 브릿지가 준비되지 않았지만 기본 브릿지는 가능한 경우
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

  // 브릿지 상태 초기화: 오류나 문제 발생 시 브릿지를 초기 상태로 복원
  // 현재는 UI에서 사용되지 않지만 디버깅 목적으로 유지
  // const handleBridgeReset = useCallback(() => {
  //   console.log('🔄 [CONTAINER] 브릿지 상태 초기화');
  //
  //   // 🔍 [DEBUG] 브릿지 초기화 전 상태 기록
  //   console.group('🔄 [BRIDGE_DEBUG] 에디터 브릿지 상태 초기화');
  //   console.log('📊 [BRIDGE_DEBUG] 초기화 전 브릿지 상태:', {
  //     isTransferInProgress,
  //     transferCount,
  //     errorCount: transferErrorDetails.length,
  //     warningCount: transferWarningMessages.length,
  //     hasLastResult: !!lastTransferResult,
  //     autoTransferActive: isAutoTransferActive,
  //     timestamp: new Date().toISOString(),
  //   });
  //
  //   // UI 브릿지 초기화를 우선 사용
  //   uiResetBridgeState();
  //
  //   // 기본 브릿지도 초기화
  //   resetBridgeState();
  //
  //   console.log('✅ [BRIDGE_DEBUG] 에디터 브릿지 상태 초기화 완료');
  //   console.groupEnd();
  // }, [resetBridgeState, uiResetBridgeState, isTransferInProgress, transferCount, transferErrorDetails.length, transferWarningMessages.length, lastTransferResult, isAutoTransferActive]);

  // 자동 전송 토글: 사용자가 자동 전송 기능을 켜고 끌 수 있는 함수
  // 현재는 UI에서 사용되지 않지만 디버깅 목적으로 유지
  // const handleAutoTransferToggle = useCallback(() => {
  //   console.log('🎚️ [CONTAINER] 자동 전송 토글');
  //
  //   // 🔍 [DEBUG] 자동 전송 토글 상세 로깅
  //   console.group('🎚️ [BRIDGE_DEBUG] 에디터 자동 전송 토글');
  //   console.log('📊 [BRIDGE_DEBUG] 토글 전 상태:', {
  //     currentAutoTransferStatus: isAutoTransferActive,
  //     newStatus: !isAutoTransferActive,
  //     canTransfer: checkCanTransfer(),
  //     uiCanTransfer: uiCheckTransferStatus(),
  //     hasContent: currentContainers.length > 0 && currentParagraphs.length > 0,
  //     timestamp: new Date().toISOString(),
  //   });
  //
  //   toggleAutoTransfer();
  //
  //   console.log('✅ [BRIDGE_DEBUG] 에디터 자동 전송 토글 완료');
  //   console.groupEnd();
  // }, [toggleAutoTransfer, isAutoTransferActive, checkCanTransfer, uiCheckTransferStatus, currentContainers.length, currentParagraphs.length]);

  // 에디터 상태 변화 감지: 컨테이너, 문단 등의 변화를 추적
  useEffect(() => {
    console.log('🎛️ [CONTAINER] 에디터 상태 변화 감지:', {
      currentStep: currentEditorStep,
      containers: currentContainers.length,
      paragraphs: currentParagraphs.length,
    });

    // 🔍 [DEBUG] 에디터 상태 변화 상세 분석
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
      validationStatus: editorValidationStatus,
    });
    console.groupEnd();

    // 에디터 상태 변화 시 검증 상태 새로고침
    uiRefreshValidation();
  }, [
    currentEditorStep,
    currentContainers,
    currentParagraphs,
    isStepTransitioning,
    checkCanTransfer,
    uiCheckTransferStatus,
    isTransferInProgress,
    isAutoTransferActive,
    editorValidationStatus,
    uiRefreshValidation,
  ]);

  // 브릿지 전송 결과 처리: 데이터 전송 완료 후 결과를 확인하고 처리
  useEffect(() => {
    console.log('🌉 [CONTAINER] 브릿지 결과 변화 감지');

    // 🔍 [DEBUG] 브릿지 전송 결과 상세 분석
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
        // 성공 시 추가 처리 로직이 필요하다면 여기에 구현
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
        // 실패 시 오류 처리 로직
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
