// blogMediaStep/imageUpload/parts/FileValidationMessage.tsx

import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { type FileValidationResult } from '../utils/fileValidationUtils';

interface FileValidationMessageProps {
  validationResults: Record<string, FileValidationResult>;
  showSuccessMessages?: boolean;
  maxMessages?: number;
  onDismiss?: (fileName: string) => void;
  className?: string;
}

function FileValidationMessage({
  validationResults: fileValidationResults,
  showSuccessMessages: shouldShowSuccessMessages = false,
  maxMessages: maximumMessagesToShow = 5,
  onDismiss: handleMessageDismiss,
  className: additionalClassName = '',
}: FileValidationMessageProps): React.ReactNode {
  const errorValidationEntries = Object.entries(fileValidationResults)
    .filter(([, validationResult]) => !validationResult.isValid)
    .slice(0, maximumMessagesToShow);

  const successValidationEntries = shouldShowSuccessMessages
    ? Object.entries(fileValidationResults)
        .filter(([, validationResult]) => validationResult.isValid)
        .slice(0, maximumMessagesToShow)
    : [];

  if (
    errorValidationEntries.length === 0 &&
    successValidationEntries.length === 0
  ) {
    return null;
  }

  return (
    <div
      className={`space-y-2 ${additionalClassName}`}
      role="alert"
      aria-live="polite"
      aria-label="파일 검증 결과"
    >
      {errorValidationEntries.map(([validatedFileName, validationResult]) => {
        const { errorMessage: validationErrorMessage } = validationResult;

        return (
          <div
            key={validatedFileName}
            className="flex items-center justify-between p-3 border rounded-lg bg-danger-50 border-danger-200"
            role="alert"
            aria-labelledby={`error-${validatedFileName}`}
            aria-describedby={`error-desc-${validatedFileName}`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:alert-circle"
                className="flex-shrink-0 text-danger"
                width={16}
                height={16}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p
                  id={`error-${validatedFileName}`}
                  className="text-sm font-medium text-danger"
                >
                  {validatedFileName}
                </p>
                <p
                  id={`error-desc-${validatedFileName}`}
                  className="text-xs text-danger-600"
                >
                  {validationErrorMessage}
                </p>
              </div>
            </div>
            {handleMessageDismiss && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => handleMessageDismiss(validatedFileName)}
                type="button"
                aria-label={`${validatedFileName} 오류 메시지 닫기`}
              >
                <Icon
                  icon="lucide:x"
                  className="text-sm"
                  width={14}
                  height={14}
                />
              </Button>
            )}
          </div>
        );
      })}

      {successValidationEntries.map(([validatedFileName]) => (
        <div
          key={validatedFileName}
          className="flex items-center justify-between p-3 border rounded-lg bg-success-50 border-success-200"
          role="status"
          aria-labelledby={`success-${validatedFileName}`}
          aria-describedby={`success-desc-${validatedFileName}`}
        >
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:check-circle"
              className="flex-shrink-0 text-success"
              width={16}
              height={16}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p
                id={`success-${validatedFileName}`}
                className="text-sm font-medium text-success"
              >
                {validatedFileName}
              </p>
              <p
                id={`success-desc-${validatedFileName}`}
                className="text-xs text-success-600"
              >
                업로드 준비 완료
              </p>
            </div>
          </div>
          {handleMessageDismiss && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="success"
              onPress={() => handleMessageDismiss(validatedFileName)}
              type="button"
              aria-label={`${validatedFileName} 성공 메시지 닫기`}
            >
              <Icon
                icon="lucide:x"
                className="text-sm"
                width={14}
                height={14}
              />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export default FileValidationMessage;
