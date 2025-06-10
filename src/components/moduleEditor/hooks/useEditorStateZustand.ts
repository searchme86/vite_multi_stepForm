import { useState, useEffect, useCallback } from 'react';
import { EditorInternalState } from '../types/editor';

//====여기부터 수정됨====
// 기존: context 파일에서 타입과 함수들을 가져오던 방식
// import {
//   Container,
//   ParagraphBlock,
//   MultiStepFormContextType,
//   ToastOptions,
//   generateCompletedContent,
//   createContainer,
// } from '../../useMultiStepForm';

// 새로운: zustand store에서 타입과 함수들을 가져오는 방식
import {
  Container,
  ParagraphBlock,
  ToastOptions,
} from '../store/shared/commonTypes';
import { useEditorCoreStore } from '../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../store/editorUI/editorUIStore';
import { useToastStore } from '../store/toast/toastStore';

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

// ⭐ 에러 해결: context를 optional로 변경
interface UseEditorStateProps {
  context?: MultiStepFormContextType; // required에서 optional로 변경
}
//====여기까지 수정됨====

// createContainer 함수를 zustand 방식으로 재정의 (기존 로직 동일)
const createContainer = (name: string, order: number): Container => {
  return {
    id: `container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(),
    order,
    createdAt: new Date(),
  };
};

// generateCompletedContent 함수를 zustand 방식으로 재정의 (기존 로직 동일)
const generateCompletedContent = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string => {
  const sortedContainers = [...containers].sort((a, b) => a.order - b.order);

  const sections = sortedContainers.map((container) => {
    const containerParagraphs = paragraphs
      .filter((p) => p.containerId === container.id)
      .sort((a, b) => a.order - b.order);

    if (containerParagraphs.length === 0) {
      return '';
    }

    return containerParagraphs.map((p) => p.content).join('\n\n');
  });

  return sections.filter((section) => section.trim().length > 0).join('\n\n');
};

type LocalParagraph = ParagraphBlock;

// 내부 액션 함수들을 직접 정의 (타입 불일치 해결)
const handleStructureComplete = (
  validInputs: string[],
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>,
  setLocalContainers: React.Dispatch<React.SetStateAction<Container[]>>,
  addToast: (options: ToastOptions) => void
) => {
  console.log('🎉 [ACTION] 구조 완료 처리 시작:', validInputs);

  if (validInputs.length < 2) {
    addToast({
      title: '구조 설정 오류',
      description: '최소 2개 이상의 섹션 이름을 입력해주세요.',
      color: 'warning',
    });
    return;
  }

  setInternalState((prev) => ({ ...prev, isTransitioning: true }));

  const containers = validInputs.map((name, index) =>
    createContainer(name, index)
  );
  setLocalContainers(containers);
  console.log('📦 [ACTION] 로컬 컨테이너 생성:', containers);

  setTimeout(() => {
    setInternalState((prev) => ({
      ...prev,
      currentSubStep: 'writing',
      isTransitioning: false,
    }));
  }, 300);

  addToast({
    title: '구조 설정 완료',
    description: `${validInputs.length}개의 섹션이 생성되었습니다.`,
    color: 'success',
  });
};

const goToStructureStep = (
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
) => {
  setInternalState((prev) => ({
    ...prev,
    isTransitioning: true,
  }));

  setTimeout(() => {
    setInternalState((prev) => ({
      ...prev,
      currentSubStep: 'structure',
      isTransitioning: false,
    }));
  }, 300);
};

const activateEditor = (
  paragraphId: string,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
) => {
  console.log('🎯 [ACTION] 에디터 활성화 시도:', paragraphId);

  setInternalState((prev) => ({
    ...prev,
    activeParagraphId: paragraphId,
  }));

  setTimeout(() => {
    const targetElement = document.querySelector(
      `[data-paragraph-id="${paragraphId}"]`
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
};

const togglePreview = (
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
) => {
  setInternalState((prev) => ({
    ...prev,
    isPreviewOpen: !prev.isPreviewOpen,
  }));
};

const saveAllToContext = (
  localContainers: Container[],
  localParagraphs: LocalParagraph[],
  updateEditorContainers: (containers: Container[]) => void,
  updateEditorParagraphs: (paragraphs: ParagraphBlock[]) => void,
  addToast: (options: ToastOptions) => void
) => {
  console.log('💾 [ACTION] 전체 Context 저장 시작');

  updateEditorContainers(localContainers);

  const contextParagraphs = localParagraphs.map((p) => ({
    ...p,
  }));
  updateEditorParagraphs(contextParagraphs);

  console.log('💾 [ACTION] Context 저장 완료:', {
    containers: localContainers.length,
    paragraphs: localParagraphs.length,
  });

  addToast({
    title: '저장 완료',
    description: '모든 내용이 저장되었습니다.',
    color: 'success',
  });
};

const completeEditor = (
  localContainers: Container[],
  localParagraphs: LocalParagraph[],
  saveAllToContextWrapper: () => void,
  updateEditorCompletedContent: (content: string) => void,
  setEditorCompleted: (completed: boolean) => void,
  addToast: (options: ToastOptions) => void
) => {
  console.log('🎉 [ACTION] 에디터 완성 처리');

  saveAllToContextWrapper();

  const completedContent = generateCompletedContent(
    localContainers,
    localParagraphs
  );

  // 간단한 유효성 검사
  if (localContainers.length === 0) {
    addToast({
      title: '에디터 미완성',
      description: '최소 1개 이상의 컨테이너가 필요합니다.',
      color: 'warning',
    });
    return;
  }

  const assignedParagraphs = localParagraphs.filter((p) => p.containerId);
  if (assignedParagraphs.length === 0) {
    addToast({
      title: '에디터 미완성',
      description: '최소 1개 이상의 할당된 단락이 필요합니다.',
      color: 'warning',
    });
    return;
  }

  updateEditorCompletedContent(completedContent);
  setEditorCompleted(true);

  addToast({
    title: '에디터 완성',
    description: '모듈화된 글 작성이 완료되었습니다!',
    color: 'success',
  });
};

// ⭐ 에러 해결: 함수 오버로드 추가로 매개변수 없이도 호출 가능하도록 함
export function useEditorState(): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(
  props: UseEditorStateProps
): ReturnType<typeof useEditorStateImpl>;
export function useEditorState(props?: UseEditorStateProps) {
  return useEditorStateImpl(props);
}

// 실제 구현 함수 (내부 함수로 분리)
const useEditorStateImpl = (props?: UseEditorStateProps) => {
  console.log('🎛️ [HOOK] useEditorState 초기화');

  //====여기부터 수정됨====
  // zustand store에서 데이터 가져오기 (context 대신 사용)
  const editorCoreStore = useEditorCoreStore();
  const editorUIStore = useEditorUIStore();
  const toastStore = useToastStore();

  // props가 제공되면 props.context 사용, 없으면 zustand store 사용
  // 이렇게 하면 기존 코드와 100% 호환되면서도 새로운 방식도 지원
  const context = props?.context;

  // context에서 가져오던 것들을 zustand store에서 가져오도록 변경
  const editorState = context?.editorState ?? {
    containers: editorCoreStore.getContainers(),
    paragraphs: editorCoreStore.getParagraphs(),
    completedContent: editorCoreStore.getCompletedContent(),
    isCompleted: editorCoreStore.getIsCompleted(),
  };

  const updateEditorContainers =
    context?.updateEditorContainers ?? editorCoreStore.setContainers;
  const updateEditorParagraphs =
    context?.updateEditorParagraphs ?? editorCoreStore.setParagraphs;
  const updateEditorCompletedContent =
    context?.updateEditorCompletedContent ??
    editorCoreStore.setCompletedContent;
  const setEditorCompleted =
    context?.setEditorCompleted ?? editorCoreStore.setIsCompleted;
  const addToast = context?.addToast ?? toastStore.addToast;
  //====여기까지 수정됨====

  console.log('🎛️ [HOOK] Context 상태 확인:', {
    containers: editorState.containers.length,
    paragraphs: editorState.paragraphs.length,
    isCompleted: editorState.isCompleted,
  });

  //====여기부터 수정됨====
  // 기존: 로컬 상태로만 관리
  // 새로운: context가 없을 때 zustand store와 동기화
  const [internalState, setInternalState] = useState<EditorInternalState>(
    () => {
      // context가 없으면 zustand store에서 초기값 가져오기
      if (!context) {
        return {
          currentSubStep: editorUIStore.getCurrentSubStep(),
          isTransitioning: editorUIStore.getIsTransitioning(),
          activeParagraphId: editorUIStore.getActiveParagraphId(),
          isPreviewOpen: editorUIStore.getIsPreviewOpen(),
          selectedParagraphIds: editorUIStore.getSelectedParagraphIds(),
          targetContainerId: editorUIStore.getTargetContainerId(),
        };
      }
      // context가 있으면 기존 초기값 사용
      return {
        currentSubStep: 'structure',
        isTransitioning: false,
        activeParagraphId: null,
        isPreviewOpen: true,
        selectedParagraphIds: [],
        targetContainerId: '',
      };
    }
  );

  const [localParagraphs, setLocalParagraphs] = useState<LocalParagraph[]>(
    () => {
      // context가 없으면 zustand store에서 초기값 가져오기
      return context ? [] : editorCoreStore.getParagraphs();
    }
  );

  const [localContainers, setLocalContainers] = useState<Container[]>(() => {
    // context가 없으면 zustand store에서 초기값 가져오기
    return context ? [] : editorCoreStore.getContainers();
  });
  //====여기까지 수정됨====

  const [isMobile, setIsMobile] = useState(false);

  console.log('🎛️ [HOOK] 로컬 상태 초기화 완료:', {
    currentSubStep: internalState.currentSubStep,
    localParagraphs: localParagraphs.length,
    localContainers: localContainers.length,
    isMobile,
  });

  useEffect(() => {
    console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 설정');

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      console.log('📱 [MOBILE] 화면 크기 체크:', {
        width: window.innerWidth,
        isMobile: mobile,
      });
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      console.log('🎛️ [HOOK] 모바일 감지 이벤트 리스너 제거');
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  //====여기부터 수정됨====
  // zustand store와 로컬 상태 동기화 (context가 없을 때만)
  useEffect(() => {
    if (!context) {
      // zustand store의 현재 상태를 로컬 상태에 반영
      setInternalState((prev) => ({
        ...prev,
        currentSubStep: editorUIStore.getCurrentSubStep(),
        isTransitioning: editorUIStore.getIsTransitioning(),
        activeParagraphId: editorUIStore.getActiveParagraphId(),
        isPreviewOpen: editorUIStore.getIsPreviewOpen(),
        selectedParagraphIds: editorUIStore.getSelectedParagraphIds(),
        targetContainerId: editorUIStore.getTargetContainerId(),
      }));
    }
  }, [context, editorUIStore]);
  //====여기까지 수정됨====

  const addLocalParagraph = useCallback(() => {
    console.log('📄 [LOCAL] 새 단락 추가');
    const newParagraph: LocalParagraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      containerId: null,
      order: localParagraphs.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocalParagraphs((prev) => [...prev, newParagraph]);
    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: newParagraph.id,
    }));

    //====여기부터 수정됨====
    // context가 없을 때 zustand store도 업데이트
    if (!context) {
      editorUIStore.setActiveParagraphId(newParagraph.id);
    }
    //====여기까지 수정됨====

    console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraph.id);
  }, [localParagraphs.length, context, editorUIStore]);

  const updateLocalParagraphContent = useCallback(
    (paragraphId: string, content: string) => {
      console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
        paragraphId,
        contentLength: (content || '').length,
      });

      setLocalParagraphs((prev) =>
        prev.map((p) =>
          p.id === paragraphId
            ? { ...p, content: content || '', updatedAt: new Date() }
            : p
        )
      );
    },
    []
  );

  const deleteLocalParagraph = useCallback(
    (paragraphId: string) => {
      console.log('🗑️ [LOCAL] 로컬 단락 삭제:', paragraphId);
      setLocalParagraphs((prev) => prev.filter((p) => p.id !== paragraphId));

      addToast({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    },
    [addToast]
  );

  const toggleParagraphSelection = useCallback(
    (paragraphId: string) => {
      console.log('☑️ [LOCAL] 단락 선택 토글:', paragraphId);
      setInternalState((prev) => ({
        ...prev,
        selectedParagraphIds: prev.selectedParagraphIds.includes(paragraphId)
          ? prev.selectedParagraphIds.filter((id) => id !== paragraphId)
          : [...prev.selectedParagraphIds, paragraphId],
      }));

      //====여기부터 수정됨====
      // context가 없을 때 zustand store도 업데이트
      if (!context) {
        editorUIStore.toggleParagraphSelection(paragraphId);
      }
      //====여기까지 수정됨====
    },
    [context, editorUIStore]
  );

  const addToLocalContainer = useCallback(() => {
    console.log('📦 [LOCAL] 컨테이너에 단락 추가 시작');

    if (internalState.selectedParagraphIds.length === 0) {
      addToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!internalState.targetContainerId) {
      addToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const existingParagraphs = localParagraphs.filter(
      (p) => p.containerId === internalState.targetContainerId
    );
    const lastOrder =
      existingParagraphs.length > 0
        ? Math.max(...existingParagraphs.map((p) => p.order))
        : -1;

    const selectedParagraphs = localParagraphs.filter((p) =>
      internalState.selectedParagraphIds.includes(p.id)
    );

    const newParagraphs = selectedParagraphs.map((paragraph, index) => ({
      ...paragraph,
      id: `paragraph-copy-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      originalId: paragraph.id,
      containerId: internalState.targetContainerId,
      order: lastOrder + index + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    setLocalParagraphs((prev) => [...prev, ...newParagraphs]);

    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: [],
      targetContainerId: '',
    }));

    //====여기부터 수정됨====
    // context가 없을 때 zustand store도 업데이트
    if (!context) {
      editorUIStore.clearSelectedParagraphs();
    }
    //====여기까지 수정됨====

    const targetContainer = localContainers.find(
      (c) => c.id === internalState.targetContainerId
    );

    addToast({
      title: '단락 추가 완료',
      description: `${selectedParagraphs.length}개의 단락이 ${
        targetContainer?.name || '컨테이너'
      }에 추가되었습니다.`,
      color: 'success',
    });
  }, [
    internalState.selectedParagraphIds,
    internalState.targetContainerId,
    localParagraphs,
    localContainers,
    addToast,
    context,
    editorUIStore,
  ]);

  const moveLocalParagraphInContainer = useCallback(
    (paragraphId: string, direction: 'up' | 'down') => {
      console.log('↕️ [LOCAL] 단락 순서 변경:', { paragraphId, direction });

      const paragraph = localParagraphs.find((p) => p.id === paragraphId);
      if (!paragraph || !paragraph.containerId) return;

      const containerParagraphs = localParagraphs
        .filter((p) => p.containerId === paragraph.containerId)
        .sort((a, b) => a.order - b.order);

      const currentIndex = containerParagraphs.findIndex(
        (p) => p.id === paragraphId
      );

      if (
        (direction === 'up' && currentIndex === 0) ||
        (direction === 'down' &&
          currentIndex === containerParagraphs.length - 1)
      ) {
        return;
      }

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetParagraph = containerParagraphs[targetIndex];

      setLocalParagraphs((prev) =>
        prev.map((p) => {
          if (p.id === paragraphId) {
            return { ...p, order: targetParagraph.order };
          }
          if (p.id === targetParagraph.id) {
            return { ...p, order: paragraph.order };
          }
          return p;
        })
      );
    },
    [localParagraphs]
  );

  const getLocalUnassignedParagraphs = useCallback(() => {
    const unassigned = localParagraphs.filter((p) => !p.containerId);
    console.log('📋 [LOCAL] 미할당 단락 조회:', unassigned.length);
    return unassigned;
  }, [localParagraphs]);

  const getLocalParagraphsByContainer = useCallback(
    (containerId: string) => {
      const containerParagraphs = localParagraphs
        .filter((p) => p.containerId === containerId)
        .sort((a, b) => a.order - b.order);
      console.log('📋 [LOCAL] 컨테이너별 단락 조회:', {
        containerId,
        count: containerParagraphs.length,
      });
      return containerParagraphs;
    },
    [localParagraphs]
  );

  const handleStructureCompleteWrapper = useCallback(
    (validInputs: string[]) => {
      console.log(
        '🎛️ [HOOK] handleStructureCompleteWrapper 호출:',
        validInputs
      );
      handleStructureComplete(
        validInputs,
        setInternalState,
        setLocalContainers,
        addToast
      );

      //====여기부터 수정됨====
      // context가 없을 때 zustand store도 업데이트
      if (!context) {
        editorUIStore.goToWritingStep();
      }
      //====여기까지 수정됨====
    },
    [addToast, context, editorUIStore]
  );

  const goToStructureStepWrapper = useCallback(() => {
    console.log('🎛️ [HOOK] goToStructureStepWrapper 호출');
    goToStructureStep(setInternalState);

    //====여기부터 수정됨====
    // context가 없을 때 zustand store도 업데이트
    if (!context) {
      editorUIStore.goToStructureStep();
    }
    //====여기까지 수정됨====
  }, [context, editorUIStore]);

  const activateEditorWrapper = useCallback(
    (paragraphId: string) => {
      console.log('🎛️ [HOOK] activateEditorWrapper 호출:', paragraphId);
      activateEditor(paragraphId, setInternalState);

      //====여기부터 수정됨====
      // context가 없을 때 zustand store도 업데이트
      if (!context) {
        editorUIStore.setActiveParagraphId(paragraphId);
      }
      //====여기까지 수정됨====
    },
    [context, editorUIStore]
  );

  const togglePreviewWrapper = useCallback(() => {
    console.log('🎛️ [HOOK] togglePreviewWrapper 호출');
    togglePreview(setInternalState);

    //====여기부터 수정됨====
    // context가 없을 때 zustand store도 업데이트
    if (!context) {
      editorUIStore.togglePreview();
    }
    //====여기까지 수정됨====
  }, [context, editorUIStore]);

  const saveAllToContextWrapper = useCallback(() => {
    console.log('🎛️ [HOOK] saveAllToContextWrapper 호출');
    saveAllToContext(
      localContainers,
      localParagraphs,
      updateEditorContainers,
      updateEditorParagraphs,
      addToast
    );
  }, [
    localContainers,
    localParagraphs,
    updateEditorContainers,
    updateEditorParagraphs,
    addToast,
  ]);

  const completeEditorWrapper = useCallback(() => {
    console.log('🎛️ [HOOK] completeEditorWrapper 호출');
    completeEditor(
      localContainers,
      localParagraphs,
      saveAllToContextWrapper,
      updateEditorCompletedContent,
      setEditorCompleted,
      addToast
    );
  }, [
    localContainers,
    localParagraphs,
    saveAllToContextWrapper,
    updateEditorCompletedContent,
    setEditorCompleted,
    addToast,
  ]);

  const setSelectedParagraphIds = useCallback(
    (ids: string[]) => {
      console.log('🎛️ [HOOK] setSelectedParagraphIds 호출:', {
        count: ids.length,
      });
      setInternalState((prev) => ({
        ...prev,
        selectedParagraphIds: ids,
      }));

      //====여기부터 수정됨====
      // context가 없을 때 zustand store도 업데이트
      if (!context) {
        editorUIStore.setSelectedParagraphIds(ids);
      }
      //====여기까지 수정됨====
    },
    [context, editorUIStore]
  );

  const setTargetContainerId = useCallback(
    (containerId: string) => {
      console.log('🎛️ [HOOK] setTargetContainerId 호출:', containerId);
      setInternalState((prev) => ({
        ...prev,
        targetContainerId: containerId,
      }));

      //====여기부터 수정됨====
      // context가 없을 때 zustand store도 업데이트
      if (!context) {
        editorUIStore.setTargetContainerId(containerId);
      }
      //====여기까지 수정됨====
    },
    [context, editorUIStore]
  );

  const setActiveParagraphId = useCallback(
    (paragraphId: string | null) => {
      console.log('🎛️ [HOOK] setActiveParagraphId 호출:', paragraphId);
      setInternalState((prev) => ({
        ...prev,
        activeParagraphId: paragraphId,
      }));

      //====여기부터 수정됨====
      // context가 없을 때 zustand store도 업데이트
      if (!context) {
        editorUIStore.setActiveParagraphId(paragraphId);
      }
      //====여기까지 수정됨====
    },
    [context, editorUIStore]
  );

  console.log('✅ [HOOK] useEditorState 훅 준비 완료:', {
    internalState: {
      currentSubStep: internalState.currentSubStep,
      isTransitioning: internalState.isTransitioning,
      activeParagraphId: internalState.activeParagraphId,
      isPreviewOpen: internalState.isPreviewOpen,
      selectedCount: internalState.selectedParagraphIds.length,
      targetContainerId: internalState.targetContainerId,
    },
    localData: {
      paragraphs: localParagraphs.length,
      containers: localContainers.length,
    },
    deviceInfo: {
      isMobile,
    },
  });

  return {
    internalState,
    localParagraphs,
    localContainers,
    isMobile,
    setInternalState,
    setLocalParagraphs,
    setLocalContainers,
    setSelectedParagraphIds,
    setTargetContainerId,
    setActiveParagraphId,
    addLocalParagraph,
    deleteLocalParagraph,
    updateLocalParagraphContent,
    toggleParagraphSelection,
    addToLocalContainer,
    moveLocalParagraphInContainer,
    getLocalUnassignedParagraphs,
    getLocalParagraphsByContainer,
    handleStructureComplete: handleStructureCompleteWrapper,
    goToStructureStep: goToStructureStepWrapper,
    activateEditor: activateEditorWrapper,
    togglePreview: togglePreviewWrapper,
    saveAllToContext: saveAllToContextWrapper,
    completeEditor: completeEditorWrapper,
    context,
  };
};
