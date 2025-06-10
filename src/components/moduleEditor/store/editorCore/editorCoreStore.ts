import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Container, ParagraphBlock } from '../shared/commonTypes';
import {
  initialEditorCoreState,
  type EditorCoreState,
} from './initialEditorCoreState';
import type { EditorCoreGetters } from './getterEditorCore';
import type { EditorCoreSetters } from './setterEditorCore';
import { createPersistConfig } from '../shared/persistConfig';

type EditorCoreStore = EditorCoreState & EditorCoreGetters & EditorCoreSetters;

const sortContainers = (containers: Container[]): Container[] => {
  return [...containers].sort((a, b) => a.order - b.order);
};

const getParagraphsByContainer = (
  paragraphs: ParagraphBlock[],
  containerId: string
): ParagraphBlock[] => {
  return paragraphs
    .filter((p) => p.containerId === containerId)
    .sort((a, b) => a.order - b.order);
};

const getUnassignedParagraphs = (
  paragraphs: ParagraphBlock[]
): ParagraphBlock[] => {
  return paragraphs
    .filter((p) => p.containerId === null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

const generateCompletedContent = (
  containers: Container[],
  paragraphs: ParagraphBlock[]
): string => {
  const sortedContainers = sortContainers(containers);

  const sections = sortedContainers.map((container) => {
    const containerParagraphs = getParagraphsByContainer(
      paragraphs,
      container.id
    );

    if (containerParagraphs.length === 0) {
      return '';
    }

    return containerParagraphs.map((p) => p.content).join('\n\n');
  });

  return sections.filter((section) => section.trim().length > 0).join('\n\n');
};

const validateEditorState = (state: EditorCoreState): boolean => {
  if (!state.containers || state.containers.length === 0) {
    return false;
  }

  if (!state.paragraphs || state.paragraphs.length === 0) {
    return false;
  }

  const assignedParagraphs = state.paragraphs.filter(
    (p) => p.containerId !== null
  );
  if (assignedParagraphs.length === 0) {
    return false;
  }

  return true;
};

export const useEditorCoreStore = create<EditorCoreStore>()(
  persist(
    (set, get) => ({
      ...initialEditorCoreState,

      getCompletedContent: () => get().completedContent,
      setCompletedContent: (completedContent: string) =>
        set({ completedContent }),

      getIsCompleted: () => get().isCompleted,
      setIsCompleted: (isCompleted: boolean) => set({ isCompleted }),

      getContainers: () => get().containers,
      setContainers: (containers: Container[]) =>
        set({
          containers,
          completedContent: generateCompletedContent(
            containers,
            get().paragraphs
          ),
        }),

      getParagraphs: () => get().paragraphs,
      setParagraphs: (paragraphs: ParagraphBlock[]) =>
        set({
          paragraphs,
          completedContent: generateCompletedContent(
            get().containers,
            paragraphs
          ),
        }),

      getContainerById: (id: string) =>
        get().containers.find((c) => c.id === id),

      getParagraphById: (id: string) =>
        get().paragraphs.find((p) => p.id === id),

      getParagraphsByContainer: (containerId: string) =>
        getParagraphsByContainer(get().paragraphs, containerId),

      getUnassignedParagraphs: () => getUnassignedParagraphs(get().paragraphs),

      getSortedContainers: () => sortContainers(get().containers),

      validateEditorState: () => validateEditorState(get()),

      addContainer: (container: Container) =>
        set((state) => {
          const exists = state.containers.some((c) => c.id === container.id);
          if (exists) {
            throw new Error(`Container with id ${container.id} already exists`);
          }
          const newContainers = [...state.containers, container];
          return {
            containers: newContainers,
            completedContent: generateCompletedContent(
              newContainers,
              state.paragraphs
            ),
          };
        }),

      deleteContainer: (id: string) =>
        set((state) => {
          const containerExists = state.containers.some((c) => c.id === id);
          if (!containerExists) {
            throw new Error(`Container with id ${id} not found`);
          }
          const newContainers = state.containers.filter((c) => c.id !== id);
          const newParagraphs = state.paragraphs.map((p) =>
            p.containerId === id ? { ...p, containerId: null } : p
          );
          return {
            containers: newContainers,
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              newContainers,
              newParagraphs
            ),
          };
        }),

      updateContainer: (id: string, updates: Partial<Container>) =>
        set((state) => {
          const containerIndex = state.containers.findIndex((c) => c.id === id);
          if (containerIndex === -1) {
            throw new Error(`Container with id ${id} not found`);
          }
          const newContainers = [...state.containers];
          newContainers[containerIndex] = {
            ...newContainers[containerIndex],
            ...updates,
          };
          return {
            containers: newContainers,
            completedContent: generateCompletedContent(
              newContainers,
              state.paragraphs
            ),
          };
        }),

      reorderContainers: (containers: Container[]) =>
        set((state) => ({
          containers,
          completedContent: generateCompletedContent(
            containers,
            state.paragraphs
          ),
        })),

      addParagraph: (paragraph: ParagraphBlock) =>
        set((state) => {
          const exists = state.paragraphs.some((p) => p.id === paragraph.id);
          if (exists) {
            throw new Error(`Paragraph with id ${paragraph.id} already exists`);
          }
          const newParagraphs = [...state.paragraphs, paragraph];
          return {
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              state.containers,
              newParagraphs
            ),
          };
        }),

      deleteParagraph: (id: string) =>
        set((state) => {
          const paragraphExists = state.paragraphs.some((p) => p.id === id);
          if (!paragraphExists) {
            throw new Error(`Paragraph with id ${id} not found`);
          }
          const newParagraphs = state.paragraphs.filter((p) => p.id !== id);
          return {
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              state.containers,
              newParagraphs
            ),
          };
        }),

      updateParagraph: (id: string, updates: Partial<ParagraphBlock>) =>
        set((state) => {
          const paragraphIndex = state.paragraphs.findIndex((p) => p.id === id);
          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${id} not found`);
          }
          const newParagraphs = [...state.paragraphs];
          newParagraphs[paragraphIndex] = {
            ...newParagraphs[paragraphIndex],
            ...updates,
            updatedAt: new Date(),
          };
          return {
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              state.containers,
              newParagraphs
            ),
          };
        }),

      updateParagraphContent: (id: string, content: string) =>
        set((state) => {
          const paragraphIndex = state.paragraphs.findIndex((p) => p.id === id);
          if (paragraphIndex === -1) {
            throw new Error(`Paragraph with id ${id} not found`);
          }
          const newParagraphs = [...state.paragraphs];
          newParagraphs[paragraphIndex] = {
            ...newParagraphs[paragraphIndex],
            content,
            updatedAt: new Date(),
          };
          return {
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              state.containers,
              newParagraphs
            ),
          };
        }),

      moveParagraphToContainer: (
        paragraphId: string,
        containerId: string | null
      ) =>
        set((state) => {
          if (
            containerId &&
            !state.containers.some((c) => c.id === containerId)
          ) {
            throw new Error(`Container ${containerId} does not exist`);
          }
          const paragraphIndex = state.paragraphs.findIndex(
            (p) => p.id === paragraphId
          );
          if (paragraphIndex === -1) {
            throw new Error(`Paragraph ${paragraphId} does not exist`);
          }
          const newParagraphs = [...state.paragraphs];
          newParagraphs[paragraphIndex] = {
            ...newParagraphs[paragraphIndex],
            containerId,
            updatedAt: new Date(),
          };
          return {
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              state.containers,
              newParagraphs
            ),
          };
        }),

      reorderParagraphsInContainer: (
        containerId: string,
        paragraphs: ParagraphBlock[]
      ) =>
        set((state) => {
          const otherParagraphs = state.paragraphs.filter(
            (p) => p.containerId !== containerId
          );
          const newParagraphs = [...otherParagraphs, ...paragraphs];
          return {
            paragraphs: newParagraphs,
            completedContent: generateCompletedContent(
              state.containers,
              newParagraphs
            ),
          };
        }),

      resetEditorState: () => set(initialEditorCoreState),

      generateCompletedContent: () =>
        set((state) => ({
          completedContent: generateCompletedContent(
            state.containers,
            state.paragraphs
          ),
        })),
    }),
    createPersistConfig('editor-core-storage', 'local')
  )
);
