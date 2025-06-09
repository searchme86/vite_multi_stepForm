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

export const useParagraphActions = ({
  localParagraphs,
  setLocalParagraphs,
  setInternalState,
  localContainers,
  addToast,
}: UseParagraphActionsProps) => {
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
