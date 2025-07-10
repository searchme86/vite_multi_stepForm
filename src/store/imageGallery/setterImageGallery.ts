// 📁 store/imageGallery/setterImageGallery.ts

import type {
  HybridImageViewConfig,
  HybridCustomGalleryView,
  ImageGalleryMetadata,
} from '../shared/commonTypes';
import type { HybridImageGalleryState } from './initialImageGalleryState';
import {
  createDynamicMethods,
  type DynamicStoreMethods,
} from '../shared/dynamicTypeFactory';

// 🆕 통합된 ImageGallerySetters 인터페이스 (중복 제거)
export interface ImageGallerySetters
  extends DynamicStoreMethods<HybridImageGalleryState> {
  // 🔄 기존 핵심 메서드들
  addCustomGalleryView: (view: HybridCustomGalleryView) => void;
  removeCustomGalleryView: (id: string) => void;
  updateCustomGalleryView: (
    id: string,
    updates: Partial<HybridCustomGalleryView>
  ) => void;
  clearCustomGalleryViews: () => void;
  updateImageViewConfig: (config: Partial<HybridImageViewConfig>) => void;
  togglePreviewPanel: () => void;
  resetImageGalleryState: () => void;

  // 🆕 간소화된 하이브리드 setter 메서드들
  setSelectedImageIds: (imageIds: string[]) => void;
  addSelectedImageId: (imageId: string) => void;
  removeSelectedImageId: (imageId: string) => void;
  setImageMetadata: (metadata: ImageGalleryMetadata[]) => void;
  addImageMetadata: (metadata: ImageGalleryMetadata) => void;
  removeImageMetadata: (imageId: string) => void;
  setIsHybridMode: (isHybridMode: boolean) => void;
  setLastSyncTimestamp: (timestamp: Date | null) => void;
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

// 🆕 통합된 ImageGallerySetters 생성 함수 (간소화)
export const createImageGallerySetters = (): ImageGallerySetters => {
  console.log('🔧 [SETTERS] 간소화된 이미지 갤러리 setters 생성');

  const initialHybridState = createInitialHybridState();
  const dynamicMethods = createDynamicMethods(initialHybridState);

  return {
    // 🔧 DynamicStoreMethods 포함
    ...dynamicMethods,

    // 🔄 기존 핵심 메서드들
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

    // 🆕 간소화된 하이브리드 setter 메서드들
    setSelectedImageIds: () => {
      throw new Error('setSelectedImageIds must be implemented in store');
    },

    addSelectedImageId: () => {
      throw new Error('addSelectedImageId must be implemented in store');
    },

    removeSelectedImageId: () => {
      throw new Error('removeSelectedImageId must be implemented in store');
    },

    setImageMetadata: () => {
      throw new Error('setImageMetadata must be implemented in store');
    },

    addImageMetadata: () => {
      throw new Error('addImageMetadata must be implemented in store');
    },

    removeImageMetadata: () => {
      throw new Error('removeImageMetadata must be implemented in store');
    },

    setIsHybridMode: () => {
      throw new Error('setIsHybridMode must be implemented in store');
    },

    setLastSyncTimestamp: () => {
      throw new Error('setLastSyncTimestamp must be implemented in store');
    },
  };
};
