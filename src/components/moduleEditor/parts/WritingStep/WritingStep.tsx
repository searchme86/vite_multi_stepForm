// 📁 src/components/moduleEditor/parts/WritingStep/WritingStep.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import StepControls from './controls/StepControls';
import ParagraphEditor from './paragraph/ParagraphEditor';
import { MarkdownCompleteButton } from '../../../../bridges/parts/MarkdownCompleteButton';
import { MarkdownStatusCard } from '../../../../bridges/parts/MarkdownStatusCard';
import { MarkdownResultToast } from '../../../../bridges/parts/MarkdownResultToast';
import { QuickStatusBar } from '../../../../bridges/parts/QuickStatusBar';

// 🆕 새로 추가된 import
import {
  ErrorStatusModal,
  useErrorStatusModal,
} from '../../../../bridges/parts/ErrorStatusModal';
import { useBridgeUI } from '../../../../bridges/hooks/useBridgeUI';

// 🆕 새로운 슬라이드 사이드바 시스템 import
import { EditorSidebarContainer } from './sidebar/EditorSidebarContainer';
import { StructureManagementSlide } from './sidebar/slides/StructureManagementSlide';
import { FinalPreviewSlide } from './sidebar/slides/FinalPreviewSlide';

// 🔒 타입 안전성을 위한 타입 import (수정된 경로)
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
  console.log('✍️ [WRITING_STEP] 컴포넌트 렌더링 (오류 모달 추가):', {
    localContainers: localContainers.length,
    localParagraphs: localParagraphs.length,
    currentSubStep: internalState.currentSubStep,
    updateLocalParagraphContentType: typeof updateLocalParagraphContent,
    renderMarkdownType: typeof renderMarkdown,
    activateEditorType: typeof activateEditor,
    timestamp: new Date().toISOString(),
  });

  const [isMobile, setIsMobile] = useState(false);

  // 🆕 브릿지 UI 훅 - 오류 상태 추출
  const { validationStatus: currentValidationStatus } = useBridgeUI();

  // 🆕 오류 상태 모달 훅
  const {
    isOpen: isErrorModalOpen,
    openModal: openErrorModal,
    closeModal: closeErrorModal,
  } = useErrorStatusModal();

  // 🆕 검증 상태에서 오류 정보 추출
  const { validationErrors, validationWarnings, isReadyForTransfer } =
    currentValidationStatus;

  // 🆕 오류 상태 계산
  const hasErrors = useMemo(() => {
    return validationErrors.length > 0 || !isReadyForTransfer;
  }, [validationErrors.length, isReadyForTransfer]);

  const errorCount = useMemo(() => {
    return validationErrors.length;
  }, [validationErrors.length]);

  const warningCount = useMemo(() => {
    return validationWarnings.length;
  }, [validationWarnings.length]);

  // 🆕 오류 상세 정보 표시 핸들러
  const handleShowErrorDetails = useCallback(() => {
    console.log('🚨 [WRITING_STEP] 오류 상세 정보 모달 열기 요청:', {
      hasErrors,
      errorCount,
      warningCount,
    });
    openErrorModal();
  }, [openErrorModal, hasErrors, errorCount, warningCount]);

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
      console.log('📝 [WRITING_STEP] 단락 내용 업데이트 요청 (단순화):', {
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

      try {
        updateLocalParagraphContent(id, content);

        console.log('✅ [WRITING_STEP] 단락 내용 업데이트 성공:', {
          paragraphId: id,
          contentLength: content?.length || 0,
        });
      } catch (error) {
        console.error('❌ [WRITING_STEP] 단락 내용 업데이트 실패:', {
          paragraphId: id,
          error: error instanceof Error ? error.message : error,
        });
      }
    },
    [updateLocalParagraphContent]
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

  // 📦 ParagraphEditor props 준비
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

  // 📦 ContainerManager props 준비 (슬라이드용) - 타입 안전성 확보
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

  // 📦 PreviewPanel props 준비 (슬라이드용) - 타입 안전성 확보
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

  // 🎠 준비된 슬라이드 컴포넌트들 생성 - 타입 안전한 props 전달
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

  // 📊 통계 계산
  const totalParagraphCount = useMemo(() => {
    return localParagraphs.length;
  }, [localParagraphs.length]);

  // 🆕 로깅: 오류 상태 변화 추적
  useEffect(() => {
    console.log('🚨 [WRITING_STEP] 오류 상태 변화 감지:', {
      hasErrors,
      errorCount,
      warningCount,
      isReadyForTransfer,
      validationErrors: validationErrors.slice(0, 3), // 처음 3개만 로깅
    });
  }, [
    hasErrors,
    errorCount,
    warningCount,
    isReadyForTransfer,
    validationErrors,
  ]);

  return (
    <div className="w-full h-full">
      {/* 🖥️ 데스크탑: 좌우 분할 레이아웃 */}
      <div className="hidden h-full md:flex md:flex-col">
        {/* 상단 상태바 */}
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
          className="border-b border-gray-200 backdrop-blur-sm"
        />

        {/* 🧹 브릿지 섹션 - 🆕 오류 상태 연동 */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <StepControls
            sortedContainers={sortedContainers}
            goToStructureStep={goToStructureStep}
            saveAllToContext={saveAllToContext}
            completeEditor={completeEditor}
            // 🆕 오류 상태 props 추가
            hasErrors={hasErrors}
            errorCount={errorCount}
            warningCount={warningCount}
            onShowErrorDetails={handleShowErrorDetails}
          />

          <div className="mt-4 space-y-4">
            {/* ✅ 간소화된 상태 카드 - 오류/경고 정보 완전 숨김 */}
            <MarkdownStatusCard
              size="compact"
              variant="bordered"
              hideValidationDetails={true} // ✅ 검증 세부사항 숨김
              hideErrorsWarnings={true} // ✅ 오류/경고 숨김 (모달로 이동)
              hideStatistics={false} // 기본 통계는 표시
              className="transition-all duration-200"
              onClick={() => {
                console.log(
                  '📊 [WRITING_STEP] 상태 카드 클릭 - 오류 모달로 리다이렉트'
                );
                // 🆕 상태 카드 클릭 시 오류 모달 열기
                handleShowErrorDetails();
              }}
            />

            <MarkdownCompleteButton
              buttonText="마크다운 완성하기"
              size="medium"
              variant="primary"
              fullWidth={false}
              onCompleteSuccess={completeEditor}
              showDetailedStatus={false} // ✅ 상세 상태 표시 간소화
              className="transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex ">
          <h2 className="text-xl font-bold text-gray-900">📝 단락 작성</h2>
          <p className="text-sm text-gray-500">
            📝 단락 작성 미할당: {unassignedParagraphs.length}개 / 전체:{' '}
            {totalParagraphCount}개
          </p>
        </div>
        <div className="flex w-[100%] items-center justify-between mb-4 border-gray-200 h-[800px] max-h-[800px] overflow-scroll">
          {/* 왼쪽: 에디터 영역 */}
          <ParagraphEditor {...paragraphEditorProps} />
          {/* 오른쪽: 슬라이드 사이드바 */}
          <EditorSidebarContainer className="h-full">
            {preparedStructureSlide}
            {preparedPreviewSlide}
          </EditorSidebarContainer>
        </div>
      </div>

      {/* 📱 모바일: 상하 분할 레이아웃 */}
      <div className="flex flex-col h-full md:hidden">
        {/* 상단: 슬라이드 사이드바 */}
        <div className="border-b border-gray-200 h-1/2">
          <EditorSidebarContainer className="h-full">
            {preparedStructureSlide}
            {preparedPreviewSlide}
          </EditorSidebarContainer>
        </div>

        {/* 하단: 에디터 영역 */}
        <div className="flex flex-col flex-1">
          {/* 🧹 브릿지 섹션 - 🆕 모바일에서도 오류 상태 연동 */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
            <StepControls
              sortedContainers={sortedContainers}
              goToStructureStep={goToStructureStep}
              saveAllToContext={saveAllToContext}
              completeEditor={completeEditor}
              // 🆕 오류 상태 props 추가
              hasErrors={hasErrors}
              errorCount={errorCount}
              warningCount={warningCount}
              onShowErrorDetails={handleShowErrorDetails}
            />

            <div className="mt-4 space-y-4">
              {/* ✅ 모바일에서도 간소화된 상태 카드 */}
              <MarkdownStatusCard
                size="compact"
                variant="bordered"
                hideValidationDetails={true} // ✅ 검증 세부사항 숨김
                hideErrorsWarnings={true} // ✅ 오류/경고 숨김 (모달로 이동)
                hideStatistics={false} // 기본 통계는 표시
                className="text-sm transition-all duration-200"
                onClick={() => {
                  console.log(
                    '📊 [WRITING_STEP] 모바일 상태 카드 클릭 - 오류 모달로 리다이렉트'
                  );
                  // 🆕 모바일에서도 상태 카드 클릭 시 오류 모달 열기
                  handleShowErrorDetails();
                }}
              />

              <MarkdownCompleteButton
                buttonText="마크다운 완성하기"
                size="medium"
                variant="primary"
                fullWidth={true}
                onCompleteSuccess={completeEditor}
                showDetailedStatus={false} // ✅ 상세 상태 표시 간소화
                className="py-3 text-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* 에디터 영역 */}
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

          {/* 하단 상태바 */}
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
        </div>
      </div>

      {/* 🍞 토스트 알림 */}
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

      {/* 🆕 오류 상태 모달 */}
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
          hideErrorsWarnings: false, // 🆕 모달에서는 모든 오류 정보 표시
        }}
        className="z-50"
      />

      {/* 🎨 스타일링 */}
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

            /* 🆕 스크롤바 숨김 (구조 표시용) */
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

/**
 * 🆕 오류 모달 시스템 추가 내역:
 *
 * 1. ✅ ErrorStatusModal 및 useErrorStatusModal 훅 추가
 *    - bridges/parts/ErrorStatusModal.tsx import
 *    - 모달 상태 관리 (열기/닫기)
 *    - 모달 크기: large, 상세 정보 표시
 *
 * 2. ✅ useBridgeUI 훅 통합
 *    - 브릿지 상태 실시간 추출
 *    - validationErrors, validationWarnings 사용
 *    - isReadyForTransfer 상태 확인
 *
 * 3. ✅ StepControls에 오류 상태 전달
 *    - hasErrors: 오류 존재 여부
 *    - errorCount: 오류 개수
 *    - warningCount: 경고 개수
 *    - onShowErrorDetails: 모달 열기 핸들러
 *
 * 4. ✅ MarkdownStatusCard 역할 변경
 *    - hideErrorsWarnings={true} 유지 (오류 정보 숨김)
 *    - 클릭 시 오류 모달로 리다이렉트
 *    - 기본 통계 정보만 표시
 *
 * 5. ✅ 반응형 디자인 지원
 *    - 데스크탑과 모바일 모두에서 동일한 기능
 *    - 모달 z-index: 50 (토스트와 중복 방지)
 *
 * 🎯 결과:
 * - "오류있음" 버튼이 StepControls에 표시됨 (저장 버튼 왼쪽)
 * - 클릭 시 MarkdownStatusCard 내용이 모달로 표시됨
 * - "완성" 버튼이 오류 시 disabled 상태가 됨
 * - 기존 MarkdownStatusCard는 간소화되어 기본 정보만 표시
 */
