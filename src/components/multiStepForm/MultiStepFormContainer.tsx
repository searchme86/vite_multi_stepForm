import React, { useEffect, useCallback } from 'react';
import { FormProvider } from 'react-hook-form';
import { Card, CardBody } from '@heroui/react';

import { useMultiStepFormState } from './reactHookForm/useMultiStepFormState';

// 브릿지 패턴 구현: 에디터에서 전송된 데이터를 멀티스텝 폼에서 수신하기 위한 훅
import { useEditorMultiStepBridge } from '../../bridges/editorMultiStepBridge/useEditorMultiStepBridge';

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
    updateFormValue, // 브릿지에서 받은 데이터로 폼 값을 업데이트하는 함수
    // setEditorCompleted,       // 에디터 완료 상태를 설정하는 함수 - 타입 에러로 인해 주석 처리
    // editorCompletedContent,   // 에디터에서 완성된 콘텐츠 - 타입 에러로 인해 주석 처리
    // isEditorCompleted,        // 에디터 작업 완료 여부 - 타입 에러로 인해 주석 처리
  } = useMultiStepFormState();

  // 🔍 [DEBUG] 에디터 데이터를 폼에서 직접 조회하는 방식으로 변경
  const currentFormValues = methods.getValues();
  const editorCompletedContent = currentFormValues.editorCompletedContent || '';
  const isEditorCompleted = currentFormValues.isEditorCompleted || false;

  // 에디터 완료 상태를 설정하는 헬퍼 함수
  const setEditorCompleted = useCallback(
    (completed: boolean) => {
      updateFormValue('isEditorCompleted', completed);
    },
    [updateFormValue]
  );

  // 브릿지 설정: 멀티스텝 폼에서의 데이터 수신을 위한 구성
  // enableAutoTransfer: false로 설정하여 멀티스텝에서는 수신만 담당
  // enableValidation: 수신된 데이터의 유효성 검증
  // enableErrorRecovery: 수신 오류 시 복구 시도
  // validationMode: lenient로 설정하여 관대한 검증 모드 사용
  // debugMode: 디버그 모드 활성화
  const bridgeConfig = {
    enableAutoTransfer: false,
    enableValidation: true,
    enableErrorRecovery: true,
    validationMode: 'lenient' as const,
    debugMode: true,
  };

  // 브릿지 훅: 에디터에서 전송된 데이터를 수신하고 처리
  // 멀티스텝 폼은 주로 데이터를 받는 역할을 수행
  const {
    isTransferInProgress, // 현재 데이터 수신 진행 중인지 여부
    lastTransferResult, // 마지막 수신된 전송 결과
    transferErrorDetails, // 수신 중 발생한 오류 상세 정보
    transferWarningMessages, // 수신 중 발생한 경고 메시지
    isAutoTransferActive, // 자동 수신 활성화 여부 (멀티스텝에서는 주로 수신 대기)
    transferCount, // 총 데이터 수신 횟수
    executeManualTransfer, // 수동 수신 시도 함수 (필요시 사용)
    checkCanTransfer, // 수신 가능 상태 확인 함수
    resetBridgeState, // 브릿지 상태 초기화 함수
    toggleAutoTransfer, // 자동 수신 토글 함수
    bridgeConfiguration, // 현재 브릿지 설정
  } = useEditorMultiStepBridge(bridgeConfig);

  // 🔍 [DEBUG] 멀티스텝 브릿지 초기화 및 설정 확인
  console.group('🌉 [BRIDGE_DEBUG] 멀티스텝 브릿지 초기화 상태');
  console.log('📋 [BRIDGE_DEBUG] 멀티스텝 브릿지 설정:', bridgeConfiguration);
  console.log('🔧 [BRIDGE_DEBUG] 멀티스텝 커스텀 설정:', bridgeConfig);
  console.log('⚡ [BRIDGE_DEBUG] 멀티스텝 브릿지 훅 연결 상태:', {
    hookConnected: true, // 브릿지 훅이 정상적으로 연결됨
    receiverMode: !bridgeConfig.enableAutoTransfer, // 멀티스텝은 주로 수신 모드
    functionsAvailable: {
      executeManualTransfer: typeof executeManualTransfer,
      checkCanTransfer: typeof checkCanTransfer,
      resetBridgeState: typeof resetBridgeState,
      toggleAutoTransfer: typeof toggleAutoTransfer,
    },
  });
  console.groupEnd();

  // 🔍 [DEBUG] 멀티스텝 브릿지 실시간 상태 모니터링
  console.group('📊 [BRIDGE_DEBUG] 멀티스텝 브릿지 실시간 상태');
  console.log('🚦 [BRIDGE_DEBUG] 수신 상태:', {
    isTransferInProgress,
    isAutoTransferActive,
    transferCount,
    canReceive: checkCanTransfer(),
    receiverReady: !isTransferInProgress,
  });
  console.log('📥 [BRIDGE_DEBUG] 수신 결과 상태:', {
    hasLastResult: !!lastTransferResult,
    lastResultSuccess: lastTransferResult?.operationSuccess || false,
    errorCount: transferErrorDetails.length,
    warningCount: transferWarningMessages.length,
    hasReceivedData: !!lastTransferResult?.transferredData,
  });
  console.log('🔍 [BRIDGE_DEBUG] 수신 상세 오류 정보:', transferErrorDetails);
  console.log(
    '⚠️ [BRIDGE_DEBUG] 수신 상세 경고 정보:',
    transferWarningMessages
  );
  console.groupEnd();

  console.log('🏗️ MultiStepFormContainer: 상태 관리 훅 초기화 완료', {
    currentStep,
    showPreview,
    analytics: getFormAnalytics(),
    bridgeStatus: {
      isTransferInProgress,
      transferCount,
      hasErrors: transferErrorDetails.length > 0,
      hasWarnings: transferWarningMessages.length > 0,
    },
  });

  // 🔍 [DEBUG] 멀티스텝 폼 상태와 브릿지 연동 상태 확인
  console.group('📊 [BRIDGE_DEBUG] 멀티스텝 폼-브릿지 연동 상태');
  console.log('📋 [BRIDGE_DEBUG] 현재 폼 상태:', {
    currentStep,
    progressWidth,
    showPreview,
    formMethods: !!methods,
    hasFormData: Object.keys(methods.getValues()).length > 0,
  });
  console.log('📥 [BRIDGE_DEBUG] 에디터 데이터 수신 상태:', {
    editorContentLength: editorCompletedContent?.length || 0,
    isEditorCompleted,
    hasEditorContent: !!(
      editorCompletedContent && editorCompletedContent.length > 0
    ),
  });
  console.log('🌉 [BRIDGE_DEBUG] 브릿지 수신 준비 상태:', {
    canReceiveData: checkCanTransfer(),
    isReceiving: isTransferInProgress,
    autoReceiveEnabled: isAutoTransferActive,
    totalReceiveCount: transferCount,
  });
  console.groupEnd();

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

  // 브릿지 데이터 수신 처리: 에디터에서 전송된 데이터를 폼에 적용
  // transformedContent: 에디터에서 변환된 완성된 콘텐츠
  // transformedIsCompleted: 에디터 작업 완료 여부
  const handleBridgeDataReceived = useCallback(
    (transferredData: any) => {
      console.log(
        '📥 MultiStepFormContainer: 브릿지 데이터 수신',
        transferredData
      );

      // 🔍 [DEBUG] 수신된 데이터 상세 분석
      console.group('📋 [BRIDGE_DEBUG] 브릿지 데이터 수신 상세 분석');
      console.log('📊 [BRIDGE_DEBUG] 수신 데이터 기본 정보:', {
        hasData: !!transferredData,
        dataType: typeof transferredData,
        dataKeys: transferredData ? Object.keys(transferredData) : [],
        timestamp: new Date().toISOString(),
      });

      if (transferredData) {
        console.log('📈 [BRIDGE_DEBUG] 변환된 콘텐츠 정보:', {
          hasTransformedContent: !!transferredData.transformedContent,
          contentLength: transferredData.transformedContent?.length || 0,
          isCompleted: transferredData.transformedIsCompleted || false,
          transformationSuccess: transferredData.transformationSuccess || false,
        });

        console.log('🔍 [BRIDGE_DEBUG] 메타데이터 정보:', {
          hasMetadata: !!transferredData.transformedMetadata,
          metadata: transferredData.transformedMetadata || {},
        });
      }

      // 전송된 데이터에 변환된 콘텐츠가 있는 경우 폼에 적용
      if (transferredData?.transformedContent) {
        console.log('🔄 [BRIDGE_DEBUG] 폼 데이터 업데이트 시작');

        // 에디터에서 완성된 콘텐츠를 폼의 해당 필드에 업데이트
        console.log('📝 [BRIDGE_DEBUG] 에디터 콘텐츠 폼 필드 업데이트:', {
          fieldName: 'editorCompletedContent',
          contentLength: transferredData.transformedContent.length,
          previewContent:
            transferredData.transformedContent.substring(0, 100) + '...',
        });
        updateFormValue(
          'editorCompletedContent',
          transferredData.transformedContent
        );

        // 에디터 완료 상태를 폼에 반영
        const completionStatus =
          transferredData.transformedIsCompleted || false;
        console.log('✅ [BRIDGE_DEBUG] 에디터 완료 상태 업데이트:', {
          completionStatus,
          previousStatus: isEditorCompleted,
        });
        setEditorCompleted(completionStatus);

        // 에디터 작업이 완료된 경우 자동으로 다음 스텝으로 진행
        if (transferredData.transformedIsCompleted) {
          console.log(
            '✅ MultiStepFormContainer: 에디터 완료 데이터 자동 진행'
          );
          console.log('🚀 [BRIDGE_DEBUG] 자동 스텝 진행 시작:', {
            currentStep,
            nextStep: currentStep + 1,
            reason: '에디터 작업 완료',
          });
          goToNextStep();
          console.log('🎯 [BRIDGE_DEBUG] 자동 스텝 진행 완료');
        } else {
          console.log('⏸️ [BRIDGE_DEBUG] 에디터 미완료로 자동 진행 안함:', {
            isCompleted: transferredData.transformedIsCompleted,
            currentStep,
          });
        }
      } else {
        console.warn('⚠️ [BRIDGE_DEBUG] 수신된 데이터에 변환된 콘텐츠 없음:', {
          hasData: !!transferredData,
          hasContent: !!transferredData?.transformedContent,
          contentValue: transferredData?.transformedContent,
        });
      }
      console.groupEnd();
    },
    [updateFormValue, setEditorCompleted, goToNextStep, currentStep]
  );

  // 브릿지 상태 초기화: 오류 발생 시 브릿지를 초기 상태로 복원
  // 현재는 UI에서 사용되지 않지만 디버깅 목적으로 유지
  // const handleBridgeReset = useCallback(() => {
  //   console.log('🔄 MultiStepFormContainer: 브릿지 상태 초기화');
  //
  //   // 🔍 [DEBUG] 브릿지 초기화 전 상태 기록
  //   console.group('🔄 [BRIDGE_DEBUG] 멀티스텝 브릿지 상태 초기화');
  //   console.log('📊 [BRIDGE_DEBUG] 초기화 전 브릿지 상태:', {
  //     isTransferInProgress,
  //     transferCount,
  //     errorCount: transferErrorDetails.length,
  //     warningCount: transferWarningMessages.length,
  //     hasLastResult: !!lastTransferResult,
  //     timestamp: new Date().toISOString(),
  //   });
  //
  //   resetBridgeState();
  //
  //   console.log('✅ [BRIDGE_DEBUG] 브릿지 상태 초기화 완료');
  //   console.groupEnd();
  // }, [resetBridgeState, isTransferInProgress, transferCount, transferErrorDetails.length, transferWarningMessages.length, lastTransferResult]);

  // 자동 수신 토글: 자동으로 에디터 데이터를 수신할지 여부 제어
  // 현재는 UI에서 사용되지 않지만 디버깅 목적으로 유지
  // const handleAutoTransferToggle = useCallback(() => {
  //   console.log('🎚️ MultiStepFormContainer: 자동 전송 토글');
  //
  //   // 🔍 [DEBUG] 자동 수신 토글 상세 로깅
  //   console.group('🎚️ [BRIDGE_DEBUG] 멀티스텝 자동 수신 토글');
  //   console.log('📊 [BRIDGE_DEBUG] 토글 전 상태:', {
  //     currentAutoTransferStatus: isAutoTransferActive,
  //     newStatus: !isAutoTransferActive,
  //     canReceive: checkCanTransfer(),
  //     timestamp: new Date().toISOString(),
  //   });
  //
  //   toggleAutoTransfer();
  //
  //   console.log('✅ [BRIDGE_DEBUG] 자동 수신 토글 완료');
  //   console.groupEnd();
  // }, [toggleAutoTransfer, isAutoTransferActive, checkCanTransfer]);

  const renderCurrentStep = React.useCallback(() => {
    console.log(
      '🔄 MultiStepFormContainer: 현재 스텝 컴포넌트 렌더링',
      currentStep
    );
    return renderStepComponent(currentStep);
  }, [currentStep]);

  // 브릿지 전송 결과 처리: 에디터에서 데이터가 성공적으로 전송되었을 때 처리
  useEffect(() => {
    console.log('🌉 MultiStepFormContainer: 브릿지 결과 변화 감지');

    // 🔍 [DEBUG] 브릿지 수신 결과 상세 분석
    console.group('📋 [BRIDGE_DEBUG] 멀티스텝 브릿지 수신 결과 상세 분석');

    if (lastTransferResult) {
      console.log('📊 [BRIDGE_DEBUG] 수신 결과 기본 정보:', {
        operationSuccess: lastTransferResult.operationSuccess,
        operationDuration: lastTransferResult.operationDuration,
        timestamp: new Date().toISOString(),
        transferCount,
      });

      console.log('📥 [BRIDGE_DEBUG] 수신 데이터 상세:', {
        hasTransferredData: !!lastTransferResult.transferredData,
        transferredContentLength:
          lastTransferResult.transferredData?.transformedContent?.length || 0,
        isCompleted:
          lastTransferResult.transferredData?.transformedIsCompleted || false,
        transformationSuccess:
          lastTransferResult.transferredData?.transformationSuccess || false,
        transformationErrors:
          lastTransferResult.transferredData?.transformationErrors || [],
      });

      console.log('📋 [BRIDGE_DEBUG] 수신 오류 및 경고 분석:', {
        errorCount: lastTransferResult.operationErrors.length,
        warningCount: lastTransferResult.operationWarnings.length,
        errors: lastTransferResult.operationErrors.map((err) => ({
          code: err.errorCode,
          message: err.errorMessage,
          isRecoverable: err.isRecoverable,
        })),
        warnings: lastTransferResult.operationWarnings,
      });
    }

    // 전송이 성공하고 실제 데이터가 있는 경우에만 처리
    if (
      lastTransferResult?.operationSuccess &&
      lastTransferResult.transferredData
    ) {
      console.log('✅ MultiStepFormContainer: 성공적인 브릿지 전송 처리');
      console.log(
        '🎉 [BRIDGE_DEBUG] 브릿지 데이터 수신 성공 - 폼 업데이트 시작'
      );

      // 🔍 [DEBUG] 데이터 수신 전 폼 상태 확인
      console.log('📊 [BRIDGE_DEBUG] 데이터 수신 전 폼 상태:', {
        currentFormValues: currentFormValues,
        currentEditorContent: editorCompletedContent?.length || 0,
        currentEditorStatus: isEditorCompleted,
        currentStep,
      });

      handleBridgeDataReceived(lastTransferResult.transferredData);

      console.log('✅ [BRIDGE_DEBUG] 브릿지 데이터 수신 처리 완료');
    } else if (lastTransferResult && !lastTransferResult.operationSuccess) {
      console.error('❌ [BRIDGE_DEBUG] 브릿지 데이터 수신 실패:', {
        operationSuccess: lastTransferResult.operationSuccess,
        errorCount: lastTransferResult.operationErrors.length,
        errors: lastTransferResult.operationErrors,
      });
    } else {
      console.log(
        '🔍 [BRIDGE_DEBUG] 아직 브릿지 수신 결과 없음 또는 데이터 없음'
      );
    }
    console.groupEnd();
  }, [
    lastTransferResult,
    handleBridgeDataReceived,
    editorCompletedContent,
    isEditorCompleted,
    currentStep,
    transferCount,
  ]);

  // 에디터 상태 변화 감지: 에디터에서 전송된 데이터의 변화를 추적
  useEffect(() => {
    console.log('📊 MultiStepFormContainer: 에디터 상태 변화 감지', {
      editorCompletedContent: editorCompletedContent?.length || 0,
      isEditorCompleted,
    });

    // 🔍 [DEBUG] 에디터 상태 변화 상세 분석
    console.group('📈 [BRIDGE_DEBUG] 멀티스텝의 에디터 상태 변화 분석');
    console.log('📝 [BRIDGE_DEBUG] 에디터 콘텐츠 상태:', {
      hasContent: !!(
        editorCompletedContent && editorCompletedContent.length > 0
      ),
      contentLength: editorCompletedContent?.length || 0,
      contentPreview: editorCompletedContent
        ? editorCompletedContent.substring(0, 50) + '...'
        : '',
      isCompleted: isEditorCompleted,
    });

    console.log('🔍 [BRIDGE_DEBUG] 폼 연동 상태:', {
      currentStep,
      shouldShowEditorContent: isEditorCompleted && editorCompletedContent,
      canProceedToNextStep: isEditorCompleted,
      formHasEditorData: !!currentFormValues.editorCompletedContent,
    });

    if (isEditorCompleted && editorCompletedContent) {
      console.log(
        '🎉 [BRIDGE_DEBUG] 에디터 데이터 완전 수신 완료 - 멀티스텝 폼 준비됨'
      );
    }
    console.groupEnd();
  }, [editorCompletedContent, isEditorCompleted, currentStep]);

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
