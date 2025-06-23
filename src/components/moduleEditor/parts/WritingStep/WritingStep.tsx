// 📁 components/moduleEditor/parts/WritingStep/WritingStep.tsx

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

import { PreviewPanelProps } from '../../../swipeableSection/types/swipeableTypes.ts';
import type { Container } from '../../../../store/shared/commonTypes';

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

interface ExtendedContainerManagerProps {
  isMobile: boolean;
  sortedContainers: Container[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
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
  deleteLocalParagraph: (id: string) => void; // 미래 사용을 위해 보존
  updateLocalParagraphContent: (id: string, content: string) => void;
  toggleParagraphSelection: (id: string) => void;
  addToLocalContainer: () => void;
  moveLocalParagraphInContainer: (id: string, direction: 'up' | 'down') => void;
  activateEditor: (id: string) => void;
  togglePreview: () => void;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>; // 미래 사용을 위해 보존
  setTargetContainerId: (containerId: string) => void;
  getLocalUnassignedParagraphs: () => LocalParagraph[];
  getLocalParagraphsByContainer: (containerId: string) => LocalParagraph[];
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
}

// 🔧 안전한 기본 검증 상태 생성 함수
const createDefaultValidationStatus = () => ({
  containerCount: 0,
  paragraphCount: 0,
  assignedParagraphCount: 0,
  unassignedParagraphCount: 0,
  totalContentLength: 0,
  validationErrors: [],
  validationWarnings: [],
  isReadyForTransfer: false,
});

// 🔧 검증 상태 타입 가드 함수
const isValidValidationStatus = (status: unknown): boolean => {
  if (!status || typeof status !== 'object') {
    return false;
  }

  const requiredProperties = [
    'containerCount',
    'paragraphCount',
    'assignedParagraphCount',
    'unassignedParagraphCount',
    'totalContentLength',
    'validationErrors',
    'validationWarnings',
    'isReadyForTransfer',
  ];

  return requiredProperties.every((prop) => prop in status);
};

function WritingStep({
  localContainers,
  localParagraphs,
  internalState,
  renderMarkdown,
  goToStructureStep,
  saveAllToContext,
  completeEditor,
  addLocalParagraph,
  deleteLocalParagraph: _deleteLocalParagraph, // 언더스코어로 미사용 변수 표시
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  togglePreview,
  setInternalState: _setInternalState, // 언더스코어로 미사용 변수 표시
  setTargetContainerId,
  getLocalUnassignedParagraphs,
  getLocalParagraphsByContainer,
  moveToContainer,
}: WritingStepProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentEditingParagraphId, setCurrentEditingParagraphId] = useState<
    string | null
  >(null);

  // 🔧 올바른 속성명으로 브릿지 UI 훅 연결
  const { validationStatus: rawValidationStatus } = useBridgeUI();

  const {
    isOpen: isErrorModalOpen,
    openModal: openErrorModal,
    closeModal: closeErrorModal,
  } = useErrorStatusModal();

  // 🔧 안전한 검증 상태 처리 - fallback과 타입 가드 적용
  const currentValidationStatus = useMemo(() => {
    console.log('🔍 [WRITING_STEP] 검증 상태 안전성 확인:', {
      rawStatus: rawValidationStatus,
      isValid: isValidValidationStatus(rawValidationStatus),
    });

    if (!isValidValidationStatus(rawValidationStatus)) {
      console.warn('⚠️ [WRITING_STEP] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatus();
    }

    return rawValidationStatus;
  }, [rawValidationStatus]);

  // 🔧 브리지 상태에서 필요한 값만 추출 (사용되지 않는 변수 제거)
  const {
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
  } = currentValidationStatus || createDefaultValidationStatus();

  // 디버깅용 콘솔 로그 추가
  console.log(
    '🔍 [WRITING_STEP] currentValidationStatus:',
    currentValidationStatus
  );
  console.log('❌ [WRITING_STEP] validationErrors:', validationErrors);
  console.log('⚠️ [WRITING_STEP] validationWarnings:', validationWarnings);
  console.log('✅ [WRITING_STEP] isReadyForTransfer:', isReadyForTransfer);

  // 🔧 MarkdownCompleteButton용 에러 상태 계산 (메모이제이션으로 최적화)
  const hasErrorsForCompleteButton = useMemo(() => {
    const errorCount = Array.isArray(validationErrors)
      ? validationErrors.length
      : 0;
    const notReady = !isReadyForTransfer;
    console.log('📊 [WRITING_STEP] 완성 버튼용 에러 상태 계산:', {
      errorCount,
      notReady,
    });
    return errorCount > 0 || notReady;
  }, [validationErrors, isReadyForTransfer]);

  // 에러 상세 정보 표시 핸들러
  const handleShowErrorDetails = useCallback(() => {
    console.log('🔍 [WRITING_STEP] 에러 상세 정보 모달 열기');
    openErrorModal();
  }, [openErrorModal]);

  // 화면 크기 감지 효과
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        console.log('📱 [WRITING_STEP] 모바일 상태 변경:', mobile);
        setIsMobile(mobile);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);

