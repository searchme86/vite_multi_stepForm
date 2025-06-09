// 📁 store/paragraphState.ts

import { useState, useCallback } from 'react';
import { LocalParagraph } from '../types/paragraph';

interface ParagraphSelection {
  selectedIds: string[];
  targetContainerId: string;
  activeParagraphId: string | null;
}

const initialSelection: ParagraphSelection = {
  selectedIds: [],
  targetContainerId: '',
  activeParagraphId: null,
};

export function useParagraphState() {
  console.log('📄 [PARAGRAPH_STATE] useParagraphState 훅 초기화');

  const [paragraphs, setParagraphsState] = useState<LocalParagraph[]>([]);
  const [selection, setSelection] =
    useState<ParagraphSelection>(initialSelection);

  console.log('📄 [PARAGRAPH_STATE] 현재 단락 상태:', {
    총단락수: paragraphs.length,
    선택된단락: selection.selectedIds.length,
    활성단락: selection.activeParagraphId,
    대상컨테이너: selection.targetContainerId,
    할당된단락: paragraphs.filter((p) => p.containerId).length,
    미할당단락: paragraphs.filter((p) => !p.containerId).length,
  });

  const setParagraphs = useCallback(
    (newParagraphs: LocalParagraph[]) => {
      console.log('📄 [PARAGRAPH_STATE] 전체 단락 설정:', {
        이전개수: paragraphs.length,
        새개수: newParagraphs.length,
      });

      setParagraphsState(newParagraphs);
    },
    [paragraphs.length]
  );

  const addParagraph = useCallback((paragraph: LocalParagraph) => {
    console.log('📄 [PARAGRAPH_STATE] 단락 추가:', {
      id: paragraph.id,
      containerId: paragraph.containerId,
      order: paragraph.order,
      contentLength: paragraph.content.length,
    });

    setParagraphsState((prev) => [...prev, paragraph]);
  }, []);

  const updateParagraph = useCallback(
    (id: string, updates: Partial<LocalParagraph>) => {
      console.log('📄 [PARAGRAPH_STATE] 단락 업데이트:', {
        id,
        업데이트필드: Object.keys(updates),
        contentLength: updates.content?.length,
      });

      setParagraphsState((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        )
      );
    },
    []
  );

  const deleteParagraph = useCallback((id: string) => {
    console.log('📄 [PARAGRAPH_STATE] 단락 삭제:', { id });

    setParagraphsState((prev) => prev.filter((p) => p.id !== id));

    setSelection((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.filter((selectedId) => selectedId !== id),
      activeParagraphId:
        prev.activeParagraphId === id ? null : prev.activeParagraphId,
    }));
  }, []);

  const selectParagraph = useCallback((id: string) => {
    console.log('📄 [PARAGRAPH_STATE] 단락 선택:', { id });

    setSelection((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(id)
        ? prev.selectedIds
        : [...prev.selectedIds, id],
    }));
  }, []);

  const deselectParagraph = useCallback((id: string) => {
    console.log('📄 [PARAGRAPH_STATE] 단락 선택 해제:', { id });

    setSelection((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.filter((selectedId) => selectedId !== id),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    console.log('📄 [PARAGRAPH_STATE] 전체 선택 해제');

    setSelection((prev) => ({
      ...prev,
      selectedIds: [],
      targetContainerId: '',
    }));
  }, []);

  const setTargetContainer = useCallback((containerId: string) => {
    console.log('📄 [PARAGRAPH_STATE] 대상 컨테이너 설정:', { containerId });

    setSelection((prev) => ({
      ...prev,
      targetContainerId: containerId,
    }));
  }, []);

  const setActiveParagraph = useCallback((id: string | null) => {
    console.log('📄 [PARAGRAPH_STATE] 활성 단락 설정:', { id });

    setSelection((prev) => ({
      ...prev,
      activeParagraphId: id,
    }));
  }, []);

  const getUnassignedParagraphs = useCallback(() => {
    const unassigned = paragraphs.filter((p) => !p.containerId);

    console.log('📄 [PARAGRAPH_STATE] 미할당 단락 조회:', {
      전체단락: paragraphs.length,
      미할당단락: unassigned.length,
    });

    return unassigned;
  }, [paragraphs]);

  const getParagraphsByContainer = useCallback(
    (containerId: string) => {
      const containerParagraphs = paragraphs
        .filter((p) => p.containerId === containerId)
        .sort((a, b) => a.order - b.order);

      console.log('📄 [PARAGRAPH_STATE] 컨테이너별 단락 조회:', {
        containerId,
        단락수: containerParagraphs.length,
        단락순서: containerParagraphs.map((p) => p.order),
      });

      return containerParagraphs;
    },
    [paragraphs]
  );

  console.log('✅ [PARAGRAPH_STATE] useParagraphState 훅 준비 완료');

  return {
    paragraphs,
    selection,
    setParagraphs,
    addParagraph,
    updateParagraph,
    deleteParagraph,
    selectParagraph,
    deselectParagraph,
    clearSelection,
    setTargetContainer,
    setActiveParagraph,
    getUnassignedParagraphs,
    getParagraphsByContainer,
  };
}
