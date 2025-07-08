// blogMediaStep/imageUpload/ImageUploadContainer.tsx

import React from 'react';
import { Progress } from '@heroui/react';
import { useImageUploadHandlers } from './hooks/useImageUploadHandlers';
import FileDropZone from './parts/FileDropZone';
import FileSelectButton from './parts/FileSelectButton';
import UploadedImageSection from './parts/UploadedImageSection';
import MobileTip from './parts/MobileTip';

function ImageUploadContainer(): React.ReactNode {
  console.log(
    '🚀 [CONTAINER] ImageUploadContainer 렌더링 시작 (극한분리완료):',
    {
      timestamp: new Date().toLocaleTimeString(),
    }
  );

  const {
    uploading,
    uploadStatus,
    hasActiveUploads,
    deleteConfirmState,
    duplicateMessageState,
    touchActiveImages,
    fileSelectButtonRef,
    handleFilesDropped,
    handleFileSelectClick,
    handleFileChange,
    handleDeleteButtonClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleImageTouch,
    currentMediaFilesList,
    currentSelectedFileNames,
    isMobileDevice,
  } = useImageUploadHandlers();

  console.log('📊 [RENDER] 렌더링 최종 상태 (극한분리완료):', {
    hasActiveUploads,
    uploadingKeysCount: Object.keys(uploading).length,
    uploadStatusKeysCount: Object.keys(uploadStatus).length,
    deleteConfirmVisible: deleteConfirmState.isVisible,
    touchActiveImagesCount: touchActiveImages.size,
    duplicateMessageVisible: duplicateMessageState.isVisible,
    currentMediaFilesCount: currentMediaFilesList.length,
    isMobileDevice,
    timestamp: new Date().toLocaleTimeString(),
  });

  return (
    <div
      className="space-y-4"
      role="region"
      aria-labelledby="image-upload-section"
      aria-describedby="image-upload-description"
    >
      <h2 id="image-upload-section" className="sr-only">
        이미지 업로드 섹션
      </h2>
      <p id="image-upload-description" className="sr-only">
        드래그 앤 드롭 또는 파일 선택 버튼을 통해 이미지를 업로드할 수 있습니다.
      </p>

      <FileDropZone
        dragActive={false}
        setDragActive={() => {
          console.log('🔧 setDragActive 호출됨 (극한분리완료)');
        }}
        onFilesDropped={handleFilesDropped}
        onFileSelectClick={handleFileSelectClick}
        isUploading={hasActiveUploads}
        className="transition-all duration-200"
      />

      <FileSelectButton
        ref={fileSelectButtonRef}
        onFileChange={handleFileChange}
        multiple={true}
        disabled={hasActiveUploads}
      />

      {hasActiveUploads && (
        <div
          role="status"
          aria-labelledby="upload-progress-heading"
          aria-live="polite"
          className="space-y-2"
        >
          <h3 id="upload-progress-heading" className="text-sm font-medium">
            업로드 중...
          </h3>

          {Object.entries(uploading).map(([fileId, progress]) => {
            console.log(
              '🔄 [PROGRESS_ITEM] 진행률 아이템 렌더링 (극한분리완료):',
              {
                fileId,
                progress,
                timestamp: new Date().toLocaleTimeString(),
              }
            );

            return (
              <div key={fileId} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>파일 업로드 중</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress
                  value={progress}
                  color="primary"
                  size="sm"
                  aria-label={`파일 업로드 진행률 ${progress}%`}
                  classNames={{
                    base: 'w-full',
                    track: 'bg-default-200',
                    indicator: 'transition-all duration-300',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <UploadedImageSection
        mediaFiles={currentMediaFilesList}
        selectedFileNames={currentSelectedFileNames}
        deleteConfirmState={deleteConfirmState}
        duplicateMessageState={duplicateMessageState}
        touchActiveImages={touchActiveImages}
        isMobileDevice={isMobileDevice}
        onDeleteButtonClick={handleDeleteButtonClick}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={handleDeleteCancel}
        onImageTouch={handleImageTouch}
      />

      <MobileTip isMobileDevice={isMobileDevice} />
    </div>
  );
}

export default ImageUploadContainer;
