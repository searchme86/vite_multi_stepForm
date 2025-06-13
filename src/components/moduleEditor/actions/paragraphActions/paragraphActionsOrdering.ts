// 📁 actions/paragraphActions/paragraphActionsOrdering.ts

import { LocalParagraph } from '../../types/paragraph';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';

// ✨ [STATIC IMPORT] 타입 변환 함수를 static import로 가져오기
import { convertFromZustandParagraph } from './paragraphActionsTypeConverters';

// ✨ [ZUSTAND 추가] moveLocalParagraphInContainer 함수 오버로드
export function moveLocalParagraphInContainer(
  targetParagraphId: string,
  moveDirection: 'up' | 'down'
): void;
export function moveLocalParagraphInContainer(
  targetParagraphId: string,
  moveDirection: 'up' | 'down',
  currentLocalParagraphs: LocalParagraph[],
  updateLocalParagraphs: React.Dispatch<React.SetStateAction<LocalParagraph[]>>
): void;
/**
 * 컨테이너 내에서 특정 단락의 순서를 위 또는 아래로 이동시키는 함수
 * @param targetParagraphId - 이동시킬 단락의 고유 식별자
 * @param moveDirection - 이동 방향 ('up' 또는 'down')
 * @param currentLocalParagraphs - 현재 로컬 단락 배열 (선택적)
 * @param updateLocalParagraphs - 로컬 단락 배열을 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 같은 컨테이너 내에서 단락들의 표시 순서를 사용자가 조정할 수 있는 기능
 * 2. 왜 이 함수를 사용했는지: 글의 흐름을 조정하기 위해 단락 순서를 유연하게 변경할 수 있도록 하기 위해
 *
 * 실행 매커니즘:
 * 1. 대상 단락이 컨테이너에 속해있는지 확인
 * 2. 같은 컨테이너 내의 모든 단락을 순서대로 정렬
 * 3. 대상 단락의 현재 위치 찾기
 * 4. 이동 가능한 범위인지 확인 (첫 번째에서 위로, 마지막에서 아래로 이동 불가)
 * 5. 인접한 단락과 순서(order) 값을 교환
 * 6. 업데이트된 순서를 상태에 반영
 */
