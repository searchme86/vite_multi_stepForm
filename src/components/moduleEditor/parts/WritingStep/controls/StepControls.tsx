// components/moduleEditor/parts/WritingStep/controls/StepControls.tsx

import React from 'react';
import { Button, Badge } from '@heroui/react';
import { Icon } from '@iconify/react';

// 컨테이너 타입 정의
interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// StepControls 컴포넌트 props 인터페이스
interface StepControlsProps {
  // 기존 props
  readonly sortedContainers: Container[];
  readonly goToStructureStep: () => void;
  readonly saveAllToContext: () => void;
  readonly completeEditor: () => void;

  // 🆕 새로 추가된 props (오류 상태 관리)
  readonly hasErrors?: boolean; // 오류 존재 여부
  readonly errorCount?: number; // 오류 개수
  readonly warningCount?: number; // 경고 개수
  readonly onShowErrorDetails?: () => void; // 오류 상세 정보 표시 핸들러
}

/**
 * 단계 제어 및 상태 표시 컴포넌트
 * 구조 수정, 저장, 완성 기능과 함께 오류 상태 표시 및 관리 기능 제공
 *
 * 주요 기능:
 * 1. 구조 설계 단계로 돌아가기
 * 2. 현재 컨테이너 구조 시각적 표시
 * 3. 오류 상태 표시 및 상세 정보 모달 트리거 🆕
 * 4. 저장 기능 (중간 저장)
 * 5. 완성 기능 (오류 시 비활성화) 🆕
 * 6. 접근성 지원 (ARIA 속성, 키보드 네비게이션)
 *
 * @param props - 컴포넌트 설정 옵션들
 * @returns JSX 엘리먼트
 */
