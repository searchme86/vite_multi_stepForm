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

// 🆕 Debug 모듈 import
import { detectSimpleInfiniteLoop } from './utils/debug/infiniteLoopDetector';
import { initializeDebugCommands } from './utils/debug/consoleDebugCommands';

interface DevelopmentEnvironmentDetection {
  hasNodeEnvironment: boolean;
  hasWindowLocation: boolean;
  nodeEnvironmentValue: string;
  currentHostname: string;
  isDevelopmentMode: boolean;
}

interface PreviewPanelStateSelection {
  isPreviewPanelOpen: boolean;
  deviceType: 'mobile' | 'desktop';
}

// 🔧 안정적인 기본값들을 미리 정의
const DEFAULT_PREVIEW_PANEL_STATE: PreviewPanelStateSelection = {
  isPreviewPanelOpen: false,
  deviceType: 'desktop',
};

const DEFAULT_BACKGROUND_CLICK_HANDLER = (): void => {
  console.log('🔧 [SELECTOR] Default background click handler');
};

const detectDevelopmentEnvironment = (): boolean => {
  try {
    const environmentInfo: DevelopmentEnvironmentDetection = {
      hasNodeEnvironment: false,
      hasWindowLocation: false,
      nodeEnvironmentValue: '',
      currentHostname: '',
      isDevelopmentMode: false,
    };

    const isNodeEnvironmentAvailable =
      typeof window !== 'undefined' && typeof window.location !== 'undefined';

    if (isNodeEnvironmentAvailable) {
      const { hostname = '' } = window.location;
      const currentHostname = typeof hostname === 'string' ? hostname : '';
      environmentInfo.currentHostname = currentHostname;
      environmentInfo.hasWindowLocation = true;

      const isDevelopmentHostname =
        currentHostname === 'localhost' ||
        currentHostname === '127.0.0.1' ||
        currentHostname.endsWith('.local');

      if (isDevelopmentHostname) {
        console.log(
          '🔧 [ENV_DETECTION] 브라우저 개발 환경 감지:',
          currentHostname
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
  // 🚨 Debug 모듈의 무한루프 감지 사용
  const isInfiniteLoop = detectSimpleInfiniteLoop('MultiStepFormContainer');
  if (isInfiniteLoop) {
    console.error(
      '🚨 [MULTISTEP_CONTAINER] 무한루프로 인한 컴포넌트 실행 중단'
    );
    throw new Error('무한 렌더링이 감지되어 컴포넌트 실행을 중단합니다.');
  }

  const [bridgeDebugEnabled, setBridgeDebugEnabled] = useState<boolean>(false);
  const [isComponentMounted, setIsComponentMounted] = useState<boolean>(false);

  const isFirstRenderRef = useRef<boolean>(true);
  const mountTimeRef = useRef<number>(Date.now());

  // 🆕 Debug 명령어 초기화 (한 번만 실행)
  const debugInitializedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!debugInitializedRef.current) {
      initializeDebugCommands();
      debugInitializedRef.current = true;
    }
  }, []);

  console.log('🔄 [MULTISTEP_CONTAINER] 컴포넌트 렌더링 시작');

  // 🆕 메인 훅 호출 및 상세 추적
  const hookResult = useMultiStepFormState();

  console.log('🔍 [HOOK_RESULT] useMultiStepFormState 반환값 구조:', {
    keys: Object.keys(hookResult),
    hasMethod: 'methods' in hookResult,
    hasCurrentStep: 'currentStep' in hookResult,
    hasGoToNextStep: 'goToNextStep' in hookResult,
    hasHandleSubmit: 'handleSubmit' in hookResult,
    hasOnSubmit: 'onSubmit' in hookResult,
  });

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

  // 🆕 각 속성별 상세 체크
  console.log('🔍 [HOOK_PROPERTIES] 각 속성 상세 체크:', {
    methods: {
      exists: !!methods,
      type: typeof methods,
      hasHandleSubmit: methods && typeof methods.handleSubmit === 'function',
    },
    handleSubmit: {
      exists: !!handleSubmit,
      type: typeof handleSubmit,
    },
    onSubmit: {
      exists: !!onSubmit,
      type: typeof onSubmit,
    },
    currentStep: {
      exists: currentStep !== undefined,
      value: currentStep,
      type: typeof currentStep,
      isValid: isValidStepNumber(currentStep),
    },
    progressWidth: {
      exists: progressWidth !== undefined,
      value: progressWidth,
      type: typeof progressWidth,
    },
    navigation: {
      goToNextStep: typeof goToNextStep,
      goToPrevStep: typeof goToPrevStep,
      goToStep: typeof goToStep,
    },
  });

  // 🔧 훅 준비 상태 체크 - 단순화된 버전
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

    if (!hasValidCurrentStep) {
      console.error('❌ [HOOK_NOT_READY] currentStep이 유효하지 않음:', {
        currentStep,
        type: typeof currentStep,
        isValidStepNumber: isValidStepNumber(currentStep),
      });
    }

    if (!hasFormMethods) {
      console.error('❌ [HOOK_NOT_READY] methods가 없음:', {
        methods,
        type: typeof methods,
        keys: methods ? Object.keys(methods) : 'N/A',
      });
    }

    if (!hasNavigationFunctions) {
      console.error('❌ [HOOK_NOT_READY] 네비게이션 함수들이 없음:', {
        goToNextStep: typeof goToNextStep,
        goToPrevStep: typeof goToPrevStep,
        goToStep: typeof goToStep,
      });
    }

    return hasValidCurrentStep && hasFormMethods && hasNavigationFunctions;
  }, [currentStep, methods, goToNextStep, goToPrevStep, goToStep]);

  // 🔧 스토어에서 안전하게 데이터 추출
  const rawPreviewPanelState = usePreviewPanelStore();

  // 🔧 안정적인 state 객체 생성 - useMemo로 참조 안정성 확보
  const previewPanelState = useMemo((): PreviewPanelStateSelection => {
    if (!rawPreviewPanelState) {
      console.log(
        '🔍 [MULTISTEP_CONTAINER] Preview panel state가 null/undefined, 기본값 사용'
      );
      return DEFAULT_PREVIEW_PANEL_STATE;
    }

    const { isPreviewPanelOpen = false, deviceType = 'desktop' } =
      rawPreviewPanelState;

    const isOpenBoolean =
      typeof isPreviewPanelOpen === 'boolean' ? isPreviewPanelOpen : false;
    const deviceTypeString =
      deviceType === 'mobile' || deviceType === 'desktop'
        ? deviceType
        : 'desktop';

    console.log('🔍 [MULTISTEP_CONTAINER] Preview panel state 추출:', {
      isOpenBoolean,
      deviceTypeString,
    });

    return {
      isPreviewPanelOpen: isOpenBoolean,
      deviceType: deviceTypeString,
    };
  }, [rawPreviewPanelState]);

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

  // 🆕 무한로딩 타임아웃 감지 (10초)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isHookDataReady) {
        console.error('🚨 [TIMEOUT_ERROR] 10초 이상 무한로딩!', {
          isComponentMounted,
          isHookDataReady,
          currentStep,
          methods: !!methods,
          hookResult: Object.keys(hookResult),
          possibleCauses: [
            'useMultiStepFormState 훅 반환값 구조 불일치',
            'useStepNavigation 훅 초기화 실패',
            '순환 의존성 문제',
            'JSON 설정 파일 로드 실패',
          ],
        });

        if (typeof window !== 'undefined') {
          const shouldReload = window.confirm(
            `🚨 10초 이상 무한로딩이 감지되었습니다!\n\n• 컴포넌트: MultiStepFormContainer\n\n개발자 도구를 확인하고 페이지를 새로고침하시겠습니까?`
          );
          if (shouldReload) {
            window.location.reload();
          }
        }
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isHookDataReady, isComponentMounted, currentStep, methods, hookResult]);

  // 🔧 컴포넌트 마운트 처리 - 단순화
  useEffect(() => {
    if (isComponentMounted) {
      console.log('⏭️ [MULTISTEP_CONTAINER] 이미 마운트 완료됨');
      return;
    }

    if (!isHookDataReady) {
      console.log('⏳ [MULTISTEP_CONTAINER] 훅 데이터 준비 대기 중');
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

      const { ctrlKey = false, shiftKey = false, key = '' } = keyboardEvent;
      const pressedKeyString = typeof key === 'string' ? key : '';

      const isDebugToggleShortcut =
        ctrlKey && shiftKey && pressedKeyString === 'D';

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
    const loadingMessage = '멀티스텝 폼을 준비하고 있습니다...';

    console.log('⏳ [MULTISTEP_CONTAINER] 초기 로딩 화면 표시:', {
      message: loadingMessage,
      isComponentMounted,
      isHookDataReady,
    });

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
              loadingMessage
            ),
            detectDevelopmentEnvironment() &&
              React.createElement(
                'div',
                { key: 'debug-info', className: 'mt-4 text-xs text-gray-500' },
                `디버그: isHookDataReady=${isHookDataReady}`
              ),
          ]
        ),
      ]
    );
  }

  console.log('🎨 [MULTISTEP_CONTAINER] 메인 컴포넌트 렌더링');
  return (
    <div className="relative">
      {bridgeDebugEnabled || detectDevelopmentEnvironment() ? (
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

// ResponsivePreviewPanelOverlay 컴포넌트들
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
  const rawStoreState = usePreviewPanelStore();

  const handleBackgroundClick = useCallback((): void => {
    if (!rawStoreState) {
      console.log(
        '🔧 [BACKGROUND_OVERLAY] 스토어 상태가 없음, 기본 핸들러 사용'
      );
      DEFAULT_BACKGROUND_CLICK_HANDLER();
      return;
    }

    const { handleBackgroundClick: storeHandler } = rawStoreState;

    if (typeof storeHandler === 'function') {
      console.log('🔧 [BACKGROUND_OVERLAY] 스토어 핸들러 실행');
      storeHandler();
    } else {
      console.log(
        '🔧 [BACKGROUND_OVERLAY] 핸들러가 함수가 아님, 기본 핸들러 사용'
      );
      DEFAULT_BACKGROUND_CLICK_HANDLER();
    }
  }, [rawStoreState]);

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
  '📄 [MULTISTEP_CONTAINER] ✅ Debug 모듈 연동된 MultiStepFormContainer 모듈 로드 완료'
);
