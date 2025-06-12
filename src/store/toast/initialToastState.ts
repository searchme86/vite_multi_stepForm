import type { ToastItem } from '../shared/commonTypes';

export interface ToastState {
  toasts: ToastItem[];
}

export const initialToastState: ToastState = {
  toasts: [],
};
