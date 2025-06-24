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
import { useBridgeUIComponents } from '../../../../bridges/hooks/useBridgeUIComponents';

import { EditorSidebarContainer } from './sidebar/EditorSidebarContainer';
import { StructureManagementSlide } from './sidebar/slides/StructureManagementSlide';
import { FinalPreviewSlide } from './sidebar/slides/FinalPreviewSlide';

import { PreviewPanelProps } from '../../../swipeableSection/types/swipeableTypes.ts';
import type { Container } from '../../../../store/shared/commonTypes';

// 🔧 BridgeSystemConfiguration import 추가
import { BridgeSystemConfiguration } from '../../../../bridges/editorMultiStepBridge/bridgeDataTypes';
import { editorStyles } from './editorStyle.ts';

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
  moveToContainer: (paragraphId: string, targetContainerId: string) => void;
}

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
  deleteLocalParagraph: _deleteLocalParagraph,
  updateLocalParagraphContent,
  toggleParagraphSelection,
  addToLocalContainer,
  moveLocalParagraphInContainer,
  activateEditor,
  togglePreview,
  setInternalState: _setInternalState,
  setTargetContainerId,
  getLocalUnassignedParagraphs,
  getLocalParagraphsByContainer,
  moveToContainer,
}: WritingStepProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentEditingParagraphId, setCurrentEditingParagraphId] = useState<
    string | null
  >(null);

  // 🔧 핵심 수정: BridgeSystemConfiguration 생성
  const bridgeConfiguration: BridgeSystemConfiguration = useMemo(() => {
    console.log('🔧 [WRITING_STEP] Bridge 설정 생성');

    const config: BridgeSystemConfiguration = {
      enableValidation: true, // 검증 활성화
      enableErrorRecovery: true, // 에러 복구 활성화
      debugMode: true, // 🔍 디버그 모드 활성화 (문제 해결용)
    };

    console.log('📊 [WRITING_STEP] 생성된 Bridge 설정:', config);
    return config;
  }, []);

  // 🔧 핵심 수정: bridgeConfiguration을 전달하여 useBridgeUIComponents 호출
  const { validationStatus: rawValidationStatus } =
    useBridgeUIComponents(bridgeConfiguration);

  const {
    isOpen: isErrorModalOpen,
    openModal: openErrorModal,
    closeModal: closeErrorModal,
  } = useErrorStatusModal();

  const currentValidationStatus = useMemo(() => {
    console.log('🔍 [WRITING_STEP] 검증 상태 안전성 확인:', {
      rawStatus: rawValidationStatus,
      isValid: isValidValidationStatus(rawValidationStatus),
      bridgeConfigProvided: !!bridgeConfiguration,
    });

    if (!isValidValidationStatus(rawValidationStatus)) {
      console.warn('⚠️ [WRITING_STEP] 유효하지 않은 검증 상태, 기본값 사용');
      return createDefaultValidationStatus();
    }

    return rawValidationStatus;
  }, [rawValidationStatus, bridgeConfiguration]);

  const {
    validationErrors = [],
    validationWarnings = [],
    isReadyForTransfer = false,
  } = currentValidationStatus || createDefaultValidationStatus();

  console.log(
    '🔍 [WRITING_STEP] currentValidationStatus:',
    currentValidationStatus
  );
  console.log('❌ [WRITING_STEP] validationErrors:', validationErrors);
  console.log('⚠️ [WRITING_STEP] validationWarnings:', validationWarnings);
  console.log('✅ [WRITING_STEP] isReadyForTransfer:', isReadyForTransfer);

  const hasErrorsForCompleteButton = useMemo(() => {
    const errorCount = Array.isArray(validationErrors)
      ? validationErrors.length
      : 0;
    const notReady = !isReadyForTransfer;
    console.log('📊 [WRITING_STEP] 완성 버튼용 에러 상태 계산:', {
      errorCount,
      notReady,
      bridgeConfig: !!bridgeConfiguration,
    });
    return errorCount > 0 || notReady;
  }, [validationErrors, isReadyForTransfer, bridgeConfiguration]);

  const handleShowErrorDetails = useCallback(() => {
    console.log('🔍 [WRITING_STEP] 에러 상세 정보 모달 열기');
    openErrorModal();
  }, [openErrorModal]);

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

  // 🔧 브리지 연결 상태 확인용 Effect 추가
  useEffect(() => {
    console.log('🔄 [WRITING_STEP] Bridge 연결 상태 모니터링:', {
      localContainersCount: localContainers?.length || 0,
      localParagraphsCount: localParagraphs?.length || 0,
      bridgeConfigurationExists: !!bridgeConfiguration,
      currentValidationStatus,
      isReadyForTransfer,
    });
  }, [
    localContainers,
    localParagraphs,
    bridgeConfiguration,
    currentValidationStatus,
    isReadyForTransfer,
  ]);

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

  const handleActivateEditModeForParagraph = useCallback(
    (paragraphId: string) => {
      console.log('✏️ [WRITING_STEP] 문단 편집 모드 활성화:', paragraphId);
      setCurrentEditingParagraphId(paragraphId);
      activateEditor(paragraphId);
    },
    [activateEditor]
  );

  const handleDeactivateEditMode = useCallback(() => {
    console.log('🔒 [WRITING_STEP] 편집 모드 비활성화');
    setCurrentEditingParagraphId(null);
    activateEditor('');
  }, [activateEditor]);

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
    const count = Array.isArray(localParagraphs) ? localParagraphs.length : 0;
    console.log('📊 [WRITING_STEP] 전체 문단 개수:', count);
    return count;
  }, [localParagraphs]);

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

        {/* 🔧 핵심 수정: bridgeConfig prop 추가 */}
        <StepControls
          sortedContainers={sortedContainers}
          goToStructureStep={goToStructureStep}
          saveAllToContext={saveAllToContext}
          completeEditor={completeEditor}
          bridgeConfig={bridgeConfiguration}
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

      <div className="flex flex-col h-full md:hidden">
        <div className="border-b border-gray-200 h-1/2">
          <EditorSidebarContainer className="h-full">
            {preparedStructureSlide}
            {preparedPreviewSlide}
          </EditorSidebarContainer>
        </div>

        <div className="flex flex-col flex-1">
          {/* 🔧 핵심 수정: 모바일에서도 bridgeConfig prop 추가 */}
          <StepControls
            sortedContainers={sortedContainers}
            goToStructureStep={goToStructureStep}
            saveAllToContext={saveAllToContext}
            completeEditor={completeEditor}
            bridgeConfig={bridgeConfiguration}
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
          __html: editorStyles,
        }}
      />
    </div>
  );
}

export default WritingStep;
