import React from 'react';
import { ToastOptions } from '../../../types/toastTypes';

interface ToastElementProps extends ToastOptions {
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

function ToastElement({
  title,
  description,
  color,
  onClose,
  autoClose = true,
  duration = 3000,
}: ToastElementProps) {
  console.log('🔔 ToastElement: 개별 토스트 엘리먼트 렌더링', { title, color });

  React.useEffect(() => {
    if (autoClose && onClose) {
      console.log('🔔 ToastElement: 자동 닫기 타이머 설정', duration);
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => {
        console.log('🔔 ToastElement: 타이머 정리');
        clearTimeout(timer);
      };
    }
  }, [autoClose, onClose, duration]);

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'danger':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-black border-yellow-600';
      case 'primary':
      default:
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm border ${getColorClasses()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm">{description}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-lg leading-none hover:opacity-70"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default ToastElement;
