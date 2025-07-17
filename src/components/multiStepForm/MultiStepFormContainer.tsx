// src/components/multiStepForm/MultiStepFormContainer.tsx

import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from 'react';
import { FormProvider } from 'react-hook-form';
import type { StepNumber } from './types/stepTypes';
import {
  renderStepComponent,
  isValidStepNumber,
  getMinStep,
} from './types/stepTypes';
import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';
import { useBidirectionalBridge } from '../../bridges/hooks/useBidirectionalBridge';
import PreviewPanelContainer from '../previewPanel/PreviewPanelContainer';
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';
import StepContentContainer from './animation/StepContentContainer';
import ToastManager from '../toaster/ToastManager';
import { usePreviewPanelStore } from '../previewPanel/store/previewPanelStore';

interface TransferResult {
  operationSuccess: boolean;
  transferredData: TransferredDataStructure;
  timestamp: string;
  transferId: string;
}

interface TransferredDataStructure {
  transformedContent: string;
  transformedIsCompleted: boolean;
  metadata?: {
    contentLength: number;
    lastModified: string;
    version: string;
  };
}

// 🔧 브릿지 설정 타입 정의 (타입단언 없음)
interface BridgeConfiguration {
  enableAutoTransfer: boolean;
  enableValidation: boolean;
  enableErrorRecovery: boolean;
  validationMode: 'strict' | 'lenient' | 'permissive';
  debugMode: boolean;
}

