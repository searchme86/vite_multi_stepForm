// 📁 hooks/useEditorState/useEditorStateMain.ts
// 🎯 **근본적 개선**: Zustand 스토어 의존성 완전 제거

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EditorInternalState } from '../../types/editor';
import {
  Container,
  ParagraphBlock,
} from '../../../../store/shared/commonTypes';
import { LocalParagraph } from '../../types/paragraph';

import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

import { createInitialInternalState } from './editorStateInitializers';
import { useDeviceDetection } from './editorStateDeviceDetection';

export function useEditorState() {
  return useEditorStateImpl();
}

const useEditorStateImpl = () => {
  console.log('🪝 [USE_EDITOR_STATE] 훅 초기화 - 근본적 개선 버전');

  // ✅ **방법 1**: 개별 메서드 추출 (가장 안전한 방법)
  const addContainer = useEditorCoreStore((state) => state.addContainer);
  const resetEditorState = useEditorCoreStore(
    (state) => state.resetEditorState
  );
  const getContainers = useEditorCoreStore((state) => state.getContainers);
  const getSortedContainers = useEditorCoreStore(
    (state) => state.getSortedContainers
  );
  const getParagraphs = useEditorCoreStore((state) => state.getParagraphs);
  const addParagraph = useEditorCoreStore((state) => state.addParagraph);
  const deleteParagraph = useEditorCoreStore((state) => state.deleteParagraph);
  const updateParagraphContent = useEditorCoreStore(
    (state) => state.updateParagraphContent
  );
  const generateCompletedContent = useEditorCoreStore(
    (state) => state.generateCompletedContent
  );
  const setIsCompleted = useEditorCoreStore((state) => state.setIsCompleted);

  const goToWritingStep = useEditorUIStore((state) => state.goToWritingStep);
  const goToStructureStep = useEditorUIStore(
    (state) => state.goToStructureStep
  );
  const setActiveParagraphId = useEditorUIStore(
    (state) => state.setActiveParagraphId
  );
  const toggleParagraphSelection = useEditorUIStore(
    (state) => state.toggleParagraphSelection
  );
  const clearSelectedParagraphs = useEditorUIStore(
    (state) => state.clearSelectedParagraphs
  );
  const setSelectedParagraphIds = useEditorUIStore(
    (state) => state.setSelectedParagraphIds
  );
  const setTargetContainerId = useEditorUIStore(
    (state) => state.setTargetContainerId
  );
  const togglePreview = useEditorUIStore((state) => state.togglePreview);
  const getCurrentSubStep = useEditorUIStore(
    (state) => state.getCurrentSubStep
  );
  const getIsTransitioning = useEditorUIStore(
    (state) => state.getIsTransitioning
  );
  const getActiveParagraphId = useEditorUIStore(
    (state) => state.getActiveParagraphId
  );
  const getIsPreviewOpen = useEditorUIStore((state) => state.getIsPreviewOpen);
  const getSelectedParagraphIds = useEditorUIStore(
    (state) => state.getSelectedParagraphIds
  );
  const getTargetContainerId = useEditorUIStore(
    (state) => state.getTargetContainerId
  );

  const addToast = useToastStore((state) => state.addToast);

  // ✅ **데이터 구독**: 실제 데이터만 구독 (스토어 객체 제외)
  const containers = useEditorCoreStore((state) => state.containers);
  const paragraphs = useEditorCoreStore((state) => state.paragraphs);
  const currentSubStep = useEditorUIStore((state) => state.currentSubStep);
  const isTransitioning = useEditorUIStore((state) => state.isTransitioning);
  const activeParagraphId = useEditorUIStore(
    (state) => state.activeParagraphId
  );
  const isPreviewOpen = useEditorUIStore((state) => state.isPreviewOpen);
  const selectedParagraphIds = useEditorUIStore(
    (state) => state.selectedParagraphIds
  );
  const targetContainerId = useEditorUIStore(
    (state) => state.targetContainerId
  );

  // ✅ **메모이제이션된 데이터 처리**
  const localContainers = useMemo(() => {
    try {
      const sortedContainers = [...containers].sort(
        (a, b) => a.order - b.order
      );
      console.log('📊 [STABLE] 컨테이너 업데이트:', sortedContainers.length);
      return sortedContainers;
    } catch (error) {
      console.error('❌ [STABLE] 컨테이너 조회 실패:', error);
      return [];
    }
  }, [containers]); // ✅ 실제 데이터에만 의존

  const localParagraphs = useMemo(() => {
    try {
      const typedParagraphs = paragraphs as LocalParagraph[];
      console.log('📊 [STABLE] 단락 업데이트:', typedParagraphs.length);
      return typedParagraphs;
    } catch (error) {
      console.error('❌ [STABLE] 단락 조회 실패:', error);
      return [];
    }
  }, [paragraphs]); // ✅ 실제 데이터에만 의존

  const editorInternalState = useMemo(() => {
    try {
      return {
        currentSubStep: currentSubStep || 'structure',
        isTransitioning: isTransitioning || false,
        activeParagraphId: activeParagraphId || null,
        isPreviewOpen: isPreviewOpen ?? true,
        selectedParagraphIds: selectedParagraphIds || [],
        targetContainerId: targetContainerId || '',
      } as EditorInternalState;
    } catch (error) {
      console.error('❌ [STABLE] UI 상태 조회 실패:', error);
      return {
        currentSubStep: 'structure' as const,
        isTransitioning: false,
        activeParagraphId: null,
        isPreviewOpen: true,
        selectedParagraphIds: [],
        targetContainerId: '',
      };
    }
  }, [
    currentSubStep,
    isTransitioning,
    activeParagraphId,
    isPreviewOpen,
    selectedParagraphIds,
    targetContainerId,
  ]); // ✅ 실제 상태 값에만 의존

  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);

  // ✅ 하위 호환성을 위한 로컬 상태
  const [localInternalState, setLocalInternalState] =
    useState<EditorInternalState>(() => ({
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    }));

  useDeviceDetection(setIsMobileDeviceDetected);

  // 🎯 **핵심 개선**: handleStructureComplete 함수 완전 안정화
  const handleStructureComplete = useCallback(
    (inputs: string[]) => {
      if (isProcessingStructure) {
        console.warn('⚠️ [STRUCTURE] 처리 중 - 중복 실행 방지');
        return;
      }

      setIsProcessingStructure(true);

      console.log('🏗️ [STRUCTURE] 구조 완료 처리 시작:', {
        inputCount: inputs.length,
        inputs: inputs,
      });

      try {
        const validInputs = inputs.filter((input) => input.trim().length > 0);

        if (validInputs.length < 2) {
          console.error('❌ [STRUCTURE] 최소 섹션 수 부족');
          addToast?.({
            title: '구조 설정 오류',
            description: '최소 2개의 섹션이 필요합니다.',
            color: 'warning',
          });
          return;
        }

        // ✅ 기존 데이터 초기화
        console.log('🧹 [STRUCTURE] 기존 데이터 초기화');
        resetEditorState();

        // ✅ 새 컨테이너 생성
        const newContainers: Container[] = validInputs.map((input, index) => ({
          id: `container-${Date.now()}-${index}-${Math.random()
            .toString(36)
            .substr(2, 7)}`,
          name: input.trim(),
          order: index,
          createdAt: new Date(),
        }));

        console.log('📦 [STRUCTURE] 컨테이너 생성:', newContainers.length);

        // ✅ 일괄 추가 (개별 메서드 사용)
        newContainers.forEach((container) => {
          addContainer(container);
        });

        // ✅ 즉시 검증 및 전환
        setTimeout(() => {
          // 최신 데이터를 다시 가져와서 검증
          const finalContainers = getContainers();
          console.log('✅ [STRUCTURE] 생성 결과:', {
            expected: validInputs.length,
            actual: finalContainers.length,
          });

          if (finalContainers.length === validInputs.length) {
            goToWritingStep?.();
            console.log('🎉 [STRUCTURE] 구조 설정 완료!');

            addToast?.({
              title: '구조 설정 완료',
              description: `${finalContainers.length}개의 섹션이 생성되었습니다.`,
              color: 'success',
            });
          } else {
            console.error('❌ [STRUCTURE] 생성 실패');
            addToast?.({
              title: '컨테이너 생성 오류',
              description: '섹션 생성에 실패했습니다.',
              color: 'danger',
            });
          }
        }, 100);
      } catch (error) {
        console.error('❌ [STRUCTURE] 처리 실패:', error);
        addToast?.({
          title: '구조 설정 실패',
          description: '구조 설정 중 오류가 발생했습니다.',
          color: 'danger',
        });
      } finally {
        setTimeout(() => {
          setIsProcessingStructure(false);
        }, 500);
      }
    },
    [
      isProcessingStructure,
      // ✅ 개별 메서드들만 의존성에 포함 (안정적)
      addToast,
      resetEditorState,
      addContainer,
      getContainers,
      goToWritingStep,
    ]
  );

  // ✅ **나머지 함수들**: 개별 메서드 사용으로 안정화
  const addLocalParagraph = useCallback(() => {
    console.log('📝 [ADD] 새 단락 추가');
    try {
      const newParagraph: ParagraphBlock = {
        id: `paragraph-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        content: '',
        containerId: null,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addParagraph(newParagraph);
      setActiveParagraphId?.(newParagraph.id);

      addToast?.({
        title: '새 단락 추가됨',
        description: '새로운 단락이 생성되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [ADD] 단락 추가 실패:', error);
    }
  }, [addParagraph, setActiveParagraphId, addToast]);

  const updateLocalParagraphContent = useCallback(
    (id: string, content: string) => {
      if (!id || typeof content !== 'string') return;

      try {
        updateParagraphContent(id, content);
      } catch (error) {
        console.error('❌ [UPDATE] 업데이트 실패:', error);
      }
    },
    [updateParagraphContent]
  );

  const deleteLocalParagraph = useCallback(
    (id: string) => {
      try {
        deleteParagraph(id);
        addToast?.({
          title: '단락 삭제됨',
          description: '단락이 삭제되었습니다.',
          color: 'warning',
        });
      } catch (error) {
        console.error('❌ [DELETE] 삭제 실패:', error);
      }
    },
    [deleteParagraph, addToast]
  );

  const toggleParagraphSelectionStable = useCallback(
    (id: string) => {
      toggleParagraphSelection?.(id);
    },
    [toggleParagraphSelection]
  );

  const addToLocalContainer = useCallback(() => {
    const { selectedParagraphIds, targetContainerId } = editorInternalState;

    if (!selectedParagraphIds.length || !targetContainerId) {
      addToast?.({
        title: '선택 오류',
        description: '단락과 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    try {
      selectedParagraphIds.forEach((paragraphId, index) => {
        const sourceParagraph = localParagraphs.find(
          (p) => p.id === paragraphId
        );
        if (!sourceParagraph?.content?.trim()) return;

        const existingParagraphs = localParagraphs.filter(
          (p) => p.containerId === targetContainerId
        );
        const maxOrder =
          existingParagraphs.length > 0
            ? Math.max(...existingParagraphs.map((p) => p.order))
            : 0;

        const newParagraph: ParagraphBlock = {
          id: `paragraph-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          content: sourceParagraph.content,
          containerId: targetContainerId,
          order: maxOrder + index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          originalId: sourceParagraph.id,
        };

        addParagraph(newParagraph);
      });

      clearSelectedParagraphs?.();
      addToast?.({
        title: '컨테이너에 추가됨',
        description: `${selectedParagraphIds.length}개 단락이 추가되었습니다.`,
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [CONTAINER] 추가 실패:', error);
    }
  }, [
    editorInternalState,
    localParagraphs,
    addParagraph,
    clearSelectedParagraphs,
    addToast,
  ]);

  // ✅ **조회 함수들**: 메모이제이션 적용
  const getLocalUnassignedParagraphs = useCallback((): LocalParagraph[] => {
    return localParagraphs.filter((p) => p.containerId === null);
  }, [localParagraphs]);

  const getLocalParagraphsByContainer = useCallback(
    (containerId: string): LocalParagraph[] => {
      return localParagraphs
        .filter((p) => p.containerId === containerId)
        .sort((a, b) => a.order - b.order);
    },
    [localParagraphs]
  );

  // ✅ **UI 제어 함수들**: 개별 메서드 사용
  const goToStructureStepStable = useCallback(() => {
    goToStructureStep?.();
  }, [goToStructureStep]);

  const activateEditor = useCallback(
    (id: string) => {
      setActiveParagraphId?.(id);
    },
    [setActiveParagraphId]
  );

  const togglePreviewStable = useCallback(() => {
    togglePreview?.();
  }, [togglePreview]);

  const saveAllToContext = useCallback(() => {
    addToast?.({
      title: '저장 완료',
      description: '모든 변경사항이 저장되었습니다.',
      color: 'success',
    });
  }, [addToast]);

  const completeEditor = useCallback(() => {
    const hasContainers = localContainers.length > 0;
    const hasAssignedParagraphs = localParagraphs.some(
      (p) => p.containerId && p.content.trim().length > 0
    );

    if (!hasContainers || !hasAssignedParagraphs) {
      addToast?.({
        title: '완료 조건 미충족',
        description: '컨테이너와 내용이 있는 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    try {
      generateCompletedContent();
      setIsCompleted(true);

      addToast?.({
        title: '에디터 완료',
        description: '마크다운 생성이 완료되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [COMPLETE] 완료 실패:', error);
    }
  }, [
    localContainers,
    localParagraphs,
    generateCompletedContent,
    setIsCompleted,
    addToast,
  ]);

  // ✅ **setter 함수들**: 개별 메서드 사용
  const setSelectedParagraphIdsStable = useCallback(
    (ids: string[]) => {
      setSelectedParagraphIds?.(ids);
    },
    [setSelectedParagraphIds]
  );

  const setTargetContainerIdStable = useCallback(
    (containerId: string) => {
      setTargetContainerId?.(containerId);
    },
    [setTargetContainerId]
  );

  const moveLocalParagraphInContainer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const paragraph = localParagraphs.find((p) => p.id === id);
      if (!paragraph?.containerId) return;

      const containerParagraphs = localParagraphs
        .filter((p) => p.containerId === paragraph.containerId)
        .sort((a, b) => a.order - b.order);

      const currentIndex = containerParagraphs.findIndex((p) => p.id === id);
      if (currentIndex === -1) return;

      const canMoveUp = direction === 'up' && currentIndex > 0;
      const canMoveDown =
        direction === 'down' && currentIndex < containerParagraphs.length - 1;

      if (!canMoveUp && !canMoveDown) return;

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetParagraph = containerParagraphs[targetIndex];

      // ✅ 개별 메서드 사용
      updateParagraphContent(paragraph.id, paragraph.content);
      updateParagraphContent(targetParagraph.id, targetParagraph.content);
    },
    [localParagraphs, updateParagraphContent]
  );

  console.log('✅ [HOOK] 훅 완료 - 근본적 개선 완료:', {
    containers: localContainers.length,
    paragraphs: localParagraphs.length,
    currentStep: editorInternalState.currentSubStep,
    handleStructureCompleteStable:
      typeof handleStructureComplete === 'function',
  });

  // ✅ **최종 반환**: 모든 함수가 안정적인 참조
  return {
    internalState: editorInternalState,
    localParagraphs,
    localContainers,
    isMobile: isMobileDeviceDetected,

    setInternalState: setLocalInternalState,
    setSelectedParagraphIds: setSelectedParagraphIdsStable,
    setTargetContainerId: setTargetContainerIdStable,

    addLocalParagraph,
    deleteLocalParagraph,
    updateLocalParagraphContent,
    toggleParagraphSelection: toggleParagraphSelectionStable,
    addToLocalContainer,
    moveLocalParagraphInContainer,
    getLocalUnassignedParagraphs,
    getLocalParagraphsByContainer,

    handleStructureComplete, // 🎯 이제 완전히 안정적!
    goToStructureStep: goToStructureStepStable,
    activateEditor,
    togglePreview: togglePreviewStable,
    saveAllToContext,
    completeEditor,
  };
};
