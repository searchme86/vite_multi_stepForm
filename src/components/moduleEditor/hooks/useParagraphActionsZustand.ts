import { useCallback } from 'react';
import { LocalParagraph } from '../types/paragraph';
import { Container } from '../types/container';
import { EditorInternalState } from '../types/editor';
import {
  addLocalParagraph,
  updateLocalParagraphContent,
  deleteLocalParagraph,
  toggleParagraphSelection,
  addToLocalContainer,
  moveLocalParagraphInContainer,
} from '../actions/paragraphActions';

//====여기부터 수정됨====
// 기존: props로만 데이터를 받던 방식
// 새로운: zustand store에서도 데이터를 가져올 수 있는 방식 추가
import { useEditorCoreStore } from '../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../store/toast/toastStore';

// zustand store 타입 정의 (타입 안전성 강화)
type EditorCoreStoreType = {
  getParagraphs: () => LocalParagraph[];
  setParagraphs: (paragraphs: LocalParagraph[]) => void;
  getContainers: () => Container[];
  addParagraph: (paragraph: LocalParagraph) => void;
  deleteParagraph: (id: string) => void;
  updateParagraph: (id: string, updates: Partial<LocalParagraph>) => void;
  updateParagraphContent: (id: string, content: string) => void;
};

type EditorUIStoreType = {
  getSelectedParagraphIds: () => string[];
  getTargetContainerId: () => string;
  setSelectedParagraphIds: (ids: string[]) => void;
  setTargetContainerId: (id: string) => void;
  setActiveParagraphId: (id: string | null) => void;
  clearSelectedParagraphs: () => void;
};

type ToastStoreType = {
  addToast: (toast: Toast) => void;
};
//====여기까지 수정됨====

interface Toast {
  title: string;
  description: string;
  color: 'success' | 'warning' | 'error' | string;
}

interface UseParagraphActionsProps {
  localParagraphs: LocalParagraph[];
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>;
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>;
  localContainers: Container[];
  addToast: (toast: Toast) => void;
}

