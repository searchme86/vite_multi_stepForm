// src/components/multiStepForm/reactHookForm/validation/EditorCompletionValidator.tsx

import React from 'react';
import type { EditorState } from '../../types/editorTypes';
import { logEditorValidation } from '../utils/consoleLoggingUtils';

interface EditorCompletionValidatorProps {
  readonly editorState: EditorState;
  readonly onValidationResult: (isValid: boolean) => void;
  readonly onShowToast: (message: string) => void;
  readonly children: React.ReactNode;
}

interface EditorValidationAnalysis {
  readonly isCompleted: boolean;
  readonly contentLength: number;
  readonly isValid: boolean;
  readonly errorMessage: string | null;
}

const analyzeEditorValidation = (
  editorState: EditorState
): EditorValidationAnalysis => {
  const { completedContent, isCompleted } = editorState;
  const safeContent = completedContent ?? '';
  const trimmedContent = safeContent.trim();
  const contentLength = trimmedContent.length;
  const hasContent = contentLength > 0;

  let isValid = false;
  let errorMessage: string | null = null;

  if (!isCompleted) {
    errorMessage = '에디터 작성이 완료되지 않았습니다.';
  } else if (!hasContent) {
    errorMessage = '에디터에서 글 작성을 완료해주세요.';
  } else {
    isValid = true;
  }

  return {
    isCompleted,
    contentLength,
    isValid,
    errorMessage,
  };
};

const executeEditorValidation = (
  editorState: EditorState,
  onValidationResult: (isValid: boolean) => void,
  onShowToast: (message: string) => void
): void => {
  const validationAnalysis = analyzeEditorValidation(editorState);
  const { isCompleted, contentLength, isValid, errorMessage } =
    validationAnalysis;

  logEditorValidation(isCompleted, contentLength);

  if (!isValid && errorMessage) {
    onValidationResult(false);
    onShowToast(errorMessage);
    return;
  }

  onValidationResult(true);
};

function EditorCompletionValidator({
  editorState,
  onValidationResult,
  onShowToast,
  children,
}: EditorCompletionValidatorProps): React.ReactElement {
  React.useEffect(() => {
    executeEditorValidation(editorState, onValidationResult, onShowToast);
  }, [
    editorState.isCompleted,
    editorState.completedContent,
    onValidationResult,
    onShowToast,
  ]);

  return <>{children}</>;
}

export default EditorCompletionValidator;
