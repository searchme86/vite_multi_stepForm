import { useCallback, useMemo } from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
//====여기부터 수정됨====
import {
  getTotalSteps, // ✅ TOTAL_STEPS 대신 함수 사용
  getMaxStep, // ✅ MAX_STEP 대신 함수 사용
  isValidStepNumber,
} from '../types/stepTypes.ts';
//====여기까지 수정됨====

export const useMultiStepFormState = () => {
  console.log('🎣 useMultiStepFormState 훅 호출됨');

  const { methods, handleSubmit, errors, trigger } = useFormMethods();

  const {
    formValues,
    updateFormValue,
    currentStep,
    progressWidth,
    showPreview,
    goToNextStep,
    goToPrevStep,
    goToStep,
    togglePreview,
    setShowPreview,
    addToast,
    editorCompletedContent,
    isEditorCompleted,
    updateEditorContent,
    setEditorCompleted,
  } = useMultiStepFormStore();

  //====여기부터 수정됨====
  // 스텝 관련 정보를 useMemo로 최적화
  // 이유: 함수 호출 결과를 캐싱하여 불필요한 재계산 방지
  const stepInfo = useMemo(() => {
    const totalSteps = getTotalSteps(); // 런타임에 안전하게 계산
    const maxStep = getMaxStep(); // 런타임에 안전하게 계산

    console.log('📊 스텝 정보 계산됨:', { totalSteps, maxStep, currentStep });

    return {
      totalSteps,
      maxStep,
    };
  }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 한 번만 계산
  //====여기까지 수정됨====

  const { validateCurrentStep } = useValidation({
    trigger,
    errors,
    editorState: {
      containers: [],
      paragraphs: [],
      completedContent: editorCompletedContent,
      isCompleted: isEditorCompleted,
    },
    addToast,
  });

  const { onSubmit } = useFormSubmit({ addToast });

  //====여기부터 수정됨====
  const enhancedGoToNextStep = useCallback(async () => {
    console.log('➡️ enhancedGoToNextStep 호출됨, 현재 스텝:', currentStep);

    if (!isValidStepNumber(currentStep)) {
      console.error(`❌ Invalid current step: ${currentStep}`);
      return;
    }

    const isValid = await validateCurrentStep(currentStep);
    console.log('✅ 현재 스텝 검증 결과:', isValid);

    // stepInfo.maxStep 사용 (메모이제이션된 값)
    if (isValid && currentStep < stepInfo.maxStep) {
      console.log(`➡️ 다음 스텝으로 이동: ${currentStep} → ${currentStep + 1}`);
      goToNextStep();
    } else {
      console.log('⚠️ 다음 스텝 이동 불가:', {
        isValid,
        currentStep,
        maxStep: stepInfo.maxStep,
        canMove: currentStep < stepInfo.maxStep,
      });
    }
  }, [validateCurrentStep, currentStep, goToNextStep, stepInfo.maxStep]);
  //====여기까지 수정됨====

  const enhancedGoToStep = useCallback(
    async (step: number) => {
      console.log('🎯 enhancedGoToStep 호출됨:', {
        from: currentStep,
        to: step,
      });

      if (!isValidStepNumber(step)) {
        console.error(`❌ Invalid target step: ${step}`);
        return;
      }

      if (!isValidStepNumber(currentStep)) {
        console.error(`❌ Invalid current step: ${currentStep}`);
        return;
      }

      // 앞으로 이동하는 경우에만 현재 스텝 검증
      if (step > currentStep) {
        console.log('🔍 앞으로 이동하므로 현재 스텝 검증 중...');
        const isValid = await validateCurrentStep(currentStep);
        if (!isValid) {
          console.log('❌ 현재 스텝 검증 실패, 이동 취소');
          return;
        }
      }

      console.log(`🎯 스텝 이동 실행: ${currentStep} → ${step}`);
      goToStep(step);
    },
    [currentStep, validateCurrentStep, goToStep]
  );

  //====여기부터 수정됨====
  const getFormAnalytics = useCallback(() => {
    const analytics = {
      currentStep,
      totalSteps: stepInfo.totalSteps, // 메모이제이션된 값 사용
      errorCount: Object.keys(errors).length,
      hasUnsavedChanges: false,
      isFormValid: Object.keys(errors).length === 0,
    };

    console.log('📈 폼 분석 정보:', analytics);
    return analytics;
  }, [currentStep, errors, stepInfo.totalSteps]);
  //====여기까지 수정됨====

  // 반환할 객체도 로깅
  const returnValue = {
    methods,
    handleSubmit,
    onSubmit,
    formValues,
    updateFormValue,
    currentStep,
    progressWidth,
    goToNextStep: enhancedGoToNextStep,
    goToPrevStep,
    goToStep: enhancedGoToStep,
    validateCurrentStep,
    addToast,
    showPreview,
    togglePreview,
    setShowPreview,
    updateEditorContent,
    setEditorCompleted,
    getFormAnalytics,

    //====여기부터 추가됨====
    // 추가적으로 유용한 정보들도 제공
    stepInfo, // 스텝 관련 정보 (totalSteps, maxStep)

    // 편의 함수들 추가
    isFirstStep: currentStep === 1, // 첫 번째 스텝인지 확인
    isLastStep: currentStep === stepInfo.maxStep, // 마지막 스텝인지 확인
    canGoNext: currentStep < stepInfo.maxStep, // 다음 스텝으로 이동 가능한지
    canGoPrev: currentStep > 1, // 이전 스텝으로 이동 가능한지
    //====여기까지 추가됨====
  };

  console.log('✅ useMultiStepFormState 반환값 준비 완료');
  return returnValue;
};
