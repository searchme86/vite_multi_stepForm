// src/components/multiStepForm/reactHookForm/useMultiStepFormState.ts

import { useCallback, useMemo, useState } from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import {
  getTotalSteps,
  getMaxStep,
  getMinStep,
  isValidStepNumber,
  type StepNumber,
} from '../types/stepTypes.ts';

// 🔧 구체적인 토스트 옵션 인터페이스 정의 (any 제거)
interface ToastOptionsFromValidation {
  title: string;
  description?: string;
  color: string;
}

interface ToastOptionsFromFormSubmit {
  title?: string;
  color?: string;
  message?: string;
}

// 🔧 스텝 번호 변환 함수들 (타입단언 제거)
const createNextStepNumber = (currentStepValue: StepNumber): StepNumber => {
  const nextStepCandidate = currentStepValue + 1;

  // 유효성 검증을 통한 안전한 타입 변환
  if (isValidStepNumber(nextStepCandidate)) {
    return nextStepCandidate;
  }

  // fallback: 현재 스텝 유지
  console.warn(
    '⚠️ [STEP_CONVERTER] 다음 스텝이 유효하지 않음, 현재 스텝 유지:',
    {
      currentStep: currentStepValue,
      nextStepCandidate,
    }
  );
  return currentStepValue;
};

const createPrevStepNumber = (currentStepValue: StepNumber): StepNumber => {
  const prevStepCandidate = currentStepValue - 1;

  // 유효성 검증을 통한 안전한 타입 변환
  if (isValidStepNumber(prevStepCandidate)) {
    return prevStepCandidate;
  }

  // fallback: 현재 스텝 유지
  console.warn(
    '⚠️ [STEP_CONVERTER] 이전 스텝이 유효하지 않음, 현재 스텝 유지:',
    {
      currentStep: currentStepValue,
      prevStepCandidate,
    }
  );
  return currentStepValue;
};

