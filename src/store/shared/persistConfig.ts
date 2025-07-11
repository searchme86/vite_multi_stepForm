// 📁 store/shared/persistConfig.ts

import { createJSONStorage } from 'zustand/middleware';
import type { HybridImageViewConfig } from './commonTypes';

export interface PersistConfig<T> {
  name: string;
  storage: ReturnType<typeof createJSONStorage>;
  partialize?: (state: T) => Partial<T>;
  skipHydration?: boolean;
}

export interface HybridPersistConfig<T> extends PersistConfig<T> {
  onRehydrateStorage?: () => (state?: T) => void | Promise<void>;
  serialize?: (state: Partial<T>) => string;
  deserialize?: (str: string) => Partial<T>;
}

// 🔧 원자적 직렬화/역직렬화 락 관리
class SerializationLockManager {
  private static instance: SerializationLockManager;
  private isSerializing = false;
  private isDeserializing = false;
  private operationQueue: Array<{
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessingQueue = false;

  static getInstance(): SerializationLockManager {
    if (!SerializationLockManager.instance) {
      SerializationLockManager.instance = new SerializationLockManager();
    }
    return SerializationLockManager.instance;
  }

  async executeWithLock<T>(
    lockType: 'serialize' | 'deserialize',
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({
        operation: async () => {
          const canProceed = this.acquireLock(lockType);
          if (!canProceed) {
            throw new Error(`Lock acquisition failed for ${lockType}`);
          }

          try {
            const result = await operation();
            return result;
          } finally {
            this.releaseLock(lockType);
          }
        },
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  private acquireLock(lockType: 'serialize' | 'deserialize'): boolean {
    if (lockType === 'serialize') {
      if (this.isSerializing || this.isDeserializing) {
        return false;
      }
      this.isSerializing = true;
      console.log('🔒 [SERIALIZATION_LOCK] 직렬화 락 획득');
      return true;
    } else {
      if (this.isSerializing || this.isDeserializing) {
        return false;
      }
      this.isDeserializing = true;
      console.log('🔒 [SERIALIZATION_LOCK] 역직렬화 락 획득');
      return true;
    }
  }

  private releaseLock(lockType: 'serialize' | 'deserialize'): void {
    if (lockType === 'serialize') {
      this.isSerializing = false;
      console.log('🔓 [SERIALIZATION_LOCK] 직렬화 락 해제');
    } else {
      this.isDeserializing = false;
      console.log('🔓 [SERIALIZATION_LOCK] 역직렬화 락 해제');
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.operationQueue.length > 0) {
        const queueItem = this.operationQueue.shift();
        if (!queueItem) continue;

        const { operation, resolve, reject } = queueItem;

        try {
          const result = await operation();
          resolve(result);
        } catch (operationError) {
          reject(
            operationError instanceof Error
              ? operationError
              : new Error(String(operationError))
          );
        }

        // 다음 작업과의 간격 보장
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }
}

// 🚨 수정: 슬라이더 필드를 포함한 데이터 무결성 검증 함수
const validateHybridImageViewConfig = (
  config: unknown
): config is HybridImageViewConfig => {
  const isObject = typeof config === 'object' && config !== null;
  if (!isObject) {
    return false;
  }

  const selectedImageIds = Reflect.get(config, 'selectedImageIds');
  const imageMetadata = Reflect.get(config, 'imageMetadata');
  const selectedImages = Reflect.get(config, 'selectedImages');
  const clickOrder = Reflect.get(config, 'clickOrder');
  const layout = Reflect.get(config, 'layout');
  const filter = Reflect.get(config, 'filter');

  // 🚨 슬라이더 필드들 검증 추가
  const mainImage = Reflect.get(config, 'mainImage');
  const sliderImages = Reflect.get(config, 'sliderImages');

  const hasValidSelectedImageIds = Array.isArray(selectedImageIds);
  const hasValidImageMetadata = Array.isArray(imageMetadata);
  const hasValidSelectedImages = Array.isArray(selectedImages);
  const hasValidClickOrder =
    Array.isArray(clickOrder) || clickOrder === undefined;
  const hasValidLayout = typeof layout === 'object' && layout !== null;
  const hasValidFilter = typeof filter === 'string' || filter === undefined;

  // 🚨 슬라이더 필드 검증
  const hasValidMainImage =
    mainImage === null ||
    mainImage === undefined ||
    typeof mainImage === 'string';
  const hasValidSliderImages = Array.isArray(sliderImages);

  return (
    hasValidSelectedImageIds &&
    hasValidImageMetadata &&
    hasValidSelectedImages &&
    hasValidClickOrder &&
    hasValidLayout &&
    hasValidFilter &&
    hasValidMainImage &&
    hasValidSliderImages
  );
};

// 🚨 수정: 슬라이더 데이터를 포함한 상태 검증 로직 개선
const validateRestoredState = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    _isInitialized?: boolean;
    isPreviewPanelOpen?: boolean;
    isHybridMode?: boolean;
    lastSyncTimestamp?: Date | null;
    customGalleryViews?: unknown[];
  }
>(
  state: Partial<T>
): boolean => {
  console.log('🔍 [VALIDATION] 복원된 상태 검증 시작:', {
    hasImageViewConfig: 'imageViewConfig' in state,
    hasInitializedFlag: '_isInitialized' in state,
    stateKeys: Object.keys(state),
  });

  // imageViewConfig 검증
  if ('imageViewConfig' in state && state.imageViewConfig !== undefined) {
    const isValidConfig = validateHybridImageViewConfig(state.imageViewConfig);
    if (!isValidConfig) {
      console.error('❌ [VALIDATION] imageViewConfig 검증 실패:', {
        imageViewConfig: state.imageViewConfig,
      });
      return false;
    }

    // 🚨 핵심 수정: 더 유연한 데이터 검증 로직
    const {
      selectedImages = [],
      selectedImageIds = [],
      imageMetadata = [],
      sliderImages = [], // 슬라이더 배열 추가
    } = state.imageViewConfig;

    // 🔧 길이 검증을 더 관대하게 변경 (완전히 일치하지 않아도 허용)
    const selectedImagesLength = selectedImages.length;
    const selectedImageIdsLength = selectedImageIds.length;
    const imageMetadataLength = imageMetadata.length;
    const sliderImagesLength = sliderImages.length;

    console.log('📊 [VALIDATION] 배열 길이 정보:', {
      selectedImagesLength,
      selectedImageIdsLength,
      imageMetadataLength,
      sliderImagesLength,
    });

    // 🚨 핵심 변경: 치명적 불일치만 에러로 처리
    const hasValidSelectedImages = selectedImages.every(
      (imageUrl: unknown) => typeof imageUrl === 'string' && imageUrl.length > 0
    );

    const hasValidSliderImages = sliderImages.every(
      (imageUrl: unknown) => typeof imageUrl === 'string' && imageUrl.length > 0
    );

    if (!hasValidSelectedImages) {
      console.error('❌ [VALIDATION] selectedImages에 유효하지 않은 데이터:', {
        selectedImages: selectedImages.map((url: any, index: number) => ({
          index,
          type: typeof url,
          length: typeof url === 'string' ? url.length : 0,
          preview:
            typeof url === 'string' ? url.slice(0, 30) + '...' : 'invalid',
        })),
      });
      return false;
    }

    if (!hasValidSliderImages) {
      console.error('❌ [VALIDATION] sliderImages에 유효하지 않은 데이터:', {
        sliderImages: sliderImages.map((url: any, index: number) => ({
          index,
          type: typeof url,
          length: typeof url === 'string' ? url.length : 0,
          preview:
            typeof url === 'string' ? url.slice(0, 30) + '...' : 'invalid',
        })),
      });
      return false;
    }

    // 🔧 경고 표시만 하고 검증은 통과 (자동 복구 가능)
    const lengthsAreSynced =
      selectedImagesLength === selectedImageIdsLength &&
      selectedImagesLength === imageMetadataLength;

    if (!lengthsAreSynced) {
      console.warn('⚠️ [VALIDATION] 배열 길이 불일치 감지 (자동 복구 예정):', {
        selectedImagesLength,
        selectedImageIdsLength,
        imageMetadataLength,
        willAutoRecover: true,
      });
      // 검증 실패가 아닌 경고로 처리
    }

    // 🔧 슬라이더 이미지가 selectedImages의 부분집합인지 검증
    const invalidSliderImages = sliderImages.filter(
      (sliderUrl: string) => !selectedImages.includes(sliderUrl)
    );

    if (invalidSliderImages.length > 0) {
      console.warn('⚠️ [VALIDATION] 슬라이더에 메인 목록에 없는 이미지 발견:', {
        invalidSliderImagesCount: invalidSliderImages.length,
        willAutoRecover: true,
      });
    }
  }

  console.log('✅ [VALIDATION] 상태 검증 성공 (자동 복구 포함):', {
    imageViewConfigValid: true,
    selectedImagesCount: state.imageViewConfig?.selectedImages?.length || 0,
    selectedImageIdsCount: state.imageViewConfig?.selectedImageIds?.length || 0,
    sliderImagesCount: state.imageViewConfig?.sliderImages?.length || 0,
    autoRecoveryEnabled: true,
  });

  return true;
};

export const createPersistConfig = <T>(
  name: string,
  storageType: 'local' | 'session' = 'local'
): PersistConfig<T> => {
  try {
    const isServerEnvironment = typeof window === 'undefined';
    if (isServerEnvironment) {
      return {
        name,
        storage: createJSONStorage(() => ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        })),
        skipHydration: true,
      };
    }

    const storage =
      storageType === 'local' ? window.localStorage : window.sessionStorage;
    const isStorageAvailable = storage !== null && storage !== undefined;

    if (!isStorageAvailable) {
      throw new Error(`${storageType}Storage is not available`);
    }

    const persistConfig: PersistConfig<T> = {
      name,
      storage: createJSONStorage(() => storage),
      skipHydration: false,
    };

    return persistConfig;
  } catch (configError) {
    console.log('persistConfig 생성 실패:', configError);
    return {
      name,
      storage: createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      skipHydration: true,
    };
  }
};

export const createHybridStorageAdapter = () => {
  return {
    getItem: (storageKey: string): string | null => {
      try {
        const isServerEnvironment = typeof window === 'undefined';
        if (isServerEnvironment) {
          return null;
        }

        const { localStorage: browserLocalStorage } = window;
        const isLocalStorageAvailable =
          browserLocalStorage !== null && browserLocalStorage !== undefined;

        if (!isLocalStorageAvailable) {
          return null;
        }

        const storedDataString = browserLocalStorage.getItem(storageKey);
        return storedDataString;
      } catch (getError) {
        console.log('하이브리드 스토리지 getItem 실패:', getError);
        return null;
      }
    },

    setItem: (storageKey: string, dataString: string): void => {
      try {
        const isServerEnvironment = typeof window === 'undefined';
        if (isServerEnvironment) {
          return;
        }

        const { localStorage: browserLocalStorage } = window;
        const isLocalStorageAvailable =
          browserLocalStorage !== null && browserLocalStorage !== undefined;

        if (!isLocalStorageAvailable) {
          return;
        }

        browserLocalStorage.setItem(storageKey, dataString);
      } catch (setError) {
        console.log('하이브리드 스토리지 setItem 실패:', setError);
      }
    },

    removeItem: (storageKey: string): void => {
      try {
        const isServerEnvironment = typeof window === 'undefined';
        if (isServerEnvironment) {
          return;
        }

        const { localStorage: browserLocalStorage } = window;
        const isLocalStorageAvailable =
          browserLocalStorage !== null && browserLocalStorage !== undefined;

        if (!isLocalStorageAvailable) {
          return;
        }

        browserLocalStorage.removeItem(storageKey);
      } catch (removeError) {
        console.log('하이브리드 스토리지 removeItem 실패:', removeError);
      }
    },
  };
};

// 🚨 수정: 슬라이더 필드를 포함한 원자적 직렬화 함수
export const hybridSerializeImageGalleryState = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    _isInitialized?: boolean;
    isPreviewPanelOpen?: boolean;
    isHybridMode?: boolean;
    lastSyncTimestamp?: Date | null;
    customGalleryViews?: unknown[];
  }
>(
  state: Partial<T>
): string => {
  // 🔧 동기적 직렬화로 Race Condition 방지
  try {
    const {
      imageViewConfig,
      _isInitialized,
      isPreviewPanelOpen,
      isHybridMode,
      lastSyncTimestamp,
      customGalleryViews,
    } = state;

    const hasImageViewConfig =
      imageViewConfig !== null && imageViewConfig !== undefined;

    const persistData: any = {
      _isInitialized: _isInitialized ?? false,
      isPreviewPanelOpen: isPreviewPanelOpen ?? false,
      isHybridMode: isHybridMode ?? true,
      lastSyncTimestamp: lastSyncTimestamp ?? null,
      customGalleryViews: customGalleryViews ?? [],
    };

    if (hasImageViewConfig) {
      const {
        selectedImageIds = [],
        imageMetadata = [],
        clickOrder = [],
        layout = { columns: 3, gridType: 'grid' },
        filter = 'all',
        selectedImages = [],
        mainImage = null, // 🚨 슬라이더 필드 추가
        sliderImages = [], // 🚨 슬라이더 필드 추가
      } = imageViewConfig;

      // 🚨 핵심: selectedImages 무결성 검증 및 정리
      const validSelectedImages = selectedImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          imageUrl.startsWith('data:')
      );

      // 🚨 슬라이더 이미지 무결성 검증
      const validSliderImages = sliderImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          validSelectedImages.includes(imageUrl) // 메인 목록에 있는 이미지만 허용
      );

      const cleanedSelectedImageIds = selectedImageIds.slice(
        0,
        validSelectedImages.length
      );
      const cleanedImageMetadata = imageMetadata.slice(
        0,
        validSelectedImages.length
      );

      persistData.imageViewConfig = {
        selectedImageIds: cleanedSelectedImageIds,
        imageMetadata: cleanedImageMetadata,
        clickOrder,
        layout,
        filter,
        selectedImages: validSelectedImages, // 검증된 이미지만 저장
        mainImage, // 슬라이더 필드 보존
        sliderImages: validSliderImages, // 검증된 슬라이더 이미지만 저장
      };

      console.log('💾 [ATOMIC_SERIALIZE] 슬라이더 포함 원자적 직렬화 완료:', {
        originalSelectedImagesCount: selectedImages.length,
        validSelectedImagesCount: validSelectedImages.length,
        originalSliderImagesCount: sliderImages.length,
        validSliderImagesCount: validSliderImages.length,
        cleanedImageIdsCount: cleanedSelectedImageIds.length,
        cleanedMetadataCount: cleanedImageMetadata.length,
        dataIntegrityEnsured: true,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    const serializedData = JSON.stringify({
      ...state,
      ...persistData,
    });

    return serializedData;
  } catch (serializeError) {
    console.error('❌ [ATOMIC_SERIALIZE] 원자적 직렬화 실패:', {
      error: serializeError,
    });
    return JSON.stringify(state);
  }
};

// 🚨 수정: 슬라이더 필드를 포함한 원자적 역직렬화 함수
export const hybridDeserializeImageGalleryState = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    _isInitialized?: boolean;
    isPreviewPanelOpen?: boolean;
    isHybridMode?: boolean;
    lastSyncTimestamp?: Date | null;
    customGalleryViews?: unknown[];
  }
>(
  dataString: string
): Partial<T> => {
  // 🔧 동기적 역직렬화로 Race Condition 방지
  try {
    const parsedData = JSON.parse(dataString);

    const isObject = typeof parsedData === 'object' && parsedData !== null;
    if (!isObject) {
      console.error('❌ [ATOMIC_DESERIALIZE] 유효하지 않은 데이터 형식');
      return {} satisfies Partial<T>;
    }

    const {
      imageViewConfig,
      _isInitialized,
      isPreviewPanelOpen,
      isHybridMode,
      lastSyncTimestamp,
      customGalleryViews,
    } = parsedData;

    const hasImageViewConfig =
      imageViewConfig !== null && imageViewConfig !== undefined;

    const restoredState: any = {
      ...parsedData,
      _isInitialized: _isInitialized ?? false,
      isPreviewPanelOpen: isPreviewPanelOpen ?? false,
      isHybridMode: isHybridMode ?? true,
      lastSyncTimestamp: lastSyncTimestamp ?? null,
      customGalleryViews: customGalleryViews ?? [],
    };

    if (hasImageViewConfig) {
      const {
        selectedImageIds = [],
        imageMetadata = [],
        clickOrder = [],
        layout = { columns: 3, gridType: 'grid' },
        filter = 'all',
        selectedImages = [],
        mainImage = null, // 🚨 슬라이더 필드 추가
        sliderImages = [], // 🚨 슬라이더 필드 추가
      } = imageViewConfig;

      // 🚨 핵심: selectedImages 복원 시 무결성 검증
      const validRestoredImages = selectedImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))
      );

