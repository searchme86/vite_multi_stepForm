// 📁 store/imageGallery/setterImageGallery.ts

import type {
  HybridImageViewConfig,
  HybridCustomGalleryView,
  ImageGalleryMetadata,
} from '../shared/commonTypes';

// 🆕 중복 제거된 ImageGallerySetters 인터페이스
export interface ImageGallerySetters {
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

  // 🆕 하이브리드 setter 메서드들
  setSelectedImageIds: (imageIds: string[]) => void;
  addSelectedImageId: (imageId: string) => void;
  removeSelectedImageId: (imageId: string) => void;
  setImageMetadata: (metadata: ImageGalleryMetadata[]) => void;
  addImageMetadata: (metadata: ImageGalleryMetadata) => void;
  removeImageMetadata: (imageId: string) => void;

  // 🆕 기본 속성 setter 메서드들
  setImageViewConfig: (imageViewConfig: HybridImageViewConfig) => void;
  setCustomGalleryViews: (
    customGalleryViews: HybridCustomGalleryView[]
  ) => void;
  setIsPreviewPanelOpen: (isPreviewPanelOpen: boolean) => void;
  setIsHybridMode: (isHybridMode: boolean) => void;
  setLastSyncTimestamp: (timestamp: Date | null) => void;

  // 🆕 초기화 관련 setter 메서드들
  setIsInitialized: (isInitialized: boolean) => void;
  setInitializationPromise: (promise: Promise<void> | null) => void;

  // 🆕 내부 속성 setter 메서드들 (DynamicStoreMethods 호환)
  set_isInitialized: (isInitialized: boolean) => void;
  set_initializationPromise: (promise: Promise<void> | null) => void;
}

// 🆕 ImageGallerySetters 생성 함수 (중복 제거 완료)
export const createImageGallerySetters = (): ImageGallerySetters => {
  console.log('🔧 [SETTERS] 중복 제거된 이미지 갤러리 setters 생성');

  return {
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

    // 🆕 하이브리드 setter 메서드들
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

    // 🆕 기본 속성 setter 메서드들
    setImageViewConfig: () => {
      throw new Error('setImageViewConfig must be implemented in store');
    },

    setCustomGalleryViews: () => {
      throw new Error('setCustomGalleryViews must be implemented in store');
    },

    setIsPreviewPanelOpen: () => {
      throw new Error('setIsPreviewPanelOpen must be implemented in store');
    },

    setIsHybridMode: () => {
      throw new Error('setIsHybridMode must be implemented in store');
    },

    setLastSyncTimestamp: () => {
      throw new Error('setLastSyncTimestamp must be implemented in store');
    },

    // 🆕 초기화 관련 setter 메서드들
    setIsInitialized: () => {
      throw new Error('setIsInitialized must be implemented in store');
    },

    setInitializationPromise: () => {
      throw new Error('setInitializationPromise must be implemented in store');
    },

    // 🆕 내부 속성 setter 메서드들 (DynamicStoreMethods 호환)
    set_isInitialized: () => {
      throw new Error('set_isInitialized must be implemented in store');
    },

    set_initializationPromise: () => {
      throw new Error('set_initializationPromise must be implemented in store');
    },
  };
};
