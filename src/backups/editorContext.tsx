// 📁 store/editorContext.ts

import { createContext, useContext, ReactNode } from 'react';
import { useEditorState } from './editorState';

type EditorContextType = ReturnType<typeof useEditorState>;

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  console.log('🏪 [EDITOR_CONTEXT] EditorProvider 초기화');

  const editorState = useEditorState();

  console.log('✅ [EDITOR_CONTEXT] EditorProvider 렌더링 완료');

  return (
    <EditorContext.Provider value={editorState}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextType {
  console.log('🎯 [EDITOR_CONTEXT] useEditorContext 훅 호출');

  const context = useContext(EditorContext);

  if (!context) {
    console.error(
      '❌ [EDITOR_CONTEXT] EditorProvider 없이 useEditorContext 사용 시도'
    );
    throw new Error(
      'useEditorContext는 EditorProvider 내부에서 사용해야 합니다.'
    );
  }

  console.log('✅ [EDITOR_CONTEXT] useEditorContext 컨텍스트 반환');
  return context;
}