export function moveLocalParagraphInContainer(
  targetParagraphId: string, // ✨ [매개변수명 개선] paragraphId → targetParagraphId로 의미 명확화
  moveDirection: 'up' | 'down', // ✨ [매개변수명 개선] direction → moveDirection로 의미 명확화
  currentLocalParagraphs?: LocalParagraph[], // ✨ [매개변수명 개선] localParagraphs → currentLocalParagraphs로 의미 명확화
  updateLocalParagraphs?: React.Dispatch<React.SetStateAction<LocalParagraph[]>> // ✨ [매개변수명 개선] setLocalParagraphs → updateLocalParagraphs로 의미 명확화
) {
  if (currentLocalParagraphs && updateLocalParagraphs) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 순서 이동 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 이동하려는 대상 단락을 찾기 2. 해당 단락의 현재 정보를 확인하기 위해
    const targetParagraphToMove = currentLocalParagraphs.find(
      (currentParagraph) => currentParagraph.id === targetParagraphId
    ); // ✨ [변수명 개선] paragraph → targetParagraphToMove, p → currentParagraph로 의미 명확화

    // 1. 대상 단락이 존재하지 않거나 컨테이너에 속하지 않으면 작업 중단 2. 잘못된 상태에서는 순서 이동을 할 수 없으므로
    if (!targetParagraphToMove || !targetParagraphToMove.containerId) {
      return; // 1. 유효하지 않은 단락이면 함수 실행 중단 2. 에러 상황을 방지하기 위해
    }

    // 1. 같은 컨테이너에 속하는 모든 단락들을 찾아서 순서대로 정렬 2. 컨테이너 내에서만 순서를 조정하기 위해
    const paragraphsInSameContainer = currentLocalParagraphs // ✨ [변수명 개선] containerParagraphs → paragraphsInSameContainer로 의미 명확화
      .filter(
        (currentParagraph) =>
          currentParagraph.containerId === targetParagraphToMove.containerId
      ) // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order
      ); // ✨ [매개변수명 개선] a,b → firstParagraph,secondParagraph로 의미 명확화

    // 1. 정렬된 단락 목록에서 대상 단락의 현재 위치(인덱스)를 찾기 2. 어느 방향으로 이동할지 결정하기 위해
    const currentPositionIndex = paragraphsInSameContainer.findIndex(
      // ✨ [변수명 개선] currentIndex → currentPositionIndex로 의미 명확화
      (currentParagraph) => currentParagraph.id === targetParagraphId // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
    );

    // 1. 이동 불가능한 상황인지 확인 2. 첫 번째 단락을 위로, 마지막 단락을 아래로 이동하려는 경우 차단
    if (
      (moveDirection === 'up' && currentPositionIndex === 0) || // 1. 첫 번째 단락을 위로 이동하려는 경우 2. 더 이상 위로 갈 수 없으므로
      (moveDirection === 'down' &&
        currentPositionIndex === paragraphsInSameContainer.length - 1) // 1. 마지막 단락을 아래로 이동하려는 경우 2. 더 이상 아래로 갈 수 없으므로
    ) {
      return; // 1. 이동 불가능한 상황이면 함수 실행 중단 2. 잘못된 이동을 방지하기 위해
    }

    // 1. 이동 방향에 따라 교환할 대상의 위치를 계산 2. 인접한 단락과 순서를 바꾸기 위해
    const targetPositionIndex = // ✨ [변수명 개선] targetIndex → targetPositionIndex로 의미 명확화
      moveDirection === 'up'
        ? currentPositionIndex - 1
        : currentPositionIndex + 1; // 1. 위로 이동이면 이전 위치, 아래로 이동이면 다음 위치 2. 인접한 단락과 자리를 바꾸기 위해

    // 1. 교환할 대상 단락을 찾기 2. 순서를 바꿀 상대방 단락 정보가 필요하므로
    const swapTargetParagraph = paragraphsInSameContainer[targetPositionIndex]; // ✨ [변수명 개선] targetParagraph → swapTargetParagraph로 의미 명확화

    // 1. 모든 단락을 확인하여 두 단락의 순서만 교환 2. 나머지 단락들은 변경하지 않고 특정 두 단락만 순서를 바꾸기 위해
    updateLocalParagraphs(
      (
        previousParagraphs // ✨ [매개변수명 개선] prev → previousParagraphs로 의미 명확화
      ) =>
        previousParagraphs.map((currentParagraph) => {
          // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
          if (currentParagraph.id === targetParagraphId) {
            // 1. 이동하려는 단락이면 교환 대상의 순서로 변경 2. 원하는 위치로 이동하기 위해
            return { ...currentParagraph, order: swapTargetParagraph.order };
          }
          if (currentParagraph.id === swapTargetParagraph.id) {
            // 1. 교환 대상 단락이면 이동하려는 단락의 순서로 변경 2. 자리를 서로 바꾸기 위해
            return { ...currentParagraph, order: targetParagraphToMove.order };
          }
          // 1. 관련 없는 다른 단락들은 그대로 반환 2. 순서 교환에 관련 없는 단락들은 변경하지 않기 위해
          return currentParagraph;
        })
    );
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 순서 이동 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand Core 스토어에서 데이터 관리 함수들을 가져옴 2. 단락 정보를 조회하고 업데이트하기 위해
    const editorCoreStoreActions = useEditorCoreStore.getState(); // ✨ [변수명 개선] editorCoreStore → editorCoreStoreActions로 의미 명확화

    // 1. Zustand 스토어에서 모든 단락을 조회하고 기존 타입으로 변환 2. 기존 로직과 호환성을 유지하기 위해
    const allParagraphsFromStore = editorCoreStoreActions // ✨ [변수명 개선] allParagraphs → allParagraphsFromStore로 의미 명확화
      .getParagraphs()
      .map(convertFromZustandParagraph); // 1. Zustand 타입을 기존 타입으로 변환 2. 기존 로직을 재사용하기 위해

    // 1. 이동하려는 대상 단락을 찾기 2. 해당 단락의 현재 정보를 확인하기 위해
    const targetParagraphToMoveFromStore = allParagraphsFromStore.find(
      (currentParagraph) => currentParagraph.id === targetParagraphId
    ); // ✨ [변수명 개선] paragraph → targetParagraphToMoveFromStore, p → currentParagraph로 의미 명확화

    // 1. 대상 단락이 존재하지 않거나 컨테이너에 속하지 않으면 작업 중단 2. 잘못된 상태에서는 순서 이동을 할 수 없으므로
    if (
      !targetParagraphToMoveFromStore ||
      !targetParagraphToMoveFromStore.containerId
    ) {
      return; // 1. 유효하지 않은 단락이면 함수 실행 중단 2. 에러 상황을 방지하기 위해
    }

    // 1. 같은 컨테이너에 속하는 모든 단락들을 찾아서 순서대로 정렬 2. 컨테이너 내에서만 순서를 조정하기 위해
    const paragraphsInSameContainerFromStore = allParagraphsFromStore // ✨ [변수명 개선] containerParagraphs → paragraphsInSameContainerFromStore로 의미 명확화
      .filter(
        (currentParagraph) =>
          currentParagraph.containerId ===
          targetParagraphToMoveFromStore.containerId
      ) // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      .sort(
        (firstParagraph, secondParagraph) =>
          firstParagraph.order - secondParagraph.order
      ); // ✨ [매개변수명 개선] a,b → firstParagraph,secondParagraph로 의미 명확화

    // 1. 정렬된 단락 목록에서 대상 단락의 현재 위치(인덱스)를 찾기 2. 어느 방향으로 이동할지 결정하기 위해
    const currentPositionIndexFromStore =
      paragraphsInSameContainerFromStore.findIndex(
        // ✨ [변수명 개선] currentIndex → currentPositionIndexFromStore로 의미 명확화
        (currentParagraph) => currentParagraph.id === targetParagraphId // ✨ [매개변수명 개선] p → currentParagraph로 의미 명확화
      );

    // 1. 이동 불가능한 상황인지 확인 2. 첫 번째 단락을 위로, 마지막 단락을 아래로 이동하려는 경우 차단
    if (
      (moveDirection === 'up' && currentPositionIndexFromStore === 0) || // 1. 첫 번째 단락을 위로 이동하려는 경우 2. 더 이상 위로 갈 수 없으므로
      (moveDirection === 'down' &&
        currentPositionIndexFromStore ===
          paragraphsInSameContainerFromStore.length - 1) // 1. 마지막 단락을 아래로 이동하려는 경우 2. 더 이상 아래로 갈 수 없으므로
    ) {
      return; // 1. 이동 불가능한 상황이면 함수 실행 중단 2. 잘못된 이동을 방지하기 위해
    }

    // 1. 이동 방향에 따라 교환할 대상의 위치를 계산 2. 인접한 단락과 순서를 바꾸기 위해
    const targetPositionIndexFromStore = // ✨ [변수명 개선] targetIndex → targetPositionIndexFromStore로 의미 명확화
      moveDirection === 'up'
        ? currentPositionIndexFromStore - 1
        : currentPositionIndexFromStore + 1; // 1. 위로 이동이면 이전 위치, 아래로 이동이면 다음 위치 2. 인접한 단락과 자리를 바꾸기 위해

    // 1. 교환할 대상 단락을 찾기 2. 순서를 바꿀 상대방 단락 정보가 필요하므로
    const swapTargetParagraphFromStore =
      paragraphsInSameContainerFromStore[targetPositionIndexFromStore]; // ✨ [변수명 개선] targetParagraph → swapTargetParagraphFromStore로 의미 명확화

    // 1. Zustand 스토어의 업데이트 메서드를 사용하여 두 단락의 순서를 교환 2. 스토어의 내장 업데이트 로직을 활용하기 위해

    // 1. 첫 번째 단락(이동하려는 단락)의 순서를 교환 대상의 순서로 변경 2. 원하는 위치로 이동하기 위해
    editorCoreStoreActions.updateParagraph(targetParagraphId, {
      order: swapTargetParagraphFromStore.order, // 1. 교환 대상의 순서로 업데이트 2. 자리를 바꾸기 위해
    });

    // 1. 두 번째 단락(교환 대상 단락)의 순서를 이동하려는 단락의 순서로 변경 2. 자리를 서로 바꾸기 위해
    editorCoreStoreActions.updateParagraph(swapTargetParagraphFromStore.id, {
      order: targetParagraphToMoveFromStore.order, // 1. 이동하려는 단락의 순서로 업데이트 2. 완전한 순서 교환을 위해
    });
  }
}
