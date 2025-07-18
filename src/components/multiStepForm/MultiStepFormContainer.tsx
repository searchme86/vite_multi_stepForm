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
import { useBridgeIntegration } from './utils/useBridgeIntegration';
import PreviewPanelContainer from '../previewPanel/PreviewPanelContainer';
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';
import StepContentContainer from './animation/StepContentContainer';
import ToastManager from '../toaster/ToastManager';
import { usePreviewPanelStore } from '../previewPanel/store/previewPanelStore';

interface BridgeIntegrationConfig {
  readonly enableAutoTransfer: boolean;
  readonly enableStepTransition: boolean;
  readonly enableErrorHandling: boolean;
  readonly enableProgressSync: boolean;
  readonly enableValidationSync: boolean;
  readonly debugMode: boolean;
  readonly autoTransferStep: number;
  readonly targetStepAfterTransfer: number;
}

const detectDevelopmentEnvironment = (): boolean => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const { NODE_ENV: nodeEnvironment = '' } = process.env;
      if (
        typeof nodeEnvironment === 'string' &&
        nodeEnvironment === 'development'
      ) {
        return true;
      }
    }

    if (typeof window !== 'undefined' && window.location) {
      const { hostname: currentHostname = '' } = window.location;
      return (
        currentHostname === 'localhost' ||
        currentHostname === '127.0.0.1' ||
        currentHostname.endsWith('.local')
      );
    }

    return false;
  } catch (environmentDetectionError) {
    console.warn(
      '⚠️ [MULTISTEP_CONTAINER] 개발 환경 감지 실패:',
      environmentDetectionError
    );
    return false;
  }
};

