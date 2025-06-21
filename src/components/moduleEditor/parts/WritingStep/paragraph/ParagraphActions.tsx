// 📁 src/components/moduleEditor/parts/WritingStep/paragraph/ParagraphActions.tsx

import React, { useCallback, useMemo } from 'react';
import { Button } from '@heroui/react';

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

interface LocalParagraph {
  id: string;
  content: string;
  containerId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string;
}

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ParagraphActionsProps {
  paragraph: LocalParagraph;
  internalState: EditorInternalState;
  sortedContainers?: Container[];
  addToLocalContainer?: () => void; // ✅ 기존 함수 그대로 유지 (내부적으로 moveToContainer 사용)
  setTargetContainerId?: (containerId: string) => void;
  toggleParagraphSelection?: (id: string) => void;
}

function ParagraphActions({
  paragraph,
  internalState,
  sortedContainers = [],
  addToLocalContainer = () => console.warn('addToLocalContainer not provided'),
  setTargetContainerId = () =>
    console.warn('setTargetContainerId not provided'),
  toggleParagraphSelection = () =>
    console.warn('toggleParagraphSelection not provided'),
}: ParagraphActionsProps) {
  // 🔍 선택된 단락 ID들을 안정화된 문자열로 변환
  const selectedParagraphIdsString = useMemo(
    () => internalState.selectedParagraphIds.join(','),
    [internalState.selectedParagraphIds]
  );

  // 🎯 메모이제이션된 계산값들
  const isSelected = useMemo(
    () =>
      selectedParagraphIdsString
        ? selectedParagraphIdsString.split(',').includes(paragraph.id)
        : false,
    [selectedParagraphIdsString, paragraph.id]
  );

  const targetContainerExists = useMemo(() => {
    return sortedContainers.some(
      (container) => container.id === internalState.targetContainerId
    );
  }, [sortedContainers, internalState.targetContainerId]);

  const selectValue = useMemo(() => {
    if (!isSelected || !targetContainerExists) {
      return '';
    }
    return internalState.targetContainerId;
  }, [isSelected, targetContainerExists, internalState.targetContainerId]);

  // 🚀 콘텐츠 검증 로직
  const getContentValidation = useMemo(() => {
    const content = paragraph.content || '';
    const trimmedContent = content.trim();
    const htmlContent = content.replace(/<[^>]*>/g, '').trim();

    const isOnlyHtml = content.length > 0 && htmlContent.length === 0;

    const hasPlaceholder =
      content.includes('여기에 내용을 입력하세요') ||
      content.includes('마크다운을 작성해보세요') ||
      content.includes('텍스트를 입력하세요');

    const hasMedia =
      content.includes('![') ||
      content.includes('](') ||
      content.includes('<img');

    const hasMinimalContent = htmlContent.length > 0 || hasMedia;

    return {
      originalLength: content.length,
      trimmedLength: trimmedContent.length,
      htmlContentLength: htmlContent.length,
      isOnlyHtml,
      hasPlaceholder,
      hasMedia,
      hasMinimalContent,
      isValid: (hasMinimalContent && !hasPlaceholder) || hasMedia,
      isEmpty: content.length === 0 || isOnlyHtml,
    };
  }, [paragraph.content]);

  // 🎯 버튼 비활성화 조건 계산
  const isButtonDisabled = useMemo(() => {
    const basicRequirements =
      !isSelected || !internalState.targetContainerId || !targetContainerExists;

    if (basicRequirements) return true;

    if (getContentValidation.isEmpty && !getContentValidation.hasMedia) {
      return true;
    }

    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia) {
      return true;
    }

    return false;
  }, [
    isSelected,
    internalState.targetContainerId,
    targetContainerExists,
    getContentValidation,
  ]);

  // 🔧 버튼 텍스트 및 색상 계산 (✅ 텍스트 수정: "추가" → "이동")
  const getButtonText = useCallback(() => {
    if (!isSelected) return '단락 선택 필요';
    if (!internalState.targetContainerId) return '컨테이너 선택 필요';
    if (getContentValidation.isEmpty && !getContentValidation.hasMedia)
      return '내용 입력 필요';
    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia)
      return '실제 내용 입력 필요';
    return '컨테이너로 이동'; // ✅ "컨테이너에 추가" → "컨테이너로 이동"
  }, [isSelected, internalState.targetContainerId, getContentValidation]);

  const getButtonColor = useCallback(() => {
    return isButtonDisabled ? 'default' : 'success';
  }, [isButtonDisabled]);

  // ✅ 컨테이너 선택 핸들러
  const handleContainerSelect = useCallback(
    (containerId: string) => {
      setTargetContainerId(containerId);

      if (!isSelected) {
        toggleParagraphSelection(paragraph.id);
      }
    },
    [paragraph.id, isSelected, setTargetContainerId, toggleParagraphSelection]
  );

  // ✅ 컨테이너 이동 핸들러 (기존 함수명 유지)
  const handleAddToContainer = useCallback(() => {
    console.log('🔄 [PARAGRAPH_ACTIONS] 컨테이너 이동 요청:', {
      paragraphId: paragraph.id,
      targetContainerId: internalState.targetContainerId,
      isSelected,
      note: 'addToLocalContainer 함수가 내부적으로 moveToContainer 사용',
    });

    // 조기 반환으로 검증 최적화
    if (!isSelected) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 단락이 선택되지 않음');
      return;
    }

    if (!internalState.targetContainerId) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 대상 컨테이너가 선택되지 않음');
      return;
    }

    if (getContentValidation.isEmpty && !getContentValidation.hasMedia) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 콘텐츠가 비어있음');
      return;
    }

    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 플레이스홀더 콘텐츠만 있음');
      return;
    }

    // ✅ addToLocalContainer 함수 호출 (이제 내부적으로 moveToContainer 사용)
    try {
      addToLocalContainer();
      console.log('✅ [PARAGRAPH_ACTIONS] 이동 요청 전송 완료');
    } catch (error) {
      console.error('❌ [PARAGRAPH_ACTIONS] 이동 요청 실패:', error);
    }
  }, [
    paragraph.id,
    internalState.targetContainerId,
    isSelected,
    getContentValidation,
    addToLocalContainer, // ✅ 기존 함수 그대로 사용
  ]);

  // ✅ 드롭다운 변경 핸들러
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedContainerId = e.target.value;

      if (selectedContainerId) {
        handleContainerSelect(selectedContainerId);
      }
    },
    [handleContainerSelect]
  );

  return (
    <div className="flex flex-col gap-2">
      {/* 메인 액션 영역 */}
      <div className="flex items-center gap-2">
        {/* 컨테이너 선택 드롭다운 */}
        <select
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
          value={selectValue}
          onChange={handleSelectChange}
          aria-label={`단락 ${paragraph.id}를 이동할 컨테이너 선택`} // ✅ aria-label도 수정
        >
          <option value="">컨테이너 선택</option>
          {sortedContainers.map((container) => (
            <option key={container.id} value={container.id}>
              {container.name}
            </option>
          ))}
        </select>

        {/* 이동 버튼 */}
        <Button
          type="button"
          color={getButtonColor()}
          size="sm"
          onPress={handleAddToContainer}
          isDisabled={isButtonDisabled}
          aria-label="선택된 단락을 컨테이너로 이동" // ✅ aria-label 수정
          title={
            getContentValidation.isEmpty && !getContentValidation.hasMedia
              ? '단락에 내용을 입력해주세요'
              : !isSelected
              ? '단락을 선택해주세요'
              : !internalState.targetContainerId
              ? '컨테이너를 선택해주세요'
              : getContentValidation.hasPlaceholder &&
                !getContentValidation.hasMedia
              ? '플레이스홀더 대신 실제 내용을 입력해주세요'
              : '컨테이너로 이동' // ✅ title도 수정
          }
        >
          {getButtonText()}
        </Button>
      </div>

      {/* 상태 표시 */}
      {isButtonDisabled && (
        <div className="flex items-center ml-2 text-xs text-gray-500">
          {getContentValidation.isEmpty && !getContentValidation.hasMedia && (
            <span className="text-orange-600">📝 내용을 입력하세요</span>
          )}
          {!getContentValidation.isEmpty && !isSelected && (
            <span className="text-blue-600">☑️ 단락을 선택하세요</span>
          )}
          {!getContentValidation.isEmpty &&
            isSelected &&
            !internalState.targetContainerId && (
              <span className="text-purple-600">📂 컨테이너를 선택하세요</span>
            )}
          {!getContentValidation.isEmpty &&
            isSelected &&
            internalState.targetContainerId &&
            getContentValidation.hasPlaceholder &&
            !getContentValidation.hasMedia && (
              <span className="text-yellow-600">✏️ 실제 내용을 입력하세요</span>
            )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ParagraphActions);

/**
 * 🔧 ParagraphActions.tsx 개선 사항 (현재 파일 기준):
 *
 * 1. ✅ 기존 Props 구조 완전 유지
 *    - addToLocalContainer prop 그대로 유지
 *    - 함수 시그니처 변경 없음
 *    - 기존 컴포넌트와 100% 호환성
 *
 * 2. ✅ UI 텍스트만 정확하게 수정
 *    - "컨테이너에 추가" → "컨테이너로 이동"
 *    - aria-label과 title 속성도 함께 수정
 *    - 사용자에게 정확한 액션 피드백
 *
 * 3. ✅ 로깅 메시지 개선
 *    - addToLocalContainer가 내부적으로 moveToContainer 사용한다는 설명 추가
 *    - 디버깅 정보 향상
 *
 * 4. ✅ 기존 로직 완전 보존
 *    - 검증 로직 그대로 유지
 *    - 이벤트 핸들러 구조 동일
 *    - 의존성 배열 변경 없음
 *
 * ⚠️ 참고: 이 파일은 선택적 수정입니다.
 * useEditorStateMain.ts 수정만으로도 핵심 문제는 해결됩니다.
 */
