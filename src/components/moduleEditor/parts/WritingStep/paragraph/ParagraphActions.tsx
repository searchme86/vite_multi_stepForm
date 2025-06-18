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
  const isSelected = useMemo(
    () => internalState.selectedParagraphIds.includes(paragraph.id),
    [internalState.selectedParagraphIds, paragraph.id]
  );

  console.log('=== 컨테이너 ID 불일치 디버깅 ===');
  console.log(
    '현재 선택된 targetContainerId:',
    internalState.targetContainerId
  );
  console.log('실제 존재하는 컨테이너들:');
  sortedContainers.forEach((container, index) => {
    console.log(`  ${index}: ${container.id} - ${container.name}`);
  });

  const targetContainerExists = sortedContainers.some(
    (c) => c.id === internalState.targetContainerId
  );
  console.log('선택된 컨테이너가 실제로 존재하는가?', targetContainerExists);

  React.useEffect(() => {
    if (
      internalState.targetContainerId &&
      !targetContainerExists &&
      sortedContainers.length > 0
    ) {
      console.log(
        '🔧 [AUTO_FIX] 존재하지 않는 컨테이너 ID 감지, 자동 초기화:',
        internalState.targetContainerId
      );
      if (setTargetContainerId && typeof setTargetContainerId === 'function') {
        setTargetContainerId('');
        console.log('✅ [AUTO_FIX] targetContainerId 초기화 완료');
      }
    }
  }, [
    internalState.targetContainerId,
    targetContainerExists,
    sortedContainers.length,
    setTargetContainerId,
  ]);

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

  console.log('🔍 [NEW] 콘텐츠 검증 상세:', getContentValidation);

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

  console.log('✅ [FINAL] isButtonDisabled (수정됨):', isButtonDisabled);

  const selectValue =
    isSelected && targetContainerExists ? internalState.targetContainerId : '';

  console.log('selectValue (수정됨):', selectValue);

  const getButtonText = () => {
    if (!isSelected) return '단락 선택 필요';
    if (!internalState.targetContainerId) return '컨테이너 선택 필요';
    if (getContentValidation.isEmpty && !getContentValidation.hasMedia)
      return '내용 입력 필요';
    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia)
      return '실제 내용 입력 필요';
    return '컨테이너에 추가';
  };

  const getButtonColor = () => {
    if (isButtonDisabled) return 'default';
    return 'success';
  };

  const handleContainerSelect = useCallback(
    (containerId: string) => {
      console.log('🎯 [PARAGRAPH_ACTIONS] 컨테이너 선택:', {
        containerId,
        paragraphId: paragraph.id,
        paragraphContent: paragraph.content,
        setTargetContainerIdType: typeof setTargetContainerId,
        setTargetContainerIdValue: setTargetContainerId,
      });

      try {
        if (
          setTargetContainerId &&
          typeof setTargetContainerId === 'function'
        ) {
          setTargetContainerId(containerId);
          console.log('✅ [PARAGRAPH_ACTIONS] setTargetContainerId 호출 성공');
        } else {
          console.error(
            '❌ [PARAGRAPH_ACTIONS] setTargetContainerId가 함수가 아님:',
            {
              type: typeof setTargetContainerId,
              value: setTargetContainerId,
            }
          );
          return;
        }
      } catch (error) {
        console.error(
          '❌ [PARAGRAPH_ACTIONS] setTargetContainerId 호출 중 에러:',
          error
        );
        return;
      }

      try {
        if (
          !isSelected &&
          toggleParagraphSelection &&
          typeof toggleParagraphSelection === 'function'
        ) {
          toggleParagraphSelection(paragraph.id);
          console.log(
            '✅ [PARAGRAPH_ACTIONS] toggleParagraphSelection 호출 성공'
          );
        } else if (!isSelected) {
          console.error(
            '❌ [PARAGRAPH_ACTIONS] toggleParagraphSelection이 함수가 아님:',
            {
              type: typeof toggleParagraphSelection,
              value: toggleParagraphSelection,
            }
          );
        }
      } catch (error) {
        console.error(
          '❌ [PARAGRAPH_ACTIONS] toggleParagraphSelection 호출 중 에러:',
          error
        );
      }
    },
    [
      paragraph.id,
      paragraph.content,
      isSelected,
      setTargetContainerId,
      toggleParagraphSelection,
    ]
  );

  const handleAddToContainer = useCallback(() => {
    console.log('➕ [PARAGRAPH_ACTIONS] 추가 버튼 클릭:', {
      isSelected,
      targetContainerId: internalState.targetContainerId,
      paragraphContent: paragraph.content,
      contentValidation: getContentValidation,
      selectedParagraphs: internalState.selectedParagraphIds,
    });

    if (!isSelected) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 단락이 선택되지 않음');
      return;
    }

    if (!internalState.targetContainerId) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 타겟 컨테이너가 선택되지 않음');
      return;
    }

    if (getContentValidation.isEmpty && !getContentValidation.hasMedia) {
      console.warn(
        '⚠️ [PARAGRAPH_ACTIONS] 내용이 비어있습니다 (이미지나 텍스트 필요)'
      );
      console.log('📝 [DEBUG] 현재 내용:', `"${paragraph.content}"`);
      return;
    }

    if (getContentValidation.hasPlaceholder && !getContentValidation.hasMedia) {
      console.warn(
        '⚠️ [PARAGRAPH_ACTIONS] 플레이스홀더 텍스트만 있음, 실제 내용을 입력해주세요'
      );
      return;
    }

    console.log('✅ [PARAGRAPH_ACTIONS] 모든 검증 통과, 컨테이너에 추가 진행');

    if (typeof addToLocalContainer === 'function') {
      addToLocalContainer();
      console.log('🎉 [PARAGRAPH_ACTIONS] addToLocalContainer 호출 완료');
    } else {
      console.error(
        '❌ [PARAGRAPH_ACTIONS] addToLocalContainer가 함수가 아님:',
        typeof addToLocalContainer
      );
    }
  }, [
    isSelected,
    internalState.targetContainerId,
    internalState.selectedParagraphIds,
    paragraph.content,
    paragraph.id,
    getContentValidation,
    addToLocalContainer,
  ]);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedContainerId = e.target.value;
      console.log('📝 [PARAGRAPH_ACTIONS] 드롭다운 변경:', {
        selectedContainerId,
        previousContainerId: internalState.targetContainerId,
        setTargetContainerIdType: typeof setTargetContainerId,
      });

      if (selectedContainerId) {
        try {
          handleContainerSelect(selectedContainerId);
        } catch (error) {
          console.error(
            '❌ [PARAGRAPH_ACTIONS] handleContainerSelect 호출 중 에러:',
            error
          );
        }
      }
    },
    [
      handleContainerSelect,
      setTargetContainerId,
      internalState.targetContainerId,
    ]
  );

  return (
    <div className="flex gap-2">
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
