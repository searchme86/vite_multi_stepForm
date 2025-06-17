// 📁 bridges/editorMultiStepBridge/editorStateExtractor.ts

import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';
import { EditorStateSnapshotForBridge } from './bridgeTypes';

export const createEditorStateExtractor = () => {
  const extractCurrentEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🔍 [BRIDGE] 에디터 상태 추출 시작');

      try {
        const editorCoreStoreCurrentState = useEditorCoreStore.getState();
        const editorUIStoreCurrentState = useEditorUIStore.getState();

        console.log(
          '🔍 [DEBUG] 실제 Core 스토어 구조:',
          editorCoreStoreCurrentState
        );
        console.log(
          '🔍 [DEBUG] Core 스토어 키들:',
          Object.keys(editorCoreStoreCurrentState)
        );
        console.log(
          '🔍 [DEBUG] containers 값:',
          editorCoreStoreCurrentState.containers
        );
        console.log(
          '🔍 [DEBUG] paragraphs 값:',
          editorCoreStoreCurrentState.paragraphs
        );

        if (!editorCoreStoreCurrentState || !editorUIStoreCurrentState) {
          console.error('❌ [BRIDGE] 에디터 스토어 상태가 존재하지 않음');
          return null;
        }

        const {
          containers: rawContainerData = [],
          paragraphs: rawParagraphData = [],
          completedContent: rawCompletedContent = '',
          isCompleted: rawCompletionStatus = false,
        } = editorCoreStoreCurrentState;

        console.log('🔍 [DEBUG] 추출된 데이터:', {
          rawContainerData,
          rawParagraphData,
          containerLength: rawContainerData?.length,
          paragraphLength: rawParagraphData?.length,
        });

        const {
          activeParagraphId: rawActiveParagraphId = null,
          selectedParagraphIds: rawSelectedParagraphIds = [],
          isPreviewOpen: rawPreviewOpenStatus = false,
        } = editorUIStoreCurrentState;

        const safeContainerArray = Array.isArray(rawContainerData)
          ? rawContainerData
          : [];
        const safeParagraphArray = Array.isArray(rawParagraphData)
          ? rawParagraphData
          : [];
        const safeCompletedContentString =
          typeof rawCompletedContent === 'string' ? rawCompletedContent : '';
        const safeCompletionStatus = Boolean(rawCompletionStatus);
        const safeActiveParagraphId = rawActiveParagraphId;
        const safeSelectedParagraphIdArray = Array.isArray(
          rawSelectedParagraphIds
        )
          ? rawSelectedParagraphIds
          : [];
        const safePreviewOpenStatus = Boolean(rawPreviewOpenStatus);

        const standardizedEditorSnapshot: EditorStateSnapshotForBridge = {
          editorContainers: safeContainerArray,
          editorParagraphs: safeParagraphArray,
          editorCompletedContent: safeCompletedContentString,
          editorIsCompleted: safeCompletionStatus,
          editorActiveParagraphId: safeActiveParagraphId,
          editorSelectedParagraphIds: safeSelectedParagraphIdArray,
          editorIsPreviewOpen: safePreviewOpenStatus,
          extractedTimestamp: Date.now(),
        };

        console.log('✅ [BRIDGE] 에디터 상태 추출 완료:', {
          containerCount: safeContainerArray.length,
          paragraphCount: safeParagraphArray.length,
          contentLength: safeCompletedContentString.length,
          isCompleted: safeCompletionStatus,
        });

        console.log('🔍 [DEBUG] 최종 스냅샷:', standardizedEditorSnapshot);

        return standardizedEditorSnapshot;
      } catch (extractionError) {
        console.error('❌ [BRIDGE] 에디터 상태 추출 중 오류:', extractionError);
        return null;
      }
    };

  const validateExtractedSnapshotIntegrity = (
    snapshot: EditorStateSnapshotForBridge | null
  ): boolean => {
    console.log('🔍 [BRIDGE] 추출된 상태 검증 시작');

    if (!snapshot) {
      console.error('❌ [BRIDGE] 추출된 스냅샷이 null');
      return false;
    }

    const {
      editorContainers,
      editorParagraphs,
      editorCompletedContent,
      editorIsCompleted,
      extractedTimestamp,
    } = snapshot;

    const hasValidContainerArray = Array.isArray(editorContainers);
    const hasValidParagraphArray = Array.isArray(editorParagraphs);
    const hasValidContentString = typeof editorCompletedContent === 'string';
    const hasValidCompletionBoolean = typeof editorIsCompleted === 'boolean';
    const hasValidTimestampNumber =
      typeof extractedTimestamp === 'number' && extractedTimestamp > 0;

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

  const getValidatedEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      console.log('🎯 [BRIDGE] 검증된 에디터 상태 요청');

      const extractedState = extractCurrentEditorStateSnapshot();
      const isStateValid = validateExtractedSnapshotIntegrity(extractedState);

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
