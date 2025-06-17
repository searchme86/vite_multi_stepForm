import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';
//====여기부터 수정됨====
import { EditorStateSnapshotForBridge } from './bridgeTypes';

// 에디터 상태를 안전하게 추출하는 핸들러 생성 함수
// Zustand 스토어에서 현재 상태를 읽어와 브릿지용 스냅샷으로 변환
export const createEditorStateExtractor = () => {
  // 현재 에디터 상태를 추출하여 브릿지용 스냅샷으로 변환하는 함수
  // 모든 에디터 관련 상태를 안전하게 수집하여 일관된 스냅샷 제공
  const extractCurrentEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🔍 [BRIDGE] 에디터 상태 추출 시작');

      try {
        // Zustand 스토어에서 현재 상태 추출
        const editorCoreStoreCurrentState = useEditorCoreStore.getState();
        const editorUIStoreCurrentState = useEditorUIStore.getState();

        // 스토어 상태 존재 여부 검증 - 초기화되지 않은 상태 방어
        if (!editorCoreStoreCurrentState || !editorUIStoreCurrentState) {
          console.error('❌ [BRIDGE] 에디터 스토어 상태가 존재하지 않음');
          return null;
        }

        // 에디터 핵심 데이터 추출 및 안전한 기본값 설정
        const {
          containers: rawContainerData = [],
          paragraphs: rawParagraphData = [],
          completedContent: rawCompletedContent = '',
          isCompleted: rawCompletionStatus = false,
        } = editorCoreStoreCurrentState;

        // 에디터 UI 상태 데이터 추출 및 안전한 기본값 설정
        const {
          activeParagraphId: rawActiveParagraphId = null,
          selectedParagraphIds: rawSelectedParagraphIds = [],
          isPreviewOpen: rawPreviewOpenStatus = false,
        } = editorUIStoreCurrentState;

        // 모든 데이터에 대한 타입 안전성 보장 및 정제
        const safeContainerArray = Array.isArray(rawContainerData)
          ? rawContainerData
          : [];
        const safeParagraphArray = Array.isArray(rawParagraphData)
          ? rawParagraphData
          : [];
        const safeCompletedContentString =
          typeof rawCompletedContent === 'string' ? rawCompletedContent : '';
        const safeCompletionStatus = Boolean(rawCompletionStatus);
        const safeActiveParagraphId = rawActiveParagraphId; // null 허용
        const safeSelectedParagraphIdArray = Array.isArray(
          rawSelectedParagraphIds
        )
          ? rawSelectedParagraphIds
          : [];
        const safePreviewOpenStatus = Boolean(rawPreviewOpenStatus);

        // 브릿지용 표준화된 스냅샷 객체 구성
        const standardizedEditorSnapshot: EditorStateSnapshotForBridge = {
          editorContainers: safeContainerArray,
          editorParagraphs: safeParagraphArray,
          editorCompletedContent: safeCompletedContentString,
          editorIsCompleted: safeCompletionStatus,
          editorActiveParagraphId: safeActiveParagraphId,
          editorSelectedParagraphIds: safeSelectedParagraphIdArray,
          editorIsPreviewOpen: safePreviewOpenStatus,
          extractedTimestamp: Date.now(), // 추출 시점의 정확한 타임스탬프
        };

        console.log('✅ [BRIDGE] 에디터 상태 추출 완료:', {
          containerCount: safeContainerArray.length,
          paragraphCount: safeParagraphArray.length,
          contentLength: safeCompletedContentString.length,
          isCompleted: safeCompletionStatus,
        });

        return standardizedEditorSnapshot;
      } catch (extractionError) {
        console.error('❌ [BRIDGE] 에디터 상태 추출 중 오류:', extractionError);
        return null; // 오류 발생 시 안전하게 null 반환
      }
    };

  // 추출된 스냅샷의 유효성을 검증하는 함수
  // 스냅샷 데이터의 무결성과 타입 안전성 확인
  const validateExtractedSnapshotIntegrity = (
    snapshot: EditorStateSnapshotForBridge | null
  ): boolean => {
    console.log('🔍 [BRIDGE] 추출된 상태 검증 시작');

    // 스냅샷 존재성 기본 검증
    if (!snapshot) {
      console.error('❌ [BRIDGE] 추출된 스냅샷이 null');
      return false;
    }

    // 스냅샷 내 각 필드의 타입 유효성 검증
    const {
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      editorIsCompleted,
      extractedTimestamp,
    } = snapshot;

    // 각 필드별 타입 검증
    const hasValidContainerArray = Array.isArray(editorContainers);
    const hasValidParagraphArray = Array.isArray(editorParagraphs);
    const hasValidContentString = typeof editorCompletedContent === 'string';
    const hasValidCompletionBoolean = typeof editorIsCompleted === 'boolean';
    const hasValidTimestampNumber =
      typeof extractedTimestamp === 'number' && extractedTimestamp > 0;

    // 모든 검증 조건이 통과되어야 유효한 스냅샷으로 인정
    const allValidationsPassed =
      hasValidContainerArray &&
      hasValidParagraphArray &&
      hasValidContentString &&
      hasValidCompletionBoolean &&
      hasValidTimestampNumber;

    console.log('📊 [BRIDGE] 상태 검증 결과:', {
      hasValidContainerArray,
      hasValidParagraphArray,
      hasValidContentString,
      hasValidCompletionBoolean,
      hasValidTimestampNumber,
      overallValid: allValidationsPassed,
    });

    return allValidationsPassed;
  };

  // 검증을 포함한 안전한 에디터 상태 추출 함수
  // 추출과 동시에 유효성 검증까지 수행하여 품질 보장
  const getValidatedEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🎯 [BRIDGE] 검증된 에디터 상태 요청');

      // 1단계: 에디터 상태 추출
      const extractedState = extractCurrentEditorStateSnapshot();

      // 2단계: 추출된 상태의 유효성 검증
      const isStateValid = validateExtractedSnapshotIntegrity(extractedState);

      // 검증 실패 시 null 반환
      if (!isStateValid) {
        console.error('❌ [BRIDGE] 추출된 상태가 유효하지 않음');
        return null;
      }

      console.log('✅ [BRIDGE] 검증된 에디터 상태 반환');
      return extractedState;
    };

  return {
    extractEditorState: extractCurrentEditorStateSnapshot,
    validateExtractedState: validateExtractedSnapshotIntegrity,
    getEditorStateWithValidation: getValidatedEditorStateSnapshot,
  };
};
//====여기까지 수정됨====
