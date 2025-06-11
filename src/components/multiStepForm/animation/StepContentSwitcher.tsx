import React from 'react';
import { StepNumber } from '../types/stepTypes';
import UserInfoStep from '../steps/UserInfoStep';
import BlogBasicStep from '../steps/BlogBasicStep';
import BlogContentStep from '../steps/BlogContentStep';
import ModularBlogEditorContainer from '../steps/moduleEditor/ModularBlogEditorContainer';
import BlogMediaStep from '../steps/BlogMediaStep';

interface StepContentSwitcherProps {
  currentStep: StepNumber;
}

function StepContentSwitcher({ currentStep }: StepContentSwitcherProps) {
  console.log('🔀 StepContentSwitcher: 스텝 컨텐츠 스위처 렌더링', {
    currentStep,
  });

  const renderCurrentStep = React.useCallback(() => {
    switch (currentStep) {
      case 1:
        return <UserInfoStep />;
      case 2:
        return <BlogBasicStep />;
      case 3:
        return <BlogContentStep />;
      case 4:
        return <ModularBlogEditorContainer />;
      case 5:
        return <BlogMediaStep />;
      default:
        return null;
    }
  }, [currentStep]);

  return <>{renderCurrentStep()}</>;
}

export default StepContentSwitcher;
