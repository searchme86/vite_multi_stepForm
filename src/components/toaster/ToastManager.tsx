import { useToastStore } from '../../store/toast/toastStore';
import ToastContainer from './parts/ToastContainer';

interface ToastManagerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

function ToastManager({
  maxToasts = 5,
  position = 'top-right',
}: ToastManagerProps) {
  const { getActiveToasts, removeToast } = useToastStore();

  const allToasts = getActiveToasts();
  const limitedToasts = allToasts.slice(0, maxToasts);

  return (
    <ToastContainer
      toasts={limitedToasts}
      onRemoveToast={removeToast}
      position={position}
    />
  );
}

export default ToastManager;
