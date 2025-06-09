// 📁 store/paragraphContext.ts

import { createContext, useContext, ReactNode } from 'react';
import { useParagraphState } from './paragraphState';

type ParagraphContextType = ReturnType<typeof useParagraphState>;

const ParagraphContext = createContext<ParagraphContextType | null>(null);

export function ParagraphProvider({ children }: { children: ReactNode }) {
  console.log('📄 [PARAGRAPH_CONTEXT] ParagraphProvider 초기화');

  const paragraphState = useParagraphState();

  console.log('✅ [PARAGRAPH_CONTEXT] ParagraphProvider 렌더링 완료');

  return (
    <ParagraphContext.Provider value={paragraphState}>
      {children}
    </ParagraphContext.Provider>
  );
}

export function useParagraphContext(): ParagraphContextType {
  console.log('🎯 [PARAGRAPH_CONTEXT] useParagraphContext 훅 호출');

  const context = useContext(ParagraphContext);

  if (!context) {
    console.error(
      '❌ [PARAGRAPH_CONTEXT] ParagraphProvider 없이 useParagraphContext 사용 시도'
    );
    throw new Error(
      'useParagraphContext는 ParagraphProvider 내부에서 사용해야 합니다.'
    );
  }

  console.log('✅ [PARAGRAPH_CONTEXT] useParagraphContext 컨텍스트 반환');
  return context;
}
