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

// 🆕 개선된 직렬화 함수 (selectedImages도 저장)
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
        selectedImages = [], // 🔧 selectedImages도 포함
      } = imageViewConfig;

      // 🔧 selectedImages를 저장에 포함 (리프레시 문제 해결)
      persistData.imageViewConfig = {
        selectedImageIds,
        imageMetadata,
        clickOrder,
        layout,
        filter,
        selectedImages, // 🚨 핵심: selectedImages도 persist에 저장
      };
    }

    const serializedData = JSON.stringify({
      ...state,
      ...persistData,
    });

    console.log('💾 [SERIALIZE] 하이브리드 직렬화 완료 (selectedImages포함):', {
      imageCount: persistData.imageViewConfig?.selectedImageIds?.length || 0,
      metadataCount: persistData.imageViewConfig?.imageMetadata?.length || 0,
      selectedImagesCount:
        persistData.imageViewConfig?.selectedImages?.length || 0, // 🆕 추가
      isInitialized: persistData._isInitialized,
      isPreviewPanelOpen: persistData.isPreviewPanelOpen,
      isHybridMode: persistData.isHybridMode,
    });

    return serializedData;
  } catch (serializeError) {
    console.log('하이브리드 직렬화 실패:', serializeError);
    return JSON.stringify(state);
  }
};

// 🆕 개선된 역직렬화 함수 (selectedImages 복원)
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
  try {
    const parsedData = JSON.parse(dataString);

    const isObject = typeof parsedData === 'object' && parsedData !== null;
    if (!isObject) {
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
      // 🔧 selectedImages도 복원 (저장된 값 우선 사용)
      const {
        selectedImageIds = [],
        imageMetadata = [],
        clickOrder = [],
        layout = { columns: 3, gridType: 'grid' },
        filter = 'all',
        selectedImages = [], // 🚨 핵심: persist된 selectedImages 복원
      } = imageViewConfig;

      const restoredConfig: HybridImageViewConfig = {
        selectedImageIds,
        imageMetadata,
        clickOrder,
        layout,
        filter,
        selectedImages, // 🔧 저장된 selectedImages 사용 (빈 배열 아님)
      };

      restoredState.imageViewConfig = restoredConfig;
    }

    console.log(
      '📁 [DESERIALIZE] 하이브리드 역직렬화 완료 (selectedImages포함):',
      {
        imageIdsCount:
          restoredState.imageViewConfig?.selectedImageIds?.length || 0,
        metadataCount:
          restoredState.imageViewConfig?.imageMetadata?.length || 0,
        selectedImagesCount:
          restoredState.imageViewConfig?.selectedImages?.length || 0, // 🆕 추가
        isInitialized: restoredState._isInitialized,
        isPreviewPanelOpen: restoredState.isPreviewPanelOpen,
        isHybridMode: restoredState.isHybridMode,
      }
    );

    return restoredState;
  } catch (deserializeError) {
    console.log('하이브리드 역직렬화 실패:', deserializeError);
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
    Reflect.set(partializedState, 'imageViewConfig', state.imageViewConfig);
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

  console.log(
    '📦 [PARTIALIZE] 하이브리드 부분 저장 완료 (selectedImages포함):',
    {
      hasImageViewConfig,
      hasCustomGalleryViews,
      hasInitializationFlag,
      hasIsPreviewPanelOpen,
      hasIsHybridMode,
      hasLastSyncTimestamp,
      isInitialized: state._isInitialized,
      selectedImagesCount: state.imageViewConfig?.selectedImages?.length || 0, // 🆕 추가
    }
  );

  return partializedState;
};

// 🆕 React Hook Form 동기화 콜백 추가
export const createOnRehydrateStorageCallback = <
  T extends {
    _triggerAutoInitialization?: () => void;
    _syncToReactHookForm?: () => void; // 🆕 React Hook Form 동기화 함수 추가
  }
>() => {
  return () => (state?: T) => {
    if (!state) {
      console.log('⚠️ [REHYDRATE] 복원할 상태가 없음');
      return;
    }

    console.log('🔄 [REHYDRATE] 상태 복원 완료, 동기화 트리거:', {
      hasState: true,
      isInitialized: Reflect.get(state, '_isInitialized') ?? false,
      hasReactHookFormSync: Reflect.get(state, '_syncToReactHookForm')
        ? true
        : false, // 🆕 추가
    });

    // 🔧 복원 후 자동 초기화 트리거
    const triggerAutoInit = Reflect.get(state, '_triggerAutoInitialization');
    if (typeof triggerAutoInit === 'function') {
      setTimeout(() => {
        triggerAutoInit();
      }, 0);
    }

    // 🆕 React Hook Form 동기화 트리거 추가
    const syncToReactHookForm = Reflect.get(state, '_syncToReactHookForm');
    if (typeof syncToReactHookForm === 'function') {
      setTimeout(() => {
        syncToReactHookForm();
      }, 100); // 초기화 후 동기화
    }
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
    _syncToReactHookForm?: () => void; // 🆕 React Hook Form 동기화 함수 추가
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
      '🔧 [HYBRID_PERSIST] 개선된 하이브리드 설정 생성 완료 (React Hook Form 동기화 포함):',
      {
        configName,
        storageType,
        hasRehydrateCallback: true,
        includesSelectedImages: true, // 🆕 추가
      }
    );

    return hybridPersistConfig;
  } catch (hybridConfigError) {
    console.log('하이브리드 persist 설정 생성 실패:', hybridConfigError);

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
