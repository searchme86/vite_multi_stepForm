import { useState, useEffect, useCallback } from 'react';
import { EditorInternalState } from '../types/editor';

// ✨ [STATIC IMPORT] zustand store에서 타입과 함수들을 가져오는 방식
import {
  Container,
  ParagraphBlock,
  ToastOptions,
} from '../../../store/shared/commonTypes';
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../store/toast/toastStore';

// MultiStepFormContextType는 context 전용 타입이므로 optional로 처리
interface MultiStepFormContextType {
  editorState: {
    containers: Container[];
    paragraphs: ParagraphBlock[];
    completedContent: string;
    isCompleted: boolean;
  };
  updateEditorContainers: (containers: Container[]) => void;
  updateEditorParagraphs: (paragraphs: ParagraphBlock[]) => void;
  updateEditorCompletedContent: (content: string) => void;
  setEditorCompleted: (completed: boolean) => void;
  addToast: (options: ToastOptions) => void;
}

interface UseEditorStateProps {
  context?: MultiStepFormContextType;
}

type LocalParagraph = ParagraphBlock;

// ✨ [헬퍼 함수] 컨테이너 생성 함수
const createContainer = (name: string, order: number): Container => {
  return {
    id: `container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(),
    order,
    createdAt: new Date(),
  };
};

// ✨ [헬퍼 함수] 완성된 콘텐츠 생성 함수
const generateCompletedContent = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string => {
  const sortedContainers = [...containers].sort(
    (firstContainer, secondContainer) =>
      firstContainer.order - secondContainer.order
  ); // ✨ [매개변수명 개선] a,b → firstContainer,secondContainer

  const sections = sortedContainers.map((currentContainer) => {
    // ✨ [매개변수명 개선] container → currentContainer
    const containerParagraphs = paragraphs
      .filter(
        (currentParagraph) =>
          currentParagraph.containerId === currentContainer.id
      ) // ✨ [매개변수명 개선] p → currentParagraph
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order
      ); // ✨ [매개변수명 개선] a,b → firstParagraph,secondParagraph

    if (containerParagraphs.length === 0) {
      return '';
    }

    return containerParagraphs
      .map((currentParagraph) => currentParagraph.content)
      .join('\n\n'); // ✨ [매개변수명 개선] p → currentParagraph
  });

  return sections.filter((section) => section.trim().length > 0).join('\n\n');
};

// ✨ [공통 로직 함수] zustand store 업데이트 헬퍼
const updateZustandStoreIfNeeded = (
  hasContext: boolean,
  editorUIStoreActions: ReturnType<typeof useEditorUIStore>,
  updateAction: () => void
) => {
  // 1. context가 없을 때만 zustand store를 업데이트 2. 중복 업데이트를 방지하기 위해
  if (!hasContext) {
    updateAction();
  }
};

// ✨ [함수 오버로드] 매개변수 없이도 호출 가능하도록 함
export function useEditorState(): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(
  props: UseEditorStateProps
): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(props?: UseEditorStateProps) {
  return useEditorStateImpl(props);
}

// 실제 구현 함수
const useEditorStateImpl = (props?: UseEditorStateProps) => {
  console.log('🎛️ [HOOK] useEditorState 초기화');

  // ✨ [가독성 개선] zustand store 액션들을 미리 추출
  const editorCoreStoreActions = useEditorCoreStore(); // ✨ [변수명 개선] editorCoreStore → editorCoreStoreActions
  const editorUIStoreActions = useEditorUIStore(); // ✨ [변수명 개선] editorUIStore → editorUIStoreActions
  const toastStoreActions = useToastStore(); // ✨ [변수명 개선] toastStore → toastStoreActions

  // ✨ [가독성 개선] context 존재 여부를 명시적 변수로 분리
  const contextProvided = props?.context; // ✨ [변수명 개선] context → contextProvided
  const hasContext = Boolean(contextProvided); // ✨ [가독성 개선] context 존재 여부를 명확한 boolean으로 표현

  // ✨ [가독성 개선] 에디터 상태와 함수들을 구조 분해 할당으로 추출
  const currentEditorState = contextProvided?.editorState ?? {
    containers: editorCoreStoreActions.getContainers(),
    paragraphs: editorCoreStoreActions.getParagraphs(),
    completedContent: editorCoreStoreActions.getCompletedContent(),
    isCompleted: editorCoreStoreActions.getIsCompleted(),
  };

  // ✨ [가독성 개선] 업데이트 함수들을 의미있는 이름으로 추출
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

  // ✨ [가독성 개선] 초기 상태 생성 함수들을 분리
  const createInitialInternalState = (): EditorInternalState => {
    if (!hasContext) {
      // 1. context가 없으면 zustand store에서 초기값 가져오기 2. 상태 일관성을 유지하기 위해
      return {
        currentSubStep: editorUIStoreActions.getCurrentSubStep(),
        isTransitioning: editorUIStoreActions.getIsTransitioning(),
        activeParagraphId: editorUIStoreActions.getActiveParagraphId(),
        isPreviewOpen: editorUIStoreActions.getIsPreviewOpen(),
        selectedParagraphIds: editorUIStoreActions.getSelectedParagraphIds(),
        targetContainerId: editorUIStoreActions.getTargetContainerId(),
      };
    }
    // 1. context가 있으면 기본 초기값 사용 2. 기존 동작 방식 유지를 위해
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  };

  const createInitialParagraphs = (): LocalParagraph[] => {
    // 1. context 유무에 따라 초기값 결정 2. 데이터 일관성을 위해
    return hasContext ? [] : editorCoreStoreActions.getParagraphs();
  };

  const createInitialContainers = (): Container[] => {
    // 1. context 유무에 따라 초기값 결정 2. 데이터 일관성을 위해
    return hasContext ? [] : editorCoreStoreActions.getContainers();
  };

  // ✨ [가독성 개선] 상태 선언을 더 명확하게
  const [editorInternalState, setEditorInternalState] =
    useState<EditorInternalState>(createInitialInternalState); // ✨ [변수명 개선] internalState → editorInternalState
  const [currentParagraphs, setCurrentParagraphs] = useState<LocalParagraph[]>(
    createInitialParagraphs
  ); // ✨ [변수명 개선] localParagraphs → currentParagraphs
  const [currentContainers, setCurrentContainers] = useState<Container[]>(
    createInitialContainers
  ); // ✨ [변수명 개선] localContainers → currentContainers
  const [isOnMobileDevice, setIsOnMobileDevice] = useState(false); // ✨ [변수명 개선] isMobile → isOnMobileDevice

  // ✨ [가독성 개선] 내부 상태에서 자주 사용되는 속성들을 구조 분해 할당으로 추출
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

  // 모바일 기기 감지 effect
  useEffect(() => {
    console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 설정');

    const checkMobileDevice = () => {
      // ✨ [함수명 개선] checkMobile → checkMobileDevice
      const isMobileScreen = window.innerWidth < 768; // ✨ [변수명 개선] mobile → isMobileScreen
      console.log('📱 [MOBILE] 화면 크기 체크:', {
        width: window.innerWidth,
        isMobile: isMobileScreen,
      });
      setIsOnMobileDevice(isMobileScreen);
    };

    checkMobileDevice();
    window.addEventListener('resize', checkMobileDevice);

    return () => {
      console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 제거');
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []);

  // zustand store와 로컬 상태 동기화
  useEffect(() => {
    if (!hasContext) {
      // 1. zustand store의 현재 상태를 로컬 상태에 반영 2. 상태 일관성 유지를 위해
      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        currentSubStep: editorUIStoreActions.getCurrentSubStep(),
        isTransitioning: editorUIStoreActions.getIsTransitioning(),
        activeParagraphId: editorUIStoreActions.getActiveParagraphId(),
        isPreviewOpen: editorUIStoreActions.getIsPreviewOpen(),
        selectedParagraphIds: editorUIStoreActions.getSelectedParagraphIds(),
        targetContainerId: editorUIStoreActions.getTargetContainerId(),
      }));
    }
  }, [hasContext, editorUIStoreActions]);

  // ✨ [액션 함수들] 의미있는 함수명으로 개선
  const createNewParagraph = useCallback(() => {
    // ✨ [함수명 개선] addLocalParagraph → createNewParagraph
    console.log('📄 [LOCAL] 새 단락 추가');
    const newParagraphToAdd: LocalParagraph = {
      // ✨ [변수명 개선] newParagraph → newParagraphToAdd
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      containerId: null,
      order: currentParagraphs.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentParagraphs((previousParagraphs) => [
      ...previousParagraphs,
      newParagraphToAdd,
    ]); // ✨ [매개변수명 개선] prev → previousParagraphs
    setEditorInternalState((previousState) => ({
      // ✨ [매개변수명 개선] prev → previousState
      ...previousState,
      activeParagraphId: newParagraphToAdd.id,
    }));

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.setActiveParagraphId(newParagraphToAdd.id);
    });

    console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraphToAdd.id);
  }, [currentParagraphs.length, hasContext, editorUIStoreActions]);

  const updateParagraphContent = useCallback(
    // ✨ [함수명 개선] updateLocalParagraphContent → updateParagraphContent
    (targetParagraphId: string, newContent: string) => {
      // ✨ [매개변수명 개선] paragraphId → targetParagraphId, content → newContent
      console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
        paragraphId: targetParagraphId,
        contentLength: (newContent || '').length,
      });

      setCurrentParagraphs((previousParagraphs) =>
        previousParagraphs.map(
          (
            currentParagraph // ✨ [매개변수명 개선] p → currentParagraph
          ) =>
            currentParagraph.id === targetParagraphId
              ? {
                  ...currentParagraph,
                  content: newContent || '',
                  updatedAt: new Date(),
                }
              : currentParagraph
        )
      );
    },
    []
  );

  const removeParagraph = useCallback(
    // ✨ [함수명 개선] deleteLocalParagraph → removeParagraph
    (targetParagraphId: string) => {
      // ✨ [매개변수명 개선] paragraphId → targetParagraphId
      console.log('🗑️ [LOCAL] 로컬 단락 삭제:', targetParagraphId);
      setCurrentParagraphs((previousParagraphs) =>
        previousParagraphs.filter(
          (currentParagraph) => currentParagraph.id !== targetParagraphId
        )
      ); // ✨ [매개변수명 개선] prev → previousParagraphs, p → currentParagraph

      showToastFunction({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    },
    [showToastFunction]
  );

  const toggleParagraphSelect = useCallback(
    // ✨ [함수명 개선] toggleParagraphSelection → toggleParagraphSelect
    (targetParagraphId: string) => {
      // ✨ [매개변수명 개선] paragraphId → targetParagraphId
      console.log('☑️ [LOCAL] 단락 선택 토글:', targetParagraphId);
      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        selectedParagraphIds: previousState.selectedParagraphIds.includes(
          targetParagraphId
        )
          ? previousState.selectedParagraphIds.filter(
              (currentId) => currentId !== targetParagraphId
            ) // ✨ [매개변수명 개선] id → currentId
          : [...previousState.selectedParagraphIds, targetParagraphId],
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.toggleParagraphSelection(targetParagraphId);
      });
    },
    [hasContext, editorUIStoreActions]
  );

  const addParagraphsToContainer = useCallback(() => {
    // ✨ [함수명 개선] addToLocalContainer → addParagraphsToContainer
    console.log('📦 [LOCAL] 컨테이너에 단락 추가 시작');

    if (selectedElementIds.length === 0) {
      showToastFunction({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!targetDestinationId) {
      showToastFunction({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const existingParagraphsInTarget = currentParagraphs.filter(
      // ✨ [변수명 개선] existingParagraphs → existingParagraphsInTarget
      (currentParagraph) => currentParagraph.containerId === targetDestinationId // ✨ [매개변수명 개선] p → currentParagraph
    );

    const lastOrderInContainer = // ✨ [변수명 개선] lastOrder → lastOrderInContainer
      existingParagraphsInTarget.length > 0
        ? Math.max(
            ...existingParagraphsInTarget.map(
              (currentParagraph) => currentParagraph.order
            )
          ) // ✨ [매개변수명 개선] p → currentParagraph
        : -1;

    const selectedParagraphsToAdd = currentParagraphs.filter(
      (
        currentParagraph // ✨ [변수명 개선] selectedParagraphs → selectedParagraphsToAdd, p → currentParagraph
      ) => selectedElementIds.includes(currentParagraph.id)
    );

    const newParagraphsToAdd = selectedParagraphsToAdd.map(
      (currentParagraph, currentIndex) => ({
        // ✨ [변수명 개선] newParagraphs → newParagraphsToAdd, paragraph → currentParagraph, index → currentIndex
        ...currentParagraph,
        id: `paragraph-copy-${Date.now()}-${currentIndex}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        originalId: currentParagraph.id,
        containerId: targetDestinationId,
        order: lastOrderInContainer + currentIndex + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    setCurrentParagraphs((previousParagraphs) => [
      ...previousParagraphs,
      ...newParagraphsToAdd,
    ]); // ✨ [매개변수명 개선] prev → previousParagraphs

    setEditorInternalState((previousState) => ({
      // ✨ [매개변수명 개선] prev → previousState
      ...previousState,
      selectedParagraphIds: [],
      targetContainerId: '',
    }));

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.clearSelectedParagraphs();
    });

    const targetContainerInfo = currentContainers.find(
      // ✨ [변수명 개선] targetContainer → targetContainerInfo
      (currentContainer) => currentContainer.id === targetDestinationId // ✨ [매개변수명 개선] c → currentContainer
    );

    showToastFunction({
      title: '단락 추가 완료',
      description: `${selectedParagraphsToAdd.length}개의 단락이 ${
        targetContainerInfo?.name || '컨테이너'
      }에 추가되었습니다.`,
      color: 'success',
    });
  }, [
    selectedElementIds,
    targetDestinationId,
    currentParagraphs,
    currentContainers,
    showToastFunction,
    hasContext,
    editorUIStoreActions,
  ]);

  const changeParagraphOrder = useCallback(
    // ✨ [함수명 개선] moveLocalParagraphInContainer → changeParagraphOrder
    (targetParagraphId: string, moveDirection: 'up' | 'down') => {
      // ✨ [매개변수명 개선] paragraphId → targetParagraphId, direction → moveDirection
      console.log('↕️ [LOCAL] 단락 순서 변경:', {
        paragraphId: targetParagraphId,
        direction: moveDirection,
      });

      const targetParagraphToMove = currentParagraphs.find(
        (currentParagraph) => currentParagraph.id === targetParagraphId
      ); // ✨ [변수명 개선] paragraph → targetParagraphToMove, p → currentParagraph
      if (!targetParagraphToMove || !targetParagraphToMove.containerId) return;

      const paragraphsInSameContainer = currentParagraphs // ✨ [변수명 개선] containerParagraphs → paragraphsInSameContainer
        .filter(
          (currentParagraph) =>
            currentParagraph.containerId === targetParagraphToMove.containerId
        ) // ✨ [매개변수명 개선] p → currentParagraph
        .sort(
          (firstParagraph, secondParagraph) =>
            firstParagraph.order - secondParagraph.order
        ); // ✨ [매개변수명 개선] a,b → firstParagraph,secondParagraph

      const currentPositionIndex = paragraphsInSameContainer.findIndex(
        // ✨ [변수명 개선] currentIndex → currentPositionIndex
        (currentParagraph) => currentParagraph.id === targetParagraphId // ✨ [매개변수명 개선] p → currentParagraph
      );

      if (
        (moveDirection === 'up' && currentPositionIndex === 0) ||
        (moveDirection === 'down' &&
          currentPositionIndex === paragraphsInSameContainer.length - 1)
      ) {
        return;
      }

      const targetPositionIndex = // ✨ [변수명 개선] targetIndex → targetPositionIndex
        moveDirection === 'up'
          ? currentPositionIndex - 1
          : currentPositionIndex + 1;
      const swapTargetParagraph =
        paragraphsInSameContainer[targetPositionIndex]; // ✨ [변수명 개선] targetParagraph → swapTargetParagraph

      setCurrentParagraphs(
        (
          previousParagraphs // ✨ [매개변수명 개선] prev → previousParagraphs
        ) =>
          previousParagraphs.map((currentParagraph) => {
            // ✨ [매개변수명 개선] p → currentParagraph
            if (currentParagraph.id === targetParagraphId) {
              return { ...currentParagraph, order: swapTargetParagraph.order };
            }
            if (currentParagraph.id === swapTargetParagraph.id) {
              return {
                ...currentParagraph,
                order: targetParagraphToMove.order,
              };
            }
            return currentParagraph;
          })
      );
    },
    [currentParagraphs]
  );

  const getUnassignedParagraphs = useCallback(() => {
    // ✨ [함수명 개선] getLocalUnassignedParagraphs → getUnassignedParagraphs
    const unassignedParagraphs = currentParagraphs.filter(
      (currentParagraph) => !currentParagraph.containerId
    ); // ✨ [변수명 개선] unassigned → unassignedParagraphs, p → currentParagraph
    console.log('📋 [LOCAL] 미할당 단락 조회:', unassignedParagraphs.length);
    return unassignedParagraphs;
  }, [currentParagraphs]);

  const getParagraphsByContainer = useCallback(
    // ✨ [함수명 개선] getLocalParagraphsByContainer → getParagraphsByContainer
    (targetContainerId: string) => {
      // ✨ [매개변수명 개선] containerId → targetContainerId
      const paragraphsInContainer = currentParagraphs // ✨ [변수명 개선] containerParagraphs → paragraphsInContainer
        .filter(
          (currentParagraph) =>
            currentParagraph.containerId === targetContainerId
        ) // ✨ [매개변수명 개선] p → currentParagraph
        .sort(
          (firstParagraph, secondParagraph) =>
            firstParagraph.order - secondParagraph.order
        ); // ✨ [매개변수명 개선] a,b → firstParagraph,secondParagraph
      console.log('📋 [LOCAL] 컨테이너별 단락 조회:', {
        containerId: targetContainerId,
        count: paragraphsInContainer.length,
      });
      return paragraphsInContainer;
    },
    [currentParagraphs]
  );

  // ✨ [가독성 개선] 에디터 액션 함수들을 더 간결한 이름으로
  const completeStructureSetup = useCallback(
    // ✨ [함수명 개선] handleStructureCompleteWrapper → completeStructureSetup
    (validSectionInputs: string[]) => {
      // ✨ [매개변수명 개선] validInputs → validSectionInputs
      console.log('🎛️ [HOOK] completeStructureSetup 호출:', validSectionInputs);

      if (validSectionInputs.length < 2) {
        showToastFunction({
          title: '구조 설정 오류',
          description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
          color: 'warning',
        });
        return;
      }

      setEditorInternalState((previousState) => ({
        ...previousState,
        isTransitioning: true,
      })); // ✨ [매개변수명 개선] prev → previousState

      const createdContainers = validSectionInputs.map(
        (
          sectionName,
          containerIndex // ✨ [변수명 개선] containers → createdContainers, name → sectionName, index → containerIndex
        ) => createContainer(sectionName, containerIndex)
      );
      setCurrentContainers(createdContainers);
      console.log('📦 [ACTION] 로컬 컨테이너 생성:', createdContainers);

      setTimeout(() => {
        setEditorInternalState((previousState) => ({
          // ✨ [매개변수명 개선] prev → previousState
          ...previousState,
          currentSubStep: 'writing',
          isTransitioning: false,
        }));
      }, 300);

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.goToWritingStep();
      });

      showToastFunction({
        title: '구조 설정 완료',
        description: `${validSectionInputs.length}개의 섹션이 생성되었습니다.`,
        color: 'success',
      });
    },
    [showToastFunction, hasContext, editorUIStoreActions]
  );

  const navigateToStructureStep = useCallback(() => {
    // ✨ [함수명 개선] goToStructureStepWrapper → navigateToStructureStep
    console.log('🎛️ [HOOK] navigateToStructureStep 호출');

    setEditorInternalState((previousState) => ({
      // ✨ [매개변수명 개선] prev → previousState
      ...previousState,
      isTransitioning: true,
    }));

    setTimeout(() => {
      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        currentSubStep: 'structure',
        isTransitioning: false,
      }));
    }, 300);

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.goToStructureStep();
    });
  }, [hasContext, editorUIStoreActions]);

  const setActiveEditor = useCallback(
    // ✨ [함수명 개선] activateEditorWrapper → setActiveEditor
    (targetParagraphId: string) => {
      // ✨ [매개변수명 개선] paragraphId → targetParagraphId
      console.log('🎛️ [HOOK] setActiveEditor 호출:', targetParagraphId);

      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        activeParagraphId: targetParagraphId,
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setActiveParagraphId(targetParagraphId);
      });

      setTimeout(() => {
        const targetElement = document.querySelector(
          `[data-paragraph-id="${targetParagraphId}"]`
        );

        if (targetElement) {
          const scrollContainer = targetElement.closest('.overflow-y-auto');

          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = targetElement.getBoundingClientRect();
            const offsetTop =
              elementRect.top - containerRect.top + scrollContainer.scrollTop;

            scrollContainer.scrollTo({
              top: Math.max(0, offsetTop - 20),
              behavior: 'smooth',
            });
          } else {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest',
            });
          }
        }
      }, 200);
    },
    [hasContext, editorUIStoreActions]
  );

  const switchPreviewMode = useCallback(() => {
    // ✨ [함수명 개선] togglePreviewWrapper → switchPreviewMode
    console.log('🎛️ [HOOK] switchPreviewMode 호출');

    setEditorInternalState((previousState) => ({
      // ✨ [매개변수명 개선] prev → previousState
      ...previousState,
      isPreviewOpen: !previousState.isPreviewOpen,
    }));

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.togglePreview();
    });
  }, [hasContext, editorUIStoreActions]);

  const saveCurrentProgress = useCallback(() => {
    // ✨ [함수명 개선] saveAllToContextWrapper → saveCurrentProgress
    console.log('🎛️ [HOOK] saveCurrentProgress 호출');

    updateContainersFunction(currentContainers);

    const paragraphsToSave = currentParagraphs.map((currentParagraph) => ({
      // ✨ [변수명 개선] contextParagraphs → paragraphsToSave, p → currentParagraph
      ...currentParagraph,
    }));
    updateParagraphsFunction(paragraphsToSave);

    console.log('💾 [ACTION] Context 저장 완료:', {
      containers: currentContainers.length,
      paragraphs: currentParagraphs.length,
    });

    console.log('여기5<-------,paragraphsToSave', paragraphsToSave);

    showToastFunction({
      title: '저장 완료',
      description: '모든 내용이 저장되었습니다.',
      color: 'success',
    });
  }, [
    currentContainers,
    currentParagraphs,
    updateContainersFunction,
    updateParagraphsFunction,
    showToastFunction,
  ]);

  const finishEditing = useCallback(() => {
    // ✨ [함수명 개선] completeEditorWrapper → finishEditing
    console.log('🎛️ [HOOK] finishEditing 호출');

    saveCurrentProgress();

    const finalCompletedContent = generateCompletedContent(
      // ✨ [변수명 개선] completedContent → finalCompletedContent
      currentContainers,
      currentParagraphs
    );

    // 간단한 유효성 검사
    if (currentContainers.length === 0) {
      showToastFunction({
        title: '에디터 미완성',
        description: '최소 1개 이상의 컨테이너가 필요합니다.',
        color: 'warning',
      });
      return;
    }

    const assignedParagraphsCount = currentParagraphs.filter(
      (currentParagraph) => currentParagraph.containerId
    ); // ✨ [변수명 개선] assignedParagraphs → assignedParagraphsCount, p → currentParagraph
    if (assignedParagraphsCount.length === 0) {
      showToastFunction({
        title: '에디터 미완성',
        description: '최소 1개 이상의 할당된 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    updateCompletedContentFunction(finalCompletedContent);
    setCompletedStatusFunction(true);

    showToastFunction({
      title: '에디터 완성',
      description: '모듈화된 글 작성이 완료되었습니다!',
      color: 'success',
    });
  }, [
    currentContainers,
    currentParagraphs,
    saveCurrentProgress,
    updateCompletedContentFunction,
    setCompletedStatusFunction,
    showToastFunction,
  ]);

  // ✨ [가독성 개선] 상태 업데이트 함수들을 간결하게
  const updateSelectedParagraphs = useCallback(
    // ✨ [함수명 개선] setSelectedParagraphIds → updateSelectedParagraphs
    (paragraphIds: string[]) => {
      // ✨ [매개변수명 개선] ids → paragraphIds
      console.log('🎛️ [HOOK] updateSelectedParagraphs 호출:', {
        count: paragraphIds.length,
      });
      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        selectedParagraphIds: paragraphIds,
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setSelectedParagraphIds(paragraphIds);
      });
    },
    [hasContext, editorUIStoreActions]
  );

  const updateTargetContainer = useCallback(
    // ✨ [함수명 개선] setTargetContainerId → updateTargetContainer
    (targetContainerId: string) => {
      // ✨ [매개변수명 개선] containerId → targetContainerId
      console.log('🎛️ [HOOK] updateTargetContainer 호출:', targetContainerId);
      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        targetContainerId: targetContainerId,
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setTargetContainerId(targetContainerId);
      });
    },
    [hasContext, editorUIStoreActions]
  );

  const updateActiveParagraph = useCallback(
    // ✨ [함수명 개선] setActiveParagraphId → updateActiveParagraph
    (paragraphId: string | null) => {
      console.log('🎛️ [HOOK] updateActiveParagraph 호출:', paragraphId);
      setEditorInternalState((previousState) => ({
        // ✨ [매개변수명 개선] prev → previousState
        ...previousState,
        activeParagraphId: paragraphId,
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setActiveParagraphId(paragraphId);
      });
    },
    [hasContext, editorUIStoreActions]
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

  // ✨ [가독성 개선] 반환 객체도 의미있는 이름으로 정리
  return {
    // 상태 데이터
    internalState: editorInternalState,
    localParagraphs: currentParagraphs, // 기존 이름 유지 (export 요구사항)
    localContainers: currentContainers, // 기존 이름 유지 (export 요구사항)
    isMobile: isOnMobileDevice,

    // 상태 업데이트 함수들 (기존 이름 유지)
    setInternalState: setEditorInternalState,
    setLocalParagraphs: setCurrentParagraphs,
    setLocalContainers: setCurrentContainers,
    setSelectedParagraphIds: updateSelectedParagraphs,
    setTargetContainerId: updateTargetContainer,
    setActiveParagraphId: updateActiveParagraph,

    // 단락 관리 함수들 (기존 이름 유지)
    addLocalParagraph: createNewParagraph,
    deleteLocalParagraph: removeParagraph,
    updateLocalParagraphContent: updateParagraphContent,
    toggleParagraphSelection: toggleParagraphSelect,
    addToLocalContainer: addParagraphsToContainer,
    moveLocalParagraphInContainer: changeParagraphOrder,
    getLocalUnassignedParagraphs: getUnassignedParagraphs,
    getLocalParagraphsByContainer: getParagraphsByContainer,

    // 에디터 액션 함수들 (기존 이름 유지)
    handleStructureComplete: completeStructureSetup,
    goToStructureStep: navigateToStructureStep,
    activateEditor: setActiveEditor,
    togglePreview: switchPreviewMode,
    saveAllToContext: saveCurrentProgress,
    completeEditor: finishEditing,

    // 기타
    context: contextProvided,
  };
};
