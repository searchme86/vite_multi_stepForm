// 📁 editor/actions/editorActions/editorActionsZustand.ts
// 🎯 **근본적 개선**: 순수 초기화 함수만 남기고 비즈니스 로직 제거

import { EditorInternalState } from '../../types/editor';
import { Container } from '../../../../store/shared/commonTypes';
import {
  LocalParagraph,
  EditorUIStoreActions,
  EditorCoreStoreActions,
} from '../../hooks/editorStateHooks/editorStateTypes';

// ✅ **순수 함수**: 비즈니스 로직 없는 초기화만
const createInitialInternalState = (
  _hasContext: boolean,
  _editorUIStoreActions: EditorUIStoreActions
): EditorInternalState => {
  try {
    console.log('🔄 [INIT] 에디터 내부 상태 초기화');
    return {
      currentSubStep: 'structure',
      isTransitioning: false,
      activeParagraphId: null,
      isPreviewOpen: true,
      selectedParagraphIds: [],
      targetContainerId: '',
    };
  } catch (error) {
    console.error('❌ [INIT] 내부 상태 초기화 실패:', error);
    // 안전한 fallback 반환
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

// ✅ **순수 함수**: 단락 초기화
const createInitialParagraphs = (
  _hasContext: boolean,
  _editorCoreStoreActions: EditorCoreStoreActions
): LocalParagraph[] => {
  try {
    console.log('🔄 [INIT] 단락 초기화 - 빈 배열로 시작');
    return [];
  } catch (error) {
    console.error('❌ [INIT] 단락 초기화 실패:', error);
    return [];
  }
};

// ✅ **순수 함수**: 컨테이너 초기화
const createInitialContainers = (
  _hasContext: boolean,
  _editorCoreStoreActions: EditorCoreStoreActions
): Container[] => {
  try {
    console.log('🔄 [INIT] 컨테이너 초기화 - 빈 배열로 시작');
    return [];
  } catch (error) {
    console.error('❌ [INIT] 컨테이너 초기화 실패:', error);
    return [];
  }
};

// 🗑️ **제거됨**: handleStructureComplete 함수
// → useEditorStateMain.ts에서 통합 관리

// ✅ **export만**: 순수 초기화 함수들만 제공
export {
  createInitialInternalState,
  createInitialParagraphs,
  createInitialContainers,
  // handleStructureComplete는 제거됨 - 중복 방지
};
