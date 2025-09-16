// 📁 hooks/useEditorState/editorStateContainerActions.ts

import { EditorInternalState } from '../../types/editor';
import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph, EditorUIStoreActions } from './editorStateTypes';

const addParagraphsToContainer = (
  selectedElementIdCollection: string[],
  targetDestinationIdValue: string,
  managedParagraphCollection: LocalParagraph[],
  managedContainerCollection: Container[],
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  showToastFunction: (options: ToastOptions) => void,
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions,
  clearSelectedParagraphsInStore: () => void
) => {
  return () => {
    console.log('📦 [LOCAL] 컨테이너에 단락 추가 시작');

    try {
      if (
        !selectedElementIdCollection ||
        selectedElementIdCollection.length === 0
      ) {
        if (showToastFunction) {
          showToastFunction({
            title: '선택된 단락 없음',
            description: '컨테이너에 추가할 단락을 선택해주세요.',
            color: 'warning',
          });
        }
        return;
      }

      if (!targetDestinationIdValue) {
        if (showToastFunction) {
          showToastFunction({
            title: '컨테이너 미선택',
            description: '단락을 추가할 컨테이너를 선택해주세요.',
            color: 'warning',
          });
        }
        return;
      }

      const safeParagraphCollection = managedParagraphCollection || [];
      const safeContainerCollection = managedContainerCollection || [];

      const existingParagraphsInTargetContainer =
        safeParagraphCollection.filter((currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.containerId === targetDestinationIdValue;
        });

      const lastOrderValueInContainer =
        existingParagraphsInTargetContainer.length > 0
          ? Math.max(
              ...existingParagraphsInTargetContainer.map(
                (currentParagraphItem) => {
                  const safeParagraph = currentParagraphItem || {};
                  return safeParagraph.order || 0;
                }
              )
            )
          : -1;

      const selectedParagraphsToAddToContainer = safeParagraphCollection.filter(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return selectedElementIdCollection.includes(safeParagraph.id || '');
        }
      );

      const newParagraphsToAddToContainer =
        selectedParagraphsToAddToContainer.map(
          (currentParagraphItem, currentIterationIndex) => {
            const safeParagraph = currentParagraphItem || {};
            return {
              ...safeParagraph,
              id: `paragraph-copy-${Date.now()}-${currentIterationIndex}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              originalId: safeParagraph.id,
              containerId: targetDestinationIdValue,
              order: lastOrderValueInContainer + currentIterationIndex + 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        );

      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return [...safePreviousCollection, ...newParagraphsToAddToContainer];
      });

      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        selectedParagraphIds: [],
        targetContainerId: '',
      }));

      if (!hasContext && clearSelectedParagraphsInStore) {
        clearSelectedParagraphsInStore();
      }

      const targetContainerInformation = safeContainerCollection.find(
        (currentContainerItem) => {
          const safeContainer = currentContainerItem || {};
          return safeContainer.id === targetDestinationIdValue;
        }
      );

      if (showToastFunction) {
        showToastFunction({
          title: '단락 추가 완료',
          description: `${
            selectedParagraphsToAddToContainer.length
          }개의 단락이 ${
            targetContainerInformation?.name || '컨테이너'
          }에 추가되었습니다.`,
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [LOCAL] 컨테이너에 단락 추가 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '추가 실패',
          description: '단락을 컨테이너에 추가하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

export { addParagraphsToContainer };
