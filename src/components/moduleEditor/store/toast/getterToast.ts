import type { ToastItem } from '../shared/commonTypes';
import type { ToastState } from './initialToastState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialToastState } from './initialToastState';

export interface ToastGetters extends DynamicStoreMethods<ToastState> {
  getToastById: (id: string) => ToastItem | undefined;
  getActiveToasts: () => ToastItem[];
  getToastCount: () => number;
}

export const createToastGetters = (): ToastGetters => {
  const dynamicMethods = createDynamicMethods(initialToastState);

  return {
    ...dynamicMethods,
    getToastById: () => {
      throw new Error('getToastById must be implemented in store');
    },
    getActiveToasts: () => {
      throw new Error('getActiveToasts must be implemented in store');
    },
    getToastCount: () => {
      throw new Error('getToastCount must be implemented in store');
    },
  };
};
