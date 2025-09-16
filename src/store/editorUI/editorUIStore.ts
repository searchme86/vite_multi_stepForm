import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubStep } from './initialEditorUIState';
import {
  initialEditorUIState,
  type EditorUIState,
} from './initialEditorUIState';
import { createPersistConfig } from '../shared/persistConfig';

interface EditorUIGetters {
  getCurrentSubStep: () => SubStep;
  getIsTransitioning: () => boolean;
  getActiveParagraphId: () => string | null;
  getIsPreviewOpen: () => boolean;
  getSelectedParagraphIds: () => string[];
  getTargetContainerId: () => string;
  isStructureStep: () => boolean;
  isWritingStep: () => boolean;
  hasSelectedParagraphs: () => boolean;
  getSelectedParagraphsCount: () => number;
  isParagraphSelected: (paragraphId: string) => boolean;
  isParagraphActive: (paragraphId: string) => boolean;
}

interface EditorUISetters {
  setCurrentSubStep: (step: SubStep) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setActiveParagraphId: (paragraphId: string | null) => void;
  setIsPreviewOpen: (open: boolean) => void;
  setSelectedParagraphIds: (ids: string[]) => void;
  setTargetContainerId: (containerId: string) => void;
  goToStructureStep: () => void;
  goToWritingStep: () => void;
  setTransitioning: (transitioning: boolean) => void;
  activateParagraph: (paragraphId: string | null) => void;
  togglePreview: () => void;
  toggleParagraphSelection: (paragraphId: string) => void;
  clearSelectedParagraphs: () => void;
  selectAllParagraphs: (paragraphIds: string[]) => void;
  resetEditorUIState: () => void;
  resetEditorUIStateCompletely: () => void;
}

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

      resetEditorUIState: () => {
        console.log('🔄 [UI_STORE] UI 상태 초기화 시작');
        set(initialEditorUIState);
      },

      resetEditorUIStateCompletely: () => {
        console.log(
          '🔥 [UI_STORE] UI 상태 완전 초기화 시작 - sessionStorage 포함'
        );

        try {
          set(initialEditorUIState);

          const persistKey = 'editor-ui-storage';
          if (typeof window !== 'undefined' && window.sessionStorage) {
            console.log(`🗑️ [UI_STORE] sessionStorage에서 ${persistKey} 삭제`);
            window.sessionStorage.removeItem(persistKey);
          }

          setTimeout(() => {
            set({
              currentSubStep: 'structure',
              isTransitioning: false,
              activeParagraphId: null,
              isPreviewOpen: true,
              selectedParagraphIds: [],
              targetContainerId: '',
            });
            console.log('✅ [UI_STORE] UI 상태 완전 초기화 완료');
          }, 100);
        } catch (error) {
          console.error('❌ [UI_STORE] UI 완전 초기화 중 오류:', error);
          set(initialEditorUIState);
        }
      },
    }),
    createPersistConfig('editor-ui-storage', 'session')
  )
);

export const resetEditorUIStoreCompletely = () => {
  console.log('🔥 [UI_STORE_EXTERNAL] 외부에서 UI 완전 초기화 호출');

  try {
    const { resetEditorUIStateCompletely } = useEditorUIStore.getState();
    resetEditorUIStateCompletely();

    console.log('✅ [UI_STORE_EXTERNAL] 외부 UI 완전 초기화 완료');
  } catch (error) {
    console.error('❌ [UI_STORE_EXTERNAL] 외부 UI 초기화 중 오류:', error);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('editor-ui-storage');
      console.log('🗑️ [UI_STORE_EXTERNAL] 직접 sessionStorage 삭제 완료');
    }
  }
};
