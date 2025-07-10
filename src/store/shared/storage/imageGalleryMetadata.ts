// 📁 store/shared/storage/imageGalleryMetadata.ts

export interface ImageGalleryMetadata {
  readonly id: string;
  readonly originalFileName: string;
  readonly indexedDBKey: string;
  readonly originalDataUrl: string;
  readonly fileSize: number;
  readonly createdAt: Date;
}

export interface ImageGalleryHybridData {
  readonly metadata: ImageGalleryMetadata;
  readonly binaryKey: string;
  readonly localStorageKey: string;
}

// 🔧 간소화된 압축 옵션 (필수 기능만)
export interface ImageGalleryCompressionOptions {
  readonly quality: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
  readonly format: 'webp' | 'jpeg' | 'png';
  readonly enableThumbnail: boolean;
}

// 🔧 간소화된 스토리지 설정 (핵심 기능만)
export interface ImageGalleryStorageConfig {
  readonly dbName: string;
  readonly dbVersion: number;
  readonly storeName: string;
  readonly compressionOptions: ImageGalleryCompressionOptions;
}

export const createDefaultImageGalleryStorageConfig =
  (): ImageGalleryStorageConfig => {
    console.log('🔧 [STORAGE_CONFIG] 기본 이미지 갤러리 스토리지 설정 생성');

    return {
      dbName: 'ImageGalleryHybridDB',
      dbVersion: 1,
      storeName: 'imageGalleryBinaryStore',
      compressionOptions: {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp',
        enableThumbnail: false, // 간소화: 썸네일 비활성화
      },
    };
  };

export const generateImageGalleryMetadataId = (fileName: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  const generatedId = `img_${timestamp}_${cleanFileName}_${randomSuffix}`;

  console.log('🆔 [ID_GENERATION] 메타데이터 ID 생성:', {
    originalFileName: fileName,
    generatedId,
  });

  return generatedId;
};

export const generateImageGalleryIndexedDBKey = (
  metadataId: string
): string => {
  const indexedDBKey = `binary_${metadataId}`;
  console.log('🔑 [KEY_GENERATION] IndexedDB 키 생성:', { indexedDBKey });
  return indexedDBKey;
};
