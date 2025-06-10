import { useState, useEffect } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container } from '../../store/shared/commonTypes';

// ✨ [원본과 동일한 import 방식] store들을 직접 import하여 반응성 보장
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';
import { useToastStore } from '../../store/toast/toastStore';

// 타입 정의
import { UseEditorStateProps, LocalParagraph } from './editorStateTypes';

// 초기화 관련
import {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
} from './editorStateInitializers';

// 디바이스 감지
import { useDeviceDetection } from './editorStateDeviceDetection';

// 단락 관련 액션들
import {
  createNewParagraph,
  updateParagraphContent,
  removeParagraph,
  toggleParagraphSelect,
  changeParagraphOrder,
} from './editorStateParagraphActions';

// 컨테이너 관련 액션들
import { addParagraphsToContainer } from './editorStateContainerActions';

// 데이터 조회 관련
import {
  getUnassignedParagraphs,
  getParagraphsByContainer,
} from './editorStateQueries';

// 상태 관리 관련
import {
  updateSelectedParagraphs,
  updateTargetContainer,
  updateActiveParagraph,
} from './editorStateManagement';

// 워크플로우 관련
import {
  completeStructureSetup,
  navigateToStructureStep,
  setActiveEditor,
  switchPreviewMode,
} from './editorStateWorkflow';

// 저장/완료 관련
import { saveCurrentProgress, finishEditing } from './editorStatePersistence';

// ✨ [함수 오버로드] 원본과 동일한 오버로드 구조 유지
export function useEditorState(): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(
  props: UseEditorStateProps
): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(props?: UseEditorStateProps) {
  return useEditorStateImpl(props);
}

