import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph, EditorUIStoreActions } from './editorStateTypes';
import { updateZustandStoreIfNeeded } from './editorStateHelpers';

// ✨ [단락 액션 함수들] 원본과 동일한 구조로 작성 - HOF 패턴 제거하고 직접 사용 방식 적용

// ✨ [액션 함수] 새 단락 생성 함수 - 사용자가 새로운 문단을 추가할 때 사용
const createNewParagraph = (
  currentParagraphs: LocalParagraph[],
  setCurrentParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(() => {
    console.log('📄 [LOCAL] 새 단락 추가');
    const newParagraphToAdd: LocalParagraph = {
      id: `paragraph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 1. 고유 ID 생성 2. 중복 방지
      content: '', // 1. 빈 내용으로 시작 2. 사용자가 직접 입력
      containerId: null, // 1. 아직 섹션에 할당되지 않음 2. 나중에 사용자가 배치
      order: currentParagraphs.length, // 1. 현재 단락 개수를 순서로 사용 2. 자동으로 맨 뒤에 배치
      createdAt: new Date(), // 1. 생성 시간 기록 2. 추후 정렬이나 추적에 활용
      updatedAt: new Date(), // 1. 수정 시간 초기화 2. 내용 변경 추적 준비
    };

    // 1. 로컬 상태에 새 단락 추가 2. 즉시 UI에 반영
    setCurrentParagraphs((previousParagraphs) => [
      ...previousParagraphs,
      newParagraphToAdd,
    ]);

    // 1. 새로 만든 단락을 활성 상태로 설정 2. 사용자가 바로 편집할 수 있게 함
    setEditorInternalState((previousState) => ({
      ...previousState,
      activeParagraphId: newParagraphToAdd.id,
    }));

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.setActiveParagraphId(newParagraphToAdd.id);
    });

    console.log('📄 [LOCAL] 로컬 단락 생성 완료:', newParagraphToAdd.id);
  }, [currentParagraphs.length, hasContext, editorUIStoreActions]); // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
};

// ✨ [액션 함수] 단락 내용 업데이트 함수 - 사용자가 단락 내용을 편집할 때 사용
const updateParagraphContent = (
  setCurrentParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) => {
  return useCallback(
    (targetParagraphId: string, newContent: string) => {
      console.log('✏️ [LOCAL] 로컬 단락 내용 업데이트:', {
        paragraphId: targetParagraphId,
        contentLength: (newContent || '').length, // 1. 내용 길이 추적 2. 디버깅과 분석에 활용
      });

      // 1. 해당 ID의 단락 찾아서 내용 업데이트 2. 다른 단락들은 그대로 유지
      setCurrentParagraphs((previousParagraphs) =>
        previousParagraphs.map((currentParagraph) =>
          currentParagraph.id === targetParagraphId
            ? {
                ...currentParagraph,
                content: newContent || '', // 1. 새로운 내용으로 교체 2. null/undefined 방지
                updatedAt: new Date(), // 1. 수정 시간 갱신 2. 변경 이력 추적
              }
            : currentParagraph
        )
      );
    },
    [] // 1. 의존성 없음 - 순수함수로 작동 2. 매번 새로 생성하지 않아 성능 최적화
  );
};

// ✨ [액션 함수] 단락 삭제 함수 - 사용자가 불필요한 단락을 제거할 때 사용
const removeParagraph = (
  setCurrentParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>,
  showToastFunction: (options: ToastOptions) => void
) => {
  return useCallback(
    (targetParagraphId: string) => {
      console.log('🗑️ [LOCAL] 로컬 단락 삭제:', targetParagraphId);

      // 1. 해당 ID의 단락 제외하고 나머지만 유지 2. 삭제 효과 구현
      setCurrentParagraphs((previousParagraphs) =>
        previousParagraphs.filter(
          (currentParagraph) => currentParagraph.id !== targetParagraphId
        )
      );

      // 1. 사용자에게 삭제 완료 알림 2. 성공적인 작업 피드백 제공
      showToastFunction({
        title: '단락 삭제',
        description: '선택한 단락이 삭제되었습니다.',
        color: 'success',
      });
    },
    [showToastFunction] // 1. showToastFunction 의존성 2. 토스트 기능 변경 시 함수 재생성
  );
};

// ✨ [액션 함수] 단락 선택 토글 함수 - 사용자가 단락을 선택/해제할 때 사용
const toggleParagraphSelect = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(
    (targetParagraphId: string) => {
      console.log('☑️ [LOCAL] 단락 선택 토글:', targetParagraphId);

      // 1. 현재 선택 상태에 따라 추가/제거 결정 2. 토글 방식으로 직관적 조작
      setEditorInternalState((previousState) => ({
        ...previousState,
        selectedParagraphIds: previousState.selectedParagraphIds.includes(
          targetParagraphId
        )
          ? previousState.selectedParagraphIds.filter(
              (currentId) => currentId !== targetParagraphId // 1. 이미 선택된 경우 선택 해제 2. 중복 선택 방지
            )
          : [...previousState.selectedParagraphIds, targetParagraphId], // 1. 선택되지 않은 경우 선택 추가 2. 다중 선택 지원
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.toggleParagraphSelection(targetParagraphId);
      });
    },
    [hasContext, editorUIStoreActions] // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
  );
};

// ✨ [액션 함수] 단락 순서 변경 함수 - 사용자가 단락 순서를 위/아래로 이동할 때 사용
const changeParagraphOrder = (
  currentParagraphs: LocalParagraph[],
  setCurrentParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
) => {
  return useCallback(
    (targetParagraphId: string, moveDirection: 'up' | 'down') => {
      console.log('↕️ [LOCAL] 단락 순서 변경:', {
        paragraphId: targetParagraphId,
        direction: moveDirection,
      });

      // 1. 이동할 단락 찾기 2. 존재하지 않으면 작업 중단
      const targetParagraphToMove = currentParagraphs.find(
        (currentParagraph) => currentParagraph.id === targetParagraphId
      );
      if (!targetParagraphToMove || !targetParagraphToMove.containerId) return; // 1. 컨테이너에 할당되지 않은 단락은 순서 변경 불가 2. 안전성 확보

      // 1. 같은 컨테이너 내의 단락들만 필터링하고 순서대로 정렬 2. 섹션 내에서만 순서 변경
      const paragraphsInSameContainer = currentParagraphs
        .filter(
          (currentParagraph) =>
            currentParagraph.containerId === targetParagraphToMove.containerId
        )
        .sort(
          (firstParagraph, secondParagraph) =>
            firstParagraph.order - secondParagraph.order
        );

      // 1. 현재 단락의 위치 인덱스 찾기 2. 배열에서의 실제 위치 파악
      const currentPositionIndex = paragraphsInSameContainer.findIndex(
        (currentParagraph) => currentParagraph.id === targetParagraphId
      );

      // 1. 이동 불가능한 경우 체크 2. 맨 위에서 위로, 맨 아래서 아래로 이동 방지
      if (
        (moveDirection === 'up' && currentPositionIndex === 0) ||
        (moveDirection === 'down' &&
          currentPositionIndex === paragraphsInSameContainer.length - 1)
      ) {
        return; // 1. 경계값에서는 이동하지 않음 2. 불필요한 작업 방지
      }

      // 1. 목표 위치 계산 2. 위로는 -1, 아래로는 +1
      const targetPositionIndex =
        moveDirection === 'up'
          ? currentPositionIndex - 1
          : currentPositionIndex + 1;
      const swapTargetParagraph =
        paragraphsInSameContainer[targetPositionIndex]; // 1. 순서를 바꿀 상대방 단락 2. 두 단락의 order 값 교환

      // 1. 두 단락의 order 값을 서로 교환 2. 실제 순서 변경 구현
      setCurrentParagraphs((previousParagraphs) =>
        previousParagraphs.map((currentParagraph) => {
          if (currentParagraph.id === targetParagraphId) {
            return { ...currentParagraph, order: swapTargetParagraph.order };
          }
          if (currentParagraph.id === swapTargetParagraph.id) {
            return {
              ...currentParagraph,
              order: targetParagraphToMove.order,
            };
          }
          return currentParagraph; // 1. 관련 없는 단락은 그대로 유지 2. 다른 섹션에 영향 없음
        })
      );
    },
    [currentParagraphs] // 1. currentParagraphs 의존성 2. 단락 목록 변경 시 함수 재생성
  );
};

//====여기부터 수정됨====
// 모든 단락 관련 액션 함수들을 export - useEditorStateMain.ts에서 import할 수 있도록
export {
  createNewParagraph,
  updateParagraphContent,
  removeParagraph,
  toggleParagraphSelect,
  changeParagraphOrder,
};
//====여기까지 수정됨====
