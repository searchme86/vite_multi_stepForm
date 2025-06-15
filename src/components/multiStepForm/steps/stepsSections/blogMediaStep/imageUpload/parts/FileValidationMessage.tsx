// blogMediaStep/imageUpload/parts/FileValidationMessage.tsx

import React from 'react';
import { Button, Icon } from '@heroui/react';
import { type FileValidationResult } from '../../utils/fileValidationUtils';

interface FileValidationMessageProps {
  validationResults: Record<string, FileValidationResult>;
  showSuccessMessages?: boolean;
  maxMessages?: number;
  onDismiss?: (fileName: string) => void;
  className?: string;
}

function FileValidationMessage({
  validationResults,
  showSuccessMessages = false,
  maxMessages = 5,
  onDismiss,
  className = '',
}: FileValidationMessageProps): React.ReactNode {
  const errorMessages = Object.entries(validationResults)
    .filter(([, result]) => !result.isValid)
    .slice(0, maxMessages);

  const successMessages = showSuccessMessages
    ? Object.entries(validationResults)
        .filter(([, result]) => result.isValid)
        .slice(0, maxMessages)
    : [];

  if (errorMessages.length === 0 && successMessages.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {errorMessages.map(([fileName, result]) => (
        <div
          key={fileName}
          className="flex items-center justify-between p-3 border rounded-lg bg-danger-50 border-danger-200"
        >
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:alert-circle"
              className="flex-shrink-0 text-danger"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-danger">{fileName}</p>
              <p className="text-xs text-danger-600">{result.errorMessage}</p>
            </div>
          </div>
          {onDismiss && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => onDismiss(fileName)}
              type="button"
            >
              <Icon icon="lucide:x" className="text-sm" />
            </Button>
          )}
        </div>
      ))}

      {successMessages.map(([fileName, result]) => (
        <div
          key={fileName}
          className="flex items-center justify-between p-3 border rounded-lg bg-success-50 border-success-200"
        >
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:check-circle"
              className="flex-shrink-0 text-success"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-success">{fileName}</p>
              <p className="text-xs text-success-600">업로드 준비 완료</p>
            </div>
          </div>
          {onDismiss && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="success"
              onPress={() => onDismiss(fileName)}
              type="button"
            >
              <Icon icon="lucide:x" className="text-sm" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default FileValidationMessage;
