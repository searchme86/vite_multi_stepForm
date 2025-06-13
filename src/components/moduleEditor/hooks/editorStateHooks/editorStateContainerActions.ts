import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
// import { Container, ToastOptions } from '../../store/shared/commonTypes';
import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph, EditorUIStoreActions } from './editorStateTypes';
import { updateZustandStoreIfNeeded } from './editorStateHelpers';

// ✨ [컨테이너 액션 함수] 원본과 동일한 구조로 작성 - HOF 패턴 제거하고 직접 사용 방식 적용

// ✨ [액션 함수] 컨테이너에 단락 추가 함수 - 사용자가 선택한 단락들을 특정 섹션에 배치할 때 사용
const addParagraphsToContainer = (
  selectedElementIds: string[], // 1. 현재 선택된 단락들의 ID 목록 2. 사용자가 체크박스로 선택한 항목들
  targetDestinationId: string, // 1. 단락들을 추가할 목표 컨테이너 ID 2. 사용자가 선택한 섹션
  currentParagraphs: LocalParagraph[], // 1. 현재 모든 단락 목록 2. 선택된 단락들을 찾기 위한 전체 데이터
  currentContainers: Container[], // 1. 현재 모든 컨테이너 목록 2. 대상 컨테이너 정보 확인용
  setCurrentParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>, // 1. 단락 목록 업데이트 함수 2. 새로운 단락들 추가 후 상태 갱신
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 선택 상태 초기화
  showToastFunction: (options: ToastOptions) => void, // 1. 사용자 알림 함수 2. 성공/실패 메시지 표시
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  editorUIStoreActions: EditorUIStoreActions // 1. UI store 액션들 2. 상태 동기화용
) => {
  return useCallback(() => {
    console.log('📦 [LOCAL] 컨테이너에 단락 추가 시작');

    // 1. 선택된 단락이 없는 경우 경고 메시지 2. 사용자 실수 방지
    if (selectedElementIds.length === 0) {
      showToastFunction({
        title: '선택된 단락 없음',
        description: '컨테이너에 추가할 단락을 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    // 1. 대상 컨테이너가 선택되지 않은 경우 경고 메시지 2. 필수 조건 확인
    if (!targetDestinationId) {
      showToastFunction({
        title: '컨테이너 미선택',
        description: '단락을 추가할 컨테이너를 선택해주세요.',
        color: 'warning',
      });
      return;
    }

    // 1. 대상 컨테이너에 이미 있는 단락들 찾기 2. 새로운 단락의 순서 결정을 위해
    const existingParagraphsInTarget = currentParagraphs.filter(
      (currentParagraphItem) =>
        currentParagraphItem.containerId === targetDestinationId
    );

    // 1. 컨테이너 내 마지막 순서 번호 계산 2. 새로운 단락들을 맨 뒤에 배치하기 위해
    const lastOrderInContainer =
      existingParagraphsInTarget.length > 0
        ? Math.max(
            ...existingParagraphsInTarget.map(
              (currentParagraphItem) => currentParagraphItem.order
            )
          )
        : -1; // 1. 빈 컨테이너인 경우 -1로 설정 2. 첫 번째 단락이 0번이 되도록

    // 1. 선택된 단락들의 실제 데이터 가져오기 2. ID로만 있던 정보를 전체 객체로 확장
    const selectedParagraphsToAdd = currentParagraphs.filter(
      (currentParagraphItem) =>
        selectedElementIds.includes(currentParagraphItem.id)
    );

    // 1. 선택된 단락들을 복사해서 새로운 단락들 생성 2. 원본은 유지하고 사본을 컨테이너에 배치
    const newParagraphsToAdd = selectedParagraphsToAdd.map(
      (currentSelectedParagraph, currentOrderIndex) => ({
        ...currentSelectedParagraph,
        id: `paragraph-copy-${Date.now()}-${currentOrderIndex}-${Math.random()
          .toString(36)
          .substr(2, 9)}`, // 1. 새로운 고유 ID 생성 2. 원본과 구분되는 복사본
        originalId: currentSelectedParagraph.id, // 1. 원본 ID 기록 2. 나중에 추적이나 참조 가능
        containerId: targetDestinationId, // 1. 대상 컨테이너에 할당 2. 섹션 소속 명확화
        order: lastOrderInContainer + currentOrderIndex + 1, // 1. 순차적으로 순서 번호 부여 2. 기존 단락들 뒤에 배치
        createdAt: new Date(), // 1. 새로운 생성 시간 2. 복사본의 생성 이력
        updatedAt: new Date(), // 1. 수정 시간 초기화 2. 복사본의 수정 추적 시작
      })
    );

    // 1. 새로운 단락들을 전체 목록에 추가 2. 기존 단락들과 새 단락들 병합
    setCurrentParagraphs((previousParagraphList) => [
      ...previousParagraphList,
      ...newParagraphsToAdd,
    ]);

    // 1. 선택 상태와 대상 컨테이너 초기화 2. 다음 작업을 위한 깔끔한 상태
    setEditorInternalState((previousInternalState) => ({
      ...previousInternalState,
      selectedParagraphIds: [], // 1. 선택된 단락 목록 비우기 2. 작업 완료 후 초기화
      targetContainerId: '', // 1. 대상 컨테이너 선택 해제 2. 다음 작업 준비
    }));

    // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성 유지
    updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
      editorUIStoreActions.clearSelectedParagraphs();
    });

    // 1. 대상 컨테이너 정보 찾기 2. 성공 메시지에 섹션 이름 표시
    const targetContainerInfo = currentContainers.find(
      (currentContainerItem) => currentContainerItem.id === targetDestinationId
    );

    // 1. 사용자에게 성공 메시지 표시 2. 몇 개의 단락이 어느 섹션에 추가되었는지 알림
    showToastFunction({
      title: '단락 추가 완료',
      description: `${selectedParagraphsToAdd.length}개의 단락이 ${
        targetContainerInfo?.name || '컨테이너'
      }에 추가되었습니다.`,
      color: 'success',
    });
  }, [
    selectedElementIds,
    targetDestinationId,
    currentParagraphs,
    currentContainers,
    showToastFunction,
    hasContext,
    editorUIStoreActions,
  ]); // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
};

//====여기부터 수정됨====
// 컨테이너 관련 액션 함수를 export - useEditorStateMain.ts에서 import할 수 있도록
export { addParagraphsToContainer };
//====여기까지 수정됨====
