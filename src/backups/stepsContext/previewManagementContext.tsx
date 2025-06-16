// import React from 'react';

// interface PreviewManagementContextType {
//   showPreview: boolean;
//   isPreviewPanelOpen: boolean;
//   togglePreview: () => void;
//   togglePreviewPanel: () => void;
//   setShowPreview: (show: boolean) => void;
//   setIsPreviewPanelOpen: (open: boolean) => void;
//   openPreview: () => void;
//   closePreview: () => void;
// }

// const PreviewManagementContext = React.createContext<
//   PreviewManagementContextType | undefined
// >(undefined);

// interface PreviewManagementProviderProps {
//   children: React.ReactNode;
//   value: PreviewManagementContextType;
// }

// export function PreviewManagementProvider({
//   children,
//   value,
// }: PreviewManagementProviderProps) {
//   console.log(
//     '👁️ PreviewManagementProvider: 프리뷰 관리 Context Provider 렌더링'
//   );

//   return (
//     <PreviewManagementContext.Provider value={value}>
//       {children}
//     </PreviewManagementContext.Provider>
//   );
// }

// export function usePreviewManagementContext() {
//   console.log('👁️ usePreviewManagementContext: 프리뷰 관리 Context 사용');

//   const context = React.useContext(PreviewManagementContext);
//   if (context === undefined) {
//     throw new Error(
//       'usePreviewManagementContext must be used within a PreviewManagementProvider'
//     );
//   }
//   return context;
// }

// export { PreviewManagementContext };
