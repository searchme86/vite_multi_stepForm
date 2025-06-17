// 📁 store/editorCore/initialEditorCoreState.ts
import type { Container, ParagraphBlock } from '../shared/commonTypes';

export interface EditorCoreState {
  containers: Container[];
  paragraphs: ParagraphBlock[];
  completedContent: string;
  isCompleted: boolean;
  sectionInputs: string[];
}

export const initialEditorCoreState: EditorCoreState = {
  containers: [],
  paragraphs: [],
  completedContent: '',
  isCompleted: false,
  sectionInputs: ['', '', '', ''],
};
