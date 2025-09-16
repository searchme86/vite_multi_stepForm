// 📁 hooks/useEditorState/editorStateManagement.ts

import { EditorInternalState } from '../../types/editor';
import { EditorUIStoreActions } from './editorStateTypes';

const updateSelectedParagraphs = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions,
  updateSelectedParagraphIdsInStore: (ids: string[]) => void
) => {
  return (paragraphIdCollectionToUpdate: string[]) => {
    console.log('🎛️ [HOOK] updateSelectedParagraphs 호출:', {
      count: paragraphIdCollectionToUpdate?.length || 0,
    });

    try {
      const safeParagraphIdCollection = Array.isArray(
        paragraphIdCollectionToUpdate
      )
        ? paragraphIdCollectionToUpdate
        : [];

      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        selectedParagraphIds: safeParagraphIdCollection,
      }));

      if (!hasContext && updateSelectedParagraphIdsInStore) {
        updateSelectedParagraphIdsInStore(safeParagraphIdCollection);
      }
    } catch (error) {
      console.error('❌ [HOOK] 선택된 문단 업데이트 실패:', error);
    }
  };
};

const updateTargetContainer = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions,
  updateTargetContainerIdInStore: (containerId: string) => void
) => {
  return (targetContainerIdToUpdate: string) => {
    console.log(
      '🎛️ [HOOK] updateTargetContainer 호출:',
      targetContainerIdToUpdate
    );

    try {
      const safeContainerIdValue = targetContainerIdToUpdate || '';

      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        targetContainerId: safeContainerIdValue,
      }));

      if (!hasContext && updateTargetContainerIdInStore) {
        updateTargetContainerIdInStore(safeContainerIdValue);
      }
    } catch (error) {
      console.error('❌ [HOOK] 타겟 컨테이너 업데이트 실패:', error);
    }
  };
};

const updateActiveParagraph = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions,
  updateActiveParagraphIdInStore: (id: string | null) => void
) => {
  return (paragraphIdToActivate: string | null) => {
    console.log('🎛️ [HOOK] updateActiveParagraph 호출:', paragraphIdToActivate);

    try {
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        activeParagraphId: paragraphIdToActivate,
      }));

      if (!hasContext && updateActiveParagraphIdInStore) {
        updateActiveParagraphIdInStore(paragraphIdToActivate);
      }
    } catch (error) {
      console.error('❌ [HOOK] 활성 문단 업데이트 실패:', error);
    }
  };
};

export {
  updateSelectedParagraphs,
  updateTargetContainer,
  updateActiveParagraph,
};
