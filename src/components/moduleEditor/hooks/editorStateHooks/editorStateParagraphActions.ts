import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph, EditorUIStoreActions } from './editorStateTypes';

// ✨ [단락 액션 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [액션 함수] 새 단락 생성 함수 - 사용자가 새로운 문단을 추가할 때 사용
const createNewParagraph = (
  managedParagraphCollection: LocalParagraph[], // 1. 현재 관리되는 모든 단락 목록 2. 원본 변수명과 일치
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // 1. 단락 컬렉션 업데이트 함수 2. 새 단락 추가를 위한 상태 변경
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 활성 단락 설정
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  updateActiveParagraphIdInStore: (id: string | null) => void, // 1. store 활성 단락 업데이트 함수 2. 원본과 동일한 시그니처
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 오류 발생 시 메시지 표시
) => {
  return useCallback(() => {
    console.log('📄 [LOCAL] 새 단락 추가');
    try {
      // 1. 새로 생성할 문단 객체 생성 (현재 시간 + 랜덤값으로 고유 ID 보장)
      // 2. 원본과 정확히 동일한 ID 생성 패턴 적용
      const newParagraphToAdd: LocalParagraph = {
        id: `paragraph-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        content: '', // 빈 내용으로 시작하여 사용자 입력 대기
        containerId: null, // 아직 컨테이너에 할당되지 않은 상태
        order: managedParagraphCollection?.length || 0, // 현재 문단 개수를 기준으로 순서 설정
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 1. 로컬 문단 컬렉션 끝에 새 문단 추가
      // 2. 스프레드 연산자로 기존 배열을 복사하여 불변성 유지
      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return [...safePreviousCollection, newParagraphToAdd];
      });

      // 1. 에디터 내부 상태에서 새로 생성한 문단을 활성화
      // 2. 사용자가 즉시 타이핑할 수 있도록 포커스 상태 설정
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        activeParagraphId: newParagraphToAdd.id,
      }));

      // 1. context가 없을 때만 Zustand 스토어에도 활성 문단 ID 업데이트
      // 2. 상태 관리 충돌을 방지하기 위한 조건부 업데이트
      if (!hasContext && updateActiveParagraphIdInStore) {
        updateActiveParagraphIdInStore(newParagraphToAdd.id);
      }

      console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraphToAdd.id);
    } catch (error) {
      console.error('❌ [LOCAL] 새 단락 생성 실패:', error);
      // 1. 에러 발생 시 사용자에게 실패 원인을 명확히 알림
      // 2. 토스트 메시지로 즉각적인 피드백 제공
      if (showToastFunction) {
        showToastFunction({
          title: '단락 생성 실패',
          description: '새 단락을 생성하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [
    managedParagraphCollection?.length,
    hasContext,
    updateActiveParagraphIdInStore,
    showToastFunction,
  ]);
};

// ✨ [액션 함수] 단락 내용 업데이트 함수 - 사용자가 단락 내용을 편집할 때 사용
const updateParagraphContent = (
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // 1. 단락 컬렉션 업데이트 함수 2. 특정 단락의 내용 수정
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 오류 발생 시 메시지 표시
) => {
  return useCallback(
    (specificParagraphIdToUpdate: string, updatedParagraphContent: string) => {
      console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
        paragraphId: specificParagraphIdToUpdate,
        contentLength: (updatedParagraphContent || '').length,
      });

      try {
        // 1. 문단 ID의 유효성 검증 (빈 문자열이나 null 체크)
        // 2. 잘못된 ID로 인한 예상치 못한 동작 방지
        if (
          !specificParagraphIdToUpdate ||
          typeof specificParagraphIdToUpdate !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToUpdate
          );
          return;
        }

        // 1. 문단 배열에서 해당 ID의 문단만 내용 업데이트
        // 2. map 함수로 불변성을 유지하면서 특정 문단만 선택적 업데이트
        setManagedParagraphCollection((previousParagraphCollection) => {
          const safePreviousCollection = previousParagraphCollection || [];
          return safePreviousCollection.map((currentParagraphItem) => {
            const safeCurrentParagraph = currentParagraphItem || {};
            return safeCurrentParagraph.id === specificParagraphIdToUpdate
              ? {
                  ...safeCurrentParagraph,
                  content: updatedParagraphContent || '', // 빈 문자열 fallback 제공
                  updatedAt: new Date(), // 수정 시간 기록으로 최신 변경사항 추적
                }
              : safeCurrentParagraph;
          });
        });
      } catch (error) {
        console.error('❌ [LOCAL] 문단 내용 업데이트 실패:', error);
        // 1. 내용 저장 실패 시 사용자에게 즉시 알림
        // 2. 데이터 손실 가능성을 사용자가 인지할 수 있도록 경고
        if (showToastFunction) {
          showToastFunction({
            title: '내용 저장 실패',
            description: '문단 내용을 저장하는 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [showToastFunction]
  );
};

// ✨ [액션 함수] 단락 삭제 함수 - 사용자가 불필요한 단락을 제거할 때 사용
const removeParagraph = (
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // 1. 단락 컬렉션 업데이트 함수 2. 특정 단락 제거
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 삭제 완료/실패 메시지 표시
) => {
  return useCallback(
    (specificParagraphIdToRemove: string) => {
      console.log('🗑️ [LOCAL] 로컬 단락 삭제:', specificParagraphIdToRemove);
      try {
        // 1. 삭제할 문단 ID의 유효성 검증
        // 2. 잘못된 ID로 인한 의도치 않은 삭제 방지
        if (
          !specificParagraphIdToRemove ||
          typeof specificParagraphIdToRemove !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToRemove
          );
          return;
        }

        // 1. filter 함수로 해당 ID가 아닌 문단들만 남겨서 삭제 효과 구현
        // 2. 불변성을 유지하면서 안전하게 요소 제거
        setManagedParagraphCollection((previousParagraphCollection) => {
          const safePreviousCollection = previousParagraphCollection || [];
          return safePreviousCollection.filter((currentParagraphItem) => {
            const safeCurrentParagraph = currentParagraphItem || {};
            return safeCurrentParagraph.id !== specificParagraphIdToRemove;
          });
        });

        // 1. 삭제 성공 시 사용자에게 확인 메시지 표시
        // 2. 실수로 삭제한 경우 사용자가 인지할 수 있도록 피드백 제공
        if (showToastFunction) {
          showToastFunction({
            title: '단락 삭제',
            description: '선택한 단락이 삭제되었습니다.',
            color: 'success',
          });
        }
      } catch (error) {
        console.error('❌ [LOCAL] 문단 삭제 실패:', error);
        if (showToastFunction) {
          showToastFunction({
            title: '삭제 실패',
            description: '문단을 삭제하는 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [showToastFunction]
  );
};

// ✨ [액션 함수] 단락 선택 토글 함수 - 사용자가 단락을 선택/해제할 때 사용
const toggleParagraphSelect = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 선택된 단락 목록 관리
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  toggleParagraphSelectionInStore: (paragraphId: string) => void // 1. store 단락 선택 토글 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(
    (specificParagraphIdToToggle: string) => {
      console.log('☑️ [LOCAL] 단락 선택 토글:', specificParagraphIdToToggle);
      try {
        // 1. 토글할 문단 ID의 유효성 검증
        // 2. 올바르지 않은 ID로 인한 선택 상태 오류 방지
        if (
          !specificParagraphIdToToggle ||
          typeof specificParagraphIdToToggle !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToToggle
          );
          return;
        }

        // 1. 현재 선택된 문단 목록에서 해당 ID가 있는지 확인 후 추가/제거
        // 2. 기존 선택 상태를 유지하면서 하나의 항목만 토글하는 순수한 동작
        setEditorInternalState((previousInternalState) => {
          const safeInternalState = previousInternalState || {};
          const safeSelectedIdCollection =
            safeInternalState.selectedParagraphIds || [];

          return {
            ...safeInternalState,
            selectedParagraphIds: safeSelectedIdCollection.includes(
              specificParagraphIdToToggle
            )
              ? // 이미 선택된 경우: 선택 목록에서 제거
                safeSelectedIdCollection.filter(
                  (currentSelectedId) =>
                    currentSelectedId !== specificParagraphIdToToggle
                )
              : // 선택되지 않은 경우: 선택 목록에 추가
                [...safeSelectedIdCollection, specificParagraphIdToToggle],
          };
        });

        // 1. context가 없을 때만 Zustand 스토어에도 동일한 토글 동작 적용
        // 2. 다른 컴포넌트들도 변경된 선택 상태를 공유할 수 있도록 동기화
        if (!hasContext && toggleParagraphSelectionInStore) {
          toggleParagraphSelectionInStore(specificParagraphIdToToggle);
        }
      } catch (error) {
        console.error('❌ [LOCAL] 문단 선택 토글 실패:', error);
      }
    },
    [hasContext, toggleParagraphSelectionInStore]
  );
};

// ✨ [액션 함수] 단락 순서 변경 함수 - 사용자가 단락 순서를 위/아래로 이동할 때 사용
const changeParagraphOrder = (
  managedParagraphCollection: LocalParagraph[], // 1. 현재 관리되는 모든 단락 목록 2. 순서 변경 대상 컬렉션
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // 1. 단락 컬렉션 업데이트 함수 2. 순서 변경 반영
  showToastFunction: (options: ToastOptions) => void // 1. 사용자 알림 함수 2. 오류 발생 시 메시지 표시
) => {
  return useCallback(
    (specificParagraphIdToMove: string, moveDirectionValue: 'up' | 'down') => {
      console.log('↕️ [LOCAL] 단락 순서 변경:', {
        paragraphId: specificParagraphIdToMove,
        direction: moveDirectionValue,
      });

      try {
        // 1. 이동할 문단 ID의 유효성 검증
        // 2. 잘못된 문단 ID로 인한 순서 변경 오류 방지
        if (
          !specificParagraphIdToMove ||
          typeof specificParagraphIdToMove !== 'string'
        ) {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 문단 ID:',
            specificParagraphIdToMove
          );
          return;
        }

        // 1. 이동 방향이 'up' 또는 'down' 중 하나인지 검증
        // 2. 예상치 못한 방향 값으로 인한 오동작 방지
        if (moveDirectionValue !== 'up' && moveDirectionValue !== 'down') {
          console.warn(
            '⚠️ [LOCAL] 유효하지 않은 이동 방향:',
            moveDirectionValue
          );
          return;
        }

        const safeCollection = managedParagraphCollection || [];

        // 1. 이동할 대상 문단을 전체 문단 목록에서 찾기
        // 2. 해당 문단이 실제로 존재하고 컨테이너에 할당되어 있는지 확인
        const targetParagraphToMove = safeCollection.find(
          (currentParagraphItem) => {
            const safeParagraph = currentParagraphItem || {};
            return safeParagraph.id === specificParagraphIdToMove;
          }
        );

        if (!targetParagraphToMove || !targetParagraphToMove.containerId) {
          console.warn(
            '⚠️ [LOCAL] 이동할 문단을 찾을 수 없거나 컨테이너에 할당되지 않음'
          );
          return;
        }

        // 1. 같은 컨테이너에 속한 문단들만 필터링하고 order 기준으로 정렬
        // 2. 순서 변경 작업은 같은 컨테이너 내에서만 가능하므로 범위 제한
        const paragraphsInSameContainerGroup = safeCollection
          .filter((currentParagraphItem) => {
            const safeParagraph = currentParagraphItem || {};
            return (
              safeParagraph.containerId === targetParagraphToMove.containerId
            );
          })
          .sort((firstParagraphItem, secondParagraphItem) => {
            const safeFirst = firstParagraphItem || {};
            const safeSecond = secondParagraphItem || {};
            return (safeFirst.order || 0) - (safeSecond.order || 0);
          });

        // 1. 정렬된 배열에서 이동할 문단의 현재 위치(인덱스) 찾기
        // 2. 배열 인덱스를 통해 이전/다음 문단과의 교환 가능 여부 판단
        const currentPositionIndexInContainer =
          paragraphsInSameContainerGroup.findIndex((currentParagraphItem) => {
            const safeParagraph = currentParagraphItem || {};
            return safeParagraph.id === specificParagraphIdToMove;
          });

        // 1. 이동 방향과 현재 위치를 고려하여 더 이상 이동할 수 없는 경우 체크
        // 2. 첫 번째 문단을 위로 이동하거나 마지막 문단을 아래로 이동하는 것은 불가능
        if (
          (moveDirectionValue === 'up' &&
            currentPositionIndexInContainer === 0) ||
          (moveDirectionValue === 'down' &&
            currentPositionIndexInContainer ===
              paragraphsInSameContainerGroup.length - 1)
        ) {
          console.log('🚫 [LOCAL] 더 이상 이동할 수 없음');
          return;
        }

        // 1. 이동할 타겟 위치 계산 (위로 이동: -1, 아래로 이동: +1)
        // 2. 교환할 상대방 문단 객체 조회
        const targetPositionIndexInContainer =
          moveDirectionValue === 'up'
            ? currentPositionIndexInContainer - 1
            : currentPositionIndexInContainer + 1;
        const swapTargetParagraphItem =
          paragraphsInSameContainerGroup[targetPositionIndexInContainer];

        if (!swapTargetParagraphItem) {
          console.warn('⚠️ [LOCAL] 교체할 문단을 찾을 수 없음');
          return;
        }

        // 1. 두 문단의 order 값을 서로 교환하여 순서 변경 구현
        // 2. map 함수로 불변성을 유지하면서 해당 문단들만 선택적 업데이트
        setManagedParagraphCollection((previousParagraphCollection) => {
          const safePreviousCollection = previousParagraphCollection || [];
          return safePreviousCollection.map((currentParagraphItem) => {
            const safeParagraph = currentParagraphItem || {};
            if (safeParagraph.id === specificParagraphIdToMove) {
              // 이동할 문단에는 교환 대상의 order 값 할당
              return {
                ...safeParagraph,
                order: swapTargetParagraphItem.order || 0,
              };
            }
            if (safeParagraph.id === swapTargetParagraphItem.id) {
              // 교환 대상 문단에는 이동할 문단의 order 값 할당
              return {
                ...safeParagraph,
                order: targetParagraphToMove.order || 0,
              };
            }
            // 나머지 문단들은 그대로 유지
            return safeParagraph;
          });
        });
      } catch (error) {
        console.error('❌ [LOCAL] 문단 순서 변경 실패:', error);
        if (showToastFunction) {
          showToastFunction({
            title: '순서 변경 실패',
            description: '문단 순서를 변경하는 중 오류가 발생했습니다.',
            color: 'danger',
          });
        }
      }
    },
    [managedParagraphCollection, showToastFunction]
  );
};

// 모든 단락 관련 액션 함수들을 export
export {
  createNewParagraph,
  updateParagraphContent,
  removeParagraph,
  toggleParagraphSelect,
  changeParagraphOrder,
};
