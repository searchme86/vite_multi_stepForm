// blogMediaStep/imageUpload/parts/FileSelectButton.tsx

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { generateAcceptString } from '../../utils/fileFormatUtils';

export interface FileSelectButtonRef {
  clickFileInput: () => void;
}

interface FileSelectButtonProps {
  onFileChange: (files: FileList) => void;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const FileSelectButton = forwardRef<FileSelectButtonRef, FileSelectButtonProps>(
  (
    { onFileChange, multiple = true, disabled = false, className = '' },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      clickFileInput: () => {
        fileInputRef.current?.click();
      },
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileChange(e.target.files);
      }
    };

    return (
      <input
        type="file"
        ref={fileInputRef}
        className={`hidden ${className}`}
        accept={generateAcceptString()}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        aria-label="파일 입력"
      />
    );
  }
);

FileSelectButton.displayName = 'FileSelectButton';

export default FileSelectButton;
