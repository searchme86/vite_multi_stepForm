// src/components/multiStepForm/MultiStepFormContainer.tsx

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import type { StepNumber } from './types/stepTypes';
import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';
import { useBidirectionalBridge } from '../../bridges/hooks/useBidirectionalBridge';
import PreviewPanelContainer from '../previewPanel/PreviewPanelContainer';
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import DesktopPreviewLayout from './layout/desktop/DesktopPreviewLayout';
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';
import StepContentContainer from './animation/StepContentContainer';
import ToastManager from '../toaster/ToastManager';
import { renderStepComponent } from './types/stepTypes';
import { usePreviewPanelStore } from '../previewPanel/store/previewPanelStore';

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
    updateFormValue,
  } = useMultiStepFormState();

  const isPreviewPanelOpen = usePreviewPanelStore(
    (state) => state.isPreviewPanelOpen
  );

  const deviceType = usePreviewPanelStore((state) => state.deviceType);

  const currentFormValues = methods.getValues();
  const { editorCompletedContent = '', isEditorCompleted = false } =
    currentFormValues;

  const setEditorCompleted = useCallback(
    (completed: boolean) => {
      updateFormValue('isEditorCompleted', completed);
      console.log('🎯 [EDITOR_STATUS] 에디터 완료 상태 업데이트:', completed);
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
    transferErrors,
    transferWarnings,
    checkCanTransfer,
  } = useBidirectionalBridge(bridgeConfig);

  const logWithThrottle = useCallback(
    (message: string, data?: any) => {
      if (!bridgeDebugEnabled) return;

      const now = Date.now();
      const timeDifference = now - lastLogTimeRef.current;

      if (timeDifference > 10000) {
        console.log(message, data);
        lastLogTimeRef.current = now;
      }
    },
    [bridgeDebugEnabled]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, shiftKey, key } = event;

      if (ctrlKey && shiftKey && key === 'D') {
        event.preventDefault();
        setBridgeDebugEnabled((prevMode) => {
          const newMode = !prevMode;
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
    if (!bridgeDebugEnabled) {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = undefined;
      }
      return;
    }

    logIntervalRef.current = window.setInterval(() => {
      console.log('📈 [BRIDGE_SUMMARY] 브릿지 상태 요약', {
        isActive: checkCanTransfer(),
        lastUpdate: new Date().toLocaleTimeString(),
        status: isTransferInProgress ? 'transferring' : 'idle',
      });
    }, 30000);

    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = undefined;
      }
    };
  }, [bridgeDebugEnabled, checkCanTransfer, isTransferInProgress]);

  useEffect(() => {
    if (!bridgeDebugEnabled) return;

    logWithThrottle('📊 [BRIDGE_DEBUG] 멀티스텝 브릿지 실시간 상태', {
      transferStatus: isTransferInProgress ? 'active' : 'idle',
      canTransfer: checkCanTransfer(),
      errorCount: transferErrors?.length || 0,
      warningCount: transferWarnings?.length || 0,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [
    bridgeDebugEnabled,
    isTransferInProgress,
    checkCanTransfer,
    transferErrors,
    transferWarnings,
    logWithThrottle,
  ]);

  const handleStepChange = useCallback(
    (step: StepNumber) => {
      goToStep(step);
      console.log('🔄 [STEP_CHANGE] 스텝 변경:', step);
    },
    [goToStep]
  );

  const handleNextStep = useCallback(() => {
    goToNextStep();
    console.log('➡️ [STEP_NEXT] 다음 스텝으로 이동');
  }, [goToNextStep]);

  const handlePrevStep = useCallback(() => {
    goToPrevStep();
    console.log('⬅️ [STEP_PREV] 이전 스텝으로 이동');
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
          const {
            transformedContent,
            transformedIsCompleted,
            transformationSuccess,
          } = transferredData;
          console.log('📈 [BRIDGE_DEBUG] 변환된 콘텐츠 정보:', {
            hasTransformedContent: !!transformedContent,
            contentLength: transformedContent?.length || 0,
            isCompleted: transformedIsCompleted || false,
            transformationSuccess: transformationSuccess || false,
          });
        }
        console.groupEnd();
      }

      const { transformedContent, transformedIsCompleted } =
        transferredData || {};

      if (!transformedContent) {
        if (bridgeDebugEnabled) {
          console.warn('⚠️ [BRIDGE_DEBUG] 수신된 데이터에 변환된 콘텐츠 없음');
        }
        return;
      }

      if (bridgeDebugEnabled) {
        console.log('🔄 [BRIDGE_DEBUG] 폼 데이터 업데이트 시작');
      }

      updateFormValue('editorCompletedContent', transformedContent);

      const completionStatus = transformedIsCompleted || false;
      setEditorCompleted(completionStatus);

      if (transformedIsCompleted) {
        goToNextStep();
      }
    },
    [updateFormValue, setEditorCompleted, goToNextStep, bridgeDebugEnabled]
  );

  const renderCurrentStep = useCallback(() => {
    return renderStepComponent(currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (!lastTransferResult) return;

    const { operationSuccess, transferredData, operationErrors } =
      lastTransferResult;

    if (operationSuccess && transferredData) {
      handleBridgeDataReceived(transferredData);
      return;
    }

    if (!operationSuccess && bridgeDebugEnabled) {
      console.error('❌ [BRIDGE_DEBUG] 브릿지 데이터 수신 실패:', {
        operationSuccess,
        errorCount: operationErrors.length,
        errors: operationErrors,
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

  console.log('🎯 [MULTISTEP_RENDER] 렌더링 상태:', {
    isPreviewPanelOpen,
    deviceType,
    currentStep,
    timestamp: new Date().toISOString(),
  });

  return (
    <div className="relative">
      {bridgeDebugEnabled ? (
        <div className="fixed z-50 px-3 py-1 text-sm text-yellow-700 bg-yellow-100 border border-yellow-400 rounded debug-indicator top-4 right-4">
          🔧 BRIDGE DEBUG MODE
        </div>
      ) : null}

      <div className="mx-auto max-w-[1200px] sm:p-4 md:p-8 mb-xs:w-[300px] mb-sm:w-[350px] mb-md:w-[400px] mb-lg:w-[400px] mb-xl:w-[450px] tb:w-[1200px]">
        <FormHeaderContainer />

        <div className="w-full">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="block w-full">
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
        </div>

        <ToastManager />
      </div>

      <ResponsivePreviewPanelOverlay
        isOpen={isPreviewPanelOpen}
        deviceType={deviceType}
      />

      {bridgeDebugEnabled ? (
        <DebugPanel
          isTransferInProgress={isTransferInProgress}
          checkCanTransfer={checkCanTransfer}
          transferErrors={transferErrors}
          transferWarnings={transferWarnings}
          isPreviewPanelOpen={isPreviewPanelOpen}
          onClose={() => setBridgeDebugEnabled(false)}
        />
      ) : null}
    </div>
  );
}

interface ResponsivePreviewPanelOverlayProps {
  isOpen: boolean;
  deviceType: 'mobile' | 'desktop';
}

function ResponsivePreviewPanelOverlay({
  isOpen,
  deviceType,
}: ResponsivePreviewPanelOverlayProps): React.ReactNode {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  console.log('🎯 [OVERLAY] 애니메이션 상태:', {
    isOpen,
    isVisible,
    shouldAnimate,
    deviceType,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    if (isOpen) {
      // 🎬 열기: 확실한 시간 지연으로 첫 번째 열기부터 부드러운 애니메이션 보장
      setIsVisible(true);
      console.log('🎬 [ANIMATION] DOM 추가 완료');

      // 🕐 확실한 50ms 지연: 브라우저가 DOM 렌더링과 초기 상태를 완전히 인식하도록 대기
      const openTimeoutId = setTimeout(() => {
        setShouldAnimate(true);
        console.log('🎬 [ANIMATION] 열기 애니메이션 시작 - 50ms 지연 적용');
      }, 50);

      return () => clearTimeout(openTimeoutId);
    }

    // 🎬 닫기: 애니메이션 먼저 실행 후 DOM 제거
    setShouldAnimate(false);
    console.log('🎬 [ANIMATION] 닫기 애니메이션 시작');

    const closeTimeoutId = setTimeout(() => {
      setIsVisible(false);
      console.log('🎬 [ANIMATION] DOM 제거 완료');
    }, 1300);

    return () => clearTimeout(closeTimeoutId);
  }, [isOpen]);

  if (!isVisible) {
    console.log('🚫 [OVERLAY] DOM에서 제거됨');
    return null;
  }

  const isMobile = deviceType === 'mobile';

  return (
    <>
      <BackgroundOverlay isMobile={isMobile} shouldAnimate={shouldAnimate} />

      <div
        className={`
          ${
            isMobile
              ? `preview-panel-bottom-sheet ${shouldAnimate ? 'is-open' : ''}`
              : `preview-panel-desktop-overlay ${
                  shouldAnimate ? 'is-open' : ''
                }`
          }
        `}
      >
        <PreviewPanelContainer />
      </div>
    </>
  );
}

interface BackgroundOverlayProps {
  isMobile: boolean;
  shouldAnimate: boolean;
}

function BackgroundOverlay({
  isMobile,
  shouldAnimate,
}: BackgroundOverlayProps): React.ReactNode {
  const handleBackgroundClick = usePreviewPanelStore(
    (state) => state.handleBackgroundClick
  );

  return (
    <div
      className={`
        ${
          isMobile
            ? `preview-panel-mobile-backdrop ${
                shouldAnimate ? 'is-visible' : ''
              }`
            : `preview-panel-desktop-backdrop ${
                shouldAnimate ? 'is-visible' : ''
              }`
        }
      `}
      onClick={handleBackgroundClick}
    />
  );
}

interface DebugPanelProps {
  isTransferInProgress: boolean;
  checkCanTransfer: () => boolean;
  transferErrors?: any[];
  transferWarnings?: any[];
  isPreviewPanelOpen: boolean;
  onClose: () => void;
}

function DebugPanel({
  isTransferInProgress,
  checkCanTransfer,
  transferErrors = [],
  transferWarnings = [],
  isPreviewPanelOpen,
  onClose,
}: DebugPanelProps): React.ReactNode {
  const canTransferStatus = checkCanTransfer();

  return (
    <div className="fixed z-50 max-w-sm p-4 bg-gray-100 border border-gray-300 rounded debug-panel bottom-4 right-4">
      <h3 className="mb-2 text-sm font-semibold">🌉 Bridge Status</h3>
      <div className="space-y-1 text-xs">
        <div>
          Status:{' '}
          <span
            className={`font-mono ${
              canTransferStatus ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isTransferInProgress ? 'transferring' : 'idle'}
          </span>
        </div>
        <div>
          Can Transfer:{' '}
          <span
            className={canTransferStatus ? 'text-green-600' : 'text-red-600'}
          >
            {canTransferStatus ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          Errors: <span className="text-red-600">{transferErrors.length}</span>
        </div>
        <div>
          Warnings:{' '}
          <span className="text-yellow-600">{transferWarnings.length}</span>
        </div>
        <div>
          Preview Panel:{' '}
          <span
            className={isPreviewPanelOpen ? 'text-green-600' : 'text-red-600'}
          >
            {isPreviewPanelOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="px-2 py-1 mt-2 text-xs bg-gray-200 rounded hover:bg-gray-300"
        type="button"
      >
        Close Debug
      </button>
    </div>
  );
}

export default MultiStepFormContainer;
