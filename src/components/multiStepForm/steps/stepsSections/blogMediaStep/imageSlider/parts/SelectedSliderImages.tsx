// blogMediaStep/imageSlider/parts/SelectedSliderImages.tsx

import React from 'react';
import { Button, Icon } from '@heroui/react';

interface SelectedSliderImagesProps {
  localSliderImages: string[];
  onRemoveFromSlider: (imageUrl: string) => void;
  onMoveToFirst?: (imageUrl: string) => void;
  onMoveToLast?: (imageUrl: string) => void;
  showOrderControls?: boolean;
  className?: string;
}

function SelectedSliderImages({
  localSliderImages,
  onRemoveFromSlider,
  onMoveToFirst,
  onMoveToLast,
  showOrderControls = false,
  className = '',
}: SelectedSliderImagesProps): React.ReactNode {
  console.log('🔧 SelectedSliderImages 렌더링:', {
    imageCount: localSliderImages.length,
    showOrderControls,
  });

  if (localSliderImages.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 mt-6 rounded-lg bg-default-50 ${className}`}>
      <h4 className="mb-3 text-sm font-medium">
        선택된 슬라이더 이미지 ({localSliderImages.length}개)
      </h4>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
          {localSliderImages.map((imageUrl, index) => (
            <div
              key={`slider-${index}-${imageUrl}`}
              className="relative flex-shrink-0 group"
            >
              <img
                src={imageUrl}
                alt={`선택된 슬라이더 이미지 ${index + 1}`}
                className="object-cover w-20 h-20 rounded-md"
              />

              <div className="absolute inset-0 flex items-center justify-center transition-all bg-black bg-opacity-0 rounded-md opacity-0 group-hover:bg-opacity-50 group-hover:opacity-100">
                <div className="flex items-center gap-1">
                  {showOrderControls && onMoveToFirst && index > 0 && (
                    <Button
                      isIconOnly
                      color="primary"
                      variant="solid"
                      size="sm"
                      onPress={() => onMoveToFirst(imageUrl)}
                      type="button"
                      aria-label={`슬라이더 이미지 ${index + 1} 첫 번째로 이동`}
                      title="첫 번째로 이동"
                    >
                      <Icon icon="lucide:chevrons-left" size={12} />
                    </Button>
                  )}

                  <Button
                    isIconOnly
                    color="danger"
                    variant="solid"
                    size="sm"
                    onPress={() => onRemoveFromSlider(imageUrl)}
                    type="button"
                    aria-label={`슬라이더 이미지 ${index + 1} 삭제`}
                    title="슬라이더에서 제거"
                  >
                    <Icon icon="lucide:trash-2" size={12} />
                  </Button>

                  {showOrderControls &&
                    onMoveToLast &&
                    index < localSliderImages.length - 1 && (
                      <Button
                        isIconOnly
                        color="primary"
                        variant="solid"
                        size="sm"
                        onPress={() => onMoveToLast(imageUrl)}
                        type="button"
                        aria-label={`슬라이더 이미지 ${
                          index + 1
                        } 마지막으로 이동`}
                        title="마지막으로 이동"
                      >
                        <Icon icon="lucide:chevrons-right" size={12} />
                      </Button>
                    )}
                </div>
              </div>

              <div className="absolute flex items-center justify-center w-5 h-5 text-xs text-white rounded-full -top-1 -left-1 bg-primary">
                {index + 1}
              </div>

              {showOrderControls && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="flex items-center gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        className="flex items-center justify-center w-4 h-4 text-xs text-white rounded bg-secondary hover:bg-secondary-600"
                        onClick={() => onMoveToFirst?.(imageUrl)}
                        aria-label="위로 이동"
                      >
                        <Icon icon="lucide:chevron-up" size={8} />
                      </button>
                    )}
                    {index < localSliderImages.length - 1 && (
                      <button
                        type="button"
                        className="flex items-center justify-center w-4 h-4 text-xs text-white rounded bg-secondary hover:bg-secondary-600"
                        onClick={() => onMoveToLast?.(imageUrl)}
                        aria-label="아래로 이동"
                      >
                        <Icon icon="lucide:chevron-down" size={8} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelectedSliderImages;
