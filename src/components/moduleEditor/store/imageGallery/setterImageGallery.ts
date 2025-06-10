import type { ImageViewConfig, CustomGalleryView } from '../shared/commonTypes';
import type { ImageGalleryState } from './initialImageGalleryState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialImageGalleryState } from './initialImageGalleryState';

export interface ImageGallerySetters
  extends DynamicStoreMethods<ImageGalleryState> {
  addCustomGalleryView: (view: CustomGalleryView) => void;
  removeCustomGalleryView: (id: string) => void;
  updateCustomGalleryView: (
    id: string,
    updates: Partial<CustomGalleryView>
  ) => void;
  clearCustomGalleryViews: () => void;
  updateImageViewConfig: (config: Partial<ImageViewConfig>) => void;
  togglePreviewPanel: () => void;
  resetImageGalleryState: () => void;
}

export const createImageGallerySetters = (): ImageGallerySetters => {
  const dynamicMethods = createDynamicMethods(initialImageGalleryState);

  return {
    ...dynamicMethods,
    addCustomGalleryView: () => {
      throw new Error('addCustomGalleryView must be implemented in store');
    },
    removeCustomGalleryView: () => {
      throw new Error('removeCustomGalleryView must be implemented in store');
    },
    updateCustomGalleryView: () => {
      throw new Error('updateCustomGalleryView must be implemented in store');
    },
    clearCustomGalleryViews: () => {
      throw new Error('clearCustomGalleryViews must be implemented in store');
    },
    updateImageViewConfig: () => {
      throw new Error('updateImageViewConfig must be implemented in store');
    },
    togglePreviewPanel: () => {
      throw new Error('togglePreviewPanel must be implemented in store');
    },
    resetImageGalleryState: () => {
      throw new Error('resetImageGalleryState must be implemented in store');
    },
  };
};
