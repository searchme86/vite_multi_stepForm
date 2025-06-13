import React from 'react';
import { FormProvider } from 'react-hook-form';
import { Card, CardBody } from '@heroui/react';

import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';

import PreviewPanel from '../previewPanel/PreviewPanelContainer';

import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import DesktopPreviewLayout from './layout/desktop/DesktopPreviewLayout';

import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';

import StepContentContainer from './animation/StepContentContainer';

import ToastManager from '../toaster/ToastManager';

import { StepNumber, renderStepComponent } from './types/stepTypes';

function MultiStepFormContainer(): React.ReactNode {
  console.log('🏗️ MultiStepFormContainer: 메인 컨테이너 렌더링 시작');

  const {
    methods,
    handleSubmit,
    onSubmit,
    currentStep,
    progressWidth,
    goToNextStep,
    goToPrevStep,
    goToStep,
    showPreview,
    togglePreview,
    getFormAnalytics,
  } = useMultiStepFormState();

  console.log('🏗️ MultiStepFormContainer: 상태 관리 훅 초기화 완료', {
    currentStep,
    showPreview,
    analytics: getFormAnalytics(),
  });

  const handleStepChange = React.useCallback(
    (step: StepNumber) => {
      console.log('🎯 MultiStepFormContainer: 스텝 변경 요청', step);
      goToStep(step);
    },
    [goToStep]
  );

  const handlePreviewToggle = React.useCallback(() => {
    console.log('👁️ MultiStepFormContainer: 프리뷰 토글');
    togglePreview();
  }, [togglePreview]);

  const handleNextStep = React.useCallback(() => {
    console.log('➡️ MultiStepFormContainer: 다음 스텝 이동');
    goToNextStep();
  }, [goToNextStep]);

  const handlePrevStep = React.useCallback(() => {
    console.log('⬅️ MultiStepFormContainer: 이전 스텝 이동');
    goToPrevStep();
  }, [goToPrevStep]);

  const renderCurrentStep = React.useCallback(() => {
    console.log(
      '🔄 MultiStepFormContainer: 현재 스텝 컴포넌트 렌더링',
      currentStep
    );
    return renderStepComponent(currentStep);
  }, [currentStep]);

  console.log('🏗️ MultiStepFormContainer: JSX 렌더링 시작');

  return (
    <div className="p-2 mx-auto max-w-[1200px] sm:p-4 md:p-8">
      <FormHeaderContainer
        showPreview={showPreview}
        onTogglePreview={handlePreviewToggle}
      />

      <DesktopPreviewLayout>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <StepNavigationWrapper
              currentStep={currentStep}
              progressWidth={progressWidth}
              onStepChange={handleStepChange}
            />

            <StepContentContainer currentStep={currentStep}>
              {renderCurrentStep()}
            </StepContentContainer>

            <NavigationButtons
              currentStep={currentStep}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          </form>
        </FormProvider>
      </DesktopPreviewLayout>

      {showPreview && (
        <div className="hidden md:block w-full lg:w-1/2 h-[500px] lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
          <Card className="h-full shadow-sm">
            <CardBody className="p-3 sm:p-6">
              <PreviewPanel />
            </CardBody>
          </Card>
        </div>
      )}

      <div className="md:hidden">
        <PreviewPanel />
      </div>

      <ToastManager />
    </div>
  );
}

export default MultiStepFormContainer;
