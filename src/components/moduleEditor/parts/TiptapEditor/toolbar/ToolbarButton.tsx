import { Icon } from '@iconify/react';

interface ToolbarButtonProps {
  icon: string;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  title?: string;
  variant?: 'default' | 'primary' | 'success' | 'danger';
}

function ToolbarButton({
  icon,
  onClick,
  isActive = false,
  isDisabled = false,
  title,
  variant = 'default',
}: ToolbarButtonProps) {
  console.log('🔘 [TOOLBAR_BUTTON] 렌더링:', {
    icon,
    isActive,
    isDisabled,
    variant,
  });

  const getVariantClasses = () => {
    if (isActive) {
      return 'bg-blue-100 text-blue-600';
    }

    switch (variant) {
      case 'primary':
        return 'text-blue-600 hover:bg-blue-100';
      case 'success':
        return 'text-green-600 hover:bg-green-100';
      case 'danger':
        return 'text-red-600 hover:bg-red-100';
      default:
        return 'text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`p-2 rounded transition-colors ${getVariantClasses()} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      title={title}
    >
      <Icon icon={icon} />
    </button>
  );
}

export default ToolbarButton;
