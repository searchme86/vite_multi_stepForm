// 📁 hooks/useEditorState/useEditorStateMain.ts
// 🚨 **완전 해결**: 안전한 스토어 접근 패턴 적용

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  console.log('🪝 [USE_EDITOR_STATE] 훅 초기화 - 안전한 패턴');

  // ✅ **안전한 방법 1**: 스토어 상태를 직접 구독하되 안정적인 참조 보장
  const coreStore = useEditorCoreStore();
  const uiStore = useEditorUIStore();
  const toastStore = useToastStore();

  // ✅ **안전한 방법 2**: useMemo + 스토어 상태 의존성
  const localContainers = useMemo(() => {
    try {
      const containers = coreStore.getSortedContainers();
      console.log('📊 [SAFE] 컨테이너 업데이트:', containers.length);
      return containers;
    } catch (error) {
      console.error('❌ [SAFE] 컨테이너 조회 실패:', error);
      return [];
    }
  }, [coreStore.containers]); // ✅ 실제 데이터에 의존

  const localParagraphs = useMemo(() => {
    try {
      const paragraphs = coreStore.getParagraphs() as LocalParagraph[];
      console.log('📊 [SAFE] 단락 업데이트:', paragraphs.length);
      return paragraphs;
    } catch (error) {
      console.error('❌ [SAFE] 단락 조회 실패:', error);
      return [];
    }
  }, [coreStore.paragraphs]); // ✅ 실제 데이터에 의존

  // ✅ **안전한 방법 3**: UI 상태도 개별적으로 안전하게 가져오기
  const editorInternalState = useMemo(() => {
    try {
      return {
        currentSubStep: uiStore.getCurrentSubStep?.() || 'structure',
        isTransitioning: uiStore.getIsTransitioning?.() || false,
        activeParagraphId: uiStore.getActiveParagraphId?.() || null,
        isPreviewOpen: uiStore.getIsPreviewOpen?.() ?? true,
        selectedParagraphIds: uiStore.getSelectedParagraphIds?.() || [],
        targetContainerId: uiStore.getTargetContainerId?.() || '',
      } as EditorInternalState;
    } catch (error) {
      console.error('❌ [SAFE] UI 상태 조회 실패:', error);
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
    uiStore.currentSubStep,
    uiStore.isTransitioning,
    uiStore.activeParagraphId,
    uiStore.isPreviewOpen,
    uiStore.selectedParagraphIds,
    uiStore.targetContainerId,
  ]); // ✅ 실제 상태 필드에 의존

  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);

  // ✅ 하위 호환성을 위한 로컬 상태 (사용되지 않음)
  const [localInternalState, setLocalInternalState] =
    useState<EditorInternalState>(() => {
      try {
        return createInitialInternalState(false, uiStore);
      } catch (error) {
        console.error('❌ [HOOK] 초기 내부 상태 생성 실패:', error);
        return {
          currentSubStep: 'structure',
          isTransitioning: false,
          activeParagraphId: null,
          isPreviewOpen: true,
          selectedParagraphIds: [],
          targetContainerId: '',
        };
      }
    });

  useDeviceDetection(setIsMobileDeviceDetected);

  // ✅ **handleStructureComplete 함수**: 간소화 및 안정화
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
          toastStore.addToast?.({
            title: '구조 설정 오류',
            description: '최소 2개의 섹션이 필요합니다.',
            color: 'warning',
          });
          return;
        }

        // ✅ 기존 데이터 초기화
        console.log('🧹 [STRUCTURE] 기존 데이터 초기화');
        coreStore.resetEditorState();

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

        // ✅ 일괄 추가
        newContainers.forEach((container) => {
          coreStore.addContainer(container);
        });

        // ✅ 즉시 검증 및 전환
        setTimeout(() => {
          const finalContainers = coreStore.getContainers();
          console.log('✅ [STRUCTURE] 생성 결과:', {
            expected: validInputs.length,
            actual: finalContainers.length,
          });

          if (finalContainers.length === validInputs.length) {
            uiStore.goToWritingStep?.();
            console.log('🎉 [STRUCTURE] 구조 설정 완료!');

            toastStore.addToast?.({
              title: '구조 설정 완료',
              description: `${finalContainers.length}개의 섹션이 생성되었습니다.`,
              color: 'success',
            });
          } else {
            console.error('❌ [STRUCTURE] 생성 실패');
            toastStore.addToast?.({
              title: '컨테이너 생성 오류',
              description: '섹션 생성에 실패했습니다.',
              color: 'danger',
            });
          }
        }, 100);
      } catch (error) {
        console.error('❌ [STRUCTURE] 처리 실패:', error);
        toastStore.addToast?.({
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
    [isProcessingStructure, coreStore, uiStore, toastStore]
  );

  // ✅ **나머지 함수들**: 단순화
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

      coreStore.addParagraph(newParagraph);
      uiStore.setActiveParagraphId?.(newParagraph.id);

      toastStore.addToast?.({
        title: '새 단락 추가됨',
        description: '새로운 단락이 생성되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [ADD] 단락 추가 실패:', error);
    }
  }, [coreStore, uiStore, toastStore]);

  const updateLocalParagraphContent = useCallback(
    (id: string, content: string) => {
      if (!id || typeof content !== 'string') return;

      try {
        coreStore.updateParagraphContent(id, content);
      } catch (error) {
        console.error('❌ [UPDATE] 업데이트 실패:', error);
      }
    },
    [coreStore]
  );

  const deleteLocalParagraph = useCallback(
    (id: string) => {
      try {
        coreStore.deleteParagraph(id);
        toastStore.addToast?.({
          title: '단락 삭제됨',
          description: '단락이 삭제되었습니다.',
          color: 'warning',
        });
      } catch (error) {
        console.error('❌ [DELETE] 삭제 실패:', error);
      }
    },
    [coreStore, toastStore]
  );

  const toggleParagraphSelection = useCallback(
    (id: string) => {
      uiStore.toggleParagraphSelection?.(id);
    },
    [uiStore]
  );

  const addToLocalContainer = useCallback(() => {
    const { selectedParagraphIds, targetContainerId } = editorInternalState;

    if (!selectedParagraphIds.length || !targetContainerId) {
      toastStore.addToast?.({
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

        coreStore.addParagraph(newParagraph);
      });

      uiStore.clearSelectedParagraphs?.();
      toastStore.addToast?.({
        title: '컨테이너에 추가됨',
        description: `${selectedParagraphIds.length}개 단락이 추가되었습니다.`,
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [CONTAINER] 추가 실패:', error);
    }
  }, [editorInternalState, localParagraphs, coreStore, uiStore, toastStore]);

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

  // ✅ **UI 제어 함수들**
  const goToStructureStep = useCallback(() => {
    uiStore.goToStructureStep?.();
  }, [uiStore]);

  const activateEditor = useCallback(
    (id: string) => {
      uiStore.setActiveParagraphId?.(id);
    },
    [uiStore]
  );

  const togglePreview = useCallback(() => {
    uiStore.togglePreview?.();
  }, [uiStore]);

  const saveAllToContext = useCallback(() => {
    toastStore.addToast?.({
      title: '저장 완료',
      description: '모든 변경사항이 저장되었습니다.',
      color: 'success',
    });
  }, [toastStore]);

  const completeEditor = useCallback(() => {
    const hasContainers = localContainers.length > 0;
    const hasAssignedParagraphs = localParagraphs.some(
      (p) => p.containerId && p.content.trim().length > 0
    );

    if (!hasContainers || !hasAssignedParagraphs) {
      toastStore.addToast?.({
        title: '완료 조건 미충족',
        description: '컨테이너와 내용이 있는 단락이 필요합니다.',
        color: 'warning',
      });
      return;
    }

    try {
      coreStore.generateCompletedContent();
      coreStore.setIsCompleted(true);

      toastStore.addToast?.({
        title: '에디터 완료',
        description: '마크다운 생성이 완료되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [COMPLETE] 완료 실패:', error);
    }
  }, [localContainers, localParagraphs, coreStore, toastStore]);

  // ✅ **setter 함수들**
  const setSelectedParagraphIds = useCallback(
    (ids: string[]) => {
      uiStore.setSelectedParagraphIds?.(ids);
    },
    [uiStore]
  );

  const setTargetContainerId = useCallback(
    (containerId: string) => {
      uiStore.setTargetContainerId?.(containerId);
    },
    [uiStore]
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

      coreStore.updateParagraph(paragraph.id, { order: targetParagraph.order });
      coreStore.updateParagraph(targetParagraph.id, { order: paragraph.order });
    },
    [localParagraphs, coreStore]
  );

  console.log('✅ [HOOK] 훅 완료 - 안전한 패턴 적용:', {
    containers: localContainers.length,
    paragraphs: localParagraphs.length,
    currentStep: editorInternalState.currentSubStep,
  });

  // ✅ **최종 반환**: 안정적인 참조들
  return {
    internalState: editorInternalState,
    localParagraphs,
    localContainers,
    isMobile: isMobileDeviceDetected,

    setInternalState: setLocalInternalState, // 하위 호환성
    setSelectedParagraphIds,
    setTargetContainerId,

    addLocalParagraph,
    deleteLocalParagraph,
    updateLocalParagraphContent,
    toggleParagraphSelection,
    addToLocalContainer,
    moveLocalParagraphInContainer,
    getLocalUnassignedParagraphs,
    getLocalParagraphsByContainer,

    handleStructureComplete,
    goToStructureStep,
    activateEditor,
    togglePreview,
    saveAllToContext,
    completeEditor,
  };
};
