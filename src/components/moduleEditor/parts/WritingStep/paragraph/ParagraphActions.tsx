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
  addToLocalContainer?: () => void;
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
  // ✅ 개발 모드에서만 디버그 로그
  const isDebugMode = process.env.NODE_ENV === 'development';

  // 🎯 메모이제이션된 계산값들
  const isSelected = useMemo(
    () => internalState.selectedParagraphIds.includes(paragraph.id),
    [internalState.selectedParagraphIds, paragraph.id]
  );

  const targetContainerExists = useMemo(() => {
    return sortedContainers.some(
      (container) => container.id === internalState.targetContainerId
    );
  }, [sortedContainers, internalState.targetContainerId]);

  // 🔧 컨테이너 ID 검증 및 자동 초기화 (useEffect 제거, 조건부 실행으로 변경)
  const selectValue = useMemo(() => {
    // 선택되지 않았거나 존재하지 않는 컨테이너인 경우 빈 문자열 반환
    if (!isSelected || !targetContainerExists) {
      return '';
    }
    return internalState.targetContainerId;
  }, [isSelected, targetContainerExists, internalState.targetContainerId]);

  // 🚀 최적화된 콘텐츠 검증 로직
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

  // 🔧 버튼 텍스트 및 색상 계산
  const getButtonText = useCallback(() => {
    if (!isSelected) return '단락 선택 필요';
    if (!internalState.targetContainerId) return '컨테이너 선택 필요';
    if (getContentValidation.isEmpty && !getContentValidation.hasMedia)
      return '내용 입력 필요';
    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia)
      return '실제 내용 입력 필요';
    return '컨테이너에 추가';
  }, [isSelected, internalState.targetContainerId, getContentValidation]);

  const getButtonColor = useCallback(() => {
    return isButtonDisabled ? 'default' : 'success';
  }, [isButtonDisabled]);

  // ✅ 컨테이너 선택 핸들러 - 안정화된 의존성
  const handleContainerSelect = useCallback(
    (containerId: string) => {
      if (isDebugMode) {
        console.log('🎯 [PARAGRAPH_ACTIONS] 컨테이너 선택:', {
          containerId,
          paragraphId: paragraph.id.slice(-8),
        });
      }

      // 컨테이너 ID 설정
      setTargetContainerId(containerId);

      // 선택되지 않은 단락이면 자동 선택
      if (!isSelected) {
        toggleParagraphSelection(paragraph.id);
        if (isDebugMode) {
          console.log('✅ [PARAGRAPH_ACTIONS] 단락 자동 선택됨');
        }
      }
    },
    [
      paragraph.id,
      isSelected,
      setTargetContainerId,
      toggleParagraphSelection,
      isDebugMode,
    ]
  );

  // ✅ 컨테이너 추가 핸들러 - 최적화된 검증
  const handleAddToContainer = useCallback(() => {
    if (isDebugMode) {
      console.log('➕ [PARAGRAPH_ACTIONS] 추가 버튼 클릭:', {
        isSelected,
        targetContainerId: internalState.targetContainerId,
        contentValidation: getContentValidation,
      });
    }

    // 조기 반환으로 검증 최적화
    if (!isSelected) {
      if (isDebugMode) {
        console.warn('⚠️ [PARAGRAPH_ACTIONS] 단락이 선택되지 않음');
      }
      return;
    }

    if (!internalState.targetContainerId) {
      if (isDebugMode) {
        console.warn('⚠️ [PARAGRAPH_ACTIONS] 타겟 컨테이너가 선택되지 않음');
      }
      return;
    }

    if (getContentValidation.isEmpty && !getContentValidation.hasMedia) {
      if (isDebugMode) {
        console.warn('⚠️ [PARAGRAPH_ACTIONS] 내용이 비어있습니다');
      }
      return;
    }

    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia) {
      if (isDebugMode) {
        console.warn('⚠️ [PARAGRAPH_ACTIONS] 플레이스홀더만 있음');
      }
      return;
    }

    if (isDebugMode) {
      console.log('✅ [PARAGRAPH_ACTIONS] 모든 검증 통과, 컨테이너에 추가');
    }

    addToLocalContainer();
  }, [
    isSelected,
    internalState.targetContainerId,
    getContentValidation,
    addToLocalContainer,
    isDebugMode,
  ]);

  // ✅ 드롭다운 변경 핸들러 - 안정화된 의존성
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedContainerId = e.target.value;

      if (isDebugMode) {
        console.log('📝 [PARAGRAPH_ACTIONS] 드롭다운 변경:', {
          selectedContainerId,
          previousContainerId: internalState.targetContainerId,
        });
      }

      if (selectedContainerId) {
        handleContainerSelect(selectedContainerId);
      }
    },
    [handleContainerSelect, internalState.targetContainerId, isDebugMode]
  );

  // 🔧 디버그 로그 (개발 모드에서만, 간소화)
  if (isDebugMode) {
    console.log('🔄 [PARAGRAPH_ACTIONS] 상태:', {
      paragraphId: paragraph.id.slice(-8),
      isSelected,
      targetContainerId: internalState.targetContainerId,
      targetContainerExists,
      isButtonDisabled,
      containersCount: sortedContainers.length,
    });
  }

  return (
    <div className="flex gap-2">
      {/* 컨테이너 선택 드롭다운 */}
      <select
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
        value={selectValue}
        onChange={handleSelectChange}
        aria-label={`단락 ${paragraph.id}를 추가할 컨테이너 선택`}
      >
        <option value="">컨테이너 선택</option>
        {sortedContainers.map((container) => (
          <option key={container.id} value={container.id}>
            {container.name}
          </option>
        ))}
      </select>

      {/* 추가 버튼 */}
      <Button
        type="button"
        color={getButtonColor()}
        size="sm"
        onPress={handleAddToContainer}
        isDisabled={isButtonDisabled}
        aria-label="선택된 단락을 컨테이너에 추가"
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
            : '컨테이너에 추가'
        }
      >
        {getButtonText()}
      </Button>

      {/* 상태 표시 (간소화) */}
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
