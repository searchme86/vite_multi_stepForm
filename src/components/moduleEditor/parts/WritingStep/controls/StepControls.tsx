// components/moduleEditor/parts/WritingStep/controls/StepControls.tsx

import React from 'react';
import { Button, Badge } from '@heroui/react';
import { Icon } from '@iconify/react';
// 🔧 핵심 수정: 브리지 상태 훅 import 추가
import { useBridgeUI } from '../../../../../bridges/hooks/useBridgeUI';
import { BridgeSystemConfiguration } from '../../../../../bridges/editorMultiStepBridge/bridgeTypes';

// 컨테이너 타입 정의
interface Container {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// StepControls 컴포넌트 props 인터페이스 - 🔧 브리지 관련 props 제거
interface StepControlsProps {
  // 기존 핵심 props 유지
  readonly sortedContainers: Container[];
  readonly goToStructureStep: () => void;
  readonly saveAllToContext: () => void;
  readonly completeEditor: () => void;

  // 🔧 브리지 설정 추가 (선택적)
  readonly bridgeConfig?: Partial<BridgeSystemConfiguration>;

  // 🔧 오류 상태 관련 props 제거 - 브리지에서 자동으로 가져옴
  // readonly hasErrors?: boolean; // 제거
  // readonly errorCount?: number; // 제거
  // readonly warningCount?: number; // 제거
  // readonly onShowErrorDetails?: () => void; // 제거
}

/**
 * 단계 제어 및 상태 표시 컴포넌트 (브리지 통합 버전)
 * 구조 수정, 저장, 완성 기능과 함께 실시간 브리지 상태 반영
 *
 * 🔧 주요 변경사항:
 * 1. 외부 props 대신 useBridgeUI 훅으로 실시간 상태 구독
 * 2. MarkdownCompleteButton과 동일한 데이터 소스 사용
 * 3. 상태 동기화 문제 해결
 * 4. 자동 새로고침 메커니즘 내장
 *
 * @param props - 컴포넌트 설정 옵션들
 * @returns JSX 엘리먼트
 */
function StepControls({
  sortedContainers,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
  bridgeConfig, // 🔧 새로 추가된 브리지 설정
}: StepControlsProps): React.ReactElement {
  console.log('🎛️ [STEP_CONTROLS] 렌더링 (브리지 통합 버전):', {
    containersCount: sortedContainers.length,
    hasBridgeConfig: !!bridgeConfig,
    timestamp: new Date().toISOString(),
  });

  // 🔧 핵심 수정: 브리지 상태를 실시간으로 구독
  const {
    canTransfer: isBridgeReady,
    isTransferring: isBridgeTransferring,
    validationStatus: bridgeValidationStatus,
    transferErrors: bridgeTransferErrors,
    transferWarnings: bridgeTransferWarnings,
    refreshValidationStatus: refreshBridgeStatus,
  } = useBridgeUI(bridgeConfig);

  // 🔧 브리지 상태에서 오류 정보 추출 (안전한 구조분해할당)
  const {
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
    containerCount = 0,
    paragraphCount = 0,
    assignedParagraphCount = 0,
    unassignedParagraphCount = 0,
  } = bridgeValidationStatus || {};

  // 🔧 전송 오류도 포함하여 전체 오류 계산
  const totalErrorCount = validationErrors.length + bridgeTransferErrors.length;
  const totalWarningCount =
    validationWarnings.length + bridgeTransferWarnings.length;
  const hasAnyErrors = totalErrorCount > 0;
  const hasAnyWarnings = totalWarningCount > 0;
  const hasAnyIssues = hasAnyErrors || hasAnyWarnings;

  // 🔧 디버깅용 로그
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

  // 구조 수정 버튼 핸들러
  const handleGoToStructure = (): void => {
    console.log('🔙 [STEP_CONTROLS] 구조 수정 버튼 클릭');
    try {
      // 🔧 구조 수정 시 브리지 상태 새로고침
      refreshBridgeStatus();
      goToStructureStep();
      console.log('✅ [STEP_CONTROLS] 구조 수정 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 구조 수정 실패:', error);
    }
  };

  // 🔧 브리지 상태 새로고침 핸들러 (새로 추가)
  const handleRefreshStatus = (): void => {
    console.log('🔄 [STEP_CONTROLS] 브리지 상태 새로고침 요청');
    try {
      refreshBridgeStatus();
      console.log('✅ [STEP_CONTROLS] 브리지 상태 새로고침 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 브리지 상태 새로고침 실패:', error);
    }
  };

  // 저장 버튼 핸들러
  const handleSave = (): void => {
    console.log('💾 [STEP_CONTROLS] 저장 버튼 클릭');
    try {
      saveAllToContext();
      // 🔧 저장 후 브리지 상태 새로고침
      refreshBridgeStatus();
      console.log('✅ [STEP_CONTROLS] 저장 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 저장 실패:', error);
    }
  };

  // 완성 버튼 핸들러 (🔧 브리지 상태 기반으로 수정)
  const handleComplete = (): void => {
    console.log('✅ [STEP_CONTROLS] 완성 버튼 클릭 시도:', {
      hasAnyErrors,
      isBridgeReady,
      isReadyForTransfer,
      canComplete: !hasAnyErrors && isBridgeReady && isReadyForTransfer,
    });

    // 🔧 브리지 상태 기반 완성 가능 여부 확인
    if (hasAnyErrors || !isBridgeReady || !isReadyForTransfer) {
      console.warn('⚠️ [STEP_CONTROLS] 브리지 상태로 인해 완성 불가:', {
        hasAnyErrors,
        isBridgeReady,
        isReadyForTransfer,
        totalErrorCount,
        totalWarningCount,
      });

      // 상태 새로고침 후 재시도 유도
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

  // 🔧 오류/경고 상태 텍스트 계산
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

  // 🔧 상태에 따른 색상 계산
  const getStatusColor = (): 'danger' | 'warning' | 'success' | 'default' => {
    if (isBridgeTransferring) return 'default';
    if (totalErrorCount > 0) return 'danger';
    if (totalWarningCount > 0) return 'warning';
    if (isReadyForTransfer && isBridgeReady) return 'success';
    return 'default';
  };

  // 🔧 완성 버튼 상태 계산
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
        {/* 왼쪽: 구조 수정 버튼 */}
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

        {/* 중간: 현재 구조 및 상태 표시 */}
        <div className="flex items-center justify-center flex-1 min-w-0 gap-4">
          {/* 구조 표시 */}
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

          {/* 🔧 브리지 상태 표시 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-shrink-0 text-gray-500">상태:</span>
            <Badge
              color={getStatusColor()}
              variant="flat"
              className="whitespace-nowrap"
            >
              {getStatusText()}
            </Badge>
            {/* 상태 새로고침 버튼 */}
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

        {/* 오른쪽: 액션 버튼들 */}
        <div className="flex items-center flex-shrink-0 gap-2">
          {/* 저장 버튼 */}
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

          {/* 완성 버튼 (🔧 브리지 상태 기반 조건부 비활성화) */}
          <Button
            type="button"
            color="success"
            variant={isCompleteDisabled ? 'flat' : 'solid'}
            size="md"
            onPress={handleComplete}
            isDisabled={isCompleteDisabled}
            isLoading={isBridgeTransferring} // 🔧 로딩 상태 추가
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

      {/* 🔧 상세 상태 정보 (문제가 있을 때만 표시) */}
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
