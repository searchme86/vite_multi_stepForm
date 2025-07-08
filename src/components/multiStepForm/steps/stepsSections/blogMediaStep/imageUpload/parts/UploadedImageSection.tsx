// blogMediaStep/imageUpload/parts/UploadedImageSection.tsx

import React from 'react';
import {
  type DeleteConfirmState,
  type DuplicateMessageState,
} from '../types/imageUploadTypes';
import ImageList from './ImageList';
import DuplicateMessage from './DuplicateMessage';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import UploadSummary from './UploadSummary';

interface UploadedImageSectionProps {
  mediaFiles: string[];
  selectedFileNames: string[];
  deleteConfirmState: DeleteConfirmState;
  duplicateMessageState: DuplicateMessageState;
  touchActiveImages: Set<number>;
  isMobileDevice: boolean;
  onDeleteButtonClick: (imageIndex: number, imageDisplayName: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onImageTouch: (imageIndex: number) => void;
}

function UploadedImageSection({
  mediaFiles,
  selectedFileNames,
  deleteConfirmState,
  duplicateMessageState,
  touchActiveImages,
  isMobileDevice,
  onDeleteButtonClick,
  onDeleteConfirm,
  onDeleteCancel,
  onImageTouch,
}: UploadedImageSectionProps): React.ReactNode {
  console.log('🖼️ [UPLOADED_SECTION] UploadedImageSection 렌더링:', {
    mediaFilesCount: mediaFiles.length,
    selectedFileNamesCount: selectedFileNames.length,
    deleteConfirmVisible: deleteConfirmState.isVisible,
    duplicateMessageVisible: duplicateMessageState.isVisible,
    touchActiveImagesCount: touchActiveImages.size,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  const hasUploadedImages = mediaFiles.length > 0;

  if (!hasUploadedImages) {
    console.log('⚠️ [UPLOADED_SECTION] 업로드된 이미지가 없음');
    return null;
  }

  const footerMinHeight = deleteConfirmState.isVisible ? '120px' : '60px';

  return (
    <section
      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
      role="region"
      aria-labelledby="uploaded-images-heading"
    >
      <header className="flex items-center justify-between mb-4">
        <h3
          id="uploaded-images-heading"
          className="text-lg font-semibold text-gray-800"
        >
          업로드된 이미지들 ({mediaFiles.length}개)
        </h3>

        <DuplicateMessage duplicateMessageState={duplicateMessageState} />
      </header>

      <ImageList
        mediaFiles={mediaFiles}
        selectedFileNames={selectedFileNames}
        touchActiveImages={touchActiveImages}
        isMobileDevice={isMobileDevice}
        onImageTouch={onImageTouch}
        onDeleteButtonClick={onDeleteButtonClick}
      />

      <footer
        className="relative p-3 mt-4 overflow-hidden border border-blue-200 rounded-lg bg-blue-50"
        style={{ minHeight: footerMinHeight }}
      >
        <UploadSummary
          mediaFiles={mediaFiles}
          deleteConfirmState={deleteConfirmState}
          isMobileDevice={isMobileDevice}
        />

        <DeleteConfirmDialog
          deleteConfirmState={deleteConfirmState}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      </footer>
    </section>
  );
}

export default UploadedImageSection;
