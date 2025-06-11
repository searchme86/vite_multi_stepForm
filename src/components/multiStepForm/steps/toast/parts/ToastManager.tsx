import React from 'react';
import ToastContainer from './ToastContainer';
import { useToastLifecycle } from '../hooks/useToastLifecycle';

interface ToastManagerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

function ToastManager({
  maxToasts = 5,
  position = 'top-right',
}: ToastManagerProps) {
  console.log('🔔 ToastManager: 토스트 매니저 렌더링', { maxToasts, position });

  const { toasts, removeToastFromQueue, clearAllToasts } = useToastLifecycle();

  const limitedToasts = React.useMemo(() => {
    console.log('🔔 ToastManager: 토스트 개수 제한 적용', {
      total: toasts.length,
      limit: maxToasts,
    });
    return toasts.slice(-maxToasts);
  }, [toasts, maxToasts]);

  React.useEffect(() => {
    if (toasts.length > maxToasts) {
      console.log('🔔 ToastManager: 최대 토스트 개수 초과, 오래된 토스트 제거');
      const excessToasts = toasts.slice(0, toasts.length - maxToasts);
      excessToasts.forEach((toast) => {
        removeToastFromQueue(toast.id);
      });
    }
  }, [toasts.length, maxToasts, removeToastFromQueue, toasts]);

  const handleRemoveToast = React.useCallback(
    (id: string) => {
      console.log('🔔 ToastManager: 토스트 제거 요청', id);
      removeToastFromQueue(id);
    },
    [removeToastFromQueue]
  );

  return (
    <ToastContainer
      toasts={limitedToasts}
      onRemoveToast={handleRemoveToast}
      position={position}
    />
  );
}

export default ToastManager;
