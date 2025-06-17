import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { Container, ToastOptions } from '../../../../store/shared/commonTypes';
import { LocalParagraph, EditorUIStoreActions } from './editorStateTypes';

// ✨ [컨테이너 액션 함수] 원본과 100% 동일한 로직으로 작성

// ✨ [액션 함수] 컨테이너에 단락 추가 함수 - 사용자가 선택한 단락들을 특정 섹션에 배치할 때 사용
const addParagraphsToContainer = (
  selectedElementIdCollection: string[], // 1. 현재 선택된 단락들의 ID 목록 2. 원본 변수명과 일치
  targetDestinationIdValue: string, // 1. 단락들을 추가할 목표 컨테이너 ID 2. 원본 변수명과 일치
  managedParagraphCollection: LocalParagraph[], // 1. 현재 모든 단락 목록 2. 원본 변수명과 일치
  managedContainerCollection: Container[], // 1. 현재 모든 컨테이너 목록 2. 원본 변수명과 일치
  setManagedParagraphCollection: React.Dispatch<
    React.SetStateAction<LocalParagraph[]>
  >, // 1. 단락 목록 업데이트 함수 2. 새로운 단락들 추가 후 상태 갱신
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 선택 상태 초기화
  showToastFunction: (options: ToastOptions) => void, // 1. 사용자 알림 함수 2. 성공/실패 메시지 표시
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  clearSelectedParagraphsInStore: () => void // 1. store 선택 상태 초기화 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(() => {
    console.log('📦 [LOCAL] 컨테이너에 단락 추가 시작');

    try {
      // 1. 선택된 단락이 없는 경우 경고 메시지 2. 사용자 실수 방지
      if (
        !selectedElementIdCollection ||
        selectedElementIdCollection.length === 0
      ) {
        if (showToastFunction) {
          showToastFunction({
            title: '선택된 단락 없음',
            description: '컨테이너에 추가할 단락을 선택해주세요.',
            color: 'warning',
          });
        }
        return;
      }

      // 1. 대상 컨테이너가 선택되지 않은 경우 경고 메시지 2. 필수 조건 확인
      if (!targetDestinationIdValue) {
        if (showToastFunction) {
          showToastFunction({
            title: '컨테이너 미선택',
            description: '단락을 추가할 컨테이너를 선택해주세요.',
            color: 'warning',
          });
        }
        return;
      }

      const safeParagraphCollection = managedParagraphCollection || [];
      const safeContainerCollection = managedContainerCollection || [];

      // 1. 대상 컨테이너에 이미 있는 단락들을 조회하여 다음 순서 번호 계산
      // 2. 새로 추가되는 단락들이 기존 단락들 뒤에 올바른 순서로 배치되도록 보장
      const existingParagraphsInTargetContainer =
        safeParagraphCollection.filter((currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return safeParagraph.containerId === targetDestinationIdValue;
        });

      // 1. 기존 문단들 중 가장 큰 order 값을 찾아 새 문단들의 시작 order 결정
      // 2. 빈 컨테이너인 경우 -1로 설정하여 새 문단들이 0부터 시작하도록 처리
      const lastOrderValueInContainer =
        existingParagraphsInTargetContainer.length > 0
          ? Math.max(
              ...existingParagraphsInTargetContainer.map(
                (currentParagraphItem) => {
                  const safeParagraph = currentParagraphItem || {};
                  return safeParagraph.order || 0;
                }
              )
            )
          : -1;

      // 1. 선택된 문단 ID들을 실제 문단 객체들로 변환
      // 2. ID만으로는 내용을 복사할 수 없으므로 전체 문단 정보 조회
      const selectedParagraphsToAddToContainer = safeParagraphCollection.filter(
        (currentParagraphItem) => {
          const safeParagraph = currentParagraphItem || {};
          return selectedElementIdCollection.includes(safeParagraph.id || '');
        }
      );

      // 1. 선택된 문단들의 복사본을 생성하여 새로운 ID와 컨테이너 정보 할당
      // 2. 원본 문단은 그대로 두고 사본을 만들어 다른 컨테이너에서도 재사용 가능
      const newParagraphsToAddToContainer =
        selectedParagraphsToAddToContainer.map(
          (currentParagraphItem, currentIterationIndex) => {
            const safeParagraph = currentParagraphItem || {};
            return {
              ...safeParagraph,
              // 새로운 고유 ID 생성 (시간 + 인덱스 + 랜덤값으로 완전한 고유성 보장)
              id: `paragraph-copy-${Date.now()}-${currentIterationIndex}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
              originalId: safeParagraph.id, // 원본 문단 추적을 위한 참조 ID 보관
              containerId: targetDestinationIdValue, // 타겟 컨테이너에 할당
              order: lastOrderValueInContainer + currentIterationIndex + 1, // 기존 문단들 뒤에 순서대로 배치
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        );

      // 1. 로컬 문단 컬렉션에 새로 생성한 문단들 추가
      // 2. 스프레드 연산자로 기존 배열과 새 배열을 합쳐 불변성 유지
      setManagedParagraphCollection((previousParagraphCollection) => {
        const safePreviousCollection = previousParagraphCollection || [];
        return [...safePreviousCollection, ...newParagraphsToAddToContainer];
      });

      // 1. 문단 추가 작업 완료 후 선택 상태와 타겟 컨테이너 초기화
      // 2. 다음 작업을 위해 깨끗한 상태로 리셋
      setEditorInternalState((previousInternalState) => ({
        ...(previousInternalState || {}),
        selectedParagraphIds: [],
        targetContainerId: '',
      }));

      // 1. context가 없을 때만 Zustand 스토어에서도 선택 상태 초기화
      // 2. 모든 컴포넌트에서 선택이 해제된 상태로 동기화
      if (!hasContext && clearSelectedParagraphsInStore) {
        clearSelectedParagraphsInStore();
      }

      // 1. 성공 메시지에 포함할 컨테이너 이름 조회
      // 2. 사용자가 어떤 컨테이너에 추가되었는지 명확히 알 수 있도록 정보 제공
      const targetContainerInformation = safeContainerCollection.find(
        (currentContainerItem) => {
          const safeContainer = currentContainerItem || {};
          return safeContainer.id === targetDestinationIdValue;
        }
      );

      // 1. 성공 완료 토스트 메시지 표시
      // 2. 몇 개의 문단이 어떤 컨테이너에 추가되었는지 구체적 정보 제공
      if (showToastFunction) {
        showToastFunction({
          title: '단락 추가 완료',
          description: `${
            selectedParagraphsToAddToContainer.length
          }개의 단락이 ${
            targetContainerInformation?.name || '컨테이너'
          }에 추가되었습니다.`,
          color: 'success',
        });
      }
    } catch (error) {
      console.error('❌ [LOCAL] 컨테이너에 단락 추가 실패:', error);
      if (showToastFunction) {
        showToastFunction({
          title: '추가 실패',
          description: '단락을 컨테이너에 추가하는 중 오류가 발생했습니다.',
          color: 'danger',
        });
      }
    }
  }, [
    selectedElementIdCollection,
    targetDestinationIdValue,
    managedParagraphCollection,
    managedContainerCollection,
    hasContext,
    clearSelectedParagraphsInStore,
    showToastFunction,
  ]);
};

// 컨테이너 관련 액션 함수를 export
export { addParagraphsToContainer };
