import { useState, useEffect, useCallback } from 'react';
import { EditorInternalState } from '../types/editor';
import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';
import { useParagraphActions } from './useParagraphActions';
import { useContainerActions } from './useContainerActions';
import {
  handleStructureComplete,
  goToStructureStep,
  activateEditor,
  togglePreview,
  saveAllToContext,
  completeEditor,
  generateCompletedContent,
} from '../actions/editorActions';

interface EditorState {
  containers: Container[];
  paragraphs: LocalParagraph[];
  completedContent: string;
  isCompleted: boolean;
}

interface ToastConfig {
  title: string;
  description: string;
  color: string;
}

interface MultiStepFormContext {
  editorState: EditorState;
  updateEditorContainers: (containers: Container[]) => void;
  updateEditorParagraphs: (paragraphs: LocalParagraph[]) => void;
  updateEditorCompletedContent: (content: string) => void;
  setEditorCompleted: (completed: boolean) => void;
  addToast: (toast: ToastConfig) => void;
}

interface UseEditorStateProps {
  context: MultiStepFormContext;
}

export const useEditorState = ({ context }: UseEditorStateProps) => {
  console.log('🎛️ [HOOK] useEditorState 초기화');

  const {
    editorState,
    updateEditorContainers,
    updateEditorParagraphs,
    updateEditorCompletedContent,
    setEditorCompleted,
    addToast,
  } = context;

  console.log('🎛️ [HOOK] Context 상태 확인:', {
    containers: editorState.containers.length,
    paragraphs: editorState.paragraphs.length,
    isCompleted: editorState.isCompleted,
  });

  const [internalState, setInternalState] = useState<EditorInternalState>({
    currentSubStep: 'structure',
    isTransitioning: false,
    activeParagraphId: null,
    isPreviewOpen: true,
    selectedParagraphIds: [],
    targetContainerId: '',
  });

  const [localParagraphs, setLocalParagraphs] = useState<LocalParagraph[]>([]);
  const [localContainers, setLocalContainers] = useState<Container[]>([]);
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

  const paragraphActions = useParagraphActions({
    localParagraphs,
    setLocalParagraphs,
    setInternalState,
    localContainers,
    addToast,
  });

  const containerActions = useContainerActions({
    localParagraphs,
    localContainers,
  });

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

    console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraph.id);
  }, [localParagraphs.length]);

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

  const toggleParagraphSelection = useCallback((paragraphId: string) => {
    console.log('☑️ [LOCAL] 단락 선택 토글:', paragraphId);
    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: prev.selectedParagraphIds.includes(paragraphId)
        ? prev.selectedParagraphIds.filter((id) => id !== paragraphId)
        : [...prev.selectedParagraphIds, paragraphId],
    }));
  }, []);

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
    },
    [addToast]
  );

  const goToStructureStepWrapper = useCallback(() => {
    console.log('🎛️ [HOOK] goToStructureStepWrapper 호출');
    goToStructureStep(setInternalState);
  }, []);

  const activateEditorWrapper = useCallback((paragraphId: string) => {
    console.log('🎛️ [HOOK] activateEditorWrapper 호출:', paragraphId);
    activateEditor(paragraphId, setInternalState);
  }, []);

  const togglePreviewWrapper = useCallback(() => {
    console.log('🎛️ [HOOK] togglePreviewWrapper 호출');
    togglePreview(setInternalState);
  }, []);

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
      generateCompletedContent,
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

  const setSelectedParagraphIds = useCallback((ids: string[]) => {
    console.log('🎛️ [HOOK] setSelectedParagraphIds 호출:', {
      count: ids.length,
    });
    setInternalState((prev) => ({
      ...prev,
      selectedParagraphIds: ids,
    }));
  }, []);

  const setTargetContainerId = useCallback((containerId: string) => {
    console.log('🎛️ [HOOK] setTargetContainerId 호출:', containerId);
    setInternalState((prev) => ({
      ...prev,
      targetContainerId: containerId,
    }));
  }, []);

  const setActiveParagraphId = useCallback((paragraphId: string | null) => {
    console.log('🎛️ [HOOK] setActiveParagraphId 호출:', paragraphId);
    setInternalState((prev) => ({
      ...prev,
      activeParagraphId: paragraphId,
    }));
  }, []);

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
    ...paragraphActions,
    ...containerActions,
    handleStructureComplete: handleStructureCompleteWrapper,
    goToStructureStep: goToStructureStepWrapper,
    activateEditor: activateEditorWrapper,
    togglePreview: togglePreviewWrapper,
    saveAllToContext: saveAllToContextWrapper,
    completeEditor: completeEditorWrapper,
    context,
  };
};
