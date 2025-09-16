// 📁 components/moduleEditor/parts/StructureInput/controls/NextStepButton.tsx

import React from 'react';
import { Button } from '@heroui/react';

interface NextStepButtonProps {
  onComplete: () => void;
  isValid: boolean;
  isLoading?: boolean; // 🆕 로딩 상태 추가
}

function NextStepButton({
  onComplete,
  isValid,
  isLoading = false,
}: NextStepButtonProps): React.ReactNode {
  const handleButtonClick = () => {
    console.log('🎯 [NEXT_STEP_BUTTON] 버튼 클릭:', {
      isValid,
      isLoading,
      canProceed: isValid && !isLoading,
      timestamp: new Date().toISOString(),
    });

    // Early return: 유효하지 않거나 로딩 중일 때
    if (!isValid) {
      console.warn('⚠️ [NEXT_STEP_BUTTON] 폼 유효성 검사 실패 - 클릭 무시');
      return;
    }

    if (isLoading) {
      console.warn('⚠️ [NEXT_STEP_BUTTON] 처리 중 - 중복 클릭 무시');
      return;
    }

    // Early return: 콜백 함수 확인
    if (typeof onComplete !== 'function') {
      console.error(
        '❌ [NEXT_STEP_BUTTON] onComplete가 함수가 아님:',
        typeof onComplete
      );
      return;
    }

    try {
      console.log('📞 [NEXT_STEP_BUTTON] onComplete 콜백 실행');
      onComplete();
      console.log('✅ [NEXT_STEP_BUTTON] onComplete 콜백 완료');
    } catch (error) {
      console.error('❌ [NEXT_STEP_BUTTON] onComplete 실행 중 오류:', error);
    }
  };

  // 버튼 상태 계산
  const isButtonDisabled = !isValid || isLoading;
  const buttonText = isLoading ? '구조 생성 중...' : '다음: 글 작성하기';
  const buttonColor = isLoading ? 'default' : isValid ? 'primary' : 'default';

  console.log('🎨 [NEXT_STEP_BUTTON] 렌더링 상태:', {
    isValid,
    isLoading,
    isButtonDisabled,
    buttonText,
    buttonColor,
  });

  return (
    <Button
      type="button" // 🔧 항상 button 타입 명시
      color={buttonColor}
      size="lg"
      disabled={isButtonDisabled}
      onClick={handleButtonClick}
      className={`min-w-48 font-semibold transition-all duration-200 ${
        isLoading
          ? 'cursor-not-allowed opacity-70'
          : isValid
          ? 'cursor-pointer hover:scale-105'
          : 'cursor-not-allowed'
      }`}
      startContent={
        isLoading ? (
          <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
        ) : isValid ? (
          <span>🚀</span>
        ) : (
          <span>⏸️</span>
        )
      }
    >
      {buttonText}
    </Button>
  );
}

export default React.memo(NextStepButton);
