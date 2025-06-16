import { LocalParagraph } from '../../types/paragraph';
import { Container } from '../../types/container';
import { EditorInternalState } from '../../types/editor';
import {
  validateParagraphSelection,
  validateContainerTarget,
} from '../../utils/validation';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

// ✨ [ZUSTAND 추가] 타입 변환 헬퍼 함수들
const convertToZustandParagraph = (
  paragraph: LocalParagraph
): import('../../../../store/shared/commonTypes').ParagraphBlock => {
  return {
    id: paragraph.id,
    content: paragraph.content,
    containerId: paragraph.containerId,
    order: paragraph.order,
    createdAt: paragraph.createdAt,
    updatedAt: paragraph.updatedAt,
  };
};

const convertFromZustandParagraph = (
  paragraph: import('../../../../store/shared/commonTypes').ParagraphBlock
): LocalParagraph => {
  return {
    id: paragraph.id,
    content: paragraph.content,
    containerId: paragraph.containerId,
    order: paragraph.order,
    createdAt: paragraph.createdAt,
    updatedAt: paragraph.updatedAt,
    originalId: undefined, // LocalParagraph 타입에 있는 선택적 속성
  };
};

const convertFromZustandContainer = (
  container: import('../../../../store/shared/commonTypes').Container
): Container => {
  return {
    id: container.id,
    name: container.name,
    order: container.order,
    // createdAt은 기존 Container 타입에 없으므로 제외
  };
};

