export interface ImageViewConfig {
  id: string;
  layout: string;
  columns: number;
  spacing: number;
  borderRadius: number;
  showTitles: boolean;
}

export interface CustomGalleryView {
  id: string;
  name: string;
  config: ImageViewConfig;
  images: string[];
  createdAt: Date;
}

export interface GalleryViewCRUDActions {
  add: (view: CustomGalleryView) => void;
  remove: (id: string) => void;
  update: (id: string, updates: Partial<CustomGalleryView>) => void;
  clear: () => void;
}

export const createDefaultImageViewConfig = (): ImageViewConfig => ({
  id: '',
  layout: 'grid',
  columns: 3,
  spacing: 8,
  borderRadius: 4,
  showTitles: true,
});
