// blogMediaStep/mainImage/parts/MainImageIndicator.tsx

import React from 'react';
import { Icon } from '@iconify/react';

interface MainImageIndicatorProps {
  isMainImage: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  customIcon?: string;
  className?: string;
}

function MainImageIndicator({
  isMainImage,
  position = 'top-right',
  size = 'md',
  showLabel = false,
  customIcon = 'lucide:crown',
  className = '',
}: MainImageIndicatorProps): React.ReactNode {
  console.log('🔧 MainImageIndicator 렌더링:', { isMainImage, position, size });

  if (!isMainImage) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return '-top-1 -left-1';
      case 'bottom-right':
        return '-bottom-1 -right-1';
      case 'bottom-left':
        return '-bottom-1 -left-1';
      case 'top-right':
      default:
        return '-top-1 -right-1';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4 text-xs';
      case 'lg':
        return 'w-8 h-8 text-lg';
      case 'md':
      default:
        return 'w-6 h-6 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      case 'md':
      default:
        return 'text-sm';
    }
  };

  const indicatorClasses = `
    absolute ${getPositionClasses()} ${getSizeClasses()}
    flex items-center justify-center
    bg-primary text-white rounded-full shadow-lg
    transition-all duration-200 hover:scale-110
    ${className}
  `.trim();

  return (
    <>
      <div
        className={indicatorClasses}
        role="img"
        aria-label="메인 이미지"
        title="메인 이미지"
      >
        <Icon icon={customIcon} className={getIconSize()} aria-hidden="true" />
      </div>

      {showLabel && (
        <div className="absolute bottom-0 left-0 right-0 p-1 text-xs text-center text-white bg-primary bg-opacity-90">
          메인 이미지
        </div>
      )}
    </>
  );
}

export default MainImageIndicator;
