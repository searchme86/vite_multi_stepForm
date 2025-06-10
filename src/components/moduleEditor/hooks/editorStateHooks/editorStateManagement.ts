import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { EditorUIStoreActions } from './editorStateTypes';
import { updateZustandStoreIfNeeded } from './editorStateHelpers';

// ✨ [상태 관리 함수들] 원본과 동일한 구조로 작성 - HOF 패턴 제거하고 직접 사용 방식 적용

// ✨ [상태 관리 함수] 선택된 단락들 업데이트 함수 - 사용자가 체크박스로 선택한 단락 목록을 관리
const updateSelectedParagraphs = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(
    (paragraphIds: string[]) => {
      console.log('🎛️ [HOOK] updateSelectedParagraphs 호출:', {
        count: paragraphIds.length, // 1. 선택된 단락 개수 로깅 2. 다중 선택 상태 추적
      });

      // 1. 에디터 내부 상태의 선택된 단락 목록 업데이트 2. UI 체크박스 상태 동기화
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        selectedParagraphIds: paragraphIds, // 1. 새로운 선택 목록으로 교체 2. 전체 선택 상태 갱신
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setSelectedParagraphIds(paragraphIds);
      });
    },
    [hasContext, editorUIStoreActions] // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
  );
};

// ✨ [상태 관리 함수] 타겟 컨테이너 업데이트 함수 - 사용자가 단락을 이동할 목표 섹션을 설정
const updateTargetContainer = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(
    (targetContainerId: string) => {
      console.log('🎛️ [HOOK] updateTargetContainer 호출:', targetContainerId);

      // 1. 에디터 내부 상태의 대상 컨테이너 ID 업데이트 2. 드래그앤드롭 대상 설정
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        targetContainerId: targetContainerId, // 1. 새로운 대상 컨테이너로 설정 2. 단락 이동 준비
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setTargetContainerId(targetContainerId);
      });
    },
    [hasContext, editorUIStoreActions] // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
  );
};

// ✨ [상태 관리 함수] 활성 단락 업데이트 함수 - 현재 편집 중이거나 포커스된 단락을 설정
const updateActiveParagraph = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >,
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
) => {
  return useCallback(
    (paragraphId: string | null) => {
      console.log('🎛️ [HOOK] updateActiveParagraph 호출:', paragraphId);

      // 1. 에디터 내부 상태의 활성 단락 ID 업데이트 2. 현재 편집 중인 단락 추적
      setEditorInternalState((previousInternalState) => ({
        ...previousInternalState,
        activeParagraphId: paragraphId, // 1. 새로운 활성 단락으로 설정 2. null이면 포커스 해제
      }));

      // 1. context가 없을 때 zustand store도 업데이트 2. 상태 일관성을 위해
      updateZustandStoreIfNeeded(hasContext, editorUIStoreActions, () => {
        editorUIStoreActions.setActiveParagraphId(paragraphId);
      });
    },
    [hasContext, editorUIStoreActions] // 1. 의존성 배열을 원본과 동일하게 유지 2. 정확한 업데이트 타이밍 보장
  );
};

//====여기부터 수정됨====
// 상태 관리 함수들을 export - useEditorStateMain.ts에서 import할 수 있도록
export {
  updateSelectedParagraphs,
  updateTargetContainer,
  updateActiveParagraph,
};
//====여기까지 수정됨====
