// 📁 store/imageGallery/initialImageGalleryState.ts
// 🔧 createDefaultImageViewConfig 함수 사용하도록 수정

import type { ImageViewConfig, CustomGalleryView } from '../shared/commonTypes';
// ✅ 추가: createDefaultImageViewConfig 함수 import
import { createDefaultImageViewConfig } from '../shared/utilityFunctions';

export interface ImageGalleryState {
  imageViewConfig: ImageViewConfig;
  customGalleryViews: CustomGalleryView[];
  isPreviewPanelOpen: boolean;
}

// ✅ 수정: 하드코딩된 객체 대신 createDefaultImageViewConfig() 함수 사용
export const initialImageGalleryState: ImageGalleryState = {
  imageViewConfig: createDefaultImageViewConfig(), // ✅ 함수 호출로 변경
  customGalleryViews: [],
  isPreviewPanelOpen: false,
};
