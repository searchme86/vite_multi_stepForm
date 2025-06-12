import type { EditorUIState } from './initialEditorUIState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialEditorUIState } from './initialEditorUIState';

export interface EditorUIGetters extends DynamicStoreMethods<EditorUIState> {
  isStructureStep: () => boolean;
  isWritingStep: () => boolean;
  hasSelectedParagraphs: () => boolean;
  getSelectedParagraphsCount: () => number;
  isParagraphSelected: (paragraphId: string) => boolean;
  isParagraphActive: (paragraphId: string) => boolean;
}

export const createEditorUIGetters = (): EditorUIGetters => {
  const dynamicMethods = createDynamicMethods(initialEditorUIState);

  return {
    ...dynamicMethods,
    isStructureStep: () => {
      throw new Error('isStructureStep must be implemented in store');
    },
    isWritingStep: () => {
      throw new Error('isWritingStep must be implemented in store');
    },
    hasSelectedParagraphs: () => {
      throw new Error('hasSelectedParagraphs must be implemented in store');
    },
    getSelectedParagraphsCount: () => {
      throw new Error(
        'getSelectedParagraphsCount must be implemented in store'
      );
    },
    isParagraphSelected: () => {
      throw new Error('isParagraphSelected must be implemented in store');
    },
    isParagraphActive: () => {
      throw new Error('isParagraphActive must be implemented in store');
    },
  };
};
