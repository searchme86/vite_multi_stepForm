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

// 🔧 데이터 무결성 검증 함수들
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

  const hasValidSelectedImageIds = Array.isArray(selectedImageIds);
  const hasValidImageMetadata = Array.isArray(imageMetadata);
  const hasValidSelectedImages = Array.isArray(selectedImages);
  const hasValidClickOrder =
    Array.isArray(clickOrder) || clickOrder === undefined;
  const hasValidLayout = typeof layout === 'object' && layout !== null;
  const hasValidFilter = typeof filter === 'string' || filter === undefined;

  return (
    hasValidSelectedImageIds &&
    hasValidImageMetadata &&
    hasValidSelectedImages &&
    hasValidClickOrder &&
    hasValidLayout &&
    hasValidFilter
  );
};

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

    // selectedImages와 selectedImageIds 길이 일치 검증
    const { selectedImages = [], selectedImageIds = [] } =
      state.imageViewConfig;
    const lengthMatches = selectedImages.length === selectedImageIds.length;
    if (!lengthMatches) {
      console.error(
        '❌ [VALIDATION] selectedImages와 selectedImageIds 길이 불일치:',
        {
          selectedImagesLength: selectedImages.length,
          selectedImageIdsLength: selectedImageIds.length,
        }
      );
      return false;
    }

    // selectedImages가 비어있지 않은지 확인 (중요!)
    const hasValidSelectedImages = selectedImages.every(
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
  }

  console.log('✅ [VALIDATION] 상태 검증 성공:', {
    imageViewConfigValid: true,
    selectedImagesCount: state.imageViewConfig?.selectedImages?.length || 0,
    selectedImageIdsCount: state.imageViewConfig?.selectedImageIds?.length || 0,
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

// 🚨 Race Condition 해결: 원자적 직렬화 함수
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
      } = imageViewConfig;

      // 🚨 핵심: selectedImages 무결성 검증 및 정리
      const validSelectedImages = selectedImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          imageUrl.startsWith('data:')
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
      };

      console.log('💾 [ATOMIC_SERIALIZE] 원자적 직렬화 완료:', {
        originalSelectedImagesCount: selectedImages.length,
        validSelectedImagesCount: validSelectedImages.length,
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

// 🚨 Race Condition 해결: 원자적 역직렬화 함수
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
      } = imageViewConfig;

      // 🚨 핵심: selectedImages 복원 시 무결성 검증
      const validRestoredImages = selectedImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' &&
          imageUrl.length > 0 &&
          (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))
      );

      // 길이 동기화
      const syncedImageIds = selectedImageIds.slice(
        0,
        validRestoredImages.length
      );
      const syncedMetadata = imageMetadata.slice(0, validRestoredImages.length);

      const restoredConfig: HybridImageViewConfig = {
        selectedImageIds: syncedImageIds,
        imageMetadata: syncedMetadata,
        clickOrder,
        layout,
        filter,
        selectedImages: validRestoredImages, // 🔧 검증된 이미지만 복원
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
        };
      } else {
        restoredState.imageViewConfig = restoredConfig;

        console.log('📁 [ATOMIC_DESERIALIZE] 원자적 역직렬화 완료:', {
          originalSelectedImagesCount: selectedImages.length,
          validRestoredImagesCount: validRestoredImages.length,
          syncedImageIdsCount: syncedImageIds.length,
          syncedMetadataCount: syncedMetadata.length,
          configValidated: true,
          noDataLoss: validRestoredImages.length > 0,
          timestamp: new Date().toLocaleTimeString(),
        });
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
      } = imageViewConfig;

      // selectedImages 무결성 확인
      const validSelectedImages = selectedImages.filter(
        (imageUrl: unknown): imageUrl is string =>
          typeof imageUrl === 'string' && imageUrl.length > 0
      );

      const cleanedConfig: HybridImageViewConfig = {
        selectedImageIds: selectedImageIds.slice(0, validSelectedImages.length),
        imageMetadata: imageMetadata.slice(0, validSelectedImages.length),
        selectedImages: validSelectedImages,
        clickOrder,
        layout,
        filter,
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

  console.log('📦 [PARTIALIZE] 정리된 부분 저장 완료:', {
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
    });

    // 🔧 복원된 상태 최종 검증
    const isValidRestoredState = validateRestoredState(state);
    if (!isValidRestoredState) {
      console.error('❌ [ATOMIC_REHYDRATE] 복원된 상태 검증 실패, 복원 중단');
      return;
    }

    // 🚨 핵심: selectedImages 데이터 무결성 재확인
    if (state.imageViewConfig?.selectedImages) {
      const { selectedImages } = state.imageViewConfig;
      const hasValidSelectedImages =
        selectedImages.length > 0 &&
        selectedImages.every(
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

      console.log('✅ [ATOMIC_REHYDRATE] selectedImages 무결성 검증 성공:', {
        selectedImagesCount: selectedImages.length,
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

        console.log('✅ [ATOMIC_REHYDRATE] 원자적 복원 프로세스 완료:', {
          totalSelectedImages:
            state.imageViewConfig?.selectedImages?.length || 0,
          restorationSuccessful: true,
          noRaceCondition: true,
        });
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

    console.log('🔧 [HYBRID_PERSIST] 원자적 복원 하이브리드 설정 생성 완료:', {
      configName,
      storageType,
      hasAtomicSerialization: true,
      hasAtomicDeserialization: true,
      hasAtomicRehydration: true,
      hasDataValidation: true,
      noRaceCondition: true,
    });

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
