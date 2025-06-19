// 📁 editor/parts/WritingStep/paragraph/ParagraphEditor.tsx

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import ParagraphCard from './ParagraphCard';
import EmptyParagraphState from './EmptyParagraphState';

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

interface ParagraphEditorProps {
  isMobile: boolean;
  unassignedParagraphs: LocalParagraph[];
  internalState: EditorInternalState;
  sortedContainers: Container[];
  addLocalParagraph: () => void;
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>;
}

function ParagraphEditor({
  isMobile,
  unassignedParagraphs,
  internalState,
  sortedContainers,
  addLocalParagraph,
  deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
  setInternalState,
}: ParagraphEditorProps) {
  console.log('📝 [PARAGRAPH_EDITOR] 렌더링:', {
    isMobile,
    unassignedParagraphs: unassignedParagraphs.length,
  });

  const handleAddParagraph = () => {
    console.log('➕ [PARAGRAPH_EDITOR] 새 단락 추가 버튼 클릭');
    addLocalParagraph();
  };

  return (
    <div
      className={`${
        isMobile ? 'w-full' : 'flex-1'
      } w-[50%] h-full border border-gray-200 rounded-lg pb-4 mr-[20px]`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <span className="text-lg font-semibold">📝 단락 작성 (Tiptap)</span>
        <Button
          type="button"
          color="primary"
          size="sm"
          onPress={handleAddParagraph}
          startContent={<Icon icon="lucide:plus" />}
          aria-label="새로운 단락 추가"
        >
          새 단락
        </Button>
      </div>

      <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
        <div className="h-full space-y-6 ">
          {unassignedParagraphs.map((paragraph) => (
            <ParagraphCard
              key={paragraph.id}
              paragraph={paragraph}
              internalState={internalState}
              sortedContainers={sortedContainers}
              deleteLocalParagraph={deleteLocalParagraph}
              updateLocalParagraphContent={updateLocalParagraphContent}
              toggleParagraphSelection={toggleParagraphSelection}
              addToLocalContainer={addToLocalContainer}
              setTargetContainerId={setTargetContainerId}
            />
          ))}

          {unassignedParagraphs.length === 0 && (
            <EmptyParagraphState addLocalParagraph={addLocalParagraph} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ParagraphEditor;
