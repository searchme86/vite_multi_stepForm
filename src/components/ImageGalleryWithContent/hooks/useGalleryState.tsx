// components/ImageGalleryWithContent/hooks/useGalleryState.tsx

import { useState, useCallback } from 'react';
import type { ImageData } from '../types/imageGalleryTypes';

interface UseGalleryStateProps {
  images: ImageData[];
  onImageChange?: (currentImageIndex: number, imageData: ImageData) => void;
}

interface UseGalleryStateReturn {
  currentImageIndex: number;
  getCurrentImage: () => ImageData | null;
  handleImageChange: (newImageIndex: number) => void;
}

function useGalleryState({
  images,
  onImageChange,
}: UseGalleryStateProps): UseGalleryStateReturn {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // 현재 이미지 가져오기
  const getCurrentImage = useCallback((): ImageData | null => {
    if (images.length === 0) {
      return null;
    }

    const validIndex = Math.max(
      0,
      Math.min(currentImageIndex, images.length - 1)
    );
    return images[validIndex] ?? null;
  }, [images, currentImageIndex]);

  // 이미지 변경 핸들러
  const handleImageChange = useCallback(
    (newImageIndex: number) => {
      const validIndex = Math.max(
        0,
        Math.min(newImageIndex, images.length - 1)
      );

      setCurrentImageIndex(validIndex);

      const imageData = images[validIndex];
      if (imageData) {
        onImageChange?.(validIndex, imageData);
      }
    },
    [images, onImageChange]
  );

  return {
    currentImageIndex,
    getCurrentImage,
    handleImageChange,
  };
}

export default useGalleryState;
