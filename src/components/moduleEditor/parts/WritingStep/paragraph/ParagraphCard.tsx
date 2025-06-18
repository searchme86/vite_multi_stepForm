// 📁 editor/parts/WritingStep/paragraph/ParagraphCard.tsx

import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import TiptapEditor from '../../TiptapEditor/TiptapEditor';
import ParagraphActions from './ParagraphActions';

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

interface ParagraphCardProps {
  paragraph: LocalParagraph;
  internalState: EditorInternalState;
  sortedContainers: Container[];
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  setTargetContainerId: (containerId: string) => void;
}

function ParagraphCard({
  paragraph,
  internalState,
  sortedContainers,
  deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  setTargetContainerId,
}: ParagraphCardProps) {
  console.log('📄 [PARAGRAPH_CARD] 렌더링:', {
    paragraphId: paragraph.id,
    isActive: internalState.activeParagraphId === paragraph.id,
    isSelected: internalState.selectedParagraphIds.includes(paragraph.id),
  });

  const isActive = internalState.activeParagraphId === paragraph.id;
  const isSelected = internalState.selectedParagraphIds.includes(paragraph.id);

  const handleSelectionChange = () => {
    console.log('☑️ [PARAGRAPH_CARD] 선택 상태 변경:', paragraph.id);
    toggleParagraphSelection(paragraph.id);
  };

  const handleContentChange = (content: string) => {
    console.log('✏️ [PARAGRAPH_CARD] 내용 변경:', {
      paragraphId: paragraph.id,
      contentLength: content.length,
    });
    updateLocalParagraphContent(paragraph.id, content);
  };

  const handleDelete = () => {
    console.log('🗑️ [PARAGRAPH_CARD] 단락 삭제:', paragraph.id);
    deleteLocalParagraph(paragraph.id);
  };

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <input
            type="checkbox"
            className="mt-2"
            checked={isSelected}
            onChange={handleSelectionChange}
            aria-label={`단락 ${paragraph.id} 선택`}
          />

          <div className="flex-1">
            <TiptapEditor
              paragraphId={paragraph.id}
              initialContent={paragraph.content}
              onContentChange={handleContentChange}
              isActive={isActive}
            />

            <ParagraphActions
              paragraph={paragraph}
              internalState={internalState}
              sortedContainers={sortedContainers}
              addToLocalContainer={addToLocalContainer}
              setTargetContainerId={setTargetContainerId}
              toggleParagraphSelection={toggleParagraphSelection}
            />
          </div>

          <Button
            type="button"
            isIconOnly
            color="danger"
            variant="light"
            size="sm"
            onPress={handleDelete}
            aria-label={`단락 ${paragraph.id} 삭제`}
          >
            <Icon icon="lucide:trash-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ParagraphCard;
