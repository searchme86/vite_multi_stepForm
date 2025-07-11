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

// 🔧 트랜잭션 상태 관리
interface TransactionState {
  readonly isActive: boolean;
  readonly operationId: string;
  readonly operationType: 'SAVE' | 'DELETE' | 'LOAD';
  readonly timestamp: number;
  readonly rollbackData?: {
    readonly previousMetadata: ImageGalleryMetadata[];
    readonly previousIndexedDBKeys: string[];
  };
}

// 🔧 작업 큐 시스템
interface StorageOperation {
  readonly id: string;
  readonly type: 'SAVE' | 'DELETE' | 'LOAD';
  readonly priority: number;
  readonly payload: any;
  readonly resolve: (result: any) => void;
  readonly reject: (error: Error) => void;
}

// 타입 가드 함수 추가 (타입 단언 제거)
const isValidImageGalleryLocalStorageData = (
  data: unknown
): data is ImageGalleryLocalStorageData => {
  const isObject = typeof data === 'object' && data !== null;
  if (!isObject) {
    return false;
  }

  const version = Reflect.get(data, 'version');
  const imageMetadataList = Reflect.get(data, 'imageMetadataList');
  const lastUpdated = Reflect.get(data, 'lastUpdated');

  const hasVersion = typeof version === 'string';
  const hasImageMetadataList = Array.isArray(imageMetadataList);
  const hasLastUpdated = typeof lastUpdated === 'string';

  return hasVersion && hasImageMetadataList && hasLastUpdated;
};

// 🚨 Race Condition 해결: 트랜잭션 기반 하이브리드 스토리지
export class ImageGalleryHybridStorage {
  private readonly config: ImageGalleryStorageConfig;
  private readonly localStorageKey: string;
  private readonly options: ImageGalleryHybridStorageOptions;
  private databaseInstance: IDBDatabase | null = null;

  // 🔧 트랜잭션 및 락 관리
  private currentTransaction: TransactionState | null = null;
  private readonly operationQueue: StorageOperation[] = [];
  private isProcessingQueue = false;
  private readonly maxRetries = 3;

  constructor(
    config: ImageGalleryStorageConfig,
    options: ImageGalleryHybridStorageOptions
  ) {
    this.config = config;
    this.localStorageKey = `${config.dbName}_metadata`;
    this.options = options;

    console.log('🔧 [HYBRID_STORAGE] 트랜잭션 기반 하이브리드 스토리지 생성:', {
      dbName: config.dbName,
      localStorageKey: this.localStorageKey,
      enableCompression: options.enableCompression,
      transactionSupport: true,
      queueSystem: true,
    });
  }

  async initializeHybridStorage(): Promise<void> {
    console.log('🚀 [HYBRID_INIT] 트랜잭션 기반 초기화');

    try {
      await this.initializeIndexedDB();
      this.initializeLocalStorageData();
      this.startQueueProcessor();
      console.log('✅ [HYBRID_INIT] 트랜잭션 기반 초기화 완료');
    } catch (initError) {
      console.error('❌ [HYBRID_INIT] 초기화 실패:', { error: initError });
      throw new Error(`Hybrid storage initialization failed: ${initError}`);
    }
  }

