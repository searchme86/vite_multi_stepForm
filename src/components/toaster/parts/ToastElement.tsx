interface ToastElementProps {
  title: string;
  description: string;
  color: 'success' | 'danger' | 'warning' | 'primary';
  hideCloseButton?: boolean;
  onClose?: () => void;
}

function ToastElement({
  title,
  description,
  color,
  hideCloseButton = false,
  onClose,
}: ToastElementProps) {
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
      className={`p-4 rounded-lg shadow-lg max-w-sm border ${getColorClasses()}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm">{description}</div>
        </div>
        {onClose && !hideCloseButton && (
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