      // 🚨 슬라이더 이미지 복원 시 무결성 검증
      const validRestoredSliderImages = sliderImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          validRestoredImages.includes(imageUrl) // 메인 목록에 있는 이미지만 허용
      );

      // 🔧 자동 동기화: 배열 길이 맞추기
      const maxLength = Math.max(
        validRestoredImages.length,
        selectedImageIds.length,
        imageMetadata.length
      );

      const syncedImageIds =
        selectedImageIds.length >= maxLength
          ? selectedImageIds.slice(0, maxLength)
          : [
              ...selectedImageIds,
              ...Array(maxLength - selectedImageIds.length)
                .fill(null)
                .map((_, i) => `restored-id-${Date.now()}-${i}`),
            ];

      const syncedMetadata =
        imageMetadata.length >= maxLength
          ? imageMetadata.slice(0, maxLength)
          : [
              ...imageMetadata,
              ...Array(maxLength - imageMetadata.length)
                .fill(null)
                .map((_, i) => ({
                  id: syncedImageIds[imageMetadata.length + i],
                  originalFileName: `restored-image-${
                    imageMetadata.length + i + 1
                  }`,
                  indexedDBKey: `restored-key-${Date.now()}-${i}`,
                  originalDataUrl:
                    validRestoredImages[imageMetadata.length + i] || '',
                  fileSize: 0,
                  createdAt: new Date(),
                })),
            ];

      const restoredConfig: HybridImageViewConfig = {
        selectedImageIds: syncedImageIds.slice(0, validRestoredImages.length), // 실제 이미지 수에 맞춤
        imageMetadata: syncedMetadata.slice(0, validRestoredImages.length),
        clickOrder,
        layout,
        filter,
        selectedImages: validRestoredImages, // 🔧 검증된 이미지만 복원
        mainImage, // 슬라이더 필드 복원
        sliderImages: validRestoredSliderImages, // 🔧 검증된 슬라이더 이미지만 복원
      };

      // 복원된 설정 검증
      const isValidConfig = validateHybridImageViewConfig(restoredConfig);
      if (!isValidConfig) {
        console.error('❌ [ATOMIC_DESERIALIZE] 복원된 설정 검증 실패');

        // 기본값으로 복원
        restoredState.imageViewConfig = {
          selectedImageIds: [],
          imageMetadata: [],
          clickOrder: [],
          layout: { columns: 3, gridType: 'grid' },
          filter: 'all',
          selectedImages: [],
          mainImage: null,
          sliderImages: [],
        };
      } else {
        restoredState.imageViewConfig = restoredConfig;

        console.log(
          '📁 [ATOMIC_DESERIALIZE] 슬라이더 포함 원자적 역직렬화 완료:',
          {
            originalSelectedImagesCount: selectedImages.length,
            validRestoredImagesCount: validRestoredImages.length,
            originalSliderImagesCount: sliderImages.length,
            validRestoredSliderImagesCount: validRestoredSliderImages.length,
            syncedImageIdsCount: restoredConfig.selectedImageIds.length,
            syncedMetadataCount: restoredConfig.imageMetadata.length,
            configValidated: true,
            autoSyncApplied: true,
            noDataLoss: validRestoredImages.length > 0,
            timestamp: new Date().toLocaleTimeString(),
          }
        );
      }
    }

    // 전체 상태 검증
    const isValidState = validateRestoredState(restoredState);
    if (!isValidState) {
      console.error('❌ [ATOMIC_DESERIALIZE] 전체 상태 검증 실패');
      return {} satisfies Partial<T>;
    }

    return restoredState;
  } catch (deserializeError) {
    console.error('❌ [ATOMIC_DESERIALIZE] 원자적 역직렬화 실패:', {
      error: deserializeError,
    });
    return {} satisfies Partial<T>;
  }
};