  // 미할당 문단 통계 계산
  const unassignedParagraphsForStats = useMemo(() => {
    try {
      const unassigned = getLocalUnassignedParagraphs();
      const safeUnassigned = Array.isArray(unassigned) ? unassigned : [];
      console.log('📊 [WRITING_STEP] 미할당 문단 통계:', {
        count: safeUnassigned.length,
        totalParagraphs: localParagraphs.length,
      });
      return safeUnassigned;
    } catch (error) {
      console.error('❌ [WRITING_STEP] 미할당 문단 통계 계산 실패:', error);
      return [];
    }
  }, [getLocalUnassignedParagraphs, localParagraphs.length]);

  // 정렬된 컨테이너 목록 계산
  const sortedContainers = useMemo(() => {
    try {
      const safeContainers = Array.isArray(localContainers)
        ? localContainers
        : [];
      const sorted = [...safeContainers].sort(
        (firstContainer, secondContainer) =>
          (firstContainer?.order || 0) - (secondContainer?.order || 0)
      );
      console.log('📋 [WRITING_STEP] 컨테이너 정렬 완료:', sorted.length);
      return sorted;
    } catch (error) {
      console.error('❌ [WRITING_STEP] 컨테이너 정렬 실패:', error);
      return [];
    }
  }, [localContainers]);

  // 문단 내용 업데이트 핸들러 (타입 가드와 에러 처리 포함)
  const handleUpdateParagraphContent = useCallback(
    (paragraphId: string, content: string) => {
      if (!paragraphId || typeof paragraphId !== 'string') {
        console.error('❌ [WRITING_STEP] 유효하지 않은 문단 ID:', paragraphId);
        return;
      }

      if (typeof content !== 'string') {
        console.error(
          '❌ [WRITING_STEP] 유효하지 않은 콘텐츠 타입:',
          typeof content
        );
        return;
      }

      try {
        console.log('🔄 [WRITING_STEP] 문단 내용 업데이트:', {
          paragraphId,
          contentLength: content.length,
        });
        updateLocalParagraphContent(paragraphId, content);
      } catch (updateError) {
        console.error(
          '❌ [WRITING_STEP] 단락 내용 업데이트 실패:',
          updateError
        );
      }
    },
    [updateLocalParagraphContent]
  );

  // 문단 선택 토글 핸들러 (함수 존재 여부 체크 포함)
  const handleToggleParagraphSelection = useCallback(
    (paragraphId: string) => {
      if (
        toggleParagraphSelection &&
        typeof toggleParagraphSelection === 'function'
      ) {
        try {
          console.log('🔄 [WRITING_STEP] 문단 선택 토글:', paragraphId);
          toggleParagraphSelection(paragraphId);
        } catch (toggleError) {
          console.error('❌ [WRITING_STEP] 단락 선택 토글 실패:', toggleError);
        }
      } else {
        console.warn(
          '⚠️ [WRITING_STEP] toggleParagraphSelection 함수가 유효하지 않음'
        );
      }
    },
    [toggleParagraphSelection]
  );

  // 문단 편집 모드 활성화 핸들러
  const handleActivateEditModeForParagraph = useCallback(
    (paragraphId: string) => {
      console.log('✏️ [WRITING_STEP] 문단 편집 모드 활성화:', paragraphId);
      setCurrentEditingParagraphId(paragraphId);
      activateEditor(paragraphId);
    },
    [activateEditor]
  );

  // 편집 모드 비활성화 핸들러
  const handleDeactivateEditMode = useCallback(() => {
    console.log('🔒 [WRITING_STEP] 편집 모드 비활성화');
    setCurrentEditingParagraphId(null);
    activateEditor('');
  }, [activateEditor]);

