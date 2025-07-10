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

// 🆕 초기화 상태를 포함한 확장된 스토어 타입
type HybridImageGalleryStore = HybridImageGalleryState &
  ImageGalleryGetters &
  ImageGallerySetters & {
    // 🆕 초기화 상태 추가 (persist됨)
    _isInitialized: boolean;
    _initializationPromise: Promise<void> | null;

    // 🆕 핵심 하이브리드 메서드들
    saveImageToHybridStorage: (
      files: File[]
    ) => Promise<HybridImageProcessResult>;
    loadStoredImages: () => Promise<void>;
    deleteImageFromHybridStorage: (imageId: string) => Promise<void>;

    // 🆕 동기화된 초기화 메서드들
    initializeStoredImages: () => Promise<void>;
    getIsInitialized: () => boolean;
    _triggerAutoInitialization: () => void;
  };

// 🆕 하이브리드 Zustand 스토어 (리프레시 문제 해결)
export const useHybridImageGalleryStore = create<HybridImageGalleryStore>()(
  persist(
    (set, get) => {
      // 🔧 HybridStorage 인스턴스 관리 (클로저)
      let hybridStorage: ImageGalleryHybridStorage | null = null;
      let currentInitializationPromise: Promise<void> | null = null;

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

      // 🆕 내부 이미지 로드 함수 (selectedImages 복원)
      const loadStoredImagesInternal = async (): Promise<void> => {
        try {
          const storage = getHybridStorage();
          const allMetadata = await storage.getAllImageMetadata();

          console.log('📁 [LOAD_INTERNAL] 메타데이터 로드:', {
            metadataCount: allMetadata.length,
          });

          const hasStoredMetadata = allMetadata.length > 0;
          if (!hasStoredMetadata) {
            console.log('ℹ️ [LOAD_INTERNAL] 저장된 메타데이터 없음');
            return;
          }

          // IndexedDB에서 실제 이미지 URL 복원
          const loadPromises = allMetadata.map(async (metadata) => {
            try {
              const imageUrl = await storage.loadImageFromHybridStorage(
                metadata.id
              );
              return { imageUrl, metadata };
            } catch (loadError) {
              console.error('❌ [LOAD_INTERNAL] 개별 이미지 로드 실패:', {
                metadataId: metadata.id,
                error: loadError,
              });
              return null;
            }
          });

          const loadResults = await Promise.allSettled(loadPromises);
          const successfulResults = loadResults
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
            .filter(
              (
                item
              ): item is { imageUrl: string; metadata: ImageGalleryMetadata } =>
                item !== null
            );

          const restoredImageUrls = successfulResults.map(
            (item) => item.imageUrl
          );
          const restoredMetadata = successfulResults.map(
            (item) => item.metadata
          );

          console.log('✅ [LOAD_INTERNAL] 이미지 복원 완료:', {
            restoredCount: restoredImageUrls.length,
            metadataCount: restoredMetadata.length,
          });

          // 🔧 상태 업데이트 (selectedImages 복원)
          set((state) => ({
            imageViewConfig: {
              ...state.imageViewConfig,
              selectedImageIds: restoredMetadata.map((metadata) => metadata.id),
              imageMetadata: restoredMetadata,
              selectedImages: restoredImageUrls, // 🚨 핵심: 실제 이미지 URL 복원
            },
            lastSyncTimestamp: new Date(),
            _isInitialized: true, // 🆕 초기화 완료 플래그
          }));
        } catch (loadError) {
          console.error('❌ [LOAD_INTERNAL] 이미지 로드 실패:', {
            error: loadError,
          });

          // 실패 시에도 초기화 완료로 표시 (무한 루프 방지)
          set((state) => ({
            ...state,
            _isInitialized: true,
          }));
        }
      };

      // 🆕 자동 초기화 함수 (Promise 관리)
      const performAutoInitialization = async (): Promise<void> => {
        const { _isInitialized } = get();

        if (_isInitialized) {
          console.log('ℹ️ [AUTO_INIT] 이미 초기화됨');
          return;
        }

        // 🔧 이미 진행 중인 초기화가 있다면 기다림
        if (currentInitializationPromise) {
          console.log('⏳ [AUTO_INIT] 기존 초기화 대기 중');
          return currentInitializationPromise;
        }

        console.log('🔄 [AUTO_INIT] 자동 초기화 시작');

        currentInitializationPromise = (async () => {
          try {
            await initializeIfNeeded();
            await loadStoredImagesInternal();

            console.log('✅ [AUTO_INIT] 자동 초기화 완료');
          } catch (autoInitError) {
            console.error('❌ [AUTO_INIT] 자동 초기화 실패:', {
              error: autoInitError,
            });

            // 실패해도 초기화 완료로 표시
            set((state) => ({
              ...state,
              _isInitialized: true,
            }));
          } finally {
            currentInitializationPromise = null;
          }
        })();

        set((state) => ({
          ...state,
          _initializationPromise: currentInitializationPromise,
        }));

        return currentInitializationPromise;
      };

      return {
        ...createInitialHybridImageGalleryState(),

        // 🔄 기본 속성 getter/setter 메서드들
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

        getIsHybridMode: () => get().isHybridMode,
        setIsHybridMode: (isHybridMode: boolean) => set({ isHybridMode }),

        getLastSyncTimestamp: () => get().lastSyncTimestamp,
        setLastSyncTimestamp: (timestamp: Date | null) =>
          set({ lastSyncTimestamp: timestamp }),

        // 🆕 초기화 관련 getter/setter 메서드들
        getIsInitialized: () => get()._isInitialized,
        setIsInitialized: (isInitialized: boolean) =>
          set({ _isInitialized: isInitialized }),

        getInitializationPromise: () => get()._initializationPromise,
        setInitializationPromise: (promise: Promise<void> | null) =>
          set({ _initializationPromise: promise }),

        // 🆕 내부 속성 getter/setter 메서드들 (DynamicStoreMethods 호환)
        get_isInitialized: () => get()._isInitialized,
        set_isInitialized: (isInitialized: boolean) =>
          set({ _isInitialized: isInitialized }),

        get_initializationPromise: () => get()._initializationPromise,
        set_initializationPromise: (promise: Promise<void> | null) =>
          set({ _initializationPromise: promise }),

        // 🔄 기존 핵심 메서드들
        getCustomGalleryViewById: (id: string) =>
          get().customGalleryViews.find((view) => view.id === id),

        getSelectedImagesCount: () => {
          const { imageViewConfig } = get();
          const { selectedImageIds = [] } = imageViewConfig;
          return selectedImageIds.length;
        },

        getClickOrderedImages: () => {
          const { imageViewConfig } = get();
          const { selectedImages = [], clickOrder = [] } = imageViewConfig;
          return clickOrder
            .map((index) => selectedImages[index])
            .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
        },

        // 🆕 개선된 getter 메서드들 (자동 초기화 트리거)
        getSelectedImageIds: () => {
          const state = get();

          // 🔧 초기화되지 않았으면 트리거 (비동기)
          if (!state._isInitialized) {
            // 비동기 초기화를 트리거하지만 즉시 반환
            state._triggerAutoInitialization();
          }

          return state.imageViewConfig.selectedImageIds || [];
        },

        getImageMetadata: () => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          return state.imageViewConfig.imageMetadata || [];
        },

        getImageMetadataById: (imageId: string) => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          const { imageMetadata = [] } = state.imageViewConfig;
          return imageMetadata.find((metadata) => metadata.id === imageId);
        },

        getHybridImageViewConfig: () => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          return state.imageViewConfig;
        },

        // 🆕 자동 초기화 트리거 메서드
        _triggerAutoInitialization: () => {
          // 🔧 별도 태스크로 초기화 실행 (getter 블로킹 방지)
          Promise.resolve().then(() => {
            performAutoInitialization();
          });
        },

        initializeStoredImages: async (): Promise<void> => {
          return performAutoInitialization();
        },

        // 🔄 커스텀뷰 메서드들 (간소화)
        addCustomGalleryView: (view: HybridCustomGalleryView) =>
          set((state) => {
            const exists = state.customGalleryViews.some(
              (v) => v.id === view.id
            );
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

        resetImageGalleryState: () =>
          set({
            ...createInitialHybridImageGalleryState(),
            _isInitialized: false,
            _initializationPromise: null,
          }),

        // 🆕 하이브리드 setter 메서드들
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
                selectedImageIds: selectedImageIds.filter(
                  (id) => id !== imageId
                ),
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

        // 🆕 하이브리드 핵심 메서드들
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

            // 🔧 성공한 이미지들을 상태에 추가
            const hasSuccessfulResults = successful.length > 0;
            if (hasSuccessfulResults) {
              set((state) => {
                const { imageViewConfig } = state;
                const {
                  selectedImageIds = [],
                  imageMetadata = [],
                  selectedImages = [],
                } = imageViewConfig;

                const newSelectedImageIds = [
                  ...selectedImageIds,
                  ...successful.map((data) => data.metadata.id),
                ];

                const newImageMetadata = [
                  ...imageMetadata,
                  ...successful.map((data) => data.metadata),
                ];

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
                  _isInitialized: true, // 저장 후 초기화 완료
                };
              });
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
          return performAutoInitialization();
        },

        deleteImageFromHybridStorage: async (
          imageId: string
        ): Promise<void> => {
          console.log('🗑️ [HYBRID_DELETE] 이미지 삭제 시작:', { imageId });

          try {
            await initializeIfNeeded();
            const storage = getHybridStorage();
            await storage.deleteImageFromHybridStorage(imageId);

            // 상태에서도 제거
            set((state) => {
              const { imageViewConfig } = state;
              const {
                selectedImageIds = [],
                imageMetadata = [],
                selectedImages = [],
              } = imageViewConfig;

              const imageIndex = selectedImageIds.indexOf(imageId);

              const updatedSelectedImageIds = selectedImageIds.filter(
                (id) => id !== imageId
              );
              const updatedImageMetadata = imageMetadata.filter(
                (metadata) => metadata.id !== imageId
              );

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
    },
    {
      ...createHybridPersistConfig('image-gallery-hybrid', 'local'),

      // 🆕 모든 필요한 속성들을 persist에 포함
      partialize: (state) => ({
        imageViewConfig: state.imageViewConfig,
        customGalleryViews: state.customGalleryViews,
        isPreviewPanelOpen: state.isPreviewPanelOpen,
        isHybridMode: state.isHybridMode,
        lastSyncTimestamp: state.lastSyncTimestamp,
        _isInitialized: state._isInitialized, // 🚨 초기화 상태도 저장
      }),
    }
  )
);

// 🔄 하위 호환성을 위한 기존 스토어 export
export const useImageGalleryStore = useHybridImageGalleryStore;
export default useHybridImageGalleryStore;
