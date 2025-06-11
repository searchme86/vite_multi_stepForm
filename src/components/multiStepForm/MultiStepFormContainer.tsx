import React from 'react';
import { FormProvider } from 'react-hook-form';
import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';
import { MultiStepFormProvider } from './store/multiStepFormCombinedContext';
import EditorStateContainer from './store/editorState/EditorStateContainer';
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import DesktopPreviewLayout from './layout/desktop/DesktopPreviewLayout';
import MobilePreviewContainer from './layout/mobile/MobilePreviewContainer';
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import StepContentContainer from './animation/StepContentContainer';
import NavigationButtons from './layout/shared/NavigationButtons';
import ToastManager from './steps/toast/parts/ToastManager';

function MultiStepFormContainer(): React.ReactNode {
  console.log('🏗️ MultiStepFormContainer: 완전히 분할된 메인 컨테이너 렌더링');

  const state = useMultiStepFormState();

  const {
    methods,
    handleSubmit,
    onSubmit,
    formValues,
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    showPreview,
    togglePreview,
    isMobile,
    addToast,
    isPreviewPanelOpen,
    setIsPreviewPanelOpen,
    togglePreviewPanel,
    imageViewConfig,
    setImageViewConfig,
    customGalleryViews,
    addCustomGalleryView,
    removeCustomGalleryView,
    clearCustomGalleryViews,
    updateCustomGalleryView,
    editorState,
    updateEditorContainers,
    updateEditorParagraphs,
    updateEditorCompletedContent,
    setEditorCompleted,
    resetEditorState,
  } = state;

  const contextValue = React.useMemo(
    () => ({
      formValues,
      addToast,
      isPreviewPanelOpen,
      setIsPreviewPanelOpen,
      togglePreviewPanel,
      imageViewConfig,
      setImageViewConfig,
      customGalleryViews,
      addCustomGalleryView,
      removeCustomGalleryView,
      clearCustomGalleryViews,
      updateCustomGalleryView,
      editorState,
      updateEditorContainers,
      updateEditorParagraphs,
      updateEditorCompletedContent,
      setEditorCompleted,
      resetEditorState,
    }),
    [
      formValues,
      addToast,
      isPreviewPanelOpen,
      setIsPreviewPanelOpen,
      togglePreviewPanel,
      imageViewConfig,
      setImageViewConfig,
      customGalleryViews,
      addCustomGalleryView,
      removeCustomGalleryView,
      clearCustomGalleryViews,
      updateCustomGalleryView,
      editorState,
      updateEditorContainers,
      updateEditorParagraphs,
      updateEditorCompletedContent,
      setEditorCompleted,
      resetEditorState,
    ]
  );

  return (
    <MultiStepFormProvider value={contextValue}>
      <EditorStateContainer persistState={true}>
        <div className="p-2 mx-auto max-w-[1200px] sm:p-4 md:p-8">
          {/* 헤더 */}
          <FormHeaderContainer
            showPreview={showPreview}
            onTogglePreview={togglePreview}
          />

          {/* 메인 컨텐츠 */}
          <DesktopPreviewLayout showPreview={showPreview}>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 스텝 네비게이션 */}
                <StepNavigationWrapper
                  currentStep={currentStep}
                  progressWidth={progressWidth}
                  onStepChange={goToStep}
                />

                {/* 스텝 컨텐츠 */}
                <StepContentContainer currentStep={currentStep} />

                {/* 네비게이션 버튼들 */}
                <NavigationButtons
                  currentStep={currentStep}
                  onNext={goToNextStep}
                  onPrev={goToPrevStep}
                />
              </form>
            </FormProvider>
          </DesktopPreviewLayout>

          {/* 모바일 프리뷰 컨테이너 */}
          {!showPreview && (
            <MobilePreviewContainer>{null}</MobilePreviewContainer>
          )}

          {/* 토스트 매니저 */}
          <ToastManager maxToasts={3} position="top-right" />
        </div>
      </EditorStateContainer>
    </MultiStepFormProvider>
  );
}

export default MultiStepFormContainer;
