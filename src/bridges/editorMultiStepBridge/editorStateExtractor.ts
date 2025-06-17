// bridges/editorMultiStepBridge/editorStateExtractor.ts

import { useEditorCoreStore } from '../../store/editorCore/editorCoreStore';
import { useEditorUIStore } from '../../store/editorUI/editorUIStore';
import { EditorStateSnapshotForBridge } from './bridgeTypes';

export const createEditorStateExtractor = () => {
  const extractCurrentEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      try {
        let editorCoreStoreCurrentState;
        let editorUIStoreCurrentState;

        try {
          editorCoreStoreCurrentState = useEditorCoreStore.getState();
        } catch (coreStoreError) {
          console.error('❌ [BRIDGE] Core 스토어 접근 실패:', coreStoreError);
          return null;
        }

        try {
          editorUIStoreCurrentState = useEditorUIStore.getState();
        } catch (uiStoreError) {
          console.error('❌ [BRIDGE] UI 스토어 접근 실패:', uiStoreError);
          return null;
        }

        const isStoreFullyInitialized =
          typeof editorCoreStoreCurrentState === 'object' &&
          typeof editorUIStoreCurrentState === 'object' &&
          editorCoreStoreCurrentState !== null &&
          editorUIStoreCurrentState !== null;

        if (!isStoreFullyInitialized) {
          return null;
        }

        const {
          containers: rawContainerData = [],
          paragraphs: rawParagraphData = [],
          completedContent: rawCompletedContent = '',
          isCompleted: rawCompletionStatus = false,
        } = editorCoreStoreCurrentState;

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

        return standardizedEditorSnapshot;
      } catch (extractionError) {
        console.error('❌ [BRIDGE] 에디터 상태 추출 중 오류:', extractionError);
        return null;
      }
    };

  const validateExtractedSnapshotIntegrity = (
    snapshot: EditorStateSnapshotForBridge | null
  ): boolean => {
    if (!snapshot) {
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

    const basicValidation =
      hasValidContainerArray &&
      hasValidParagraphArray &&
      hasValidContentString &&
      hasValidCompletionBoolean &&
      hasValidTimestampNumber;

    if (!basicValidation) {
      return false;
    }

    const isDataRangeValid =
      editorContainers.length >= 0 &&
      editorParagraphs.length >= 0 &&
      extractedTimestamp <= Date.now();

    return isDataRangeValid;
  };

  const getValidatedEditorStateSnapshot =
    (): EditorStateSnapshotForBridge | null => {
      const extractedState = extractCurrentEditorStateSnapshot();

      if (!extractedState) {
        return null;
      }

      const isStateValid = validateExtractedSnapshotIntegrity(extractedState);

      if (!isStateValid) {
        return null;
      }

      return extractedState;
    };

  return {
    extractEditorState: extractCurrentEditorStateSnapshot,
    validateExtractedState: validateExtractedSnapshotIntegrity,
    getEditorStateWithValidation: getValidatedEditorStateSnapshot,
  };
};
