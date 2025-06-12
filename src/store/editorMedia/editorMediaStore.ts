import { create } from 'zustand';
import {
  initialEditorMediaState,
  type EditorMediaState,
  type MediaData,
} from './initialEditorMediaState';
import { indexedDBAdapter } from './indexedDBAdapter';

interface EditorMediaStore extends EditorMediaState {
  saveImage: (
    paragraphId: string,
    base64Data: string,
    filename: string,
    type: string
  ) => Promise<string>;
  getImage: (imageId: string) => Promise<string | null>;
  deleteImage: (imageId: string) => Promise<void>;
  deleteImagesByParagraph: (paragraphId: string) => Promise<void>;
  cleanup: () => Promise<void>;
  addToCache: (imageId: string, base64Data: string) => void;
  removeFromCache: (imageId: string) => void;
  clearCache: () => void;
  setUploadingImage: (imageId: string) => void;
  removeUploadingImage: (imageId: string) => void;
  setFailedImage: (imageId: string) => void;
  removeFailedImage: (imageId: string) => void;
  clearFailedImages: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
};

export const useEditorMediaStore = create<EditorMediaStore>()((set, get) => ({
  ...initialEditorMediaState,

  saveImage: async (
    paragraphId: string,
    base64Data: string,
    filename: string,
    type: string
  ) => {
    const imageId = `img_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      set((state) => ({
        uploadingImages: [...state.uploadingImages, imageId],
      }));

      const mediaData: MediaData = {
        id: imageId,
        paragraphId,
        base64Data,
        metadata: {
          filename,
          size: base64Data.length,
          type,
          uploadedAt: new Date(),
        },
      };

      await indexedDBAdapter.saveImage(mediaData);

      get().addToCache(imageId, base64Data);
      get().removeUploadingImage(imageId);
      get().removeFailedImage(imageId);

      return imageId;
    } catch (error) {
      get().removeUploadingImage(imageId);
      get().setFailedImage(imageId);
      throw error;
    }
  },

  getImage: async (imageId: string) => {
    const cached = get().imageCache.get(imageId);
    if (cached) {
      return cached;
    }

    try {
      const mediaData = await indexedDBAdapter.getImage(imageId);
      if (mediaData) {
        get().addToCache(imageId, mediaData.base64Data);
        return mediaData.base64Data;
      }
      return null;
    } catch (error) {
      get().setFailedImage(imageId);
      return null;
    }
  },

  deleteImage: async (imageId: string) => {
    try {
      await indexedDBAdapter.deleteImage(imageId);
      get().removeFromCache(imageId);
      get().removeFailedImage(imageId);
    } catch (error) {
      throw error;
    }
  },

  deleteImagesByParagraph: async (paragraphId: string) => {
    try {
      await indexedDBAdapter.deleteImagesByParagraph(paragraphId);

      const { imageCache } = get();
      const newCache = new Map(imageCache);

      const images = await indexedDBAdapter.getImagesByParagraph(paragraphId);
      images.forEach((image) => {
        newCache.delete(image.id);
      });

      set({ imageCache: newCache });
    } catch (error) {
      throw error;
    }
  },

  cleanup: async () => {
    try {
      await indexedDBAdapter.cleanup();
      set({ imageCache: new Map() });
    } catch (error) {
      throw error;
    }
  },

  addToCache: (imageId: string, base64Data: string) =>
    set((state) => {
      const newCache = new Map(state.imageCache);
      newCache.set(imageId, base64Data);
      return { imageCache: newCache };
    }),

  removeFromCache: (imageId: string) =>
    set((state) => {
      const newCache = new Map(state.imageCache);
      newCache.delete(imageId);
      return { imageCache: newCache };
    }),

  clearCache: () => set({ imageCache: new Map() }),

  setUploadingImage: (imageId: string) =>
    set((state) => ({
      uploadingImages: [...state.uploadingImages, imageId],
    })),

  removeUploadingImage: (imageId: string) =>
    set((state) => ({
      uploadingImages: state.uploadingImages.filter((id) => id !== imageId),
    })),

  setFailedImage: (imageId: string) =>
    set((state) => ({
      failedImages: [...state.failedImages, imageId],
    })),

  removeFailedImage: (imageId: string) =>
    set((state) => ({
      failedImages: state.failedImages.filter((id) => id !== imageId),
    })),

  clearFailedImages: () => set({ failedImages: [] }),
}));
