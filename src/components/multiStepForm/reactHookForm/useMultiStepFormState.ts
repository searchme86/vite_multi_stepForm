// src/components/multiStepForm/reactHookForm/useMultiStepFormState.ts

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema } from '../schema/formSchema';
import type { FormSchemaValues } from '../types/formTypes';
import { getDefaultFormSchemaValues } from '../utils/formFieldsLoader';

import { useStepNavigation } from './actions/useStepNavigation';
import { submitForm } from './actions/formActions';
import { detectInfiniteLoop } from '../utils/debug/infiniteLoopDetector';

// 🆕 Hook State Tracker 인터페이스
interface HookStateTracker {
  formMethodsReady: boolean;
  stepNavigationReady: boolean;
  defaultValuesLoaded: boolean;
  lastUpdateTime: number;
  renderCount: number;
}

const createHookStateTracker = (): HookStateTracker => {
  return {
    formMethodsReady: false,
    stepNavigationReady: false,
    defaultValuesLoaded: false,
    lastUpdateTime: Date.now(),
    renderCount: 0,
  };
};

const logStateChange = (
  tracker: HookStateTracker,
  phase: string,
  details: Record<string, unknown>
) => {
  const currentTime = Date.now();
  const timeSinceLastUpdate = currentTime - tracker.lastUpdateTime;

  console.log(`🔄 [HOOK_STATE_CHANGE] ${phase}:`, {
    ...details,
    timeSinceLastUpdate,
    renderCount: tracker.renderCount,
    timestamp: new Date().toISOString(),
  });

  tracker.lastUpdateTime = currentTime;
  tracker.renderCount++;

  if (timeSinceLastUpdate < 100 && tracker.renderCount > 10) {
    console.warn(
      '⚠️ [POTENTIAL_INFINITE_LOOP] 짧은 시간 내 반복 렌더링 감지:',
      {
        phase,
        renderCount: tracker.renderCount,
        timeSinceLastUpdate,
      }
    );
  }
};

