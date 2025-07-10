// 📁 store/shared/persistConfig.ts

import { createJSONStorage } from 'zustand/middleware';
import type { HybridImageViewConfig } from './commonTypes';

export interface PersistConfig<T> {
  name: string;
  storage: ReturnType<typeof createJSONStorage>;
  partialize?: (state: T) => Partial<T>;
  skipHydration?: boolean;
}

// 🆕 초기화 플래그를 포함한 하이브리드 persist 설정
export interface HybridPersistConfig<T> extends PersistConfig<T> {
  onRehydrateStorage?: () => (state?: T) => void | Promise<void>;
  serialize?: (state: Partial<T>) => string;
  deserialize?: (str: string) => Partial<T>;
}

// 🔄 기존 persist 설정 (하위 호환성 유지)
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

// 🆕 하이브리드 스토리지 어댑터
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

// 🆕 개선된 직렬화 함수 (모든 상태 속성 포함)
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

    // 🆕 모든 상태를 포함한 직렬화 데이터
    const persistData: any = {
      _isInitialized: _isInitialized ?? false,
      isPreviewPanelOpen: isPreviewPanelOpen ?? false,
      isHybridMode: isHybridMode ?? true,
      lastSyncTimestamp: lastSyncTimestamp ?? null,
      customGalleryViews: customGalleryViews ?? [],
    };

    if (hasImageViewConfig) {
      // 메타데이터와 ID만 저장, selectedImages는 제외
      const {
        selectedImageIds = [],
        imageMetadata = [],
        clickOrder = [],
        layout = { columns: 3, gridType: 'grid' },
        filter = 'all',
      } = imageViewConfig;

      persistData.imageViewConfig = {
        selectedImageIds,
        imageMetadata,
        clickOrder,
        layout,
        filter,
      };
    }

    const serializedData = JSON.stringify({
      ...state,
      ...persistData,
    });

    console.log('💾 [SERIALIZE] 하이브리드 직렬화 완료:', {
      imageCount: persistData.imageViewConfig?.selectedImageIds?.length || 0,
      metadataCount: persistData.imageViewConfig?.imageMetadata?.length || 0,
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

// 🆕 개선된 역직렬화 함수 (모든 상태 속성 포함)
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
      _isInitialized: _isInitialized ?? false, // 🆕 초기화 플래그 복원
      isPreviewPanelOpen: isPreviewPanelOpen ?? false,
      isHybridMode: isHybridMode ?? true,
      lastSyncTimestamp: lastSyncTimestamp ?? null,
      customGalleryViews: customGalleryViews ?? [],
    };

    if (hasImageViewConfig) {
      // selectedImages는 빈 배열로 초기화 (IndexedDB에서 복원 예정)
      const restoredConfig: HybridImageViewConfig = {
        ...imageViewConfig,
        selectedImages: [], // 🔄 런타임에서 복원됨
      };

      restoredState.imageViewConfig = restoredConfig;
    }

    console.log('📁 [DESERIALIZE] 하이브리드 역직렬화 완료:', {
      imageIdsCount:
        restoredState.imageViewConfig?.selectedImageIds?.length || 0,
      metadataCount: restoredState.imageViewConfig?.imageMetadata?.length || 0,
      isInitialized: restoredState._isInitialized,
      isPreviewPanelOpen: restoredState.isPreviewPanelOpen,
      isHybridMode: restoredState.isHybridMode,
    });

    return restoredState;
  } catch (deserializeError) {
    console.log('하이브리드 역직렬화 실패:', deserializeError);
    return {} satisfies Partial<T>;
  }
};

// 🆕 개선된 partialize 함수 (더 넓은 타입 지원)
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

  // imageViewConfig 추가
  const hasImageViewConfig = state.imageViewConfig !== undefined;
  if (hasImageViewConfig) {
    Reflect.set(partializedState, 'imageViewConfig', state.imageViewConfig);
  }

  // customGalleryViews 추가
  const hasCustomGalleryViews = state.customGalleryViews !== undefined;
  if (hasCustomGalleryViews) {
    Reflect.set(
      partializedState,
      'customGalleryViews',
      state.customGalleryViews
    );
  }

  // 🆕 모든 추가 속성들 포함
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

  console.log('📦 [PARTIALIZE] 하이브리드 부분 저장 완료:', {
    hasImageViewConfig,
    hasCustomGalleryViews,
    hasInitializationFlag,
    hasIsPreviewPanelOpen,
    hasIsHybridMode,
    hasLastSyncTimestamp,
    isInitialized: state._isInitialized,
  });

  return partializedState;
};

// 🆕 onRehydrateStorage 콜백 추가
export const createOnRehydrateStorageCallback = <
  T extends { _triggerAutoInitialization?: () => void }
>() => {
  return () => (state?: T) => {
    if (!state) {
      console.log('⚠️ [REHYDRATE] 복원할 상태가 없음');
      return;
    }

    console.log('🔄 [REHYDRATE] 상태 복원 완료, 자동 초기화 트리거:', {
      hasState: true,
      isInitialized: Reflect.get(state, '_isInitialized') ?? false,
    });

    // 🔧 복원 후 자동 초기화 트리거 (비동기)
    const triggerAutoInit = Reflect.get(state, '_triggerAutoInitialization');
    if (typeof triggerAutoInit === 'function') {
      // 다음 틱에서 실행하여 즉시 초기화
      setTimeout(() => {
        triggerAutoInit();
      }, 0);
    }
  };
};

// 🆕 하이브리드 persist 설정 생성 함수 (확장된 타입 지원)
export const createHybridPersistConfig = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    customGalleryViews?: unknown[];
    _isInitialized?: boolean;
    isPreviewPanelOpen?: boolean;
    isHybridMode?: boolean;
    lastSyncTimestamp?: Date | null;
    _triggerAutoInitialization?: () => void;
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
      onRehydrateStorage: createOnRehydrateStorageCallback<T>(), // 🆕 복원 후 콜백
      skipHydration: false,
    };

    console.log('🔧 [HYBRID_PERSIST] 개선된 하이브리드 설정 생성 완료:', {
      configName,
      storageType,
      hasRehydrateCallback: true,
    });

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

// 🔄 기존 헬퍼 함수들 유지 (하위 호환성)
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
