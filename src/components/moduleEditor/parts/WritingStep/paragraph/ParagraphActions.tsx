// 📁 editor/parts/WritingStep/paragraph/ParagraphActions.tsx

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

  const isButtonDisabled = useMemo(
    () =>
      !isSelected ||
      !internalState.targetContainerId ||
      !paragraph.content.trim(),
    [isSelected, internalState.targetContainerId, paragraph.content]
  );

  const selectValue = useMemo(
    () => (isSelected ? internalState.targetContainerId : ''),
    [isSelected, internalState.targetContainerId]
  );

  const handleContainerSelect = useCallback(
    (containerId: string) => {
      console.log('🎯 [PARAGRAPH_ACTIONS] 컨테이너 선택:', {
        containerId,
        paragraphId: paragraph.id,
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
    [paragraph.id, isSelected, setTargetContainerId, toggleParagraphSelection]
  );

  const handleAddToContainer = useCallback(() => {
    console.log('➕ [PARAGRAPH_ACTIONS] 추가 버튼 클릭:', {
      isSelected,
      targetContainerId: internalState.targetContainerId,
      hasContent: !!paragraph.content.trim(),
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

    if (!paragraph.content.trim()) {
      console.warn('⚠️ [PARAGRAPH_ACTIONS] 단락 내용이 비어있음');
      return;
    }

    if (typeof addToLocalContainer === 'function') {
      addToLocalContainer();
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
    addToLocalContainer,
  ]);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedContainerId = e.target.value;
      console.log('📝 [PARAGRAPH_ACTIONS] 드롭다운 변경:', {
        selectedContainerId,
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
    [handleContainerSelect, setTargetContainerId]
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
        color="success"
        size="sm"
        onPress={handleAddToContainer}
        isDisabled={isButtonDisabled}
        aria-label="선택된 단락을 컨테이너에 추가"
      >
        추가
      </Button>
    </div>
  );
}

export default React.memo(ParagraphActions);
