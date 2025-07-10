// 📁 store/imageGallery/getterImageGallery.ts

import type {
  HybridCustomGalleryView,
  ImageGalleryMetadata,
  HybridImageViewConfig,
} from '../shared/commonTypes';
import type { HybridImageGalleryState } from './initialImageGalleryState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';

// 🆕 통합된 ImageGalleryGetters 인터페이스 (중복 제거)
export interface ImageGalleryGetters
  extends DynamicStoreMethods<HybridImageGalleryState> {
  // 🔄 기존 핵심 메서드들
  getCustomGalleryViewById: (id: string) => HybridCustomGalleryView | undefined;
  getSelectedImagesCount: () => number;
  getClickOrderedImages: () => string[];

  // 🆕 간소화된 하이브리드 getter 메서드들
  getSelectedImageIds: () => string[];
  getImageMetadata: () => ImageGalleryMetadata[];
  getImageMetadataById: (imageId: string) => ImageGalleryMetadata | undefined;
  getHybridImageViewConfig: () => HybridImageViewConfig;
  getIsHybridMode: () => boolean;
  getLastSyncTimestamp: () => Date | null;
}

// 🔧 초기 하이브리드 상태 생성 (DynamicStoreMethods용)
const createInitialHybridState = (): HybridImageGalleryState => {
  return {
    imageViewConfig: {
      clickOrder: [],
      selectedImageIds: [],
      selectedImages: [],
      imageMetadata: [],
      layout: {
        columns: 3,
        gridType: 'grid',
      },
      filter: 'all',
    },
    customGalleryViews: [],
    isPreviewPanelOpen: false,
    isHybridMode: true,
    lastSyncTimestamp: null,
  };
};

// 🆕 통합된 ImageGalleryGetters 생성 함수 (간소화)
export const createImageGalleryGetters = (): ImageGalleryGetters => {
  console.log('🔧 [GETTERS] 간소화된 이미지 갤러리 getters 생성');

  const initialHybridState = createInitialHybridState();
  const dynamicMethods = createDynamicMethods(initialHybridState);

  return {
    // 🔧 DynamicStoreMethods 포함
    ...dynamicMethods,

    // 🔄 기존 핵심 메서드들
    getCustomGalleryViewById: () => {
      throw new Error('getCustomGalleryViewById must be implemented in store');
    },

    getSelectedImagesCount: () => {
      throw new Error('getSelectedImagesCount must be implemented in store');
    },

    getClickOrderedImages: () => {
      throw new Error('getClickOrderedImages must be implemented in store');
    },

    // 🆕 간소화된 하이브리드 getter 메서드들
    getSelectedImageIds: () => {
      throw new Error('getSelectedImageIds must be implemented in store');
    },

    getImageMetadata: () => {
      throw new Error('getImageMetadata must be implemented in store');
    },

    getImageMetadataById: () => {
      throw new Error('getImageMetadataById must be implemented in store');
    },

    getHybridImageViewConfig: () => {
      throw new Error('getHybridImageViewConfig must be implemented in store');
    },

    getIsHybridMode: () => {
      throw new Error('getIsHybridMode must be implemented in store');
    },

    getLastSyncTimestamp: () => {
      throw new Error('getLastSyncTimestamp must be implemented in store');
    },
  };
};
