// import React from 'react';
// import { MultiStepFormContextType } from '../types/contextTypes';
// import { FormValues } from '../types/formTypes';
// import {
//   ImageViewConfig,
//   CustomGalleryView,
//   createDefaultImageViewConfig,
// } from '../types/galleryTypes';
// import { EditorState } from '../types/editorTypes';
// import { ToastOptions } from '../types/toastTypes';

// const MultiStepFormContext = React.createContext<
//   MultiStepFormContextType | undefined
// >(undefined);

// interface MultiStepFormProviderProps {
//   children: React.ReactNode;
//   value: MultiStepFormContextType;
// }

// export function MultiStepFormProvider({
//   children,
//   value,
// }: MultiStepFormProviderProps) {
//   console.log('🏪 MultiStepFormProvider: Context Provider 렌더링');

//   return (
//     <MultiStepFormContext.Provider value={value}>
//       {children}
//     </MultiStepFormContext.Provider>
//   );
// }

// export function useMultiStepFormContext() {
//   const context = React.useContext(MultiStepFormContext);
//   if (context === undefined) {
//     throw new Error(
//       'useMultiStepFormContext must be used within a MultiStepFormProvider'
//     );
//   }
//   return context;
// }

// export { MultiStepFormContext };
