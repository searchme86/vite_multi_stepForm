import ToastElement from './ToastElement';
import type { ToastItem } from '../../../store/shared/commonTypes';

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

  if (!toasts || toasts.length === 0) {
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
            title={toast.title}
            description={toast.description}
            color={toast.color}
            hideCloseButton={toast.hideCloseButton}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
