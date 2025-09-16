// components/moduleEditor/parts/WritingStep/controls/StepControls.tsx

import React from 'react';
import { Button, Badge } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useBridgeUI } from '../../../../../bridges/hooks/useBridgeUI';
import type { BridgeSystemConfiguration } from '../../../../../bridges/editorMultiStepBridge/modernBridgeTypes';

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

  // 🔧 수정된 Bridge UI 훅 사용
  const bridgeUIHook = useBridgeUI(bridgeConfig);

  const {
    editorStatistics,
    validationState,
    isLoading: isBridgeTransferring,
    canExecuteAction: isBridgeReady,
    hasError: hasBridgeErrors,
    hasWarning: hasBridgeWarnings,
  } = bridgeUIHook;

  // 🔧 통계 정보 추출 (구조분해할당 사용)
  const {
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
  } = editorStatistics || {};

  // 🔧 검증 상태 정보 추출 (구조분해할당 사용)
  const { errorCount = 0, warningCount = 0 } = validationState || {};

  const totalErrorCount = errorCount;
  const totalWarningCount = warningCount;
  const hasAnyErrors = totalErrorCount > 0 || hasBridgeErrors;
  const hasAnyWarnings = totalWarningCount > 0 || hasBridgeWarnings;
  const hasAnyIssues = hasAnyErrors || hasAnyWarnings;
  const isReadyForTransfer = isBridgeReady && !hasAnyErrors;

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
      goToStructureStep();
      console.log('✅ [STEP_CONTROLS] 구조 수정 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 구조 수정 실패:', error);
    }
  };

  const handleRefreshStatus = (): void => {
    console.log('🔄 [STEP_CONTROLS] 브리지 상태 새로고침 요청');
    try {
      // Bridge UI 훅은 자동으로 상태를 관리하므로 별도 새로고침 불필요
      console.log('✅ [STEP_CONTROLS] 브리지 상태 새로고침 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 브리지 상태 새로고침 실패:', error);
    }
  };

  const handleSave = (): void => {
    console.log('💾 [STEP_CONTROLS] 저장 버튼 클릭');
    try {
      saveAllToContext();
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

    const cannotComplete =
      hasAnyErrors || !isBridgeReady || !isReadyForTransfer;
    if (cannotComplete) {
      console.warn('⚠️ [STEP_CONTROLS] 브리지 상태로 인해 완성 불가:', {
        hasAnyErrors,
        isBridgeReady,
        isReadyForTransfer,
        totalErrorCount,
        totalWarningCount,
      });

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
    const isCurrentlyTransferring = isBridgeTransferring;
    if (isCurrentlyTransferring) {
      return '전송 중...';
    }

    const hasBothErrorsAndWarnings =
      totalErrorCount > 0 && totalWarningCount > 0;
    if (hasBothErrorsAndWarnings) {
      return `오류 ${totalErrorCount}개, 경고 ${totalWarningCount}개`;
    }

    const hasOnlyErrors = totalErrorCount > 0;
    if (hasOnlyErrors) {
      return `오류 ${totalErrorCount}개`;
    }

    const hasOnlyWarnings = totalWarningCount > 0;
    if (hasOnlyWarnings) {
      return `경고 ${totalWarningCount}개`;
    }

    const isCompletelyReady = isReadyForTransfer && isBridgeReady;
    if (isCompletelyReady) {
      return '완성 준비됨';
    }

    return '상태 확인 중...';
  };

  const getStatusColor = (): 'danger' | 'warning' | 'success' | 'default' => {
    const isCurrentlyTransferring = isBridgeTransferring;
    if (isCurrentlyTransferring) return 'default';

    const hasErrors = totalErrorCount > 0;
    if (hasErrors) return 'danger';

    const hasWarnings = totalWarningCount > 0;
    if (hasWarnings) return 'warning';

    const isCompletelyReady = isReadyForTransfer && isBridgeReady;
    if (isCompletelyReady) return 'success';

    return 'default';
  };

  const isCompleteDisabled =
    hasAnyErrors ||
    !isBridgeReady ||
    !isReadyForTransfer ||
    isBridgeTransferring;

  const getCompleteButtonText = (): string => {
    const isCurrentlyTransferring = isBridgeTransferring;
    if (isCurrentlyTransferring) {
      return '전송 중...';
    }

    const hasErrors = hasAnyErrors;
    if (hasErrors) {
      return '완성 (오류 해결 필요)';
    }

    const isNotReady = !isReadyForTransfer;
    if (isNotReady) {
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
                  {index > 0 ? (
                    <Icon
                      icon="lucide:arrow-right"
                      className="w-4 h-4 text-gray-400"
                      aria-hidden="true"
                    />
                  ) : null}
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
            endContent={
              !isBridgeTransferring ? <Icon icon="lucide:check" /> : null
            }
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

      {hasAnyIssues ? (
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
                {unassignedParagraphCount > 0 ? (
                  <span>미할당 {unassignedParagraphCount}개</span>
                ) : null}
                {totalErrorCount > 0 ? (
                  <span>오류 {totalErrorCount}개</span>
                ) : null}
                {totalWarningCount > 0 ? (
                  <span>경고 {totalWarningCount}개</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default StepControls;
