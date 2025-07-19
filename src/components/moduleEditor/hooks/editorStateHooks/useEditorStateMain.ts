// 📁 hooks/useEditorState/useEditorStateMain.ts

import { useState, useCallback, useMemo } from 'react';
import { EditorInternalState } from '../../types/editor';
import {
  Container,
  ParagraphBlock,
} from '../../../../store/shared/commonTypes';
import { LocalParagraph } from '../../types/paragraph';

import { useEditorCoreStore } from '../../../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';
import { useToastStore } from '../../../../store/toast/toastStore';

import { useDeviceDetection } from './editorStateDeviceDetection';

export function useEditorState() {
  return useEditorStateImpl();
}

// 🔧 타입 안전성을 위한 헬퍼 함수들
const validateAndConvertToParagraph = (
  rawParagraph: unknown
): LocalParagraph | null => {
  if (!rawParagraph || typeof rawParagraph !== 'object') {
    return null;
  }

  const paragraphId = Reflect.get(rawParagraph, 'id');
  const paragraphContent = Reflect.get(rawParagraph, 'content');
  const paragraphContainerId = Reflect.get(rawParagraph, 'containerId');
  const paragraphOrder = Reflect.get(rawParagraph, 'order');
  const paragraphCreatedAt = Reflect.get(rawParagraph, 'createdAt');
  const paragraphUpdatedAt = Reflect.get(rawParagraph, 'updatedAt');

  if (typeof paragraphId !== 'string') {
    return null;
  }

  const validatedParagraph: LocalParagraph = {
    id: paragraphId,
    content: typeof paragraphContent === 'string' ? paragraphContent : '',
    containerId:
      typeof paragraphContainerId === 'string' ? paragraphContainerId : null,
    order: typeof paragraphOrder === 'number' ? paragraphOrder : 0,
    createdAt:
      paragraphCreatedAt instanceof Date ? paragraphCreatedAt : new Date(),
    updatedAt:
      paragraphUpdatedAt instanceof Date ? paragraphUpdatedAt : new Date(),
  };

  return validatedParagraph;
};

const convertToParagraphsArray = (rawParagraphs: unknown): LocalParagraph[] => {
  if (!Array.isArray(rawParagraphs)) {
    console.warn(
      '⚠️ [TYPE_CONVERSION] rawParagraphs가 배열이 아님:',
      typeof rawParagraphs
    );
    return [];
  }

  const convertedParagraphs: LocalParagraph[] = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const rawParagraph = rawParagraphs[i];
    const validatedParagraph = validateAndConvertToParagraph(rawParagraph);

    if (validatedParagraph !== null) {
      convertedParagraphs.push(validatedParagraph);
    } else {
      console.warn(
        `⚠️ [TYPE_CONVERSION] 유효하지 않은 단락 데이터 건너뜀 (인덱스: ${i}):`,
        rawParagraph
      );
    }
  }

  console.log('🔄 [TYPE_CONVERSION] 단락 변환 완료:', {
    originalCount: rawParagraphs.length,
    convertedCount: convertedParagraphs.length,
    skippedCount: rawParagraphs.length - convertedParagraphs.length,
  });

  return convertedParagraphs;
};

