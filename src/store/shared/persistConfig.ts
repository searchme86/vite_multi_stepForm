import { createJSONStorage } from 'zustand/middleware';

export interface PersistConfig<T> {
  name: string;
  storage: ReturnType<typeof createJSONStorage>;
  partialize?: (state: T) => Partial<T>;
  skipHydration?: boolean;
}

export const createPersistConfig = <T>(
  name: string,
  storageType: 'local' | 'session' = 'local'
): PersistConfig<T> => {
  console.log(
    `🔧 [PERSIST_CONFIG] ${name} 설정 생성 - ${storageType}Storage 사용`
  );

  try {
    if (typeof window === 'undefined') {
      console.warn('⚠️ [PERSIST_CONFIG] 서버 환경에서는 메모리 저장소 사용');
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

    if (!storage) {
      console.error(
        `❌ [PERSIST_CONFIG] ${storageType}Storage를 사용할 수 없습니다`
      );
      throw new Error(`${storageType}Storage is not available`);
    }

    const persistConfig: PersistConfig<T> = {
      name,
      storage: createJSONStorage(() => storage),
      skipHydration: false,
    };

    console.log(`✅ [PERSIST_CONFIG] ${name} 설정 생성 완료`);
    return persistConfig;
  } catch (error) {
    console.error(`❌ [PERSIST_CONFIG] ${name} 설정 생성 실패:`, error);

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

export const createLocalPersistConfig = <T>(name: string) =>
  createPersistConfig<T>(name, 'local');

export const createSessionPersistConfig = <T>(name: string) =>
  createPersistConfig<T>(name, 'session');

export const createDevPersistConfig = <T>(name: string): PersistConfig<T> => ({
  name: `dev-${name}`,
  storage: createJSONStorage(() => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  })),
  skipHydration: true,
});
