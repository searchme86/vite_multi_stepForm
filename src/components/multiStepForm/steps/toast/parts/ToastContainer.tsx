import React from 'react';
import ToastElement from './ToastElement';
import { ToastOptions } from '../../../types/toastTypes';

interface ToastItem {
  id: string;
  options: ToastOptions;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemoveToast: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

function ToastContainer({
  toasts,
  onRemoveToast,
  position = 'top-right',
}: ToastContainerProps) {
  console.log('🔔 ToastContainer: 토스트 컨테이너 렌더링', {
    toastCount: toasts.length,
    position,
  });

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index,
          }}
        >
          <ToastElement
            {...toast.options}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
