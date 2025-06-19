// MultiStepFormContainer.tsx

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Card, CardBody } from '@heroui/react';

import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';
import { useEditorMultiStepBridge } from '../../bridges/editorMultiStepBridge/useEditorMultiStepBridge';

import PreviewPanel from '../previewPanel/PreviewPanelContainer';

import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import DesktopPreviewLayout from './layout/desktop/DesktopPreviewLayout';

import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';

import StepContentContainer from './animation/StepContentContainer';

import ToastManager from '../toaster/ToastManager';

import { StepNumber, renderStepComponent } from './types/stepTypes';

function MultiStepFormContainer(): React.ReactNode {
  const [bridgeDebugEnabled, setBridgeDebugEnabled] = useState(false);
  const lastLogTimeRef = useRef<number>(0);
  const logIntervalRef = useRef<number>();

  const {
    methods,
    handleSubmit,
    onSubmit,
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    showPreview,
    togglePreview,
    updateFormValue,
  } = useMultiStepFormState();

  const currentFormValues = methods.getValues();
  const editorCompletedContent = currentFormValues.editorCompletedContent || '';
  const isEditorCompleted = currentFormValues.isEditorCompleted || false;

  const setEditorCompleted = useCallback(
    (completed: boolean) => {
      updateFormValue('isEditorCompleted', completed);
    },
    [updateFormValue]
  );

  const bridgeConfig = {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'lenient' as const,
    debugMode: bridgeDebugEnabled,
  };

  const {
    isTransferInProgress,
    lastTransferResult,
    transferErrorDetails,
    transferWarningMessages,
    checkCanTransfer,
  } = useEditorMultiStepBridge(bridgeConfig);

  const logWithThrottle = useCallback(
    (message: string, data?: any) => {
      if (!bridgeDebugEnabled) return;

      const now = Date.now();
      if (now - lastLogTimeRef.current > 10000) {
        console.log(message, data);
        lastLogTimeRef.current = now;
      }
    },
    [bridgeDebugEnabled]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setBridgeDebugEnabled((prev) => {
          const newMode = !prev;
          console.log(
            `🔧 [DEBUG] 브릿지 디버그 모드: ${newMode ? '활성화' : '비활성화'}`
          );
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (bridgeDebugEnabled) {
      logIntervalRef.current = setInterval(() => {
        console.log('📈 [BRIDGE_SUMMARY] 브릿지 상태 요약', {
          isActive: checkCanTransfer(),
          lastUpdate: new Date().toLocaleTimeString(),
          status: isTransferInProgress ? 'transferring' : 'idle',
        });
      }, 30000);
    } else {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
    }

    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
      }
    };
  }, [bridgeDebugEnabled, checkCanTransfer, isTransferInProgress]);

  if (bridgeDebugEnabled) {
    logWithThrottle('📊 [BRIDGE_DEBUG] 멀티스텝 브릿지 실시간 상태', {
      transferStatus: isTransferInProgress ? 'active' : 'idle',
      canTransfer: checkCanTransfer(),
      errorCount: transferErrorDetails?.length || 0,
      warningCount: transferWarningMessages?.length || 0,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  const handleStepChange = React.useCallback(
    (step: StepNumber) => {
      goToStep(step);
    },
    [goToStep]
  );

  const handlePreviewToggle = React.useCallback(() => {
    togglePreview();
  }, [togglePreview]);

  const handleNextStep = React.useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const handlePrevStep = React.useCallback(() => {
    goToPrevStep();
  }, [goToPrevStep]);

  const handleBridgeDataReceived = useCallback(
    (transferredData: any) => {
      if (bridgeDebugEnabled) {
        console.group('📋 [BRIDGE_DEBUG] 브릿지 데이터 수신 상세 분석');
        console.log('📊 [BRIDGE_DEBUG] 수신 데이터 기본 정보:', {
          hasData: !!transferredData,
          dataType: typeof transferredData,
          dataKeys: transferredData ? Object.keys(transferredData) : [],
          timestamp: new Date().toISOString(),
        });

        if (transferredData) {
          console.log('📈 [BRIDGE_DEBUG] 변환된 콘텐츠 정보:', {
            hasTransformedContent: !!transferredData.transformedContent,
            contentLength: transferredData.transformedContent?.length || 0,
            isCompleted: transferredData.transformedIsCompleted || false,
            transformationSuccess:
              transferredData.transformationSuccess || false,
          });
        }
        console.groupEnd();
      }

      if (transferredData?.transformedContent) {
        if (bridgeDebugEnabled) {
          console.log('🔄 [BRIDGE_DEBUG] 폼 데이터 업데이트 시작');
        }

        updateFormValue(
          'editorCompletedContent',
          transferredData.transformedContent
        );

        const completionStatus =
          transferredData.transformedIsCompleted || false;
        setEditorCompleted(completionStatus);

        if (transferredData.transformedIsCompleted) {
          goToNextStep();
        }
      } else if (bridgeDebugEnabled) {
        console.warn('⚠️ [BRIDGE_DEBUG] 수신된 데이터에 변환된 콘텐츠 없음');
      }
    },
    [updateFormValue, setEditorCompleted, goToNextStep, bridgeDebugEnabled]
  );

  const renderCurrentStep = React.useCallback(() => {
    return renderStepComponent(currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (
      lastTransferResult?.operationSuccess &&
      lastTransferResult.transferredData
    ) {
      handleBridgeDataReceived(lastTransferResult.transferredData);
    } else if (
      lastTransferResult &&
      !lastTransferResult.operationSuccess &&
      bridgeDebugEnabled
    ) {
      console.error('❌ [BRIDGE_DEBUG] 브릿지 데이터 수신 실패:', {
        operationSuccess: lastTransferResult.operationSuccess,
        errorCount: lastTransferResult.operationErrors.length,
        errors: lastTransferResult.operationErrors,
      });
    }
  }, [lastTransferResult, handleBridgeDataReceived, bridgeDebugEnabled]);

  useEffect(() => {
    if (bridgeDebugEnabled && isEditorCompleted && editorCompletedContent) {
      console.log(
        '🎉 [BRIDGE_DEBUG] 에디터 데이터 완전 수신 완료 - 멀티스텝 폼 준비됨'
      );
    }
  }, [
    editorCompletedContent,
    isEditorCompleted,
    currentStep,
    bridgeDebugEnabled,
  ]);

  return (
    <div className=" p-2 mx-auto w-[1200px] max-w-[1200px] sm:p-4 md:p-8 md:w-[400px]">
      {bridgeDebugEnabled && (
        <div className="fixed z-50 px-3 py-1 text-sm text-yellow-700 bg-yellow-100 border border-yellow-400 rounded debug-indicator top-4 right-4">
          🔧 BRIDGE DEBUG MODE
        </div>
      )}

      <FormHeaderContainer
        showPreview={showPreview}
        onTogglePreview={handlePreviewToggle}
      />

      <DesktopPreviewLayout>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <StepNavigationWrapper
              currentStep={currentStep}
              progressWidth={progressWidth}
              onStepChange={handleStepChange}
            />

            <StepContentContainer currentStep={currentStep}>
              {renderCurrentStep()}
            </StepContentContainer>

            <NavigationButtons
              currentStep={currentStep}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          </form>
        </FormProvider>
      </DesktopPreviewLayout>

      {showPreview && (
        <div className="hidden md:block w-full lg:w-1/2 h-[500px] lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
          <Card className="h-full shadow-sm">
            <CardBody className="p-3 sm:p-6">
              <PreviewPanel />
            </CardBody>
          </Card>
        </div>
      )}

      <div className="md:hidden">
        <PreviewPanel />
      </div>

      {bridgeDebugEnabled && (
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
                {transferErrorDetails?.length || 0}
              </span>
            </div>
            <div>
              Warnings:{' '}
              <span className="text-yellow-600">
                {transferWarningMessages?.length || 0}
              </span>
            </div>
          </div>
          <button
            onClick={() => setBridgeDebugEnabled(false)}
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
