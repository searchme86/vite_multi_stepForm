// src/components/multiStepForm/reactHookForm/validation/EditorContentValidator.tsx

import React from 'react';
import type { EditorState } from '../../types/editorTypes';
import {
  logEditorValidation,
  logDebugInfo,
} from '../utils/consoleLoggingUtils.ts';

interface EditorContentValidatorProps {
  readonly editorState: EditorState;
  readonly minContentLength?: number;
  readonly onValidationResult: (isValid: boolean, message?: string) => void;
  readonly children: React.ReactNode;
}

interface ContentValidationResult {
  readonly isValid: boolean;
  readonly errorMessage: string | null;
  readonly contentLength: number;
  readonly containerCount: number;
  readonly paragraphCount: number;
}

interface ContentLengthAnalysis {
  readonly hasMinimumLength: boolean;
  readonly actualLength: number;
  readonly requiredLength: number;
}

interface ContainerAnalysis {
  readonly hasContainers: boolean;
  readonly containerCount: number;
  readonly hasParagraphs: boolean;
  readonly paragraphCount: number;
}

const analyzeContentLength = (
  content: string,
  minimumLength: number
): ContentLengthAnalysis => {
  const safeContent = content ?? '';
  const trimmedContent = safeContent.trim();
  const actualLength = trimmedContent.length;
  const hasMinimumLength = actualLength >= minimumLength;

  return {
    hasMinimumLength,
    actualLength,
    requiredLength: minimumLength,
  };
};

const analyzeContainerStructure = (
  editorState: EditorState
): ContainerAnalysis => {
  const { containers, paragraphs } = editorState;
  const safeContainers = containers ?? [];
  const safeParagraphs = paragraphs ?? [];

  const containerCount = safeContainers.length;
  const paragraphCount = safeParagraphs.length;
  const hasContainers = containerCount > 0;
  const hasParagraphs = paragraphCount > 0;

  return {
    hasContainers,
    containerCount,
    hasParagraphs,
    paragraphCount,
  };
};

const validateEditorContent = (
  editorState: EditorState,
  minimumContentLength: number
): ContentValidationResult => {
  const { completedContent } = editorState;
  const safeContent = completedContent ?? '';

  const lengthAnalysis = analyzeContentLength(
    safeContent,
    minimumContentLength
  );
  const containerAnalysis = analyzeContainerStructure(editorState);

  const { hasMinimumLength, actualLength, requiredLength } = lengthAnalysis;
  const { hasContainers, containerCount, paragraphCount } = containerAnalysis;

  logEditorValidation(editorState.isCompleted, actualLength);

  if (!hasMinimumLength) {
    return {
      isValid: false,
      errorMessage: `에디터 내용은 최소 ${requiredLength}자 이상이어야 합니다.`,
      contentLength: actualLength,
      containerCount,
      paragraphCount,
    };
  }

  if (!hasContainers) {
    return {
      isValid: false,
      errorMessage: '에디터에서 최소 하나의 블록을 작성해주세요.',
      contentLength: actualLength,
      containerCount,
      paragraphCount,
    };
  }

  return {
    isValid: true,
    errorMessage: null,
    contentLength: actualLength,
    containerCount,
    paragraphCount,
  };
};

const executeContentValidation = (
  editorState: EditorState,
  minimumContentLength: number,
  onValidationResult: (isValid: boolean, message?: string) => void
): void => {
  const validationResult = validateEditorContent(
    editorState,
    minimumContentLength
  );
  const {
    isValid,
    errorMessage,
    contentLength,
    containerCount,
    paragraphCount,
  } = validationResult;

  logDebugInfo(0, '에디터 내용 검증 완료', {
    isValid,
    contentLength,
    containerCount,
    paragraphCount,
    minimumRequired: minimumContentLength,
  });

  const resultMessage = errorMessage ?? undefined;
  onValidationResult(isValid, resultMessage);
};

function EditorContentValidator({
  editorState,
  minContentLength = 10,
  onValidationResult,
  children,
}: EditorContentValidatorProps): React.ReactElement {
  const safeMinLength = minContentLength > 0 ? minContentLength : 10;

  React.useEffect(() => {
    executeContentValidation(editorState, safeMinLength, onValidationResult);
  }, [
    editorState.completedContent,
    editorState.containers,
    editorState.paragraphs,
    safeMinLength,
    onValidationResult,
  ]);

  return <>{children}</>;
}

export default EditorContentValidator;