  // 문단 에디터 props 메모이제이션
  const paragraphEditorProps = useMemo(
    () => ({
      isMobile,
      allVisibleParagraphs: localParagraphs,
      internalState,
      sortedContainers,
      addLocalParagraph,
      updateLocalParagraphContent: handleUpdateParagraphContent,
      toggleParagraphSelection: handleToggleParagraphSelection,
      addToLocalContainer,
      setTargetContainerId,
      currentEditingParagraphId,
      onActivateEditMode: handleActivateEditModeForParagraph,
      onDeactivateEditMode: handleDeactivateEditMode,
    }),
    [
      isMobile,
      localParagraphs,
      internalState,
      sortedContainers,
      addLocalParagraph,
      handleUpdateParagraphContent,
      handleToggleParagraphSelection,
      addToLocalContainer,
      setTargetContainerId,
      currentEditingParagraphId,
      handleActivateEditModeForParagraph,
      handleDeactivateEditMode,
    ]
  );

  // 컨테이너 매니저 props 메모이제이션
  const containerManagerProps: ExtendedContainerManagerProps = useMemo(
    () => ({
      isMobile,
      sortedContainers,
      getLocalParagraphsByContainer,
      moveLocalParagraphInContainer,
      activateEditor: handleActivateEditModeForParagraph,
      moveToContainer,
    }),
    [
      isMobile,
      sortedContainers,
      getLocalParagraphsByContainer,
      moveLocalParagraphInContainer,
      handleActivateEditModeForParagraph,
      moveToContainer,
    ]
  );

  // 미리보기 패널 props 메모이제이션
  const previewPanelProps: PreviewPanelProps = useMemo(
    () => ({
      internalState,
      sortedContainers,
      getLocalParagraphsByContainer,
      renderMarkdown,
      activateEditor: handleActivateEditModeForParagraph,
      togglePreview,
    }),
    [
      internalState,
      sortedContainers,
      getLocalParagraphsByContainer,
      renderMarkdown,
      handleActivateEditModeForParagraph,
      togglePreview,
    ]
  );

  // 구조 관리 슬라이드 메모이제이션
  const preparedStructureSlide = useMemo(
    () => (
      <StructureManagementSlide containerManagerProps={containerManagerProps} />
    ),
    [containerManagerProps]
  );

  // 미리보기 슬라이드 메모이제이션
  const preparedPreviewSlide = useMemo(
    () => <FinalPreviewSlide previewPanelProps={previewPanelProps} />,
    [previewPanelProps]
  );

  // 전체 문단 개수 계산
  const totalParagraphCount = useMemo(() => {
    const count = Array.isArray(localParagraphs) ? localParagraphs.length : 0;
    console.log('📊 [WRITING_STEP] 전체 문단 개수:', count);
    return count;
  }, [localParagraphs]);

  return (
    <div className="w-full h-full">
      {/* 데스크톱 레이아웃 */}
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

        {/* 🔧 StepControls props 수정 - 브리지 관련 props 제거 */}
        <StepControls
          sortedContainers={sortedContainers}
          goToStructureStep={goToStructureStep}
          saveAllToContext={saveAllToContext}
          completeEditor={completeEditor}
        />
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

      {/* 모바일 레이아웃 */}
      <div className="flex flex-col h-full md:hidden">
        <div className="border-b border-gray-200 h-1/2">
          <EditorSidebarContainer className="h-full">
            {preparedStructureSlide}
            {preparedPreviewSlide}
          </EditorSidebarContainer>
        </div>

        <div className="flex flex-col flex-1">
          {/* 🔧 StepControls props 수정 - 브리지 관련 props 제거 */}
          <StepControls
            sortedContainers={sortedContainers}
            goToStructureStep={goToStructureStep}
            saveAllToContext={saveAllToContext}
            completeEditor={completeEditor}
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

            {/* 🔧 MarkdownCompleteButton에 브리지 상태 기반 비활성화 적용 */}
            <MarkdownCompleteButton
              buttonText="마크다운 완성하기"
              size="medium"
              variant="primary"
              fullWidth={true}
              onCompleteSuccess={completeEditor}
              showDetailedStatus={false}
              forceDisabled={hasErrorsForCompleteButton}
              className="py-3 text-sm transition-all duration-200"
            />
          </div>

          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">📝 단락 작성</h2>
              <div className="text-xs text-gray-500">
                미할당: {unassignedParagraphsForStats.length}개 / 전체:{' '}
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

      {/* 토스트 및 모달 */}
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

      {/* Tiptap 에디터 스타일 */}
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
