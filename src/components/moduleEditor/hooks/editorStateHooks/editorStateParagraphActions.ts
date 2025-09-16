// 📁 hooks/useEditorState/editorStateParagraphActions.ts
import { EditorInternalState } from '../../types/editor';
import { ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph, EditorUIStoreActions } from './editorStateTypes';

// ✨ [단락 액션 함수들] useCallback 제거하여 Hook 규칙 위반 해결

const createNewParagraph = (
  managedParagraphCollection: LocalParagraph[],
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions,
  updateActiveParagraphIdInStore: (id: string | null) => void,
  showToastFunction: (options: ToastOptions) => void
) => {
  // ✅ useCallback 제거하고 일반 함수 반환
  return () => {
    try {
      const newParagraphToAdd: LocalParagraph = {
        id: `paragraph-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        content: '',
        containerId: null,
        order: managedParagraphCollection?.length || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return [...safePreviousCollection, newParagraphToAdd];
      });

      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        activeParagraphId: newParagraphToAdd.id,
      }));

      if (!hasContext && updateActiveParagraphIdInStore) {
        updateActiveParagraphIdInStore(newParagraphToAdd.id);
      }
    } catch (error) {
      console.error('❌ [LOCAL] 새 단락 생성 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '단락 생성 실패',
          description: '새 단락을 생성하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

const updateParagraphContent = (
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  showToastFunction: (options: ToastOptions) => void
) => {
  // ✅ useCallback 제거하고 일반 함수 반환
  return (
    specificParagraphIdToUpdate: string,
    updatedParagraphContent: string
  ) => {
    try {
      if (
        !specificParagraphIdToUpdate ||
        typeof specificParagraphIdToUpdate !== 'string'
      ) {
        console.warn(
          '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
          specificParagraphIdToUpdate
        );
        return;
      }

      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return safePreviousCollection.map((currentParagraphItem) => {
          const safeCurrentParagraph = currentParagraphItem || {};
          return safeCurrentParagraph.id === specificParagraphIdToUpdate
            ? {
                ...safeCurrentParagraph,
                content: updatedParagraphContent || '',
                updatedAt: new Date(),
              }
            : safeCurrentParagraph;
        });
      });
    } catch (error) {
      console.error('❌ [LOCAL] 문단 내용 업데이트 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '내용 저장 실패',
          description: '문단 내용을 저장하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

const removeParagraph = (
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  showToastFunction: (options: ToastOptions) => void
) => {
  // ✅ useCallback 제거하고 일반 함수 반환
  return (specificParagraphIdToRemove: string) => {
    try {
      if (
        !specificParagraphIdToRemove ||
        typeof specificParagraphIdToRemove !== 'string'
      ) {
        console.warn(
          '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
          specificParagraphIdToRemove
        );
        return;
      }

      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return safePreviousCollection.filter((currentParagraphItem) => {
          const safeCurrentParagraph = currentParagraphItem || {};
          return safeCurrentParagraph.id !== specificParagraphIdToRemove;
        });
      });

      if (showToastFunction) {
        showToastFunction({
          title: '단락 삭제',
          description: '선택한 단락이 삭제되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [LOCAL] 문단 삭제 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '삭제 실패',
          description: '문단을 삭제하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

const toggleParagraphSelect = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions,
  toggleParagraphSelectionInStore: (paragraphId: string) => void
) => {
  // ✅ useCallback 제거하고 일반 함수 반환
  return (specificParagraphIdToToggle: string) => {
    try {
      if (
        !specificParagraphIdToToggle ||
        typeof specificParagraphIdToToggle !== 'string'
      ) {
        console.warn(
          '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
          specificParagraphIdToToggle
        );
        return;
      }

      setEditorInternalState((previousInternalState) => {
        const safeInternalState = previousInternalState || {};
        const safeSelectedIdCollection =
          safeInternalState.selectedParagraphIds || [];

        return {
          ...safeInternalState,
          selectedParagraphIds: safeSelectedIdCollection.includes(
            specificParagraphIdToToggle
          )
            ? safeSelectedIdCollection.filter(
                (currentSelectedId) =>
                  currentSelectedId !== specificParagraphIdToToggle
              )
            : [...safeSelectedIdCollection, specificParagraphIdToToggle],
        };
      });

      if (!hasContext && toggleParagraphSelectionInStore) {
        toggleParagraphSelectionInStore(specificParagraphIdToToggle);
      }
    } catch (error) {
      console.error('❌ [LOCAL] 문단 선택 토글 실패:', error);
    }
  };
};

const changeParagraphOrder = (
  managedParagraphCollection: LocalParagraph[],
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  showToastFunction: (options: ToastOptions) => void
) => {
  // ✅ useCallback 제거하고 일반 함수 반환
  return (
    specificParagraphIdToMove: string,
    moveDirectionValue: 'up' | 'down'
  ) => {
    try {
      if (
        !specificParagraphIdToMove ||
        typeof specificParagraphIdToMove !== 'string'
      ) {
        console.warn(
          '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
          specificParagraphIdToMove
        );
        return;
      }

      if (moveDirectionValue !== 'up' && moveDirectionValue !== 'down') {
        console.warn('⚠️ [LOCAL] 유효하지 않은 이동 방향:', moveDirectionValue);
        return;
      }

      const safeCollection = managedParagraphCollection || [];

      const targetParagraphToMove = safeCollection.find(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.id === specificParagraphIdToMove;
        }
      );

      if (!targetParagraphToMove || !targetParagraphToMove.containerId) {
        console.warn(
          '⚠️ [LOCAL] 이동할 문단을 찾을 수 없거나 컨테이너에 할당되지 않음'
        );
        return;
      }

      const paragraphsInSameContainerGroup = safeCollection
        .filter((currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return (
            safeParagraph.containerId === targetParagraphToMove.containerId
          );
        })
        .sort((firstParagraphItem, secondParagraphItem) => {
          const safeFirst = firstParagraphItem || {};
          const safeSecond = secondParagraphItem || {};
          return (safeFirst.order || 0) - (safeSecond.order || 0);
        });

      const currentPositionIndexInContainer =
        paragraphsInSameContainerGroup.findIndex((currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.id === specificParagraphIdToMove;
        });

      if (
        (moveDirectionValue === 'up' &&
          currentPositionIndexInContainer === 0) ||
        (moveDirectionValue === 'down' &&
          currentPositionIndexInContainer ===
            paragraphsInSameContainerGroup.length - 1)
      ) {
        console.log('🚫 [LOCAL] 더 이상 이동할 수 없음');
        return;
      }

      const targetPositionIndexInContainer =
        moveDirectionValue === 'up'
          ? currentPositionIndexInContainer - 1
          : currentPositionIndexInContainer + 1;
      const swapTargetParagraphItem =
        paragraphsInSameContainerGroup[targetPositionIndexInContainer];

      if (!swapTargetParagraphItem) {
        console.warn('⚠️ [LOCAL] 교체할 문단을 찾을 수 없음');
        return;
      }

      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return safePreviousCollection.map((currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          if (safeParagraph.id === specificParagraphIdToMove) {
            return {
              ...safeParagraph,
              order: swapTargetParagraphItem.order || 0,
            };
          }
          if (safeParagraph.id === swapTargetParagraphItem.id) {
            return {
              ...safeParagraph,
              order: targetParagraphToMove.order || 0,
            };
          }
          return safeParagraph;
        });
      });
    } catch (error) {
      console.error('❌ [LOCAL] 문단 순서 변경 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '순서 변경 실패',
          description: '문단 순서를 변경하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  };
};

export {
  createNewParagraph,
  updateParagraphContent,
  removeParagraph,
  toggleParagraphSelect,
  changeParagraphOrder,
};
