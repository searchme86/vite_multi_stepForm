import React from 'react';
import { ToastOptions } from '../../../types/toastTypes';

interface ToastItem {
  id: string;
  options: ToastOptions;
  timestamp: number;
}

export const useToastLifecycle = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToastToQueue = React.useCallback((options: ToastOptions) => {
    console.log('🔔 useToastLifecycle: 토스트 큐에 추가');

    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random()}`,
      options,
      timestamp: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToastFromQueue(newToast.id);
    }, 3000);
  }, []);

  const removeToastFromQueue = React.useCallback((id: string) => {
    console.log('🔔 useToastLifecycle: 토스트 큐에서 제거', id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = React.useCallback(() => {
    console.log('🔔 useToastLifecycle: 모든 토스트 제거');
    setToasts([]);
  }, []);

  const getActiveToasts = React.useCallback(() => {
    return toasts;
  }, [toasts]);

  const getToastCount = React.useCallback(() => {
    return toasts.length;
  }, [toasts.length]);

  return {
    toasts,
    addToastToQueue,
    removeToastFromQueue,
    clearAllToasts,
    getActiveToasts,
    getToastCount,
  };
};
