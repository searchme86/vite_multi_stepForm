import React from 'react';
import { useFormMethods } from './formMethods/useFormMethods';
import { useWatchedValues } from './formValues/useWatchedValues';
import { useStepNavigation } from './actions/useStepNavigation';
import { useValidation } from './validation/useValidation';
import { useFormSubmit } from './actions/useFormSubmit';
import { useToastCreation } from '../steps/toast/hooks/useToastCreation';
import { usePreviewState } from '../steps/preview/hooks/usePreviewState';
import { useImageViewConfig } from '../steps/imageGallery/hooks/useImageViewConfig';
import { useCustomGalleryViews } from '../steps/imageGallery/hooks/useCustomGalleryViews';
import { useEditorState } from '../steps/editor/hooks/useEditorState';
import { useEditorFormSync } from '../steps/editor/hooks/useEditorFormSync';
import { useMobileDetection } from '../utils/responsive/useMobileDetection';

export const useMultiStepFormState = () => {
  console.log('🏗️ useMultiStepFormState: 메인 상태 관리 훅 초기화');

  const { methods, handleSubmit, errors, trigger, watch, setValue } =
    useFormMethods();
  const { formValues, allWatchedValues } = useWatchedValues(watch);
  const { currentStep, progressWidth, goToNextStep, goToPrevStep, goToStep } =
    useStepNavigation();
  const { addToast } = useToastCreation();

  //====여기부터 수정됨====
  // ✅ 수정: editor 변수를 useValidation 호출 이전으로 이동
  // 이유: useValidation에서 editor.editorState를 참조하기 때문에 먼저 정의되어야 함
  // 의미: 변수 의존성 순서를 올바르게 정렬하여 undefined 참조 에러 방지
  const editor = useEditorState();
  //====여기까지 수정됨====

  const { validateCurrentStep } = useValidation({
    trigger,
    errors,
    editorState: editor.editorState,
    addToast,
  });
  const { onSubmit } = useFormSubmit({ addToast });

  const previewState = usePreviewState();
  const imageConfig = useImageViewConfig();
  const galleryViews = useCustomGalleryViews();

  //====여기부터 수정됨====
  // ✅ 수정: editor 변수 정의를 위로 이동했으므로 여기서 제거
  // 이유: 중복 정의 방지 및 의존성 순서 정리
  //====여기까지 수정됨====

  const { isMobile } = useMobileDetection();

  useEditorFormSync({
    setValue,
    editorState: editor.editorState,
    allWatchedValues,
  });

  const enhancedGoToNextStep = React.useCallback(async () => {
    console.log('➡️ enhancedGoToNextStep: 유효성 검사 후 다음 스텝 이동');
    const isValid = await validateCurrentStep(currentStep);
    if (isValid && currentStep < 5) {
      goToNextStep();
    }
  }, [validateCurrentStep, currentStep, goToNextStep]);

  const enhancedGoToStep = React.useCallback(
    async (step: number) => {
      console.log('🎯 enhancedGoToStep: 유효성 검사 후 특정 스텝 이동', step);
      if (step > currentStep) {
        const isValid = await validateCurrentStep(currentStep);
        if (!isValid) return;
      }
      goToStep(step as any);
    },
    [currentStep, validateCurrentStep, goToStep]
  );

  console.log('🏗️ useMultiStepFormState: 초기화 완료');

  return {
    // Form methods
    methods,
    handleSubmit,
    onSubmit,
    formValues,

    // Step navigation
    currentStep,
    progressWidth,
    goToNextStep: enhancedGoToNextStep,
    goToPrevStep,
    goToStep: enhancedGoToStep,

    // Toast
    addToast,

    // Preview
    ...previewState,

    // Image/Gallery
    ...imageConfig,
    ...galleryViews,

    // Editor
    ...editor,

    // Responsive
    isMobile,
  };
};
