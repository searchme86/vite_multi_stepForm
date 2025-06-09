import React from 'react';
import PreviewControls from './PreviewControls';
import PreviewContent from './PreviewContent';

type SubStep = 'structure' | 'writing';

interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

interface Container {
  id: string;
  name: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
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

interface PreviewPanelProps {
  internalState: EditorInternalState;
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  renderMarkdown: (text: string) => React.ReactNode;
  activateEditor: (id: string) => void;
  togglePreview: () => void;
}

function PreviewPanel({
  internalState,
  sortedContainers,
  getLocalParagraphsByContainer,
  renderMarkdown,
  activateEditor,
  togglePreview,
}: PreviewPanelProps) {
  console.log('👁️ [PREVIEW_PANEL] 렌더링:', {
    isPreviewOpen: internalState.isPreviewOpen,
    containersCount: sortedContainers.length,
  });

  const totalParagraphs = sortedContainers.reduce(
    (total, container) =>
      total + getLocalParagraphsByContainer(container.id).length,
    0
  );

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-400 ${
        internalState.isPreviewOpen ? 'max-h-96' : 'max-h-12'
      }`}
    >
      <PreviewControls
        isPreviewOpen={internalState.isPreviewOpen}
        totalParagraphs={totalParagraphs}
        containersCount={sortedContainers.length}
        togglePreview={togglePreview}
      />

      {internalState.isPreviewOpen && (
        <PreviewContent
          sortedContainers={sortedContainers}
          getLocalParagraphsByContainer={getLocalParagraphsByContainer}
          renderMarkdown={renderMarkdown}
          activateEditor={activateEditor}
        />
      )}
    </div>
  );
}

export default PreviewPanel;
