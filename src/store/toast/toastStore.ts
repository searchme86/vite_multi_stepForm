import { create } from 'zustand';
import type { ToastOptions, ToastItem } from '../shared/commonTypes';
import { initialToastState, type ToastState } from './initialToastState';
import type { ToastGetters } from './getterToast';
import type { ToastSetters } from './setterToast';

type ToastStore = ToastState & ToastGetters & ToastSetters;

export const useToastStore = create<ToastStore>()((set, get) => ({
  ...initialToastState,

  getToasts: () => get().toasts,
  setToasts: (toasts: ToastItem[]) => set({ toasts }),

  getToastById: (id: string) => get().toasts.find((toast) => toast.id === id),

  getActiveToasts: () => get().toasts,

  getToastCount: () => get().toasts.length,

  addToast: (options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = {
      ...options,
      id,
      createdAt: new Date(),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 5000);

    return id;
  },

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearAllToasts: () => set({ toasts: [] }),

  updateToast: (id: string, updates: Partial<ToastOptions>) =>
    set((state) => {
      const toastIndex = state.toasts.findIndex((toast) => toast.id === id);
      if (toastIndex === -1) {
        throw new Error(`Toast with id ${id} not found`);
      }
      const newToasts = [...state.toasts];
      newToasts[toastIndex] = { ...newToasts[toastIndex], ...updates };
      return { toasts: newToasts };
    }),
}));
