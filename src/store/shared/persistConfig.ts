import { createJSONStorage } from 'zustand/middleware';

export const localStorageConfig = {
  storage: createJSONStorage(() => localStorage),
};

export const sessionStorageConfig = {
  storage: createJSONStorage(() => sessionStorage),
};

export const createPersistConfig = (
  name: string,
  storageType: 'local' | 'session' = 'local'
) => {
  return {
    name,
    ...(storageType === 'local' ? localStorageConfig : sessionStorageConfig),
  };
};