function MultiStepFormContainer(): React.ReactNode {
  const [bridgeDebugEnabled, setBridgeDebugEnabled] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const logIntervalRef = useRef<number>();
  const isFirstRenderRef = useRef<boolean>(true);
  const lastTransferResultRef = useRef<TransferResult | null>(null);

  console.log('🔄 [MULTISTEP_DEBUG] 컴포넌트 렌더링 시작');

  // 🔧 훅 결과를 안전하게 가져오기
  const hookResult = useMultiStepFormState();
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
  } = hookResult;

  // 🔧 isHookInitialized 안전하게 가져오기 (TypeScript 호환성)
  const isHookInitialized = useMemo(() => {
    // hookResult에 isHookInitialized 속성이 있는지 확인
    const hasIsHookInitialized = 'isHookInitialized' in hookResult;

    if (hasIsHookInitialized) {
      const isInitialized = hookResult.isHookInitialized;
      console.log(
        '✅ [MULTISTEP_DEBUG] isHookInitialized 속성 발견:',
        isInitialized
      );
      return typeof isInitialized === 'boolean' ? isInitialized : true;
    }

    // 속성이 없으면 currentStep 유효성으로 판단
    const isValidStep =
      currentStep !== null &&
      currentStep !== undefined &&
      isValidStepNumber(currentStep);
    console.log(
      '🔧 [MULTISTEP_DEBUG] isHookInitialized 속성 없음, currentStep으로 판단:',
      {
        currentStep,
        isValidStep,
      }
    );

    return isValidStep;
  }, [hookResult, currentStep]);

  // 🔧 개별 스토어 selector로 무한 리렌더링 방지
  const isPreviewPanelOpen = usePreviewPanelStore(
    useCallback((state) => state?.isPreviewPanelOpen ?? false, [])
  );
  const deviceType = usePreviewPanelStore(
    useCallback((state) => state?.deviceType ?? 'desktop', [])
  );

  // 🔧 currentStep 안전성 확인 (useMultiStepFormState에서 이미 검증되었지만 추가 안전장치)
  const safeCurrentStep = useMemo(() => {
    console.log('🔍 [MULTISTEP_DEBUG] currentStep 최종 안전성 확인:', {
      currentStep,
      stepType: typeof currentStep,
      isHookInitialized,
      timestamp: new Date().toISOString(),
    });

    // 🔧 useMultiStepFormState에서 이미 안전한 값을 반환하므로 그대로 사용
    // 하지만 추가 안전장치로 한 번 더 체크
    const isValidStep =
      currentStep !== null &&
      currentStep !== undefined &&
      isValidStepNumber(currentStep);

    if (!isValidStep) {
      console.warn(
        '⚠️ [MULTISTEP_DEBUG] currentStep 추가 안전장치 발동, fallback 적용'
      );
      const fallbackStep = getMinStep();
      return fallbackStep;
    }

    return currentStep;
  }, [currentStep, isHookInitialized]);

  console.log('📊 [MULTISTEP_DEBUG] 스토어 상태:', {
    isPreviewPanelOpen,
    deviceType,
    currentStep,
    safeCurrentStep,
    isInitialLoading,
    isHookInitialized,
    timestamp: new Date().toISOString(),
  });

  // 🔧 초기 로딩 완료 처리 (훅 초기화 상태 기반)
  useEffect(() => {
    const shouldCompleteInitialLoading = isHookInitialized && isInitialLoading;

    if (shouldCompleteInitialLoading) {
      console.log('✅ [MULTISTEP_DEBUG] 훅 초기화 기반 로딩 완료:', {
        currentStep,
        safeCurrentStep,
        isHookInitialized,
        timestamp: new Date().toISOString(),
      });
      setIsInitialLoading(false);
    }
  }, [isHookInitialized, isInitialLoading, currentStep, safeCurrentStep]);

  // 🔧 첫 렌더링 시에만 디버깅 로그 출력 (의존성 없음)
  useEffect(() => {
    if (isFirstRenderRef.current) {
      console.log('🎯 [MULTISTEP_DEBUG] 초기 렌더링 완료:', {
        currentStep,
        safeCurrentStep,
        progressWidth,
        isPreviewPanelOpen,
        deviceType,
        isInitialLoading,
        isHookInitialized,
        timestamp: new Date().toISOString(),
      });
      isFirstRenderRef.current = false;
    }
  }, []); // 의존성 없음 - 한 번만 실행

  // 🔧 에디터 완료 상태 업데이트 함수 (안정화)
  const setEditorCompletedStatus = useCallback(
    (completedStatus: boolean) => {
      if (bridgeDebugEnabled) {
        console.log('🎯 [MULTISTEP_DEBUG] 에디터 완료 상태 업데이트:', {
          completedStatus,
          timestamp: new Date().toISOString(),
        });
      }

      // 🔧 updateFormValue 함수 안전성 확인
      if (typeof updateFormValue === 'function') {
        updateFormValue('isEditorCompleted', completedStatus);
      } else {
        console.error(
          '❌ [MULTISTEP_DEBUG] updateFormValue 함수를 찾을 수 없음'
        );
      }
    },
    [updateFormValue, bridgeDebugEnabled]
  );

  // 🔧 브릿지 설정 (타입단언 없음)
  const bridgeConfig = useMemo<BridgeConfiguration>(() => {
    const config: BridgeConfiguration = {
      enableAutoTransfer: false,
      enableValidation: true,
      enableErrorRecovery: true,
      validationMode: 'lenient', // 리터럴 타입 직접 사용
      debugMode: bridgeDebugEnabled,
    };
    return config;
  }, [bridgeDebugEnabled]);

  // 🔧 필요한 브릿지 훅 결과만 추출 (미사용 변수 제거)
  const { isTransferInProgress, lastTransferResult } =
    useBidirectionalBridge(bridgeConfig);

  // 🔧 키보드 이벤트 핸들러 (의존성 없음)
  useEffect(() => {
    const handleKeyboardShortcut = (keyboardEvent: KeyboardEvent) => {
      const {
        ctrlKey = false,
        shiftKey = false,
        key = '',
      } = keyboardEvent ?? {};
      const isDebugShortcut = ctrlKey && shiftKey && key === 'D';

      if (isDebugShortcut) {
        keyboardEvent.preventDefault();
        setBridgeDebugEnabled((prev) => {
          const newMode = !prev;
          console.log('🔧 [MULTISTEP_DEBUG] 디버그 모드 전환:', {
            previousMode: prev,
            newMode,
          });
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, []); // 의존성 없음

  // 🔧 디버그 로그 인터벌 관리 (안정화)
  useEffect(() => {
    if (!bridgeDebugEnabled) {
      const currentIntervalId = logIntervalRef.current;
      if (currentIntervalId) {
        clearInterval(currentIntervalId);
        logIntervalRef.current = undefined;
        console.log('🛑 [MULTISTEP_DEBUG] 디버그 로그 인터벌 정리');
      }
      return;
    }

    const debugLogInterval = window.setInterval(() => {
      const currentFormData = methods?.getValues?.();
      const hasFormData =
        currentFormData && Object.keys(currentFormData).length > 0;

      console.log('📈 [MULTISTEP_DEBUG] 브릿지 상태 요약', {
        lastUpdate: new Date().toLocaleTimeString(),
        currentStep,
        safeCurrentStep,
        hasFormData: !!hasFormData,
        isTransferInProgress,
        isHookInitialized,
      });
    }, 30000);

    logIntervalRef.current = debugLogInterval;

    return () => {
      if (logIntervalRef.current) {
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = undefined;
      }
    };
  }, [
    bridgeDebugEnabled,
    currentStep,
    safeCurrentStep,
    methods,
    isTransferInProgress,
    isHookInitialized,
  ]);

  // 🔧 스텝 변경 핸들러 (안정화)
  const handleStepNavigation = useCallback(
    (targetStep: StepNumber) => {
      if (bridgeDebugEnabled) {
        console.log('🔄 [MULTISTEP_DEBUG] 스텝 변경 요청:', {
          previousStep: safeCurrentStep,
          targetStep,
          timestamp: new Date().toISOString(),
        });
      }

      // 🔧 goToStep 함수 안전성 확인
      if (typeof goToStep === 'function') {
        goToStep(targetStep);
      } else {
        console.error('❌ [MULTISTEP_DEBUG] goToStep 함수를 찾을 수 없음');
      }
    },
    [goToStep, bridgeDebugEnabled, safeCurrentStep]
  );

  // 🔧 다음 스텝 이동 핸들러 (안정화)
  const handleNextStepNavigation = useCallback(() => {
    if (bridgeDebugEnabled) {
      console.log('➡️ [MULTISTEP_DEBUG] 다음 스텝 이동 요청:', {
        currentStep: safeCurrentStep,
        timestamp: new Date().toISOString(),
      });
    }

    // 🔧 goToNextStep 함수 안전성 확인
    if (typeof goToNextStep === 'function') {
      goToNextStep();
    } else {
      console.error('❌ [MULTISTEP_DEBUG] goToNextStep 함수를 찾을 수 없음');
    }
  }, [goToNextStep, bridgeDebugEnabled, safeCurrentStep]);

  // 🔧 이전 스텝 이동 핸들러 (안정화)
  const handlePreviousStepNavigation = useCallback(() => {
    if (bridgeDebugEnabled) {
      console.log('⬅️ [MULTISTEP_DEBUG] 이전 스텝 이동 요청:', {
        currentStep: safeCurrentStep,
        timestamp: new Date().toISOString(),
      });
    }

    // 🔧 goToPrevStep 함수 안전성 확인
    if (typeof goToPrevStep === 'function') {
      goToPrevStep();
    } else {
      console.error('❌ [MULTISTEP_DEBUG] goToPrevStep 함수를 찾을 수 없음');
    }
  }, [goToPrevStep, bridgeDebugEnabled, safeCurrentStep]);

  // 🔧 TransferResult 타입 가드 함수 (타입단언 제거)
  const isValidTransferResult = useCallback(
    (data: unknown): data is TransferResult => {
      if (!data || typeof data !== 'object') {
        return false;
      }

      const result = Object(data);

      const hasOperationSuccess = 'operationSuccess' in result;
      const hasTransferredData = 'transferredData' in result;

      if (!hasOperationSuccess || !hasTransferredData) {
        return false;
      }

      const operationSuccess = Reflect.get(result, 'operationSuccess');
      const transferredData = Reflect.get(result, 'transferredData');

      return (
        typeof operationSuccess === 'boolean' &&
        transferredData !== null &&
        transferredData !== undefined &&
        typeof transferredData === 'object'
      );
    },
    []
  );

  // 🔧 TransferredDataStructure 타입 가드 함수 (타입단언 제거)
  const isValidTransferredData = useCallback(
    (data: unknown): data is TransferredDataStructure => {
      if (!data || typeof data !== 'object') {
        return false;
      }

      const transferredData = Object(data);

      const hasTransformedContent = 'transformedContent' in transferredData;
      const hasTransformedIsCompleted =
        'transformedIsCompleted' in transferredData;

      if (!hasTransformedContent || !hasTransformedIsCompleted) {
        return false;
      }

      const transformedContent = Reflect.get(
        transferredData,
        'transformedContent'
      );
      const transformedIsCompleted = Reflect.get(
        transferredData,
        'transformedIsCompleted'
      );

      return (
        typeof transformedContent === 'string' &&
        typeof transformedIsCompleted === 'boolean'
      );
    },
    []
  );

  // 🔧 브릿지 데이터 처리 함수 (타입단언 제거)
  const processBridgeTransferredData = useCallback(
    (transferredData: TransferredDataStructure) => {
      if (bridgeDebugEnabled) {
        console.log('📋 [MULTISTEP_DEBUG] 브릿지 데이터 수신:', {
          hasContent: !!transferredData.transformedContent,
          contentLength: transferredData.transformedContent?.length || 0,
          isCompleted: transferredData.transformedIsCompleted,
          timestamp: new Date().toISOString(),
        });
      }

      const { transformedContent, transformedIsCompleted } = transferredData;

      const isValidContent =
        typeof transformedContent === 'string' && transformedContent.length > 0;

      if (!isValidContent) {
        if (bridgeDebugEnabled) {
          console.warn('⚠️ [MULTISTEP_DEBUG] 수신 데이터에 유효한 콘텐츠 없음');
        }
        return;
      }

      // 🔧 폼 값 업데이트
      if (typeof updateFormValue === 'function') {
        updateFormValue('editorCompletedContent', transformedContent);
      }

      const completionStatus = transformedIsCompleted === true;
      setEditorCompletedStatus(completionStatus);

      if (completionStatus && typeof goToNextStep === 'function') {
        goToNextStep();
      }
    },
    [
      updateFormValue,
      setEditorCompletedStatus,
      goToNextStep,
      bridgeDebugEnabled,
    ]
  );

  // 🔧 안전한 스텝 컴포넌트 렌더링 (훅 초기화 상태 확인)
  const renderCurrentStepComponent = useCallback(() => {
    console.log('🔧 [MULTISTEP_DEBUG] 스텝 컴포넌트 렌더링 시작:', {
      safeCurrentStep,
      isInitialLoading,
      isHookInitialized,
    });

    // 🔧 훅이 초기화되지 않았거나 초기 로딩 중일 때 로딩 UI
    if (isInitialLoading || !isHookInitialized) {
      console.log('⏳ [MULTISTEP_DEBUG] 훅 초기화 대기 중, 로딩 UI 표시');
      return React.createElement(
        'div',
        {
          className: 'flex items-center justify-center p-8',
        },
        [
          React.createElement('div', {
            key: 'loading-spinner',
            className:
              'w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin',
          }),
          React.createElement(
            'span',
            {
              key: 'loading-text',
              className: 'ml-3 text-gray-600',
            },
            !isHookInitialized
              ? '훅을 초기화하고 있습니다...'
              : '스텝을 준비하고 있습니다...'
          ),
        ]
      );
    }

    // 🔧 유효성 재검증
    const isValidStep = isValidStepNumber(safeCurrentStep);

    if (!isValidStep) {
      console.error('❌ [MULTISTEP_DEBUG] safeCurrentStep도 유효하지 않음:', {
        safeCurrentStep,
        stepType: typeof safeCurrentStep,
      });

      return renderStepComponent(getMinStep());
    }

    try {
      const stepComponent = renderStepComponent(safeCurrentStep);
      console.log('✅ [MULTISTEP_DEBUG] 스텝 컴포넌트 렌더링 성공:', {
        safeCurrentStep,
      });
      return stepComponent;
    } catch (renderError) {
      const errorMessage =
        renderError instanceof Error
          ? renderError.message
          : 'Unknown rendering error';

      console.error('❌ [MULTISTEP_DEBUG] 스텝 컴포넌트 렌더링 실패:', {
        safeCurrentStep,
        errorMessage,
      });

      return React.createElement(
        'div',
        {
          className: 'p-4 border border-red-300 bg-red-50 rounded-lg',
        },
        [
          React.createElement(
            'h3',
            {
              key: 'error-title',
              className: 'text-red-700 font-semibold',
            },
            '스텝 로드 오류'
          ),
          React.createElement(
            'p',
            {
              key: 'error-description',
              className: 'text-red-600 text-sm mt-2',
            },
            `스텝 ${safeCurrentStep} 로드 중 오류가 발생했습니다.`
          ),
          React.createElement(
            'button',
            {
              key: 'error-retry',
              type: 'button',
              className:
                'mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200',
              onClick: () => {
                console.log('🔄 [MULTISTEP_DEBUG] 페이지 새로고침 요청');
                window.location.reload();
              },
            },
            '페이지 새로고침'
          ),
        ]
      );
    }
  }, [safeCurrentStep, isInitialLoading, isHookInitialized]);

  // 🔧 lastTransferResult 처리 (타입단언 제거)
  useEffect(() => {
    if (!lastTransferResult) {
      return;
    }

    // 🔧 중복 처리 방지 - 타입 가드 사용
    if (isValidTransferResult(lastTransferResult)) {
      if (lastTransferResultRef.current === lastTransferResult) {
        return;
      }

      lastTransferResultRef.current = lastTransferResult;

      const { operationSuccess, transferredData } = lastTransferResult;

      if (operationSuccess && isValidTransferredData(transferredData)) {
        console.log('✅ [MULTISTEP_DEBUG] 브릿지 전송 성공, 데이터 처리 시작');
        processBridgeTransferredData(transferredData);
      }
    } else {
      console.warn(
        '⚠️ [MULTISTEP_DEBUG] 유효하지 않은 lastTransferResult 형식'
      );
    }
  }, [
    lastTransferResult,
    processBridgeTransferredData,
    isValidTransferResult,
    isValidTransferredData,
  ]);

  // 🔧 초기 로딩 중일 때는 간단한 로딩 UI만 표시 (훅 초기화 기반)
  if (isInitialLoading || !isHookInitialized) {
    return React.createElement(
      'div',
      {
        className: 'flex items-center justify-center min-h-screen',
      },
      [
        React.createElement(
          'div',
          {
            key: 'main-loading',
            className: 'text-center',
          },
          [
            React.createElement('div', {
              key: 'spinner',
              className:
                'w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4',
            }),
            React.createElement(
              'p',
              {
                key: 'text',
                className: 'text-gray-600',
              },
              !isHookInitialized
                ? '멀티스텝 폼 훅을 초기화하고 있습니다...'
                : '멀티스텝 폼을 준비하고 있습니다...'
            ),
          ]
        ),
      ]
    );
  }

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
                currentStep={safeCurrentStep}
                progressWidth={progressWidth}
                onStepChange={handleStepNavigation}
              />

              <StepContentContainer currentStep={safeCurrentStep}>
                {renderCurrentStepComponent()}
              </StepContentContainer>

              <NavigationButtons
                currentStep={safeCurrentStep}
                onNext={handleNextStepNavigation}
                onPrev={handlePreviousStepNavigation}
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
    </div>
  );
}

// 🔧 ResponsivePreviewPanelOverlay 컴포넌트 (메모이제이션 강화)
interface ResponsivePreviewPanelOverlayProps {
  isOpen: boolean;
  deviceType: 'mobile' | 'desktop';
}

const ResponsivePreviewPanelOverlay = React.memo(
  function ResponsivePreviewPanelOverlay({
    isOpen,
    deviceType,
  }: ResponsivePreviewPanelOverlayProps): React.ReactNode {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);

    useEffect(() => {
      if (isOpen) {
        setIsVisible(true);
        const openTimeoutId = setTimeout(() => {
          setShouldAnimate(true);
        }, 50);
        return () => clearTimeout(openTimeoutId);
      }

      setShouldAnimate(false);
      const closeTimeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 1300);
      return () => clearTimeout(closeTimeoutId);
    }, [isOpen]);

    if (!isVisible) {
      return null;
    }

    const isMobileDevice = deviceType === 'mobile';

    return (
      <>
        <BackgroundOverlay
          isMobile={isMobileDevice}
          shouldAnimate={shouldAnimate}
        />
        <div
          className={`
          ${
            isMobileDevice
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
);

// 🔧 BackgroundOverlay 컴포넌트 (안정화)
interface BackgroundOverlayProps {
  isMobile: boolean;
  shouldAnimate: boolean;
}

const BackgroundOverlay = React.memo(function BackgroundOverlay({
  isMobile,
  shouldAnimate,
}: BackgroundOverlayProps): React.ReactNode {
  const handleBackgroundClick = usePreviewPanelStore(
    useCallback((state) => state?.handleBackgroundClick ?? (() => {}), [])
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
});

export default MultiStepFormContainer;

console.log(
  '📄 [MULTISTEP_CONTAINER] MultiStepFormContainer 모듈 로드 완료 - 미사용변수제거 및 TypeScript경고해결 완전버전'
);
