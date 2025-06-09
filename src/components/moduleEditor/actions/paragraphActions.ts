import { LocalParagraph } from '../types/paragraph';
import {
  validateParagraphSelection,
  validateContainerTarget,
} from '../utils/validation';

export const addLocalParagraph = (
  localParagraphs: LocalParagraph[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState: React.Dispatch<React.SetStateAction<any>>
) => {
  const newParagraph: LocalParagraph = {
    id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: '',
    containerId: null,
    order: localParagraphs.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  setLocalParagraphs((prev) => [...prev, newParagraph]);
  setInternalState((prev: any) => ({
    ...prev,
    activeParagraphId: newParagraph.id,
  }));
};

export const updateLocalParagraphContent = (
  paragraphId: string,
  content: string,
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) => {
  console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
    paragraphId,
    contentLength: (content || '').length,
    contentPreview: (content || '').slice(0, 100),
    hasImages: (content || '').includes('!['),
    hasBase64: (content || '').includes('data:image'),
    timestamp: Date.now(),
  });

  setLocalParagraphs((prev) =>
    prev.map((p) =>
      p.id === paragraphId
        ? { ...p, content: content || '', updatedAt: new Date() }
        : p
    )
  );
};

export const deleteLocalParagraph = (
  paragraphId: string,
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  addToast: (toast: any) => void
) => {
  setLocalParagraphs((prev) => prev.filter((p) => p.id !== paragraphId));

  addToast({
    title: '단락 삭제',
    description: '선택한 단락이 삭제되었습니다.',
    color: 'success',
  });
};

export const toggleParagraphSelection = (
  paragraphId: string,
  setInternalState: React.Dispatch<React.SetStateAction<any>>
) => {
  setInternalState((prev: any) => ({
    ...prev,
    selectedParagraphIds: prev.selectedParagraphIds.includes(paragraphId)
      ? prev.selectedParagraphIds.filter((id: string) => id !== paragraphId)
      : [...prev.selectedParagraphIds, paragraphId],
  }));
};

export const addToLocalContainer = (
  selectedParagraphIds: string[],
  targetContainerId: string,
  localParagraphs: LocalParagraph[],
  localContainers: any[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState: React.Dispatch<React.SetStateAction<any>>,
  addToast: (toast: any) => void
) => {
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

  setInternalState((prev: any) => ({
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
};

export const moveLocalParagraphInContainer = (
  paragraphId: string,
  direction: 'up' | 'down',
  localParagraphs: LocalParagraph[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) => {
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

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
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
};
