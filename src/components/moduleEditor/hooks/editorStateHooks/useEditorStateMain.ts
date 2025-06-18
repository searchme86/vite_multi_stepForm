// 📁 hooks/useEditorState/useEditorStateMain.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import {
  Container,
  ParagraphBlock,
} from '../../../../store/shared/commonTypes';
// ✅ types/paragraph.ts에서 LocalParagraph import (타입 일관성 확보)
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
  const editorCoreStore = useEditorCoreStore();
  const editorUIStore = useEditorUIStore();
  const toastStore = useToastStore();

  console.log('🪝 [USE_EDITOR_STATE] 훅 초기화 - Zustand 중심 모드');

  // ✅ 중복 실행 방지를 위한 상태 추가
  const [isProcessingStructure, setIsProcessingStructure] = useState(false);

  const stableAddToast = useCallback((options: any) => {
    if (toastStore?.addToast) {
      toastStore.addToast(options);
    }
  }, []);

  const stableNavigateToWritingStep = useCallback(() => {
    if (editorUIStore?.goToWritingStep) {
      editorUIStore.goToWritingStep();
    }
  }, []);

  const stableNavigateToStructureStep = useCallback(() => {
    if (editorUIStore?.goToStructureStep) {
      editorUIStore.goToStructureStep();
    }
  }, []);

  const stableUpdateActiveParagraphId = useCallback((id: string | null) => {
    if (editorUIStore?.setActiveParagraphId) {
      editorUIStore.setActiveParagraphId(id);
    }
  }, []);

  const stableTogglePreview = useCallback(() => {
    if (editorUIStore?.togglePreview) {
      editorUIStore.togglePreview();
    }
  }, []);

  const stableToggleParagraphSelection = useCallback((paragraphId: string) => {
    if (editorUIStore?.toggleParagraphSelection) {
      editorUIStore.toggleParagraphSelection(paragraphId);
    }
  }, []);

  const stableUpdateSelectedParagraphIds = useCallback((ids: string[]) => {
    if (editorUIStore?.setSelectedParagraphIds) {
      editorUIStore.setSelectedParagraphIds(ids);
    }
  }, []);

  const stableUpdateTargetContainerId = useCallback((containerId: string) => {
    if (editorUIStore?.setTargetContainerId) {
      editorUIStore.setTargetContainerId(containerId);
    }
  }, []);

  const stableClearSelectedParagraphs = useCallback(() => {
    if (editorUIStore?.clearSelectedParagraphs) {
      editorUIStore.clearSelectedParagraphs();
    }
  }, []);

  const [editorInternalState, setEditorInternalState] =
    useState<EditorInternalState>(() => {
      try {
        return createInitialInternalState(false, editorUIStore);
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

  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);

  // ✅ Zustand 스토어에서 직접 데이터 가져오기 (LocalParagraph 타입 사용)
  const localParagraphs = useMemo(() => {
    const paragraphs = editorCoreStore.getParagraphs();
    console.log('📊 [USE_EDITOR_STATE] Zustand에서 단락 조회:', {
      paragraphCount: paragraphs.length,
      paragraphIds: paragraphs.map((p) => p.id.slice(-8)),
    });
    return paragraphs as LocalParagraph[]; // ✅ 타입 캐스팅으로 일관성 확보
  }, [editorCoreStore.getParagraphs]);

  const localContainers = useMemo(() => {
    const containers = editorCoreStore.getSortedContainers();
    console.log('📊 [USE_EDITOR_STATE] Zustand에서 컨테이너 조회:', {
      containerCount: containers.length,
      containerNames: containers.map((c) => c.name),
    });
    return containers;
  }, [editorCoreStore.getSortedContainers]);

  const {
    selectedParagraphIds: selectedElementIdCollection = [],
    targetContainerId: targetDestinationIdValue = '',
  } = editorInternalState || {};

  useDeviceDetection(setIsMobileDeviceDetected);

  const stableStoreValues = useMemo(() => {
    return {
      currentSubStep: editorUIStore?.getCurrentSubStep?.() || 'structure',
      isTransitioning: editorUIStore?.getIsTransitioning?.() || false,
      activeParagraphId: editorUIStore?.getActiveParagraphId?.() || null,
      isPreviewOpen: editorUIStore?.getIsPreviewOpen?.() ?? true,
      selectedParagraphIds: editorUIStore?.getSelectedParagraphIds?.() || [],
      targetContainerId: editorUIStore?.getTargetContainerId?.() || '',
    };
  }, [
    editorUIStore?.getCurrentSubStep,
    editorUIStore?.getIsTransitioning,
    editorUIStore?.getActiveParagraphId,
    editorUIStore?.getIsPreviewOpen,
    editorUIStore?.getSelectedParagraphIds,
    editorUIStore?.getTargetContainerId,
  ]);

  useEffect(() => {
    setEditorInternalState((previousInternalState) => {
      const prevState = previousInternalState || {};
      const hasChanges =
        prevState.currentSubStep !== stableStoreValues.currentSubStep ||
        prevState.isTransitioning !== stableStoreValues.isTransitioning ||
        prevState.activeParagraphId !== stableStoreValues.activeParagraphId ||
        prevState.isPreviewOpen !== stableStoreValues.isPreviewOpen ||
        JSON.stringify(prevState.selectedParagraphIds) !==
          JSON.stringify(stableStoreValues.selectedParagraphIds) ||
        prevState.targetContainerId !== stableStoreValues.targetContainerId;

      if (!hasChanges) {
        return prevState;
      }

      return {
        ...prevState,
        ...stableStoreValues,
      };
    });
  }, [stableStoreValues]);

  // ✅ addLocalParagraph - Zustand 기반으로 재작성
  const addLocalParagraph = useCallback(() => {
    console.log('📝 [USE_EDITOR_STATE] 새 단락 추가 시작');

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

      editorCoreStore.addParagraph(newParagraph);
      stableUpdateActiveParagraphId(newParagraph.id);

      console.log('✅ [USE_EDITOR_STATE] 새 단락 추가 성공:', {
        paragraphId: newParagraph.id,
      });

      stableAddToast({
        title: '새 단락 추가됨',
        description: '새로운 단락이 생성되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [USE_EDITOR_STATE] 새 단락 추가 실패:', error);
      stableAddToast({
        title: '단락 추가 실패',
        description: '새 단락 생성 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [stableUpdateActiveParagraphId, stableAddToast]);

  // ✅ updateLocalParagraphContent - 완전 재작성 (Zustand 직접 업데이트)
  const updateLocalParagraphContent = useCallback(
    (id: string, content: string) => {
      console.log('📝 [USE_EDITOR_STATE] Zustand 직접 업데이트 시작:', {
        paragraphId: id,
        contentLength: content?.length || 0,
        contentPreview:
          content?.substring(0, 50) + (content?.length > 50 ? '...' : ''),
        timestamp: new Date().toISOString(),
      });

      if (!id || typeof id !== 'string') {
        console.error('❌ [USE_EDITOR_STATE] 잘못된 단락 ID:', id);
        return;
      }

      if (typeof content !== 'string') {
        console.error('❌ [USE_EDITOR_STATE] 잘못된 내용 타입:', {
          content,
          type: typeof content,
        });
        return;
      }

      try {
        // ✅ Zustand 스토어 직접 업데이트
        editorCoreStore.updateParagraphContent(id, content);

        console.log('✅ [USE_EDITOR_STATE] Zustand 업데이트 성공:', {
          paragraphId: id,
          contentLength: content.length,
        });

        // 토스트 알림 (유효한 내용일 때만)
        if (content && content.trim().length > 10) {
          stableAddToast({
            title: '자동 저장됨',
            description: `단락 내용이 저장되었습니다. (${content.length}자)`,
            color: 'primary',
          });
        }
      } catch (error) {
        console.error('❌ [USE_EDITOR_STATE] Zustand 업데이트 실패:', {
          paragraphId: id,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : 'No stack',
        });

        stableAddToast({
          title: '저장 실패',
          description: '단락 내용 저장 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [stableAddToast]
  );

  // ✅ deleteLocalParagraph - Zustand 기반으로 재작성
  const deleteLocalParagraph = useCallback(
    (id: string) => {
      console.log('🗑️ [USE_EDITOR_STATE] 단락 삭제 시작:', { paragraphId: id });

      try {
        editorCoreStore.deleteParagraph(id);

        console.log('✅ [USE_EDITOR_STATE] 단락 삭제 성공:', {
          paragraphId: id,
        });

        stableAddToast({
          title: '단락 삭제됨',
          description: '단락이 성공적으로 삭제되었습니다.',
          color: 'warning',
        });
      } catch (error) {
        console.error('❌ [USE_EDITOR_STATE] 단락 삭제 실패:', {
          paragraphId: id,
          error,
        });

        stableAddToast({
          title: '삭제 실패',
          description: '단락 삭제 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [stableAddToast]
  );

  // ✅ toggleParagraphSelection - UI 스토어 직접 사용
  const toggleParagraphSelection = useCallback(
    (id: string) => {
      console.log('☑️ [USE_EDITOR_STATE] 단락 선택 토글:', { paragraphId: id });

      try {
        stableToggleParagraphSelection(id);
        console.log('✅ [USE_EDITOR_STATE] 단락 선택 토글 성공');
      } catch (error) {
        console.error('❌ [USE_EDITOR_STATE] 단락 선택 토글 실패:', error);
      }
    },
    [stableToggleParagraphSelection]
  );

  // ✅ addToLocalContainer - originalId 포함 (타입 에러 해결!)
  const addToLocalContainer = useCallback(() => {
    console.log('📦 [USE_EDITOR_STATE] 컨테이너에 단락 추가 시작:', {
      selectedParagraphs: selectedElementIdCollection.length,
      targetContainer: targetDestinationIdValue,
    });

    if (selectedElementIdCollection.length === 0) {
      console.warn('⚠️ [USE_EDITOR_STATE] 선택된 단락이 없음');
      stableAddToast({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    if (!targetDestinationIdValue) {
      console.warn('⚠️ [USE_EDITOR_STATE] 대상 컨테이너가 없음');
      stableAddToast({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    try {
      // 선택된 단락들을 컨테이너에 복사
      selectedElementIdCollection.forEach((paragraphId, index) => {
        const sourceParagraph = localParagraphs.find(
          (p) => p.id === paragraphId
        );
        if (!sourceParagraph || !sourceParagraph.content?.trim()) {
          console.warn('⚠️ [USE_EDITOR_STATE] 빈 단락 스킵:', paragraphId);
          return;
        }

        // 기존 컨테이너 단락들의 순서 계산
        const existingContainerParagraphs = localParagraphs.filter(
          (p) => p.containerId === targetDestinationIdValue
        );
        const maxOrder =
          existingContainerParagraphs.length > 0
            ? Math.max(...existingContainerParagraphs.map((p) => p.order))
            : 0;

        // ✅ originalId 포함된 새 단락 생성 (ParagraphBlock 타입에 originalId 추가됨!)
        const newParagraph: ParagraphBlock = {
          id: `paragraph-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          content: sourceParagraph.content,
          containerId: targetDestinationIdValue,
          order: maxOrder + index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          originalId: sourceParagraph.id, // ✅ 이제 타입 에러 없음!
        };

        editorCoreStore.addParagraph(newParagraph);
      });

      // 선택 상태 초기화
      stableClearSelectedParagraphs();

      console.log('✅ [USE_EDITOR_STATE] 컨테이너에 단락 추가 성공');

      stableAddToast({
        title: '컨테이너에 추가됨',
        description: `${selectedElementIdCollection.length}개 단락이 컨테이너에 추가되었습니다.`,
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [USE_EDITOR_STATE] 컨테이너 추가 실패:', error);
      stableAddToast({
        title: '추가 실패',
        description: '컨테이너에 단락 추가 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [
    selectedElementIdCollection,
    targetDestinationIdValue,
    localParagraphs,
    stableClearSelectedParagraphs,
    stableAddToast,
  ]);

  // ✅ moveLocalParagraphInContainer - Zustand 기반으로 재작성
  const moveLocalParagraphInContainer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      console.log('↕️ [USE_EDITOR_STATE] 단락 순서 변경:', {
        paragraphId: id,
        direction,
      });

      try {
        const paragraph = localParagraphs.find((p) => p.id === id);
        if (!paragraph || !paragraph.containerId) {
          console.warn('⚠️ [USE_EDITOR_STATE] 이동할 수 없는 단락:', id);
          return;
        }

        const containerParagraphs = localParagraphs
          .filter((p) => p.containerId === paragraph.containerId)
          .sort((a, b) => a.order - b.order);

        const currentIndex = containerParagraphs.findIndex((p) => p.id === id);
        if (currentIndex === -1) return;

        const canMoveUp = direction === 'up' && currentIndex > 0;
        const canMoveDown =
          direction === 'down' && currentIndex < containerParagraphs.length - 1;

        if (!canMoveUp && !canMoveDown) {
          console.warn('⚠️ [USE_EDITOR_STATE] 이동 불가능한 위치');
          return;
        }

        const targetIndex =
          direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const targetParagraph = containerParagraphs[targetIndex];

        // order 값 교환
        editorCoreStore.updateParagraph(paragraph.id, {
          order: targetParagraph.order,
        });
        editorCoreStore.updateParagraph(targetParagraph.id, {
          order: paragraph.order,
        });

        console.log('✅ [USE_EDITOR_STATE] 단락 순서 변경 성공');
      } catch (error) {
        console.error('❌ [USE_EDITOR_STATE] 단락 순서 변경 실패:', error);
        stableAddToast({
          title: '순서 변경 실패',
          description: '단락 순서 변경 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    },
    [localParagraphs, stableAddToast]
  );

  // ✅ 조회 함수들 - LocalParagraph 타입 반환
  const getLocalUnassignedParagraphs = useCallback((): LocalParagraph[] => {
    const unassigned = localParagraphs.filter((p) => p.containerId === null);
    console.log('📋 [USE_EDITOR_STATE] 미할당 단락 조회:', {
      count: unassigned.length,
    });
    return unassigned;
  }, [localParagraphs]);

  const getLocalParagraphsByContainer = useCallback(
    (containerId: string): LocalParagraph[] => {
      const containerParagraphs = localParagraphs
        .filter((p) => p.containerId === containerId)
        .sort((a, b) => a.order - b.order);
      console.log('📋 [USE_EDITOR_STATE] 컨테이너별 단락 조회:', {
        containerId: containerId.slice(-8),
        count: containerParagraphs.length,
      });
      return containerParagraphs;
    },
    [localParagraphs]
  );

  // ✅ UI 상태 관리 함수들
  const setSelectedParagraphIds = useCallback(
    (ids: string[]) => {
      console.log('📝 [USE_EDITOR_STATE] 선택된 단락 ID 설정:', {
        count: ids.length,
      });
      stableUpdateSelectedParagraphIds(ids);
    },
    [stableUpdateSelectedParagraphIds]
  );

  const setTargetContainerId = useCallback(
    (containerId: string) => {
      console.log('🎯 [USE_EDITOR_STATE] 대상 컨테이너 설정:', {
        containerId: containerId.slice(-8),
      });
      stableUpdateTargetContainerId(containerId);
    },
    [stableUpdateTargetContainerId]
  );

  const setActiveParagraphId = useCallback(
    (id: string | null) => {
      console.log('🎯 [USE_EDITOR_STATE] 활성 단락 설정:', {
        paragraphId: id?.slice(-8),
      });
      stableUpdateActiveParagraphId(id);
    },
    [stableUpdateActiveParagraphId]
  );

  // ✅ handleStructureComplete - 중복 생성 방지 및 초기화 추가
  const handleStructureComplete = useCallback(
    (inputs: string[]) => {
      // ✅ 중복 실행 방지
      if (isProcessingStructure) {
        console.warn('⚠️ [USE_EDITOR_STATE] 구조 처리 중 - 중복 실행 방지');
        return;
      }

      setIsProcessingStructure(true);

      console.log('🏗️ [USE_EDITOR_STATE] 구조 완료 처리 시작:', {
        inputCount: inputs.length,
        inputs: inputs,
        timestamp: new Date().toISOString(),
      });

      try {
        const validInputs = inputs.filter((input) => input.trim().length > 0);

        console.log('🔍 [USE_EDITOR_STATE] 입력값 검증:', {
          originalCount: inputs.length,
          validCount: validInputs.length,
          validInputs: validInputs,
        });

        if (validInputs.length < 2) {
          console.error('❌ [USE_EDITOR_STATE] 최소 섹션 수 부족:', {
            required: 2,
            actual: validInputs.length,
          });

          stableAddToast({
            title: '구조 설정 오류',
            description: '최소 2개의 섹션이 필요합니다.',
            color: 'warning',
          });
          return;
        }

        // ✅ 기존 컨테이너 상태 확인 및 초기화
        const currentContainers = editorCoreStore.getContainers();
        console.log('📊 [USE_EDITOR_STATE] 현재 컨테이너 상태:', {
          existingCount: currentContainers.length,
          existingContainers: currentContainers.map((c) => ({
            id: c.id.slice(-8),
            name: c.name,
          })),
        });

        // ✅ 기존 컨테이너 초기화 (중복 방지)
        if (currentContainers.length > 0) {
          console.log('🧹 [USE_EDITOR_STATE] 기존 컨테이너 초기화 수행');
          editorCoreStore.setContainers([]);
        }

        // ✅ 새 컨테이너 생성
        const newContainers: Container[] = [];
        validInputs.forEach((input, index) => {
          const container: Container = {
            id: `container-${Date.now()}-${index}-${Math.random()
              .toString(36)
              .substr(2, 7)}`,
            name: input.trim(),
            order: index,
            createdAt: new Date(),
          };
          newContainers.push(container);
          console.log(
            `📦 [USE_EDITOR_STATE] 컨테이너 생성 ${index + 1}/${
              validInputs.length
            }:`,
            {
              id: container.id.slice(-8),
              name: container.name,
              order: container.order,
            }
          );
        });

        // ✅ 일괄 컨테이너 추가
        newContainers.forEach((container) => {
          editorCoreStore.addContainer(container);
        });

        // ✅ 생성 결과 검증
        const finalContainers = editorCoreStore.getContainers();
        console.log('✅ [USE_EDITOR_STATE] 컨테이너 생성 완료 검증:', {
          expected: validInputs.length,
          actual: finalContainers.length,
          isMatched: finalContainers.length === validInputs.length,
          finalContainers: finalContainers.map((c) => ({
            id: c.id.slice(-8),
            name: c.name,
          })),
        });

        if (finalContainers.length !== validInputs.length) {
          console.error('❌ [USE_EDITOR_STATE] 컨테이너 생성 개수 불일치:', {
            expected: validInputs.length,
            actual: finalContainers.length,
          });

          stableAddToast({
            title: '컨테이너 생성 오류',
            description: `예상 ${validInputs.length}개, 실제 ${finalContainers.length}개 생성됨`,
            color: 'danger',
          });
          return;
        }

        // ✅ 글쓰기 단계로 이동
        stableNavigateToWritingStep();

        console.log('✅ [USE_EDITOR_STATE] 구조 완료 처리 성공:', {
          containerCount: finalContainers.length,
          duration:
            Date.now() - parseInt(newContainers[0]?.id.split('-')[1] || '0'),
        });

        stableAddToast({
          title: '구조 설정 완료',
          description: `${finalContainers.length}개의 섹션이 생성되었습니다.`,
          color: 'success',
        });
      } catch (error) {
        console.error('❌ [USE_EDITOR_STATE] 구조 완료 처리 실패:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : 'No stack',
        });

        stableAddToast({
          title: '구조 설정 실패',
          description: '구조 설정 중 오류가 발생했습니다.',
          color: 'danger',
        });
      } finally {
        // ✅ 처리 완료 후 상태 해제
        setTimeout(() => {
          setIsProcessingStructure(false);
          console.log('🔓 [USE_EDITOR_STATE] 구조 처리 잠금 해제');
        }, 1000); // 1초 후 잠금 해제
      }
    },
    [isProcessingStructure, stableNavigateToWritingStep, stableAddToast]
  );

  const goToStructureStep = useCallback(() => {
    console.log('⬅️ [USE_EDITOR_STATE] 구조 단계로 이동');
    stableNavigateToStructureStep();
  }, [stableNavigateToStructureStep]);

  const activateEditor = useCallback(
    (id: string) => {
      console.log('🎯 [USE_EDITOR_STATE] 에디터 활성화:', {
        paragraphId: id.slice(-8),
      });
      stableUpdateActiveParagraphId(id);
    },
    [stableUpdateActiveParagraphId]
  );

  const togglePreview = useCallback(() => {
    console.log('👁️ [USE_EDITOR_STATE] 미리보기 토글');
    stableTogglePreview();
  }, [stableTogglePreview]);

  const saveAllToContext = useCallback(() => {
    console.log('💾 [USE_EDITOR_STATE] 전체 저장 (Zustand는 자동 저장됨)');
    stableAddToast({
      title: '저장 완료',
      description: '모든 변경사항이 저장되었습니다.',
      color: 'success',
    });
  }, [stableAddToast]);

  const completeEditor = useCallback(() => {
    console.log('🎉 [USE_EDITOR_STATE] 에디터 완료 처리');

    try {
      const hasContainers = localContainers.length > 0;
      const hasAssignedParagraphs = localParagraphs.some(
        (p) => p.containerId !== null && p.content.trim().length > 0
      );

      if (!hasContainers || !hasAssignedParagraphs) {
        stableAddToast({
          title: '완료 조건 미충족',
          description: '최소 1개의 컨테이너와 내용이 있는 단락이 필요합니다.',
          color: 'warning',
        });
        return;
      }

      editorCoreStore.generateCompletedContent();
      editorCoreStore.setIsCompleted(true);

      console.log('✅ [USE_EDITOR_STATE] 에디터 완료 처리 성공');

      stableAddToast({
        title: '에디터 완료',
        description: '마크다운 생성이 완료되었습니다.',
        color: 'success',
      });
    } catch (error) {
      console.error('❌ [USE_EDITOR_STATE] 에디터 완료 처리 실패:', error);
      stableAddToast({
        title: '완료 처리 실패',
        description: '에디터 완료 처리 중 오류가 발생했습니다.',
        color: 'danger',
      });
    }
  }, [localContainers, localParagraphs, stableAddToast]);

  // ✅ 반환값 - LocalParagraph 타입 사용
  return {
    internalState: editorInternalState,
    localParagraphs: localParagraphs, // LocalParagraph[] 타입
    localContainers: localContainers, // Container[] 타입
    isMobile: isMobileDeviceDetected,

    setInternalState: setEditorInternalState,
    setSelectedParagraphIds,
    setTargetContainerId,
    setActiveParagraphId,

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