//====여기부터 수정됨====
// 기존 함수 시그니처 100% 유지하면서 props를 optional로 변경
// 이렇게 하면 기존 코드는 그대로 작동하고, 새로운 코드는 매개변수 없이 호출 가능
export const useParagraphActions = (props?: UseParagraphActionsProps) => {
  // zustand store에서 데이터 가져오기 (context 대신 사용) - 타입 명시
  const editorCoreStore = useEditorCoreStore() as EditorCoreStoreType;
  const editorUIStore = useEditorUIStore() as EditorUIStoreType;
  const toastStore = useToastStore() as ToastStoreType;

  // props가 제공되면 props 사용, 없으면 zustand store 사용
  // 이렇게 하면 기존 코드와 100% 호환되면서도 새로운 방식도 지원
  const localParagraphs =
    props?.localParagraphs ?? editorCoreStore.getParagraphs();
  const localContainers =
    props?.localContainers ?? editorCoreStore.getContainers();
  const addToast = props?.addToast ?? toastStore.addToast;

  // setLocalParagraphs와 setInternalState fallback 함수들 정의
  const setLocalParagraphs =
    props?.setLocalParagraphs ??
    ((updater: React.SetStateAction<LocalParagraph[]>) => {
      // zustand를 사용하는 경우의 단락 업데이트 로직
      if (typeof updater === 'function') {
        const currentParagraphs = editorCoreStore.getParagraphs();
        const newParagraphs = updater(currentParagraphs);
        editorCoreStore.setParagraphs(newParagraphs);
      } else {
        editorCoreStore.setParagraphs(updater);
      }
    });

  const setInternalState =
    props?.setInternalState ??
    ((updater: React.SetStateAction<EditorInternalState>) => {
      // zustand를 사용하는 경우의 내부 상태 업데이트 로직
      if (typeof updater === 'function') {
        // 현재 상태를 가져와서 업데이트 함수 적용
        const currentState: EditorInternalState = {
          currentSubStep: 'writing', // 기본값
          isTransitioning: false,
          activeParagraphId: editorUIStore.getSelectedParagraphIds()[0] || null,
          isPreviewOpen: true,
          selectedParagraphIds: editorUIStore.getSelectedParagraphIds(),
          targetContainerId: editorUIStore.getTargetContainerId(),
        };

        const newState = updater(currentState);

        // zustand store에 변경사항 반영
        if (
          newState.selectedParagraphIds !== currentState.selectedParagraphIds
        ) {
          editorUIStore.setSelectedParagraphIds(newState.selectedParagraphIds);
        }
        if (newState.targetContainerId !== currentState.targetContainerId) {
          editorUIStore.setTargetContainerId(newState.targetContainerId);
        }
        if (newState.activeParagraphId !== currentState.activeParagraphId) {
          editorUIStore.setActiveParagraphId(newState.activeParagraphId);
        }
      }
    });
  //====여기까지 수정됨====

  console.log('🎯 [HOOK] useParagraphActions 초기화:', {
    paragraphCount: localParagraphs.length,
    containerCount: localContainers.length,
  });

  const handleAddLocalParagraph = useCallback(() => {
    console.log('🎯 [HOOK] handleAddLocalParagraph 호출');
    addLocalParagraph(localParagraphs, setLocalParagraphs, setInternalState);
  }, [localParagraphs, setLocalParagraphs, setInternalState]);

  const handleUpdateLocalParagraphContent = useCallback(
    (paragraphId: string, content: string) => {
      console.log('🎯 [HOOK] handleUpdateLocalParagraphContent 호출:', {
        paragraphId,
        contentLength: content?.length,
      });
      updateLocalParagraphContent(paragraphId, content, setLocalParagraphs);
    },
    [setLocalParagraphs]
  );

  const handleDeleteLocalParagraph = useCallback(
    (paragraphId: string) => {
      console.log('🎯 [HOOK] handleDeleteLocalParagraph 호출:', paragraphId);
      deleteLocalParagraph(paragraphId, setLocalParagraphs, addToast);
    },
    [setLocalParagraphs, addToast]
  );

  const handleToggleParagraphSelection = useCallback(
    (paragraphId: string) => {
      console.log(
        '🎯 [HOOK] handleToggleParagraphSelection 호출:',
        paragraphId
      );
      toggleParagraphSelection(paragraphId, setInternalState);
    },
    [setInternalState]
  );

  const handleAddToLocalContainer = useCallback(
    (selectedParagraphIds: string[], targetContainerId: string) => {
      console.log('🎯 [HOOK] handleAddToLocalContainer 호출:', {
        selectedCount: selectedParagraphIds.length,
        targetContainerId,
      });
      addToLocalContainer(
        selectedParagraphIds,
        targetContainerId,
        localParagraphs,
        localContainers,
        setLocalParagraphs,
        setInternalState,
        addToast
      );
    },
    [
      localParagraphs,
      localContainers,
      setLocalParagraphs,
      setInternalState,
      addToast,
    ]
  );

  const handleMoveLocalParagraphInContainer = useCallback(
    (paragraphId: string, direction: 'up' | 'down') => {
      console.log('🎯 [HOOK] handleMoveLocalParagraphInContainer 호출:', {
        paragraphId,
        direction,
      });
      moveLocalParagraphInContainer(
        paragraphId,
        direction,
        localParagraphs,
        setLocalParagraphs
      );
    },
    [localParagraphs, setLocalParagraphs]
  );

  console.log('✅ [HOOK] useParagraphActions 훅 준비 완료');

  return {
    handleAddLocalParagraph,
    handleUpdateLocalParagraphContent,
    handleDeleteLocalParagraph,
    handleToggleParagraphSelection,
    handleAddToLocalContainer,
    handleMoveLocalParagraphInContainer,
  };
};
