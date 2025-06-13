import React from 'react';
import { ToastOptions } from '../types/toastTypes';
import { useToastCreation } from './useToastCreation';
import { useToastLifecycle } from './useToastLifecycle';

export const useToastNotification = () => {
  console.log('🔔 useToastNotification: 토스트 알림 관리 훅 초기화');

  const { addToast } = useToastCreation();
  const {
    toasts,
    addToastToQueue,
    removeToastFromQueue,
    clearAllToasts,
    getToastCount,
  } = useToastLifecycle();

  const showNotification = React.useCallback(
    (options: ToastOptions) => {
      console.log('🔔 useToastNotification: 알림 표시', options);
      addToast(options);
      addToastToQueue(options);
    },
    [addToast, addToastToQueue]
  );

  const showSuccess = React.useCallback(
    (title: string, description: string) => {
      console.log('✅ useToastNotification: 성공 알림');
      showNotification({ title, description, color: 'success' });
    },
    [showNotification]
  );

  const showError = React.useCallback(
    (title: string, description: string) => {
      console.log('❌ useToastNotification: 에러 알림');
      showNotification({ title, description, color: 'danger' });
    },
    [showNotification]
  );

  const showWarning = React.useCallback(
    (title: string, description: string) => {
      console.log('⚠️ useToastNotification: 경고 알림');
      showNotification({ title, description, color: 'warning' });
    },
    [showNotification]
  );

  const showInfo = React.useCallback(
    (title: string, description: string) => {
      console.log('ℹ️ useToastNotification: 정보 알림');
      showNotification({ title, description, color: 'primary' });
    },
    [showNotification]
  );

  return {
    toasts,
    addToast: showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast: removeToastFromQueue,
    clearAllToasts,
    getToastCount,
  };
};