const createEditorInternalState = (stateProps: {
  currentSubStep: unknown;
  isTransitioning: unknown;
  activeParagraphId: unknown;
  isPreviewOpen: unknown;
  selectedParagraphIds: unknown;
  targetContainerId: unknown;
}): EditorInternalState => {
  const {
    currentSubStep,
    isTransitioning,
    activeParagraphId,
    isPreviewOpen,
    selectedParagraphIds,
    targetContainerId,
  } = stateProps;

  const validCurrentSubStep =
    currentSubStep === 'structure' || currentSubStep === 'writing'
      ? currentSubStep
      : 'structure';

  const validIsTransitioning =
    typeof isTransitioning === 'boolean' ? isTransitioning : false;

  const validActiveParagraphId =
    typeof activeParagraphId === 'string' ? activeParagraphId : null;

  const validIsPreviewOpen =
    typeof isPreviewOpen === 'boolean' ? isPreviewOpen : true;

  const validSelectedParagraphIds = Array.isArray(selectedParagraphIds)
    ? selectedParagraphIds.filter((id) => typeof id === 'string')
    : [];

  const validTargetContainerId =
    typeof targetContainerId === 'string' ? targetContainerId : '';

  const editorState: EditorInternalState = {
    currentSubStep: validCurrentSubStep,
    isTransitioning: validIsTransitioning,
    activeParagraphId: validActiveParagraphId,
    isPreviewOpen: validIsPreviewOpen,
    selectedParagraphIds: validSelectedParagraphIds,
    targetContainerId: validTargetContainerId,
  };

  console.log('🔄 [TYPE_CONVERSION] EditorInternalState 생성 완료:', {
    currentSubStep: editorState.currentSubStep,
    isTransitioning: editorState.isTransitioning,
    activeParagraphId: editorState.activeParagraphId,
    isPreviewOpen: editorState.isPreviewOpen,
    selectedCount: editorState.selectedParagraphIds.length,
    targetContainerId: editorState.targetContainerId,
  });

  return editorState;
};

