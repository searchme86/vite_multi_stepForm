// blogMediaStep/mainImage/parts/MainImageSetButton.tsx

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface MainImageSetButtonProps {
  imageIndex: number;
  onSetAsMainImage: (index: number) => void;
  isDisabled?: boolean;
  tooltipText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?:
    | 'solid'
    | 'flat'
    | 'light'
    | 'bordered'
    | 'faded'
    | 'shadow'
    | 'ghost';
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'default';
}

function MainImageSetButton({
  imageIndex,
  onSetAsMainImage,
  isDisabled = false,
  tooltipText = '메인 이미지로 설정',
  size = 'sm',
  variant = 'light',
  color = 'default',
}: MainImageSetButtonProps): React.ReactNode {
  console.log('🔧 MainImageSetButton 렌더링:', { imageIndex, isDisabled });

  const handleClick = () => {
    console.log('🔧 MainImageSetButton 클릭:', { imageIndex });
    onSetAsMainImage(imageIndex);
  };

  return (
    <Button
      isIconOnly
      size={size}
      variant={variant}
      color={color}
      onPress={handleClick}
      isDisabled={isDisabled}
      aria-label={`이미지 ${imageIndex + 1} 메인 이미지로 선택`}
      title={tooltipText}
      type="button"
    >
      <Icon icon="lucide:home" className="text-sm" />
    </Button>
  );
}

export default MainImageSetButton;
