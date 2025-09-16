// 📁 actions/paragraphActions/paragraphActionsSelection.ts

import { EditorInternalState } from '../../types/editor';

// ✨ [ZUSTAND 추가] context 대신 zustand 스토어 import 추가
import { useEditorUIStore } from '../../../../store/editorUI/editorUIStore';

// ✨ [ZUSTAND 추가] toggleParagraphSelection 함수 오버로드
export function toggleParagraphSelection(targetParagraphId: string): void;
export function toggleParagraphSelection(
  targetParagraphId: string,
  updateInternalState: React.Dispatch<React.SetStateAction<EditorInternalState>>
): void;
/**
 * 특정 단락의 선택 상태를 토글하는 함수
 * @param targetParagraphId - 선택 상태를 토글할 단락의 고유 식별자
 * @param updateInternalState - 에디터 내부 상태를 업데이트하는 함수 (선택적)
 *
 * 1. 이 함수의 의미: 단락을 선택하거나 선택 해제하는 토글 기능으로, 다중 선택을 지원
 * 2. 왜 이 함수를 사용했는지: 여러 단락을 한 번에 선택하여 일괄 작업(이동, 삭제 등)을 할 수 있도록 하기 위해
 *
 * 실행 매커니즘:
 * 1. 현재 선택된 단락 목록을 확인
 * 2. 대상 단락이 이미 선택되어 있는지 확인
 * 3. 선택되어 있으면 선택 목록에서 제거 (선택 해제)
 * 4. 선택되어 있지 않으면 선택 목록에 추가 (선택)
 * 5. 업데이트된 선택 목록을 상태에 저장
 */
export function toggleParagraphSelection(
  targetParagraphId: string, // ✨ [매개변수명 개선] paragraphId → targetParagraphId로 의미 명확화
  updateInternalState?: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  > // ✨ [매개변수명 개선] setInternalState → updateInternalState로 의미 명확화
) {
  if (updateInternalState) {
    // ✅ 기존 방식 (context) - 1. Context API를 사용하는 기존 방식의 선택 상태 토글 2. 기존 시스템과의 호환성 유지를 위해

    // 1. 현재 상태를 기반으로 선택 목록을 업데이트 2. 기존 선택 상태를 확인하고 토글 로직을 적용하기 위해
    updateInternalState((previousState: EditorInternalState) => ({
      // ✨ [매개변수명 개선] prev → previousState로 의미 명확화
      ...previousState, // 1. 기존 상태의 모든 속성을 유지 2. 선택 목록 외의 다른 상태는 변경하지 않기 위해
      selectedParagraphIds: previousState.selectedParagraphIds.includes(
        targetParagraphId
      )
        ? // 1. 대상 단락이 이미 선택된 상태인지 확인 2. 선택 해제할지 선택할지 결정하기 위해
          previousState.selectedParagraphIds.filter(
            (currentId: string) => currentId !== targetParagraphId
          ) // ✨ [매개변수명 개선] id → currentId로 의미 명확화
        : // 1. 이미 선택된 경우: 선택 목록에서 해당 ID를 제거 2. 선택 해제 기능을 구현하기 위해
          [...previousState.selectedParagraphIds, targetParagraphId], // 1. 선택되지 않은 경우: 선택 목록에 해당 ID를 추가 2. 다중 선택 기능을 구현하기 위해
    }));
  } else {
    // ✨ [ZUSTAND 변경] 새로운 방식 (zustand) - 1. Zustand 스토어를 사용하는 새로운 방식의 선택 상태 토글 2. 상태 관리 시스템 마이그레이션을 위해

    // 1. Zustand UI 스토어에서 상태 관리 함수들을 가져옴 2. 선택 상태를 관리하기 위해
    const editorUIStoreActions = useEditorUIStore.getState(); // ✨ [변수명 개선] editorUIStore → editorUIStoreActions로 의미 명확화

    // 1. 스토어에서 제공하는 토글 메서드를 사용 2. Zustand의 내장 토글 로직을 활용하여 일관성 있는 상태 관리를 위해
    editorUIStoreActions.toggleParagraphSelection(targetParagraphId);
  }
}
