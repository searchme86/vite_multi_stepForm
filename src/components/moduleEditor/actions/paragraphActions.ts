// 📁 actions/paragraphActions.ts

import { LocalParagraph } from '../types/paragraph';
import {
  validateParagraphSelection,
  validateContainerTarget,
  validateParagraphContent,
} from '../utils/validation';

export const addLocalParagraph = (
  localParagraphs: LocalParagraph[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setInternalState: React.Dispatch<React.SetStateAction<any>>
) => {
  console.log('📄 [LOCAL] 새 단락 추가');

  const newParagraph: LocalParagraph = {
    id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: '',
    containerId: null,
    order: localParagraphs.length,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('📄 [LOCAL] 새 단락 생성:', newParagraph.id);

  setLocalParagraphs((prev) => [...prev, newParagraph]);
  setInternalState((prev: any) => ({
    ...prev,
    activeParagraphId: newParagraph.id,
  }));

  console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraph.id);
};

export const updateLocalParagraphContent = (
  paragraphId: string,
  content: string,
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) => {
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
};

export const deleteLocalParagraph = (
  paragraphId: string,
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  addToast: (toast: any) => void
) => {
  console.log('🗑️ [LOCAL] 로컬 단락 삭제:', paragraphId);

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
  console.log('🎯 [SELECTION] 단락 선택 토글:', paragraphId);

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

  console.log('📦 [CONTAINER] 선택된 단락들 처리:', {
    selectedCount: selectedParagraphs.length,
    lastOrder,
  });

  const newParagraphs = selectedParagraphs.map((paragraph, index) => ({
    ...paragraph,
    id: `paragraph-copy-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    originalId: paragraph.id,
    containerId: targetContainerId,
    order: lastOrder + index + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

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
  });

  addToast({
    title: '단락 추가 완료',
    description: `${selectedParagraphs.length}개의 단락이 ${targetContainer?.name} 컨테이너에 추가되었습니다.`,
    color: 'success',
  });
};

export const moveLocalParagraphInContainer = (
  paragraphId: string,
  direction: 'up' | 'down',
  localParagraphs: LocalParagraph[],
  setLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) => {
  console.log('🔄 [MOVE] 단락 이동 시작:', { paragraphId, direction });

  const paragraph = localParagraphs.find((p) => p.id === paragraphId);
  if (!paragraph || !paragraph.containerId) {
    console.log('❌ [MOVE] 단락을 찾을 수 없거나 컨테이너에 할당되지 않음');
    return;
  }

  const containerParagraphs = localParagraphs
    .filter((p) => p.containerId === paragraph.containerId)
    .sort((a, b) => a.order - b.order);

  const currentIndex = containerParagraphs.findIndex(
    (p) => p.id === paragraphId
  );

  console.log('🔄 [MOVE] 현재 위치 확인:', {
    currentIndex,
    totalParagraphs: containerParagraphs.length,
  });

  if (
    (direction === 'up' && currentIndex === 0) ||
    (direction === 'down' && currentIndex === containerParagraphs.length - 1)
  ) {
    console.log('❌ [MOVE] 이동할 수 없는 위치');
    return;
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  const targetParagraph = containerParagraphs[targetIndex];

  console.log('🔄 [MOVE] 이동 실행:', {
    fromOrder: paragraph.order,
    toOrder: targetParagraph.order,
  });

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

  console.log('✅ [MOVE] 단락 이동 완료');
};