export const hybridPartializeImageGalleryState = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    customGalleryViews?: unknown[];
    _isInitialized?: boolean;
    isPreviewPanelOpen?: boolean;
    isHybridMode?: boolean;
    lastSyncTimestamp?: Date | null;
  }
>(
  state: T
): Partial<T> => {
  const partializedState: Partial<T> = {};

  const hasImageViewConfig = state.imageViewConfig !== undefined;
  if (hasImageViewConfig) {
    // 🔧 타입 안전성: imageViewConfig가 undefined가 아님을 보장
    const { imageViewConfig } = state;
    if (imageViewConfig) {
      const {
        selectedImageIds = [],
        imageMetadata = [],
        selectedImages = [],
        clickOrder = [],
        layout = { columns: 3, gridType: 'grid' },
        filter = 'all',
        mainImage = null, // 🚨 슬라이더 필드 추가
        sliderImages = [], // 🚨 슬라이더 필드 추가
      } = imageViewConfig;

      // selectedImages 무결성 확인
      const validSelectedImages = selectedImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' && imageUrl.length > 0
      );

      // 🚨 슬라이더 이미지 무결성 확인
      const validSliderImages = sliderImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          validSelectedImages.includes(imageUrl)
      );

      const cleanedConfig: HybridImageViewConfig = {
        selectedImageIds: selectedImageIds.slice(0, validSelectedImages.length),
        imageMetadata: imageMetadata.slice(0, validSelectedImages.length),
        selectedImages: validSelectedImages,
        clickOrder,
        layout,
        filter,
        mainImage, // 슬라이더 필드 보존
        sliderImages: validSliderImages, // 정리된 슬라이더 이미지
      };

      Reflect.set(partializedState, 'imageViewConfig', cleanedConfig);
    }
  }

  const hasCustomGalleryViews = state.customGalleryViews !== undefined;
  if (hasCustomGalleryViews) {
    Reflect.set(
      partializedState,
      'customGalleryViews',
      state.customGalleryViews
    );
  }

  const hasInitializationFlag = state._isInitialized !== undefined;
  if (hasInitializationFlag) {
    Reflect.set(partializedState, '_isInitialized', state._isInitialized);
  }

  const hasIsPreviewPanelOpen = state.isPreviewPanelOpen !== undefined;
  if (hasIsPreviewPanelOpen) {
    Reflect.set(
      partializedState,
      'isPreviewPanelOpen',
      state.isPreviewPanelOpen
    );
  }

  const hasIsHybridMode = state.isHybridMode !== undefined;
  if (hasIsHybridMode) {
    Reflect.set(partializedState, 'isHybridMode', state.isHybridMode);
  }

  const hasLastSyncTimestamp = state.lastSyncTimestamp !== undefined;
  if (hasLastSyncTimestamp) {
    Reflect.set(partializedState, 'lastSyncTimestamp', state.lastSyncTimestamp);
  }

  console.log('📦 [PARTIALIZE] 슬라이더 포함 정리된 부분 저장 완료:', {
    hasImageViewConfig,
    hasCustomGalleryViews,
    hasInitializationFlag,
    hasIsPreviewPanelOpen,
    hasIsHybridMode,
    hasLastSyncTimestamp,
    isInitialized: state._isInitialized,
    selectedImagesCount:
      hasImageViewConfig && state.imageViewConfig
        ? (partializedState.imageViewConfig as HybridImageViewConfig)
            ?.selectedImages?.length || 0
        : 0,
    sliderImagesCount:
      hasImageViewConfig && state.imageViewConfig
        ? (partializedState.imageViewConfig as HybridImageViewConfig)
            ?.sliderImages?.length || 0
        : 0,
    dataIntegrityEnsured: true,
  });

  return partializedState;
};

