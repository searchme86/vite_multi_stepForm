// 📁 src/components/moduleEditor/actions/paragraphActions/paragraphActionsZustand.ts

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

// 🆕 관대한 콘텐츠 검증
const hasValidContent = (paragraphContent: string): boolean => {
  if (!paragraphContent || typeof paragraphContent !== 'string') {
    return false;
  }

  const trimmedContent = paragraphContent.trim();
  if (trimmedContent.length === 0) return false;

  // HTML 태그 제거 후 실제 텍스트 확인
  const textContent = trimmedContent.replace(/<[^>]*>/g, '').trim();

  // 이미지, 링크 등 미디어 콘텐츠 확인
  const hasMedia =
    trimmedContent.includes('![') ||
    trimmedContent.includes('](') ||
    trimmedContent.includes('<img');

  // 플레이스홀더 확인
  const hasPlaceholder =
    trimmedContent.includes('여기에 내용을 입력하세요') ||
    trimmedContent.includes('마크다운을 작성해보세요') ||
    trimmedContent.includes('텍스트를 입력하세요');

  // 미디어가 있거나, 텍스트가 있고 플레이스홀더가 아닌 경우
  return hasMedia || (textContent.length > 0 && !hasPlaceholder);
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
  console.log('➕ [PARAGRAPH_ACTIONS_ZUSTAND] 새 단락 추가 요청:', {
    hasContext: !!(
      currentLocalParagraphs &&
      updateLocalParagraphs &&
      updateInternalState
    ),
    timestamp: new Date().toISOString(),
  });

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

      console.log('✅ [CONTEXT] 새 단락 추가 성공:', newParagraphToAdd.id);
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

      console.log('✅ [ZUSTAND] 새 단락 추가 성공:', newParagraphToAdd.id);
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
  console.log('📝 [PARAGRAPH_ACTIONS_ZUSTAND] 단락 내용 업데이트 시작:', {
    paragraphId: targetParagraphId,
    contentLength: newContentValue?.length || 0,
    hasContext: !!updateLocalParagraphs,
    contentPreview:
      newContentValue?.substring(0, 100) +
      (newContentValue?.length > 100 ? '...' : ''),
    isValidContent: hasValidContent(newContentValue),
    timestamp: new Date().toISOString(),
  });

  if (!targetParagraphId || typeof targetParagraphId !== 'string') {
    console.error(
      '❌ [PARAGRAPH_ACTIONS_ZUSTAND] 유효하지 않은 단락 ID:',
      targetParagraphId
    );
    return;
  }

  if (typeof newContentValue !== 'string') {
    console.error('❌ [PARAGRAPH_ACTIONS_ZUSTAND] 유효하지 않은 내용:', {
      content: newContentValue,
      type: typeof newContentValue,
    });
    return;
  }

  // 🆕 빈 내용이어도 허용 (사용자가 타이핑 중일 수 있음)
  const sanitizedContent = newContentValue || '';

  if (updateLocalParagraphs) {
    try {
      updateLocalParagraphs((previousParagraphs) =>
        previousParagraphs.map((currentParagraph) => {
          if (currentParagraph.id === targetParagraphId) {
            if (currentParagraph.content === sanitizedContent) {
              console.log('ℹ️ [CONTEXT] 동일한 내용, 업데이트 스킵');
              return currentParagraph;
            }

            console.log('🔄 [CONTEXT] 단락 내용 업데이트:', {
              paragraphId: targetParagraphId,
              oldLength: currentParagraph.content?.length || 0,
              newLength: sanitizedContent?.length || 0,
              isValid: hasValidContent(sanitizedContent),
            });

            return {
              ...currentParagraph,
              content: sanitizedContent,
              updatedAt: new Date(),
            };
          }
          return currentParagraph;
        })
      );

      console.log('✅ [CONTEXT] 단락 내용 업데이트 성공');
    } catch (contextError) {
      console.error('❌ [CONTEXT] 단락 내용 업데이트 실패:', contextError);
    }
  } else {
    try {
      const editorCoreStoreActions = useEditorCoreStore.getState();
      const editorUIStoreActions = useEditorUIStore.getState();

      const existingParagraph = editorCoreStoreActions.paragraphs?.find(
        (p) => p.id === targetParagraphId
      );

      if (!existingParagraph) {
        console.warn('⚠️ [ZUSTAND] 존재하지 않는 단락:', targetParagraphId);
        return;
      }

      if (existingParagraph.content === sanitizedContent) {
        console.log('ℹ️ [ZUSTAND] 동일한 내용, 업데이트 스킵');
        return;
      }

      console.log('🔄 [ZUSTAND] 단락 내용 업데이트:', {
        paragraphId: targetParagraphId,
        oldLength: existingParagraph.content?.length || 0,
        newLength: sanitizedContent?.length || 0,
        isValid: hasValidContent(sanitizedContent),
      });

      const updateResult = editorCoreStoreActions.updateParagraphContent(
        targetParagraphId,
        sanitizedContent
      );

      if (editorUIStoreActions.activeParagraphId !== targetParagraphId) {
        editorUIStoreActions.setActiveParagraphId(targetParagraphId);
        console.log('🎯 [ZUSTAND] 업데이트 후 단락 활성화');
      }

      console.log('✅ [ZUSTAND] 단락 내용 업데이트 성공:', {
        paragraphId: targetParagraphId,
        contentLength: sanitizedContent?.length || 0,
        updateResult,
        isValid: hasValidContent(sanitizedContent),
      });

      // 🆕 유효한 내용이 있을 때만 성공 토스트
      if (hasValidContent(sanitizedContent) && sanitizedContent.length > 50) {
        const toastStoreActions = useToastStore.getState();
        toastStoreActions.addToast({
          title: '자동 저장됨',
          description: `단락 내용이 저장되었습니다. (${sanitizedContent.length}자)`,
          color: 'primary',
        });
      }
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 내용 업데이트 실패:', zustandError);

      const toastStoreActions = useToastStore.getState();
      toastStoreActions.addToast({
        title: '저장 실패',
        description: '단락 내용 저장 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }
}

// 🆕 실시간 동기화 함수 추가
export function syncParagraphContentToStore(
  targetParagraphId: string,
  currentContent: string
): void {
  try {
    const editorCoreStoreActions = useEditorCoreStore.getState();
    const existingParagraph = editorCoreStoreActions.paragraphs?.find(
      (p) => p.id === targetParagraphId
    );

    if (existingParagraph && existingParagraph.content !== currentContent) {
      console.log('🔄 [SYNC] 실시간 동기화 실행:', {
        paragraphId: targetParagraphId,
        oldContent: existingParagraph.content?.substring(0, 30),
        newContent: currentContent?.substring(0, 30),
        contentLength: currentContent?.length || 0,
      });

      editorCoreStoreActions.updateParagraphContent(
        targetParagraphId,
        currentContent
      );
      console.log('✅ [SYNC] 실시간 동기화 완료');
    }
  } catch (error) {
    console.error('❌ [SYNC] 실시간 동기화 실패:', error);
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
  console.log('🗑️ [PARAGRAPH_ACTIONS_ZUSTAND] 단락 삭제 요청:', {
    paragraphId: targetParagraphId,
    hasContext: !!(updateLocalParagraphs && showToastMessage),
  });

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

      console.log('✅ [CONTEXT] 단락 삭제 성공');
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
      const editorUIStoreActions = useEditorUIStore.getState();
      const toastStoreActions = useToastStore.getState();

      const paragraphToDelete = editorCoreStoreActions.paragraphs?.find(
        (p) => p.id === targetParagraphId
      );

      if (!paragraphToDelete) {
        console.warn(
          '⚠️ [ZUSTAND] 삭제할 단락을 찾을 수 없음:',
          targetParagraphId
        );
        toastStoreActions.addToast({
          title: '단락 없음',
          description: '삭제할 단락을 찾을 수 없습니다.',
          color: 'warning',
        });
        return;
      }

      editorCoreStoreActions.deleteParagraph(targetParagraphId);

      if (editorUIStoreActions.activeParagraphId === targetParagraphId) {
        editorUIStoreActions.setActiveParagraphId(null);
        console.log('🧹 [ZUSTAND] 활성 단락 상태 초기화');
      }

      if (
        editorUIStoreActions.selectedParagraphIds?.includes(targetParagraphId)
      ) {
        const newSelectedIds = editorUIStoreActions.selectedParagraphIds.filter(
          (id) => id !== targetParagraphId
        );
        editorUIStoreActions.setSelectedParagraphIds(newSelectedIds);
        console.log('🧹 [ZUSTAND] 선택 목록에서 제거');
      }

      toastStoreActions.addToast({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });

      console.log('✅ [ZUSTAND] 단락 삭제 성공');
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
  console.log('☑️ [PARAGRAPH_ACTIONS_ZUSTAND] 단락 선택 토글:', {
    paragraphId: targetParagraphId,
    hasContext: !!updateInternalState,
  });

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

        console.log('✅ [CONTEXT] 선택 상태 토글 완료:', {
          paragraphId: targetParagraphId,
          wasSelected: isCurrentlySelected,
          newSelectedCount: updatedSelectedIds.length,
        });

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
      const currentSelected = editorUIStoreActions.selectedParagraphIds || [];
      const isCurrentlySelected = currentSelected.includes(targetParagraphId);

      editorUIStoreActions.toggleParagraphSelection(targetParagraphId);

      console.log('✅ [ZUSTAND] 선택 상태 토글 완료:', {
        paragraphId: targetParagraphId,
        wasSelected: isCurrentlySelected,
        newSelectedCount: isCurrentlySelected
          ? currentSelected.length - 1
          : currentSelected.length + 1,
      });
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
  console.log('📂 [PARAGRAPH_ACTIONS_ZUSTAND] 컨테이너에 추가 요청:', {
    hasContext: !!(
      selectedParagraphIdsList &&
      targetContainerIdentifier &&
      currentLocalParagraphs
    ),
    selectedCount: selectedParagraphIdsList?.length || 0,
    targetContainer: targetContainerIdentifier,
  });

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

      // 🆕 관대한 검증 적용
      const validParagraphs = selectedValidParagraphs.filter(
        (paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem || {};
          return (
            hasValidContent(paragraphContent) ||
            paragraphContent.trim().length === 0
          ); // 빈 내용도 허용
        }
      );

      const emptyParagraphsList = selectedValidParagraphs.filter(
        (paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem || {};
          return !paragraphContent || paragraphContent.trim().length === 0;
        }
      );

      if (emptyParagraphsList.length > 0) {
        showToastMessage({
          title: '빈 단락 포함',
          description: `${emptyParagraphsList.length}개의 빈 단락이 포함됩니다. 나중에 내용을 입력할 수 있습니다.`,
          color: 'primary',
        });
      }

      const newParagraphCopies: LocalParagraph[] = validParagraphs.map(
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

      console.log('✅ [CONTEXT] 컨테이너에 단락 추가 성공');
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

      // 🆕 관대한 검증 적용
      const validParagraphs = selectedValidParagraphs.filter(
        (paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem || {};
          return (
            hasValidContent(paragraphContent) ||
            paragraphContent.trim().length === 0
          ); // 빈 내용도 허용
        }
      );

      const emptyParagraphsList = selectedValidParagraphs.filter(
        (paragraphItem) => {
          const { content: paragraphContent = '' } = paragraphItem || {};
          return !paragraphContent || paragraphContent.trim().length === 0;
        }
      );

      if (emptyParagraphsList.length > 0) {
        toastStoreActions.addToast({
          title: '빈 단락 포함',
          description: `${emptyParagraphsList.length}개의 빈 단락이 포함됩니다. 나중에 내용을 입력할 수 있습니다.`,
          color: 'primary',
        });
      }

      const newParagraphCopies: LocalParagraph[] = validParagraphs.map(
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

      console.log('✅ [ZUSTAND] 컨테이너에 단락 추가 성공');
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
  console.log('↕️ [PARAGRAPH_ACTIONS_ZUSTAND] 단락 순서 변경:', {
    paragraphId: targetParagraphId,
    direction: moveDirection,
    hasContext: !!(currentLocalParagraphs && updateLocalParagraphs),
  });

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
        console.log('ℹ️ [CONTEXT] 이동할 수 없는 위치 (경계)');
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

      console.log('✅ [CONTEXT] 단락 순서 변경 성공');
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
        console.log('ℹ️ [ZUSTAND] 이동할 수 없는 위치 (경계)');
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

      console.log('✅ [ZUSTAND] 단락 순서 변경 성공');
    } catch (zustandError) {
      console.error('❌ [ZUSTAND] 단락 순서 변경 실패:', zustandError);
    }
  }
}
