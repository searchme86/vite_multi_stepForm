import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  MultiStepFormState,
  initialMultiStepFormState,
} from './initialMultiStepFormState';
import {
  MultiStepFormGetters,
  createMultiStepFormGetters,
} from './multiStepFormGetters';
import {
  MultiStepFormSetters,
  createMultiStepFormSetters,
} from './multiStepFormSetters';

export interface Toast {
  id: string;
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary' | 'default';
  createdAt: Date;
}

export interface ToastOptions {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary' | 'default';
}

export interface MultiStepFormStore
  extends MultiStepFormState,
    MultiStepFormGetters,
    MultiStepFormSetters {
  toasts: Toast[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  setIsPreviewPanelOpen: (open: boolean) => void;
  togglePreviewPanel: () => void;
}

export const useMultiStepFormStore = create<MultiStepFormStore>()(
  devtools(
    persist(
      (set, get) => {
        const getters = createMultiStepFormGetters(get);
        const setters = createMultiStepFormSetters(set);

        return {
          ...initialMultiStepFormState,
          ...getters,
          ...setters,

          toasts: [],

          addToast: (options: ToastOptions) => {
            set((state) => ({
              toasts: [
                ...state.toasts,
                {
                  ...options,
                  id: Date.now().toString(),
                  createdAt: new Date(),
                },
              ],
            }));
          },

          removeToast: (id: string) => {
            set((state) => ({
              toasts: state.toasts.filter((toast) => toast.id !== id),
            }));
          },

          clearAllToasts: () => {
            set({ toasts: [] });
          },

          // Context 호환성을 위한 별칭 함수들 추가
          setIsPreviewPanelOpen: (open: boolean) => set({ showPreview: open }),
          togglePreviewPanel: () =>
            set((state) => ({ showPreview: !state.showPreview })),
        };
      },
      {
        name: 'multi-step-form-storage',
        partialize: (state) => ({
          formValues: state.formValues,
          currentStep: state.currentStep,
          editorCompletedContent: state.editorCompletedContent,
          isEditorCompleted: state.isEditorCompleted,
        }),
      }
    ),
    {
      name: 'multi-step-form-store',
    }
  )
);
