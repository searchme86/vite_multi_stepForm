// import React from 'react';
// import { FieldErrors } from 'react-hook-form';
// import { FormSchemaValues } from '../../types/formTypes';
// import { StepNumber } from '../../types/stepTypes';

// interface ValidationContextType {
//   errors: FieldErrors<FormSchemaValues>;
//   validateCurrentStep: (step: StepNumber) => Promise<boolean>;
//   validateField: (fieldName: keyof FormSchemaValues) => Promise<boolean>;
//   validateAllFields: () => Promise<boolean>;
//   isStepValid: (step: StepNumber) => boolean;
//   getFieldError: (fieldName: keyof FormSchemaValues) => string | undefined;
//   hasErrors: boolean;
//   errorCount: number;
// }

// const ValidationContext = React.createContext<
//   ValidationContextType | undefined
// >(undefined);

// interface ValidationProviderProps {
//   children: React.ReactNode;
//   value: ValidationContextType;
// }

// export function ValidationProvider({
//   children,
//   value,
// }: ValidationProviderProps) {
//   console.log('✅ ValidationProvider: 검증 Context Provider 렌더링');

//   return (
//     <ValidationContext.Provider value={value}>
//       {children}
//     </ValidationContext.Provider>
//   );
// }

// export function useValidationContext() {
//   console.log('✅ useValidationContext: 검증 Context 사용');

//   const context = React.useContext(ValidationContext);
//   if (context === undefined) {
//     throw new Error(
//       'useValidationContext must be used within a ValidationProvider'
//     );
//   }
//   return context;
// }

// export { ValidationContext };
