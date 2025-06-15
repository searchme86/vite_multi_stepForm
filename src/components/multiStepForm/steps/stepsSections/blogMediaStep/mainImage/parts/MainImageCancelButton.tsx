// blogMediaStep/mainImage/parts/MainImageCancelButton.tsx

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface MainImageCancelButtonProps {
  onCancelMainImage: () => void;
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
  confirmBeforeCancel?: boolean;
}

function MainImageCancelButton({
  onCancelMainImage,
  isDisabled = false,
  tooltipText = '메인 이미지 해제',
  size = 'sm',
  variant = 'light',
  color = 'warning',
  confirmBeforeCancel = false,
}: MainImageCancelButtonProps): React.ReactNode {
  console.log('🔧 MainImageCancelButton 렌더링:', {
    isDisabled,
    confirmBeforeCancel,
  });

  const handleClick = () => {
    console.log('🔧 MainImageCancelButton 클릭');

    if (confirmBeforeCancel) {
      const confirmed = window.confirm('메인 이미지 설정을 해제하시겠습니까?');
      if (!confirmed) {
        console.log('⚠️ 메인 이미지 해제 취소됨');
        return;
      }
    }

    onCancelMainImage();
  };

  return (
    <Button
      isIconOnly
      size={size}
      variant={variant}
      color={color}
      onPress={handleClick}
      isDisabled={isDisabled}
      aria-label="메인 이미지 해제"
      title={tooltipText}
      type="button"
    >
      <Icon icon="lucide:x" className="text-sm" />
    </Button>
  );
}

export default MainImageCancelButton;
