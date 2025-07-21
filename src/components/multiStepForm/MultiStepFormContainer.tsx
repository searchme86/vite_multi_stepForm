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
import PreviewPanelContainer from '../previewPanel/PreviewPanelContainer';
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';
import StepContentContainer from './animation/StepContentContainer';
import ToastManager from '../toaster/ToastManager';
import { usePreviewPanelStore } from '../previewPanel/store/previewPanelStore';

interface DevelopmentEnvironmentDetection {
  hasNodeEnvironment: boolean;
  hasWindowLocation: boolean;
  nodeEnvironmentValue: string;
  currentHostname: string;
  isDevelopmentMode: boolean;
}

const detectDevelopmentEnvironment = (): boolean => {
  try {
    const environmentInfo: DevelopmentEnvironmentDetection = {
      hasNodeEnvironment:
        typeof process !== 'undefined' && process !== null && !!process.env,
      hasWindowLocation: typeof window !== 'undefined' && !!window.location,
      nodeEnvironmentValue: '',
      currentHostname: '',
      isDevelopmentMode: false,
    };

    if (
      environmentInfo.hasNodeEnvironment &&
      typeof process !== 'undefined' &&
      process.env
    ) {
      const processEnv = process.env;
      const nodeEnvironment = processEnv['NODE_ENV'];
      const nodeEnvironmentString =
        typeof nodeEnvironment === 'string' ? nodeEnvironment : '';
      environmentInfo.nodeEnvironmentValue = nodeEnvironmentString;

      if (nodeEnvironmentString === 'development') {
        console.log('🔧 [ENV_DETECTION] Node.js 개발 환경 감지');
        return true;
      }
    }

    if (environmentInfo.hasWindowLocation) {
      const windowLocation = window.location;
      const currentHostname = windowLocation ? windowLocation.hostname : '';
      const hostnameString =
        typeof currentHostname === 'string' ? currentHostname : '';
      environmentInfo.currentHostname = hostnameString;

      const isDevelopmentHostname =
        hostnameString === 'localhost' ||
        hostnameString === '127.0.0.1' ||
        hostnameString.endsWith('.local');

      if (isDevelopmentHostname) {
        console.log(
          '🔧 [ENV_DETECTION] 브라우저 개발 환경 감지:',
          hostnameString
        );
        return true;
      }
    }

    console.log('🔧 [ENV_DETECTION] 프로덕션 환경 감지:', environmentInfo);
    return false;
  } catch (environmentDetectionError) {
    console.warn(
      '⚠️ [ENV_DETECTION] 개발 환경 감지 실패:',
      environmentDetectionError
    );
    return false;
  }
};

