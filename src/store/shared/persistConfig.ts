// 📁 store/shared/persistConfig.ts

import { createJSONStorage } from 'zustand/middleware';
import type { HybridImageViewConfig } from './commonTypes';

export interface PersistConfig<T> {
  name: string;
  storage: ReturnType<typeof createJSONStorage>;
  partialize?: (state: T) => Partial<T>;
  skipHydration?: boolean;
}

// 🆕 간소화된 하이브리드 persist 설정
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

// 🆕 간소화된 하이브리드 스토리지 어댑터
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

// 🆕 간소화된 직렬화 함수
export const hybridSerializeImageGalleryState = <
  T extends { imageViewConfig?: HybridImageViewConfig }
>(
  state: Partial<T>
): string => {
  try {
    const { imageViewConfig } = state;
    const hasImageViewConfig =
      imageViewConfig !== null && imageViewConfig !== undefined;

    if (!hasImageViewConfig) {
      return JSON.stringify(state);
    }

    // 메타데이터와 ID만 저장, selectedImages는 제외
    const {
      selectedImageIds = [],
      imageMetadata = [],
      clickOrder = [],
      layout = { columns: 3, gridType: 'grid' },
      filter = 'all',
    } = imageViewConfig;

    const persistData = {
      selectedImageIds,
      imageMetadata,
      clickOrder,
      layout,
      filter,
    };

    const serializedData = JSON.stringify({
      ...state,
      imageViewConfig: persistData,
    });

    console.log('💾 [SERIALIZE] 하이브리드 직렬화 완료:', {
      imageCount: selectedImageIds.length,
      metadataCount: imageMetadata.length,
    });

    return serializedData;
  } catch (serializeError) {
    console.log('하이브리드 직렬화 실패:', serializeError);
    return JSON.stringify(state);
  }
};

// 🆕 간소화된 역직렬화 함수
export const hybridDeserializeImageGalleryState = <
  T extends { imageViewConfig?: HybridImageViewConfig }
>(
  dataString: string
): Partial<T> => {
  try {
    const parsedData = JSON.parse(dataString);

    const isObject = typeof parsedData === 'object' && parsedData !== null;
    if (!isObject) {
      return {} satisfies Partial<T>;
    }

    const { imageViewConfig } = parsedData;
    const hasImageViewConfig =
      imageViewConfig !== null && imageViewConfig !== undefined;

    if (!hasImageViewConfig) {
      return parsedData;
    }

    // selectedImages는 빈 배열로 초기화 (런타임에서 복원됨)
    const restoredConfig: HybridImageViewConfig = {
      ...imageViewConfig,
      selectedImages: [], // 🔄 IndexedDB에서 복원 예정
    };

    const restoredState = {
      ...parsedData,
      imageViewConfig: restoredConfig,
    };

    console.log('📁 [DESERIALIZE] 하이브리드 역직렬화 완료:', {
      imageIdsCount: restoredConfig.selectedImageIds?.length || 0,
      metadataCount: restoredConfig.imageMetadata?.length || 0,
    });

    return restoredState;
  } catch (deserializeError) {
    console.log('하이브리드 역직렬화 실패:', deserializeError);
    return {} satisfies Partial<T>;
  }
};

// 🆕 간소화된 partialize 함수
export const hybridPartializeImageGalleryState = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    customGalleryViews?: unknown[];
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

  console.log('📦 [PARTIALIZE] 하이브리드 부분 저장 완료:', {
    hasImageViewConfig,
    hasCustomGalleryViews,
  });

  return partializedState;
};

// 🆕 Promise 기반 이미지 복원 함수
export const createPromiseBasedImageRestore = (
  loadStoredImagesFunction: () => Promise<void>
) => {
  return async (rehydratedState?: any): Promise<void> => {
    const hasRehydratedState =
      rehydratedState !== null && rehydratedState !== undefined;
    if (!hasRehydratedState) {
      return;
    }

    console.log('🔄 [PROMISE_RESTORE] Promise 기반 이미지 복원 시작');

    try {
      // Promise 기반으로 동기화 (setTimeout 제거)
      await loadStoredImagesFunction();
      console.log('✅ [PROMISE_RESTORE] IndexedDB 이미지 복원 완료');
    } catch (restoreError) {
      console.error('❌ [PROMISE_RESTORE] 이미지 복원 실패:', {
        error: restoreError,
      });
    }
  };
};

// 🆕 간소화된 하이브리드 persist 설정 생성 함수
export const createHybridPersistConfig = <
  T extends {
    imageViewConfig?: HybridImageViewConfig;
    customGalleryViews?: unknown[];
  }
>(
  configName: string,
  storageType: 'local' | 'session' = 'local',
  loadStoredImagesFunction?: () => Promise<void>
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
      skipHydration: false,

      onRehydrateStorage: () => {
        const hasLoadFunction = loadStoredImagesFunction !== undefined;
        if (!hasLoadFunction) {
          return () => {
            console.log('ℹ️ [HYBRID_PERSIST] 이미지 로드 함수 없음');
          };
        }

        // Promise 기반 복원 함수 반환
        return createPromiseBasedImageRestore(loadStoredImagesFunction);
      },
    };

    console.log('🔧 [HYBRID_PERSIST] 간소화된 하이브리드 설정 생성 완료:', {
      configName,
      storageType,
      hasLoadFunction: loadStoredImagesFunction !== undefined,
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