// ✨ [메인 훅 구현] 원본과 동일한 구조와 로직으로 작성
const useEditorStateImpl = (props?: UseEditorStateProps) => {
  console.log('🎛️ [HOOK] useEditorState 초기화');

  // ✨ [Store 액션들] 원본과 동일하게 직접 훅 호출 - 반응성 보장
  const editorCoreStoreActions = useEditorCoreStore();
  const editorUIStoreActions = useEditorUIStore();
  const toastStoreActions = useToastStore();

  // ✨ [Context 처리] 원본과 동일한 context 처리 로직
  const contextProvided = props?.context;
  const hasContext = Boolean(contextProvided);

  // ✨ [에디터 상태] 원본과 동일한 상태 설정 방식
  const currentEditorState = contextProvided?.editorState ?? {
    containers: editorCoreStoreActions.getContainers(),
    paragraphs: editorCoreStoreActions.getParagraphs(),
    completedContent: editorCoreStoreActions.getCompletedContent(),
    isCompleted: editorCoreStoreActions.getIsCompleted(),
  };

  // ✨ [업데이트 함수들] 원본과 동일한 함수 설정 방식
  const updateContainersFunction =
    contextProvided?.updateEditorContainers ??
    editorCoreStoreActions.setContainers;
  const updateParagraphsFunction =
    contextProvided?.updateEditorParagraphs ??
    editorCoreStoreActions.setParagraphs;
  const updateCompletedContentFunction =
    contextProvided?.updateEditorCompletedContent ??
    editorCoreStoreActions.setCompletedContent;
  const setCompletedStatusFunction =
    contextProvided?.setEditorCompleted ??
    editorCoreStoreActions.setIsCompleted;
  const showToastFunction =
    contextProvided?.addToast ?? toastStoreActions.addToast;

  console.log('🎛️ [HOOK] Context 상태 확인:', {
    containers: currentEditorState.containers.length,
    paragraphs: currentEditorState.paragraphs.length,
    isCompleted: currentEditorState.isCompleted,
  });

  // ✨ [로컬 상태 초기화] 원본과 동일한 초기화 방식
  const [editorInternalState, setEditorInternalState] =
    useState<EditorInternalState>(
      createInitialInternalState(hasContext, editorUIStoreActions)
    );

  const [currentParagraphs, setCurrentParagraphs] = useState<LocalParagraph[]>(
    createInitialParagraphs(hasContext, editorCoreStoreActions)
  );

  const [currentContainers, setCurrentContainers] = useState<Container[]>(
    createInitialContainers(hasContext, editorCoreStoreActions)
  );

  const [isOnMobileDevice, setIsOnMobileDevice] = useState(false);

  // ✨ [구조분해할당] 원본과 동일한 내부 상태 구조분해할당
  const {
    currentSubStep: currentEditorStep,
    isTransitioning: isStepTransitioning,
    activeParagraphId: activeElementId,
    isPreviewOpen: previewModeActive,
    selectedParagraphIds: selectedElementIds,
    targetContainerId: targetDestinationId,
  } = editorInternalState;

  console.log('🎛️ [HOOK] 로컬 상태 초기화 완료:', {
    currentSubStep: currentEditorStep,
    localParagraphs: currentParagraphs.length,
    localContainers: currentContainers.length,
    isMobile: isOnMobileDevice,
  });

  // ✨ [디바이스 감지] 원본과 동일한 effect
  useDeviceDetection(setIsOnMobileDevice);

  // ✨ [Store 동기화] 원본과 동일한 zustand store 동기화 effect
  useEffect(() => {
    if (!hasContext) {
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        currentSubStep: editorUIStoreActions.getCurrentSubStep(),
        isTransitioning: editorUIStoreActions.getIsTransitioning(),
        activeParagraphId: editorUIStoreActions.getActiveParagraphId(),
        isPreviewOpen: editorUIStoreActions.getIsPreviewOpen(),
        selectedParagraphIds: editorUIStoreActions.getSelectedParagraphIds(),
        targetContainerId: editorUIStoreActions.getTargetContainerId(),
      }));
    }
  }, [hasContext, editorUIStoreActions]);

  // ✨ [액션 함수들 생성] 분할된 함수들을 원본과 동일한 방식으로 조합
  const addLocalParagraph = createNewParagraph(
    currentParagraphs,
    setCurrentParagraphs,
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const updateLocalParagraphContent =
    updateParagraphContent(setCurrentParagraphs);

  const deleteLocalParagraph = removeParagraph(
    setCurrentParagraphs,
    showToastFunction
  );

  const toggleParagraphSelection = toggleParagraphSelect(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const addToLocalContainer = addParagraphsToContainer(
    selectedElementIds,
    targetDestinationId,
    currentParagraphs,
    currentContainers,
    setCurrentParagraphs,
    setEditorInternalState,
    showToastFunction,
    hasContext,
    editorUIStoreActions
  );

  const moveLocalParagraphInContainer = changeParagraphOrder(
    currentParagraphs,
    setCurrentParagraphs
  );

  const getLocalUnassignedParagraphs =
    getUnassignedParagraphs(currentParagraphs);

  const getLocalParagraphsByContainer =
    getParagraphsByContainer(currentParagraphs);

  const setSelectedParagraphIds = updateSelectedParagraphs(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const setTargetContainerId = updateTargetContainer(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const setActiveParagraphId = updateActiveParagraph(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const handleStructureComplete = completeStructureSetup(
    setEditorInternalState,
    setCurrentContainers,
    showToastFunction,
    hasContext,
    editorUIStoreActions
  );

  const goToStructureStep = navigateToStructureStep(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const activateEditor = setActiveEditor(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const togglePreview = switchPreviewMode(
    setEditorInternalState,
    hasContext,
    editorUIStoreActions
  );

  const saveAllToContext = saveCurrentProgress(
    currentContainers,
    currentParagraphs,
    updateContainersFunction,
    updateParagraphsFunction,
    showToastFunction
  );

  const completeEditor = finishEditing(
    currentContainers,
    currentParagraphs,
    saveAllToContext,
    updateCompletedContentFunction,
    setCompletedStatusFunction,
    showToastFunction
  );

  console.log('✅ [HOOK] useEditorState 훅 준비 완료:', {
    internalState: {
      currentSubStep: currentEditorStep,
      isTransitioning: isStepTransitioning,
      activeParagraphId: activeElementId,
      isPreviewOpen: previewModeActive,
      selectedCount: selectedElementIds.length,
      targetContainerId: targetDestinationId,
    },
    localData: {
      paragraphs: currentParagraphs.length,
      containers: currentContainers.length,
    },
    deviceInfo: {
      isMobile: isOnMobileDevice,
    },
  });

  // ✨ [반환 객체] 원본과 완전히 동일한 반환 객체 구조
  return {
    // 상태 데이터
    internalState: editorInternalState,
    localParagraphs: currentParagraphs,
    localContainers: currentContainers,
    isMobile: isOnMobileDevice,

    // 상태 업데이트 함수들
    setInternalState: setEditorInternalState,
    setLocalParagraphs: setCurrentParagraphs,
    setLocalContainers: setCurrentContainers,
    setSelectedParagraphIds,
    setTargetContainerId,
    setActiveParagraphId,

    // 단락 관리 함수들
    addLocalParagraph,
    deleteLocalParagraph,
    updateLocalParagraphContent,
    toggleParagraphSelection,
    addToLocalContainer,
    moveLocalParagraphInContainer,
    getLocalUnassignedParagraphs,
    getLocalParagraphsByContainer,

    // 에디터 액션 함수들
    handleStructureComplete,
    goToStructureStep,
    activateEditor,
    togglePreview,
    saveAllToContext,
    completeEditor,

    // 기타
    context: contextProvided,
  };
};