export const useMultiStepFormState = () => {
  console.log('🎣 [USE_MULTI_STEP_FORM_STATE] 훅 호출됨');

  const { methods, handleSubmit, errors, trigger } = useFormMethods();

  // 🔧 실제 multiStepFormStore API 사용
  const {
    getFormValues,
    updateFormValue,
    addToast: storeAddToast,
  } = useMultiStepFormStore();

  // 🔧 로컬 상태로 스텝 관리 (스토어에 없는 기능)
  const [currentStepState, setCurrentStepState] = useState<StepNumber>(
    getMinStep()
  );
  const [progressWidthState, setProgressWidthState] = useState<number>(0);

  console.log('📊 [USE_MULTI_STEP_FORM_STATE] 스토어 및 상태 초기화:', {
    hasGetFormValues: typeof getFormValues === 'function',
    hasUpdateFormValue: typeof updateFormValue === 'function',
    hasAddToast: typeof storeAddToast === 'function',
    currentStepState,
    progressWidthState,
    timestamp: new Date().toISOString(),
  });

  // 🔧 currentStep 안전성 확보
  const currentStep = useMemo<StepNumber>(() => {
    console.log('🔍 [USE_MULTI_STEP_FORM_STATE] currentStep 안전성 검증:', {
      currentStepState,
      stepType: typeof currentStepState,
      timestamp: new Date().toISOString(),
    });

    const hasValidCurrentStep =
      currentStepState !== null && currentStepState !== undefined;

    if (!hasValidCurrentStep) {
      console.warn(
        '⚠️ [USE_MULTI_STEP_FORM_STATE] currentStepState가 null/undefined, fallback 적용'
      );
      const fallbackStep = getMinStep();
      console.log(
        '🔧 [USE_MULTI_STEP_FORM_STATE] fallback 스텝:',
        fallbackStep
      );
      return fallbackStep;
    }

    const isValidStep = isValidStepNumber(currentStepState);

    if (!isValidStep) {
      console.warn(
        '⚠️ [USE_MULTI_STEP_FORM_STATE] 지원되지 않는 스텝 번호, fallback 적용:',
        {
          invalidStep: currentStepState,
        }
      );
      const fallbackStep = getMinStep();
      console.log(
        '🔧 [USE_MULTI_STEP_FORM_STATE] fallback 스텝:',
        fallbackStep
      );
      return fallbackStep;
    }

    console.log(
      '✅ [USE_MULTI_STEP_FORM_STATE] 유효한 currentStep:',
      currentStepState
    );
    return currentStepState;
  }, [currentStepState]);

  // 🔧 폼 데이터 가져오기 (구조분해할당과 fallback)
  const formData = useMemo(() => {
    try {
      const rawFormData = getFormValues();
      console.log('📋 [USE_MULTI_STEP_FORM_STATE] 폼 데이터 조회:', {
        hasData: !!rawFormData,
        keys: rawFormData ? Object.keys(rawFormData) : [],
        timestamp: new Date().toISOString(),
      });

      // 구조분해할당과 fallback으로 안전한 데이터 추출
      const {
        nickname = '',
        emailPrefix = '',
        emailDomain = '',
        bio = '',
        title = '',
        description = '',
        tags = '',
        content = '',
        userImage = '',
        mainImage = null,
        media = [],
        sliderImages = [],
        editorCompletedContent = '',
        isEditorCompleted = false,
      } = rawFormData || {};

      return {
        nickname,
        emailPrefix,
        emailDomain,
        bio,
        title,
        description,
        tags,
        content,
        userImage,
        mainImage,
        media,
        sliderImages,
        editorCompletedContent,
        isEditorCompleted,
      };
    } catch (error) {
      console.error(
        '❌ [USE_MULTI_STEP_FORM_STATE] 폼 데이터 조회 실패:',
        error
      );
      return {
        nickname: '',
        emailPrefix: '',
        emailDomain: '',
        bio: '',
        title: '',
        description: '',
        tags: '',
        content: '',
        userImage: '',
        mainImage: null,
        media: [],
        sliderImages: [],
        editorCompletedContent: '',
        isEditorCompleted: false,
      };
    }
  }, [getFormValues]);

  // 🔧 에디터 상태 안전하게 처리 (구조분해할당 적용)
  const { editorCompletedContent = '', isEditorCompleted = false } = formData;

  // 스텝 관련 정보를 useMemo로 최적화
  const stepInformation = useMemo(() => {
    const totalStepsCount = getTotalSteps();
    const maxStepNumber = getMaxStep();

    console.log('📊 [USE_MULTI_STEP_FORM_STATE] 스텝 정보 계산됨:', {
      totalStepsCount,
      maxStepNumber,
      currentStep,
    });

    return {
      totalSteps: totalStepsCount,
      maxStep: maxStepNumber,
    };
  }, [currentStep]);

  // 🔧 진행률 계산 함수
  const calculateProgress = useCallback((step: StepNumber): number => {
    const minStep = getMinStep();
    const totalSteps = getTotalSteps();

    if (totalSteps <= 1) return 100;

    const progress = ((step - minStep) / (totalSteps - 1)) * 100;
    return Math.max(0, Math.min(100, progress));
  }, []);

  // 🔧 안전한 토스트 함수 래핑 (multiStepFormStore API에 맞게 수정)
  const safeAddToast = useCallback(
    (message: string, color: 'success' | 'danger' | 'warning' | 'info') => {
      console.log('📢 [USE_MULTI_STEP_FORM_STATE] 토스트 메시지:', {
        message,
        color,
      });

      if (typeof storeAddToast === 'function') {
        // multiStepFormStore의 ToastMessage 형식에 맞게 수정
        const toastMessage = {
          title: message,
          description: '', // 필수 속성 추가
          color, // 이미 올바른 리터럴 타입
        };
        storeAddToast(toastMessage);
      } else {
        console.warn(
          '⚠️ [USE_MULTI_STEP_FORM_STATE] addToast 함수를 찾을 수 없음'
        );
      }
    },
    [storeAddToast]
  );

  // 🔧 색상 타입 검증 함수 (타입단언 완전 제거)
  const validateColorType = useCallback(
    (color: string): 'success' | 'danger' | 'warning' | 'info' => {
      // Map을 사용한 타입 안전한 검증 (as const 제거)
      const validColorsMap = new Map<
        string,
        'success' | 'danger' | 'warning' | 'info'
      >([
        ['success', 'success'],
        ['danger', 'danger'],
        ['warning', 'warning'],
        ['info', 'info'],
      ]);

      const validatedColor = validColorsMap.get(color);

      if (validatedColor) {
        return validatedColor;
      }

      return 'info'; // fallback
    },
    []
  );

  // 🔧 검증용 addToast 래퍼 (useValidation API에 맞게)
  const validationAddToast = useCallback(
    (options: ToastOptionsFromValidation) => {
      const { title, color } = options;
      const validColor = validateColorType(color);
      safeAddToast(title, validColor);
    },
    [safeAddToast, validateColorType]
  );

  const { validateCurrentStep } = useValidation({
    trigger,
    errors,
    editorState: {
      containers: [],
      paragraphs: [],
      completedContent: editorCompletedContent,
      isCompleted: isEditorCompleted,
    },
    addToast: validationAddToast,
  });

  console.log(
    '🔍 [USE_MULTI_STEP_FORM_STATE] validateCurrentStep 함수 준비 완료'
  );

  // 🔧 폼 제출용 addToast 래퍼 (useFormSubmit API에 맞게, any 제거)
  const formSubmitAddToast = useCallback(
    (options: ToastOptionsFromFormSubmit) => {
      const { title, message, color } = options;

      // 메시지 추출 로직
      const finalMessage = title || message || '알림';

      // 색상 추출 및 검증
      const finalColor = color || 'info';
      const validColor = validateColorType(finalColor);

      safeAddToast(finalMessage, validColor);
    },
    [safeAddToast, validateColorType]
  );

  const { onSubmit } = useFormSubmit({ addToast: formSubmitAddToast });

  // 🔧 스텝 이동 함수들 (로컬 상태 기반, 타입단언 제거)
  const enhancedGoToNextStepHandler = useCallback(async () => {
    console.log(
      '➡️ [USE_MULTI_STEP_FORM_STATE] enhancedGoToNextStep 호출됨, 현재 스텝:',
      currentStep
    );

    const isCurrentStepValid = isValidStepNumber(currentStep);
    if (!isCurrentStepValid) {
      console.error(
        `❌ [USE_MULTI_STEP_FORM_STATE] Invalid current step: ${currentStep}`
      );
      const recoveryStep = getMinStep();
      setCurrentStepState(recoveryStep);
      setProgressWidthState(calculateProgress(recoveryStep));
      return;
    }

    if (currentStep >= stepInformation.maxStep) {
      console.log('⚠️ [USE_MULTI_STEP_FORM_STATE] 이미 마지막 스텝에 도달');
      return;
    }

    try {
      const stepValidationResult = await validateCurrentStep(currentStep);
      console.log(
        '✅ [USE_MULTI_STEP_FORM_STATE] 현재 스텝 검증 결과:',
        stepValidationResult
      );

      const canMoveToNextStep =
        stepValidationResult && currentStep < stepInformation.maxStep;

      if (canMoveToNextStep) {
        // 🔧 타입단언 제거: 안전한 스텝 번호 생성 함수 사용
        const nextStep = createNextStepNumber(currentStep);
        console.log(
          `➡️ [USE_MULTI_STEP_FORM_STATE] 다음 스텝으로 이동: ${currentStep} → ${nextStep}`
        );

        setCurrentStepState(nextStep);
        setProgressWidthState(calculateProgress(nextStep));
      } else {
        console.log('⚠️ [USE_MULTI_STEP_FORM_STATE] 다음 스텝 이동 불가');
      }
    } catch (validationError) {
      console.error(
        '❌ [USE_MULTI_STEP_FORM_STATE] 스텝 검증 중 에러 발생:',
        validationError
      );
      safeAddToast(
        '스텝 이동 중 오류가 발생했습니다. 다시 시도해주세요.',
        'danger'
      );
    }
  }, [
    validateCurrentStep,
    currentStep,
    stepInformation.maxStep,
    safeAddToast,
    calculateProgress,
  ]);

  // 🔧 이전 스텝 이동 함수 (타입단언 제거)
  const enhancedGoToPrevStepHandler = useCallback(() => {
    console.log('⬅️ [USE_MULTI_STEP_FORM_STATE] goToPrevStep 호출됨');

    const minStep = getMinStep();
    if (currentStep > minStep) {
      // 🔧 타입단언 제거: 안전한 스텝 번호 생성 함수 사용
      const prevStep = createPrevStepNumber(currentStep);
      console.log(
        `⬅️ [USE_MULTI_STEP_FORM_STATE] 이전 스텝으로 이동: ${currentStep} → ${prevStep}`
      );
      setCurrentStepState(prevStep);
      setProgressWidthState(calculateProgress(prevStep));
    } else {
      console.log('⚠️ [USE_MULTI_STEP_FORM_STATE] 이미 첫 번째 스텝입니다');
    }
  }, [currentStep, calculateProgress]);

  // 🔧 특정 스텝 이동 함수
  const enhancedGoToSpecificStepHandler = useCallback(
    async (targetStep: number) => {
      console.log('🎯 [USE_MULTI_STEP_FORM_STATE] goToStep 호출됨:', {
        from: currentStep,
        to: targetStep,
      });

      const isTargetStepValid = isValidStepNumber(targetStep);
      if (!isTargetStepValid) {
        console.error(
          `❌ [USE_MULTI_STEP_FORM_STATE] Invalid target step: ${targetStep}`
        );
        return;
      }

      if (targetStep === currentStep) {
        console.log('⚠️ [USE_MULTI_STEP_FORM_STATE] 동일한 스텝으로 이동 시도');
        return;
      }

      try {
        const isMovingForward = targetStep > currentStep;
        if (isMovingForward) {
          const stepValidationResult = await validateCurrentStep(currentStep);
          if (!stepValidationResult) {
            console.log('❌ [USE_MULTI_STEP_FORM_STATE] 현재 스텝 검증 실패');
            return;
          }
        }

        console.log(
          `🎯 [USE_MULTI_STEP_FORM_STATE] 스텝 이동: ${currentStep} → ${targetStep}`
        );
        setCurrentStepState(targetStep);
        setProgressWidthState(calculateProgress(targetStep));
      } catch (navigationError) {
        console.error(
          '❌ [USE_MULTI_STEP_FORM_STATE] 스텝 이동 에러:',
          navigationError
        );
        safeAddToast('스텝 이동 중 오류가 발생했습니다.', 'danger');
      }
    },
    [currentStep, validateCurrentStep, safeAddToast, calculateProgress]
  );

  // 🔧 에디터 관련 함수들 (updateFormValue 사용)
  const updateEditorContentHandler = useCallback(
    (content: string) => {
      console.log('📝 [USE_MULTI_STEP_FORM_STATE] updateEditorContent:', {
        contentLength: content?.length || 0,
      });

      if (typeof updateFormValue === 'function') {
        updateFormValue('editorCompletedContent', content);
      }
    },
    [updateFormValue]
  );

  const setEditorCompletedHandler = useCallback(
    (completed: boolean) => {
      console.log(
        '✅ [USE_MULTI_STEP_FORM_STATE] setEditorCompleted:',
        completed
      );

      if (typeof updateFormValue === 'function') {
        updateFormValue('isEditorCompleted', completed);
      }
    },
    [updateFormValue]
  );

  const getFormAnalyticsData = useCallback(() => {
    const formAnalyticsInfo = {
      currentStep,
      totalSteps: stepInformation.totalSteps,
      errorCount: Object.keys(errors).length,
      hasUnsavedChanges: false,
      isFormValid: Object.keys(errors).length === 0,
    };

    console.log(
      '📈 [USE_MULTI_STEP_FORM_STATE] 폼 분석 정보:',
      formAnalyticsInfo
    );
    return formAnalyticsInfo;
  }, [currentStep, errors, stepInformation.totalSteps]);

  // 편의 상태 계산
  const isFirstStepActive = currentStep === getMinStep();
  const isLastStepActive = currentStep === stepInformation.maxStep;
  const canNavigateToNextStep = currentStep < stepInformation.maxStep;
  const canNavigateToPreviousStep = currentStep > getMinStep();

  console.log('🔍 [USE_MULTI_STEP_FORM_STATE] 편의 상태 계산 완료:', {
    isFirstStepActive,
    isLastStepActive,
    canNavigateToNextStep,
    canNavigateToPreviousStep,
    safeCurrentStep: currentStep,
  });

  // 🔧 훅 초기화 완료 상태
  const isHookInitialized = useMemo(() => {
    const hasValidCurrentStep = isValidStepNumber(currentStep);
    const hasValidMethods = !!methods && !!handleSubmit;
    const hasValidStoreConnection = !!getFormValues && !!updateFormValue;

    const isInitialized =
      hasValidCurrentStep && hasValidMethods && hasValidStoreConnection;

    console.log('🔧 [USE_MULTI_STEP_FORM_STATE] 훅 초기화 상태:', {
      hasValidCurrentStep,
      hasValidMethods,
      hasValidStoreConnection,
      isInitialized,
      currentStep,
    });

    return isInitialized;
  }, [currentStep, methods, handleSubmit, getFormValues, updateFormValue]);

  const returnedStateAndActions = {
    // 폼 메서드들
    methods,
    handleSubmit,
    onSubmit,

    // 폼 데이터 (구조분해할당 적용)
    formValues: formData,
    updateFormValue,

    // 스텝 관련 (로컬 상태 기반)
    currentStep,
    progressWidth: progressWidthState,
    goToNextStep: enhancedGoToNextStepHandler,
    goToPrevStep: enhancedGoToPrevStepHandler,
    goToStep: enhancedGoToSpecificStepHandler,

    // 검증 관련
    validateCurrentStep,

    // 토스트
    addToast: safeAddToast,

    // 에디터 관련 (updateFormValue 기반)
    updateEditorContent: updateEditorContentHandler,
    setEditorCompleted: setEditorCompletedHandler,

    // 분석 관련
    getFormAnalytics: getFormAnalyticsData,

    // 스텝 정보
    stepInfo: stepInformation,

    // 편의 상태들
    isFirstStep: isFirstStepActive,
    isLastStep: isLastStepActive,
    canGoNext: canNavigateToNextStep,
    canGoPrev: canNavigateToPreviousStep,

    // 훅 초기화 상태
    isHookInitialized,
  };

  console.log('✅ [USE_MULTI_STEP_FORM_STATE] 반환값 준비 완료:', {
    currentStep: returnedStateAndActions.currentStep,
    isHookInitialized: returnedStateAndActions.isHookInitialized,
  });

  return returnedStateAndActions;
};
