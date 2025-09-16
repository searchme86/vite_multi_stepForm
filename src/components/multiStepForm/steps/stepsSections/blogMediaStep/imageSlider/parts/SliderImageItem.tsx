// blogMediaStep/imageSlider/parts/SliderImageItem.tsx

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface SliderImageItemProps {
  imageUrl: string;
  index: number;
  totalCount: number;
  onRemove: (imageUrl: string) => void;
  onMoveToFirst?: (imageUrl: string) => void;
  onMoveToLast?: (imageUrl: string) => void;
  onMoveUp?: (imageUrl: string) => void;
  onMoveDown?: (imageUrl: string) => void;
  showOrderControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function SliderImageItem({
  imageUrl,
  index,
  totalCount,
  onRemove,
  onMoveToFirst,
  onMoveToLast,
  onMoveUp,
  onMoveDown,
  showOrderControls = false,
  size = 'md',
  className = '',
}: SliderImageItemProps): React.ReactNode {
  console.log('🔧 SliderImageItem 렌더링:', {
    index,
    totalCount,
    showOrderControls,
    imageUrl: imageUrl.slice(0, 30) + '...',
  });

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-16 h-16';
      case 'lg':
        return 'w-24 h-24';
      case 'md':
      default:
        return 'w-20 h-20';
    }
  };

  const handleRemove = () => {
    console.log('🔧 SliderImageItem 삭제:', { index });
    onRemove(imageUrl);
  };

  const handleMoveToFirst = () => {
    console.log('🔧 SliderImageItem 첫 번째로 이동:', { index });
    onMoveToFirst?.(imageUrl);
  };

  const handleMoveToLast = () => {
    console.log('🔧 SliderImageItem 마지막으로 이동:', { index });
    onMoveToLast?.(imageUrl);
  };

  const handleMoveUp = () => {
    console.log('🔧 SliderImageItem 위로 이동:', { index });
    onMoveUp?.(imageUrl);
  };

  const handleMoveDown = () => {
    console.log('🔧 SliderImageItem 아래로 이동:', { index });
    onMoveDown?.(imageUrl);
  };

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <div className={`relative flex-shrink-0 group ${className}`}>
      <img
        src={imageUrl}
        alt={`슬라이더 이미지 ${index + 1}`}
        className={`object-cover ${getSizeClasses()} rounded-md`}
      />

      <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-50 group-hover:opacity-100">
        <div className="flex items-center gap-1">
          {showOrderControls && (
            <>
              {!isFirst && onMoveToFirst && (
                <Button
                  isIconOnly
                  color="secondary"
                  variant="solid"
                  size="sm"
                  onPress={handleMoveToFirst}
                  type="button"
                  aria-label="첫 번째로 이동"
                  title="첫 번째로 이동"
                >
                  <Icon icon="lucide:chevrons-left" width={10} height={10} />
                </Button>
              )}

              {!isFirst && onMoveUp && (
                <Button
                  isIconOnly
                  color="secondary"
                  variant="solid"
                  size="sm"
                  onPress={handleMoveUp}
                  type="button"
                  aria-label="위로 이동"
                  title="위로 이동"
                >
                  <Icon icon="lucide:chevron-left" width={10} height={10} />
                </Button>
              )}
            </>
          )}

          <Button
            isIconOnly
            color="danger"
            variant="solid"
            size="sm"
            onPress={handleRemove}
            type="button"
            aria-label={`슬라이더 이미지 ${index + 1} 삭제`}
            title="슬라이더에서 제거"
          >
            <Icon icon="lucide:trash-2" width={10} height={10} />
          </Button>

          {showOrderControls && (
            <>
              {!isLast && onMoveDown && (
                <Button
                  isIconOnly
                  color="secondary"
                  variant="solid"
                  size="sm"
                  onPress={handleMoveDown}
                  type="button"
                  aria-label="아래로 이동"
                  title="아래로 이동"
                >
                  <Icon icon="lucide:chevron-right" width={10} height={10} />
                </Button>
              )}

              {!isLast && onMoveToLast && (
                <Button
                  isIconOnly
                  color="secondary"
                  variant="solid"
                  size="sm"
                  onPress={handleMoveToLast}
                  type="button"
                  aria-label="마지막으로 이동"
                  title="마지막으로 이동"
                >
                  <Icon icon="lucide:chevrons-right" width={10} height={10} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="absolute flex items-center justify-center w-5 h-5 text-xs text-white rounded-full -top-1 -left-1 bg-primary">
        {index + 1}
      </div>

      {showOrderControls && (
        <div className="absolute px-1 text-xs text-white rounded -bottom-1 -right-1 bg-secondary">
          {index + 1}/{totalCount}
        </div>
      )}
    </div>
  );
}

export default SliderImageItem;
