import React, { useState, useEffect } from 'react';
import StepControls from './controls/StepControls';
import ParagraphEditor from './paragraph/ParagraphEditor';
import ContainerManager from './container/ContainerManager';
import PreviewPanel from './preview/PreviewPanel';

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

interface WritingStepProps {
  localContainers: Container[];
  localParagraphs: LocalParagraph[];
  internalState: EditorInternalState;
  renderMarkdown: (text: string) => React.ReactNode;
  goToStructureStep: () => void;
  saveAllToContext: () => void;
  completeEditor: () => void;
  addLocalParagraph: () => void;
  deleteLocalParagraph: (id: string) => void;
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
  togglePreview: () => void;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>;
  getLocalUnassignedParagraphs: () => LocalParagraph[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
}

function WritingStep({
  localContainers,
  localParagraphs,
  internalState,
  renderMarkdown,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
  addLocalParagraph,
  deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  togglePreview,
  setInternalState,
  getLocalUnassignedParagraphs,
  getLocalParagraphsByContainer,
}: WritingStepProps) {
  console.log('✍️ [WRITING_STEP] 컴포넌트 렌더링:', {
    localContainers: localContainers.length,
    localParagraphs: localParagraphs.length,
    currentSubStep: internalState.currentSubStep,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      console.log('📱 [WRITING_STEP] 모바일 체크:', {
        mobile,
        width: window.innerWidth,
      });
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      console.log('🧹 [WRITING_STEP] 리사이즈 리스너 정리');
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const unassignedParagraphs = getLocalUnassignedParagraphs();
  const sortedContainers = [...localContainers].sort(
    (a, b) => a.order - b.order
  );

  console.log('📊 [WRITING_STEP] 상태 계산:', {
    unassignedParagraphs: unassignedParagraphs.length,
    sortedContainers: sortedContainers.length,
    isMobile,
  });

  return (
    <div className="space-y-4">
      <StepControls
        sortedContainers={sortedContainers}
        goToStructureStep={goToStructureStep}
        saveAllToContext={saveAllToContext}
        completeEditor={completeEditor}
      />

      <div
        className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}
        style={{ height: '70vh' }}
      >
        <ParagraphEditor
          isMobile={isMobile}
          unassignedParagraphs={unassignedParagraphs}
          internalState={internalState}
          sortedContainers={sortedContainers}
          addLocalParagraph={addLocalParagraph}
          deleteLocalParagraph={deleteLocalParagraph}
          updateLocalParagraphContent={updateLocalParagraphContent}
          toggleParagraphSelection={toggleParagraphSelection}
          addToLocalContainer={addToLocalContainer}
          setInternalState={setInternalState}
        />

        <ContainerManager
          isMobile={isMobile}
          sortedContainers={sortedContainers}
          getLocalParagraphsByContainer={getLocalParagraphsByContainer}
          moveLocalParagraphInContainer={moveLocalParagraphInContainer}
          activateEditor={activateEditor}
        />
      </div>

      <PreviewPanel
        internalState={internalState}
        sortedContainers={sortedContainers}
        getLocalParagraphsByContainer={getLocalParagraphsByContainer}
        renderMarkdown={renderMarkdown}
        activateEditor={activateEditor}
        togglePreview={togglePreview}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .tiptap-wrapper .ProseMirror {
              outline: none;
              min-height: 200px;
              padding: 1rem;
            }

            .tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
              content: attr(data-placeholder);
              float: left;
              color: #adb5bd;
              pointer-events: none;
              height: 0;
              white-space: pre-line;
            }

            .tiptap-wrapper .tiptap-image,
            .tiptap-wrapper .ProseMirror img,
            .tiptap-wrapper img {
              max-width: 100% !important;
              height: auto !important;
              border-radius: 8px !important;
              margin: 8px 0 !important;
              display: block !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
              cursor: pointer !important;
              transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            }

            .tiptap-wrapper .tiptap-image:hover,
            .tiptap-wrapper .ProseMirror img:hover,
            .tiptap-wrapper img:hover {
              transform: scale(1.02) !important;
              box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
            }

            .tiptap-wrapper img[src=""],
            .tiptap-wrapper img:not([src]) {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
              min-height: 100px;
              opacity: 0.7;
            }

            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }

            .tiptap-wrapper .tiptap-link {
              color: #3b82f6;
              text-decoration: underline;
            }

            .tiptap-wrapper .ProseMirror-dropcursor {
              border-left: 2px solid #3b82f6;
            }

            .tiptap-wrapper .ProseMirror-gapcursor {
              display: none;
              pointer-events: none;
              position: absolute;
            }

            .tiptap-wrapper .ProseMirror-gapcursor:after {
              content: '';
              display: block;
              position: absolute;
              top: -2px;
              width: 20px;
              border-top: 1px solid #3b82f6;
              animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
            }

            @keyframes ProseMirror-cursor-blink {
              to {
                visibility: hidden;
              }
            }

            .tiptap-wrapper .ProseMirror-selectednode {
              outline: 2px solid #3b82f6;
              outline-offset: 2px;
            }

            .markdown-content img,
            .rendered-image {
              max-width: 100% !important;
              height: auto !important;
              border-radius: 8px !important;
              margin: 8px 0 !important;
              display: block !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
              cursor: pointer !important;
              transition: transform 0.2s ease, box-shadow 0.2s ease !important;
            }

            .markdown-content .rendered-image:hover {
              transform: scale(1.02) !important;
              box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
            }

            .markdown-content img[alt*="불러올 수 없습니다"],
            .rendered-image[alt*="불러올 수 없습니다"] {
              opacity: 0.5 !important;
              filter: grayscale(100%) !important;
              border: 2px dashed #ccc !important;
            }
          `,
        }}
      />
    </div>
  );
}

export default WritingStep;