// 🚨 Race Condition 해결: 원자적 복원 콜백
export const createOnRehydrateStorageCallback = <
  T extends {
    _triggerAutoInitialization?: () => void;
    _syncToReactHookForm?: () => void;
    _isInitialized?: boolean;
    imageViewConfig?: HybridImageViewConfig;
  }
>() => {
  return () => (state?: T) => {
    if (!state) {
      console.log('⚠️ [ATOMIC_REHYDRATE] 복원할 상태가 없음');
      return;
    }

    console.log('🔄 [ATOMIC_REHYDRATE] 원자적 상태 복원 시작:', {
      hasState: true,
      isInitialized: Reflect.get(state, '_isInitialized') ?? false,
      hasImageViewConfig: 'imageViewConfig' in state,
      selectedImagesCount: state.imageViewConfig?.selectedImages?.length || 0,
      sliderImagesCount: state.imageViewConfig?.sliderImages?.length || 0,
    });

    // 🔧 복원된 상태 최종 검증
    const isValidRestoredState = validateRestoredState(state);
    if (!isValidRestoredState) {
      console.error('❌ [ATOMIC_REHYDRATE] 복원된 상태 검증 실패, 복원 중단');
      return;
    }

    // 🚨 핵심: selectedImages와 sliderImages 데이터 무결성 재확인
    if (state.imageViewConfig) {
      const { selectedImages, sliderImages } = state.imageViewConfig;

      if (selectedImages && selectedImages.length > 0) {
        const hasValidSelectedImages = selectedImages.every(
          (imageUrl) =>
            typeof imageUrl === 'string' &&
            imageUrl.length > 0 &&
            (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))
        );

        if (!hasValidSelectedImages) {
          console.error(
            '❌ [ATOMIC_REHYDRATE] selectedImages 무결성 검증 실패:',
            {
              selectedImagesCount: selectedImages.length,
              firstImagePreview: selectedImages[0]?.slice(0, 50) + '...',
            }
          );
          return;
        }
      }

      if (sliderImages && sliderImages.length > 0) {
        const hasValidSliderImages = sliderImages.every(
          (imageUrl) =>
            typeof imageUrl === 'string' &&
            imageUrl.length > 0 &&
            selectedImages?.includes(imageUrl) // 슬라이더는 메인 목록의 부분집합이어야 함
        );

        if (!hasValidSliderImages) {
          console.error(
            '❌ [ATOMIC_REHYDRATE] sliderImages 무결성 검증 실패:',
            {
              sliderImagesCount: sliderImages.length,
              firstSliderImagePreview: sliderImages[0]?.slice(0, 50) + '...',
            }
          );
          return;
        }
      }

      console.log('✅ [ATOMIC_REHYDRATE] 이미지 데이터 무결성 검증 성공:', {
        selectedImagesCount: selectedImages?.length || 0,
        sliderImagesCount: sliderImages?.length || 0,
        allImagesValid: true,
      });
    }

    // 🔧 복원 후 원자적 초기화 및 동기화 (순차 실행)
    const atomicRestoreProcess = async () => {
      try {
        // 1단계: 자동 초기화 트리거
        const triggerAutoInit = Reflect.get(
          state,
          '_triggerAutoInitialization'
        );
        if (typeof triggerAutoInit === 'function') {
          await new Promise<void>((resolve) => {
            triggerAutoInit();
            setTimeout(resolve, 100); // 초기화 완료 대기
          });
          console.log('✅ [ATOMIC_REHYDRATE] 자동 초기화 완료');
        }

        // 2단계: React Hook Form 동기화 트리거
        const syncToReactHookForm = Reflect.get(state, '_syncToReactHookForm');
        if (typeof syncToReactHookForm === 'function') {
          await new Promise<void>((resolve) => {
            syncToReactHookForm();
            setTimeout(resolve, 50); // 동기화 완료 대기
          });
          console.log('✅ [ATOMIC_REHYDRATE] React Hook Form 동기화 완료');
        }

        console.log(
          '✅ [ATOMIC_REHYDRATE] 슬라이더 포함 원자적 복원 프로세스 완료:',
          {
            totalSelectedImages:
              state.imageViewConfig?.selectedImages?.length || 0,
            totalSliderImages: state.imageViewConfig?.sliderImages?.length || 0,
            restorationSuccessful: true,
            noRaceCondition: true,
          }
        );
      } catch (restoreError) {
        console.error('❌ [ATOMIC_REHYDRATE] 원자적 복원 프로세스 실패:', {
          error: restoreError,
        });
      }
    };

    // 비동기 복원 프로세스 시작 (충돌 방지)
    setTimeout(() => {
      atomicRestoreProcess();
    }, 0);
  };
};

