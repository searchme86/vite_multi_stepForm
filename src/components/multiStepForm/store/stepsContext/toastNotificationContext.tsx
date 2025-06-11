import React from 'react';
import { ToastOptions } from '../../types/toastTypes';

interface ToastNotificationContextType {
  addToast: (options: ToastOptions) => void;
  showSuccess: (title: string, description: string) => void;
  showError: (title: string, description: string) => void;
  showWarning: (title: string, description: string) => void;
  showInfo: (title: string, description: string) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  getToastCount: () => number;
  toasts: Array<{ id: string; options: ToastOptions }>;
}

const ToastNotificationContext = React.createContext<
  ToastNotificationContextType | undefined
>(undefined);

interface ToastNotificationProviderProps {
  children: React.ReactNode;
  value: ToastNotificationContextType;
}

export function ToastNotificationProvider({
  children,
  value,
}: ToastNotificationProviderProps) {
  console.log(
    '🔔 ToastNotificationProvider: 토스트 알림 Context Provider 렌더링'
  );

  return (
    <ToastNotificationContext.Provider value={value}>
      {children}
    </ToastNotificationContext.Provider>
  );
}

export function useToastNotificationContext() {
  console.log('🔔 useToastNotificationContext: 토스트 알림 Context 사용');

  const context = React.useContext(ToastNotificationContext);
  if (context === undefined) {
    throw new Error(
      'useToastNotificationContext must be used within a ToastNotificationProvider'
    );
  }
  return context;
}

export { ToastNotificationContext };
