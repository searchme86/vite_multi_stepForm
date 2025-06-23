// components/moduleEditor/parts/WritingStep/controls/StepControls.tsx

import React from 'react';
import { Button, Badge } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useBridgeUIComponents } from '../../../../../bridges/hooks/useBridgeUIComponents';
import { BridgeSystemConfiguration } from '../../../../../bridges/editorMultiStepBridge/bridgeDataTypes';

interface Container {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

interface StepControlsProps {
  readonly sortedContainers: Container[];
  readonly goToStructureStep: () => void;
  readonly saveAllToContext: () => void;
  readonly completeEditor: () => void;
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;
}

function StepControls({
  sortedContainers,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
  bridgeConfig,
}: StepControlsProps): React.ReactElement {
  console.log('🎛️ [STEP_CONTROLS] 렌더링 (브리지 통합 버전):', {
    containersCount: sortedContainers.length,
    hasBridgeConfig: !!bridgeConfig,
    timestamp: new Date().toISOString(),
  });

  const {
    canTransfer: isBridgeReady,
    isTransferring: isBridgeTransferring,
    validationStatus: bridgeValidationStatus,
    transferErrors: bridgeTransferErrors,
    transferWarnings: bridgeTransferWarnings,
    refreshValidationStatus: refreshBridgeStatus,
  } = useBridgeUIComponents(bridgeConfig);

  const {
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
  } = bridgeValidationStatus || {};

  const totalErrorCount = validationErrors.length + bridgeTransferErrors.length;
  const totalWarningCount =
    validationWarnings.length + bridgeTransferWarnings.length;
  const hasAnyErrors = totalErrorCount > 0;
  const hasAnyWarnings = totalWarningCount > 0;
  const hasAnyIssues = hasAnyErrors || hasAnyWarnings;

  console.log('📊 [STEP_CONTROLS] 브리지 상태 분석:', {
    isBridgeReady,
    isReadyForTransfer,
    totalErrorCount,
    totalWarningCount,
    hasAnyErrors,
    hasAnyIssues,
    containerCount,
    paragraphCount,
    assignedParagraphCount,
    unassignedParagraphCount,
  });

  const handleGoToStructure = (): void => {
    console.log('🔙 [STEP_CONTROLS] 구조 수정 버튼 클릭');
    try {
      refreshBridgeStatus();
      goToStructureStep();
      console.log('✅ [STEP_CONTROLS] 구조 수정 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 구조 수정 실패:', error);
    }
  };

  const handleRefreshStatus = (): void => {
    console.log('🔄 [STEP_CONTROLS] 브리지 상태 새로고침 요청');
    try {
      refreshBridgeStatus();
      console.log('✅ [STEP_CONTROLS] 브리지 상태 새로고침 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 브리지 상태 새로고침 실패:', error);
    }
  };

  const handleSave = (): void => {
    console.log('💾 [STEP_CONTROLS] 저장 버튼 클릭');
    try {
      saveAllToContext();
      refreshBridgeStatus();
      console.log('✅ [STEP_CONTROLS] 저장 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 저장 실패:', error);
    }
  };

  const handleComplete = (): void => {
    console.log('✅ [STEP_CONTROLS] 완성 버튼 클릭 시도:', {
      hasAnyErrors,
      isBridgeReady,
      isReadyForTransfer,
      canComplete: !hasAnyErrors && isBridgeReady && isReadyForTransfer,
    });

    if (hasAnyErrors || !isBridgeReady || !isReadyForTransfer) {
      console.warn('⚠️ [STEP_CONTROLS] 브리지 상태로 인해 완성 불가:', {
        hasAnyErrors,
        isBridgeReady,
        isReadyForTransfer,
        totalErrorCount,
        totalWarningCount,
      });

      refreshBridgeStatus();
      return;
    }

    try {
      completeEditor();
      console.log('✅ [STEP_CONTROLS] 완성 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 완성 실패:', error);
    }
  };

  const getStatusText = (): string => {
    if (isBridgeTransferring) {
      return '전송 중...';
    }

    if (totalErrorCount > 0 && totalWarningCount > 0) {
      return `오류 ${totalErrorCount}개, 경고 ${totalWarningCount}개`;
    }

    if (totalErrorCount > 0) {
      return `오류 ${totalErrorCount}개`;
    }

    if (totalWarningCount > 0) {
      return `경고 ${totalWarningCount}개`;
    }

    if (isReadyForTransfer && isBridgeReady) {
      return '완성 준비됨';
    }

    return '상태 확인 중...';
  };

  const getStatusColor = (): 'danger' | 'warning' | 'success' | 'default' => {
    if (isBridgeTransferring) return 'default';
    if (totalErrorCount > 0) return 'danger';
    if (totalWarningCount > 0) return 'warning';
    if (isReadyForTransfer && isBridgeReady) return 'success';
    return 'default';
  };

  const isCompleteDisabled =
    hasAnyErrors ||
    !isBridgeReady ||
    !isReadyForTransfer ||
    isBridgeTransferring;

  const getCompleteButtonText = (): string => {
    if (isBridgeTransferring) {
      return '전송 중...';
    }
    if (hasAnyErrors) {
      return '완성 (오류 해결 필요)';
    }
    if (!isReadyForTransfer) {
      return '완성 (준비 중...)';
    }
    return '완성';
  };

  console.log('🎛️ [STEP_CONTROLS] 렌더링 완료 (브리지 통합):', {
    hasAnyIssues,
    isCompleteDisabled,
    statusText: getStatusText(),
    completeButtonText: getCompleteButtonText(),
    bridgeStatusSummary: {
      isBridgeReady,
      isReadyForTransfer,
      totalErrorCount,
      totalWarningCount,
    },
  });

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <Button
            type="button"
            color="default"
            variant="flat"
            size="md"
            onPress={handleGoToStructure}
            startContent={<Icon icon="lucide:arrow-left" />}
            aria-label="구조 설계 단계로 돌아가기"
            className="transition-all duration-200"
          >
            구조 수정
          </Button>
        </div>

        <div className="flex items-center justify-center flex-1 min-w-0 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="flex-shrink-0">구조:</span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {sortedContainers.map((container, index) => (
                <div
                  key={container.id}
                  className="flex items-center flex-shrink-0 gap-2"
                >
                  {index > 0 && (
                    <Icon
                      icon="lucide:arrow-right"
                      className="w-4 h-4 text-gray-400"
                      aria-hidden="true"
                    />
                  )}
                  <Badge
                    color="primary"
                    variant="flat"
                    className="whitespace-nowrap"
                  >
                    {container.name}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="flex-shrink-0 text-gray-500">상태:</span>
            <Badge
              color={getStatusColor()}
              variant="flat"
              className="whitespace-nowrap"
            >
              {getStatusText()}
            </Badge>
            <Button
              type="button"
              color="default"
              variant="light"
              size="sm"
              isIconOnly
              onPress={handleRefreshStatus}
              aria-label="브리지 상태 새로고침"
              className="w-8 h-8 min-w-8"
            >
              <Icon icon="lucide:refresh-cw" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center flex-shrink-0 gap-2">
          <Button
            type="button"
            color="secondary"
            variant="flat"
            size="md"
            onPress={handleSave}
            startContent={<Icon icon="lucide:save" />}
            aria-label="현재 작성 내용 저장"
            className="transition-all duration-200"
          >
            저장
          </Button>

          <Button
            type="button"
            color="success"
            variant={isCompleteDisabled ? 'flat' : 'solid'}
            size="md"
            onPress={handleComplete}
            isDisabled={isCompleteDisabled}
            isLoading={isBridgeTransferring}
            endContent={!isBridgeTransferring && <Icon icon="lucide:check" />}
            aria-label={`글 작성 완료${
              hasAnyErrors ? ' - 오류 해결 후 다시 시도하세요' : ''
            }`}
            className={`transition-all duration-200 ${
              isCompleteDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'opacity-100 cursor-pointer'
            }`}
          >
            {getCompleteButtonText()}
          </Button>
        </div>
      </div>

      {hasAnyIssues && (
        <div
          className={`p-3 mt-3 border rounded-lg ${
            hasAnyErrors
              ? 'border-red-200 bg-red-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}
        >
          <div className="flex items-start gap-2">
            <Icon
              icon={
                hasAnyErrors ? 'lucide:alert-circle' : 'lucide:alert-triangle'
              }
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                hasAnyErrors ? 'text-red-600' : 'text-yellow-600'
              }`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  hasAnyErrors ? 'text-red-800' : 'text-yellow-800'
                }`}
              >
                {hasAnyErrors
                  ? '완성하려면 다음 문제들을 해결해주세요:'
                  : '다음 경고사항을 확인해주세요:'}
              </p>
              <div
                className={`flex items-center gap-4 mt-1 text-xs ${
                  hasAnyErrors ? 'text-red-600' : 'text-yellow-600'
                }`}
              >
                <span>컨테이너 {containerCount}개</span>
                <span>문단 {paragraphCount}개</span>
                <span>할당됨 {assignedParagraphCount}개</span>
                {unassignedParagraphCount > 0 && (
                  <span>미할당 {unassignedParagraphCount}개</span>
                )}
                {totalErrorCount > 0 && <span>오류 {totalErrorCount}개</span>}
                {totalWarningCount > 0 && (
                  <span>경고 {totalWarningCount}개</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StepControls;
