import type { ToastOptions, ToastItem } from '../shared/commonTypes';
import type { ToastState } from './initialToastState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialToastState } from './initialToastState';

export interface ToastSetters extends DynamicStoreMethods<ToastState> {
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<ToastOptions>) => void;
}

export const createToastSetters = (): ToastSetters => {
  const dynamicMethods = createDynamicMethods(initialToastState);

  return {
    ...dynamicMethods,
    addToast: () => {
      throw new Error('addToast must be implemented in store');
    },
    removeToast: () => {
      throw new Error('removeToast must be implemented in store');
    },
    clearAllToasts: () => {
      throw new Error('clearAllToasts must be implemented in store');
    },
    updateToast: () => {
      throw new Error('updateToast must be implemented in store');
    },
  };
};
