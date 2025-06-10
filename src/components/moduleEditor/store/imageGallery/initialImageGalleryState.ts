import type { ImageViewConfig, CustomGalleryView } from '../shared/commonTypes';

export interface ImageGalleryState {
  imageViewConfig: ImageViewConfig;
  customGalleryViews: CustomGalleryView[];
  isPreviewPanelOpen: boolean;
}

export const initialImageGalleryState: ImageGalleryState = {
  imageViewConfig: {
    clickOrder: [],
    selectedImages: [],
    layout: {
      columns: 3,
      gridType: 'grid',
    },
    filter: 'all',
  },
  customGalleryViews: [],
  isPreviewPanelOpen: false,
};
