import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import { EditorInternalState } from '../../types/editor';
import {
  validateParagraphSelection,
  validateContainerTarget,
} from '../../utils/validation';

import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

import {
  ParagraphBlock,
  Container as ZustandContainer,
} from '../../../../store/shared/commonTypes';

const convertToZustandParagraph = (
  localParagraphData: LocalParagraph
): ParagraphBlock => {
  const {
    id: paragraphId = '',
    content: paragraphContent = '',
    containerId: assignedContainerId = null,
    order: paragraphOrder = 0,
    createdAt: creationTimestamp = new Date(),
    updatedAt: lastModifiedTimestamp = new Date(),
  } = localParagraphData || {};

  return {
    id: paragraphId,
    content: paragraphContent,
    containerId: assignedContainerId,
    order: paragraphOrder,
    createdAt: creationTimestamp,
    updatedAt: lastModifiedTimestamp,
  };
};

const convertFromZustandParagraph = (
  zustandParagraphData: ParagraphBlock
): LocalParagraph => {
  const {
    id: paragraphId = '',
    content: paragraphContent = '',
    containerId: assignedContainerId = null,
    order: paragraphOrder = 0,
    createdAt: creationTimestamp = new Date(),
    updatedAt: lastModifiedTimestamp = new Date(),
  } = zustandParagraphData || {};

  return {
    id: paragraphId,
    content: paragraphContent,
    containerId: assignedContainerId,
    order: paragraphOrder,
    createdAt: creationTimestamp,
    updatedAt: lastModifiedTimestamp,
    originalId: undefined,
  };
};

const convertFromZustandContainer = (
  zustandContainerData: ZustandContainer
): Container => {
  const {
    id: containerId = '',
    name: containerName = '',
    order: containerOrder = 0,
  } = zustandContainerData || {};

  return {
    id: containerId,
    name: containerName,
    order: containerOrder,
  };
};

