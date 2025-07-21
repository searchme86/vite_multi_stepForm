// src/components/multiStepForm/reactHookForm/validation/ValidationErrorHandler.tsx

import React from 'react';
import type { FieldErrors } from 'react-hook-form';
import type { FormSchemaValues } from '../../types/formTypes';
import { logDebugInfo } from '../utils/consoleLoggingUtils';

interface ValidationErrorHandlerProps {
  readonly errors: FieldErrors<FormSchemaValues>;
  readonly onErrorChange: (hasErrors: boolean, errorCount: number) => void;
  readonly children: React.ReactNode;
}

interface ErrorSummary {
  readonly fieldNames: readonly string[];
  readonly totalCount: number;
  readonly hasAnyErrors: boolean;
  readonly firstMessage: string;
}

const createErrorSummary = (
  errorCollection: FieldErrors<FormSchemaValues>
): ErrorSummary => {
  const errorEntries = Object.entries(errorCollection);
  const fieldNames = errorEntries.map(([fieldName]) => fieldName);
  const totalCount = fieldNames.length;
  const hasAnyErrors = totalCount > 0;

  let firstMessage = '';

  if (hasAnyErrors && errorEntries.length > 0) {
    const [, firstErrorObject] = errorEntries[0];

    if (
      firstErrorObject &&
      typeof firstErrorObject === 'object' &&
      'message' in firstErrorObject &&
      typeof firstErrorObject.message === 'string'
    ) {
      firstMessage = firstErrorObject.message;
    }
  }

  return {
    fieldNames,
    totalCount,
    hasAnyErrors,
    firstMessage,
  };
};

const logErrorSummary = (errorSummary: ErrorSummary): void => {
  const { hasAnyErrors, totalCount, fieldNames, firstMessage } = errorSummary;

  logDebugInfo(0, '에러 상태 변화 감지', {
    hasErrors: hasAnyErrors,
    errorCount: totalCount,
    errorFieldNames: fieldNames,
    firstErrorMessage: firstMessage || 'none',
  });
};

const logFirstErrorMessage = (errorSummary: ErrorSummary): void => {
  const { hasAnyErrors, firstMessage } = errorSummary;

  if (hasAnyErrors && firstMessage) {
    logDebugInfo(0, '첫 번째 에러 발견', {
      firstErrorMessage: firstMessage,
    });
  }
};

const processErrorStateUpdate = (
  errorCollection: FieldErrors<FormSchemaValues>,
  onErrorChange: (hasErrors: boolean, errorCount: number) => void
): void => {
  const errorSummary = createErrorSummary(errorCollection);

  logErrorSummary(errorSummary);

  onErrorChange(errorSummary.hasAnyErrors, errorSummary.totalCount);
};

const processErrorLogging = (
  errorCollection: FieldErrors<FormSchemaValues>
): void => {
  const errorSummary = createErrorSummary(errorCollection);

  logFirstErrorMessage(errorSummary);
};

function ValidationErrorHandler({
  errors,
  onErrorChange,
  children,
}: ValidationErrorHandlerProps): React.ReactElement {
  React.useEffect(() => {
    processErrorStateUpdate(errors, onErrorChange);
  }, [errors, onErrorChange]);

  React.useEffect(() => {
    processErrorLogging(errors);
  }, [errors]);

  return <>{children}</>;
}

export default ValidationErrorHandler;
