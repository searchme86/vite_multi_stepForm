// blogMediaStep/imageUpload/parts/DuplicateMessage.tsx

import React from 'react';
import { Icon } from '@iconify/react';
import { type DuplicateMessageState } from '../types/imageUploadTypes';

interface DuplicateMessageProps {
  duplicateMessageState: DuplicateMessageState;
}

function DuplicateMessage({
  duplicateMessageState,
}: DuplicateMessageProps): React.ReactNode {
  console.log('🎨 [DUPLICATE_MESSAGE] DuplicateMessage 렌더링:', {
    isVisible: duplicateMessageState.isVisible,
    message: duplicateMessageState.message,
    animationKey: duplicateMessageState.animationKey,
    fileNamesCount: duplicateMessageState.fileNames.length,
    timestamp: new Date().toLocaleTimeString(),
  });

  const hasMessage = duplicateMessageState.message.length > 0;

  if (!hasMessage) {
    return null;
  }

  const containerClassName = `absolute transition-all duration-700 ease-out ${
    duplicateMessageState.isVisible
      ? 'right-0 opacity-100'
      : '-right-96 opacity-0'
  }`;

  return (
    <div className="relative flex items-center justify-end h-8 overflow-hidden w-96">
      <div
        key={`duplicate-message-${duplicateMessageState.animationKey}`}
        className={containerClassName}
      >
        <p
          className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-100 border border-orange-200 rounded-lg shadow-md whitespace-nowrap"
          role="alert"
          aria-live="polite"
          title={duplicateMessageState.fileNames.join(', ')}
        >
          <Icon
            icon="lucide:alert-triangle"
            className="inline w-4 h-4 mr-2"
            aria-hidden="true"
          />
          {duplicateMessageState.message}
        </p>
      </div>
    </div>
  );
}

export default DuplicateMessage;
