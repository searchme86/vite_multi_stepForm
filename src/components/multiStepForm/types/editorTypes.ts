export interface EditorState {
  containers: EditorContainer[];
  paragraphs: EditorParagraph[];
  completedContent: string;
  isCompleted: boolean;
}

export interface EditorContainer {
  id: string;
  type: string;
  content: string;
  order: number;
}

export interface EditorParagraph {
  id: string;
  text: string;
  order: number;
}

export interface EditorActions {
  updateEditorContainers: (containers: EditorContainer[]) => void;
  updateEditorParagraphs: (paragraphs: EditorParagraph[]) => void;
  updateEditorCompletedContent: (content: string) => void;
  setEditorCompleted: (isCompleted: boolean) => void;
  resetEditorState: () => void;
}
