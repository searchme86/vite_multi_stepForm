import React from 'react';
import {
  ImageViewConfig,
  createDefaultImageViewConfig,
} from '../../../types/galleryTypes';

export const useImageViewConfig = () => {
  const [imageViewConfig, setImageViewConfig] = React.useState<ImageViewConfig>(
    createDefaultImageViewConfig()
  );

  const updateImageViewConfig = React.useCallback(
    (newConfig: ImageViewConfig) => {
      console.log(
        '🖼️ updateImageViewConfig: 이미지 뷰 설정 업데이트',
        newConfig
      );
      setImageViewConfig(newConfig);
    },
    []
  );

  const resetImageViewConfig = React.useCallback(() => {
    console.log('🖼️ resetImageViewConfig: 이미지 뷰 설정 초기화');
    setImageViewConfig(createDefaultImageViewConfig());
  }, []);

  return {
    imageViewConfig,
    setImageViewConfig,
    updateImageViewConfig,
    resetImageViewConfig,
  };
};