function MultiStepFormContainer(): React.ReactNode {
  const [bridgeDebugEnabled, setBridgeDebugEnabled] = useState<boolean>(false);
  const [isComponentMounted, setIsComponentMounted] = useState<boolean>(false);

  const logIntervalRef = useRef<number>();
  const isFirstRenderRef = useRef<boolean>(true);
  const mountTimeRef = useRef<number>(Date.now());

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
  } = hookResult;

  // 🔧 단순화된 훅 초기화 체크 - 순환 의존성 제거
  const isHookDataReady = useMemo(() => {
    const hasValidCurrentStep = isValidStepNumber(currentStep);
    const hasFormMethods = methods !== null && methods !== undefined;
    const hasNavigationFunctions =
      typeof goToNextStep === 'function' &&
      typeof goToPrevStep === 'function' &&
      typeof goToStep === 'function';

    console.log('🔍 [MULTISTEP_CONTAINER] 훅 데이터 준비 상태:', {
      hasValidCurrentStep,
      hasFormMethods,
      hasNavigationFunctions,
      currentStep,
    });

    return hasValidCurrentStep && hasFormMethods && hasNavigationFunctions;
  }, [currentStep, methods, goToNextStep, goToPrevStep, goToStep]);

  // 🔧 스토어 selector 안정화
  const previewPanelState = usePreviewPanelStore(
    useCallback((storeState) => {
      if (storeState === null || storeState === undefined) {
        return {
          isPreviewPanelOpen: false,
          deviceType: 'desktop' as const,
        };
      }

      const storeDataMap = new Map(Object.entries(storeState));
      const isPreviewPanelOpen = storeDataMap.get('isPreviewPanelOpen');
      const deviceType = storeDataMap.get('deviceType');

      const isOpenBoolean =
        typeof isPreviewPanelOpen === 'boolean' ? isPreviewPanelOpen : false;
      const deviceTypeString =
        deviceType === 'mobile' || deviceType === 'desktop'
          ? deviceType
          : 'desktop';

      return {
        isPreviewPanelOpen: isOpenBoolean,
        deviceType: deviceTypeString,
      };
    }, [])
  );

  const { isPreviewPanelOpen, deviceType } = previewPanelState;

  // 🔧 안전한 현재 스텝 계산
  const safeCurrentStep = useMemo(() => {
    const validStep = isValidStepNumber(currentStep)
      ? currentStep
      : getMinStep();
    console.log('🔧 [MULTISTEP_CONTAINER] 안전한 현재 스텝 계산:', {
      inputStep: currentStep,
      outputStep: validStep,
    });
    return validStep;
  }, [currentStep]);

  console.log('📊 [MULTISTEP_CONTAINER] 스토어 상태:', {
    isPreviewPanelOpen,
    deviceType,
    currentStep,
    safeCurrentStep,
    isComponentMounted,
    isHookDataReady,
    debugMode: bridgeDebugEnabled || detectDevelopmentEnvironment(),
    timestamp: new Date().toISOString(),
  });

  // 🔧 컴포넌트 마운트 처리 - 단순화
  useEffect(() => {
    if (isComponentMounted) {
      console.log('⏭️ [MULTISTEP_CONTAINER] 이미 마운트 완료됨');
      return;
    }

    const mountDuration = Date.now() - mountTimeRef.current;
    console.log('✅ [MULTISTEP_CONTAINER] 컴포넌트 마운트 완료:', {
      mountDuration: `${mountDuration}ms`,
      isHookDataReady,
    });

    setIsComponentMounted(true);
  }, [isHookDataReady, isComponentMounted]);

  // 🔧 첫 렌더링 로그 - 단순화
  useEffect(() => {
    if (!isFirstRenderRef.current) {
      return;
    }

    if (!isHookDataReady) {
      console.log(
        '⏳ [MULTISTEP_CONTAINER] 첫 렌더링 대기 중 - 훅 데이터 미준비'
      );
      return;
    }

    console.log('🎯 [MULTISTEP_CONTAINER] 초기 렌더링 완료');
    isFirstRenderRef.current = false;
  }, [isHookDataReady]);

  // 🔧 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyboardShortcut = (keyboardEvent: KeyboardEvent): void => {
      if (keyboardEvent === null || keyboardEvent === undefined) {
        return;
      }

      const eventDataMap = new Map(Object.entries(keyboardEvent));
      const isControlKeyPressed = eventDataMap.get('ctrlKey') === true;
      const isShiftKeyPressed = eventDataMap.get('shiftKey') === true;
      const pressedKey = eventDataMap.get('key');
      const pressedKeyString = typeof pressedKey === 'string' ? pressedKey : '';

      const isDebugToggleShortcut =
        isControlKeyPressed && isShiftKeyPressed && pressedKeyString === 'D';

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

    return (): void => {
      console.log('⌨️ [MULTISTEP_CONTAINER] 키보드 이벤트 리스너 제거');
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  // 🔧 디버그 로그 인터벌 - 최적화
  useEffect(() => {
    if (!bridgeDebugEnabled) {
      const currentIntervalId = logIntervalRef.current;
      if (currentIntervalId !== undefined) {
        console.log('🔧 [MULTISTEP_CONTAINER] 디버그 로그 인터벌 정리');
        clearInterval(currentIntervalId);
        logIntervalRef.current = undefined;
      }
      return;
    }

    console.log('🔧 [MULTISTEP_CONTAINER] 디버그 로그 인터벌 시작');
    const debugLogInterval = window.setInterval((): void => {
      console.log('📈 [MULTISTEP_CONTAINER] 상태 요약', {
        lastUpdate: new Date().toLocaleTimeString(),
        currentStep: safeCurrentStep,
        isHookDataReady,
        isComponentMounted,
      });
    }, 30000);

    logIntervalRef.current = debugLogInterval;

    return (): void => {
      if (logIntervalRef.current !== undefined) {
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
    isHookDataReady,
    isComponentMounted,
  ]);

  // 🔧 스텝 네비게이션 핸들러들
  const handleStepNavigation = useCallback(
    (targetStep: StepNumber): void => {
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

  const handleNextStepNavigation = useCallback((): void => {
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

  const handlePreviousStepNavigation = useCallback((): void => {
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

  // 🔧 스텝 컴포넌트 렌더링 함수
  const renderCurrentStepComponent = useCallback((): React.ReactNode => {
    if (!isComponentMounted || !isHookDataReady) {
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
  }, [safeCurrentStep, isComponentMounted, isHookDataReady]);

  // Early return: 초기 로딩 중
  if (!isComponentMounted || !isHookDataReady) {
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
          🔧 DEBUG MODE
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
        const openTimeoutId = setTimeout((): void => {
          setShouldAnimate(true);
        }, 50);
        return (): void => clearTimeout(openTimeoutId);
      }

      console.log('🎬 [PREVIEW_OVERLAY] 패널 닫기 애니메이션 시작');
      setShouldAnimate(false);
      const closeTimeoutId = setTimeout((): void => {
        setIsVisible(false);
      }, 1300);
      return (): void => clearTimeout(closeTimeoutId);
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
  const backgroundClickHandler = usePreviewPanelStore(
    useCallback((storeState) => {
      if (storeState === null || storeState === undefined) {
        return (): void => {};
      }

      const storeDataMap = new Map(Object.entries(storeState));
      const handleBackgroundClick = storeDataMap.get('handleBackgroundClick');
      return typeof handleBackgroundClick === 'function'
        ? handleBackgroundClick
        : (): void => {};
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
      onClick={backgroundClickHandler}
    />
  );
});

export default MultiStepFormContainer;

console.log(
  '📄 [MULTISTEP_CONTAINER] MultiStepFormContainer 모듈 로드 완료 - Phase 2 순환 의존성 해결'
);
