// 📁 store/shared/storage/imageGalleryHybridStorage.ts

import type {
  ImageGalleryMetadata,
  ImageGalleryHybridData,
  ImageGalleryStorageConfig,
} from './imageGalleryMetadata';
import type { ImageGalleryCompressionResult } from './imageGalleryCompression';

export interface ImageGalleryLocalStorageData {
  readonly version: string;
  readonly imageMetadataList: ImageGalleryMetadata[];
  readonly lastUpdated: string;
}

export interface ImageGalleryHybridStorageOptions {
  readonly enableCompression: boolean;
  readonly compressionQuality: number;
}

// 타입 가드 함수 추가 (타입 단언 제거)
const isValidImageGalleryLocalStorageData = (
  data: unknown
): data is ImageGalleryLocalStorageData => {
  const isObject = typeof data === 'object' && data !== null;
  if (!isObject) {
    return false;
  }

  // Reflect.get을 사용하여 타입 단언 제거
  const version = Reflect.get(data, 'version');
  const imageMetadataList = Reflect.get(data, 'imageMetadataList');
  const lastUpdated = Reflect.get(data, 'lastUpdated');

  const hasVersion = typeof version === 'string';
  const hasImageMetadataList = Array.isArray(imageMetadataList);
  const hasLastUpdated = typeof lastUpdated === 'string';

  return hasVersion && hasImageMetadataList && hasLastUpdated;
};

// 🔧 간소화된 IndexedDB 직접 연동 (어댑터 제거)
export class ImageGalleryHybridStorage {
  private readonly config: ImageGalleryStorageConfig;
  private readonly localStorageKey: string;
  private readonly options: ImageGalleryHybridStorageOptions;
  private databaseInstance: IDBDatabase | null = null;

  constructor(
    config: ImageGalleryStorageConfig,
    options: ImageGalleryHybridStorageOptions
  ) {
    this.config = config;
    this.localStorageKey = `${config.dbName}_metadata`;
    this.options = options;

    console.log('🔧 [HYBRID_STORAGE] 간소화된 하이브리드 스토리지 생성:', {
      dbName: config.dbName,
      localStorageKey: this.localStorageKey,
      enableCompression: options.enableCompression,
    });
  }

  async initializeHybridStorage(): Promise<void> {
    console.log('🚀 [HYBRID_INIT] 하이브리드 스토리지 초기화');

    try {
      await this.initializeIndexedDB();
      this.initializeLocalStorageData();
      console.log('✅ [HYBRID_INIT] 하이브리드 스토리지 초기화 완료');
    } catch (initError) {
      console.error('❌ [HYBRID_INIT] 초기화 실패:', { error: initError });
      throw new Error(`Hybrid storage initialization failed: ${initError}`);
    }
  }

