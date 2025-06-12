import type { Container, ParagraphBlock } from '../shared/commonTypes';
import type { EditorCoreState } from './initialEditorCoreState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialEditorCoreState } from './initialEditorCoreState';

export interface EditorCoreGetters
  extends DynamicStoreMethods<EditorCoreState> {
  getContainerById: (id: string) => Container | undefined;
  getParagraphById: (id: string) => ParagraphBlock | undefined;
  getParagraphsByContainer: (containerId: string) => ParagraphBlock[];
  getUnassignedParagraphs: () => ParagraphBlock[];
  getSortedContainers: () => Container[];
  validateEditorState: () => boolean;
}

export const createEditorCoreGetters = (): EditorCoreGetters => {
  const dynamicMethods = createDynamicMethods(initialEditorCoreState);

  return {
    ...dynamicMethods,
    getContainerById: () => {
      throw new Error('getContainerById must be implemented in store');
    },
    getParagraphById: () => {
      throw new Error('getParagraphById must be implemented in store');
    },
    getParagraphsByContainer: () => {
      throw new Error('getParagraphsByContainer must be implemented in store');
    },
    getUnassignedParagraphs: () => {
      throw new Error('getUnassignedParagraphs must be implemented in store');
    },
    getSortedContainers: () => {
      throw new Error('getSortedContainers must be implemented in store');
    },
    validateEditorState: () => {
      throw new Error('validateEditorState must be implemented in store');
    },
  };
};
