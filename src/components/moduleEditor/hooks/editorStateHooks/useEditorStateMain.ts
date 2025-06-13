import { useState, useEffect } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container } from '../../../../store/shared/commonTypes';

// store들을 직접 import하여 반응성 보장
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

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

// 함수 오버로드 - 타입 안정성을 위한 다중 시그니처 정의
export function useEditorState(): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(
  props: UseEditorStateProps
): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(props?: UseEditorStateProps) {
  return useEditorStateImpl(props);
}

// 메인 훅 구현 - 에디터 상태 관리의 핵심 로직
const useEditorStateImpl = (props?: UseEditorStateProps) => {
  // Store 액션들 - zustand store의 액션 함수들을 직접 호출하여 반응성 보장
  const editorCoreStoreActions = useEditorCoreStore();
  const editorUIStoreActions = useEditorUIStore();
  const toastStoreActions = useToastStore();

  // 구조분해할당으로 필요한 함수들 추출
  const { setContainers, setParagraphs, setCompletedContent, setIsCompleted } =
    editorCoreStoreActions;

  const {
    getCurrentSubStep,
    getIsTransitioning,
    getActiveParagraphId,
    getIsPreviewOpen,
    getSelectedParagraphIds,
    getTargetContainerId,
  } = editorUIStoreActions;

  const { addToast } = toastStoreActions;

  // Context 처리 - 외부에서 주입된 context가 있는지 확인
  const contextProvided = props?.context;
  const hasContext = Boolean(contextProvided);

  // 업데이트 함수들 - context 또는 store의 업데이트 함수 선택
  const updateContainersFunction =
    contextProvided?.updateEditorContainers ?? setContainers;
  const updateParagraphsFunction =
    contextProvided?.updateEditorParagraphs ?? setParagraphs;
  const updateCompletedContentFunction =
    contextProvided?.updateEditorCompletedContent ?? setCompletedContent;
  const setCompletedStatusFunction =
    contextProvided?.setEditorCompleted ?? setIsCompleted;
  const showToastFunction = contextProvided?.addToast ?? addToast;

  // 로컬 상태 초기화 - 컴포넌트 내부에서 사용할 상태들
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

  // 구조분해할당 - 내부 상태의 각 속성을 개별 변수로 추출 (액션 함수에서 직접 사용)
  const {
    selectedParagraphIds: selectedElementIds,
    targetContainerId: targetDestinationId,
  } = editorInternalState;

  // 디바이스 감지 - 모바일 환경 감지를 위한 커스텀 훅
  useDeviceDetection(setIsOnMobileDevice);

  // Store 동기화 - zustand store 상태와 로컬 상태 동기화
  useEffect(() => {
    if (!hasContext) {
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        currentSubStep: getCurrentSubStep(),
        isTransitioning: getIsTransitioning(),
        activeParagraphId: getActiveParagraphId(),
        isPreviewOpen: getIsPreviewOpen(),
        selectedParagraphIds: getSelectedParagraphIds(),
        targetContainerId: getTargetContainerId(),
      }));
    }
  }, [hasContext, editorUIStoreActions]);

  // 액션 함수들 생성 - 분할된 함수들을 조합하여 최종 액션 함수 생성
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

  // 반환 객체 - 훅 사용자가 필요한 모든 상태와 함수들을 제공
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
