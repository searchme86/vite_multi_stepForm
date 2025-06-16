// import React from 'react';
// import { FormValues } from '../../types/formTypes';
// import { UseFormReturn } from 'react-hook-form';

// interface FormManagementContextType {
//   formValues: FormValues;
//   methods: UseFormReturn<any>;
//   handleSubmit: (
//     callback: (data: any) => void
//   ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
//   onSubmit: (data: any) => void;
//   resetForm: () => void;
//   isDirty: boolean;
//   isSubmitting: boolean;
//   isValid: boolean;
// }

// const FormManagementContext = React.createContext<
//   FormManagementContextType | undefined
// >(undefined);

// interface FormManagementProviderProps {
//   children: React.ReactNode;
//   value: FormManagementContextType;
// }

// export function FormManagementProvider({
//   children,
//   value,
// }: FormManagementProviderProps) {
//   console.log('📝 FormManagementProvider: 폼 관리 Context Provider 렌더링');

//   return (
//     <FormManagementContext.Provider value={value}>
//       {children}
//     </FormManagementContext.Provider>
//   );
// }

// export function useFormManagementContext() {
//   console.log('📝 useFormManagementContext: 폼 관리 Context 사용');

//   const context = React.useContext(FormManagementContext);
//   if (context === undefined) {
//     throw new Error(
//       'useFormManagementContext must be used within a FormManagementProvider'
//     );
//   }
//   return context;
// }

// export { FormManagementContext };
