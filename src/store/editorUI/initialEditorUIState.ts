export type SubStep = 'structure' | 'writing';

export interface EditorUIState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}

export const initialEditorUIState: EditorUIState = {
  currentSubStep: 'structure',
  isTransitioning: false,
  activeParagraphId: null,
  isPreviewOpen: true,
  selectedParagraphIds: [],
  targetContainerId: '',
};
