// blogMediaStep/imageSlider/parts/SliderAddButton.tsx

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface SliderAddButtonProps {
  selectedCount: number;
  onAddToSlider: () => void;
  isDisabled?: boolean;
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
  className?: string;
}

function SliderAddButton({
  selectedCount,
  onAddToSlider,
  isDisabled = false,
  size = 'md',
  variant = 'solid',
  color = 'primary',
  className = '',
}: SliderAddButtonProps): React.ReactNode {
  console.log('🔧 SliderAddButton 렌더링:', { selectedCount, isDisabled });

  if (selectedCount === 0) {
    return null;
  }

  const handleClick = () => {
    console.log('🔧 SliderAddButton 클릭:', { selectedCount });
    onAddToSlider();
  };

  return (
    <div className={`flex justify-center pt-4 ${className}`}>
      <Button
        color={color}
        variant={variant}
        size={size}
        onPress={handleClick}
        isDisabled={isDisabled}
        startContent={<Icon icon="lucide:plus" />}
        type="button"
        aria-label={`선택된 ${selectedCount}개 이미지 슬라이더에 추가`}
        className="transition-all hover:scale-105"
      >
        선택된 {selectedCount}개 이미지 슬라이더에 추가
      </Button>
    </div>
  );
}

export default SliderAddButton;
