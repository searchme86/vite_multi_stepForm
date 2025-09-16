// 📁 store/editorCore/setterEditorCore.ts
import type { Container, ParagraphBlock } from '../shared/commonTypes';
import type { EditorCoreState } from './initialEditorCoreState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialEditorCoreState } from './initialEditorCoreState';

export interface EditorCoreSetters
  extends DynamicStoreMethods<EditorCoreState> {
  addContainer: (container: Container) => void;
  deleteContainer: (id: string) => void;
  updateContainer: (id: string, updates: Partial<Container>) => void;
  reorderContainers: (containers: Container[]) => void;
  addParagraph: (paragraph: ParagraphBlock) => void;
  deleteParagraph: (id: string) => void;
  updateParagraph: (id: string, updates: Partial<ParagraphBlock>) => void;
  updateParagraphContent: (id: string, content: string) => void;
  moveParagraphToContainer: (
    paragraphId: string,
    containerId: string | null
  ) => void;
  reorderParagraphsInContainer: (
    containerId: string,
    paragraphs: ParagraphBlock[]
  ) => void;
  resetEditorState: () => void;
  generateCompletedContent: () => void;
  setSectionInputs: (sectionInputs: string[]) => void;
  updateSectionInput: (index: number, value: string) => void;
  addSectionInput: () => void;
  removeSectionInput: (index: number) => void;
  resetSectionInputs: () => void;
}

export const createEditorCoreSetters = (): EditorCoreSetters => {
  const dynamicMethods = createDynamicMethods(initialEditorCoreState);

  return {
    ...dynamicMethods,
    addContainer: () => {
      throw new Error('addContainer must be implemented in store');
    },
    deleteContainer: () => {
      throw new Error('deleteContainer must be implemented in store');
    },
    updateContainer: () => {
      throw new Error('updateContainer must be implemented in store');
    },
    reorderContainers: () => {
      throw new Error('reorderContainers must be implemented in store');
    },
    addParagraph: () => {
      throw new Error('addParagraph must be implemented in store');
    },
    deleteParagraph: () => {
      throw new Error('deleteParagraph must be implemented in store');
    },
    updateParagraph: () => {
      throw new Error('updateParagraph must be implemented in store');
    },
    updateParagraphContent: () => {
      throw new Error('updateParagraphContent must be implemented in store');
    },
    moveParagraphToContainer: () => {
      throw new Error('moveParagraphToContainer must be implemented in store');
    },
    reorderParagraphsInContainer: () => {
      throw new Error(
        'reorderParagraphsInContainer must be implemented in store'
      );
    },
    resetEditorState: () => {
      throw new Error('resetEditorState must be implemented in store');
    },
    generateCompletedContent: () => {
      throw new Error('generateCompletedContent must be implemented in store');
    },
    setSectionInputs: () => {
      throw new Error('setSectionInputs must be implemented in store');
    },
    updateSectionInput: () => {
      throw new Error('updateSectionInput must be implemented in store');
    },
    addSectionInput: () => {
      throw new Error('addSectionInput must be implemented in store');
    },
    removeSectionInput: () => {
      throw new Error('removeSectionInput must be implemented in store');
    },
    resetSectionInputs: () => {
      throw new Error('resetSectionInputs must be implemented in store');
    },
  };
};
