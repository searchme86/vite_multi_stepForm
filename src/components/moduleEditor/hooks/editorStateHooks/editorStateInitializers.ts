import { EditorInternalState } from '../../types/editor';
import { Container } from '../../../../store/shared/commonTypes';
import {
  LocalParagraph,
  EditorUIStoreActions,
  EditorCoreStoreActions,
} from './editorStateTypes';

// ✨ [초기화 함수들] 원본과 100% 동일한 로직으로 작성

// ✨ [초기화 함수] 에디터 내부 상태 초기값 생성 함수
// 1. context 유무에 따라 다른 초기값 설정 2. 데이터 일관성 보장
const createInitialInternalState = (
  hasContext: boolean, // 1. context 존재 여부 2. 초기화 방식 결정
  editorUIStoreActions: EditorUIStoreActions // 1. UI store 액션들 2. store에서 초기값 가져오기용
): EditorInternalState => {
  try {
    //====여기부터 수정됨====
    // 항상 깨끗한 초기 상태로 시작하도록 수정
    // 1. context 유무와 관계없이 동일한 초기값 사용 2. 일관된 초기화 보장
    // 3. 이전 store 데이터 무시하고 새로운 세션 시작
    return {
      currentSubStep: 'structure', // 1. 구조 설정 단계부터 시작 2. 논리적인 에디터 진행 순서
      isTransitioning: false, // 1. 초기에는 전환 애니메이션 없음 2. 깔끔한 시작 상태
      activeParagraphId: null, // 1. 처음에는 활성 단락 없음 2. 사용자가 선택할 때까지 대기
      isPreviewOpen: true, // 1. 미리보기 모드로 시작 2. 사용자에게 결과를 바로 보여줌
      selectedParagraphIds: [], // 1. 선택된 단락 없음 2. 깔끔한 초기 상태
      targetContainerId: '', // 1. 대상 컨테이너 없음 2. 사용자 선택 대기
    };
    //====여기까지 수정됨====
  } catch (error) {
    console.error('❌ [INIT] 내부 상태 초기화 실패:', error);
    // 1. 초기화 실패 시 안전한 기본값 반환 2. 앱이 중단되지 않도록 보장
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  }
};

// ✨ [초기화 함수] 단락 초기값 생성 함수
// 1. context 유무에 따라 초기값 결정 2. 데이터 일관성을 위해
const createInitialParagraphs = (
  hasContext: boolean, // 1. context 존재 여부 2. 초기화 방식 결정
  editorCoreStoreActions: EditorCoreStoreActions // 1. Core store 액션들 2. store에서 기존 데이터 가져오기용
): LocalParagraph[] => {
  try {
    //====여기부터 수정됨====
    // 항상 빈 배열로 시작하도록 수정
    // 1. context 유무와 관계없이 빈 상태로 시작 2. 새로운 세션 보장
    // 3. 이전 store 데이터 무시하고 깨끗한 시작
    console.log('🔄 [INIT] 단락 초기화 - 항상 빈 배열로 시작');
    return [];
    //====여기까지 수정됨====
  } catch (error) {
    console.error('❌ [INIT] 단락 초기화 실패:', error);
    return []; // 안전한 빈 배열로 폴백
  }
};

// ✨ [초기화 함수] 컨테이너 초기값 생성 함수
// 1. context 유무에 따라 초기값 결정 2. 데이터 일관성을 위해
const createInitialContainers = (
  hasContext: boolean, // 1. context 존재 여부 2. 초기화 방식 결정
  editorCoreStoreActions: EditorCoreStoreActions // 1. Core store 액션들 2. store에서 기존 데이터 가져오기용
): Container[] => {
  try {
    //====여기부터 수정됨====
    // 항상 빈 배열로 시작하도록 수정
    // 1. context 유무와 관계없이 빈 상태로 시작 2. 새로운 세션 보장
    // 3. 이전 store 데이터 무시하고 깨끗한 시작
    console.log('🔄 [INIT] 컨테이너 초기화 - 항상 빈 배열로 시작');
    return [];
    //====여기까지 수정됨====
  } catch (error) {
    console.error('❌ [INIT] 컨테이너 초기화 실패:', error);
    return []; // 안전한 빈 배열로 폴백
  }
};

// 초기화 함수들을 export
export {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
};
