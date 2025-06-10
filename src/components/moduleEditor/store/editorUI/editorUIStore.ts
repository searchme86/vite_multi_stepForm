import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubStep } from './initialEditorUIState';
import {
  initialEditorUIState,
  type EditorUIState,
} from './initialEditorUIState';
import type { EditorUIGetters } from './getterEditorUI';
import type { EditorUISetters } from './setterEditorUI';
import { createPersistConfig } from '../shared/persistConfig';

type EditorUIStore = EditorUIState & EditorUIGetters & EditorUISetters;

export const useEditorUIStore = create<EditorUIStore>()(
  persist(
    (set, get) => ({
      ...initialEditorUIState,

      getCurrentSubStep: () => get().currentSubStep,
      setCurrentSubStep: (currentSubStep: SubStep) => set({ currentSubStep }),

      getIsTransitioning: () => get().isTransitioning,
      setIsTransitioning: (isTransitioning: boolean) =>
        set({ isTransitioning }),

      getActiveParagraphId: () => get().activeParagraphId,
      setActiveParagraphId: (activeParagraphId: string | null) =>
        set({ activeParagraphId }),

      getIsPreviewOpen: () => get().isPreviewOpen,
      setIsPreviewOpen: (isPreviewOpen: boolean) => set({ isPreviewOpen }),

      getSelectedParagraphIds: () => get().selectedParagraphIds,
      setSelectedParagraphIds: (selectedParagraphIds: string[]) =>
        set({ selectedParagraphIds }),

      getTargetContainerId: () => get().targetContainerId,
      setTargetContainerId: (targetContainerId: string) =>
        set({ targetContainerId }),

      isStructureStep: () => get().currentSubStep === 'structure',

      isWritingStep: () => get().currentSubStep === 'writing',

      hasSelectedParagraphs: () => get().selectedParagraphIds.length > 0,

      getSelectedParagraphsCount: () => get().selectedParagraphIds.length,

      isParagraphSelected: (paragraphId: string) =>
        get().selectedParagraphIds.includes(paragraphId),

      isParagraphActive: (paragraphId: string) =>
        get().activeParagraphId === paragraphId,

      goToStructureStep: () =>
        set({
          currentSubStep: 'structure',
          isTransitioning: false,
        }),

      goToWritingStep: () =>
        set({
          currentSubStep: 'writing',
          isTransitioning: false,
        }),

      setTransitioning: (isTransitioning: boolean) => set({ isTransitioning }),

      activateParagraph: (paragraphId: string | null) =>
        set({ activeParagraphId: paragraphId }),

      togglePreview: () =>
        set((state) => ({
          isPreviewOpen: !state.isPreviewOpen,
        })),

      toggleParagraphSelection: (paragraphId: string) =>
        set((state) => ({
          selectedParagraphIds: state.selectedParagraphIds.includes(paragraphId)
            ? state.selectedParagraphIds.filter((id) => id !== paragraphId)
            : [...state.selectedParagraphIds, paragraphId],
        })),

      clearSelectedParagraphs: () =>
        set({
          selectedParagraphIds: [],
          targetContainerId: '',
        }),

      selectAllParagraphs: (paragraphIds: string[]) =>
        set({ selectedParagraphIds: paragraphIds }),

      resetEditorUIState: () => set(initialEditorUIState),
    }),
    createPersistConfig('editor-ui-storage', 'session')
  )
);
