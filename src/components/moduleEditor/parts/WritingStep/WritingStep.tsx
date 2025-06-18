// 📁 src/components/moduleEditor/parts/WritingStep/WritingStep.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    updateLocalParagraphContentType: typeof updateLocalParagraphContent,
    timestamp: new Date().toISOString(),
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

  const unassignedParagraphs = useMemo(() => {
    const result = getLocalUnassignedParagraphs();
    console.log('📊 [WRITING_STEP] 미할당 단락 계산:', {
      total: localParagraphs.length,
      unassigned: result.length,
    });
    return result;
  }, [getLocalUnassignedParagraphs, localParagraphs.length]);

  const sortedContainers = useMemo(() => {
    const result = [...localContainers].sort((a, b) => a.order - b.order);
    console.log('📊 [WRITING_STEP] 정렬된 컨테이너:', {
      original: localContainers.length,
      sorted: result.length,
    });
    return result;
  }, [localContainers]);

  const handleUpdateParagraphContent = useCallback(
    (id: string, content: string) => {
      console.log('📝 [WRITING_STEP] 단락 내용 업데이트 요청:', {
        paragraphId: id,
        contentLength: content?.length || 0,
        contentPreview:
          content?.substring(0, 50) + (content?.length > 50 ? '...' : ''),
        updateFunctionType: typeof updateLocalParagraphContent,
        timestamp: new Date().toISOString(),
      });

      if (!id || typeof id !== 'string') {
        console.error('❌ [WRITING_STEP] 잘못된 단락 ID:', id);
        return;
      }

      if (typeof content !== 'string') {
        console.error('❌ [WRITING_STEP] 잘못된 내용 타입:', {
          content,
          type: typeof content,
        });
        return;
      }

      const existingParagraph = localParagraphs.find((p) => p.id === id);
      if (!existingParagraph) {
        console.warn('⚠️ [WRITING_STEP] 존재하지 않는 단락:', id);
        return;
      }

      if (existingParagraph.content === content) {
        console.log('ℹ️ [WRITING_STEP] 동일한 내용, 업데이트 스킵');
        return;
      }

      try {
        if (
          updateLocalParagraphContent &&
          typeof updateLocalParagraphContent === 'function'
        ) {
          updateLocalParagraphContent(id, content);

          console.log('✅ [WRITING_STEP] 단락 내용 업데이트 성공:', {
            paragraphId: id,
            contentLength: content?.length || 0,
          });

          if (internalState.activeParagraphId !== id) {
            console.log('🎯 [WRITING_STEP] 업데이트 후 단락 활성화:', id);
            setInternalState((prev) => ({
              ...prev,
              activeParagraphId: id,
            }));
          }
        } else {
          console.error(
            '❌ [WRITING_STEP] updateLocalParagraphContent가 함수가 아님:',
            {
              type: typeof updateLocalParagraphContent,
              value: updateLocalParagraphContent,
            }
          );
        }
      } catch (error) {
        console.error('❌ [WRITING_STEP] 단락 내용 업데이트 실패:', {
          paragraphId: id,
          error: error instanceof Error ? error.message : error,
        });
      }
    },
    [
      updateLocalParagraphContent,
      localParagraphs,
      internalState.activeParagraphId,
      setInternalState,
    ]
  );

  const handleToggleParagraphSelection = useCallback(
    (id: string) => {
      console.log('☑️ [WRITING_STEP] 단락 선택 토글:', {
        paragraphId: id,
        currentlySelected: internalState.selectedParagraphIds.includes(id),
        toggleFunctionType: typeof toggleParagraphSelection,
      });

      if (
        toggleParagraphSelection &&
        typeof toggleParagraphSelection === 'function'
      ) {
        try {
          toggleParagraphSelection(id);
          console.log('✅ [WRITING_STEP] 단락 선택 토글 성공');
        } catch (error) {
          console.error('❌ [WRITING_STEP] 단락 선택 토글 실패:', error);
        }
      } else {
        console.error(
          '❌ [WRITING_STEP] toggleParagraphSelection이 함수가 아님:',
          {
            type: typeof toggleParagraphSelection,
            value: toggleParagraphSelection,
          }
        );
      }
    },
    [internalState.selectedParagraphIds, toggleParagraphSelection]
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

  const containerManagerProps = useMemo(
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

  const previewPanelProps = useMemo(
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

  const totalParagraphCount = useMemo(() => {
    return localParagraphs.length;
  }, [localParagraphs.length]);

  const assignedParagraphCount = useMemo(() => {
    return localParagraphs.filter((p) => p.containerId !== null).length;
  }, [localParagraphs]);

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
        <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📝 단락 작성</h2>
            <div className="text-sm text-gray-500">
              미할당: {unassignedParagraphs.length}개 / 전체:{' '}
              {totalParagraphCount}개
            </div>
          </div>
          <ParagraphEditor {...paragraphEditorProps} />
        </div>

        <div
          className={`${isMobile ? 'w-full' : 'w-96'} ${
            !isMobile ? 'border-l border-gray-200' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📁 구조 관리</h3>
            <div className="text-sm text-gray-500">
              할당: {assignedParagraphCount}개 / {sortedContainers.length}개
              섹션
            </div>
          </div>
          <ContainerManager {...containerManagerProps} />
        </div>
      </div>

      <PreviewPanel {...previewPanelProps} />

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
