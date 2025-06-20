// 📁 src/components/moduleEditor/parts/TiptapEditor/ConfirmBar.tsx

import { Icon } from '@iconify/react';

interface ConfirmBarProps {
  isVisible: boolean;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

function ConfirmBar({
  isVisible,
  message,
  confirmText = '예',
  cancelText = '아니오',
  onConfirm,
  onCancel,
  variant = 'warning',
}: ConfirmBarProps) {
  if (!isVisible) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          icon: 'lucide:trash-2',
          confirmButtonClass:
            'bg-red-600 hover:bg-red-700 text-white border-red-600',
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500',
          icon: 'lucide:alert-triangle',
          confirmButtonClass:
            'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500',
          icon: 'lucide:info',
          confirmButtonClass:
            'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
        };
      default:
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-500',
          icon: 'lucide:alert-triangle',
          confirmButtonClass:
            'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
        };
    }
  };

  const styles = getVariantStyles();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <div
      className={`${styles.bgColor} ${styles.borderColor} border-t px-4 py-3 animate-in slide-in-from-bottom-2 duration-200`}
      onKeyDown={handleKeyDown}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
    >
      <div className="flex items-center justify-between gap-4">
        {/* 왼쪽: 메시지 영역 */}
        <div className="flex items-center flex-1 gap-3">
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            <Icon
              icon={styles.icon}
              className="w-5 h-5"
              width={20}
              height={20}
            />
          </div>
          <span
            className={`${styles.textColor} text-sm font-medium leading-relaxed`}
          >
            {message}
          </span>
        </div>

        {/* 오른쪽: 버튼 영역 */}
        <div className="flex items-center flex-shrink-0 gap-2">
          {/* 취소 버튼 */}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="작업 취소"
          >
            {cancelText}
          </button>

          {/* 확인 버튼 */}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${styles.confirmButtonClass}`}
            aria-label="작업 확인"
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmBar;
