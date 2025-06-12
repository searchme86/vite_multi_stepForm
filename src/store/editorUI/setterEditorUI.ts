import type { SubStep, EditorUIState } from './initialEditorUIState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialEditorUIState } from './initialEditorUIState';

export interface EditorUISetters extends DynamicStoreMethods<EditorUIState> {
  goToStructureStep: () => void;
  goToWritingStep: () => void;
  setTransitioning: (isTransitioning: boolean) => void;
  activateParagraph: (paragraphId: string | null) => void;
  togglePreview: () => void;
  toggleParagraphSelection: (paragraphId: string) => void;
  clearSelectedParagraphs: () => void;
  selectAllParagraphs: (paragraphIds: string[]) => void;
  resetEditorUIState: () => void;
}

export const createEditorUISetters = (): EditorUISetters => {
  const dynamicMethods = createDynamicMethods(initialEditorUIState);

  return {
    ...dynamicMethods,
    goToStructureStep: () => {
      throw new Error('goToStructureStep must be implemented in store');
    },
    goToWritingStep: () => {
      throw new Error('goToWritingStep must be implemented in store');
    },
    setTransitioning: () => {
      throw new Error('setTransitioning must be implemented in store');
    },
    activateParagraph: () => {
      throw new Error('activateParagraph must be implemented in store');
    },
    togglePreview: () => {
      throw new Error('togglePreview must be implemented in store');
    },
    toggleParagraphSelection: () => {
      throw new Error('toggleParagraphSelection must be implemented in store');
    },
    clearSelectedParagraphs: () => {
      throw new Error('clearSelectedParagraphs must be implemented in store');
    },
    selectAllParagraphs: () => {
      throw new Error('selectAllParagraphs must be implemented in store');
    },
    resetEditorUIState: () => {
      throw new Error('resetEditorUIState must be implemented in store');
    },
  };
};
