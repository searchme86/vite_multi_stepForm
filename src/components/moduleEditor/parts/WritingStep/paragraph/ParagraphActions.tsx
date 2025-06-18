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
  sortedContainers: Container[];
  addToLocalContainer: () => void;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>;
}

function ParagraphActions({
  paragraph,
  internalState,
  sortedContainers,
  addToLocalContainer,
  setInternalState,
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
      setInternalState((prev: EditorInternalState) => ({
        ...prev,
        targetContainerId: containerId,
        selectedParagraphIds: prev.selectedParagraphIds.includes(paragraph.id)
          ? prev.selectedParagraphIds
          : [...prev.selectedParagraphIds, paragraph.id],
      }));
    },
    [paragraph.id, setInternalState]
  );

  const handleAddToContainer = useCallback(() => {
    addToLocalContainer();
  }, [addToLocalContainer]);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handleContainerSelect(e.target.value);
    },
    [handleContainerSelect]
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
