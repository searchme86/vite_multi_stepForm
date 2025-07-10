// 📁 store/imageGallery/imageGalleryStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  HybridImageViewConfig,
  HybridCustomGalleryView,
  HybridImageProcessResult,
  ImageGalleryMetadata,
} from '../shared/commonTypes';
import {
  createInitialHybridImageGalleryState,
  type HybridImageGalleryState,
} from './initialImageGalleryState';
import type { ImageGalleryGetters } from './getterImageGallery';
import type { ImageGallerySetters } from './setterImageGallery';
import { createHybridPersistConfig } from '../shared/persistConfig';
import { ImageGalleryHybridStorage } from '../shared/storage/imageGalleryHybridStorage';
import {
  createDefaultImageGalleryStorageConfig,
  generateImageGalleryMetadataId,
} from '../shared/storage/imageGalleryMetadata';

// 🆕 간소화된 하이브리드 스토어 타입 (통합)
type HybridImageGalleryStore = HybridImageGalleryState &
  ImageGalleryGetters &
  ImageGallerySetters & {
    // 🆕 핵심 하이브리드 메서드들만
    saveImageToHybridStorage: (
      files: File[]
    ) => Promise<HybridImageProcessResult>;
    loadStoredImages: () => Promise<void>;
    deleteImageFromHybridStorage: (imageId: string) => Promise<void>;

    // 🆕 초기화 관련 메서드
    initializeStoredImages: () => Promise<void>;
    getIsInitialized: () => boolean;
  };