  // 🔧 트랜잭션 관리 함수들
  private beginTransaction(
    operationType: TransactionState['operationType'],
    rollbackData?: TransactionState['rollbackData']
  ): string {
    const operationId = `txn_${operationType.toLowerCase()}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    if (this.currentTransaction?.isActive) {
      throw new Error(
        `Transaction already active: ${this.currentTransaction.operationId}`
      );
    }

    this.currentTransaction = {
      isActive: true,
      operationId,
      operationType,
      timestamp: Date.now(),
      rollbackData,
    };

    console.log('🔐 [TRANSACTION] 트랜잭션 시작:', {
      operationId,
      operationType,
      hasRollbackData: rollbackData !== undefined,
    });

    return operationId;
  }

  private async commitTransaction(operationId: string): Promise<void> {
    if (!this.currentTransaction?.isActive) {
      throw new Error('No active transaction to commit');
    }

    if (this.currentTransaction.operationId !== operationId) {
      throw new Error(
        `Transaction ID mismatch: expected ${this.currentTransaction.operationId}, got ${operationId}`
      );
    }

    this.currentTransaction = null;

    console.log('✅ [TRANSACTION] 트랜잭션 커밋:', {
      operationId,
      commitSuccessful: true,
    });
  }

  private async rollbackTransaction(
    operationId: string,
    error: Error
  ): Promise<void> {
    if (!this.currentTransaction?.isActive) {
      console.log('⚠️ [TRANSACTION] 롤백할 활성 트랜잭션 없음');
      return;
    }

    if (this.currentTransaction.operationId !== operationId) {
      console.error('❌ [TRANSACTION] 트랜잭션 ID 불일치:', {
        expected: this.currentTransaction.operationId,
        received: operationId,
      });
      return;
    }

    console.log('🔄 [TRANSACTION] 트랜잭션 롤백 시작:', {
      operationId,
      error: error.message,
    });

    try {
      const { rollbackData } = this.currentTransaction;

      if (rollbackData) {
        // LocalStorage 롤백
        const rollbackLocalData: ImageGalleryLocalStorageData = {
          version: '1.0.0',
          imageMetadataList: rollbackData.previousMetadata,
          lastUpdated: new Date().toISOString(),
        };

        this.saveLocalStorageData(rollbackLocalData);

        // IndexedDB 롤백 (새로 추가된 키들 삭제)
        const { previousIndexedDBKeys } = rollbackData;
        const currentMetadata =
          this.getLocalStorageData()?.imageMetadataList || [];
        const currentIndexedDBKeys = currentMetadata.map(
          ({ indexedDBKey }) => indexedDBKey
        );

        const keysToDelete = currentIndexedDBKeys.filter(
          (key) => !previousIndexedDBKeys.includes(key)
        );

        await Promise.allSettled(
          keysToDelete.map((key) => this.deleteFromIndexedDB(key))
        );

        console.log('✅ [TRANSACTION] 롤백 완료:', {
          metadataRolledBack: rollbackData.previousMetadata.length,
          keysDeleted: keysToDelete.length,
        });
      }
    } catch (rollbackError) {
      console.error('❌ [TRANSACTION] 롤백 실패:', {
        operationId,
        rollbackError,
        originalError: error.message,
      });
    } finally {
      this.currentTransaction = null;
    }
  }

  // 🔧 큐 처리 시스템
  private startQueueProcessor(): void {
    if (this.isProcessingQueue) {
      return;
    }

    const processQueue = async () => {
      this.isProcessingQueue = true;

      try {
        while (this.operationQueue.length > 0) {
          // 우선순위 정렬 (숫자가 낮을수록 높은 우선순위)
          this.operationQueue.sort((a, b) => a.priority - b.priority);

          const operation = this.operationQueue.shift();
          if (!operation) continue;

          try {
            await this.executeOperation(operation);
          } catch (operationError) {
            console.error('❌ [QUEUE_PROCESSOR] 작업 실행 실패:', {
              operationId: operation.id,
              operationType: operation.type,
              error: operationError,
            });
            operation.reject(
              operationError instanceof Error
                ? operationError
                : new Error(String(operationError))
            );
          }

          // 다음 작업과의 간격 보장
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      } catch (processingError) {
        console.error('❌ [QUEUE_PROCESSOR] 큐 처리 실패:', {
          error: processingError,
        });
      } finally {
        this.isProcessingQueue = false;

        // 큐에 남은 작업이 있으면 다시 시작
        if (this.operationQueue.length > 0) {
          setTimeout(() => this.startQueueProcessor(), 100);
        }
      }
    };

    processQueue();
  }

  private async executeOperation(operation: StorageOperation): Promise<void> {
    console.log('⚡ [OPERATION] 작업 실행:', {
      operationId: operation.id,
      operationType: operation.type,
      priority: operation.priority,
    });

    const { type, payload, resolve, reject } = operation;

    try {
      let result: any;

      switch (type) {
        case 'SAVE':
          result = await this.executeTransactionalSave(
            payload.file,
            payload.metadataId
          );
          break;
        case 'DELETE':
          result = await this.executeTransactionalDelete(payload.metadataId);
          break;
        case 'LOAD':
          result = await this.executeTransactionalLoad(payload.metadataId);
          break;
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }

      resolve(result);

      console.log('✅ [OPERATION] 작업 완료:', {
        operationId: operation.id,
        operationType: operation.type,
      });
    } catch (executionError) {
      console.error('❌ [OPERATION] 작업 실패:', {
        operationId: operation.id,
        operationType: operation.type,
        error: executionError,
      });
      reject(
        executionError instanceof Error
          ? executionError
          : new Error(String(executionError))
      );
    }
  }

  // 🚨 Race Condition 해결: 트랜잭션 기반 저장
  async saveImageToHybridStorage(
    file: File,
    metadataId: string
  ): Promise<ImageGalleryHybridData> {
    console.log('💾 [HYBRID_SAVE] 트랜잭션 기반 저장 요청:', {
      fileName: file.name,
      fileSize: file.size,
      metadataId,
    });

    return new Promise((resolve, reject) => {
      const operation: StorageOperation = {
        id: `save_${metadataId}_${Date.now()}`,
        type: 'SAVE',
        priority: 1, // 저장은 높은 우선순위
        payload: { file, metadataId },
        resolve,
        reject,
      };

      this.operationQueue.push(operation);
      this.startQueueProcessor();

      console.log('📝 [HYBRID_SAVE] 저장 작업 큐 추가:', {
        operationId: operation.id,
        queueLength: this.operationQueue.length,
      });
    });
  }

  private async executeTransactionalSave(
    file: File,
    metadataId: string
  ): Promise<ImageGalleryHybridData> {
    // 롤백용 현재 상태 백업
    const currentLocalData = this.getLocalStorageData();
    const previousMetadata = currentLocalData?.imageMetadataList || [];
    const previousIndexedDBKeys = previousMetadata.map(
      ({ indexedDBKey }) => indexedDBKey
    );

    const operationId = this.beginTransaction('SAVE', {
      previousMetadata,
      previousIndexedDBKeys,
    });

    try {
      // 1단계: 이미지 처리
      const { enableCompression, compressionQuality } = this.options;
      const compressionResult = await this.processImageFile(
        file,
        enableCompression,
        compressionQuality
      );

      // 2단계: 메타데이터 생성
      const imageMetadata = this.createImageMetadata(
        metadataId,
        file,
        compressionResult
      );

      // 3단계: IndexedDB에 바이너리 저장 (원자적 연산)
      await this.storeToIndexedDB(
        imageMetadata.indexedDBKey,
        compressionResult.compressedBlob
      );

      // 4단계: LocalStorage에 메타데이터 저장 (원자적 연산)
      await this.addMetadataToLocalStorage(imageMetadata);

      // 트랜잭션 커밋
      await this.commitTransaction(operationId);

      const hybridData: ImageGalleryHybridData = {
        metadata: imageMetadata,
        binaryKey: imageMetadata.indexedDBKey,
        localStorageKey: this.localStorageKey,
      };

      console.log('✅ [TRANSACTIONAL_SAVE] 트랜잭션 저장 완료:', {
        metadataId,
        operationId,
        compressionRatio: `${compressionResult.compressionRatio.toFixed(2)}%`,
      });

      return hybridData;
    } catch (saveError) {
      console.error('❌ [TRANSACTIONAL_SAVE] 저장 실패, 롤백 실행:', {
        metadataId,
        operationId,
        error: saveError,
      });

      await this.rollbackTransaction(
        operationId,
        saveError instanceof Error ? saveError : new Error(String(saveError))
      );
      throw new Error(`Transactional save failed: ${file.name}`);
    }
  }

  // 🚨 Race Condition 해결: 트랜잭션 기반 삭제
  async deleteImageFromHybridStorage(metadataId: string): Promise<void> {
    console.log('🗑️ [HYBRID_DELETE] 트랜잭션 기반 삭제 요청:', { metadataId });

    return new Promise((resolve, reject) => {
      const operation: StorageOperation = {
        id: `delete_${metadataId}_${Date.now()}`,
        type: 'DELETE',
        priority: 2, // 삭제는 중간 우선순위
        payload: { metadataId },
        resolve,
        reject,
      };

      this.operationQueue.push(operation);
      this.startQueueProcessor();

      console.log('📝 [HYBRID_DELETE] 삭제 작업 큐 추가:', {
        operationId: operation.id,
        queueLength: this.operationQueue.length,
      });
    });
  }

  private async executeTransactionalDelete(metadataId: string): Promise<void> {
    // 롤백용 현재 상태 백업
    const currentLocalData = this.getLocalStorageData();
    if (!currentLocalData) {
      console.log('ℹ️ [TRANSACTIONAL_DELETE] 삭제할 데이터 없음');
      return;
    }

    const { imageMetadataList = [] } = currentLocalData;
    const targetMetadata = imageMetadataList.find(
      (metadata) => metadata.id === metadataId
    );

    if (!targetMetadata) {
      console.log('ℹ️ [TRANSACTIONAL_DELETE] 대상 메타데이터 없음:', {
        metadataId,
      });
      return;
    }

    const operationId = this.beginTransaction('DELETE', {
      previousMetadata: imageMetadataList,
      previousIndexedDBKeys: imageMetadataList.map(
        ({ indexedDBKey }) => indexedDBKey
      ),
    });

    try {
      const { indexedDBKey } = targetMetadata;

      // 1단계: IndexedDB에서 바이너리 삭제
      await this.deleteFromIndexedDB(indexedDBKey);

      // 2단계: LocalStorage에서 메타데이터 제거
      const updatedMetadataList = imageMetadataList.filter(
        (metadata) => metadata.id !== metadataId
      );
      const updatedLocalData: ImageGalleryLocalStorageData = {
        ...currentLocalData,
        imageMetadataList: updatedMetadataList,
        lastUpdated: new Date().toISOString(),
      };

      this.saveLocalStorageData(updatedLocalData);

      // 트랜잭션 커밋
      await this.commitTransaction(operationId);

      console.log('✅ [TRANSACTIONAL_DELETE] 트랜잭션 삭제 완료:', {
        metadataId,
        operationId,
      });
    } catch (deleteError) {
      console.error('❌ [TRANSACTIONAL_DELETE] 삭제 실패, 롤백 실행:', {
        metadataId,
        operationId,
        error: deleteError,
      });

      await this.rollbackTransaction(
        operationId,
        deleteError instanceof Error
          ? deleteError
          : new Error(String(deleteError))
      );
      throw new Error(`Transactional delete failed: ${metadataId}`);
    }
  }

  // 🚨 Race Condition 해결: 트랜잭션 기반 로드
  async loadImageFromHybridStorage(metadataId: string): Promise<string | null> {
    console.log('📁 [HYBRID_LOAD] 트랜잭션 기반 로드 요청:', { metadataId });

    return new Promise((resolve, reject) => {
      const operation: StorageOperation = {
        id: `load_${metadataId}_${Date.now()}`,
        type: 'LOAD',
        priority: 3, // 로드는 낮은 우선순위
        payload: { metadataId },
        resolve,
        reject,
      };

      this.operationQueue.push(operation);
      this.startQueueProcessor();

      console.log('📝 [HYBRID_LOAD] 로드 작업 큐 추가:', {
        operationId: operation.id,
        queueLength: this.operationQueue.length,
      });
    });
  }

  private async executeTransactionalLoad(
    metadataId: string
  ): Promise<string | null> {
    const operationId = this.beginTransaction('LOAD');

    try {
      // LocalStorage에서 메타데이터 조회
      const localData = this.getLocalStorageData();
      if (!localData) {
        await this.commitTransaction(operationId);
        return null;
      }

      const { imageMetadataList = [] } = localData;
      const targetMetadata = imageMetadataList.find(
        (metadata) => metadata.id === metadataId
      );

      if (!targetMetadata) {
        await this.commitTransaction(operationId);
        return null;
      }

      const { indexedDBKey } = targetMetadata;

      // IndexedDB에서 바이너리 조회
      const binaryData = await this.retrieveFromIndexedDB(indexedDBKey);
      if (!binaryData) {
        await this.commitTransaction(operationId);
        return null;
      }

      // Blob을 DataURL로 변환
      const dataUrl = await this.convertBlobToDataUrl(binaryData);

      await this.commitTransaction(operationId);

      console.log('✅ [TRANSACTIONAL_LOAD] 트랜잭션 로드 완료:', {
        metadataId,
        operationId,
      });

      return dataUrl;
    } catch (loadError) {
      console.error('❌ [TRANSACTIONAL_LOAD] 로드 실패:', {
        metadataId,
        operationId,
        error: loadError,
      });

      await this.rollbackTransaction(
        operationId,
        loadError instanceof Error ? loadError : new Error(String(loadError))
      );
      return null;
    }
  }

  // 기존 IndexedDB 초기화 (변경 없음)
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

  // 기존 LocalStorage 관리 함수들 (변경 없음)
  private getLocalStorageData(): ImageGalleryLocalStorageData | null {
    try {
      const storedDataString = localStorage.getItem(this.localStorageKey);
      const hasStoredData = storedDataString !== null;

      if (!hasStoredData) {
        return null;
      }

      const parsedData = JSON.parse(storedDataString);

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

  async getAllImageMetadata(): Promise<ImageGalleryMetadata[]> {
    const localData = this.getLocalStorageData();
    const hasLocalData = localData !== null;
    if (!hasLocalData) {
      return [];
    }

    const { imageMetadataList = [] } = localData;
    return imageMetadataList;
  }

  // 이미지 처리 및 기타 헬퍼 함수들 (기존과 동일하므로 생략)
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

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
  }

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
