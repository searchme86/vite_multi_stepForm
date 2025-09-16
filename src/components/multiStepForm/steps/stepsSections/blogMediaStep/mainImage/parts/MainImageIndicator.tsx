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
        // ✅ 왕관: 숫자 카운팅과 동일한 위치로 수정
        return 'top-1.5 left-1.5 sm:top-2 sm:left-2';
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
        // ✅ 왕관: 숫자 카운팅과 동일한 크기로 수정
        return 'w-5 h-5 sm:w-6 sm:h-6 text-sm';
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
        return 'text-xs sm:text-sm';
    }
  };

  const indicatorClasses = `
    absolute z-20 ${getPositionClasses()} ${getSizeClasses()}
    flex items-center justify-center
    bg-yellow-500 text-white rounded-full shadow-md
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
