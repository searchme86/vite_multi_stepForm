// src/components/multiStepForm/reactHookForm/useMultiStepFormState.ts

import { useCallback, useMemo } from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useMultiStepFormStore } from '../store/multiStepForm/multiStepFormStore';
import {
  getTotalSteps,
  getMaxStep,
  isValidStepNumber,
} from '../types/stepTypes.ts';

export const useMultiStepFormState = () => {
  console.log('🎣 [USE_MULTI_STEP_FORM_STATE] 훅 호출됨');

  const { methods, handleSubmit, errors, trigger } = useFormMethods();

  // showPreview, togglePreview, setShowPreview 제거 - 더 이상 필요없음
  const {
    formValues,
    updateFormValue,
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    addToast,
    editorCompletedContent,
    isEditorCompleted,
    updateEditorContent,
    setEditorCompleted,
  } = useMultiStepFormStore();

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

  console.log(
    '🔍 [USE_MULTI_STEP_FORM_STATE] validateCurrentStep 함수 준비 완료'
  );

  const { onSubmit } = useFormSubmit({ addToast });

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
      return;
    }

    const stepValidationResult = await validateCurrentStep(currentStep);
    console.log(
      '✅ [USE_MULTI_STEP_FORM_STATE] 현재 스텝 검증 결과:',
      stepValidationResult
    );

    const canMoveToNextStep =
      stepValidationResult && currentStep < stepInformation.maxStep;
    if (canMoveToNextStep) {
      console.log(
        `➡️ [USE_MULTI_STEP_FORM_STATE] 다음 스텝으로 이동: ${currentStep} → ${
          currentStep + 1
        }`
      );
      goToNextStep();
    } else {
      console.log('⚠️ [USE_MULTI_STEP_FORM_STATE] 다음 스텝 이동 불가:', {
        stepValidationResult,
        currentStep,
        maxStep: stepInformation.maxStep,
        canMove: currentStep < stepInformation.maxStep,
      });
    }
  }, [validateCurrentStep, currentStep, goToNextStep, stepInformation.maxStep]);

  const enhancedGoToSpecificStepHandler = useCallback(
    async (targetStep: number) => {
      console.log('🎯 [USE_MULTI_STEP_FORM_STATE] enhancedGoToStep 호출됨:', {
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

      const isCurrentStepValid = isValidStepNumber(currentStep);
      if (!isCurrentStepValid) {
        console.error(
          `❌ [USE_MULTI_STEP_FORM_STATE] Invalid current step: ${currentStep}`
        );
        return;
      }

      // 앞으로 이동하는 경우에만 현재 스텝 검증
      const isMovingForward = targetStep > currentStep;
      if (isMovingForward) {
        console.log(
          '🔍 [USE_MULTI_STEP_FORM_STATE] 앞으로 이동하므로 현재 스텝 검증 중...'
        );
        const stepValidationResult = await validateCurrentStep(currentStep);
        const canMoveForward = stepValidationResult;

        if (!canMoveForward) {
          console.log(
            '❌ [USE_MULTI_STEP_FORM_STATE] 현재 스텝 검증 실패, 이동 취소'
          );
          return;
        }
      }

      console.log(
        `🎯 [USE_MULTI_STEP_FORM_STATE] 스텝 이동 실행: ${currentStep} → ${targetStep}`
      );
      goToStep(targetStep);
    },
    [currentStep, validateCurrentStep, goToStep]
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
  const isFirstStepActive = currentStep === 1;
  const isLastStepActive = currentStep === stepInformation.maxStep;
  const canNavigateToNextStep = currentStep < stepInformation.maxStep;
  const canNavigateToPreviousStep = currentStep > 1;

  console.log('🔍 [USE_MULTI_STEP_FORM_STATE] 편의 상태 계산 완료:', {
    isFirstStepActive,
    isLastStepActive,
    canNavigateToNextStep,
    canNavigateToPreviousStep,
  });

  // showPreview, togglePreview, setShowPreview 제거 - Zustand로 이동
  const returnedStateAndActions = {
    // 폼 메서드들
    methods,
    handleSubmit,
    onSubmit,

    // 폼 데이터
    formValues,
    updateFormValue,

    // 스텝 관련
    currentStep,
    progressWidth,
    goToNextStep: enhancedGoToNextStepHandler,
    goToPrevStep,
    goToStep: enhancedGoToSpecificStepHandler,

    // 검증 관련
    validateCurrentStep,

    // 토스트
    addToast,

    // 에디터 관련
    updateEditorContent,
    setEditorCompleted,

    // 분석 관련
    getFormAnalytics: getFormAnalyticsData,

    // 스텝 정보
    stepInfo: stepInformation,

    // 편의 상태들
    isFirstStep: isFirstStepActive,
    isLastStep: isLastStepActive,
    canGoNext: canNavigateToNextStep,
    canGoPrev: canNavigateToPreviousStep,
  };

  console.log(
    '✅ [USE_MULTI_STEP_FORM_STATE] 반환값 준비 완료 (showPreview 관련 제거됨)'
  );
  return returnedStateAndActions;
};
