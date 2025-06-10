import { EditorInternalState } from '../../types/editor';
import { Container } from '../../store/shared/commonTypes';
import {
  LocalParagraph,
  EditorUIStoreActions,
  EditorCoreStoreActions,
} from './editorStateTypes';

// ✨ [초기화 함수] 에디터 내부 상태 초기값 생성 함수
// 1. context 유무에 따라 다른 초기값 설정 2. 데이터 일관성 보장
const createInitialInternalState = (
  hasContext: boolean,
  editorUIStoreActions: EditorUIStoreActions
): EditorInternalState => {
  if (!hasContext) {
    // 1. context가 없으면 zustand store에서 초기값 가져오기 2. 상태 일관성을 유지하기 위해
    return {
      currentSubStep: editorUIStoreActions.getCurrentSubStep(), // 1. 현재 단계 정보 2. 에디터가 어느 단계에 있는지 표시
      isTransitioning: editorUIStoreActions.getIsTransitioning(), // 1. 전환 애니메이션 상태 2. UI 부드러운 전환 효과
      activeParagraphId: editorUIStoreActions.getActiveParagraphId(), // 1. 현재 편집 중인 단락 ID 2. 포커스 관리
      isPreviewOpen: editorUIStoreActions.getIsPreviewOpen(), // 1. 미리보기 모드 상태 2. 사용자 설정 유지
      selectedParagraphIds: editorUIStoreActions.getSelectedParagraphIds(), // 1. 선택된 단락들 목록 2. 다중 선택 기능 지원
      targetContainerId: editorUIStoreActions.getTargetContainerId(), // 1. 단락을 이동할 대상 컨테이너 2. 드래그앤드롭 기능 지원
    };
  }
  // 1. context가 있으면 기본 초기값 사용 2. 기존 동작 방식 유지를 위해
  return {
    currentSubStep: 'structure', // 1. 구조 설정 단계부터 시작 2. 논리적인 에디터 진행 순서
    isTransitioning: false, // 1. 초기에는 전환 애니메이션 없음 2. 깔끔한 시작 상태
    activeParagraphId: null, // 1. 처음에는 활성 단락 없음 2. 사용자가 선택할 때까지 대기
    isPreviewOpen: true, // 1. 미리보기 모드로 시작 2. 사용자에게 결과를 바로 보여줌
    selectedParagraphIds: [], // 1. 선택된 단락 없음 2. 깔끔한 초기 상태
    targetContainerId: '', // 1. 대상 컨테이너 없음 2. 사용자 선택 대기
  };
};

// ✨ [초기화 함수] 단락 초기값 생성 함수
// 1. context 유무에 따라 초기값 결정 2. 데이터 일관성을 위해
const createInitialParagraphs = (
  hasContext: boolean,
  editorCoreStoreActions: EditorCoreStoreActions
): LocalParagraph[] => {
  // 1. context가 있으면 빈 배열로 시작 2. context에서 데이터 받아올 예정
  // 3. context가 없으면 store에서 기존 데이터 가져오기 4. 이전 작업 내용 복원
  return hasContext ? [] : editorCoreStoreActions.getParagraphs();
};

// ✨ [초기화 함수] 컨테이너 초기값 생성 함수
// 1. context 유무에 따라 초기값 결정 2. 데이터 일관성을 위해
const createInitialContainers = (
  hasContext: boolean,
  editorCoreStoreActions: EditorCoreStoreActions
): Container[] => {
  // 1. context가 있으면 빈 배열로 시작 2. context에서 데이터 받아올 예정
  // 3. context가 없으면 store에서 기존 데이터 가져오기 4. 이전 작업 내용 복원
  return hasContext ? [] : editorCoreStoreActions.getContainers();
};

export {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
};