function MultiStepFormContainer(): React.ReactNode {
  const [bridgeDebugEnabled, setBridgeDebugEnabled] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // 🔧 단순한 ref 관리
  const logIntervalRef = useRef<number>();
  const isFirstRenderRef = useRef<boolean>(true);
  const initializationCompleteRef = useRef<boolean>(false);

  console.log('🔄 [MULTISTEP_CONTAINER] 컴포넌트 렌더링 시작');

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

  // 🔧 안정화된 훅 초기화 체크 - useMemo로 메모이제이션
  const isHookInitialized = useMemo(() => {
    const isCurrentStepValid =
      currentStep !== null &&
      currentStep !== undefined &&
      isValidStepNumber(currentStep);

    console.log('🔍 [MULTISTEP_CONTAINER] 훅 초기화 상태 체크:', {
      currentStep,
      isCurrentStepValid,
      timestamp: new Date().toISOString(),
    });

    return Boolean(isCurrentStepValid);
  }, [currentStep]);

  // 🔧 스토어 selector 안정화
  const isPreviewPanelOpen = usePreviewPanelStore(
    useCallback((storeState) => {
      const { isPreviewPanelOpen: panelOpenState = false } = storeState ?? {};
      return typeof panelOpenState === 'boolean' ? panelOpenState : false;
    }, [])
  );

  const deviceType = usePreviewPanelStore(
    useCallback((storeState) => {
      const { deviceType: currentDeviceType = 'desktop' } = storeState ?? {};
      return currentDeviceType === 'mobile' || currentDeviceType === 'desktop'
        ? currentDeviceType
        : 'desktop';
    }, [])
  );

  // 🔧 안정화된 safeCurrentStep - useMemo로 메모이제이션
  const safeCurrentStep = useMemo(() => {
    const validStep = isValidStepNumber(currentStep)
      ? currentStep
      : getMinStep();
    console.log('🔧 [MULTISTEP_CONTAINER] 안전한 현재 스텝:', {
      currentStep,
      validStep,
      timestamp: new Date().toISOString(),
    });
    return validStep;
  }, [currentStep]);

  // 🔧 단순한 Bridge 설정
  const bridgeConfig: BridgeIntegrationConfig = useMemo(
    () => ({
      enableAutoTransfer: false,
      enableStepTransition: true,
      enableErrorHandling: true,
      enableProgressSync: true,
      enableValidationSync: true,
      debugMode: bridgeDebugEnabled || detectDevelopmentEnvironment(),
      autoTransferStep: 4,
      targetStepAfterTransfer: 5,
    }),
    [bridgeDebugEnabled]
  );

  const bridgeIntegration = useBridgeIntegration(bridgeConfig);

  console.log('🌉 [MULTISTEP_CONTAINER] Bridge 통합 상태:', {
    isConnected: bridgeIntegration?.isConnected ?? false,
    isTransferring: bridgeIntegration?.isTransferring ?? false,
    canTransfer: bridgeIntegration?.canTransfer ?? false,
    timestamp: new Date().toISOString(),
  });

  console.log('📊 [MULTISTEP_CONTAINER] 스토어 상태:', {
    isPreviewPanelOpen,
    deviceType,
    currentStep,
    safeCurrentStep,
    isInitialLoading,
    isHookInitialized,
    timestamp: new Date().toISOString(),
  });

  // 🔧 안정화된 초기 로딩 처리 - 적절한 의존성 배열 추가
  useEffect(() => {
    if (initializationCompleteRef.current) {
      console.log('⏭️ [MULTISTEP_CONTAINER] 이미 초기화 완료됨, 건너뜀');
      return;
    }

    if (!isHookInitialized) {
      console.log('⏳ [MULTISTEP_CONTAINER] 훅 초기화 대기 중');
      return;
    }

    if (!isInitialLoading) {
      console.log('⏭️ [MULTISTEP_CONTAINER] 이미 로딩 완료됨, 건너뜀');
      return;
    }

    console.log('✅ [MULTISTEP_CONTAINER] 훅 초기화 기반 로딩 완료');
    setIsInitialLoading(false);
    initializationCompleteRef.current = true;
  }, [isHookInitialized, isInitialLoading]); // 🚨 중요: 의존성 배열 추가

  // 🔧 안정화된 첫 렌더링 로그 - 적절한 의존성 배열 추가
  useEffect(() => {
    if (!isFirstRenderRef.current) {
      console.log('⏭️ [MULTISTEP_CONTAINER] 첫 렌더링 이미 완료됨');
      return;
    }

    if (!isHookInitialized) {
      console.log(
        '⏳ [MULTISTEP_CONTAINER] 첫 렌더링을 위한 훅 초기화 대기 중'
      );
      return;
    }

    console.log('🎯 [MULTISTEP_CONTAINER] 초기 렌더링 완료');
    isFirstRenderRef.current = false;
  }, [isHookInitialized]); // 🚨 중요: 의존성 배열 추가

  // 🔧 키보드 이벤트 핸들러 - 의존성 없음 (한 번만 등록)
  useEffect(() => {
    const handleKeyboardShortcut = (keyboardEvent: KeyboardEvent) => {
      const {
        ctrlKey: isControlKeyPressed = false,
        shiftKey: isShiftKeyPressed = false,
        key: pressedKey = '',
      } = keyboardEvent ?? {};

      const isDebugToggleShortcut =
        isControlKeyPressed && isShiftKeyPressed && pressedKey === 'D';

      if (isDebugToggleShortcut) {
        keyboardEvent.preventDefault();
        setBridgeDebugEnabled((previousMode) => {
          const newMode = !previousMode;
          console.log('🔧 [MULTISTEP_CONTAINER] 디버그 모드 토글:', newMode);
          return newMode;
        });
      }
    };

    console.log('⌨️ [MULTISTEP_CONTAINER] 키보드 이벤트 리스너 등록');
    window.addEventListener('keydown', handleKeyboardShortcut);

    return () => {
      console.log('⌨️ [MULTISTEP_CONTAINER] 키보드 이벤트 리스너 제거');
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  // 🔧 안정화된 디버그 로그 인터벌
  useEffect(() => {
    if (!bridgeDebugEnabled) {
      const currentIntervalId = logIntervalRef.current;
      if (currentIntervalId) {
        console.log('🔧 [MULTISTEP_CONTAINER] 디버그 로그 인터벌 정리');
        clearInterval(currentIntervalId);
        logIntervalRef.current = undefined;
      }
      return;
    }

    console.log('🔧 [MULTISTEP_CONTAINER] 디버그 로그 인터벌 시작');
    const debugLogInterval = window.setInterval(() => {
      console.log('📈 [MULTISTEP_CONTAINER] 상태 요약', {
        lastUpdate: new Date().toLocaleTimeString(),
        currentStep: safeCurrentStep,
        isHookInitialized,
        isInitialLoading,
      });
    }, 30000);

    logIntervalRef.current = debugLogInterval;

    return () => {
      if (logIntervalRef.current) {
        console.log(
          '🔧 [MULTISTEP_CONTAINER] 디버그 로그 인터벌 정리 (cleanup)'
        );
        clearInterval(logIntervalRef.current);
        logIntervalRef.current = undefined;
      }
    };
  }, [
    bridgeDebugEnabled,
    safeCurrentStep,
    isHookInitialized,
    isInitialLoading,
  ]);

  // 🔧 단순한 스텝 변경 핸들러
  const handleStepNavigation = useCallback(
    (targetStep: StepNumber) => {
      if (typeof goToStep !== 'function') {
        console.error('❌ [MULTISTEP_CONTAINER] goToStep 함수를 찾을 수 없음');
        return;
      }

      if (!isValidStepNumber(targetStep)) {
        console.error(
          '❌ [MULTISTEP_CONTAINER] 유효하지 않은 targetStep:',
          targetStep
        );
        return;
      }

      console.log('🔄 [MULTISTEP_CONTAINER] 스텝 네비게이션:', {
        from: safeCurrentStep,
        to: targetStep,
      });
      goToStep(targetStep);
    },
    [goToStep, safeCurrentStep]
  );

  // 🔧 단순한 다음 스텝 이동 핸들러
  const handleNextStepNavigation = useCallback(() => {
    if (typeof goToNextStep !== 'function') {
      console.error(
        '❌ [MULTISTEP_CONTAINER] goToNextStep 함수를 찾을 수 없음'
      );
      return;
    }

    console.log(
      '➡️ [MULTISTEP_CONTAINER] 다음 스텝으로 이동:',
      safeCurrentStep
    );
    goToNextStep();
  }, [goToNextStep, safeCurrentStep]);

  // 🔧 단순한 이전 스텝 이동 핸들러
  const handlePreviousStepNavigation = useCallback(() => {
    if (typeof goToPrevStep !== 'function') {
      console.error(
        '❌ [MULTISTEP_CONTAINER] goToPrevStep 함수를 찾을 수 없음'
      );
      return;
    }

    console.log(
      '⬅️ [MULTISTEP_CONTAINER] 이전 스텝으로 이동:',
      safeCurrentStep
    );
    goToPrevStep();
  }, [goToPrevStep, safeCurrentStep]);

  // 🔧 안정화된 스텝 컴포넌트 렌더링
  const renderCurrentStepComponent = useCallback(() => {
    if (isInitialLoading || !isHookInitialized) {
      console.log('⏳ [MULTISTEP_CONTAINER] 로딩 컴포넌트 렌더링');
      return React.createElement(
        'div',
        { className: 'flex items-center justify-center p-8' },
        [
          React.createElement('div', {
            key: 'loading-spinner',
            className:
              'w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin',
          }),
          React.createElement(
            'span',
            { key: 'loading-text', className: 'ml-3 text-gray-600' },
            '로딩 중입니다...'
          ),
        ]
      );
    }

    if (!isValidStepNumber(safeCurrentStep)) {
      console.warn(
        '⚠️ [MULTISTEP_CONTAINER] 유효하지 않은 스텝, 기본 스텝으로 대체'
      );
      return renderStepComponent(getMinStep());
    }

    try {
      console.log(
        '🎨 [MULTISTEP_CONTAINER] 스텝 컴포넌트 렌더링:',
        safeCurrentStep
      );
      return renderStepComponent(safeCurrentStep);
    } catch (stepRenderingError) {
      console.error(
        '❌ [MULTISTEP_CONTAINER] 스텝 컴포넌트 렌더링 실패:',
        stepRenderingError
      );

      return React.createElement(
        'div',
        { className: 'p-4 border border-red-300 bg-red-50 rounded-lg' },
        [
          React.createElement(
            'h3',
            { key: 'error-title', className: 'text-red-700 font-semibold' },
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
        ]
      );
    }
  }, [safeCurrentStep, isInitialLoading, isHookInitialized]);

  // Early return: 초기 로딩 중
  if (isInitialLoading || !isHookInitialized) {
    console.log('⏳ [MULTISTEP_CONTAINER] 초기 로딩 화면 표시');
    return React.createElement(
      'div',
      { className: 'flex items-center justify-center min-h-screen' },
      [
        React.createElement(
          'div',
          { key: 'main-loading', className: 'text-center' },
          [
            React.createElement('div', {
              key: 'spinner',
              className:
                'w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4',
            }),
            React.createElement(
              'p',
              { key: 'text', className: 'text-gray-600' },
              '멀티스텝 폼을 준비하고 있습니다...'
            ),
          ]
        ),
      ]
    );
  }

  console.log('🎨 [MULTISTEP_CONTAINER] 메인 컴포넌트 렌더링');
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

interface ResponsivePreviewPanelOverlayProps {
  readonly isOpen: boolean;
  readonly deviceType: 'mobile' | 'desktop';
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
        console.log('🎬 [PREVIEW_OVERLAY] 패널 열기 애니메이션 시작');
        setIsVisible(true);
        const openTimeoutId = setTimeout(() => {
          setShouldAnimate(true);
        }, 50);
        return () => clearTimeout(openTimeoutId);
      }

      console.log('🎬 [PREVIEW_OVERLAY] 패널 닫기 애니메이션 시작');
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

interface BackgroundOverlayProps {
  readonly isMobile: boolean;
  readonly shouldAnimate: boolean;
}

const BackgroundOverlay = React.memo(function BackgroundOverlay({
  isMobile,
  shouldAnimate,
}: BackgroundOverlayProps): React.ReactNode {
  const handleBackgroundClick = usePreviewPanelStore(
    useCallback((storeState) => {
      const { handleBackgroundClick: backgroundClickHandler } =
        storeState ?? {};
      return typeof backgroundClickHandler === 'function'
        ? backgroundClickHandler
        : () => {};
    }, [])
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
  '📄 [MULTISTEP_CONTAINER] MultiStepFormContainer 모듈 로드 완료 - 에러 수정 완료'
);
