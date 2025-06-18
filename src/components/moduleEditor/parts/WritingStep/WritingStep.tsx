// 📁 editor/parts/WritingStep/WritingStep.tsx

import React, { useState, useEffect } from 'react';
import StepControls from './controls/StepControls';
import ParagraphEditor from './paragraph/ParagraphEditor';
import ContainerManager from './container/ContainerManager';
import PreviewPanel from './preview/PreviewPanel';
import { MarkdownCompleteButton } from '../../../../bridges/parts/MarkdownCompleteButton';
import { MarkdownStatusCard } from '../../../../bridges/parts/MarkdownStatusCard';
import { MarkdownResultToast } from '../../../../bridges/parts/MarkdownResultToast';
import { QuickStatusBar } from '../../../../bridges/parts/QuickStatusBar';

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
  setTargetContainerId: (containerId: string) => void;
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
  setTargetContainerId,
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
      {!isMobile && (
        <QuickStatusBar
          position="top"
          variant="minimal"
          showProgressBar={true}
          showQuickActions={true}
          showStatistics={false}
          collapsible={true}
          onQuickTransfer={completeEditor}
          onShowDetails={() => {
            console.log('⚡ [WRITING_STEP] 상세 정보 보기 요청');
          }}
          className="backdrop-blur-sm"
        />
      )}

      <MarkdownResultToast
        position={isMobile ? 'top-center' : 'top-right'}
        defaultDuration={5000}
        maxToasts={3}
        className="z-50"
        onToastClick={(toast) => {
          console.log(
            '🍞 [WRITING_STEP] 토스트 클릭:',
            toast.type,
            toast.title
          );
        }}
        onToastClose={(toast) => {
          console.log(
            '🍞 [WRITING_STEP] 토스트 닫힘:',
            toast.type,
            toast.title
          );
        }}
      />

      <div
        className={`flex flex-col space-y-4 ${!isMobile ? 'pt-8' : ''}`}
        style={{
          paddingBottom: isMobile ? '80px' : '0',
        }}
      >
        <StepControls
          sortedContainers={sortedContainers}
          goToStructureStep={goToStructureStep}
          saveAllToContext={saveAllToContext}
          completeEditor={completeEditor}
        />

        <div
          className="pt-4 border-t border-gray-200"
          role="region"
          aria-labelledby="markdown-bridge-section"
        >
          <div className="flex flex-col space-y-4">
            <h3
              id="markdown-bridge-section"
              className="text-sm font-medium text-gray-700"
            >
              마크다운 생성
            </h3>

            <div
              className="w-full"
              role="status"
              aria-live="polite"
              aria-label="마크다운 생성 상태 정보"
            >
              <MarkdownStatusCard
                size={isMobile ? 'compact' : 'standard'}
                variant="bordered"
                hideValidationDetails={isMobile}
                hideErrorsWarnings={isMobile}
                className={`
                  transition-all duration-200
                  ${isMobile ? 'text-sm' : ''}
                  focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50
                `}
                onClick={() => {
                  console.log(
                    '📊 [WRITING_STEP] 상태 카드 클릭 - 상세 정보 표시'
                  );
                }}
              />
            </div>

            <div
              className="w-full"
              role="group"
              aria-labelledby="markdown-complete-section"
            >
              <MarkdownCompleteButton
                buttonText="마크다운 완성하기"
                size="medium"
                variant="primary"
                fullWidth={isMobile}
                onCompleteSuccess={completeEditor}
                showDetailedStatus={true}
                className={`
                  transition-all duration-200
                  ${isMobile ? 'text-sm py-3' : 'py-2'}
                `}
              />
            </div>
          </div>
        </div>
      </div>

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
          setTargetContainerId={setTargetContainerId}
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

      {isMobile && (
        <QuickStatusBar
          position="bottom"
          variant="tab-bar"
          showProgressBar={true}
          showQuickActions={true}
          showStatistics={true}
          collapsible={false}
          onQuickTransfer={completeEditor}
          onShowDetails={() => {
            console.log('⚡ [WRITING_STEP] 모바일 상세 정보 보기 요청');
          }}
          className="border-t border-gray-200 backdrop-blur-sm"
        />
      )}
    </div>
  );
}

export default WritingStep;