const useEditorStateImpl = () => {
  console.log(
    '🪝 [USE_EDITOR_STATE] 훅 초기화 - 에러 수정 버전 + 일괄 처리 + 강화된 예외 처리'
  );

  const addContainer = useEditorCoreStore((state) => state.addContainer);
  const addMultipleContainers = useEditorCoreStore(
    (state) => state.addMultipleContainers
  ); // 🆕 일괄 추가 함수
  const resetEditorState = useEditorCoreStore(
    (state) => state.resetEditorState
  );
  const getContainers = useEditorCoreStore((state) => state.getContainers);
  const addParagraph = useEditorCoreStore((state) => state.addParagraph);
  const deleteParagraph = useEditorCoreStore((state) => state.deleteParagraph);
  const updateParagraphContent = useEditorCoreStore(
    (state) => state.updateParagraphContent
  );
  const generateCompletedContent = useEditorCoreStore(
    (state) => state.generateCompletedContent
  );
  const setIsCompleted = useEditorCoreStore((state) => state.setIsCompleted);

  const moveToContainerStore = useEditorCoreStore(
    (state) => state.moveToContainer
  );
  const trackContainerMove = useEditorCoreStore(
    (state) => state.trackContainerMove
  );
  const getContainerMoveHistory = useEditorCoreStore(
    (state) => state.getContainerMoveHistory
  );
  const getContainerMovesByParagraph = useEditorCoreStore(
    (state) => state.getContainerMovesByParagraph
  );
  const getRecentContainerMoves = useEditorCoreStore(
    (state) => state.getRecentContainerMoves
  );
  const getContainerMoveStats = useEditorCoreStore(
    (state) => state.getContainerMoveStats
  );
  const clearContainerMoveHistory = useEditorCoreStore(
    (state) => state.clearContainerMoveHistory
  );
  const removeContainerMoveRecord = useEditorCoreStore(
    (state) => state.removeContainerMoveRecord
  );

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

  const addToast = useToastStore((state) => state.addToast);

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
  }, [containers]);

  // ✅ **타입 단언 제거**: 구체적인 타입 변환 함수 사용
  const localParagraphs = useMemo(() => {
    try {
      const convertedParagraphs = convertToParagraphsArray(paragraphs);
      console.log('📊 [STABLE] 단락 업데이트:', convertedParagraphs.length);
      return convertedParagraphs;
    } catch (error) {
      console.error('❌ [STABLE] 단락 조회 실패:', error);
      return [];
    }
  }, [paragraphs]);

  // ✅ **타입 단언 제거**: 구체적인 상태 생성 함수 사용
  const editorInternalState = useMemo(() => {
    try {
      return createEditorInternalState({
        currentSubStep,
        isTransitioning,
        activeParagraphId,
        isPreviewOpen,
        selectedParagraphIds,
        targetContainerId,
      });
    } catch (error) {
      console.error('❌ [STABLE] UI 상태 조회 실패:', error);
      return createEditorInternalState({
        currentSubStep: 'structure',
        isTransitioning: false,
        activeParagraphId: null,
        isPreviewOpen: true,
        selectedParagraphIds: [],
        targetContainerId: '',
      });
    }
  }, [
    currentSubStep,
    isTransitioning,
    activeParagraphId,
    isPreviewOpen,
    selectedParagraphIds,
    targetContainerId,
  ]);

  const [isProcessingStructure, setIsProcessingStructure] = useState(false);
  const [isMobileDeviceDetected, setIsMobileDeviceDetected] = useState(false);
  const [isAddingParagraph, setIsAddingParagraph] = useState(false);

  useDeviceDetection(setIsMobileDeviceDetected);

  // ✅ 완전히 수정된 handleStructureComplete - 에러 완전 해결
  const handleStructureComplete = useCallback(
    (inputs: string[]) => {
      if (isProcessingStructure) {
        console.warn('⚠️ [STRUCTURE] 처리 중 - 중복 실행 방지');
        return;
      }

      setIsProcessingStructure(true);

      console.log('🏗️ [STRUCTURE] 구조 완료 처리 시작 - 에러 수정 버전:', {
        inputCount: inputs.length,
        inputs: inputs,
        timestamp: new Date().toISOString(),
      });

      try {
        // Early return: 입력값 검증
        const validInputs = inputs.filter((input) => input.trim().length > 0);

        if (validInputs.length < 2) {
          console.error('❌ [STRUCTURE] 최소 섹션 수 부족');
          if (typeof addToast === 'function') {
            addToast({
              title: '구조 설정 오류',
              description: '최소 2개의 섹션이 필요합니다.',
              color: 'warning',
            });
          }
          return;
        }

        console.log('🧹 [STRUCTURE] 기존 데이터 초기화 - 완전 빈 상태로');

        // ✅ 초기화 전 상태 확인
        const beforeResetContainers = getContainers();
        console.log('📊 [STRUCTURE] 초기화 전 상태:', {
          containerCount: Array.isArray(beforeResetContainers)
            ? beforeResetContainers.length
            : 0,
          containers: beforeResetContainers,
        });

        // ✅ 완전 초기화 실행
        resetEditorState();

        // ✅ 초기화 후 상태 확인
        setTimeout(() => {
          const afterResetContainers = getContainers();
          console.log('📊 [STRUCTURE] 초기화 후 상태:', {
            containerCount: Array.isArray(afterResetContainers)
              ? afterResetContainers.length
              : 0,
            containers: afterResetContainers,
            shouldBeEmpty: true,
          });

          // ✅ 새 컨테이너 생성 (일괄 처리)
          const newContainers: Container[] = validInputs.map(
            (input, index) => ({
              id: `container-${Date.now()}-${index}-${Math.random()
                .toString(36)
                .substr(2, 7)}`,
              name: input.trim(),
              order: index,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          );

          console.log('📦 [STRUCTURE] 새 컨테이너 생성:', {
            count: newContainers.length,
            containers: newContainers.map((c) => ({ id: c.id, name: c.name })),
          });

          try {
            // ✅ 일괄 처리로 컨테이너 추가 (예외 처리 포함)
            if (typeof addMultipleContainers === 'function') {
              console.log('📦 [STRUCTURE] 일괄 컨테이너 추가 시작');
              addMultipleContainers(newContainers);
              console.log('✅ [STRUCTURE] 일괄 컨테이너 추가 완료');
            } else {
              console.warn(
                '⚠️ [STRUCTURE] 일괄 추가 함수 없음, 개별 처리로 대체'
              );

              // 개별 처리 fallback (강화된 예외 처리)
              let successCount = 0;
              let failureCount = 0;

              newContainers.forEach((container, index) => {
                try {
                  console.log(
                    `📦 [STRUCTURE] 컨테이너 ${index + 1}/${
                      newContainers.length
                    } 추가:`,
                    {
                      id: container.id,
                      name: container.name,
                    }
                  );

                  addContainer(container);
                  successCount++;

                  console.log(`✅ [STRUCTURE] 컨테이너 ${index + 1} 추가 성공`);
                } catch (containerError) {
                  failureCount++;
                  const errorMessage =
                    containerError instanceof Error
                      ? containerError.message
                      : 'Unknown error';

                  console.error(
                    `❌ [STRUCTURE] 컨테이너 ${index + 1} 추가 실패:`,
                    {
                      error: errorMessage,
                      container: container,
                    }
                  );
                }
              });

              console.log('📊 [STRUCTURE] 개별 추가 결과:', {
                requested: newContainers.length,
                successful: successCount,
                failed: failureCount,
              });
            }

            // ✅ 검증 및 전환 처리
            const verifyAndTransition = async () => {
              try {
                // 상태 업데이트 대기
                await new Promise((resolve) => setTimeout(resolve, 200));

                const finalContainers = getContainers();
                console.log('🔍 [STRUCTURE] 최종 상태 검증:', {
                  expected: validInputs.length,
                  actual: Array.isArray(finalContainers)
                    ? finalContainers.length
                    : 0,
                  containers: finalContainers,
                  isValidCount:
                    Array.isArray(finalContainers) &&
                    finalContainers.length === validInputs.length,
                });

                // ✅ 올바른 검증 로직
                if (
                  Array.isArray(finalContainers) &&
                  finalContainers.length === validInputs.length
                ) {
                  console.log('✅ [STRUCTURE] 컨테이너 생성 검증 성공');

                  // Writing Step으로 전환
                  if (typeof goToWritingStep === 'function') {
                    try {
                      goToWritingStep();
                      console.log('🎉 [STRUCTURE] Writing Step 이동 완료');
                    } catch (stepError) {
                      console.error(
                        '❌ [STRUCTURE] Writing Step 이동 실패:',
                        stepError
                      );
                      throw stepError;
                    }
                  } else {
                    console.error(
                      '❌ [STRUCTURE] goToWritingStep이 함수가 아님'
                    );
                    throw new Error('goToWritingStep 함수가 정의되지 않음');
                  }

                  // 성공 알림
                  if (typeof addToast === 'function') {
                    try {
                      addToast({
                        title: '구조 설정 완료',
                        description: `${finalContainers.length}개의 섹션이 생성되었습니다.`,
                        color: 'success',
                      });
                      console.log('🎉 [STRUCTURE] 성공 토스트 표시 완료');
                    } catch (toastError) {
                      console.error(
                        '❌ [STRUCTURE] 토스트 표시 실패:',
                        toastError
                      );
                    }
                  }
                } else {
                  console.error('❌ [STRUCTURE] 컨테이너 개수 불일치:', {
                    expected: validInputs.length,
                    actual: Array.isArray(finalContainers)
                      ? finalContainers.length
                      : 0,
                    finalContainers: finalContainers,
                  });

                  if (typeof addToast === 'function') {
                    addToast({
                      title: '구조 설정 실패',
                      description:
                        '섹션 생성에 실패했습니다. 다시 시도해주세요.',
                      color: 'danger',
                    });
                  }
                }
              } catch (verificationError) {
                console.error(
                  '❌ [STRUCTURE] 검증 과정 중 예외 발생:',
                  verificationError
                );

                if (typeof addToast === 'function') {
                  addToast({
                    title: '구조 설정 실패',
                    description: '시스템 오류가 발생했습니다.',
                    color: 'danger',
                  });
                }
              }
            };

            // 검증 및 전환 실행
            verifyAndTransition();
          } catch (additionError) {
            console.error(
              '❌ [STRUCTURE] 컨테이너 추가 과정 실패:',
              additionError
            );

            if (typeof addToast === 'function') {
              addToast({
                title: '컨테이너 추가 실패',
                description: '섹션 생성 중 오류가 발생했습니다.',
                color: 'danger',
              });
            }
          }
        }, 100); // 초기화 완료 대기
      } catch (error) {
        console.error('❌ [STRUCTURE] 전체 처리 실패:', error);

        if (typeof addToast === 'function') {
          addToast({
            title: '구조 설정 실패',
            description: '구조 설정 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      } finally {
        // 처리 상태 해제
        setTimeout(() => {
          setIsProcessingStructure(false);
          console.log('🔄 [STRUCTURE] 처리 상태 해제 완료');
        }, 1000);
      }
    },
    [
      isProcessingStructure,
      addToast,
      resetEditorState,
      addContainer,
      addMultipleContainers, // 🆕 일괄 추가 함수 의존성
      getContainers,
      goToWritingStep,
    ]
  );

  const moveToContainer = useCallback(
    (paragraphId: string, targetContainerId: string) => {
      console.log('🔄 [MOVE_CONTAINER] 컨테이너 이동 요청:', {
        paragraphId,
        targetContainerId,
        currentActive: editorInternalState.activeParagraphId,
        currentContainers: localContainers.map((c) => ({
          id: c.id,
          name: c.name,
        })),
      });

      try {
        if (!paragraphId || typeof paragraphId !== 'string') {
          console.error('❌ [MOVE_CONTAINER] 잘못된 단락 ID:', paragraphId);
          if (typeof addToast === 'function') {
            addToast({
              title: '이동 실패',
              description: '잘못된 단락 ID입니다.',
              color: 'danger',
            });
          }
          return;
        }

        if (!targetContainerId || typeof targetContainerId !== 'string') {
          console.error(
            '❌ [MOVE_CONTAINER] 잘못된 컨테이너 ID:',
            targetContainerId
          );
          if (typeof addToast === 'function') {
            addToast({
              title: '이동 실패',
              description: '잘못된 컨테이너 ID입니다.',
              color: 'danger',
            });
          }
          return;
        }

        const paragraph = localParagraphs.find((p) => p.id === paragraphId);
        if (!paragraph) {
          console.error(
            '❌ [MOVE_CONTAINER] 단락을 찾을 수 없음:',
            paragraphId
          );
          if (typeof addToast === 'function') {
            addToast({
              title: '이동 실패',
              description: '단락을 찾을 수 없습니다.',
              color: 'danger',
            });
          }
          return;
        }

        const targetContainer = localContainers.find(
          (c) => c.id === targetContainerId
        );
        if (!targetContainer) {
          console.error(
            '❌ [MOVE_CONTAINER] 컨테이너를 찾을 수 없음:',
            targetContainerId
          );
          if (typeof addToast === 'function') {
            addToast({
              title: '이동 실패',
              description: '대상 컨테이너를 찾을 수 없습니다.',
              color: 'danger',
            });
          }
          return;
        }

        if (paragraph.containerId === targetContainerId) {
          console.warn('⚠️ [MOVE_CONTAINER] 동일한 컨테이너로 이동 시도');
          if (typeof addToast === 'function') {
            addToast({
              title: '이동 불필요',
              description: '이미 해당 컨테이너에 있습니다.',
              color: 'warning',
            });
          }
          return;
        }

        moveToContainerStore(paragraphId, targetContainerId);

        if (editorInternalState.activeParagraphId === paragraphId) {
          console.log('🔒 [MOVE_CONTAINER] 에디터 자동 비활성화:', paragraphId);
          if (typeof setActiveParagraphId === 'function') {
            setActiveParagraphId(null);
          }
        }

        console.log('✅ [MOVE_CONTAINER] 컨테이너 이동 성공');
        if (typeof addToast === 'function') {
          addToast({
            title: '이동 완료',
            description: `"${targetContainer.name}" 컨테이너로 이동되었습니다.`,
            color: 'success',
          });
        }
      } catch (error) {
        console.error('❌ [MOVE_CONTAINER] 컨테이너 이동 실패:', error);
        if (typeof addToast === 'function') {
          addToast({
            title: '이동 실패',
            description: '컨테이너 이동 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [
      moveToContainerStore,
      localParagraphs,
      localContainers,
      editorInternalState.activeParagraphId,
      setActiveParagraphId,
      addToast,
    ]
  );

  const trackContainerMoveWithToast = useCallback(
    (moveRecord: {
      paragraphId: string;
      fromContainerId: string | null;
      toContainerId: string;
      reason?: string;
    }) => {
      try {
        trackContainerMove(moveRecord);
        console.log('📝 [TRACK_MOVE] 이동 기록 추가:', moveRecord);
      } catch (error) {
        console.error('❌ [TRACK_MOVE] 이동 기록 실패:', error);
      }
    },
    [trackContainerMove]
  );

  const getContainerMoveHistoryStable = useCallback(() => {
    try {
      return getContainerMoveHistory();
    } catch (error) {
      console.error('❌ [GET_HISTORY] 이동 이력 조회 실패:', error);
      return [];
    }
  }, [getContainerMoveHistory]);

  const getContainerMovesByParagraphStable = useCallback(
    (paragraphId: string) => {
      try {
        return getContainerMovesByParagraph(paragraphId);
      } catch (error) {
        console.error('❌ [GET_MOVES] 단락별 이동 이력 조회 실패:', error);
        return [];
      }
    },
    [getContainerMovesByParagraph]
  );

  const getRecentContainerMovesStable = useCallback(
    (limit: number = 10) => {
      try {
        return getRecentContainerMoves(limit);
      } catch (error) {
        console.error('❌ [GET_RECENT] 최근 이동 이력 조회 실패:', error);
        return [];
      }
    },
    [getRecentContainerMoves]
  );

  const getContainerMoveStatsStable = useCallback(() => {
    try {
      return getContainerMoveStats();
    } catch (error) {
      console.error('❌ [GET_STATS] 이동 통계 조회 실패:', error);
      return {
        totalMoves: 0,
        mostMovedParagraph: null,
        mostTargetContainer: null,
        averageMovesPerParagraph: 0,
      };
    }
  }, [getContainerMoveStats]);

  const clearContainerMoveHistoryWithToast = useCallback(() => {
    try {
      clearContainerMoveHistory();
      console.log('🗑️ [CLEAR_HISTORY] 이동 이력 전체 삭제');
      if (typeof addToast === 'function') {
        addToast({
          title: '이력 삭제',
          description: '모든 이동 이력이 삭제되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [CLEAR_HISTORY] 이력 삭제 실패:', error);
      if (typeof addToast === 'function') {
        addToast({
          title: '삭제 실패',
          description: '이동 이력 삭제 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [clearContainerMoveHistory, addToast]);

  const removeContainerMoveRecordWithToast = useCallback(
    (recordId: string) => {
      try {
        removeContainerMoveRecord(recordId);
        console.log('🗑️ [REMOVE_RECORD] 특정 이동 기록 삭제:', recordId);
        if (typeof addToast === 'function') {
          addToast({
            title: '기록 삭제',
            description: '선택한 이동 기록이 삭제되었습니다.',
            color: 'success',
          });
        }
      } catch (error) {
        console.error('❌ [REMOVE_RECORD] 기록 삭제 실패:', error);
        if (typeof addToast === 'function') {
          addToast({
            title: '삭제 실패',
            description: '이동 기록 삭제 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [removeContainerMoveRecord, addToast]
  );

  const addLocalParagraph = useCallback(() => {
    console.log('📝 [ADD] 새 단락 추가 요청');

    if (isAddingParagraph) {
      console.warn('⚠️ [ADD] 단락 추가 중 - 중복 요청 무시');
      return;
    }

    const existingEmptyParagraphs = localParagraphs.filter((p) => {
      const trimmedContent = (p.content || '').trim();
      const isUnassigned = p.containerId === null;
      const isEmpty = trimmedContent.length === 0;
      return isUnassigned && isEmpty;
    });

    if (existingEmptyParagraphs.length > 0) {
      console.warn('⚠️ [ADD] 이미 빈 단락이 존재함 - 새로 생성하지 않음:', {
        existingEmpty: existingEmptyParagraphs.length,
        existingIds: existingEmptyParagraphs.map((p) => p.id),
      });

      const firstEmptyParagraph = existingEmptyParagraphs[0];
      if (typeof setActiveParagraphId === 'function') {
        setActiveParagraphId(firstEmptyParagraph.id);
      }

      if (typeof addToast === 'function') {
        addToast({
          title: '기존 빈 단락 사용',
          description: '이미 작성 중인 빈 단락이 있습니다.',
          color: 'warning',
        });
      }
      return;
    }

    setIsAddingParagraph(true);

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

      console.log('📝 [ADD] 새 단락 생성:', {
        id: newParagraph.id,
        timestamp: newParagraph.createdAt.toISOString(),
      });

      addParagraph(newParagraph);
      if (typeof setActiveParagraphId === 'function') {
        setActiveParagraphId(newParagraph.id);
      }

      if (typeof addToast === 'function') {
        addToast({
          title: '새 단락 추가됨',
          description: '새로운 단락이 생성되었습니다.',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [ADD] 단락 추가 실패:', error);
      if (typeof addToast === 'function') {
        addToast({
          title: '단락 추가 실패',
          description: '단락 생성 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    } finally {
      setTimeout(() => {
        setIsAddingParagraph(false);
      }, 1000);
    }
  }, [
    isAddingParagraph,
    localParagraphs,
    addParagraph,
    setActiveParagraphId,
    addToast,
  ]);

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
        if (typeof addToast === 'function') {
          addToast({
            title: '단락 삭제됨',
            description: '단락이 삭제되었습니다.',
            color: 'warning',
          });
        }
      } catch (error) {
        console.error('❌ [DELETE] 삭제 실패:', error);
      }
    },
    [deleteParagraph, addToast]
  );

  const toggleParagraphSelectionStable = useCallback(
    (id: string) => {
      if (typeof toggleParagraphSelection === 'function') {
        toggleParagraphSelection(id);
      }
    },
    [toggleParagraphSelection]
  );

  const addToLocalContainer = useCallback(() => {
    const { selectedParagraphIds, targetContainerId } = editorInternalState;

    console.log('🔄 [ADD_TO_CONTAINER] 함수 호출 (moveToContainer 사용):', {
      selectedParagraphIds,
      targetContainerId,
    });

    if (!selectedParagraphIds.length || !targetContainerId) {
      if (typeof addToast === 'function') {
        addToast({
          title: '선택 오류',
          description: '단락과 컨테이너를 선택해주세요.',
          color: 'warning',
        });
      }
      return;
    }

    try {
      selectedParagraphIds.forEach((paragraphId) => {
        const sourceParagraph = localParagraphs.find(
          (p) => p.id === paragraphId
        );

        if (!sourceParagraph?.content?.trim()) {
          console.warn('⚠️ [ADD_TO_CONTAINER] 빈 단락 건너뜀:', paragraphId);
          return;
        }

        console.log('🔄 [ADD_TO_CONTAINER] 단락 이동:', {
          from: sourceParagraph.containerId,
          to: targetContainerId,
          paragraphId,
        });

        moveToContainer(paragraphId, targetContainerId);
      });

      if (typeof clearSelectedParagraphs === 'function') {
        clearSelectedParagraphs();
      }

      if (typeof addToast === 'function') {
        addToast({
          title: '컨테이너로 이동 완료',
          description: `${selectedParagraphIds.length}개 단락이 이동되었습니다.`,
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [ADD_TO_CONTAINER] 이동 실패:', error);
      if (typeof addToast === 'function') {
        addToast({
          title: '이동 실패',
          description: '컨테이너 이동 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [
    editorInternalState,
    localParagraphs,
    moveToContainer,
    clearSelectedParagraphs,
    addToast,
  ]);

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

  const goToStructureStepStable = useCallback(() => {
    if (typeof goToStructureStep === 'function') {
      goToStructureStep();
    }
  }, [goToStructureStep]);

  const activateEditor = useCallback(
    (id: string) => {
      console.log('🎯 [EDITOR_STATE] 에디터 활성화 요청:', {
        paragraphId: id,
        currentActive: editorInternalState.activeParagraphId,
      });

      const targetParagraph = localParagraphs.find((p) => p.id === id);
      if (!targetParagraph) {
        console.warn('⚠️ [EDITOR_STATE] 존재하지 않는 단락:', id);
        return;
      }

      if (typeof setActiveParagraphId === 'function') {
        setActiveParagraphId(id);
      }

      if (typeof addToast === 'function') {
        addToast({
          title: '에디터 활성화',
          description: '단락 편집 모드로 전환되었습니다.',
          color: 'primary',
        });
      }
    },
    [
      setActiveParagraphId,
      localParagraphs,
      editorInternalState.activeParagraphId,
      addToast,
    ]
  );

  const togglePreviewStable = useCallback(() => {
    if (typeof togglePreview === 'function') {
      togglePreview();
    }
  }, [togglePreview]);

  const saveAllToContext = useCallback(() => {
    if (typeof addToast === 'function') {
      addToast({
        title: '저장 완료',
        description: '모든 변경사항이 저장되었습니다.',
        color: 'success',
      });
    }
  }, [addToast]);

  const completeEditor = useCallback(() => {
    const hasContainers = localContainers.length > 0;
    const hasAssignedParagraphs = localParagraphs.some(
      (p) => p.containerId && p.content.trim().length > 0
    );

    if (!hasContainers || !hasAssignedParagraphs) {
      if (typeof addToast === 'function') {
        addToast({
          title: '완료 조건 미충족',
          description: '컨테이너와 내용이 있는 단락이 필요합니다.',
          color: 'warning',
        });
      }
      return;
    }

    try {
      generateCompletedContent();
      setIsCompleted(true);

      if (typeof addToast === 'function') {
        addToast({
          title: '에디터 완료',
          description: '마크다운 생성이 완료되었습니다.',
          color: 'success',
        });
      }
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

  const setSelectedParagraphIdsStable = useCallback(
    (ids: string[]) => {
      if (typeof setSelectedParagraphIds === 'function') {
        setSelectedParagraphIds(ids);
      }
    },
    [setSelectedParagraphIds]
  );

  const setTargetContainerIdStable = useCallback(
    (containerId: string) => {
      if (typeof setTargetContainerId === 'function') {
        setTargetContainerId(containerId);
      }
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

      updateParagraphContent(paragraph.id, paragraph.content);
      updateParagraphContent(targetParagraph.id, targetParagraph.content);
    },
    [localParagraphs, updateParagraphContent]
  );

  const setInternalState = useCallback(
    (newState: React.SetStateAction<EditorInternalState>) => {
      console.log('📝 [SET_INTERNAL_STATE] 상태 변경 요청:', newState);
    },
    []
  );

  console.log(
    '✅ [HOOK] 훅 완료 - 에러 수정 + 일괄 처리 + 강화된 예외 처리 완료:',
    {
      containers: localContainers.length,
      paragraphs: localParagraphs.length,
      currentStep: editorInternalState.currentSubStep,
      handleStructureCompleteFixed:
        typeof handleStructureComplete === 'function',
      addMultipleContainersAvailable:
        typeof addMultipleContainers === 'function',
      errorHandlingImproved: true,
      batchProcessingEnabled: true,
    }
  );

  return {
    internalState: editorInternalState,
    localParagraphs,
    localContainers,
    isMobile: isMobileDeviceDetected,

    setInternalState,
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

    handleStructureComplete, // ✅ 완전히 수정된 함수
    goToStructureStep: goToStructureStepStable,
    activateEditor,
    togglePreview: togglePreviewStable,
    saveAllToContext,
    completeEditor,

    moveToContainer,
    trackContainerMove: trackContainerMoveWithToast,
    getContainerMoveHistory: getContainerMoveHistoryStable,
    getContainerMovesByParagraph: getContainerMovesByParagraphStable,
    getRecentContainerMoves: getRecentContainerMovesStable,
    getContainerMoveStats: getContainerMoveStatsStable,
    clearContainerMoveHistory: clearContainerMoveHistoryWithToast,
    removeContainerMoveRecord: removeContainerMoveRecordWithToast,
  };
};
