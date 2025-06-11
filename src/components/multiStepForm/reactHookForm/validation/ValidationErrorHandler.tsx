import React from 'react';
import { FieldErrors } from 'react-hook-form';
import { FormSchemaValues } from '../../types/formTypes';

interface ValidationErrorHandlerProps {
  errors: FieldErrors<FormSchemaValues>;
  onErrorChange: (hasErrors: boolean, errorCount: number) => void;
  children: React.ReactNode;
}

function ValidationErrorHandler({
  errors,
  onErrorChange,
  children,
}: ValidationErrorHandlerProps) {
  console.log('❌ ValidationErrorHandler: 검증 에러 핸들러 렌더링');

  React.useEffect(() => {
    console.log('❌ ValidationErrorHandler: 에러 상태 변화 감지');

    const errorFields = Object.keys(errors);
    const hasErrors = errorFields.length > 0;
    const errorCount = errorFields.length;

    console.log('❌ ValidationErrorHandler: 에러 분석', {
      hasErrors,
      errorCount,
      errorFields,
    });

    onErrorChange(hasErrors, errorCount);
  }, [errors, onErrorChange]);

  const getErrorMessage = (
    fieldName: keyof FormSchemaValues
  ): string | undefined => {
    const error = errors[fieldName];
    return error?.message;
  };

  const getFirstError = (): string | undefined => {
    const firstErrorField = Object.keys(errors)[0] as keyof FormSchemaValues;
    return firstErrorField ? getErrorMessage(firstErrorField) : undefined;
  };

  React.useEffect(() => {
    const firstError = getFirstError();
    if (firstError) {
      console.log('❌ ValidationErrorHandler: 첫 번째 에러', firstError);
    }
  }, [errors]);

  return <>{children}</>;
}

export default ValidationErrorHandler;
