// 📁 types/editor.ts

export type SubStep = 'structure' | 'writing';

export interface EditorInternalState {
  currentSubStep: SubStep;
  isTransitioning: boolean;
  activeParagraphId: string | null;
  isPreviewOpen: boolean;
  selectedParagraphIds: string[];
  targetContainerId: string;
}
