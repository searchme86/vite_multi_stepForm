import React from 'react';
import { FormProvider } from 'react-hook-form';
import { Card, CardBody } from '@heroui/react';

// Core Hook - 메인 상태 관리 훅
import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';

// Step Components - 개별 스텝 컴포넌트들
// import UserInfoStep from './user-info-step';
import UserInfoStep from '../user-info-step';
import BlogBasicStep from '../blog-basic-step';
import BlogContentStep from '../blog-content-step';
import BlogMediaStep from '../blog-media-step';
import ModularBlogEditorContainer from '../moduleEditor/ModularBlogEditorContainer';

// Preview Panel - 미리보기 패널
// import PreviewPanel from './previewPanel/PreviewPanelContainer';
import PreviewPanel from '../preview-panel';

// Layout Components - 레이아웃 컴포넌트들
import FormHeaderContainer from './layout/shared/FormHeaderContainer';
import DesktopPreviewLayout from './layout/desktop/DesktopPreviewLayout';

// Navigation Components - 네비게이션 컴포넌트들
import StepNavigationWrapper from './layout/shared/StepNavigationWrapper';
import NavigationButtons from './layout/shared/NavigationButtons';

// Content Components - 컨텐츠 컴포넌트들
import StepContentContainer from './animation/StepContentContainer';

// Toast Management - 토스트 관리
import ToastManager from './steps/toast/parts/ToastManager';

// Types - 타입 정의
import { StepNumber } from './types/stepTypes';

function MultiStepFormContainer(): React.ReactNode {
  console.log('🏗️ MultiStepFormContainer: 메인 컨테이너 렌더링 시작');

  // 메인 상태 관리 훅
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

  // 스텝 변경 핸들러
  const handleStepChange = React.useCallback(
    (step: StepNumber) => {
      console.log('🎯 MultiStepFormContainer: 스텝 변경 요청', step);
      goToStep(step);
    },
    [goToStep]
  );

  // 프리뷰 토글 핸들러
  const handlePreviewToggle = React.useCallback(() => {
    console.log('👁️ MultiStepFormContainer: 프리뷰 토글');
    togglePreview();
  }, [togglePreview]);

  // 다음 스텝 이동 핸들러
  const handleNextStep = React.useCallback(() => {
    console.log('➡️ MultiStepFormContainer: 다음 스텝 이동');
    goToNextStep();
  }, [goToNextStep]);

  // 이전 스텝 이동 핸들러
  const handlePrevStep = React.useCallback(() => {
    console.log('⬅️ MultiStepFormContainer: 이전 스텝 이동');
    goToPrevStep();
  }, [goToPrevStep]);

  // 현재 스텝에 맞는 컴포넌트 렌더링
  const renderCurrentStep = React.useCallback(() => {
    console.log(
      '🔄 MultiStepFormContainer: 현재 스텝 컴포넌트 렌더링',
      currentStep
    );

    switch (currentStep) {
      case 1:
        console.log('📋 MultiStepFormContainer: UserInfoStep 렌더링');
        return <UserInfoStep />;
      case 2:
        console.log('📝 MultiStepFormContainer: BlogBasicStep 렌더링');
        return <BlogBasicStep />;
      case 3:
        console.log('📄 MultiStepFormContainer: BlogContentStep 렌더링');
        return <BlogContentStep />;
      case 4:
        console.log(
          '✏️ MultiStepFormContainer: ModularBlogEditorContainer 렌더링'
        );
        return <ModularBlogEditorContainer />;
      case 5:
        console.log('🖼️ MultiStepFormContainer: BlogMediaStep 렌더링');
        return <BlogMediaStep />;
      default:
        console.warn('⚠️ MultiStepFormContainer: 알 수 없는 스텝', currentStep);
        return null;
    }
  }, [currentStep]);

  console.log('🏗️ MultiStepFormContainer: JSX 렌더링 시작');

  return (
    <div className="p-2 mx-auto max-w-[1200px] sm:p-4 md:p-8">
      {/* 헤더 섹션 */}
      <FormHeaderContainer
        showPreview={showPreview}
        onTogglePreview={handlePreviewToggle}
      />

      {/* 메인 컨텐츠 레이아웃 */}
      <DesktopPreviewLayout>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 스텝 네비게이션 */}
            <StepNavigationWrapper
              currentStep={currentStep}
              progressWidth={progressWidth}
              onStepChange={handleStepChange}
            />

            {/* 스텝 컨텐츠 */}
            <StepContentContainer currentStep={currentStep}>
              {renderCurrentStep()}
            </StepContentContainer>

            {/* 네비게이션 버튼들 */}
            <NavigationButtons
              currentStep={currentStep}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          </form>
        </FormProvider>
      </DesktopPreviewLayout>

      {/* 데스크탑 프리뷰 패널 (조건부 렌더링) */}
      {showPreview && (
        <div className="hidden md:block w-full lg:w-1/2 h-[500px] lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
          <Card className="h-full shadow-sm">
            <CardBody className="p-3 sm:p-6">
              <PreviewPanel />
            </CardBody>
          </Card>
        </div>
      )}

      {/* 모바일 프리뷰 패널 (항상 렌더링) */}
      <div className="md:hidden">
        <PreviewPanel />
      </div>

      {/* 토스트 알림 */}
      <ToastManager maxToasts={5} position="top-right" />
    </div>
  );
}

export default MultiStepFormContainer;
