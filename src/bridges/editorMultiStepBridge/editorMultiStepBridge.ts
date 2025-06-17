// 📁 bridges/editorMultiStepBridge/editorMultiStepBridge.ts

import { createEditorStateExtractor } from './editorStateExtractor';
import { EditorStateSnapshotForBridge } from './bridgeTypes';

export const extractCurrentEditorStateSnapshot =
  (): EditorStateSnapshotForBridge | null => {
    const extractor = createEditorStateExtractor();
    return extractor.extractEditorState();
  };

export const validateExtractedSnapshotIntegrity = (
  snapshot: EditorStateSnapshotForBridge | null
): boolean => {
  const extractor = createEditorStateExtractor();
  return extractor.validateExtractedState(snapshot);
};

export const getValidatedEditorStateSnapshot =
  (): EditorStateSnapshotForBridge | null => {
    const extractor = createEditorStateExtractor();
    return extractor.getEditorStateWithValidation();
  };
