import React from 'react';
import { ImageViewConfig, CustomGalleryView } from '../../types/galleryTypes';

interface ImageGalleryContextType {
  imageViewConfig: ImageViewConfig;
  setImageViewConfig: (config: ImageViewConfig) => void;
  customGalleryViews: CustomGalleryView[];
  addCustomGalleryView: (view: CustomGalleryView) => void;
  removeCustomGalleryView: (id: string) => void;
  clearCustomGalleryViews: () => void;
  updateCustomGalleryView: (
    id: string,
    updates: Partial<CustomGalleryView>
  ) => void;
  getGalleryViewById: (id: string) => CustomGalleryView | undefined;
  getTotalGalleryViews: () => number;
}

const ImageGalleryContext = React.createContext<
  ImageGalleryContextType | undefined
>(undefined);

interface ImageGalleryProviderProps {
  children: React.ReactNode;
  value: ImageGalleryContextType;
}

export function ImageGalleryProvider({
  children,
  value,
}: ImageGalleryProviderProps) {
  console.log('🖼️ ImageGalleryProvider: 이미지/갤러리 Context Provider 렌더링');

  return (
    <ImageGalleryContext.Provider value={value}>
      {children}
    </ImageGalleryContext.Provider>
  );
}

export function useImageGalleryContext() {
  console.log('🖼️ useImageGalleryContext: 이미지/갤러리 Context 사용');

  const context = React.useContext(ImageGalleryContext);
  if (context === undefined) {
    throw new Error(
      'useImageGalleryContext must be used within a ImageGalleryProvider'
    );
  }
  return context;
}

export { ImageGalleryContext };
