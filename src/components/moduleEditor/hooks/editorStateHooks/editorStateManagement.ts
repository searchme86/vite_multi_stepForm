import { useCallback } from 'react';
import { EditorInternalState } from '../../types/editor';
import { EditorUIStoreActions } from './editorStateTypes';

// ✨ [상태 관리 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [상태 관리 함수] 선택된 단락들 업데이트 함수 - 사용자가 체크박스로 선택한 단락 목록을 관리
const updateSelectedParagraphs = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 선택 상태 관리
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  updateSelectedParagraphIdsInStore: (ids: string[]) => void // 1. store 선택 상태 업데이트 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(
    (paragraphIdCollectionToUpdate: string[]) => {
      console.log('🎛️ [HOOK] updateSelectedParagraphs 호출:', {
        count: paragraphIdCollectionToUpdate?.length || 0, // 선택된 단락 개수 로깅
      });

      try {
        // 1. 입력 배열의 안전성 검증 및 기본값 설정
        // 2. null이나 undefined가 들어와도 빈 배열로 처리하여 런타임 에러 방지
        const safeParagraphIdCollection = Array.isArray(
          paragraphIdCollectionToUpdate
        )
          ? paragraphIdCollectionToUpdate
          : [];

        // 1. 로컬 내부 상태의 선택된 문단 ID 목록 업데이트
        // 2. 현재 컴포넌트에서 선택 상태 변경사항을 즉시 반영
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          selectedParagraphIds: safeParagraphIdCollection,
        }));

        // 1. context가 없을 때만 Zustand 글로벌 스토어에도 동일한 선택 상태 동기화
        // 2. 다른 컴포넌트들도 변경된 선택 상태를 공유할 수 있도록 업데이트
        if (!hasContext && updateSelectedParagraphIdsInStore) {
          updateSelectedParagraphIdsInStore(safeParagraphIdCollection);
        }
      } catch (error) {
        console.error('❌ [HOOK] 선택된 문단 업데이트 실패:', error);
      }
    },
    [hasContext, updateSelectedParagraphIdsInStore]
  );
};

// ✨ [상태 관리 함수] 타겟 컨테이너 업데이트 함수 - 사용자가 단락을 이동할 목표 섹션을 설정
const updateTargetContainer = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 타겟 컨테이너 설정
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  updateTargetContainerIdInStore: (containerId: string) => void // 1. store 타겟 컨테이너 업데이트 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(
    (targetContainerIdToUpdate: string) => {
      console.log(
        '🎛️ [HOOK] updateTargetContainer 호출:',
        targetContainerIdToUpdate
      );

      try {
        // 1. 컨테이너 ID의 안전성 검증 및 기본값 설정
        // 2. null이나 undefined 입력에 대해 빈 문자열로 처리하여 안정성 보장
        const safeContainerIdValue = targetContainerIdToUpdate || '';

        // 1. 로컬 내부 상태의 타겟 컨테이너 ID 업데이트
        // 2. 현재 어떤 컨테이너가 목적지로 선택되었는지 추적
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          targetContainerId: safeContainerIdValue,
        }));

        // 1. context가 없을 때만 Zustand 글로벌 스토어에도 타겟 컨테이너 정보 동기화
        // 2. 다른 컴포넌트들도 현재 타겟 컨테이너 정보를 공유할 수 있도록 업데이트
        if (!hasContext && updateTargetContainerIdInStore) {
          updateTargetContainerIdInStore(safeContainerIdValue);
        }
      } catch (error) {
        console.error('❌ [HOOK] 타겟 컨테이너 업데이트 실패:', error);
      }
    },
    [hasContext, updateTargetContainerIdInStore]
  );
};

// ✨ [상태 관리 함수] 활성 단락 업데이트 함수 - 현재 편집 중이거나 포커스된 단락을 설정
const updateActiveParagraph = (
  setEditorInternalState: React.Dispatch<
    React.SetStateAction<EditorInternalState>
  >, // 1. 에디터 내부 상태 업데이트 함수 2. 활성 단락 관리
  hasContext: boolean, // 1. context 존재 여부 2. zustand store 업데이트 여부 결정
  _editorUIStoreActions: EditorUIStoreActions, // 1. UI store 액션들 2. 인터페이스 일관성을 위해 유지하지만 사용하지 않음을 명시
  updateActiveParagraphIdInStore: (id: string | null) => void // 1. store 활성 단락 업데이트 함수 2. 원본과 동일한 시그니처
) => {
  return useCallback(
    (paragraphIdToActivate: string | null) => {
      console.log(
        '🎛️ [HOOK] updateActiveParagraph 호출:',
        paragraphIdToActivate
      );

      try {
        // 1. 로컬 내부 상태의 활성 문단 ID 업데이트
        // 2. null 값도 허용하여 모든 문단을 비활성화할 수 있도록 처리
        setEditorInternalState((previousInternalState) => ({
          ...(previousInternalState || {}),
          activeParagraphId: paragraphIdToActivate,
        }));

        // 1. context가 없을 때만 Zustand 글로벌 스토어에도 활성 문단 정보 동기화
        // 2. 다른 컴포넌트들도 현재 활성 문단 변경사항을 인지할 수 있도록 업데이트
        if (!hasContext && updateActiveParagraphIdInStore) {
          updateActiveParagraphIdInStore(paragraphIdToActivate);
        }
      } catch (error) {
        console.error('❌ [HOOK] 활성 문단 업데이트 실패:', error);
      }
    },
    [hasContext, updateActiveParagraphIdInStore]
  );
};

// 상태 관리 함수들을 export
export {
  updateSelectedParagraphs,
  updateTargetContainer,
  updateActiveParagraph,
};
