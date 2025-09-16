// 📁 store/containerContext.ts

import { createContext, useContext, ReactNode } from 'react';
import { useContainerState } from '../store/containerState';

type ContainerContextType = ReturnType<typeof useContainerState>;

const ContainerContext = createContext<ContainerContextType | null>(null);

export function ContainerProvider({ children }: { children: ReactNode }) {
  console.log('📦 [CONTAINER_CONTEXT] ContainerProvider 초기화');

  const containerState = useContainerState();

  console.log('✅ [CONTAINER_CONTEXT] ContainerProvider 렌더링 완료');

  return (
    <ContainerContext.Provider value={containerState}>
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainerContext(): ContainerContextType {
  console.log('🎯 [CONTAINER_CONTEXT] useContainerContext 훅 호출');

  const context = useContext(ContainerContext);

  if (!context) {
    console.error(
      '❌ [CONTAINER_CONTEXT] ContainerProvider 없이 useContainerContext 사용 시도'
    );
    throw new Error(
      'useContainerContext는 ContainerProvider 내부에서 사용해야 합니다.'
    );
  }

  console.log('✅ [CONTAINER_CONTEXT] useContainerContext 컨텍스트 반환');
  return context;
}
