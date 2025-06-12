import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageViewConfig, CustomGalleryView } from '../shared/commonTypes';
import {
  initialImageGalleryState,
  type ImageGalleryState,
} from './initialImageGalleryState';
import type { ImageGalleryGetters } from './getterImageGallery';
import type { ImageGallerySetters } from './setterImageGallery';
import { createPersistConfig } from '../shared/persistConfig';

type ImageGalleryStore = ImageGalleryState &
  ImageGalleryGetters &
  ImageGallerySetters;

export const useImageGalleryStore = create<ImageGalleryStore>()(
  persist(
    (set, get) => ({
      ...initialImageGalleryState,

      getImageViewConfig: () => get().imageViewConfig,
      setImageViewConfig: (imageViewConfig: ImageViewConfig) =>
        set({ imageViewConfig }),

      getCustomGalleryViews: () => get().customGalleryViews,
      setCustomGalleryViews: (customGalleryViews: CustomGalleryView[]) =>
        set({ customGalleryViews }),

      getIsPreviewPanelOpen: () => get().isPreviewPanelOpen,
      setIsPreviewPanelOpen: (isPreviewPanelOpen: boolean) =>
        set({ isPreviewPanelOpen }),

      getCustomGalleryViewById: (id: string) =>
        get().customGalleryViews.find((view) => view.id === id),

      getSelectedImagesCount: () => get().imageViewConfig.selectedImages.length,

      getClickOrderedImages: () => {
        const { imageViewConfig } = get();
        return imageViewConfig.clickOrder
          .map((index) => imageViewConfig.selectedImages[index])
          .filter(Boolean);
      },

      addCustomGalleryView: (view: CustomGalleryView) =>
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
        updates: Partial<CustomGalleryView>
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

      updateImageViewConfig: (config: Partial<ImageViewConfig>) =>
        set((state) => ({
          imageViewConfig: { ...state.imageViewConfig, ...config },
        })),

      togglePreviewPanel: () =>
        set((state) => ({
          isPreviewPanelOpen: !state.isPreviewPanelOpen,
        })),

      resetImageGalleryState: () => set(initialImageGalleryState),
    }),
    {
      ...createPersistConfig('image-gallery-storage', 'local'),
      partialize: (state) => ({
        imageViewConfig: state.imageViewConfig,
        customGalleryViews: state.customGalleryViews,
      }),
    }
  )
);
