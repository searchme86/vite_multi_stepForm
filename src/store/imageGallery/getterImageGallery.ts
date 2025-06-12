import type { CustomGalleryView } from '../shared/commonTypes';
import type { ImageGalleryState } from './initialImageGalleryState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';
import { initialImageGalleryState } from './initialImageGalleryState';

export interface ImageGalleryGetters
  extends DynamicStoreMethods<ImageGalleryState> {
  getCustomGalleryViewById: (id: string) => CustomGalleryView | undefined;
  getSelectedImagesCount: () => number;
  getClickOrderedImages: () => string[];
}

export const createImageGalleryGetters = (): ImageGalleryGetters => {
  const dynamicMethods = createDynamicMethods(initialImageGalleryState);

  return {
    ...dynamicMethods,
    getCustomGalleryViewById: () => {
      throw new Error('getCustomGalleryViewById must be implemented in store');
    },
    getSelectedImagesCount: () => {
      throw new Error('getSelectedImagesCount must be implemented in store');
    },
    getClickOrderedImages: () => {
      throw new Error('getClickOrderedImages must be implemented in store');
    },
  };
};