function StepControls({
  sortedContainers,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
  hasErrors = false, // 🆕 기본값: false
  errorCount = 0, // 🆕 기본값: 0
  warningCount = 0, // 🆕 기본값: 0
  onShowErrorDetails, // 🆕 오류 상세 정보 표시 핸들러
}: StepControlsProps): React.ReactElement {
  console.log('🎛️ [STEP_CONTROLS] 렌더링 (오류 상태 추가):', {
    containersCount: sortedContainers.length,
    hasErrors, // 🆕 로깅 추가
    errorCount, // 🆕 로깅 추가
    warningCount, // 🆕 로깅 추가
    onShowErrorDetailsType: typeof onShowErrorDetails, // 🆕 로깅 추가
    timestamp: new Date().toISOString(),
  });

  // 구조 수정 버튼 핸들러
  const handleGoToStructure = (): void => {
    console.log('🔙 [STEP_CONTROLS] 구조 수정 버튼 클릭');
    try {
      goToStructureStep();
      console.log('✅ [STEP_CONTROLS] 구조 수정 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 구조 수정 실패:', error);
    }
  };

  // 🆕 오류 상세 정보 표시 핸들러
  const handleShowErrorDetails = (): void => {
    console.log('🚨 [STEP_CONTROLS] 오류 상세 정보 버튼 클릭:', {
      hasErrors,
      errorCount,
      warningCount,
    });

    if (onShowErrorDetails && typeof onShowErrorDetails === 'function') {
      try {
        onShowErrorDetails();
        console.log('✅ [STEP_CONTROLS] 오류 상세 정보 모달 열기 성공');
      } catch (error) {
        console.error(
          '❌ [STEP_CONTROLS] 오류 상세 정보 모달 열기 실패:',
          error
        );
      }
    } else {
      console.warn(
        '⚠️ [STEP_CONTROLS] onShowErrorDetails 핸들러가 제공되지 않음'
      );
    }
  };

  // 저장 버튼 핸들러
  const handleSave = (): void => {
    console.log('💾 [STEP_CONTROLS] 저장 버튼 클릭');
    try {
      saveAllToContext();
      console.log('✅ [STEP_CONTROLS] 저장 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 저장 실패:', error);
    }
  };

  // 완성 버튼 핸들러 (🆕 오류 상태 확인 추가)
  const handleComplete = (): void => {
    console.log('✅ [STEP_CONTROLS] 완성 버튼 클릭 시도:', {
      hasErrors,
      errorCount,
      canComplete: !hasErrors,
    });

    // 오류가 있는 경우 완성 불가
    if (hasErrors) {
      console.warn('⚠️ [STEP_CONTROLS] 오류로 인해 완성 불가:', {
        errorCount,
        warningCount,
      });

      // 오류 상세 정보 모달 자동 열기
      if (onShowErrorDetails) {
        handleShowErrorDetails();
      }
      return;
    }

    try {
      completeEditor();
      console.log('✅ [STEP_CONTROLS] 완성 성공');
    } catch (error) {
      console.error('❌ [STEP_CONTROLS] 완성 실패:', error);
    }
  };

  // 🆕 오류 버튼 표시 텍스트 계산
  const getErrorButtonText = (): string => {
    if (errorCount > 0 && warningCount > 0) {
      return `(!!) 오류 ${errorCount}개, 경고 ${warningCount}개`;
    } else if (errorCount > 0) {
      return `(!) 오류 ${errorCount}개`;
    } else if (warningCount > 0) {
      return `(!) 경고 ${warningCount}개`;
    } else {
      return '(!) 오류있음';
    }
  };

  // 🆕 오류 버튼 색상 계산
  const getErrorButtonColor = (): 'danger' | 'warning' => {
    return errorCount > 0 ? 'danger' : 'warning';
  };

  // 완성 버튼 비활성화 여부 계산 (🆕 오류 상태 고려)
  const isCompleteDisabled = hasErrors;

  // 완성 버튼 텍스트 계산 (🆕 오류 상태 반영)
  const getCompleteButtonText = (): string => {
    if (hasErrors) {
      return '완성 (오류 해결 필요)';
    }
    return '완성';
  };

  console.log('🎛️ [STEP_CONTROLS] 렌더링 완료:', {
    hasErrors,
    isCompleteDisabled,
    errorButtonText: hasErrors ? getErrorButtonText() : null,
    completeButtonText: getCompleteButtonText(),
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

        {/* 중간: 현재 구조 표시 */}
        <div className="flex items-center justify-center flex-1 min-w-0 gap-2 text-sm text-gray-600">
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

        {/* 오른쪽: 액션 버튼들 */}
        <div className="flex items-center flex-shrink-0 gap-2">
          {/* 🆕 오류 상태 버튼 (오류가 있을 때만 표시) */}
          {hasErrors && (
            <Button
              type="button"
              color={getErrorButtonColor()}
              variant="flat"
              size="md"
              onPress={handleShowErrorDetails}
              startContent={<Icon icon="lucide:alert-circle" />}
              aria-label={`오류 상세 정보 보기: ${getErrorButtonText()}`}
              className="transition-all duration-200"
            >
              {getErrorButtonText()}
            </Button>
          )}

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

          {/* 완성 버튼 (🆕 조건부 비활성화) */}
          <Button
            type="button"
            color="success"
            variant={isCompleteDisabled ? 'flat' : 'solid'} // 🆕 비활성화 시 스타일 변경
            size="md"
            onPress={handleComplete}
            isDisabled={isCompleteDisabled} // 🆕 비활성화 속성
            endContent={<Icon icon="lucide:check" />}
            aria-label={`글 작성 완료${
              hasErrors ? ' - 오류 해결 후 다시 시도하세요' : ''
            }`}
            className={`transition-all duration-200 ${
              isCompleteDisabled
                ? 'opacity-50 cursor-not-allowed' // 🆕 비활성화 시 시각적 피드백
                : 'opacity-100 cursor-pointer'
            }`}
          >
            {getCompleteButtonText()}
          </Button>
        </div>
      </div>

      {/* 🆕 오류 상태 요약 (오류가 있을 때만 표시) */}
      {/* {hasErrors && (
        <div className="p-3 mt-3 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start gap-2">
            <Icon
              icon="lucide:alert-triangle"
              className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">
                완성하려면 다음 문제들을 해결해주세요:
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-red-600">
                {errorCount > 0 && <span>오류 {errorCount}개</span>}
                {warningCount > 0 && <span>경고 {warningCount}개</span>}
                <button
                  type="button"
                  onClick={handleShowErrorDetails}
                  className="underline rounded hover:no-underline focus:outline-none focus:ring-1 focus:ring-red-500"
                  aria-label="오류 상세 정보 보기"
                >
                  상세 보기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default StepControls;