// ✨ [ZUSTAND 추가] addLocalParagraph 함수 오버로드
export function addLocalParagraph(): void;
export function addLocalParagraph(
  localParagraphs: LocalParagraph[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function addLocalParagraph(
  localParagraphs?: LocalParagraph[],
  setLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  if (localParagraphs && setLocalParagraphs && setInternalState) {
    // ✅ 기존 방식 (context)
    const newParagraph: LocalParagraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      containerId: null,
      order: localParagraphs.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocalParagraphs((prev) => [...prev, newParagraph]);
    setInternalState((prev: EditorInternalState) => ({
      ...prev,
      activeParagraphId: newParagraph.id,
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorCoreStore = useEditorCoreStore.getState();
    const editorUIStore = useEditorUIStore.getState();
    const existingParagraphs = editorCoreStore.getParagraphs();

    const newParagraph: LocalParagraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      containerId: null,
      order: existingParagraphs.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const zustandParagraph = convertToZustandParagraph(newParagraph);
    editorCoreStore.addParagraph(zustandParagraph);
    editorUIStore.setActiveParagraphId(newParagraph.id);
  }
}

// ✨ [ZUSTAND 추가] updateLocalParagraphContent 함수 오버로드
export function updateLocalParagraphContent(
  paragraphId: string,
  content: string
): void;
export function updateLocalParagraphContent(
  paragraphId: string,
  content: string,
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
): void;
export function updateLocalParagraphContent(
  paragraphId: string,
  content: string,
  setLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) {
  console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
    paragraphId,
    contentLength: (content || '').length,
    contentPreview: (content || '').slice(0, 100),
    hasImages: (content || '').includes('!['),
    hasBase64: (content || '').includes('data:image'),
    timestamp: Date.now(),
  });

  if (setLocalParagraphs) {
    // ✅ 기존 방식 (context)
    setLocalParagraphs((prev) =>
      prev.map((p) =>
        p.id === paragraphId
          ? { ...p, content: content || '', updatedAt: new Date() }
          : p
      )
    );
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorCoreStore = useEditorCoreStore.getState();
    editorCoreStore.updateParagraphContent(paragraphId, content || '');
  }
}

// ✨ [ZUSTAND 추가] deleteLocalParagraph 함수 오버로드
export function deleteLocalParagraph(paragraphId: string): void;
export function deleteLocalParagraph(
  paragraphId: string,
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  addToast: (toast: {
    title: string;
    description: string;
    color: string;
  }) => void
): void;
export function deleteLocalParagraph(
  paragraphId: string,
  setLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  addToast?: (toast: {
    title: string;
    description: string;
    color: string;
  }) => void
) {
  if (setLocalParagraphs && addToast) {
    // ✅ 기존 방식 (context)
    setLocalParagraphs((prev) => prev.filter((p) => p.id !== paragraphId));

    addToast({
      title: '단락 삭제',
      description: '선택한 단락이 삭제되었습니다.',
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorCoreStore = useEditorCoreStore.getState();
    const toastStore = useToastStore.getState();

    editorCoreStore.deleteParagraph(paragraphId);

    toastStore.addToast({
      title: '단락 삭제',
      description: '선택한 단락이 삭제되었습니다.',
      color: 'success',
    });
  }
}

// ✨ [ZUSTAND 추가] toggleParagraphSelection 함수 오버로드
export function toggleParagraphSelection(paragraphId: string): void;
export function toggleParagraphSelection(
  paragraphId: string,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
export function toggleParagraphSelection(
  paragraphId: string,
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>
) {
  if (setInternalState) {
    // ✅ 기존 방식 (context)
    setInternalState((prev: EditorInternalState) => ({
      ...prev,
      selectedParagraphIds: prev.selectedParagraphIds.includes(paragraphId)
        ? prev.selectedParagraphIds.filter((id: string) => id !== paragraphId)
        : [...prev.selectedParagraphIds, paragraphId],
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorUIStore = useEditorUIStore.getState();
    editorUIStore.toggleParagraphSelection(paragraphId);
  }
}

// ✨ [ZUSTAND 추가] addToLocalContainer 함수 오버로드
export function addToLocalContainer(): void;
export function addToLocalContainer(
  selectedParagraphIds: string[],
  targetContainerId: string,
  localParagraphs: LocalParagraph[],
  localContainers: Container[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>,
  addToast: (toast: {
    title: string;
    description: string;
    color: string;
  }) => void
): void;
export function addToLocalContainer(
  selectedParagraphIds?: string[],
  targetContainerId?: string,
  localParagraphs?: LocalParagraph[],
  localContainers?: Container[],
  setLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState?: React.Dispatch<React.SetStateAction<EditorInternalState>>,
  addToast?: (toast: {
    title: string;
    description: string;
    color: string;
  }) => void
) {
  if (
    selectedParagraphIds &&
    targetContainerId &&
    localParagraphs &&
    localContainers &&
    setLocalParagraphs &&
    setInternalState &&
    addToast
  ) {
    // ✅ 기존 방식 (context)
    console.log('📦 [CONTAINER] 컨테이너에 단락 추가 시작:', {
      selectedCount: selectedParagraphIds.length,
      targetContainerId,
      timestamp: Date.now(),
    });

    if (!validateParagraphSelection(selectedParagraphIds)) {
      addToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!validateContainerTarget(targetContainerId)) {
      addToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const existingParagraphs = localParagraphs.filter(
      (p) => p.containerId === targetContainerId
    );
    const lastOrder =
      existingParagraphs.length > 0
        ? Math.max(...existingParagraphs.map((p) => p.order))
        : -1;

    const selectedParagraphs = localParagraphs.filter((p) =>
      selectedParagraphIds.includes(p.id)
    );

    console.log('📦 [CONTAINER] 선택된 단락들 상태 확인:', {
      selectedCount: selectedParagraphs.length,
      paragraphStates: selectedParagraphs.map((p) => ({
        id: p.id,
        contentLength: p.content.length,
        hasImages: p.content.includes('!['),
        preview: p.content.slice(0, 50),
        isEmpty: !p.content || p.content.trim().length === 0,
      })),
      lastOrder,
      timestamp: Date.now(),
    });

    const emptyParagraphs = selectedParagraphs.filter(
      (p) => !p.content || p.content.trim().length === 0
    );

    console.log('📦 [CONTAINER] 빈 단락 체크:', {
      emptyCount: emptyParagraphs.length,
      emptyParagraphIds: emptyParagraphs.map((p) => p.id),
      willBlock: emptyParagraphs.length > 0,
    });

    if (emptyParagraphs.length > 0) {
      console.log(
        '❌ [CONTAINER] 빈 단락으로 인한 차단:',
        emptyParagraphs.length
      );
      addToast({
        title: '빈 단락 포함',
        description: '내용이 없는 단락은 컨테이너에 추가할 수 없습니다.',
        color: 'warning',
      });
      return;
    }

    const newParagraphs: LocalParagraph[] = selectedParagraphs.map(
      (paragraph, index) => {
        console.log('✅ [CONTAINER] 단락 복사 생성:', {
          originalId: paragraph.id,
          contentLength: paragraph.content.length,
          hasImages: paragraph.content.includes('!['),
          preview: paragraph.content.slice(0, 100),
        });

        return {
          ...paragraph,
          id: `paragraph-copy-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          originalId: paragraph.id,
          content: paragraph.content,
          containerId: targetContainerId,
          order: lastOrder + index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    );

    setLocalParagraphs((prev) => [...prev, ...newParagraphs]);

    setInternalState((prev: EditorInternalState) => ({
      ...prev,
      selectedParagraphIds: [],
      targetContainerId: '',
    }));

    const targetContainer = localContainers.find(
      (c) => c.id === targetContainerId
    );

    console.log('✅ [CONTAINER] 단락 추가 완료:', {
      addedCount: newParagraphs.length,
      targetContainer: targetContainer?.name,
      addedParagraphs: newParagraphs.map((p) => ({
        id: p.id,
        contentLength: p.content.length,
        hasImages: p.content.includes('!['),
        preview: p.content.slice(0, 50),
      })),
      timestamp: Date.now(),
    });

    addToast({
      title: '단락 추가 완료',
      description: `${newParagraphs.length}개의 단락이 ${targetContainer?.name} 컨테이너에 추가되었습니다.`,
      color: 'success',
    });
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorUIStore = useEditorUIStore.getState();
    const editorCoreStore = useEditorCoreStore.getState();
    const toastStore = useToastStore.getState();

    const selectedIds = editorUIStore.getSelectedParagraphIds();
    const targetId = editorUIStore.getTargetContainerId();
    const allParagraphs = editorCoreStore
      .getParagraphs()
      .map(convertFromZustandParagraph);
    const allContainers = editorCoreStore
      .getContainers()
      .map(convertFromZustandContainer);

    console.log('📦 [CONTAINER] 컨테이너에 단락 추가 시작 (Zustand):', {
      selectedCount: selectedIds.length,
      targetContainerId: targetId,
      timestamp: Date.now(),
    });

    if (!validateParagraphSelection(selectedIds)) {
      toastStore.addToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!validateContainerTarget(targetId)) {
      toastStore.addToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    const existingParagraphs = allParagraphs.filter(
      (p) => p.containerId === targetId
    );
    const lastOrder =
      existingParagraphs.length > 0
        ? Math.max(...existingParagraphs.map((p) => p.order))
        : -1;

    const selectedParagraphs = allParagraphs.filter((p) =>
      selectedIds.includes(p.id)
    );

    console.log('📦 [CONTAINER] 선택된 단락들 상태 확인 (Zustand):', {
      selectedCount: selectedParagraphs.length,
      paragraphStates: selectedParagraphs.map((p) => ({
        id: p.id,
        contentLength: p.content.length,
        hasImages: p.content.includes('!['),
        preview: p.content.slice(0, 50),
        isEmpty: !p.content || p.content.trim().length === 0,
      })),
      lastOrder,
      timestamp: Date.now(),
    });

    const emptyParagraphs = selectedParagraphs.filter(
      (p) => !p.content || p.content.trim().length === 0
    );

    console.log('📦 [CONTAINER] 빈 단락 체크 (Zustand):', {
      emptyCount: emptyParagraphs.length,
      emptyParagraphIds: emptyParagraphs.map((p) => p.id),
      willBlock: emptyParagraphs.length > 0,
    });

    if (emptyParagraphs.length > 0) {
      console.log(
        '❌ [CONTAINER] 빈 단락으로 인한 차단 (Zustand):',
        emptyParagraphs.length
      );
      toastStore.addToast({
        title: '빈 단락 포함',
        description: '내용이 없는 단락은 컨테이너에 추가할 수 없습니다.',
        color: 'warning',
      });
      return;
    }

    const newParagraphs: LocalParagraph[] = selectedParagraphs.map(
      (paragraph, index) => {
        console.log('✅ [CONTAINER] 단락 복사 생성 (Zustand):', {
          originalId: paragraph.id,
          contentLength: paragraph.content.length,
          hasImages: paragraph.content.includes('!['),
          preview: paragraph.content.slice(0, 100),
        });

        return {
          ...paragraph,
          id: `paragraph-copy-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          originalId: paragraph.id,
          content: paragraph.content,
          containerId: targetId,
          order: lastOrder + index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    );

    // zustand 스토어에 새 단락들 추가
    newParagraphs.forEach((paragraph) => {
      const zustandParagraph = convertToZustandParagraph(paragraph);
      editorCoreStore.addParagraph(zustandParagraph);
    });

    // UI 상태 초기화
    editorUIStore.clearSelectedParagraphs();

    const targetContainer = allContainers.find((c) => c.id === targetId);

    console.log('✅ [CONTAINER] 단락 추가 완료 (Zustand):', {
      addedCount: newParagraphs.length,
      targetContainer: targetContainer?.name,
      addedParagraphs: newParagraphs.map((p) => ({
        id: p.id,
        contentLength: p.content.length,
        hasImages: p.content.includes('!['),
        preview: p.content.slice(0, 50),
      })),
      timestamp: Date.now(),
    });

    toastStore.addToast({
      title: '단락 추가 완료',
      description: `${newParagraphs.length}개의 단락이 ${targetContainer?.name} 컨테이너에 추가되었습니다.`,
      color: 'success',
    });
  }
}

// ✨ [ZUSTAND 추가] moveLocalParagraphInContainer 함수 오버로드
export function moveLocalParagraphInContainer(
  paragraphId: string,
  direction: 'up' | 'down'
): void;
export function moveLocalParagraphInContainer(
  paragraphId: string,
  direction: 'up' | 'down',
  localParagraphs: LocalParagraph[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
): void;
export function moveLocalParagraphInContainer(
  paragraphId: string,
  direction: 'up' | 'down',
  localParagraphs?: LocalParagraph[],
  setLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) {
  if (localParagraphs && setLocalParagraphs) {
    // ✅ 기존 방식 (context)
    const paragraph = localParagraphs.find((p) => p.id === paragraphId);
    if (!paragraph || !paragraph.containerId) {
      return;
    }

    const containerParagraphs = localParagraphs
      .filter((p) => p.containerId === paragraph.containerId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = containerParagraphs.findIndex(
      (p) => p.id === paragraphId
    );

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === containerParagraphs.length - 1)
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
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand)
    const editorCoreStore = useEditorCoreStore.getState();
    const allParagraphs = editorCoreStore
      .getParagraphs()
      .map(convertFromZustandParagraph);

    const paragraph = allParagraphs.find((p) => p.id === paragraphId);
    if (!paragraph || !paragraph.containerId) {
      return;
    }

    const containerParagraphs = allParagraphs
      .filter((p) => p.containerId === paragraph.containerId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = containerParagraphs.findIndex(
      (p) => p.id === paragraphId
    );

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === containerParagraphs.length - 1)
    ) {
      return;
    }

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetParagraph = containerParagraphs[targetIndex];

    // 두 단락의 order를 교환
    editorCoreStore.updateParagraph(paragraphId, {
      order: targetParagraph.order,
    });
    editorCoreStore.updateParagraph(targetParagraph.id, {
      order: paragraph.order,
    });
  }
}