// 🆕 간소화된 하이브리드 Zustand 스토어 (메인 스토어)
export const useHybridImageGalleryStore = create<HybridImageGalleryStore>()(
  persist((set, get) => {
    // 🔧 간소화된 HybridStorage 인스턴스 관리
    let hybridStorage: ImageGalleryHybridStorage | null = null;
    let isInitialized = false; // 🆕 초기화 플래그

    const getHybridStorage = (): ImageGalleryHybridStorage => {
      if (hybridStorage !== null) {
        return hybridStorage;
      }

      const config = createDefaultImageGalleryStorageConfig();
      const options = {
        enableCompression: true,
        compressionQuality: 0.8,
      };
      hybridStorage = new ImageGalleryHybridStorage(config, options);
      return hybridStorage;
    };

    const initializeIfNeeded = async (): Promise<void> => {
      try {
        const storage = getHybridStorage();
        await storage.initializeHybridStorage();
        console.log('✅ [STORE_INIT] 하이브리드 스토리지 초기화 완료');
      } catch (initError) {
        console.error('❌ [STORE_INIT] 하이브리드 스토리지 초기화 실패:', {
          error: initError,
        });
        throw initError;
      }
    };

    // 🆕 자동 초기화 함수
    const autoInitializeStoredImages = async (): Promise<void> => {
      if (isInitialized) {
        return; // 이미 초기화됨
      }

      try {
        console.log('🔄 [AUTO_INIT] 자동 이미지 복원 시작');
        await initializeIfNeeded();
        const storage = getHybridStorage();
        const allMetadata = await storage.getAllImageMetadata();

        const hasStoredImages = allMetadata.length > 0;
        if (hasStoredImages) {
          await loadStoredImagesInternal();
          console.log('✅ [AUTO_INIT] 자동 이미지 복원 완료');
        } else {
          console.log('ℹ️ [AUTO_INIT] 저장된 이미지 없음');
        }

        isInitialized = true;
      } catch (autoInitError) {
        console.error('❌ [AUTO_INIT] 자동 초기화 실패:', {
          error: autoInitError,
        });
      }
    };

    // 🔧 내부 이미지 로드 함수 (중복 방지)
    const loadStoredImagesInternal = async (): Promise<void> => {
      const storage = getHybridStorage();
      const allMetadata = await storage.getAllImageMetadata();

      const loadPromises = allMetadata.map(async (metadata) => {
        try {
          const imageUrl = await storage.loadImageFromHybridStorage(
            metadata.id
          );
          return imageUrl;
        } catch (loadError) {
          console.error('❌ [LOAD_STORED] 개별 이미지 로드 실패:', {
            metadataId: metadata.id,
          });
          return null;
        }
      });

      const loadResults = await Promise.allSettled(loadPromises);
      const successfulUrls = loadResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((url): url is string => url !== null);

      // selectedImageIds 중심으로 상태 복원
      set((state) => ({
        imageViewConfig: {
          ...state.imageViewConfig,
          selectedImageIds: allMetadata.map((metadata) => metadata.id),
          imageMetadata: allMetadata,
          selectedImages: successfulUrls,
        },
        lastSyncTimestamp: new Date(),
      }));
    };

    return {
      ...createInitialHybridImageGalleryState(),

      // 🔄 기존 메서드들 (간소화된 HybridImageViewConfig 사용)
      getImageViewConfig: () => get().imageViewConfig,
      setImageViewConfig: (imageViewConfig: HybridImageViewConfig) => {
        set({ imageViewConfig });
      },

      getCustomGalleryViews: () => get().customGalleryViews,
      setCustomGalleryViews: (
        customGalleryViews: HybridCustomGalleryView[]
      ) => {
        set({ customGalleryViews });
      },

      getIsPreviewPanelOpen: () => get().isPreviewPanelOpen,
      setIsPreviewPanelOpen: (isPreviewPanelOpen: boolean) =>
        set({ isPreviewPanelOpen }),

      getCustomGalleryViewById: (id: string) =>
        get().customGalleryViews.find((view) => view.id === id),

      // 🔧 selectedImageIds 중심으로 간소화
      getSelectedImagesCount: () => {
        const { imageViewConfig } = get();
        const { selectedImageIds = [] } = imageViewConfig;
        return selectedImageIds.length;
      },

      // 🔧 클릭 순서 기반 이미지 URL 반환 (런타임 생성)
      getClickOrderedImages: () => {
        const { imageViewConfig } = get();
        const { selectedImages = [], clickOrder = [] } = imageViewConfig;
        return clickOrder
          .map((index) => selectedImages[index])
          .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
      },

      // 🆕 간소화된 하이브리드 getter 메서드들 (자동 초기화 포함)
      getSelectedImageIds: () => {
        // 🔄 자동 초기화 (비동기)
        if (!isInitialized) {
          autoInitializeStoredImages();
        }
        const { imageViewConfig } = get();
        return imageViewConfig.selectedImageIds || [];
      },

      getImageMetadata: () => {
        // 🔄 자동 초기화 (비동기)
        if (!isInitialized) {
          autoInitializeStoredImages();
        }
        const { imageViewConfig } = get();
        return imageViewConfig.imageMetadata || [];
      },

      getImageMetadataById: (imageId: string) => {
        // 🔄 자동 초기화 (비동기)
        if (!isInitialized) {
          autoInitializeStoredImages();
        }
        const { imageViewConfig } = get();
        const { imageMetadata = [] } = imageViewConfig;
        return imageMetadata.find((metadata) => metadata.id === imageId);
      },

      getHybridImageViewConfig: () => {
        // 🔄 자동 초기화 (비동기)
        if (!isInitialized) {
          autoInitializeStoredImages();
        }
        return get().imageViewConfig;
      },

      getIsHybridMode: () => get().isHybridMode,

      getLastSyncTimestamp: () => get().lastSyncTimestamp,

      // 🆕 초기화 관련 메서드들
      getIsInitialized: () => isInitialized,

      initializeStoredImages: async (): Promise<void> => {
        if (isInitialized) {
          console.log('ℹ️ [MANUAL_INIT] 이미 초기화됨');
          return;
        }
        await autoInitializeStoredImages();
      },

      // 🔄 커스텀뷰 메서드들 (간소화)
      addCustomGalleryView: (view: HybridCustomGalleryView) =>
        set((state) => {
          const exists = state.customGalleryViews.some((v) => v.id === view.id);
          if (exists) {
            throw new Error(
              `Custom gallery view with id ${view.id} already exists`
            );
          }
          return {
            customGalleryViews: [...state.customGalleryViews, view],
          };
        }),

      removeCustomGalleryView: (id: string) =>
        set((state) => {
          const exists = state.customGalleryViews.some((v) => v.id === id);
          if (!exists) {
            throw new Error(`Custom gallery view with id ${id} not found`);
          }
          return {
            customGalleryViews: state.customGalleryViews.filter(
              (view) => view.id !== id
            ),
          };
        }),

      updateCustomGalleryView: (
        id: string,
        updates: Partial<HybridCustomGalleryView>
      ) =>
        set((state) => {
          const viewIndex = state.customGalleryViews.findIndex(
            (v) => v.id === id
          );
          if (viewIndex === -1) {
            throw new Error(`Custom gallery view with id ${id} not found`);
          }
          const newViews = [...state.customGalleryViews];
          newViews[viewIndex] = { ...newViews[viewIndex], ...updates };
          return {
            customGalleryViews: newViews,
          };
        }),

      clearCustomGalleryViews: () => set({ customGalleryViews: [] }),

      updateImageViewConfig: (config: Partial<HybridImageViewConfig>) =>
        set((state) => ({
          imageViewConfig: { ...state.imageViewConfig, ...config },
        })),

      togglePreviewPanel: () =>
        set((state) => ({
          isPreviewPanelOpen: !state.isPreviewPanelOpen,
        })),

      resetImageGalleryState: () => set(createInitialHybridImageGalleryState()),

      // 🆕 간소화된 하이브리드 setter 메서드들 (직접 구현)
      setSelectedImageIds: (imageIds: string[]) =>
        set((state) => ({
          imageViewConfig: {
            ...state.imageViewConfig,
            selectedImageIds: imageIds,
          },
        })),

      addSelectedImageId: (imageId: string) =>
        set((state) => {
          const { selectedImageIds = [] } = state.imageViewConfig;
          const isDuplicate = selectedImageIds.includes(imageId);
          if (isDuplicate) {
            return state;
          }
          return {
            imageViewConfig: {
              ...state.imageViewConfig,
              selectedImageIds: [...selectedImageIds, imageId],
            },
          };
        }),

      removeSelectedImageId: (imageId: string) =>
        set((state) => {
          const { selectedImageIds = [] } = state.imageViewConfig;
          return {
            imageViewConfig: {
              ...state.imageViewConfig,
              selectedImageIds: selectedImageIds.filter((id) => id !== imageId),
            },
          };
        }),

      setImageMetadata: (metadata: ImageGalleryMetadata[]) =>
        set((state) => ({
          imageViewConfig: {
            ...state.imageViewConfig,
            imageMetadata: metadata,
          },
        })),

      addImageMetadata: (metadata: ImageGalleryMetadata) =>
        set((state) => {
          const { imageMetadata = [] } = state.imageViewConfig;
          const isDuplicate = imageMetadata.some((m) => m.id === metadata.id);
          if (isDuplicate) {
            return state;
          }
          return {
            imageViewConfig: {
              ...state.imageViewConfig,
              imageMetadata: [...imageMetadata, metadata],
            },
          };
        }),

      removeImageMetadata: (imageId: string) =>
        set((state) => {
          const { imageMetadata = [] } = state.imageViewConfig;
          return {
            imageViewConfig: {
              ...state.imageViewConfig,
              imageMetadata: imageMetadata.filter((m) => m.id !== imageId),
            },
          };
        }),

      setIsHybridMode: (isHybridMode: boolean) => set({ isHybridMode }),

      setLastSyncTimestamp: (timestamp: Date | null) =>
        set({ lastSyncTimestamp: timestamp }),

      // 🆕 간소화된 하이브리드 핵심 메서드들
      saveImageToHybridStorage: async (
        files: File[]
      ): Promise<HybridImageProcessResult> => {
        console.log('💾 [HYBRID_SAVE] 하이브리드 저장 시작:', {
          fileCount: files.length,
        });

        try {
          await initializeIfNeeded();
          const storage = getHybridStorage();

          const successful: Array<{
            metadata: ImageGalleryMetadata;
            binaryKey: string;
            imageUrl: string;
          }> = [];

          const failed: Array<{
            file: File;
            error: string;
          }> = [];

          const processPromises = files.map(async (file) => {
            try {
              const metadataId = generateImageGalleryMetadataId(file.name);
              const hybridData = await storage.saveImageToHybridStorage(
                file,
                metadataId
              );

              return {
                metadata: hybridData.metadata,
                binaryKey: hybridData.binaryKey,
                imageUrl: hybridData.metadata.originalDataUrl,
              };
            } catch (fileError) {
              const errorMessage =
                fileError instanceof Error
                  ? fileError.message
                  : String(fileError);
              throw { file, error: errorMessage };
            }
          });

          const results = await Promise.allSettled(processPromises);

          results.forEach((result) => {
            if (result.status === 'fulfilled') {
              successful.push(result.value);
            } else {
              failed.push(result.reason);
            }
          });

          // 🔧 성공한 이미지들을 Zustand 상태에 추가 (selectedImageIds 중심)
          const hasSuccessfulResults = successful.length > 0;
          if (hasSuccessfulResults) {
            set((state) => {
              const { imageViewConfig } = state;
              const {
                selectedImageIds = [],
                imageMetadata = [],
                selectedImages = [],
              } = imageViewConfig;

              // ID 중심 관리
              const newSelectedImageIds = [
                ...selectedImageIds,
                ...successful.map((data) => data.metadata.id),
              ];

              const newImageMetadata = [
                ...imageMetadata,
                ...successful.map((data) => data.metadata),
              ];

              // 런타임 이미지 URL 추가
              const newSelectedImages = [
                ...selectedImages,
                ...successful.map((data) => data.imageUrl),
              ];

              return {
                imageViewConfig: {
                  ...imageViewConfig,
                  selectedImageIds: newSelectedImageIds,
                  imageMetadata: newImageMetadata,
                  selectedImages: newSelectedImages,
                },
                lastSyncTimestamp: new Date(),
              };
            });

            // 🆕 이미지 저장 후 초기화 완료로 표시
            isInitialized = true;
          }

          const result: HybridImageProcessResult = {
            successful,
            failed,
            totalProcessed: files.length,
          };

          console.log('✅ [HYBRID_SAVE] 하이브리드 저장 완료:', {
            successfulCount: successful.length,
            failedCount: failed.length,
          });

          return result;
        } catch (saveError) {
          console.error('❌ [HYBRID_SAVE] 하이브리드 저장 실패:', {
            error: saveError,
          });

          return {
            successful: [],
            failed: files.map((file) => ({
              file,
              error:
                saveError instanceof Error
                  ? saveError.message
                  : String(saveError),
            })),
            totalProcessed: files.length,
          };
        }
      },

      loadStoredImages: async (): Promise<void> => {
        console.log('📁 [HYBRID_LOAD] 저장된 이미지 로드 시작');

        try {
          await initializeIfNeeded();
          await loadStoredImagesInternal();
          isInitialized = true; // 🆕 초기화 플래그 업데이트

          console.log('✅ [HYBRID_LOAD] 저장된 이미지 로드 완료');
        } catch (loadError) {
          console.error('❌ [HYBRID_LOAD] 이미지 로드 실패:', {
            error: loadError,
          });
        }
      },

      deleteImageFromHybridStorage: async (imageId: string): Promise<void> => {
        console.log('🗑️ [HYBRID_DELETE] 이미지 삭제 시작:', { imageId });

        try {
          await initializeIfNeeded();
          const storage = getHybridStorage();
          await storage.deleteImageFromHybridStorage(imageId);

          // 🔧 Zustand 상태에서도 제거 (selectedImageIds 중심)
          set((state) => {
            const { imageViewConfig } = state;
            const {
              selectedImageIds = [],
              imageMetadata = [],
              selectedImages = [],
            } = imageViewConfig;

            const imageIndex = selectedImageIds.indexOf(imageId);

            // ID 중심으로 제거
            const updatedSelectedImageIds = selectedImageIds.filter(
              (id) => id !== imageId
            );
            const updatedImageMetadata = imageMetadata.filter(
              (metadata) => metadata.id !== imageId
            );

            // 인덱스 기반으로 selectedImages도 제거
            const updatedSelectedImages = selectedImages.filter(
              (_, index) => index !== imageIndex
            );

            return {
              imageViewConfig: {
                ...imageViewConfig,
                selectedImageIds: updatedSelectedImageIds,
                imageMetadata: updatedImageMetadata,
                selectedImages: updatedSelectedImages,
              },
              lastSyncTimestamp: new Date(),
            };
          });

          console.log('✅ [HYBRID_DELETE] 이미지 삭제 완료:', { imageId });
        } catch (deleteError) {
          console.error('❌ [HYBRID_DELETE] 이미지 삭제 실패:', {
            imageId,
            error: deleteError,
          });
          throw deleteError;
        }
      },
    };
  }, createHybridPersistConfig('image-gallery-hybrid', 'local'))
);

// 🔄 하위 호환성을 위한 기존 스토어 export
export const useImageGalleryStore = useHybridImageGalleryStore;

// 🔄 기본 export (하위 호환성)
export default useHybridImageGalleryStore;