// 🆕 메인 훅 - Hook Rules 준수 + Debug 모듈 연동
export const useMultiStepFormState = () => {
  console.log('🔧 [USE_FORM_STATE] useMultiStepFormState 훅 시작');

  // 🚨 Debug 모듈의 무한로딩 감지 사용
  const isInfiniteLoop = detectInfiniteLoop();
  if (isInfiniteLoop) {
    console.error('🚨 [USE_FORM_STATE] 무한루프로 인한 훅 실행 중단');
    throw new Error('무한 렌더링이 감지되어 훅 실행을 중단합니다.');
  }

  // 🆕 상태 추적기 초기화
  const stateTrackerRef = React.useRef<HookStateTracker>(
    createHookStateTracker()
  );

  // ✅ 1단계: 기본값 로드 (안전한 의존성 배열)
  const defaultFormSchemaValues = React.useMemo(() => {
    logStateChange(stateTrackerRef.current, 'DEFAULT_VALUES_LOADING', {});

    const values = getDefaultFormSchemaValues();
    stateTrackerRef.current.defaultValuesLoaded = true;

    logStateChange(stateTrackerRef.current, 'DEFAULT_VALUES_LOADED', {
      fieldsCount: Object.keys(values).length,
    });

    return values;
  }, []); // 🔧 빈 배열로 한 번만 실행

  // ✅ 2단계: React Hook Form 초기화 (최상위 레벨로 이동)
  const formMethods = useForm<FormSchemaValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormSchemaValues,
    mode: 'onChange',
  });

  // ✅ 3단계: 스텝 네비게이션 초기화 (최상위 레벨)
  const stepNavigation = useStepNavigation();

  // 🔧 폼 메서드 준비 상태 추적
  React.useEffect(() => {
    if (!stateTrackerRef.current.formMethodsReady) {
      logStateChange(stateTrackerRef.current, 'FORM_METHODS_READY', {
        hasHandleSubmit: typeof formMethods.handleSubmit === 'function',
        hasGetValues: typeof formMethods.getValues === 'function',
      });
      stateTrackerRef.current.formMethodsReady = true;
    }
  }, [formMethods]);

  // 🔧 스텝 네비게이션 준비 상태 추적
  React.useEffect(() => {
    if (!stateTrackerRef.current.stepNavigationReady) {
      logStateChange(stateTrackerRef.current, 'STEP_NAVIGATION_READY', {
        currentStep: stepNavigation.currentStep,
        progressWidth: stepNavigation.progressWidth,
        hasGoToNextStep: typeof stepNavigation.goToNextStep === 'function',
        hasGoToPrevStep: typeof stepNavigation.goToPrevStep === 'function',
        hasGoToStep: typeof stepNavigation.goToStep === 'function',
      });
      stateTrackerRef.current.stepNavigationReady = true;
    }
  }, [stepNavigation]);

  // ✅ 4단계: onSubmit 함수 생성 (useCallback으로 안정화)
  const onSubmit = React.useCallback(async (data: FormSchemaValues) => {
    console.log('📤 [FORM_SUBMIT] 폼 제출 시작:', data);

    try {
      logStateChange(stateTrackerRef.current, 'FORM_SUBMITTING', {
        dataKeys: Object.keys(data),
      });

      const result = await submitForm(data);

      logStateChange(stateTrackerRef.current, 'FORM_SUBMIT_SUCCESS', {
        result,
      });

      console.log('✅ [FORM_SUBMIT] 폼 제출 완료:', result);
      return result;
    } catch (submitError) {
      console.error('❌ [FORM_SUBMIT] 폼 제출 실패:', submitError);

      logStateChange(stateTrackerRef.current, 'FORM_SUBMIT_ERROR', {
        error: submitError,
      });

      throw submitError;
    }
  }, []); // 🔧 빈 의존성 배열로 안정화

  // ✅ 커스텀 안전 메서드들
  const getCurrentFormValuesSafely = React.useCallback((): FormSchemaValues => {
    console.log('🔧 [GET_CURRENT_VALUES] 현재 폼 값 안전 추출 시작');

    try {
      const currentRawValues = formMethods.getValues();
      console.log('🔧 [GET_CURRENT_VALUES] getValues() 호출 성공');

      const safeValues: FormSchemaValues = {
        ...defaultFormSchemaValues,
        ...currentRawValues,
      };

      console.log('✅ [GET_CURRENT_VALUES] 현재 폼 값 안전 추출 완료');
      return safeValues;
    } catch (getCurrentValuesError) {
      console.error(
        '❌ [GET_CURRENT_VALUES] getValues() 호출 실패:',
        getCurrentValuesError
      );
      return defaultFormSchemaValues;
    }
  }, [formMethods, defaultFormSchemaValues]);

  // ✅ 최종 상태 검증 (안전한 의존성 배열)
  const isReady = React.useMemo(() => {
    const ready =
      stateTrackerRef.current.formMethodsReady &&
      stateTrackerRef.current.stepNavigationReady &&
      stateTrackerRef.current.defaultValuesLoaded;

    logStateChange(stateTrackerRef.current, 'FINAL_READY_CHECK', {
      formMethodsReady: stateTrackerRef.current.formMethodsReady,
      stepNavigationReady: stateTrackerRef.current.stepNavigationReady,
      defaultValuesLoaded: stateTrackerRef.current.defaultValuesLoaded,
      isReady: ready,
    });

    return ready;
  }, [
    stateTrackerRef.current.formMethodsReady,
    stateTrackerRef.current.stepNavigationReady,
    stateTrackerRef.current.defaultValuesLoaded,
  ]);

  // 🚨 타임아웃 기반 무한로딩 감지
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isReady) {
        console.error('🚨 [TIMEOUT_WARNING] 훅 초기화 타임아웃! 10초 경과', {
          tracker: stateTrackerRef.current,
          formMethods: !!formMethods,
          stepNavigation: !!stepNavigation,
          timestamp: new Date().toISOString(),
        });

        if (typeof window !== 'undefined') {
          console.warn(
            '⚠️ 훅 초기화가 10초 이상 걸리고 있습니다. 개발자 도구를 확인하세요.'
          );
        }
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isReady]);

  console.log('🔧 [USE_FORM_STATE] useMultiStepFormState 훅 완료:', {
    isReady,
    renderCount: stateTrackerRef.current.renderCount,
    timestamp: new Date().toISOString(),
  });

  // ✅ MultiStepFormContainer가 기대하는 정확한 인터페이스 반환
  return {
    methods: formMethods,
    handleSubmit: formMethods.handleSubmit,
    onSubmit,
    currentStep: stepNavigation.currentStep,
    progressWidth: stepNavigation.progressWidth,
    goToNextStep: stepNavigation.goToNextStep,
    goToPrevStep: stepNavigation.goToPrevStep,
    goToStep: stepNavigation.goToStep,
    getCurrentFormValuesSafely,
    _debug: {
      isReady,
      stateTracker: stateTrackerRef.current,
      renderCount: 0, // Debug 모듈에서 관리되므로 0으로 설정
    },
  };
};

export default useMultiStepFormState;

console.log(
  '📄 [USE_FORM_STATE] ✅ Debug 모듈 연동된 useMultiStepFormState 모듈 로드 완료'
);