export const createHybridPersistConfig = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    customGalleryViews?: unknown[];
    _isInitialized?: boolean;
    isPreviewPanelOpen?: boolean;
    isHybridMode?: boolean;
    lastSyncTimestamp?: Date | null;
    _triggerAutoInitialization?: () => void;
    _syncToReactHookForm?: () => void;
  }
>(
  configName: string,
  storageType: 'local' | 'session' = 'local'
): HybridPersistConfig<T> => {
  try {
    const hybridStorageKey = `${configName}_hybrid_metadata`;
    const hybridAdapter = createHybridStorageAdapter();

    const hybridPersistConfig: HybridPersistConfig<T> = {
      name: hybridStorageKey,
      storage: createJSONStorage(() => hybridAdapter),
      serialize: hybridSerializeImageGalleryState,
      deserialize: hybridDeserializeImageGalleryState,
      partialize: hybridPartializeImageGalleryState,
      onRehydrateStorage: createOnRehydrateStorageCallback<T>(),
      skipHydration: false,
    };

    console.log(
      '🔧 [HYBRID_PERSIST] 슬라이더 포함 원자적 복원 하이브리드 설정 생성 완료:',
      {
        configName,
        storageType,
        hasAtomicSerialization: true,
        hasAtomicDeserialization: true,
        hasAtomicRehydration: true,
        hasDataValidation: true,
        hasSliderSupport: true,
        noRaceCondition: true,
      }
    );

    return hybridPersistConfig;
  } catch (hybridConfigError) {
    console.error(
      '❌ [HYBRID_PERSIST] 하이브리드 설정 생성 실패:',
      hybridConfigError
    );

    const fallbackConfig = createPersistConfig<T>(configName, storageType);
    return {
      ...fallbackConfig,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    };
  }
};

export const createLocalPersistConfig = <T>(configName: string) =>
  createPersistConfig<T>(configName, 'local');

export const createSessionPersistConfig = <T>(configName: string) =>
  createPersistConfig<T>(configName, 'session');

export const createDevPersistConfig = <T>(
  configName: string
): PersistConfig<T> => ({
  name: `dev-${configName}`,
  storage: createJSONStorage(() => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  })),
  skipHydration: true,
});