  // 🔧 IndexedDB 직접 초기화 (어댑터 없이)
  private async initializeIndexedDB(): Promise<void> {
    const { dbName, dbVersion, storeName } = this.config;

    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(dbName, dbVersion);

      openRequest.onerror = () => {
        const { error } = openRequest;
        const errorMessage = error?.message || 'Unknown error';
        console.error('❌ [INDEXEDDB_INIT] 데이터베이스 열기 실패:', {
          dbName,
          error: errorMessage,
        });
        reject(new Error(`Database open failed: ${errorMessage}`));
      };

      openRequest.onsuccess = () => {
        const { result: database } = openRequest;
        this.databaseInstance = database;
        console.log('✅ [INDEXEDDB_INIT] 데이터베이스 열기 성공:', {
          dbName,
          version: database.version,
        });
        resolve();
      };

      openRequest.onupgradeneeded = () => {
        const { result: database } = openRequest;

        const hasExistingStore = database.objectStoreNames.contains(storeName);
        if (hasExistingStore) {
          database.deleteObjectStore(storeName);
        }

        database.createObjectStore(storeName, {
          keyPath: 'id',
          autoIncrement: false,
        });

        console.log('✅ [INDEXEDDB_INIT] 오브젝트 스토어 생성 완료:', {
          storeName,
        });
      };
    });
  }

  private getLocalStorageData(): ImageGalleryLocalStorageData | null {
    try {
      const storedDataString = localStorage.getItem(this.localStorageKey);
      const hasStoredData = storedDataString !== null;

      if (!hasStoredData) {
        return null;
      }

      const parsedData = JSON.parse(storedDataString);

      // 🔧 타입 가드로 타입 단언 제거
      if (!isValidImageGalleryLocalStorageData(parsedData)) {
        console.error('❌ [LOCAL_STORAGE] 유효하지 않은 메타데이터 형식:', {
          parsedData,
        });
        return null;
      }

      const validatedData = parsedData;
      const { imageMetadataList = [] } = validatedData;

      console.log('📁 [LOCAL_STORAGE] 메타데이터 로드 완료:', {
        imageCount: imageMetadataList.length,
      });

      return validatedData;
    } catch (parseError) {
      console.error('❌ [LOCAL_STORAGE] 메타데이터 파싱 실패:', {
        error: parseError,
      });
      return null;
    }
  }

  private saveLocalStorageData(data: ImageGalleryLocalStorageData): void {
    try {
      const dataString = JSON.stringify(data);
      localStorage.setItem(this.localStorageKey, dataString);

      const { imageMetadataList = [] } = data;
      console.log('✅ [LOCAL_STORAGE] 메타데이터 저장 완료:', {
        imageCount: imageMetadataList.length,
      });
    } catch (saveError) {
      console.error('❌ [LOCAL_STORAGE] 메타데이터 저장 실패:', {
        error: saveError,
      });
      throw new Error(`LocalStorage save failed: ${saveError}`);
    }
  }

  private initializeLocalStorageData(): void {
    const localData = this.getLocalStorageData();
    const hasValidLocalData = localData !== null;

    if (!hasValidLocalData) {
      const initialData: ImageGalleryLocalStorageData = {
        version: '1.0.0',
        imageMetadataList: [],
        lastUpdated: new Date().toISOString(),
      };
      this.saveLocalStorageData(initialData);
    }
  }

  async saveImageToHybridStorage(
    file: File,
    metadataId: string
  ): Promise<ImageGalleryHybridData> {
    console.log('💾 [HYBRID_SAVE] 하이브리드 저장 시작:', {
      fileName: file.name,
      fileSize: file.size,
      metadataId,
    });

    try {
      const { enableCompression, compressionQuality } = this.options;

      // 🔧 간소화된 이미지 처리
      const compressionResult = await this.processImageFile(
        file,
        enableCompression,
        compressionQuality
      );

      // 메타데이터 생성
      const imageMetadata = this.createImageMetadata(
        metadataId,
        file,
        compressionResult
      );

      // IndexedDB에 바이너리 저장 (직접)
      await this.storeToIndexedDB(
        imageMetadata.indexedDBKey,
        compressionResult.compressedBlob
      );

      // LocalStorage에 메타데이터 저장
      await this.addMetadataToLocalStorage(imageMetadata);

      const hybridData: ImageGalleryHybridData = {
        metadata: imageMetadata,
        binaryKey: imageMetadata.indexedDBKey,
        localStorageKey: this.localStorageKey,
      };

      console.log('✅ [HYBRID_SAVE] 하이브리드 저장 완료:', {
        metadataId,
        compressionRatio: `${compressionResult.compressionRatio.toFixed(2)}%`,
      });

      return hybridData;
    } catch (saveError) {
      console.error('❌ [HYBRID_SAVE] 하이브리드 저장 실패:', {
        fileName: file.name,
        metadataId,
        error: saveError,
      });
      throw new Error(`Hybrid save failed: ${file.name}`);
    }
  }

  // 🔧 간소화된 이미지 처리 함수 (압축 기능 내장)
  private async processImageFile(
    file: File,
    enableCompression: boolean,
    compressionQuality: number
  ): Promise<ImageGalleryCompressionResult> {
    console.log('🖼️ [IMAGE_PROCESS] 이미지 처리 시작:', {
      fileName: file.name,
      enableCompression,
      compressionQuality,
    });

    const dimensions = await this.getImageDimensions(file);
    const originalBlob = new Blob([file], { type: file.type });
    const originalDataUrl = await this.convertBlobToDataUrl(originalBlob);

    const shouldCompress = enableCompression === true;
    if (!shouldCompress) {
      console.log('📁 [IMAGE_PROCESS] 압축 없이 원본 사용');
      const thumbnailDataUrl = await this.createThumbnail(originalDataUrl, 150);

      return {
        originalBlob,
        compressedBlob: originalBlob,
        originalDataUrl,
        thumbnailDataUrl,
        compressionRatio: 0,
        originalSize: originalBlob.size,
        compressedSize: originalBlob.size,
        dimensions,
      };
    }

    console.log('🗜️ [IMAGE_PROCESS] 이미지 압축 시작');
    const compressedDataUrl = await this.compressImage(
      originalDataUrl,
      compressionQuality
    );
    const compressedBlob = await this.dataUrlToBlob(compressedDataUrl);
    const thumbnailDataUrl = await this.createThumbnail(originalDataUrl, 150);

    const compressionRatio =
      ((originalBlob.size - compressedBlob.size) / originalBlob.size) * 100;

    console.log('✅ [IMAGE_PROCESS] 이미지 처리 완료:', {
      originalSize: originalBlob.size,
      compressedSize: compressedBlob.size,
      compressionRatio: `${compressionRatio.toFixed(2)}%`,
    });

    return {
      originalBlob,
      compressedBlob,
      originalDataUrl,
      thumbnailDataUrl,
      compressionRatio,
      originalSize: originalBlob.size,
      compressedSize: compressedBlob.size,
      dimensions,
    };
  }

  // 🔧 간소화된 이미지 압축 함수
  private async compressImage(
    dataUrl: string,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      const imageElement = new Image();

      imageElement.onload = () => {
        const { naturalWidth, naturalHeight } = imageElement;

        // 최대 크기 제한 (필요시)
        const maxWidth = 1920;
        const maxHeight = 1080;

        let { width, height } = this.calculateResizedDimensions(
          naturalWidth,
          naturalHeight,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        const hasValidContext = canvasContext !== null;
        if (!hasValidContext) {
          reject(new Error('Canvas context creation failed'));
          return;
        }

        canvasContext.drawImage(imageElement, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(compressedDataUrl);
      };

      imageElement.onerror = () => {
        reject(new Error('Image loading failed for compression'));
      };

      imageElement.src = dataUrl;
    });
  }

  // 🔧 썸네일 생성 함수
  private async createThumbnail(
    dataUrl: string,
    thumbnailSize: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      const imageElement = new Image();

      imageElement.onload = () => {
        const { naturalWidth, naturalHeight } = imageElement;

        const { width, height } = this.calculateResizedDimensions(
          naturalWidth,
          naturalHeight,
          thumbnailSize,
          thumbnailSize
        );

        canvas.width = width;
        canvas.height = height;

        const hasValidContext = canvasContext !== null;
        if (!hasValidContext) {
          reject(new Error('Canvas context creation failed for thumbnail'));
          return;
        }

        canvasContext.drawImage(imageElement, 0, 0, width, height);

        const thumbnailDataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(thumbnailDataUrl);
      };

      imageElement.onerror = () => {
        reject(new Error('Image loading failed for thumbnail'));
      };

      imageElement.src = dataUrl;
    });
  }

  // 🔧 크기 계산 헬퍼 함수
  private calculateResizedDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    let width = originalWidth;
    let height = originalHeight;

    const exceedsMaxWidth = width > maxWidth;
    if (exceedsMaxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    const exceedsMaxHeight = height > maxHeight;
    if (exceedsMaxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  // 🔧 DataURL을 Blob으로 변환
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  }

  async loadImageFromHybridStorage(metadataId: string): Promise<string | null> {
    console.log('📁 [HYBRID_LOAD] 하이브리드 로드 시작:', { metadataId });

    try {
      // LocalStorage에서 메타데이터 조회
      const localData = this.getLocalStorageData();
      const hasLocalData = localData !== null;
      if (!hasLocalData) {
        return null;
      }

      const { imageMetadataList = [] } = localData;
      const targetMetadata = imageMetadataList.find(
        (metadata) => metadata.id === metadataId
      );
      const hasTargetMetadata = targetMetadata !== undefined;
      if (!hasTargetMetadata) {
        return null;
      }

      const { indexedDBKey } = targetMetadata;

      // IndexedDB에서 바이너리 조회 (직접)
      const binaryData = await this.retrieveFromIndexedDB(indexedDBKey);
      const hasBinaryData = binaryData !== null;
      if (!hasBinaryData) {
        return null;
      }

      // Blob을 DataURL로 변환
      const dataUrl = await this.convertBlobToDataUrl(binaryData);

      console.log('✅ [HYBRID_LOAD] 하이브리드 로드 완료:', { metadataId });
      return dataUrl;
    } catch (loadError) {
      console.error('❌ [HYBRID_LOAD] 하이브리드 로드 실패:', {
        metadataId,
        error: loadError,
      });
      return null;
    }
  }

  async deleteImageFromHybridStorage(metadataId: string): Promise<void> {
    console.log('🗑️ [HYBRID_DELETE] 하이브리드 삭제 시작:', { metadataId });

    try {
      // LocalStorage에서 메타데이터 조회 및 제거
      const localData = this.getLocalStorageData();
      const hasLocalData = localData !== null;
      if (!hasLocalData) {
        return;
      }

      const { imageMetadataList = [] } = localData;
      const targetMetadata = imageMetadataList.find(
        (metadata) => metadata.id === metadataId
      );
      const hasTargetMetadata = targetMetadata !== undefined;
      if (!hasTargetMetadata) {
        return;
      }

      const { indexedDBKey } = targetMetadata;

      // IndexedDB에서 바이너리 삭제 (직접)
      await this.deleteFromIndexedDB(indexedDBKey);

      // LocalStorage에서 메타데이터 제거
      const updatedMetadataList = imageMetadataList.filter(
        (metadata) => metadata.id !== metadataId
      );
      const updatedLocalData: ImageGalleryLocalStorageData = {
        ...localData,
        imageMetadataList: updatedMetadataList,
        lastUpdated: new Date().toISOString(),
      };

      this.saveLocalStorageData(updatedLocalData);

      console.log('✅ [HYBRID_DELETE] 하이브리드 삭제 완료:', { metadataId });
    } catch (deleteError) {
      console.error('❌ [HYBRID_DELETE] 하이브리드 삭제 실패:', {
        metadataId,
        error: deleteError,
      });
      throw new Error(`Hybrid delete failed: ${metadataId}`);
    }
  }

  async getAllImageMetadata(): Promise<ImageGalleryMetadata[]> {
    const localData = this.getLocalStorageData();
    const hasLocalData = localData !== null;
    if (!hasLocalData) {
      return [];
    }

    const { imageMetadataList = [] } = localData;
    return imageMetadataList;
  }

  // 🔧 IndexedDB 직접 저장 (non-null assertion 제거)
  private async storeToIndexedDB(
    binaryKey: string,
    binaryData: Blob
  ): Promise<void> {
    const { databaseInstance } = this;
    const hasDatabase =
      databaseInstance !== null && databaseInstance !== undefined;

    if (!hasDatabase) {
      throw new Error('Database not initialized');
    }

    const { storeName } = this.config;
    const transaction = databaseInstance.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const binaryRecord = {
      id: binaryKey,
      binaryData,
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const storeRequest = store.put(binaryRecord);

      storeRequest.onsuccess = () => {
        console.log('✅ [INDEXEDDB_STORE] 바이너리 저장 완료:', {
          binaryKey,
          binarySize: binaryData.size,
        });
        resolve();
      };

      storeRequest.onerror = () => {
        const { error } = storeRequest;
        const errorMessage = error?.message || 'Unknown store error';
        console.error('❌ [INDEXEDDB_STORE] 바이너리 저장 실패:', {
          binaryKey,
          error: errorMessage,
        });
        reject(new Error(`Binary store failed: ${errorMessage}`));
      };
    });
  }

  // 🔧 IndexedDB 직접 조회 (non-null assertion 제거)
  private async retrieveFromIndexedDB(binaryKey: string): Promise<Blob | null> {
    const { databaseInstance } = this;
    const hasDatabase =
      databaseInstance !== null && databaseInstance !== undefined;

    if (!hasDatabase) {
      throw new Error('Database not initialized');
    }

    const { storeName } = this.config;
    const transaction = databaseInstance.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(binaryKey);

      getRequest.onsuccess = () => {
        const { result } = getRequest;
        const hasValidResult = result !== undefined;

        if (!hasValidResult) {
          console.log('⚠️ [INDEXEDDB_RETRIEVE] 바이너리 데이터 없음:', {
            binaryKey,
          });
          resolve(null);
          return;
        }

        const { binaryData } = result;
        console.log('✅ [INDEXEDDB_RETRIEVE] 바이너리 조회 완료:', {
          binaryKey,
          binarySize: binaryData.size,
        });
        resolve(binaryData);
      };

      getRequest.onerror = () => {
        const { error } = getRequest;
        const errorMessage = error?.message || 'Unknown retrieve error';
        console.error('❌ [INDEXEDDB_RETRIEVE] 바이너리 조회 실패:', {
          binaryKey,
          error: errorMessage,
        });
        reject(new Error(`Binary retrieve failed: ${errorMessage}`));
      };
    });
  }

  // 🔧 IndexedDB 직접 삭제 (non-null assertion 제거)
  private async deleteFromIndexedDB(binaryKey: string): Promise<void> {
    const { databaseInstance } = this;
    const hasDatabase =
      databaseInstance !== null && databaseInstance !== undefined;

    if (!hasDatabase) {
      throw new Error('Database not initialized');
    }

    const { storeName } = this.config;
    const transaction = databaseInstance.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const deleteRequest = store.delete(binaryKey);

      deleteRequest.onsuccess = () => {
        console.log('✅ [INDEXEDDB_DELETE] 바이너리 삭제 완료:', { binaryKey });
        resolve();
      };

      deleteRequest.onerror = () => {
        const { error } = deleteRequest;
        const errorMessage = error?.message || 'Unknown delete error';
        console.error('❌ [INDEXEDDB_DELETE] 바이너리 삭제 실패:', {
          binaryKey,
          error: errorMessage,
        });
        reject(new Error(`Binary delete failed: ${errorMessage}`));
      };
    });
  }

  // 🔧 수정된 createImageMetadata 함수 (확장된 타입 사용)
  private createImageMetadata(
    metadataId: string,
    file: File,
    compressionResult: ImageGalleryCompressionResult
  ): ImageGalleryMetadata {
    return {
      id: metadataId,
      originalFileName: file.name,
      indexedDBKey: `binary_${metadataId}`,
      originalDataUrl: compressionResult.originalDataUrl,
      fileSize: compressionResult.originalSize,
      createdAt: new Date(),

      // 🔧 선택적 필드들 추가
      thumbnailDataUrl: compressionResult.thumbnailDataUrl,
      compressedSize: compressionResult.compressedSize,
      dimensions: compressionResult.dimensions,
      mimeType: file.type,
      quality: this.options.compressionQuality,
      isCompressed: this.options.enableCompression,
    };
  }

  private async addMetadataToLocalStorage(
    newMetadata: ImageGalleryMetadata
  ): Promise<void> {
    const localData = this.getLocalStorageData();
    const currentMetadataList = localData?.imageMetadataList || [];
    const updatedMetadataList = [...currentMetadataList, newMetadata];

    const updatedLocalData: ImageGalleryLocalStorageData = {
      version: '1.0.0',
      imageMetadataList: updatedMetadataList,
      lastUpdated: new Date().toISOString(),
    };

    this.saveLocalStorageData(updatedLocalData);
  }

  private async convertBlobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = (loadEvent) => {
        const { target } = loadEvent;
        const result = target?.result;

        const isValidResult = typeof result === 'string';
        if (!isValidResult) {
          reject(new Error('Blob to DataURL conversion failed'));
          return;
        }

        resolve(result);
      };

      fileReader.onerror = () => {
        reject(new Error('FileReader error'));
      };

      fileReader.readAsDataURL(blob);
    });
  }

  private async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const imageElement = new Image();
      const fileReader = new FileReader();

      fileReader.onload = (loadEvent) => {
        const { target } = loadEvent;
        const result = target?.result;

        const isValidResult = typeof result === 'string';
        if (!isValidResult) {
          reject(new Error('File reading failed for dimensions'));
          return;
        }

        imageElement.onload = () => {
          resolve({
            width: imageElement.naturalWidth,
            height: imageElement.naturalHeight,
          });
        };

        imageElement.onerror = () => {
          reject(new Error('Image loading failed for dimensions'));
        };

        imageElement.src = result;
      };

      fileReader.onerror = () => {
        reject(new Error('FileReader error for dimensions'));
      };

      fileReader.readAsDataURL(file);
    });
  }
}
