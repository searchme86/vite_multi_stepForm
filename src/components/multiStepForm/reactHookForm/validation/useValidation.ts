// src/components/multiStepForm/reactHookForm/validation/useValidation.ts

import { useCallback } from 'react';
import type { UseFormTrigger, FieldErrors } from 'react-hook-form';
import type { FormSchemaValues } from '../../types/formTypes';
import type { StepNumber } from '../../types/stepTypes';
import type { EditorState } from '../../types/editorTypes';
import { getStepValidationFields } from '../../types/stepTypes';
import {
  createValidationLogger,
  logEditorValidation,
} from '../utils/consoleLoggingUtils';
import {
  filterValidFormFields,
  filterDefinedStrings,
  isValidFormSchemaKey,
} from '../utils/validationHelpers';

interface ToastNotificationOptions {
  readonly title: string;
  readonly description: string;
  readonly color: 'success' | 'warning' | 'danger' | 'primary' | 'default';
}

interface UseValidationProps {
  readonly trigger: UseFormTrigger<FormSchemaValues>;
  readonly errors: FieldErrors<FormSchemaValues>;
  readonly editorState: EditorState;
  readonly addToast: (options: ToastNotificationOptions) => void;
}

interface StepValidationContext {
  readonly stepNumber: number;
  readonly originalFields: readonly string[];
  readonly validFields: readonly string[];
  readonly typeSafeFields: readonly (keyof FormSchemaValues)[];
  readonly needsEditorValidation: boolean;
}

interface EditorValidationContext {
  readonly isCompleted: boolean;
  readonly contentText: string;
  readonly contentLength: number;
  readonly isValidContent: boolean;
}

interface ValidationErrorContext {
  readonly hasErrors: boolean;
  readonly errorMessages: readonly string[];
  readonly primaryError: string;
}

const safeParseStepNumber = (step: StepNumber): number => {
  const stepString = String(step);
  const parsedStep = parseInt(stepString, 10);
  return isNaN(parsedStep) ? 1 : parsedStep;
};

const buildValidationContext = (
  stepNumber: StepNumber
): StepValidationContext => {
  const safeStepNumber = safeParseStepNumber(stepNumber);
  const originalFields = getStepValidationFields(stepNumber);
  const validFields = filterValidFormFields(originalFields);

  const typeSafeFields = validFields.filter(
    (fieldName): fieldName is keyof FormSchemaValues => {
      return isValidFormSchemaKey(fieldName);
    }
  );

  const needsEditorValidation = originalFields.some(
    (field) => field === 'editorCompleted' || field === 'editor'
  );

  return {
    stepNumber: safeStepNumber,
    originalFields,
    validFields,
    typeSafeFields,
    needsEditorValidation,
  };
};

const buildEditorContext = (
  editorState: EditorState
): EditorValidationContext => {
  const { isCompleted = false, completedContent = '' } = editorState;
  const contentText = String(completedContent);
  const trimmedContent = contentText.trim();
  const contentLength = trimmedContent.length;
  const isValidContent = isCompleted && contentLength > 0;

  return {
    isCompleted,
    contentText: trimmedContent,
    contentLength,
    isValidContent,
  };
};

const validateEditorContent = (
  context: EditorValidationContext,
  logger: ReturnType<typeof createValidationLogger>
): boolean => {
  const { isCompleted, contentLength, isValidContent } = context;

  logEditorValidation(isCompleted, contentLength);

  if (!isValidContent) {
    const errorMessage = '모듈화된 에디터에서 글 작성을 완료해주세요.';
    logger.logFailure([errorMessage]);
    return false;
  }

  logger.logSuccess(1);
  return true;
};

const extractErrorContext = (
  errors: FieldErrors<FormSchemaValues>,
  targetFields: readonly (keyof FormSchemaValues)[]
): ValidationErrorContext => {
  const errorEntries = Object.entries(errors);
  const relevantErrors = errorEntries.filter(([key]) => {
    return (
      isValidFormSchemaKey(key) && targetFields.some((field) => field === key)
    );
  });

  const extractedMessages: string[] = [];

  relevantErrors.forEach(([, errorObj]) => {
    if (errorObj && typeof errorObj === 'object' && 'message' in errorObj) {
      const messageValue = errorObj.message;
      if (typeof messageValue === 'string' && messageValue.trim().length > 0) {
        extractedMessages.push(messageValue.trim());
      }
    }
  });

  const cleanMessages = filterDefinedStrings(extractedMessages);
  const hasErrors = cleanMessages.length > 0;
  const primaryError = hasErrors ? cleanMessages[0] : '';

  return {
    hasErrors,
    errorMessages: cleanMessages,
    primaryError,
  };
};

const executeFormValidation = async (
  context: StepValidationContext,
  trigger: UseFormTrigger<FormSchemaValues>,
  errors: FieldErrors<FormSchemaValues>,
  logger: ReturnType<typeof createValidationLogger>
): Promise<boolean> => {
  const { typeSafeFields } = context;

  if (typeSafeFields.length === 0) {
    logger.logSuccess(0);
    return true;
  }

  const validationResult = await trigger(typeSafeFields);

  if (!validationResult) {
    const errorContext = extractErrorContext(errors, typeSafeFields);
    logger.logFailure(errorContext.errorMessages);
    return false;
  }

  logger.logSuccess(typeSafeFields.length);
  return true;
};

const showValidationError = (
  errorContext: ValidationErrorContext,
  addToast: (options: ToastNotificationOptions) => void
): void => {
  const { hasErrors, primaryError } = errorContext;

  if (!hasErrors || !primaryError) {
    return;
  }

  addToast({
    title: '유효성 검사 실패',
    description: primaryError,
    color: 'danger',
  });
};

const showEditorError = (
  addToast: (options: ToastNotificationOptions) => void
): void => {
  addToast({
    title: '에디터 작성 미완료',
    description: '모듈화된 에디터에서 글 작성을 완료해주세요.',
    color: 'warning',
  });
};

export const useValidation = ({
  trigger,
  errors,
  editorState,
  addToast,
}: UseValidationProps) => {
  const validateCurrentStep = useCallback(
    async (currentStep: StepNumber): Promise<boolean> => {
      const validationContext = buildValidationContext(currentStep);
      const logger = createValidationLogger(validationContext.stepNumber);

      logger.logStart();

      // 에디터 검증이 필요한 경우
      if (validationContext.needsEditorValidation) {
        const editorContext = buildEditorContext(editorState);
        const isEditorValid = validateEditorContent(editorContext, logger);

        if (!isEditorValid) {
          showEditorError(addToast);
          return false;
        }

        return true;
      }

      // 일반 폼 필드 검증
      const isFormValid = await executeFormValidation(
        validationContext,
        trigger,
        errors,
        logger
      );

      if (!isFormValid) {
        const errorContext = extractErrorContext(
          errors,
          validationContext.typeSafeFields
        );
        showValidationError(errorContext, addToast);
        return false;
      }

      return true;
    },
    [trigger, errors, editorState, addToast]
  );

  return { validateCurrentStep };
};