const hasSignificantContent = (paragraphContent: string): boolean => {
  if (!paragraphContent || typeof paragraphContent !== 'string') {
    return false;
  }

  const trimmedContent = paragraphContent.trim();

  if (trimmedContent.length === 0) {
    return false;
  }

  const hasMinimumLength = trimmedContent.length >= 3;
  const hasImages = trimmedContent.includes('![');
  const hasLinks = trimmedContent.includes('[') && trimmedContent.includes(']');
  const hasMarkdownSyntax = /[*#`_~]/.test(trimmedContent);

  return hasMinimumLength || hasImages || hasLinks || hasMarkdownSyntax;
};

interface ToastMessage {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
}

export function addLocalParagraph(): void;
export function addLocalParagraph(
  currentLocalParagraphs: LocalParagraph[],
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function addLocalParagraph(
  currentLocalParagraphs?: LocalParagraph[],
  updateLocalParagraphs?: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >
) {
  if (currentLocalParagraphs && updateLocalParagraphs && updateInternalState) {
    try {
      const newParagraphToAdd: LocalParagraph = {
        id: `paragraph-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        content: '',
        containerId: null,
        order: currentLocalParagraphs.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateLocalParagraphs((previousParagraphs) => [
        ...previousParagraphs,
        newParagraphToAdd,
      ]);

      updateInternalState((previousState: EditorInternalState) => ({
        ...previousState,
        activeParagraphId: newParagraphToAdd.id,
      }));
    } catch (contextError) {
      console.error('❌ [CONTEXT] 단락 생성 실패:', contextError);
    }
  } else {
    try {
      const editorCoreStoreActions = useEditorCoreStore.getState();
      const editorUIStoreActions = useEditorUIStore.getState();

      const existingParagraphsFromStore =
        editorCoreStoreActions.getParagraphs();

      const newParagraphToAdd: LocalParagraph = {
        id: `paragraph-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        content: '',
        containerId: null,
        order: existingParagraphsFromStore.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const zustandParagraphToAdd =
        convertToZustandParagraph(newParagraphToAdd);

      editorCoreStoreActions.addParagraph(zustandParagraphToAdd);
      editorUIStoreActions.setActiveParagraphId(newParagraphToAdd.id);
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 생성 실패:', zustandError);
    }
  }
}

export function updateLocalParagraphContent(
  targetParagraphId: string,
  newContentValue: string
): void;
export function updateLocalParagraphContent(
  targetParagraphId: string,
  newContentValue: string,
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
): void;
export function updateLocalParagraphContent(
  targetParagraphId: string,
  newContentValue: string,
  updateLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) {
  if (updateLocalParagraphs) {
    try {
      updateLocalParagraphs((previousParagraphs) =>
        previousParagraphs.map((currentParagraph) =>
          currentParagraph.id === targetParagraphId
            ? {
                ...currentParagraph,
                content: newContentValue || '',
                updatedAt: new Date(),
              }
            : currentParagraph
        )
      );
    } catch (contextError) {
      console.error('❌ [CONTEXT] 단락 내용 업데이트 실패:', contextError);
    }
  } else {
    try {
      const editorCoreStoreActions = useEditorCoreStore.getState();
      editorCoreStoreActions.updateParagraphContent(
        targetParagraphId,
        newContentValue || ''
      );
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 내용 업데이트 실패:', zustandError);
    }
  }
}

export function deleteLocalParagraph(targetParagraphId: string): void;
export function deleteLocalParagraph(
  targetParagraphId: string,
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  showToastMessage: (toastData: ToastMessage) => void
): void;
export function deleteLocalParagraph(
  targetParagraphId: string,
  updateLocalParagraphs?: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  showToastMessage?: (toastData: ToastMessage) => void
) {
  if (updateLocalParagraphs && showToastMessage) {
    try {
      updateLocalParagraphs((previousParagraphs) =>
        previousParagraphs.filter(
          (currentParagraph) => currentParagraph.id !== targetParagraphId
        )
      );

      showToastMessage({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    } catch (contextError) {
      console.error('❌ [CONTEXT] 단락 삭제 실패:', contextError);

      if (showToastMessage) {
        showToastMessage({
          title: '삭제 실패',
          description: '단락을 삭제하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  } else {
    try {
      const editorCoreStoreActions = useEditorCoreStore.getState();
      const toastStoreActions = useToastStore.getState();

      editorCoreStoreActions.deleteParagraph(targetParagraphId);

      toastStoreActions.addToast({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 삭제 실패:', zustandError);

      const toastStoreActions = useToastStore.getState();
      toastStoreActions.addToast({
        title: '삭제 실패',
        description: '단락을 삭제하는 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }
}

export function toggleParagraphSelection(targetParagraphId: string): void;
export function toggleParagraphSelection(
  targetParagraphId: string,
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function toggleParagraphSelection(
  targetParagraphId: string,
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >
) {
  if (updateInternalState) {
    try {
      updateInternalState((previousState: EditorInternalState) => {
        const {
          selectedParagraphIds: currentlySelectedIds = [],
          ...restOfState
        } = previousState || {};

        const isCurrentlySelected =
          currentlySelectedIds.includes(targetParagraphId);
        const updatedSelectedIds = isCurrentlySelected
          ? currentlySelectedIds.filter(
              (selectedId) => selectedId !== targetParagraphId
            )
          : [...currentlySelectedIds, targetParagraphId];

        return {
          ...restOfState,
          selectedParagraphIds: updatedSelectedIds,
        };
      });
    } catch (contextError) {
      console.error('❌ [CONTEXT] 단락 선택 토글 실패:', contextError);
    }
  } else {
    try {
      const editorUIStoreActions = useEditorUIStore.getState();
      editorUIStoreActions.toggleParagraphSelection(targetParagraphId);
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 선택 토글 실패:', zustandError);
    }
  }
}

export function addToLocalContainer(): void;
export function addToLocalContainer(
  selectedParagraphIdsList: string[],
  targetContainerIdentifier: string,
  currentLocalParagraphs: LocalParagraph[],
  currentLocalContainers: Container[],
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  updateInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  showToastMessage: (toastData: ToastMessage) => void
): void;
export function addToLocalContainer(
  selectedParagraphIdsList?: string[],
  targetContainerIdentifier?: string,
  currentLocalParagraphs?: LocalParagraph[],
  currentLocalContainers?: Container[],
  updateLocalParagraphs?: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >,
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  showToastMessage?: (toastData: ToastMessage) => void
) {
  if (
    selectedParagraphIdsList &&
    targetContainerIdentifier &&
    currentLocalParagraphs &&
    currentLocalContainers &&
    updateLocalParagraphs &&
    updateInternalState &&
    showToastMessage
  ) {
    try {
      if (!validateParagraphSelection(selectedParagraphIdsList)) {
        showToastMessage({
          title: '선택된 단락 없음',
          description: '컨테이너에 추가할 단락을 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      if (!validateContainerTarget(targetContainerIdentifier)) {
        showToastMessage({
          title: '컨테이너 미선택',
          description: '단락을 추가할 컨테이너를 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      const existingParagraphsInTargetContainer = currentLocalParagraphs.filter(
        (paragraphItem) => {
          const { containerId = null } = paragraphItem || {};
          return containerId === targetContainerIdentifier;
        }
      );

      const lastOrderInContainer =
        existingParagraphsInTargetContainer.length > 0
          ? Math.max(
              ...existingParagraphsInTargetContainer.map(
                ({ order = 0 }) => order
              )
            )
          : -1;

      const selectedValidParagraphs = currentLocalParagraphs.filter(
        (paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};
          return selectedParagraphIdsList.includes(paragraphId);
        }
      );

      const emptyParagraphsList = selectedValidParagraphs.filter(
        (paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem || {};
          return !paragraphContent || paragraphContent.trim().length === 0;
        }
      );

      if (emptyParagraphsList.length > 0) {
        if (emptyParagraphsList.length === selectedValidParagraphs.length) {
          showToastMessage({
            title: '빈 단락 추가됨',
            description: `${emptyParagraphsList.length}개의 빈 단락이 컨테이너에 추가됩니다. 나중에 내용을 입력할 수 있습니다.`,
            color: 'primary',
          });
        }
      }

      const newParagraphCopies: LocalParagraph[] = selectedValidParagraphs.map(
        (originalParagraph, copyIndex) => {
          const { content: originalContent = '', id: originalId = '' } =
            originalParagraph || {};

          return {
            ...originalParagraph,
            id: `paragraph-copy-${Date.now()}-${copyIndex}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            originalId,
            content: originalContent,
            containerId: targetContainerIdentifier,
            order: lastOrderInContainer + copyIndex + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      );

      updateLocalParagraphs((previousParagraphs) => [
        ...previousParagraphs,
        ...newParagraphCopies,
      ]);

      updateInternalState((previousState: EditorInternalState) => ({
        ...previousState,
        selectedParagraphIds: [],
        targetContainerId: '',
      }));

      const targetContainerInfo = currentLocalContainers.find(
        ({ id: containerId = '' }) => containerId === targetContainerIdentifier
      );

      const { name: containerName = '알 수 없는 컨테이너' } =
        targetContainerInfo || {};

      showToastMessage({
        title: '단락 추가 완료',
        description: `${newParagraphCopies.length}개의 단락이 ${containerName} 컨테이너에 추가되었습니다.`,
        color: 'success',
      });
    } catch (contextError) {
      console.error('❌ [CONTEXT] 컨테이너 추가 실패:', contextError);

      if (showToastMessage) {
        showToastMessage({
          title: '추가 실패',
          description: '단락을 컨테이너에 추가하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  } else {
    try {
      const editorUIStoreActions = useEditorUIStore.getState();
      const editorCoreStoreActions = useEditorCoreStore.getState();
      const toastStoreActions = useToastStore.getState();

      const selectedIdsList = editorUIStoreActions.getSelectedParagraphIds();
      const targetContainerIdValue =
        editorUIStoreActions.getTargetContainerId();
      const allCurrentParagraphs = editorCoreStoreActions
        .getParagraphs()
        .map(convertFromZustandParagraph);
      const allCurrentContainers = editorCoreStoreActions
        .getContainers()
        .map(convertFromZustandContainer);

      if (!validateParagraphSelection(selectedIdsList)) {
        toastStoreActions.addToast({
          title: '선택된 단락 없음',
          description: '컨테이너에 추가할 단락을 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      if (!validateContainerTarget(targetContainerIdValue)) {
        toastStoreActions.addToast({
          title: '컨테이너 미선택',
          description: '단락을 추가할 컨테이너를 선택해주세요.',
          color: 'warning',
        });
        return;
      }

      const existingParagraphsInTargetContainer = allCurrentParagraphs.filter(
        (paragraphItem) => {
          const { containerId = null } = paragraphItem || {};
          return containerId === targetContainerIdValue;
        }
      );

      const lastOrderInContainer =
        existingParagraphsInTargetContainer.length > 0
          ? Math.max(
              ...existingParagraphsInTargetContainer.map(
                ({ order = 0 }) => order
              )
            )
          : -1;

      const selectedValidParagraphs = allCurrentParagraphs.filter(
        (paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};
          return selectedIdsList.includes(paragraphId);
        }
      );

      const emptyParagraphsList = selectedValidParagraphs.filter(
        (paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem || {};
          return !paragraphContent || paragraphContent.trim().length === 0;
        }
      );

      if (emptyParagraphsList.length > 0) {
        if (emptyParagraphsList.length === selectedValidParagraphs.length) {
          toastStoreActions.addToast({
            title: '빈 단락 추가됨',
            description: `${emptyParagraphsList.length}개의 빈 단락이 컨테이너에 추가됩니다. 나중에 내용을 입력할 수 있습니다.`,
            color: 'primary',
          });
        }
      }

      const newParagraphCopies: LocalParagraph[] = selectedValidParagraphs.map(
        (originalParagraph, copyIndex) => {
          const { content: originalContent = '', id: originalId = '' } =
            originalParagraph || {};

          return {
            ...originalParagraph,
            id: `paragraph-copy-${Date.now()}-${copyIndex}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            originalId,
            content: originalContent,
            containerId: targetContainerIdValue,
            order: lastOrderInContainer + copyIndex + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      );

      newParagraphCopies.forEach((paragraphCopy) => {
        const zustandParagraphCopy = convertToZustandParagraph(paragraphCopy);
        editorCoreStoreActions.addParagraph(zustandParagraphCopy);
      });

      editorUIStoreActions.clearSelectedParagraphs();

      const targetContainerInfo = allCurrentContainers.find(
        ({ id: containerId = '' }) => containerId === targetContainerIdValue
      );

      const { name: containerName = '알 수 없는 컨테이너' } =
        targetContainerInfo || {};

      toastStoreActions.addToast({
        title: '단락 추가 완료',
        description: `${newParagraphCopies.length}개의 단락이 ${containerName} 컨테이너에 추가되었습니다.`,
        color: 'success',
      });
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 컨테이너 추가 실패:', zustandError);

      const toastStoreActions = useToastStore.getState();
      toastStoreActions.addToast({
        title: '추가 실패',
        description: '단락을 컨테이너에 추가하는 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }
}

export function moveLocalParagraphInContainer(
  targetParagraphId: string,
  moveDirection: 'up' | 'down'
): void;
export function moveLocalParagraphInContainer(
  targetParagraphId: string,
  moveDirection: 'up' | 'down',
  currentLocalParagraphs: LocalParagraph[],
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
): void;
export function moveLocalParagraphInContainer(
  targetParagraphId: string,
  moveDirection: 'up' | 'down',
  currentLocalParagraphs?: LocalParagraph[],
  updateLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) {
  if (currentLocalParagraphs && updateLocalParagraphs) {
    try {
      const targetParagraphToMove = currentLocalParagraphs.find(
        (paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};
          return paragraphId === targetParagraphId;
        }
      );

      if (!targetParagraphToMove || !targetParagraphToMove.containerId) {
        console.warn(
          '⚠️ [CONTEXT] 이동할 단락을 찾을 수 없거나 컨테이너에 할당되지 않음'
        );
        return;
      }

      const paragraphsInSameContainer = currentLocalParagraphs
        .filter((paragraphItem) => {
          const { containerId = null } = paragraphItem || {};
          return containerId === targetParagraphToMove.containerId;
        })
        .sort((firstParagraph, secondParagraph) => {
          const { order: firstOrder = 0 } = firstParagraph || {};
          const { order: secondOrder = 0 } = secondParagraph || {};
          return firstOrder - secondOrder;
        });

      const currentPositionIndex = paragraphsInSameContainer.findIndex(
        (paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};
          return paragraphId === targetParagraphId;
        }
      );

      if (
        (moveDirection === 'up' && currentPositionIndex === 0) ||
        (moveDirection === 'down' &&
          currentPositionIndex === paragraphsInSameContainer.length - 1)
      ) {
        return;
      }

      const targetPositionIndex =
        moveDirection === 'up'
          ? currentPositionIndex - 1
          : currentPositionIndex + 1;
      const swapTargetParagraph =
        paragraphsInSameContainer[targetPositionIndex];

      if (!swapTargetParagraph) {
        console.warn('⚠️ [CONTEXT] 교체할 단락을 찾을 수 없음');
        return;
      }

      updateLocalParagraphs((previousParagraphs) =>
        previousParagraphs.map((paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};

          if (paragraphId === targetParagraphId) {
            return {
              ...paragraphItem,
              order: swapTargetParagraph.order || 0,
            };
          }

          if (paragraphId === swapTargetParagraph.id) {
            return {
              ...paragraphItem,
              order: targetParagraphToMove.order || 0,
            };
          }

          return paragraphItem;
        })
      );
    } catch (contextError) {
      console.error('❌ [CONTEXT] 단락 순서 변경 실패:', contextError);
    }
  } else {
    try {
      const editorCoreStoreActions = useEditorCoreStore.getState();
      const allCurrentParagraphs = editorCoreStoreActions
        .getParagraphs()
        .map(convertFromZustandParagraph);

      const targetParagraphToMove = allCurrentParagraphs.find(
        (paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};
          return paragraphId === targetParagraphId;
        }
      );

      if (!targetParagraphToMove || !targetParagraphToMove.containerId) {
        console.warn(
          '⚠️ [ZUSTAND] 이동할 단락을 찾을 수 없거나 컨테이너에 할당되지 않음'
        );
        return;
      }

      const paragraphsInSameContainer = allCurrentParagraphs
        .filter((paragraphItem) => {
          const { containerId = null } = paragraphItem || {};
          return containerId === targetParagraphToMove.containerId;
        })
        .sort((firstParagraph, secondParagraph) => {
          const { order: firstOrder = 0 } = firstParagraph || {};
          const { order: secondOrder = 0 } = secondParagraph || {};
          return firstOrder - secondOrder;
        });

      const currentPositionIndex = paragraphsInSameContainer.findIndex(
        (paragraphItem) => {
          const { id: paragraphId = '' } = paragraphItem || {};
          return paragraphId === targetParagraphId;
        }
      );

      if (
        (moveDirection === 'up' && currentPositionIndex === 0) ||
        (moveDirection === 'down' &&
          currentPositionIndex === paragraphsInSameContainer.length - 1)
      ) {
        return;
      }

      const targetPositionIndex =
        moveDirection === 'up'
          ? currentPositionIndex - 1
          : currentPositionIndex + 1;
      const swapTargetParagraph =
        paragraphsInSameContainer[targetPositionIndex];

      if (!swapTargetParagraph) {
        console.warn('⚠️ [ZUSTAND] 교체할 단락을 찾을 수 없음');
        return;
      }

      editorCoreStoreActions.updateParagraph(targetParagraphId, {
        order: swapTargetParagraph.order || 0,
      });

      editorCoreStoreActions.updateParagraph(swapTargetParagraph.id, {
        order: targetParagraphToMove.order || 0,
      });
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 순서 변경 실패:', zustandError);
    }
  }
}
