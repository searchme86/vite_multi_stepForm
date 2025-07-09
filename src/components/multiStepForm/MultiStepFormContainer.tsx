// src/components/multiStepForm/MultiStepFormContainer.tsx

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';
import { useBidirectionalBridge } from '../../bridges/hooks/useBidirectionalBridge';
import PreviewPanelContainer from '../previewPanel/PreviewPanelContainer';
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import DesktopPreviewLayout from './layout/desktop/DesktopPreviewLayout';
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';
import StepContentContainer from './animation/StepContentContainer';
import ToastManager from '../toaster/ToastManager';
import { StepNumber, renderStepComponent } from './types/stepTypes';

// Zustand 미리보기 패널 스토어 import
import { usePreviewPanelStore } from '../previewPanel/store/previewPanelStore';

function MultiStepFormContainer(): React.ReactNode {
  console.log('🏗️ [MULTI_STEP_FORM_CONTAINER] 컴포넌트 렌더링 시작');

  const [bridgeDebugModeEnabled, setBridgeDebugModeEnabled] = useState(false);
  const lastLogTimeRef = useRef<number>(0);
  const logIntervalRef = useRef<number>();

  // 기존 멀티스텝 폼 상태 (showPreview, togglePreview 제외)
  const {
    methods,
    handleSubmit,
    onSubmit,
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    updateFormValue,
  } = useMultiStepFormState();

  // Zustand에서 미리보기 패널 상태 구독 (디버깅 로그 추가)
  const previewPanelOpenStatus = usePreviewPanelStore((state) => {
    console.log(
      '🔍 [MULTI_STEP_FORM_CONTAINER] Zustand 상태 구독 - isPreviewPanelOpen:',
      state.isPreviewPanelOpen
    );
    return state.isPreviewPanelOpen;
  });

  // 폼 데이터 가져오기 (구조분해할당 사용)
  const currentFormValues = methods.getValues();
  const { editorCompletedContent = '', isEditorCompleted = false } =
    currentFormValues;

  console.log('📊 [MULTI_STEP_FORM_CONTAINER] 현재 폼 상태:', {
    currentStep,
    progressWidth,
    previewPanelOpenStatus,
    editorCompletedContent: editorCompletedContent.length > 0 ? '있음' : '없음',
    isEditorCompleted,
    renderTime: new Date().toLocaleTimeString(),
  });

  const setEditorCompletedStatus = useCallback(
    (completedStatus: boolean) => {
      console.log(
        '✏️ [MULTI_STEP_FORM_CONTAINER] 에디터 완료 상태 설정:',
        completedStatus
      );
      updateFormValue('isEditorCompleted', completedStatus);
    },
    [updateFormValue]
  );

  const bridgeConfigurationSettings = {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'lenient' as const,
    debugMode: bridgeDebugModeEnabled,
  };

  const {
    isTransferInProgress,
    lastTransferResult,
    transferErrors,
    transferWarnings,
    checkCanTransfer,
  } = useBidirectionalBridge(bridgeConfigurationSettings);

  const logWithThrottleControl = useCallback(
    (message: string, data?: any) => {
      const shouldSkipLogging = !bridgeDebugModeEnabled;
      if (shouldSkipLogging) return;

      const currentTime = Date.now();
      const shouldLogWithThrottle =
        currentTime - lastLogTimeRef.current > 10000;

      if (shouldLogWithThrottle) {
        console.log(message, data);
        lastLogTimeRef.current = currentTime;
      }
    },
    [bridgeDebugModeEnabled]
  );

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      const isDebugShortcut =
        event.ctrlKey && event.shiftKey && event.key === 'D';

      if (isDebugShortcut) {
        event.preventDefault();
        setBridgeDebugModeEnabled((previousMode) => {
          const newMode = !previousMode;
          console.log(
            `🔧 [MULTI_STEP_FORM_CONTAINER] 브릿지 디버그 모드: ${
              newMode ? '활성화' : '비활성화'
            }`
          );
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  useEffect(() => {
    const shouldStartDebugLogging = bridgeDebugModeEnabled;

    if (shouldStartDebugLogging) {
      logIntervalRef.current = setInterval(() => {
        console.log('📈 [MULTI_STEP_FORM_CONTAINER] 브릿지 상태 요약', {
          isActive: checkCanTransfer(),
          lastUpdate: new Date().toLocaleTimeString(),
          status: isTransferInProgress ? 'transferring' : 'idle',
        });
      }, 30000);
    } else {
      const shouldClearInterval = logIntervalRef.current;
      if (shouldClearInterval) {
        clearInterval(logIntervalRef.current);
      }
    }

    return () => {
      const shouldCleanupInterval = logIntervalRef.current;
      if (shouldCleanupInterval) {
        clearInterval(logIntervalRef.current);
      }
    };
  }, [bridgeDebugModeEnabled, checkCanTransfer, isTransferInProgress]);

  const shouldShowBridgeDebugInfo = bridgeDebugModeEnabled;
  if (shouldShowBridgeDebugInfo) {
    logWithThrottleControl(
      '📊 [MULTI_STEP_FORM_CONTAINER] 멀티스텝 브릿지 실시간 상태',
      {
        transferStatus: isTransferInProgress ? 'active' : 'idle',
        canTransfer: checkCanTransfer(),
        errorCount: transferErrors?.length || 0,
        warningCount: transferWarnings?.length || 0,
        timestamp: new Date().toLocaleTimeString(),
      }
    );
  }

  const handleStepChangeNavigation = useCallback(
    (targetStep: StepNumber) => {
      console.log('🎯 [MULTI_STEP_FORM_CONTAINER] 스텝 변경 요청:', targetStep);
      goToStep(targetStep);
    },
    [goToStep]
  );

  const handleNextStepNavigation = useCallback(() => {
    console.log('➡️ [MULTI_STEP_FORM_CONTAINER] 다음 스텝 이동 요청');
    goToNextStep();
  }, [goToNextStep]);

  const handlePreviousStepNavigation = useCallback(() => {
    console.log('⬅️ [MULTI_STEP_FORM_CONTAINER] 이전 스텝 이동 요청');
    goToPrevStep();
  }, [goToPrevStep]);

  const handleBridgeDataReceivedFromTransfer = useCallback(
    (transferredData: any) => {
      const shouldShowDebugInfo = bridgeDebugModeEnabled;

      if (shouldShowDebugInfo) {
        console.group(
          '📋 [MULTI_STEP_FORM_CONTAINER] 브릿지 데이터 수신 상세 분석'
        );
        console.log('📊 [MULTI_STEP_FORM_CONTAINER] 수신 데이터 기본 정보:', {
          hasData: !!transferredData,
          dataType: typeof transferredData,
          dataKeys: transferredData ? Object.keys(transferredData) : [],
          timestamp: new Date().toISOString(),
        });

        const hasTransferredData = !!transferredData;
        if (hasTransferredData) {
          console.log('📈 [MULTI_STEP_FORM_CONTAINER] 변환된 콘텐츠 정보:', {
            hasTransformedContent: !!transferredData.transformedContent,
            contentLength: transferredData.transformedContent?.length || 0,
            isCompleted: transferredData.transformedIsCompleted || false,
            transformationSuccess:
              transferredData.transformationSuccess || false,
          });
        }
        console.groupEnd();
      }

      const hasValidTransformedContent = transferredData?.transformedContent;
      if (hasValidTransformedContent) {
        const shouldShowUpdateInfo = bridgeDebugModeEnabled;
        if (shouldShowUpdateInfo) {
          console.log('🔄 [MULTI_STEP_FORM_CONTAINER] 폼 데이터 업데이트 시작');
        }

        updateFormValue(
          'editorCompletedContent',
          transferredData.transformedContent
        );

        const completionStatus =
          transferredData.transformedIsCompleted || false;
        setEditorCompletedStatus(completionStatus);

        const shouldGoToNextStep = transferredData.transformedIsCompleted;
        if (shouldGoToNextStep) {
          goToNextStep();
        }
      } else {
        const shouldShowWarning = bridgeDebugModeEnabled;
        if (shouldShowWarning) {
          console.warn(
            '⚠️ [MULTI_STEP_FORM_CONTAINER] 수신된 데이터에 변환된 콘텐츠 없음'
          );
        }
      }
    },
    [
      updateFormValue,
      setEditorCompletedStatus,
      goToNextStep,
      bridgeDebugModeEnabled,
    ]
  );

  const renderCurrentStepContent = useCallback(() => {
    console.log(
      '🎨 [MULTI_STEP_FORM_CONTAINER] 현재 스텝 콘텐츠 렌더링:',
      currentStep
    );
    return renderStepComponent(currentStep);
  }, [currentStep]);

  useEffect(() => {
    const hasSuccessfulTransferResult =
      lastTransferResult?.operationSuccess &&
      lastTransferResult.transferredData;
    const hasFailedTransferResult =
      lastTransferResult && !lastTransferResult.operationSuccess;

    if (hasSuccessfulTransferResult) {
      handleBridgeDataReceivedFromTransfer(lastTransferResult.transferredData);
    } else if (hasFailedTransferResult) {
      const shouldShowErrorInfo = bridgeDebugModeEnabled;
      if (shouldShowErrorInfo) {
        console.error(
          '❌ [MULTI_STEP_FORM_CONTAINER] 브릿지 데이터 수신 실패:',
          {
            operationSuccess: lastTransferResult.operationSuccess,
            errorCount: lastTransferResult.operationErrors.length,
            errors: lastTransferResult.operationErrors,
          }
        );
      }
    }
  }, [
    lastTransferResult,
    handleBridgeDataReceivedFromTransfer,
    bridgeDebugModeEnabled,
  ]);

  useEffect(() => {
    const hasCompletedEditorContent =
      bridgeDebugModeEnabled && isEditorCompleted && editorCompletedContent;

    if (hasCompletedEditorContent) {
      console.log(
        '🎉 [MULTI_STEP_FORM_CONTAINER] 에디터 데이터 완전 수신 완료 - 멀티스텝 폼 준비됨'
      );
    }
  }, [
    editorCompletedContent,
    isEditorCompleted,
    currentStep,
    bridgeDebugModeEnabled,
  ]);

  return (
    <div className="mx-auto max-w-[1200px] sm:p-4 md:p-8 mb-xs:w-[300px] mb-sm:w-[350px] mb-md:w-[400px] mb-lg:w-[400px] mb-xl:w-[450px] tb:w-[1200px]">
      {bridgeDebugModeEnabled && (
        <div className="fixed z-50 px-3 py-1 text-sm text-yellow-700 bg-yellow-100 border border-yellow-400 rounded debug-indicator top-4 right-4">
          🔧 BRIDGE DEBUG MODE
        </div>
      )}

      {/* Props 제거 완료 - 더 이상 showPreview, onTogglePreview 전달 불필요 */}
      <FormHeaderContainer />

      <DesktopPreviewLayout>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="block w-full">
            <StepNavigationWrapper
              currentStep={currentStep}
              progressWidth={progressWidth}
              onStepChange={handleStepChangeNavigation}
            />

            <StepContentContainer currentStep={currentStep}>
              {renderCurrentStepContent()}
            </StepContentContainer>

            <NavigationButtons
              currentStep={currentStep}
              onNext={handleNextStepNavigation}
              onPrev={handlePreviousStepNavigation}
            />
          </form>
        </FormProvider>

        {/* 데스크탑 미리보기 - 조건부 렌더링 */}
        {previewPanelOpenStatus && (
          <div className="top-0 hidden md:block lg:sticky h-svh">
            <PreviewPanelContainer />
          </div>
        )}
      </DesktopPreviewLayout>

      {/* 모바일 미리보기 - 항상 렌더링 (내부에서 상태 제어) */}
      <div className="md:hidden">
        <PreviewPanelContainer />
      </div>

      {bridgeDebugModeEnabled && (
        <div className="fixed z-50 max-w-sm p-4 bg-gray-100 border border-gray-300 rounded debug-panel bottom-4 right-4">
          <h3 className="mb-2 text-sm font-semibold">🌉 Bridge Status</h3>
          <div className="space-y-1 text-xs">
            <div>
              Status:{' '}
              <span
                className={`font-mono ${
                  checkCanTransfer() ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isTransferInProgress ? 'transferring' : 'idle'}
              </span>
            </div>
            <div>
              Can Transfer:{' '}
              <span
                className={
                  checkCanTransfer() ? 'text-green-600' : 'text-red-600'
                }
              >
                {checkCanTransfer() ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              Errors:{' '}
              <span className="text-red-600">
                {transferErrors?.length || 0}
              </span>
            </div>
            <div>
              Warnings:{' '}
              <span className="text-yellow-600">
                {transferWarnings?.length || 0}
              </span>
            </div>
            <div>
              Preview Panel:{' '}
              <span
                className={
                  previewPanelOpenStatus ? 'text-green-600' : 'text-red-600'
                }
              >
                {previewPanelOpenStatus ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setBridgeDebugModeEnabled(false)}
            className="px-2 py-1 mt-2 text-xs bg-gray-200 rounded hover:bg-gray-300"
            type="button"
          >
            Close Debug
          </button>
        </div>
      )}

      <ToastManager />
    </div>
  );
}

export default MultiStepFormContainer;
