// import React from 'react';
// import {
//   EditorState,
//   EditorContainer,
//   EditorParagraph,
// } from '../../types/editorTypes';

// interface EditorIntegrationContextType {
//   editorState: EditorState;
//   updateEditorContainers: (containers: EditorContainer[]) => void;
//   updateEditorParagraphs: (paragraphs: EditorParagraph[]) => void;
//   updateEditorCompletedContent: (content: string) => void;
//   setEditorCompleted: (isCompleted: boolean) => void;
//   resetEditorState: () => void;
//   isEditorReady: boolean;
//   hasUnsavedChanges: boolean;
//   saveEditorState: () => void;
// }

// const EditorIntegrationContext = React.createContext<
//   EditorIntegrationContextType | undefined
// >(undefined);

// interface EditorIntegrationProviderProps {
//   children: React.ReactNode;
//   value: EditorIntegrationContextType;
// }

// export function EditorIntegrationProvider({
//   children,
//   value,
// }: EditorIntegrationProviderProps) {
//   console.log(
//     '📝 EditorIntegrationProvider: 에디터 통합 Context Provider 렌더링'
//   );

//   return (
//     <EditorIntegrationContext.Provider value={value}>
//       {children}
//     </EditorIntegrationContext.Provider>
//   );
// }

// export function useEditorIntegrationContext() {
//   console.log('📝 useEditorIntegrationContext: 에디터 통합 Context 사용');

//   const context = React.useContext(EditorIntegrationContext);
//   if (context === undefined) {
//     throw new Error(
//       'useEditorIntegrationContext must be used within a EditorIntegrationProvider'
//     );
//   }
//   return context;
// }

// export { EditorIntegrationContext };
