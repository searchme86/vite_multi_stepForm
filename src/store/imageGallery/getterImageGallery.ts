// 📁 store/imageGallery/getterImageGallery.ts

import type {
  HybridCustomGalleryView,
  ImageGalleryMetadata,
  HybridImageViewConfig,
} from '../shared/commonTypes';

// 🆕 완전히 중복 제거된 ImageGalleryGetters 인터페이스
export interface ImageGalleryGetters {
  // 🔄 기존 핵심 메서드들
  getCustomGalleryViewById: (id: string) => HybridCustomGalleryView | undefined;
  getSelectedImagesCount: () => number;
  getClickOrderedImages: () => string[];

  // 🆕 하이브리드 getter 메서드들
  getSelectedImageIds: () => string[];
  getImageMetadata: () => ImageGalleryMetadata[];
  getImageMetadataById: (imageId: string) => ImageGalleryMetadata | undefined;
  getHybridImageViewConfig: () => HybridImageViewConfig;

  // 🆕 기본 속성 getter 메서드들
  getImageViewConfig: () => HybridImageViewConfig;
  getCustomGalleryViews: () => HybridCustomGalleryView[];
  getIsPreviewPanelOpen: () => boolean;
  getIsHybridMode: () => boolean;
  getLastSyncTimestamp: () => Date | null;

  // 🆕 초기화 관련 getter 메서드들
  getIsInitialized: () => boolean;
  getInitializationPromise: () => Promise<void> | null;

  // 🆕 내부 속성 getter 메서드들 (DynamicStoreMethods 호환용)
  get_isInitialized: () => boolean;
  get_initializationPromise: () => Promise<void> | null;
}

// 🆕 ImageGalleryGetters 생성 함수
export const createImageGalleryGetters = (): ImageGalleryGetters => {
  console.log('🔧 [GETTERS] 완전히 중복 제거된 이미지 갤러리 getters 생성');

  return {
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

    // 🆕 하이브리드 getter 메서드들
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

    // 🆕 기본 속성 getter 메서드들
    getImageViewConfig: () => {
      throw new Error('getImageViewConfig must be implemented in store');
    },

    getCustomGalleryViews: () => {
      throw new Error('getCustomGalleryViews must be implemented in store');
    },

    getIsPreviewPanelOpen: () => {
      throw new Error('getIsPreviewPanelOpen must be implemented in store');
    },

    getIsHybridMode: () => {
      throw new Error('getIsHybridMode must be implemented in store');
    },

    getLastSyncTimestamp: () => {
      throw new Error('getLastSyncTimestamp must be implemented in store');
    },

    // 🆕 초기화 관련 getter 메서드들
    getIsInitialized: () => {
      throw new Error('getIsInitialized must be implemented in store');
    },

    getInitializationPromise: () => {
      throw new Error('getInitializationPromise must be implemented in store');
    },

    // 🆕 내부 속성 getter 메서드들 (DynamicStoreMethods 호환용)
    get_isInitialized: () => {
      throw new Error('get_isInitialized must be implemented in store');
    },

    get_initializationPromise: () => {
      throw new Error('get_initializationPromise must be implemented in store');
    },
  };
};
