import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StepControls from './controls/StepControls';
import ParagraphEditor from './paragraph/ParagraphEditor';
import { MarkdownCompleteButton } from '../../../../bridges/parts/MarkdownCompleteButton';
import { MarkdownStatusCard } from '../../../../bridges/parts/MarkdownStatusCard';
import { MarkdownResultToast } from '../../../../bridges/parts/MarkdownResultToast';
import { QuickStatusBar } from '../../../../bridges/parts/QuickStatusBar';

import {
  ErrorStatusModal,
  useErrorStatusModal,
} from '../../../../bridges/parts/ErrorStatusModal';
import { useBridgeUI } from '../../../../bridges/hooks/useBridgeUI';

import { EditorSidebarContainer } from './sidebar/EditorSidebarContainer';
import { StructureManagementSlide } from './sidebar/slides/StructureManagementSlide';
import { FinalPreviewSlide } from './sidebar/slides/FinalPreviewSlide';

import {
  ContainerManagerProps,
  PreviewPanelProps,
} from '../../../swipeableSection/types/swipeableTypes.ts';

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
  const [isMobile, setIsMobile] = useState(false);
  const { validationStatus: currentValidationStatus } = useBridgeUI();

  const {
    isOpen: isErrorModalOpen,
    openModal: openErrorModal,
    closeModal: closeErrorModal,
  } = useErrorStatusModal();

  const { validationErrors, validationWarnings, isReadyForTransfer } =
    currentValidationStatus;

  const hasErrors = useMemo(() => {
    return validationErrors.length > 0 || !isReadyForTransfer;
  }, [validationErrors.length, isReadyForTransfer]);

  const errorCount = useMemo(() => {
    return validationErrors.length;
  }, [validationErrors.length]);

  const warningCount = useMemo(() => {
    return validationWarnings.length;
  }, [validationWarnings.length]);

  const handleShowErrorDetails = useCallback(() => {
    openErrorModal();
  }, [openErrorModal]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const unassignedParagraphs = useMemo(() => {
    return getLocalUnassignedParagraphs();
  }, [getLocalUnassignedParagraphs, localParagraphs.length]);

  const sortedContainers = useMemo(() => {
    return [...localContainers].sort((a, b) => a.order - b.order);
  }, [localContainers]);

  const handleUpdateParagraphContent = useCallback(
    (id: string, content: string) => {
      if (!id || typeof id !== 'string') {
        return;
      }

      if (typeof content !== 'string') {
        return;
      }

      try {
        updateLocalParagraphContent(id, content);
      } catch (error) {
        console.error('단락 내용 업데이트 실패:', error);
      }
    },
    [updateLocalParagraphContent]
  );

  const handleToggleParagraphSelection = useCallback(
    (id: string) => {
      if (
        toggleParagraphSelection &&
        typeof toggleParagraphSelection === 'function'
      ) {
        try {
          toggleParagraphSelection(id);
        } catch (error) {
          console.error('단락 선택 토글 실패:', error);
        }
      }
    },
    [toggleParagraphSelection]
  );

  const paragraphEditorProps = useMemo(
    () => ({
      isMobile,
      unassignedParagraphs,
      internalState,
      sortedContainers,
      addLocalParagraph,
      deleteLocalParagraph,
      updateLocalParagraphContent: handleUpdateParagraphContent,
      toggleParagraphSelection: handleToggleParagraphSelection,
      addToLocalContainer,
      setTargetContainerId,
      setInternalState,
    }),
    [
      isMobile,
      unassignedParagraphs,
      internalState,
      sortedContainers,
      addLocalParagraph,
      deleteLocalParagraph,
      handleUpdateParagraphContent,
      handleToggleParagraphSelection,
      addToLocalContainer,
      setTargetContainerId,
      setInternalState,
    ]
  );

  const containerManagerProps: ContainerManagerProps = useMemo(
    () => ({
      isMobile,
      sortedContainers,
      getLocalParagraphsByContainer,
      moveLocalParagraphInContainer,
      activateEditor,
    }),
    [
      isMobile,
      sortedContainers,
      getLocalParagraphsByContainer,
      moveLocalParagraphInContainer,
      activateEditor,
    ]
  );

  const previewPanelProps: PreviewPanelProps = useMemo(
    () => ({
      internalState,
      sortedContainers,
      getLocalParagraphsByContainer,
      renderMarkdown,
      activateEditor,
      togglePreview,
    }),
    [
      internalState,
      sortedContainers,
      getLocalParagraphsByContainer,
      renderMarkdown,
      activateEditor,
      togglePreview,
    ]
  );

  const preparedStructureSlide = useMemo(
    () => (
      <StructureManagementSlide containerManagerProps={containerManagerProps} />
    ),
    [containerManagerProps]
  );

  const preparedPreviewSlide = useMemo(
    () => <FinalPreviewSlide previewPanelProps={previewPanelProps} />,
    [previewPanelProps]
  );

  const totalParagraphCount = useMemo(() => {
    return localParagraphs.length;
  }, [localParagraphs.length]);

  return (
    <div className="w-full h-full">
      <div className="hidden h-full md:flex md:flex-col">
        <QuickStatusBar
          position="top"
          variant="minimal"
          showProgressBar={true}
          showQuickActions={true}
          showStatistics={false}
          collapsible={true}
          onQuickTransfer={completeEditor}
          onShowDetails={() => {}}
          className="border-b border-gray-200 backdrop-blur-sm"
        />

        <StepControls
          sortedContainers={sortedContainers}
          goToStructureStep={goToStructureStep}
          saveAllToContext={saveAllToContext}
          completeEditor={completeEditor}
          hasErrors={hasErrors}
          errorCount={errorCount}
          warningCount={warningCount}
          onShowErrorDetails={handleShowErrorDetails}
        />
        {/* 단락작성 */}
        <div className="mt-[30px]">
          <h2 className="text-xl font-bold text-gray-900">📝 단락 작성</h2>
          <div className="flex w-[100%] items-center justify-between mb-4 border-gray-200 h-[800px] max-h-[800px] mt-[10px] overflow-scroll">
            <ParagraphEditor {...paragraphEditorProps} />
            <EditorSidebarContainer className="h-full">
              {preparedStructureSlide}
              {preparedPreviewSlide}
            </EditorSidebarContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full md:hidden">
        <div className="border-b border-gray-200 h-1/2">
          <EditorSidebarContainer className="h-full">
            {preparedStructureSlide}
            {preparedPreviewSlide}
          </EditorSidebarContainer>
        </div>

        <div className="flex flex-col flex-1">
          <StepControls
            sortedContainers={sortedContainers}
            goToStructureStep={goToStructureStep}
            saveAllToContext={saveAllToContext}
            completeEditor={completeEditor}
            hasErrors={hasErrors}
            errorCount={errorCount}
            warningCount={warningCount}
            onShowErrorDetails={handleShowErrorDetails}
          />
          <div className="mt-4 space-y-4">
            <MarkdownStatusCard
              size="compact"
              variant="bordered"
              hideTransferStatus={true}
              hideValidationDetails={true}
              hideStatistics={false}
              hideErrorsWarnings={true}
              className="text-sm transition-all duration-200"
              onClick={() => {
                handleShowErrorDetails();
              }}
            />

            <MarkdownCompleteButton
              buttonText="마크다운 완성하기"
              size="medium"
              variant="primary"
              fullWidth={true}
              onCompleteSuccess={completeEditor}
              showDetailedStatus={false}
              forceDisabled={hasErrors}
              className="py-3 text-sm transition-all duration-200"
            />
          </div>

          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">📝 단락 작성</h2>
              <div className="text-xs text-gray-500">
                미할당: {unassignedParagraphs.length}개 / 전체:{' '}
                {totalParagraphCount}개
              </div>
            </div>
            <div className="h-full pb-20">
              <ParagraphEditor {...paragraphEditorProps} />
            </div>
          </div>

          <QuickStatusBar
            position="bottom"
            variant="tab-bar"
            showProgressBar={true}
            showQuickActions={true}
            showStatistics={true}
            collapsible={false}
            onQuickTransfer={completeEditor}
            onShowDetails={() => {}}
            className="border-t border-gray-200 backdrop-blur-sm"
          />
        </div>
      </div>

      <MarkdownResultToast
        position={isMobile ? 'top-center' : 'top-right'}
        defaultDuration={5000}
        maxToasts={3}
        className="z-50"
        onToastClick={() => {}}
        onToastClose={() => {}}
      />

      <ErrorStatusModal
        isOpen={isErrorModalOpen}
        onClose={closeErrorModal}
        size="lg"
        title="브릿지 상태 및 오류 정보"
        statusCardProps={{
          size: 'detailed',
          variant: 'default',
          hideTransferStatus: false,
          hideValidationDetails: false,
          hideStatistics: false,
          hideErrorsWarnings: false,
        }}
        className="z-50"
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

            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `,
        }}
      />
    </div>
  );
}

export default WritingStep;
