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

type ReactHookFormSyncCallback = (images: string[]) => void;

type HybridImageGalleryStore = HybridImageGalleryState &
  ImageGalleryGetters &
  ImageGallerySetters & {
    _isInitialized: boolean;
    _initializationPromise: Promise<void> | null;
    _reactHookFormSyncCallback: ReactHookFormSyncCallback | null;
    _syncToReactHookForm: () => void;
    _isInternalUpdate: boolean;
    setReactHookFormSyncCallback: (
      callback: ReactHookFormSyncCallback | null
    ) => void;
    saveImageToHybridStorage: (
      files: File[]
    ) => Promise<HybridImageProcessResult>;
    loadStoredImages: () => Promise<void>;
    deleteImageFromHybridStorage: (imageId: string) => Promise<void>;
    initializeStoredImages: () => Promise<void>;
    getIsInitialized: () => boolean;
    _triggerAutoInitialization: () => void;
  };

export const useHybridImageGalleryStore = create<HybridImageGalleryStore>()(
  persist(
    (set, get) => {
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
        console.log('🔧 [HYBRID_STORAGE] 하이브리드 스토리지 초기화됨');
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

      const syncToReactHookFormInternal = () => {
        try {
          const currentState = get();
          const {
            _reactHookFormSyncCallback,
            imageViewConfig,
            _isInternalUpdate,
          } = currentState;

          if (!_reactHookFormSyncCallback) {
            console.log(
              'ℹ️ [REACT_HOOK_FORM_SYNC] 동기화 콜백이 설정되지 않음'
            );
            return;
          }

          if (_isInternalUpdate) {
            console.log(
              '🔄 [REACT_HOOK_FORM_SYNC] 내부 업데이트 중이므로 동기화 생략'
            );
            return;
          }

          const { selectedImages = [] } = imageViewConfig;

          console.log(
            '🔄 [REACT_HOOK_FORM_SYNC] React Hook Form 동기화 시작:',
            {
              selectedImagesCount: selectedImages.length,
              firstImagePreview:
                selectedImages.length > 0
                  ? selectedImages[0]?.slice(0, 30) + '...'
                  : 'none',
              timestamp: new Date().toLocaleTimeString(),
            }
          );

          _reactHookFormSyncCallback(selectedImages);

          console.log('✅ [REACT_HOOK_FORM_SYNC] React Hook Form 동기화 완료');
        } catch (syncError) {
          console.error('❌ [REACT_HOOK_FORM_SYNC] 동기화 실패:', {
            error: syncError,
          });
        }
      };

      // 🚨 Race Condition 수정: 안전한 동기화 함수
      const safeAsyncSync = (shouldSync: boolean) => {
        if (!shouldSync) {
          return;
        }

        // 🔧 상태 업데이트 완료 후 동기화 실행
        setTimeout(() => {
          try {
            syncToReactHookFormInternal();
          } catch (syncError) {
            console.error('❌ [SAFE_SYNC] 지연 동기화 실패:', {
              error: syncError,
            });
          }
        }, 0);
      };

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
            ({ imageUrl }) => imageUrl
          );
          const restoredMetadata = successfulResults.map(
            ({ metadata }) => metadata
          );

          console.log('✅ [LOAD_INTERNAL] 이미지 복원 완료:', {
            restoredCount: restoredImageUrls.length,
            metadataCount: restoredMetadata.length,
          });

          // 🚨 Race Condition 수정: 상태 업데이트와 동기화 분리
          set((state) => ({
            ...state,
            imageViewConfig: {
              ...state.imageViewConfig,
              selectedImageIds: restoredMetadata.map(({ id }) => id),
              imageMetadata: restoredMetadata,
              selectedImages: restoredImageUrls,
            },
            lastSyncTimestamp: new Date(),
            _isInitialized: true,
          }));

          // 상태 업데이트 완료 후 동기화
          safeAsyncSync(true);
        } catch (loadError) {
          console.error('❌ [LOAD_INTERNAL] 이미지 로드 실패:', {
            error: loadError,
          });

          set((state) => ({
            ...state,
            _isInitialized: true,
          }));
        }
      };

      const performAutoInitialization = async (): Promise<void> => {
        const currentState = get();
        const { _isInitialized } = currentState;

        if (_isInitialized) {
          console.log('ℹ️ [AUTO_INIT] 이미 초기화됨');
          safeAsyncSync(true);
          return;
        }

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

      const updateImageViewConfigInternal = (
        config: Partial<HybridImageViewConfig>,
        shouldSync: boolean = true
      ) => {
        set((state) => ({
          ...state,
          imageViewConfig: { ...state.imageViewConfig, ...config },
        }));

        // 상태 업데이트 완료 후 동기화
        safeAsyncSync(shouldSync);
      };

      return {
        ...createInitialHybridImageGalleryState(),

        _reactHookFormSyncCallback: null,
        _syncToReactHookForm: syncToReactHookFormInternal,
        _isInternalUpdate: false,

        setReactHookFormSyncCallback: (
          callback: ReactHookFormSyncCallback | null
        ) => {
          console.log('🔧 [CALLBACK_SET] React Hook Form 동기화 콜백 설정:', {
            hasCallback: callback !== null,
          });

          set((state) => ({
            ...state,
            _reactHookFormSyncCallback: callback,
          }));

          const hasValidCallback = callback !== null;
          if (hasValidCallback) {
            safeAsyncSync(true);
          }
        },

        getImageViewConfig: () => get().imageViewConfig,

        setImageViewConfig: (imageViewConfig: HybridImageViewConfig) => {
          updateImageViewConfigInternal(imageViewConfig, true);
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

        getIsInitialized: () => get()._isInitialized,
        setIsInitialized: (isInitialized: boolean) =>
          set({ _isInitialized: isInitialized }),

        getInitializationPromise: () => get()._initializationPromise,
        setInitializationPromise: (promise: Promise<void> | null) =>
          set({ _initializationPromise: promise }),

        get_isInitialized: () => get()._isInitialized,
        set_isInitialized: (isInitialized: boolean) =>
          set({ _isInitialized: isInitialized }),

        get_initializationPromise: () => get()._initializationPromise,
        set_initializationPromise: (promise: Promise<void> | null) =>
          set({ _initializationPromise: promise }),

        getCustomGalleryViewById: (id: string) => {
          const { customGalleryViews } = get();
          return customGalleryViews.find(({ id: viewId }) => viewId === id);
        },

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
            .filter(
              (imageUrl): imageUrl is string =>
                imageUrl !== undefined &&
                imageUrl !== null &&
                imageUrl.length > 0
            );
        },

        getSelectedImageIds: () => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          const { selectedImageIds = [] } = state.imageViewConfig;
          return selectedImageIds;
        },

        getImageMetadata: () => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          const { imageMetadata = [] } = state.imageViewConfig;
          return imageMetadata;
        },

        getImageMetadataById: (imageId: string) => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          const { imageMetadata = [] } = state.imageViewConfig;
          return imageMetadata.find(({ id }) => id === imageId);
        },

        getHybridImageViewConfig: () => {
          const state = get();

          if (!state._isInitialized) {
            state._triggerAutoInitialization();
          }

          return state.imageViewConfig;
        },

        _triggerAutoInitialization: () => {
          Promise.resolve().then(() => {
            performAutoInitialization();
          });
        },

        initializeStoredImages: async (): Promise<void> => {
          return performAutoInitialization();
        },

        addCustomGalleryView: (view: HybridCustomGalleryView) =>
          set((state) => {
            const { customGalleryViews } = state;
            const exists = customGalleryViews.some(({ id }) => id === view.id);

            if (exists) {
              throw new Error(
                `Custom gallery view with id ${view.id} already exists`
              );
            }

            return {
              customGalleryViews: [...customGalleryViews, view],
            };
          }),

        removeCustomGalleryView: (id: string) =>
          set((state) => {
            const { customGalleryViews } = state;
            const exists = customGalleryViews.some(
              ({ id: viewId }) => viewId === id
            );

            if (!exists) {
              throw new Error(`Custom gallery view with id ${id} not found`);
            }

            return {
              customGalleryViews: customGalleryViews.filter(
                ({ id: viewId }) => viewId !== id
              ),
            };
          }),

        updateCustomGalleryView: (
          id: string,
          updates: Partial<HybridCustomGalleryView>
        ) =>
          set((state) => {
            const { customGalleryViews } = state;
            const viewIndex = customGalleryViews.findIndex(
              ({ id: viewId }) => viewId === id
            );

            if (viewIndex === -1) {
              throw new Error(`Custom gallery view with id ${id} not found`);
            }

            const newViews = [...customGalleryViews];
            newViews[viewIndex] = { ...newViews[viewIndex], ...updates };

            return {
              customGalleryViews: newViews,
            };
          }),

        clearCustomGalleryViews: () => set({ customGalleryViews: [] }),

        updateImageViewConfig: (config: Partial<HybridImageViewConfig>) => {
          updateImageViewConfigInternal(config, true);
        },

        togglePreviewPanel: () =>
          set((state) => ({
            isPreviewPanelOpen: !state.isPreviewPanelOpen,
          })),

        resetImageGalleryState: () => {
          set({
            ...createInitialHybridImageGalleryState(),
            _isInitialized: false,
            _initializationPromise: null,
          });

          safeAsyncSync(true);
        },

        setSelectedImageIds: (imageIds: string[]) => {
          set((state) => ({
            ...state,
            imageViewConfig: {
              ...state.imageViewConfig,
              selectedImageIds: imageIds,
            },
          }));
        },

        addSelectedImageId: (imageId: string) =>
          set((state) => {
            const { imageViewConfig } = state;
            const { selectedImageIds = [] } = imageViewConfig;
            const isDuplicate = selectedImageIds.includes(imageId);

            if (isDuplicate) {
              return state;
            }

            return {
              ...state,
              imageViewConfig: {
                ...imageViewConfig,
                selectedImageIds: [...selectedImageIds, imageId],
              },
            };
          }),

        removeSelectedImageId: (imageId: string) =>
          set((state) => {
            const { imageViewConfig } = state;
            const { selectedImageIds = [] } = imageViewConfig;

            return {
              ...state,
              imageViewConfig: {
                ...imageViewConfig,
                selectedImageIds: selectedImageIds.filter(
                  (id) => id !== imageId
                ),
              },
            };
          }),

        setImageMetadata: (metadata: ImageGalleryMetadata[]) =>
          set((state) => ({
            ...state,
            imageViewConfig: {
              ...state.imageViewConfig,
              imageMetadata: metadata,
            },
          })),

        addImageMetadata: (metadata: ImageGalleryMetadata) =>
          set((state) => {
            const { imageViewConfig } = state;
            const { imageMetadata = [] } = imageViewConfig;
            const isDuplicate = imageMetadata.some(
              ({ id }) => id === metadata.id
            );

            if (isDuplicate) {
              return state;
            }

            return {
              ...state,
              imageViewConfig: {
                ...imageViewConfig,
                imageMetadata: [...imageMetadata, metadata],
              },
            };
          }),

        removeImageMetadata: (imageId: string) =>
          set((state) => {
            const { imageViewConfig } = state;
            const { imageMetadata = [] } = imageViewConfig;

            return {
              ...state,
              imageViewConfig: {
                ...imageViewConfig,
                imageMetadata: imageMetadata.filter(({ id }) => id !== imageId),
              },
            };
          }),

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

            const hasSuccessfulResults = successful.length > 0;
            if (hasSuccessfulResults) {
              // 🚨 Race Condition 수정: 상태 업데이트와 동기화 분리
              set((state) => {
                const { imageViewConfig } = state;
                const {
                  selectedImageIds = [],
                  imageMetadata = [],
                  selectedImages = [],
                } = imageViewConfig;

                const newSelectedImageIds = [
                  ...selectedImageIds,
                  ...successful.map(({ metadata }) => metadata.id),
                ];

                const newImageMetadata = [
                  ...imageMetadata,
                  ...successful.map(({ metadata }) => metadata),
                ];

                const newSelectedImages = [
                  ...selectedImages,
                  ...successful.map(({ imageUrl }) => imageUrl),
                ];

                return {
                  ...state,
                  imageViewConfig: {
                    ...imageViewConfig,
                    selectedImageIds: newSelectedImageIds,
                    imageMetadata: newImageMetadata,
                    selectedImages: newSelectedImages,
                  },
                  lastSyncTimestamp: new Date(),
                  _isInitialized: true,
                };
              });

              // 상태 업데이트 완료 후 동기화
              safeAsyncSync(true);
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

            // 🚨 Race Condition 수정: 상태 업데이트와 동기화 분리
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
                ({ id }) => id !== imageId
              );

              const updatedSelectedImages = selectedImages.filter(
                (_, index) => index !== imageIndex
              );

              return {
                ...state,
                imageViewConfig: {
                  ...imageViewConfig,
                  selectedImageIds: updatedSelectedImageIds,
                  imageMetadata: updatedImageMetadata,
                  selectedImages: updatedSelectedImages,
                },
                lastSyncTimestamp: new Date(),
              };
            });

            // 상태 업데이트 완료 후 동기화
            safeAsyncSync(true);

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

      partialize: (state) => ({
        imageViewConfig: state.imageViewConfig,
        customGalleryViews: state.customGalleryViews,
        isPreviewPanelOpen: state.isPreviewPanelOpen,
        isHybridMode: state.isHybridMode,
        lastSyncTimestamp: state.lastSyncTimestamp,
        _isInitialized: state._isInitialized,
      }),
    }
  )
);

export const useImageGalleryStore = useHybridImageGalleryStore;
export default useHybridImageGalleryStore;
