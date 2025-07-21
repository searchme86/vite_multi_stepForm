// src/components/multiStepForm/reactHookForm/validation/validationActions.ts

import type { StepNumber } from '../../types/stepTypes';
import { getFieldsToValidate } from '../utils/validationUtils';
import { createValidationLogger } from '../utils/consoleLoggingUtils';
import {
  filterDefinedStrings,
  isValidFormSchemaKey,
} from '../utils/validationHelpers';

interface ValidationTriggerResult {
  readonly isValid: boolean;
  readonly fieldsValidated: number;
}

interface ErrorExtractionResult {
  readonly errorMessages: readonly string[];
  readonly errorCount: number;
  readonly hasErrors: boolean;
}

interface ToastDisplayOptions {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'danger' | 'primary' | 'default';
}

interface ValidationToastResult {
  readonly shouldShowToast: boolean;
  readonly toastOptions: ToastDisplayOptions | null;
}

const executeValidationTrigger = async (
  stepNumber: StepNumber,
  triggerFunction: (fields?: string[]) => Promise<boolean>
): Promise<ValidationTriggerResult> => {
  const logger = createValidationLogger(parseInt(String(stepNumber), 10));

  const fieldsToValidate = getFieldsToValidate(stepNumber);
  const fieldsCount = fieldsToValidate.length;

  if (fieldsCount === 0) {
    logger.logSuccess(0);
    return {
      isValid: true,
      fieldsValidated: 0,
    };
  }

  const validationResult = await triggerFunction(fieldsToValidate);

  validationResult
    ? logger.logSuccess(fieldsCount)
    : logger.logFailure(['검증 실패']);

  return {
    isValid: validationResult,
    fieldsValidated: fieldsCount,
  };
};

const extractValidationErrorMessages = (
  errorCollection: Record<string, unknown>,
  targetFieldNames: readonly string[]
): ErrorExtractionResult => {
  const errorEntries = Object.entries(errorCollection);

  const relevantErrorEntries = errorEntries.filter(([errorFieldKey]) => {
    return (
      isValidFormSchemaKey(errorFieldKey) &&
      targetFieldNames.some(
        (validFieldName) => validFieldName === errorFieldKey
      )
    );
  });

  const extractedMessages: string[] = [];

  for (const [, errorValue] of relevantErrorEntries) {
    const hasValidMessage =
      errorValue &&
      typeof errorValue === 'object' &&
      'message' in errorValue &&
      typeof errorValue.message === 'string';

    if (hasValidMessage) {
      const messageValue = Reflect.get(errorValue, 'message');
      const safeMessage = typeof messageValue === 'string' ? messageValue : '';
      if (safeMessage) {
        extractedMessages.push(safeMessage);
      }
    }
  }

  const cleanedErrorMessages = filterDefinedStrings(extractedMessages);

  return {
    errorMessages: cleanedErrorMessages,
    errorCount: cleanedErrorMessages.length,
    hasErrors: cleanedErrorMessages.length > 0,
  };
};

const prepareValidationToast = (
  isValidationSuccessful: boolean,
  errorExtractionResult: ErrorExtractionResult
): ValidationToastResult => {
  const { hasErrors, errorMessages } = errorExtractionResult;

  if (isValidationSuccessful || !hasErrors || errorMessages.length === 0) {
    return {
      shouldShowToast: false,
      toastOptions: null,
    };
  }

  const firstErrorMessage = errorMessages[0];
  const toastOptions: ToastDisplayOptions = {
    title: '유효성 검사 실패',
    description: firstErrorMessage,
    color: 'danger',
  };

  return {
    shouldShowToast: true,
    toastOptions,
  };
};

const displayValidationToast = (
  toastResult: ValidationToastResult,
  toastDisplayFunction: (options: ToastDisplayOptions) => void
): void => {
  const { shouldShowToast, toastOptions } = toastResult;

  if (shouldShowToast && toastOptions) {
    toastDisplayFunction(toastOptions);
  }
};

export const triggerStepValidation = async (
  stepNumber: StepNumber,
  triggerFunction: (fields?: string[]) => Promise<boolean>
): Promise<boolean> => {
  const validationResult = await executeValidationTrigger(
    stepNumber,
    triggerFunction
  );
  return validationResult.isValid;
};

export const extractValidationErrors = (
  errorCollection: Record<string, unknown>,
  fieldsToValidate: readonly string[]
): readonly string[] => {
  const extractionResult = extractValidationErrorMessages(
    errorCollection,
    fieldsToValidate
  );
  return extractionResult.errorMessages;
};

export const showValidationToast = (
  isValidationSuccessful: boolean,
  errorMessages: readonly string[],
  toastDisplayFunction: (options: ToastDisplayOptions) => void
): void => {
  const errorExtractionResult: ErrorExtractionResult = {
    errorMessages,
    errorCount: errorMessages.length,
    hasErrors: errorMessages.length > 0,
  };

  const toastResult = prepareValidationToast(
    isValidationSuccessful,
    errorExtractionResult
  );
  displayValidationToast(toastResult, toastDisplayFunction);
};
